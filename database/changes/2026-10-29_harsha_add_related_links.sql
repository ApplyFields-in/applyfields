ALTER TABLE opportunities
ADD COLUMN related_links jsonb NOT NULL DEFAULT '[]'::jsonb;
