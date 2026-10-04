# extract — turn a PDF into the job format

1. Download the notice (PDF/HTML) and compute its SHA-256 hash (skip if already seen)
2. Read text: `pdfplumber` for normal PDFs, OCR for scanned ones
3. Fill the `Opportunity` model (rules first, AI to help) — see `app/schemas/opportunity.py`
4. Set `field_status` for anything not found: `not_in_source`
5. Set `source.confidence` (below 0.6 = needs careful review)
