from app.scrapers.base import NoticeLink
from app.scrapers.isro import (
    IsroScraper,
    classify_pdf_link,
    group_related_pdf_links,
    is_recruitment_advertisement,
)


def test_extracts_recruitment_detail_links():
    html = """
    <html><body>
      <a href="/CareerOpportunities.html">Read more</a>
      <a href="/ICRB_Recruitment11.html">
        ADVT NO. ISRO:ICRB:01(A-JPA):2026 DATED 27.07.2026 - Read More
      </a>
      <a href="/URSCRecruitment13.html">
        Advt No. URSC:04:2026 dated 24.10.2026 - Inviting applications - Read More
      </a>
    </body></html>
    """

    notices = IsroScraper().find_notices(html)

    assert len(notices) == 2
    assert notices[0].url == "https://www.isro.gov.in/ICRB_Recruitment11.html"
    assert notices[1].url == "https://www.isro.gov.in/URSCRecruitment13.html"


def test_deduplicates_repeated_detail_urls():
    html = """
    <html><body>
      <a href="/ICRB_Recruitment11.html">Notice one Read More</a>
      <a href="/ICRB_Recruitment11.html">Notice two Read More</a>
    </body></html>
    """

    notices = IsroScraper().find_notices(html)

    assert len(notices) == 1


def test_extracts_date_from_notice_title():
    html = """
    <html><body>
      <a href="/URSCRecruitment13.html">
        Recruitment notice dated 24.10.2026 - Read More
      </a>
    </body></html>
    """

    notices = IsroScraper().find_notices(html)

    assert len(notices) == 1
    assert notices[0].published_on.isoformat() == "2026-10-24"


def test_ignores_external_and_non_recruitment_links():
    html = """
    <html><body>
      <a href="https://example.com/recruitment.html">External Read More</a>
      <a href="/FAQsonCareers.html">Career FAQ Read More</a>
      <a href="/ICRB_Recruitment11.html">Recruitment notice Read More</a>
    </body></html>
    """

    notices = IsroScraper().find_notices(html)

    assert len(notices) == 1
    assert notices[0].url.endswith("/ICRB_Recruitment11.html")


def test_extracts_official_pdf_links_from_detail_page():
    scraper = IsroScraper()
    html = """
    <html><body>
      <a href="/media/ISRO_Advertisement_2026.pdf">Advertisement PDF</a>
      <a href="https://www.isro.gov.in/media/ISRO_Application_Form.pdf">
        Application Form
      </a>
      <a href="https://example.com/external.pdf">External PDF</a>
      <a href="http://www.isro.gov.in/insecure.pdf">Insecure PDF</a>
    </body></html>
    """

    notices = scraper.find_pdf_notices(
        html,
        detail_url="https://www.isro.gov.in/ICRB_Recruitment11.html",
        title="ISRO recruitment 2026",
        published_on=None,
    )

    assert [notice.url for notice in notices] == [
        "https://www.isro.gov.in/media/ISRO_Advertisement_2026.pdf",
        "https://www.isro.gov.in/media/ISRO_Application_Form.pdf",
    ]


def test_deduplicates_pdf_links_from_detail_page():
    scraper = IsroScraper()
    html = """
    <html><body>
      <a href="/media/advertisement.pdf">Advertisement</a>
      <a href="/media/advertisement.pdf">Download again</a>
    </body></html>
    """

    notices = scraper.find_pdf_notices(
        html,
        detail_url="https://www.isro.gov.in/ICRB_Recruitment11.html",
        title="ISRO recruitment 2026",
        published_on=None,
    )

    assert len(notices) == 1

def test_accepts_recruitment_advertisement():
    assert is_recruitment_advertisement(
        "Recruitment to the post of Technical Assistant",
        "https://www.isro.gov.in/media/recruitment.pdf",
    )


def test_accepts_research_positions():
    assert is_recruitment_advertisement(
        "Inviting online applications for Junior Research Fellows and Research Associates",
        "https://www.isro.gov.in/media/research.pdf",
    )


def test_rejects_application_forms_and_annexures():
    assert not is_recruitment_advertisement(
        "Inviting applications for the post of Director",
        "https://www.isro.gov.in/media/Director_NESAC_APPLICATION_FORM_29092026.pdf",
    )
    assert not is_recruitment_advertisement(
        "Medical Officer recruitment",
        "https://www.isro.gov.in/media/ANNEXURE_II_08102026.pdf",
    )


def test_rejects_results_and_answer_keys():
    assert not is_recruitment_advertisement(
        "Selection Panel for Scientist Engineer",
        "https://www.isro.gov.in/media/selection_panel.pdf",
    )
    assert not is_recruitment_advertisement(
        "Recruitment examination answer key",
        "https://www.isro.gov.in/media/answer_key.pdf",
    )


def test_rejects_corrigenda_and_interview_schedules():
    assert not is_recruitment_advertisement(
        "Inviting applications - Corrigendum",
        "https://www.isro.gov.in/media/corrigendum.pdf",
    )
    assert not is_recruitment_advertisement(
        "Recruitment interview schedule",
        "https://www.isro.gov.in/media/interview_schedule.pdf",
    )
def test_extracts_individual_pdf_link_titles():
    scraper = IsroScraper()
    html = """
    <html><body>
      <a href="/media/advertisement.pdf">
        Detailed Recruitment Advertisement
      </a>
      <a href="/media/application_form.pdf">
        Online Application Form
      </a>
      <a href="/media/shortlist.pdf">
        Shortlisted Candidates
      </a>
    </body></html>
    """

    notices = scraper.find_pdf_notices(
        html,
        detail_url="https://www.isro.gov.in/ICRB_Recruitment11.html",
        title="ISRO Recruitment 2026",
    )

    assert [notice.title for notice in notices] == [
        "Detailed Recruitment Advertisement",
        "Online Application Form",
        "Shortlisted Candidates",
    ]
def test_classifies_main_recruitment_advertisement():
    assert classify_pdf_link(
        "Detailed Recruitment Advertisement",
        "https://www.isro.gov.in/media/advertisement.pdf",
    ) == "main_advertisement"


def test_classifies_application_form():
    assert classify_pdf_link(
        "Online Application Form",
        "https://www.isro.gov.in/media/application_form.pdf",
    ) == "application_form"


def test_classifies_shortlisted_candidates():
    assert classify_pdf_link(
        "List of Shortlisted Candidates",
        "https://www.isro.gov.in/media/shortlisted_candidates.pdf",
    ) == "shortlist"


def test_classifies_results():
    assert classify_pdf_link(
        "Recruitment Examination Results",
        "https://www.isro.gov.in/media/results.pdf",
    ) == "result"


def test_classifies_interview_schedules():
    assert classify_pdf_link(
        "Interview Schedule for Scientist Engineer",
        "https://www.isro.gov.in/media/interview_schedule.pdf",
    ) == "interview_schedule"


def test_classifies_corrigenda():
    assert classify_pdf_link(
        "Corrigendum to Recruitment Advertisement",
        "https://www.isro.gov.in/media/corrigendum.pdf",
    ) == "corrigendum"


def test_classifies_annexures_as_supporting_documents():
    assert classify_pdf_link(
        "Annexure II",
        "https://www.isro.gov.in/media/annexure_ii.pdf",
    ) == "supporting_document"
def test_groups_related_pdfs_under_main_recruitment_notice():
    detail = NoticeLink(
        title="Recruitment to the post of Technical Assistant",
        url="https://www.isro.gov.in/ICRB_Recruitment11.html",
    )

    pdfs = [
        NoticeLink(
            title="Detailed Recruitment Advertisement",
            url="https://www.isro.gov.in/media/detailed_advertisement.pdf",
        ),
        NoticeLink(
            title="Online Application Form",
            url="https://www.isro.gov.in/media/application_form.pdf",
        ),
        NoticeLink(
            title="Shortlisted Candidates",
            url="https://www.isro.gov.in/media/shortlisted_candidates.pdf",
        ),
        NoticeLink(
            title="Recruitment Examination Results",
            url="https://www.isro.gov.in/media/results.pdf",
        ),
    ]

    bundle = group_related_pdf_links(detail, pdfs)

    assert bundle.recruitment_title == detail.title
    assert bundle.official_page_url == detail.url

    assert bundle.notification_pdf is not None
    assert bundle.notification_pdf.url == pdfs[0].url

    assert [
        (link.title, link.category)
        for link in bundle.related_links
    ] == [
        ("Online Application Form", "application_form"),
        ("Shortlisted Candidates", "shortlist"),
        ("Recruitment Examination Results", "result"),
    ]


def test_preserves_related_pdfs_when_no_main_advertisement_is_found():
    detail = NoticeLink(
        title="ISRO recruitment notice",
        url="https://www.isro.gov.in/ICRB_Recruitment11.html",
    )

    pdfs = [
        NoticeLink(
            title="Online Application Form",
            url="https://www.isro.gov.in/media/application_form.pdf",
        ),
        NoticeLink(
            title="Interview Schedule",
            url="https://www.isro.gov.in/media/interview_schedule.pdf",
        ),
    ]

    bundle = group_related_pdf_links(detail, pdfs)

    assert bundle.notification_pdf is None
    assert len(bundle.related_links) == 2
def test_uses_detail_title_when_pdf_link_label_is_generic():
    detail = NoticeLink(
        title="Inviting applications for Junior Research Fellows",
        url="https://www.isro.gov.in/research-recruitment.html",
    )

    pdfs = [
        NoticeLink(
            title="Download PDF",
            url="https://www.isro.gov.in/media/research_notice.pdf",
        ),
    ]

    bundle = group_related_pdf_links(detail, pdfs)

    assert bundle.notification_pdf is not None
    assert bundle.notification_pdf.url == pdfs[0].url
def test_classifies_bilingual_advertisement_as_main_notice():
    assert classify_pdf_link(
        "Bilingual Advertisement",
        "https://www.isro.gov.in/media/Bilingual_Advertisement_2026.pdf",
    ) == "main_advertisement"


def test_classifies_interview_from_filename():
    assert classify_pdf_link(
        "Civil Engineering - BE004 & 4A",
        "https://www.isro.gov.in/media/INTERVIEW_CIVIL_29092026.pdf",
    ) == "interview_schedule"


def test_classifies_panel_publication():
    assert classify_pdf_link(
        "Mechanical 002",
        "https://www.isro.gov.in/media/ME_GATE_2026_PANEL_PUBLICATION_05112026.pdf",
    ) == "selection_panel"


def test_classifies_answer_keys_separately():
    assert classify_pdf_link(
        "Final Answer keys for the written test",
        "https://www.isro.gov.in/media/Industrial_Eng_Answer_Keys_06112026.pdf",
    ) == "answer_key"


def test_classifies_extension_circular():
    assert classify_pdf_link(
        "Extension: Circular",
        "https://www.isro.gov.in/media/Extension_for_receipt_of_application_05112026.pdf",
    ) == "extension"