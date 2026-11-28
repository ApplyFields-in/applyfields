-- Why: the Filing Desk can send a started booking back to the citizen to fix documents. Until now that was
-- faked with a partner_note prefix ("Sent back to fix: ..."); this gives it a real status.
-- needs_fix: work had started (in_progress), the centre found a problem and is waiting for the citizen.
-- The centre moves it back to in_progress once the documents are fixed.
-- Additive and safe to re-run. ALTER TYPE ... ADD VALUE cannot run inside a transaction block on old
-- Postgres; run this file as-is (no BEGIN/COMMIT).
alter type request_status add value if not exists 'needs_fix' after 'in_progress';
