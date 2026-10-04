"""
The Opportunity format — Python version of docs/job-format.md.
TypeScript mirror: packages/types/src/opportunity.ts
If you change this file, change both of those too (same PR).
"""

import datetime as dt
from typing import Literal

from pydantic import BaseModel, Field

# ---------- Basic codes ----------

OpportunityType = Literal["govt_job", "exam", "scholarship", "admission"]

OpportunityCategory = Literal[
    # government jobs
    "central_govt",
    "state_govt",
    "district",
    "panchayat",
    "municipal",
    "psu",
    "railways",
    "banking",
    "defence",
    "police",
    # exams
    "entrance",
    "competitive",
    "recruitment",
    # scholarships
    "central",
    "state",
    # admissions
    "college",
    "university",
    "course",
    "other",
]

OrganizationLevel = Literal["central", "state", "district", "local"]
CategoryCode = Literal["GEN", "OBC", "SC", "ST", "EWS", "PWBD", "EXS"]
Gender = Literal["any", "male", "female", "transgender"]
QualificationLevel = Literal["10th", "12th", "iti", "diploma", "graduate", "post_graduate", "phd"]
DateKind = Literal[
    "notification_date",
    "application_start",
    "application_end",
    "fee_last_date",
    "correction_window",
    "admit_card",
    "exam_date",
    "answer_key",
    "result",
    "interview",
    "counselling",
    "other",
]
OpportunityStatus = Literal["draft", "published", "closed", "archived"]
FieldStatus = Literal["available", "not_in_source", "pending", "not_applicable"]
UpdateKind = Literal[
    "admit_card",
    "answer_key",
    "result",
    "correction_window",
    "date_change",
    "extension",
    "counselling",
    "other",
]

# ---------- Building blocks ----------


class Organization(BaseModel):
    name: str
    short_name: str | None = None
    level: OrganizationLevel
    state_code: str | None = None


class Location(BaseModel):
    state_code: str  # 2-letter code or "ALL"
    district: str | None = None


class AgeRelaxation(BaseModel):
    category: CategoryCode | None = None
    gender: Gender | None = None
    condition: str | None = None  # e.g. "widow"
    years: int


class AgeRule(BaseModel):
    min: int | None = None
    max: int | None = None
    as_on_date: dt.date | None = None
    relaxations: list[AgeRelaxation] = []


class QualificationRule(BaseModel):
    level: QualificationLevel | None = None
    streams: list[str] = []
    min_percentage: float | None = None
    final_year_allowed: bool | None = None


class Eligibility(BaseModel):
    age: AgeRule = AgeRule()
    qualification: QualificationRule = QualificationRule()
    gender: Gender = "any"
    domicile_states: list[str] = []  # empty = no restriction
    categories_allowed: list[CategoryCode] = []  # empty = all
    income_max: int | None = None  # annual family income, whole rupees
    other_conditions: list[str] = []
    official_text: str  # original wording from the notification


class Post(BaseModel):
    name: str
    vacancies_total: int | None = None
    vacancies_by_category: dict[CategoryCode, int] | None = None
    pay_level: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_text: str | None = None
    eligibility: Eligibility | None = None  # only if different from the main one


class Fee(BaseModel):
    category: CategoryCode | Literal["ALL"]
    gender: Gender = "any"
    amount: int  # whole rupees


class ImportantDate(BaseModel):
    kind: DateKind
    date: dt.date
    end_date: dt.date | None = None
    is_tentative: bool = False


class RequiredDocument(BaseModel):
    name: str
    mandatory: bool = True
    spec: str | None = None


class Syllabus(BaseModel):
    text: str | None = None
    url: str | None = None


class PreviousPaper(BaseModel):
    title: str
    url: str


class OfficialLinks(BaseModel):
    notification_pdf_url: str | None = None
    official_page_url: str | None = None
    apply_url: str | None = None
    official_website: str | None = None


class SourceInfo(BaseModel):
    source_key: str
    url: str
    fetched_at: dt.datetime
    content_hash: str
    extractor_version: str
    ai_model: str | None = None
    confidence: float = Field(ge=0, le=1)


# ---------- The main object ----------


class Opportunity(BaseModel):
    type: OpportunityType
    category: OpportunityCategory
    title: str
    organization: Organization
    notification_number: str | None = None
    summary: str | None = None
    locations: list[Location] = []

    vacancies_total: int | None = None
    posts: list[Post] = []

    eligibility: Eligibility | None = None

    fees: list[Fee] = []
    fee_text: str | None = None
    payment_modes: list[str] = []

    dates: list[ImportantDate] = []

    selection_process: list[str] = []
    required_documents: list[RequiredDocument] = []
    syllabus: Syllabus | None = None
    previous_papers: list[PreviousPaper] = []
    benefits_text: str | None = None

    links: OfficialLinks
    source: SourceInfo

    status: Literal["draft"] = "draft"  # scrapers can ONLY create drafts
    field_status: dict[str, FieldStatus] = {}


# ---------- Updates (results, admit cards …) ----------


class UpdateSource(BaseModel):
    source_key: str
    url: str
    fetched_at: dt.datetime


class OpportunityUpdate(BaseModel):
    opportunity_source_url: str
    kind: UpdateKind
    title: str
    date: dt.date | None = None
    url: str | None = None
    summary: str | None = None
    source: UpdateSource
    status: Literal["draft"] = "draft"
