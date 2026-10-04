# Job Format — the contract between scrapers and the app

> **Status:** DRAFT v0.1. Finalise together at the kickoff meeting, then only change it with a PR that all three of us approve.
> **Owner:** Likhith · **Used by:** Harsha (scrapers produce it) · Likhith (database + API store it) · Karthik (pages show it)

---

## 1. Why this document exists

Harsha's scrapers read official websites and PDFs. The website shows jobs on a detail page.
If both sides don't agree on **exactly** what a "job" looks like, we waste days converting data.

This file is the single agreement. The TypeScript version lives in
[`packages/types/src/opportunity.ts`](../packages/types/src/opportunity.ts) and the Python version in
[`apps/ingestion/app/schemas/opportunity.py`](../apps/ingestion/app/schemas/opportunity.py). **All three must match.**

---

## 2. Golden rules

1. **Never invent data.** If the official notification doesn't say it, the value is `null` and we record why in `field_status`. (Founder doc §27: *"Do not invent government fees, eligibility or procedures."*)
2. **Scrapers only create drafts.** `status` is always `"draft"` from ingestion. Only a human in the Internal Portal can publish.
3. **Dates** are `YYYY-MM-DD` (e.g. `2026-10-31`). Date + time is ISO 8601 with timezone (`2026-10-31T23:59:00+05:30`).
4. **Money** is a whole number of rupees (`100`, not `"₹100/-"`). Keep the original wording in the matching `_text` field.
5. **States** use 2-letter codes: `AP`, `TS`, `KA`, `TN`, `MH`, `DL` … `ALL` = All India.
6. **Categories** use these exact codes: `GEN`, `OBC`, `SC`, `ST`, `EWS`, `PWBD`, `EXS` (ex-serviceman).
7. **Keep the official wording.** Every structured section also stores the original text, so the user can always read what the notification actually says.
8. **Links must be official.** `apply_url` and `notification_pdf_url` must be on the organisation's own domain (or the official portal it uses). Never a third-party site.

---

## 3. `field_status` — how we handle missing information

Every optional field can be missing for different reasons. The page shows a different message for each:

| Value | Meaning | What the user sees |
|---|---|---|
| `available` | We have it | The value |
| `not_in_source` | The official notification does not mention it | *"Not mentioned in the official notification."* + link to the notification |
| `pending` | Not extracted / not reviewed yet | *"Being updated — please check the official notification."* |
| `not_applicable` | Doesn't apply (e.g. no fee for a scholarship) | Section is hidden |

If a field is **not listed** in `field_status`, treat it as `available` when it has a value and `pending` when it is `null`.

---

## 4. The Opportunity object

One object = one notification (a job recruitment, an exam, a scholarship or an admission).

### 4.1 Basic information

| Field | Type | Required | Example | Notes |
|---|---|---|---|---|
| `type` | enum | ✅ | `"govt_job"` | `govt_job` · `exam` · `scholarship` · `admission` |
| `category` | enum | ✅ | `"central_govt"` | Jobs: `central_govt` `state_govt` `district` `panchayat` `municipal` `psu` `railways` `banking` `defence` `police` `other` · Exams: `entrance` `competitive` `recruitment` · Scholarships: `central` `state` `other` · Admissions: `college` `university` `course` |
| `title` | string | ✅ | `"Combined Graduate Level Examination 2026"` | Official name |
| `organization.name` | string | ✅ | `"Staff Selection Commission"` | |
| `organization.short_name` | string | | `"SSC"` | |
| `organization.level` | enum | ✅ | `"central"` | `central` · `state` · `district` · `local` |
| `organization.state_code` | string | | `null` | Only for state/district/local bodies |
| `notification_number` | string | | `"F.No. HQ-PPII03/1/2026"` | Advertisement / notification number |
| `summary` | string | | `"SSC recruits Group B and C officers…"` | 2–4 plain sentences. The **Overview** section |
| `locations` | array | | `[{"state_code":"ALL","district":null}]` | Where the job is |

### 4.2 Vacancies & posts

A single notification often has many posts. Each post can have its own salary, qualification and age.

| Field | Type | Example |
|---|---|---|
| `vacancies_total` | integer \| null | `14582` |
| `posts[]` | array | see below |
| `posts[].name` | string | `"Assistant Section Officer"` |
| `posts[].vacancies_total` | integer \| null | `4500` |
| `posts[].vacancies_by_category` | object \| null | `{"GEN":1800,"OBC":1200,"SC":700,"ST":350,"EWS":450}` |
| `posts[].pay_level` | string \| null | `"Level 7"` |
| `posts[].salary_min` / `salary_max` | integer \| null | `44900` / `142400` (monthly ₹) |
| `posts[].salary_text` | string \| null | Original wording |
| `posts[].eligibility` | object \| null | Same shape as 4.3. Only when this post's rules differ from the main ones |

### 4.3 Eligibility

| Field | Type | Example | Notes |
|---|---|---|---|
| `eligibility.age.min` | integer \| null | `18` | |
| `eligibility.age.max` | integer \| null | `32` | |
| `eligibility.age.as_on_date` | date \| null | `"2026-08-01"` | Age is calculated **on this date** |
| `eligibility.age.relaxations` | array | `[{"category":"OBC","years":3},{"category":"SC","years":5}]` | Can also use `"gender":"female"` or `"condition":"widow"` |
| `eligibility.qualification.level` | enum \| null | `"graduate"` | `10th` `12th` `iti` `diploma` `graduate` `post_graduate` `phd` |
| `eligibility.qualification.streams` | string[] | `["any"]` | e.g. `["engineering","b.tech"]`, `["any"]` |
| `eligibility.qualification.min_percentage` | number \| null | `60` | |
| `eligibility.qualification.final_year_allowed` | boolean \| null | `true` | Can final-year students apply? |
| `eligibility.gender` | enum | `"any"` | `any` · `male` · `female` · `transgender` |
| `eligibility.domicile_states` | string[] | `[]` | Empty = no domicile restriction |
| `eligibility.categories_allowed` | string[] | `[]` | Empty = all categories |
| `eligibility.income_max` | integer \| null | `250000` | Annual family income (scholarships, EWS) |
| `eligibility.other_conditions` | string[] | `["Must have a valid driving licence"]` | Anything we can't structure |
| `eligibility.official_text` | string | *(copied text)* | **Required whenever any eligibility value is set** |

### 4.4 Fees

| Field | Type | Example |
|---|---|---|
| `fees[]` | array | `[{"category":"GEN","gender":"any","amount":100},{"category":"SC","gender":"any","amount":0},{"category":"GEN","gender":"female","amount":0}]` |
| `fee_text` | string \| null | Original wording |
| `payment_modes` | string[] | `["online"]` |

### 4.5 Important dates

| Field | Type | Example |
|---|---|---|
| `dates[]` | array | `[{"kind":"application_end","date":"2026-07-24","end_date":null,"is_tentative":false}]` |

`kind` values: `notification_date` · `application_start` · `application_end` · `fee_last_date` · `correction_window` · `admit_card` · `exam_date` · `answer_key` · `result` · `interview` · `counselling` · `other`

Use `end_date` for ranges (correction window, exam spread over days). `is_tentative: true` when the notification says "tentative" / "likely".

### 4.6 Process, documents & preparation

| Field | Type | Example |
|---|---|---|
| `selection_process` | string[] | `["Tier 1 – CBT","Tier 2 – CBT","Document verification"]` |
| `required_documents[]` | array | `[{"name":"Photograph","mandatory":true,"spec":"20–50 KB, JPG"}]` |
| `syllabus` | object \| null | `{"text":null,"url":"https://…/syllabus.pdf"}` |
| `previous_papers[]` | array | `[{"title":"2025 Tier 1","url":"https://…"}]` |
| `benefits_text` | string \| null | Scholarships: what the student receives |

### 4.7 Official links

| Field | Type | Required | Notes |
|---|---|---|---|
| `links.notification_pdf_url` | url \| null | ✅ one of these two | The official notification PDF |
| `links.official_page_url` | url \| null | ✅ one of these two | The official web page for this notification |
| `links.apply_url` | url \| null | | The official application portal |
| `links.official_website` | url \| null | | Organisation home page |

### 4.8 Source & extraction info (for review and trust)

| Field | Type | Required | Example |
|---|---|---|---|
| `source.source_key` | string | ✅ | `"ssc"` — matches the scraper file name |
| `source.url` | url | ✅ | The page where we found it |
| `source.fetched_at` | datetime | ✅ | `"2026-10-05T09:30:00+05:30"` |
| `source.content_hash` | string | ✅ | SHA-256 of the downloaded file (detects changes) |
| `source.extractor_version` | string | ✅ | `"ingestion-0.1.0"` |
| `source.ai_model` | string \| null | | Model used for extraction, if any |
| `source.confidence` | number 0–1 | ✅ | `0.82` — below `0.6` goes to "needs careful review" |

### 4.9 Status

| Field | Value |
|---|---|
| `status` | Always `"draft"` from scrapers. Internal Portal changes it to `published` / `closed` / `archived`. |
| `field_status` | Object, see §3 |

---

## 5. Required before a reviewer can publish

The Internal Portal blocks **Publish** unless all of these exist:

- `type`, `category`, `title`, `organization.name`, `organization.level`
- `links.notification_pdf_url` **or** `links.official_page_url`
- `source.url`
- An `application_end` date **or** `field_status.dates = "not_in_source"` (shown as *"Dates not announced yet"*)

---

## 6. The Update object (results, admit cards, answer keys…)

Updates are attached to an existing opportunity. When one is published, everyone who saved that opportunity is notified.

```json
{
  "opportunity_source_url": "https://ssc.gov.in/...",
  "kind": "admit_card",
  "title": "Tier 1 admit card released",
  "date": "2026-09-01",
  "url": "https://ssc.gov.in/.../admit-card",
  "summary": null,
  "source": { "source_key": "ssc", "url": "https://ssc.gov.in/...", "fetched_at": "2026-09-01T10:00:00+05:30" },
  "status": "draft"
}
```

`kind` values: `admit_card` · `answer_key` · `result` · `correction_window` · `date_change` · `extension` · `counselling` · `other`

---

## 7. Full example (illustrative only — NOT real data)

```json
{
  "type": "govt_job",
  "category": "central_govt",
  "title": "Example Recruitment 2026",
  "organization": { "name": "Example Commission", "short_name": "EC", "level": "central", "state_code": null },
  "notification_number": "EC/2026/01",
  "summary": "Example Commission invites applications for Junior Assistant posts.",
  "locations": [{ "state_code": "ALL", "district": null }],

  "vacancies_total": 120,
  "posts": [
    {
      "name": "Junior Assistant",
      "vacancies_total": 120,
      "vacancies_by_category": { "GEN": 50, "OBC": 32, "SC": 18, "ST": 8, "EWS": 12 },
      "pay_level": "Level 4",
      "salary_min": null,
      "salary_max": null,
      "salary_text": "Pay Level 4 as per 7th CPC",
      "eligibility": null
    }
  ],

  "eligibility": {
    "age": {
      "min": 18, "max": 27, "as_on_date": "2026-01-01",
      "relaxations": [
        { "category": "OBC", "years": 3 },
        { "category": "SC", "years": 5 },
        { "category": "ST", "years": 5 },
        { "category": "PWBD", "years": 10 }
      ]
    },
    "qualification": { "level": "12th", "streams": ["any"], "min_percentage": null, "final_year_allowed": false },
    "gender": "any",
    "domicile_states": [],
    "categories_allowed": [],
    "income_max": null,
    "other_conditions": ["Typing speed of 35 wpm in English"],
    "official_text": "Candidates must have passed 12th standard from a recognised board…"
  },

  "fees": [
    { "category": "GEN", "gender": "any", "amount": 100 },
    { "category": "GEN", "gender": "female", "amount": 0 },
    { "category": "SC", "gender": "any", "amount": 0 }
  ],
  "fee_text": "Rs. 100/-. Women, SC, ST, PwBD and ESM candidates are exempted.",
  "payment_modes": ["online"],

  "dates": [
    { "kind": "application_start", "date": "2026-10-01", "end_date": null, "is_tentative": false },
    { "kind": "application_end", "date": "2026-10-31", "end_date": null, "is_tentative": false },
    { "kind": "exam_date", "date": "2026-12-15", "end_date": null, "is_tentative": true }
  ],

  "selection_process": ["Computer Based Test", "Typing Test", "Document Verification"],
  "required_documents": [
    { "name": "Photograph", "mandatory": true, "spec": "20–50 KB, JPG" },
    { "name": "Signature", "mandatory": true, "spec": "10–20 KB, JPG" }
  ],
  "syllabus": null,
  "previous_papers": [],
  "benefits_text": null,

  "links": {
    "notification_pdf_url": "https://example.gov.in/notice.pdf",
    "official_page_url": null,
    "apply_url": "https://example.gov.in/apply",
    "official_website": "https://example.gov.in"
  },

  "source": {
    "source_key": "example",
    "url": "https://example.gov.in/notices",
    "fetched_at": "2026-10-05T09:30:00+05:30",
    "content_hash": "sha256:…",
    "extractor_version": "ingestion-0.1.0",
    "ai_model": null,
    "confidence": 0.82
  },

  "status": "draft",
  "field_status": {
    "syllabus": "not_in_source",
    "previous_papers": "not_in_source",
    "salary_min": "not_in_source",
    "benefits_text": "not_applicable"
  }
}
```

---

## 8. Open questions — decide at kickoff

- [ ] Do scrapers write drafts **directly into Supabase** tables, or send them to a NestJS internal endpoint? *(Current plan: directly, as `status = draft`.)*
- [ ] One opportunity per notification, or one per post when posts are very different?
- [ ] Do we store the downloaded PDF copy in Supabase Storage (recommended, for review + change detection)?
- [ ] Which 5 sources go first? *(Proposed: SSC, UPSC, APPSC, TSPSC, RRB)*
- [ ] Confidence threshold for "needs careful review" (proposed `0.6`).
