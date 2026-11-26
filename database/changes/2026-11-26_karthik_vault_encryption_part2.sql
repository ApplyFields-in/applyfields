-- Vault encryption for partner verification documents and booking acknowledgment slips (AES-256-GCM)
-- Encrypted file key locked with master key, NULL indicates legacy unencrypted file
alter table partner_documents add column if not exists encrypted_key bytea;
alter table service_requests add column if not exists acknowledgment_slip_encrypted_key bytea;
