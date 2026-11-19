"""Session 05 extraction checks — no network (Groq is never called here)."""

import datetime as dt

import pytest

from app.db.repository import to_plain
from app.extract.extractor import (
    ExtractionError,
    diff_fields,
    is_official,
    normalize,
    pdf_to_text,
    pick_pages,
)

TEXT = """--- page 1 ---
Staff Selection Commission  Notice No. HQ-PPII03/1/2026
Combined Graduate Level Examination, 2026. Total vacancies: 14,582.
Last date for online application: 24.07.2026 (23:00). Opening date 16th June 2026.
Age limit 18 to 32 years as on 01-08-2026. Fee Rs. 100/- ; Women, SC, ST exempted.
"""

RAW = {
    "notification_number": "HQ-PPII03/1/2026",
    "summary": "SSC recruits for CGL 2026.",
    "vacancies_total": 14582,
    "posts": [{"name": "Assistant Section Officer", "vacancies_total": None}],
    "eligibility": {"age_min": 18, "age_max": 32, "age_as_on_date": "2026-08-01",
                    "qualification_level": "graduate", "gender": "any",
                    "categories_allowed": ["UR", "OBC"], "official_text": "18 to 32 years"},
    "fees": [{"category": "GEN", "gender": "any", "amount": 100},
             {"category": "Women", "amount": 0}],
    "dates": [{"kind": "application_start", "date": "2026-06-16"},
              {"kind": "application_end", "date": "2026-07-24"},
              {"kind": "exam_date", "date": "2026-13-40"}],
    "selection_process": ["Tier 1", "Tier 2"],
    "required_documents": [],
    "apply_url": None,
    "state_codes": ["ALL"],
}


def test_normalize_keeps_checked_values_and_drops_invalid_ones() -> None:
    out = normalize(RAW, TEXT, truncated=False)
    f = out["fields"]
    assert f["vacancies_total"] == 14582
    assert [d["kind"] for d in f["dates"]] == ["application_start", "application_end"]
    assert f["dates"][1]["date"] == dt.date(2026, 7, 24)
    assert f["fees"] == [{"category": "GEN", "gender": "any", "amount": 100}]  # "Women" dropped
    assert f["eligibility"]["categories_allowed"] == ["OBC"]  # "UR" is not a valid code
    assert f["eligibility"]["age_as_on_date"] == dt.date(2026, 8, 1)
    # every number/date above literally appears in the text -> full confidence
    assert out["field_confidence"]["dates"] == 1.0
    assert out["field_confidence"]["fees"] == 1.0
    assert out["field_status"]["required_documents"] == "not_in_source"


def test_invented_numbers_lower_confidence() -> None:
    raw = {**RAW, "vacancies_total": 99999, "fees": [{"category": "GEN", "amount": 750}]}
    out = normalize(raw, TEXT, truncated=False)
    assert out["field_confidence"]["vacancies_total"] == 0.0
    assert out["field_confidence"]["fees"] == 0.0
    assert out["confidence"] < normalize(RAW, TEXT, truncated=False)["confidence"]


def test_missing_dates_are_pending_never_not_in_source() -> None:
    out = normalize({**RAW, "dates": []}, TEXT, truncated=False)
    assert out["field_status"]["dates"] == "pending"  # never lets a draft publish without a date


def test_truncated_text_marks_missing_fields_pending() -> None:
    out = normalize({**RAW, "required_documents": []}, TEXT, truncated=True)
    assert out["field_status"]["required_documents"] == "pending"


def test_vacancies_derived_from_posts_only_when_all_posts_have_numbers() -> None:
    raw = {**RAW, "vacancies_total": None,
           "posts": [{"name": "A", "vacancies_total": 10}, {"name": "B", "vacancies_total": 5}]}
    assert normalize(raw, TEXT, truncated=False)["fields"]["vacancies_total"] == 15
    raw["posts"][1]["vacancies_total"] = None
    assert normalize(raw, TEXT, truncated=False)["fields"]["vacancies_total"] is None


def test_total_matching_the_posts_sum_counts_as_evidence() -> None:
    posts = [{"name": "A", "vacancies_total": 287}, {"name": "B", "vacancies_total": 33}]
    text = TEXT + " A 287 B 33"
    ok = normalize({**RAW, "vacancies_total": 320, "posts": posts}, text, truncated=False)
    bad = normalize({**RAW, "vacancies_total": 330, "posts": posts}, text, truncated=False)
    assert ok["field_confidence"]["vacancies_total"] == 1.0
    assert bad["field_confidence"]["vacancies_total"] == 0.0


def test_pick_pages_keeps_lead_pages_and_the_fact_pages_in_order() -> None:
    filler = "general instructions about the examination hall " * 40
    page = [f"--- page {n} ---\n" for n in range(1, 8)]
    text = (
        page[0] + "Staff Selection Commission notice\n"
        + page[1] + "Vacancy table: Post A 287, Post B 33\n"
        + page[2] + "Important dates\n"
        + page[3] + filler
        + page[4] + "Fee: Rs 100. Age limit 18-27. Last date 24.07.2026\n"
        + page[5] + filler
        + page[6] + "Selection: Tier 1, Tier 2. Scheme of exam\n"
    )
    picked = pick_pages(text, 400)
    for n in (1, 2, 3, 5, 7):  # lead pages always; then the pages with the most fact words
        assert f"--- page {n} ---" in picked
    assert "--- page 4 ---" not in picked and "--- page 6 ---" not in picked
    assert picked.index("page 5") < picked.index("page 7")
    assert pick_pages("short", 400) == "short"


def test_end_before_start_is_flagged() -> None:
    raw = {**RAW, "dates": [{"kind": "application_start", "date": "2026-07-24"},
                            {"kind": "application_end", "date": "2026-06-16"}]}
    assert normalize(raw, TEXT, truncated=False)["field_confidence"]["dates"] < 1.0


def test_only_official_links_are_kept() -> None:
    src = "https://ssc.gov.in/api/notice.pdf"
    assert is_official("https://ssc.gov.in/apply", src)
    assert is_official("https://upsconline.nic.in", src)
    assert not is_official("https://sarkari-jobs-blog.com/apply", src)
    assert is_official("https://careers.isro.org/apply", "https://www.isro.org/notice.pdf")
    assert is_official("https://isro.org/apply", "https://www.isro.org/notice.pdf")
    assert is_official("https://apply.npcilcareers.co.in/x", "https://npcilcareers.co.in/a.pdf")
    assert not is_official("https://random-site.co.in/x", "https://npcilcareers.co.in/a.pdf")


def test_diff_reports_date_extension() -> None:
    old = to_plain(normalize(RAW, TEXT, truncated=False)["fields"])
    raw = {**RAW, "dates": [{"kind": "application_start", "date": "2026-06-16"},
                            {"kind": "application_end", "date": "2026-08-07"}]}
    new = to_plain(normalize(raw, TEXT + " 07.08.2026", truncated=False)["fields"])
    changed, note = diff_fields(old, new)
    assert changed == ["dates"]
    assert "application end: 2026-07-24 → 2026-08-07" in note
    assert diff_fields(old, old) == ([], "")


def _pdf(body: bytes) -> bytes:
    """A minimal one-page PDF whose page shows `body` (pdfminer tolerates the missing xref)."""
    stream = b"BT /F1 12 Tf 50 700 Td (" + body + b") Tj ET"
    return (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R"
        b"/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        b"4 0 obj<</Length " + str(len(stream)).encode() + b">>stream\n" + stream
        + b"\nendstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"trailer<</Root 1 0 R>>\n%%EOF"
    )


def test_pdf_text_and_scanned_detection() -> None:
    text = pdf_to_text(_pdf(b"Combined Graduate Level Examination 2026 " * 8))
    assert "--- page 1 ---" in text and "Combined Graduate Level" in text
    with pytest.raises(ExtractionError, match="Scanned PDF"):
        pdf_to_text(_pdf(b"x"))


def test_date_missing_from_pdf_is_marked_for_checking() -> None:
    raw = {**RAW, "dates": [{"kind": "exam_date", "date": "2026-11-15"}]}
    d = normalize(raw, TEXT + " Exam: Mid Nov 2026", truncated=False)["fields"]["dates"][0]
    assert d["is_tentative"] is True
    assert d["note"].startswith("CHECK:")
    ok = normalize(RAW, TEXT, truncated=False)["fields"]["dates"][0]
    assert ok["is_tentative"] is False and ok["note"] is None


def test_unicode_hyphen_dates_are_recognised() -> None:
    raw = {**RAW, "dates": [{"kind": "application_end", "date": "2026-12-08"}]}
    out = normalize(raw, TEXT + " last date 08‑12‑2026", truncated=False)
    assert out["field_confidence"]["dates"] == 1.0
