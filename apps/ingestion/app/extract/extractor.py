"""Notification PDF -> job JSON (session 05).

PDF bytes -> plain text (pdfplumber) -> Groq JSON -> deterministic checks -> draft fields.
The PDF itself is never stored; only the text and the checked JSON are kept.
"""

import datetime as dt
import io
import json
import re
import time
from typing import Any
from urllib.parse import urlparse

import httpx
import pdfplumber

from app.config import settings

EXTRACTOR_VERSION = "groq-v2"  # v2: adds a clean display title
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MIN_TEXT_CHARS = 200  # less than this = scanned image PDF (no text layer)
MAX_PAGES = 60

CATEGORIES = {"GEN", "OBC", "SC", "ST", "EWS", "PWBD", "EXS"}
GENDERS = {"any", "male", "female", "transgender"}
LEVELS = {"10th", "12th", "iti", "diploma", "graduate", "post_graduate", "phd"}
DATE_KINDS = {
    "notification_date", "application_start", "application_end", "fee_last_date",
    "correction_window", "admit_card", "exam_date", "answer_key", "result",
    "interview", "counselling", "other",
}
STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "KA", "KL", "MP", "MH", "MN",
    "ML", "MZ", "NL", "OD", "PB", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB", "AN", "CH",
    "DH", "DL", "JK", "LA", "LD", "PY", "ALL",
}
# Sections tracked in field_status / confidence (top-level opportunity field names).
SECTIONS = (
    "notification_number", "summary", "vacancies_total", "posts", "eligibility", "fees",
    "dates", "selection_process", "required_documents", "apply_url", "state_codes",
)

PROMPT = """You extract facts from an Indian government recruitment / exam / scholarship /
admission notification. Reply with ONE JSON object and nothing else.

Rules:
- NEVER invent or guess. If the notification does not state something, use null (or []).
- Dates: "YYYY-MM-DD". Money: whole rupees as integers (100, not "Rs.100/-").
- Category codes only: GEN, OBC, SC, ST, EWS, PWBD, EXS ("UR"/"General" = GEN,
  "PwD"/"PH" = PWBD, "Ex-Servicemen" = EXS). Fee category may also be "ALL".
- gender: any | male | female | transgender.
- qualification_level: 10th | 12th | iti | diploma | graduate | post_graduate | phd.
- date kind: notification_date | application_start | application_end | fee_last_date |
  correction_window | admit_card | exam_date | answer_key | result | interview |
  counselling | other.
- state_codes: 2-letter Indian state codes where posts are located; ["ALL"] for all-India.
- official_text: copy the notification's own eligibility wording (max ~800 chars).
- title: a short clear title for job seekers (max 90 chars), in normal Title Case (not
  ALL CAPS). Say WHAT it is: the post/exam name, plus the place or unit when that tells
  which one it is. Leave out notice numbers, dates, the organisation's own name, and
  phrases like "Advertisement for", "Notification to the post of", "invites application",
  "General Recruitment". Use only words written in the notification; fix an obvious
  scanning typo only when the correct spelling also appears in the text.
  For an exam, keep the exam's own name and year ("Junior Engineer Examination, 2026").
  If the notice is NOT a new opening (answer key, result, interview schedule, date
  extension, corrigendum, amendment), start with what it is, then the post:
  "Answer Key Objections: Scientist/Engineer (SC)", "Last Date Extended: Medical Officer (SD)".
  e.g. "01/G/RB/2026 - GENERAL RECRUITMENT FOR THE POST OF ASSISTANT EXECUTIVE ENGINEER
  (CIVIL) IN TRANSPORT ROADS AND BUILDINGS DEPARTMENT" -> "Assistant Executive Engineer
  (Civil), Transport Roads and Buildings Department".

JSON shape:
{
  "title": str|null,
  "notification_number": str|null,
  "summary": str|null,            // 1-2 plain sentences: who is recruiting what
  "vacancies_total": int|null,
  "posts": [{"name": str, "vacancies_total": int|null,
             "vacancies_by_category": {"GEN": int, ...}|null,
             "pay_level": str|null, "salary_min": int|null, "salary_max": int|null,
             "salary_text": str|null}],
  "eligibility": {"age_min": int|null, "age_max": int|null, "age_as_on_date": str|null,
                  "age_relaxations": [{"category": str|null, "gender": str|null,
                                       "condition": str|null, "years": int}],
                  "qualification_level": str|null, "qualification_streams": [str],
                  "min_percentage": number|null, "final_year_allowed": bool|null,
                  "gender": str, "domicile_states": [str], "categories_allowed": [str],
                  "other_conditions": [str], "official_text": str|null} | null,
  "fees": [{"category": str, "gender": str, "amount": int}],
  "fee_text": str|null,
  "payment_modes": [str],
  "dates": [{"kind": str, "date": str, "end_date": str|null, "is_tentative": bool,
             "note": str|null}],
  "selection_process": [str],
  "required_documents": [{"name": str, "mandatory": bool, "spec": str|null}],
  "apply_url": str|null,
  "official_website": str|null,
  "state_codes": [str]
}"""


class ExtractionError(Exception):
    """Extraction could not run (scanned PDF, no API key, Groq error). The draft stays manual."""


def pdf_to_text(content: bytes) -> str:
    """Text of the PDF with page markers. Raises ExtractionError for scanned (image-only) PDFs."""
    parts: list[str] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for number, page in enumerate(pdf.pages[:MAX_PAGES], start=1):
            parts.append(f"--- page {number} ---\n{page.extract_text() or ''}")
    text = "\n".join(parts)
    if len(re.sub(r"--- page \d+ ---|\s", "", text)) < MIN_TEXT_CHARS:
        # ponytail: no OCR — Render's Python runtime has no Tesseract; add a Docker image if needed
        raise ExtractionError("Scanned PDF (no text layer) — fill the details by hand")
    return text


KEY_WORDS = re.compile(
    r"fee|age limit|age as on|vacanc|important date|last date|closing date|eligib|"
    r"qualification|selection|scheme of exam|how to apply|apply online|pay level|pay scale|"
    r"relaxation|documents",
    re.IGNORECASE,
)


LEAD_PAGES = 3  # notices put the dates/vacancy/fee tables up front (seen on SSC, UPSC)


def pick_pages(text: str, budget: int) -> str:
    """Fit a long notification into the budget: the first pages plus the pages that mention the
    most fees/age/vacancy/date/selection words, kept in page order. Short texts pass through."""
    if len(text) <= budget:
        return text
    pages = re.split(r"(?=--- page \d+ ---)", text)
    pages = [p for p in pages if p.strip()]
    lead = range(min(LEAD_PAGES, len(pages)))
    ranked = sorted(
        range(len(lead), len(pages)),
        key=lambda i: len(KEY_WORDS.findall(pages[i])),
        reverse=True,
    )
    chosen, used = set(lead), sum(len(pages[i]) for i in lead)
    for i in ranked:
        if used + len(pages[i]) <= budget:
            chosen.add(i)
            used += len(pages[i])
    return "".join(pages[i] for i in sorted(chosen))[:budget]


def call_groq(
    text: str, title: str, *, system: str = PROMPT, budget: int | None = None
) -> tuple[dict[str, Any], bool]:
    """Ask Groq for the JSON. Returns (raw_json, truncated)."""
    if not settings.groq_api_key:
        raise ExtractionError("GROQ_API_KEY is not set on the ingestion service")
    # Cost/limit guard: one capped request per document (Groq free tier: 8k tokens/minute).
    budget = budget or settings.extract_max_chars
    truncated = len(text) > budget
    body: dict[str, Any] = {
        "model": settings.groq_model,
        "temperature": 0,
        "max_completion_tokens": 3000,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": f"Title on the website: {title}\n\n{pick_pages(text, budget)}",
            },
        ],
    }
    if settings.groq_model.startswith("openai/gpt-oss"):
        body["reasoning_effort"] = "low"
    for attempt in range(2):
        try:
            response = httpx.post(
                GROQ_URL,
                json=body,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                timeout=90.0,
            )
        except httpx.HTTPError as exc:
            raise ExtractionError(f"Groq unreachable: {exc}") from exc
        # Free tier: tokens-per-minute cap. Wait once (max 60 s), else give up -> Re-extract later.
        hint = re.search(r"try again in ([\d.]+)s", response.text)
        wait = _int(response.headers.get("retry-after") or (hint and hint.group(1)) or 30, 0, 60)
        if response.status_code == 429 and attempt == 0 and wait is not None:
            time.sleep(wait + 1)
            continue
        break
    if response.status_code != 200:
        raise ExtractionError(f"Groq error {response.status_code}: {response.text[:200]}")
    try:
        content = response.json()["choices"][0]["message"]["content"]
        return json.loads(content), truncated
    except (KeyError, IndexError, ValueError) as exc:
        raise ExtractionError("Groq returned something that is not JSON") from exc


# ---------- deterministic checks (no AI below this line) ----------


def _int(value: Any, lo: int = 0, hi: int = 10_000_000) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, str):
        value = re.sub(r"[,\s₹]|Rs\.?", "", value)
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        return None
    return number if lo <= number <= hi else None


def _date(value: Any) -> dt.date | None:
    try:
        return dt.date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _str(value: Any, limit: int = 2000) -> str | None:
    return value.strip()[:limit] if isinstance(value, str) and value.strip() else None


def _strs(value: Any, limit: int = 300) -> list[str]:
    if not isinstance(value, list):
        return []
    return [s for s in (_str(v, limit) for v in value) if s]


def _url(value: Any) -> str | None:
    s = _str(value, 500)
    return s if s and re.match(r"https?://[^\s]+$", s) else None


def _date_forms(d: dt.date) -> list[str]:
    """The ways a date is usually printed in Indian notifications."""
    month = d.strftime("%B").lower()
    forms = []
    for day in (f"{d.day:02d}", str(d.day)):
        for mm in (f"{d.month:02d}", str(d.month)):
            forms += [f"{day}{sep}{mm}{sep}{d.year}" for sep in "./-"]
        forms += [f"{day} {month} {d.year}", f"{day} {month[:3]} {d.year}",
                  f"{month} {day}, {d.year}", f"{day}-{month[:3]}-{d.year}"]
    return forms


def _in_text(norm_text: str, value: int | dt.date) -> bool:
    """Evidence check: does this number/date literally appear in the notification text?"""
    if isinstance(value, dt.date):
        return any(form in norm_text for form in _date_forms(value))
    return re.search(rf"(?<![\d.]){value}(?![\d])", norm_text) is not None


# Words a clean title may use even when the notice phrases it differently.
TITLE_FREE_WORDS = {"and", "for", "the", "of", "in", "at", "to", "post", "posts", "recruitment",
                    "exam", "examination", "notice", "vacancy", "vacancies", "department",
                    # update-notice prefixes ("Last Date Extended: ...")
                    "answer", "key", "objections", "result", "results", "interview", "schedule",
                    "last", "date", "extended", "corrigendum", "amendment"}


def clean_title(value: Any, text: str, website_title: str) -> str | None:
    """The AI's display title, only if it is short and every word in it is in the notice.

    A word the notice never uses means the AI invented or "improved" it: drop the title then,
    and the draft keeps the website's own title for the reviewer to tidy.
    """
    title = _str(value, 200)
    if title:
        # Non-breaking/figure hyphens (‑ ‒) look right but break search: use a plain hyphen.
        title = re.sub(r"[‐‑‒]", "-", title)
    if not title or len(title) > 110 or title.isupper():
        return None
    source = re.sub(r"[^a-z0-9]+", " ", f"{text} {website_title}".lower())
    words = set(source.split())
    for word in re.findall(r"[a-z0-9]+", title.lower()):
        if word not in words and word not in TITLE_FREE_WORDS:
            return None
    return title


def normalize(
    raw: dict[str, Any], text: str, *, truncated: bool, website_title: str = ""
) -> dict[str, Any]:
    """Validate the AI output against the job format and score each section.

    Invalid values are dropped (never "fixed" by guessing). Each section's confidence is the
    share of its numbers/dates that literally appear in the PDF text.
    """
    norm_text = re.sub(r"[‐-―−]", "-", text.lower())  # PDF hyphens/dashes
    norm_text = re.sub(r"(?<=\d),(?=\d{3})", "", re.sub(r"[ \t]+", " ", norm_text))
    norm_text = re.sub(r"(\d+)(st|nd|rd|th)\b", r"\1", norm_text)
    checks: dict[str, list[bool]] = {s: [] for s in SECTIONS}
    out: dict[str, Any] = {}

    out["title"] = clean_title(raw.get("title"), text, website_title)
    out["notification_number"] = _str(raw.get("notification_number"), 200)
    out["summary"] = _str(raw.get("summary"), 600)

    posts = []
    for p in raw.get("posts") or []:
        if not isinstance(p, dict) or not _str(p.get("name"), 300):
            continue
        by_cat = p.get("vacancies_by_category")
        by_cat = (
            {k: v for k, v in ((str(k).upper(), _int(v)) for k, v in by_cat.items())
             if k in CATEGORIES and v is not None}
            if isinstance(by_cat, dict) else {}
        )
        post = {
            "name": _str(p.get("name"), 300),
            "vacancies_total": _int(p.get("vacancies_total"), 0, 1_000_000),
            "vacancies_by_category": by_cat or None,
            "pay_level": _str(p.get("pay_level"), 100),
            "salary_min": _int(p.get("salary_min"), 1, 10_000_000),
            "salary_max": _int(p.get("salary_max"), 1, 10_000_000),
            "salary_text": _str(p.get("salary_text"), 500),
        }
        if post["salary_min"] and post["salary_max"] and post["salary_min"] > post["salary_max"]:
            post["salary_min"] = post["salary_max"] = None
        for n in (post["vacancies_total"], post["salary_min"], post["salary_max"]):
            if n:
                checks["posts"].append(_in_text(norm_text, n))
        posts.append(post)
    out["posts"] = posts

    total = _int(raw.get("vacancies_total"), 1, 10_000_000)
    post_sum = sum(p["vacancies_total"] or 0 for p in posts)
    if total is None and post_sum and all(p["vacancies_total"] for p in posts):
        total = post_sum  # derived, not invented: the posts add up to it
    elif total is not None:
        if len(posts) > 1 and post_sum:
            # Matching the posts' sum is evidence too; disagreeing with it is a red flag.
            checks["vacancies_total"].append(post_sum == total or _in_text(norm_text, total))
        else:
            checks["vacancies_total"].append(_in_text(norm_text, total))
    out["vacancies_total"] = total

    e = raw.get("eligibility")
    if isinstance(e, dict):
        age_min, age_max = _int(e.get("age_min"), 10, 70), _int(e.get("age_max"), 10, 70)
        if age_min and age_max and age_min > age_max:
            age_min = age_max = None
        relax = []
        for r in e.get("age_relaxations") or []:
            years = _int(r.get("years"), 1, 20) if isinstance(r, dict) else None
            if years:
                cat = str(r.get("category") or "").upper()
                gender = r.get("gender")
                relax.append({
                    "category": cat if cat in CATEGORIES else None,
                    "gender": gender if gender in GENDERS else None,
                    "condition": _str(r.get("condition"), 200),
                    "years": years,
                })
        elig = {
            "age_min": age_min,
            "age_max": age_max,
            "age_as_on_date": _date(e.get("age_as_on_date")),
            "age_relaxations": relax,
            "qualification_level": e.get("qualification_level")
            if e.get("qualification_level") in LEVELS else None,
            "qualification_streams": _strs(e.get("qualification_streams"), 200),
            "min_percentage": None,
            "final_year_allowed": e.get("final_year_allowed")
            if isinstance(e.get("final_year_allowed"), bool) else None,
            "gender": e.get("gender") if e.get("gender") in GENDERS else "any",
            "domicile_states": [s for s in _strs(e.get("domicile_states"), 3)
                                if s.upper() in STATE_CODES - {"ALL"}],
            "categories_allowed": [
                c
                for c in (s.upper() for s in _strs(e.get("categories_allowed")))
                if c in CATEGORIES
            ],
            "other_conditions": _strs(e.get("other_conditions"), 500),
            "official_text": _str(e.get("official_text"), 2000),
        }
        try:
            pct = float(e.get("min_percentage"))
            elig["min_percentage"] = pct if 0 < pct <= 100 else None
        except (TypeError, ValueError):
            pass
        for n in (age_min, age_max):
            if n:
                checks["eligibility"].append(_in_text(norm_text, n))
        has_rule = any(v not in (None, [], "any") for k, v in elig.items() if k != "official_text")
        out["eligibility"] = elig if has_rule or elig["official_text"] else None
    else:
        out["eligibility"] = None

    fees = []
    for f in raw.get("fees") or []:
        if not isinstance(f, dict):
            continue
        cat = str(f.get("category") or "").upper()
        amount = _int(f.get("amount"), 0, 100_000)
        if (cat in CATEGORIES or cat == "ALL") and amount is not None:
            gender = f.get("gender") if f.get("gender") in GENDERS else "any"
            fees.append({"category": cat, "gender": gender, "amount": amount})
            if amount:
                checks["fees"].append(_in_text(norm_text, amount))
    out["fees"] = fees
    out["fee_text"] = _str(raw.get("fee_text"), 1000)
    out["payment_modes"] = _strs(raw.get("payment_modes"), 100)

    dates = []
    for d in raw.get("dates") or []:
        if not isinstance(d, dict) or d.get("kind") not in DATE_KINDS:
            continue
        start = _date(d.get("date"))
        if not start or not (2000 <= start.year <= dt.date.today().year + 3):
            continue
        end = _date(d.get("end_date"))
        found = _in_text(norm_text, start)
        note = _str(d.get("note"), 300)
        if not found:
            # Vague source wording ("Mid Nov 2026") makes the AI pick a day; never let that
            # pass as an exact date silently.
            note = "CHECK: this exact date is not written in the PDF" + (
                f" ({note})" if note else ""
            )
        dates.append({
            "kind": d["kind"],
            "date": start,
            "end_date": end if end and end >= start else None,
            "is_tentative": d.get("is_tentative") is True or not found,
            "note": note,
        })
        checks["dates"].append(found)
    by_kind = {d["kind"]: d["date"] for d in dates}
    if by_kind.get("application_start") and by_kind.get("application_end"):
        if by_kind["application_end"] < by_kind["application_start"]:
            checks["dates"].append(False)  # last date before the start date
    out["dates"] = dates

    out["selection_process"] = _strs(raw.get("selection_process"), 300)
    out["required_documents"] = [
        {"name": _str(d.get("name"), 300), "mandatory": d.get("mandatory") is not False,
         "spec": _str(d.get("spec"), 300)}
        for d in raw.get("required_documents") or []
        if isinstance(d, dict) and _str(d.get("name"), 300)
    ]
    out["apply_url"] = _url(raw.get("apply_url"))
    out["official_website"] = _url(raw.get("official_website"))
    out["state_codes"] = sorted({s.upper() for s in _strs(raw.get("state_codes"), 3)}
                                & STATE_CODES) or None

    field_status: dict[str, str] = {}
    field_confidence: dict[str, float] = {}
    for section in SECTIONS:
        value = out.get(section)
        if value in (None, [], {}):
            # Truncated text = we didn't read it all; dates are never auto-"not in source"
            # because that would let a draft publish without a last date.
            pending = truncated or section == "dates"
            field_status[section] = "pending" if pending else "not_in_source"
            continue
        field_status[section] = "available"
        found = checks[section]
        field_confidence[section] = round(sum(found) / len(found), 2) if found else 0.8

    scores = list(field_confidence.values())
    confidence = round(sum(scores) / len(scores), 2) if scores else 0.0
    if truncated:
        confidence = round(confidence * 0.85, 2)
    return {
        "fields": out,
        "field_status": field_status,
        "field_confidence": field_confidence,
        "confidence": confidence,
        "truncated": truncated,
    }


def is_official(url: str | None, source_url: str) -> bool:
    """Job-format rule 8: links must be on a government domain or the source's own domain."""
    host = urlparse(url or "").hostname or ""
    labels = (urlparse(source_url).hostname or "").split(".")
    # npcilcareers.co.in -> base "npcilcareers.co.in", not "co.in" (that allows any .co.in site)
    second_level = {"co", "org", "net", "ac", "edu", "res", "gov", "nic", "gen", "firm", "ind"}
    keep = 3 if len(labels) >= 3 and labels[-2] in second_level else 2
    base = ".".join(labels[-keep:])
    return bool(host) and (
        host.endswith((".gov.in", ".nic.in")) or host == base or host.endswith("." + base)
    )


TITLE_PROMPT = (
    'You write the title of an Indian government notification. Reply with ONE JSON object '
    '{"title": str|null} and nothing else.\n- title:'
    + PROMPT.split("- title:", 1)[1].split("JSON shape", 1)[0]
)


def suggest_title(text: str, website_title: str) -> str | None:
    """Clean display title only, for notices extracted before v2 (about 1k tokens each)."""
    raw, _ = call_groq(text, website_title, system=TITLE_PROMPT, budget=4000)
    return clean_title(raw.get("title"), text, website_title)


def extract(text: str, title: str, source_url: str) -> dict[str, Any]:
    """Text -> checked extraction (fields, field_status, confidences, model, version)."""
    raw, truncated = call_groq(text, title)
    for key in ("apply_url", "official_website"):
        if not is_official(raw.get(key), source_url):
            raw[key] = None  # a third-party link is worse than none; the reviewer adds it
    result = normalize(raw, text, truncated=truncated, website_title=title)
    result["ai_model"] = settings.groq_model
    result["extractor_version"] = EXTRACTOR_VERSION
    return result


def diff_fields(old: dict[str, Any], new: dict[str, Any]) -> tuple[list[str], str]:
    """What changed between two extractions of the same notice (corrigendum / date extension).

    Both sides must be plain JSON (dates as ISO strings). Returns (changed field names, note).
    """
    # The title is AI wording, not a fact of the notice: a reworded title is not a corrigendum.
    changed = sorted(k for k in (set(old) | set(new)) - {"title"} if old.get(k) != new.get(k))
    notes = []
    old_dates = {d["kind"]: d["date"] for d in old.get("dates") or []}
    new_dates = {d["kind"]: d["date"] for d in new.get("dates") or []}
    for kind in sorted(set(old_dates) | set(new_dates)):
        if old_dates.get(kind) != new_dates.get(kind):
            label = kind.replace("_", " ")
            notes.append(f"{label}: {old_dates.get(kind) or '—'} → {new_dates.get(kind) or '—'}")
    if old.get("vacancies_total") != new.get("vacancies_total"):
        notes.append(
            f"vacancies: {old.get('vacancies_total') or '—'} → {new.get('vacancies_total') or '—'}"
        )
    others = [k for k in changed if k not in ("dates", "vacancies_total")]
    if others:
        notes.append("also changed: " + ", ".join(others))
    return changed, "; ".join(notes)


def to_json(result: dict[str, Any]) -> str:
    """JSON for the jsonb column (dates as ISO strings)."""
    return json.dumps(result, default=lambda v: v.isoformat() if isinstance(v, dt.date) else str(v))
