-- ApplyFields Privacy-First Analytics Events Table (DPDP Act 2023 Compliant)
-- Anonymous telemetry with zero PII (Personally Identifiable Information)

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64),
  event_name VARCHAR(64) NOT NULL,
  entity_type VARCHAR(32),
  entity_id VARCHAR(64),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast aggregation indexes for funnel conversion and real-time dashboard analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON analytics_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events (session_id) WHERE session_id IS NOT NULL;
