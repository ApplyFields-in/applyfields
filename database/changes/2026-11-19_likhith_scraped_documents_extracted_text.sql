-- Why: Session 05 — notification PDFs are no longer stored in Supabase Storage.
-- The scraper reads each PDF in memory, keeps only its plain text (for "Re-extract" and for
-- spotting what changed in a corrigendum) plus the extracted job JSON (existing `extraction`).
-- Safe to run more than once.

alter table scraped_documents add column if not exists extracted_text text;

comment on column scraped_documents.extracted_text is
  'Plain text of the notification PDF (the PDF itself is not stored). Used by Re-extract and change detection.';
comment on column scraped_documents.storage_path is
  'Legacy: copy of the PDF in Storage. New rows leave this NULL (PDFs are no longer stored).';

-- Speeds up the cost guard: reuse an extraction when the same PDF (same SHA-256) shows up again.
create index if not exists idx_scraped_documents_content_hash on scraped_documents(content_hash);
