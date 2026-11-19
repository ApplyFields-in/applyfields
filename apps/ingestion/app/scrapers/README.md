# scrapers — one file per website

Each file knows ONE website: where its notifications page is and how to find notice links on it.

```python
# app/scrapers/ssc.py
from app.scrapers.base import BaseScraper, NoticeLink

class SSCScraper(BaseScraper):
    source_key = "ssc"
    list_url = "https://ssc.gov.in/..."   # the official notices page

    def find_notices(self, html: str) -> list[NoticeLink]:
        ...  # parse with BeautifulSoup, return title + link + date
```

First 5 sources: SSC · UPSC · APPSC · TSPSC · RRB

## Simple sites: no file needed
If the site's page just lists notice PDFs as links, use the generic scraper (`generic.py`):
add a `scrape_sources` row with a `config`, e.g.
`{"path_contains": "/uploads/", "title_words": ["notification"], "category": "state_govt"}`.
Write a file here only when the site needs JavaScript, an API or detail pages.
