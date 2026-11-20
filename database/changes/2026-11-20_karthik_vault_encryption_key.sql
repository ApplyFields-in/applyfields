-- Vault encryption for citizen documents (AES-256-GCM)
-- Encrypted file key locked with master key, NULL indicates legacy unencrypted file
alter table user_documents add column if not exists encrypted_key bytea;
