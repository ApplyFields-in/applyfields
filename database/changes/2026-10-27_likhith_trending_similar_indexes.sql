-- =============================================================================
-- ApplyFields — Trending & Similar Opportunities Performance Indexes
-- Author  : likhith
-- Date    : 2026-10-27
-- Purpose :
--   1. trending()  — counts saves per opportunity in the last 48 h
--      Needs fast filter on (item_type, created_at) + group by item_id
--   2. similar()   — finds open opps with the same type + category
--      Needs composite index on (type, category, status, application_end)
-- =============================================================================

-- Index for trending: filter saves by type + time window, aggregate by item_id
CREATE INDEX IF NOT EXISTS idx_saved_items_type_created
  ON saved_items (item_type, created_at, item_id)
  WHERE item_type = 'opportunity';

-- Index for similar: filter published open opps by type + category
CREATE INDEX IF NOT EXISTS idx_opportunities_type_category_status
  ON opportunities (type, category, status, application_end NULLS LAST)
  WHERE status = 'published';

-- Comment on both for future engineers
COMMENT ON INDEX idx_saved_items_type_created IS
  'Used by trending() to aggregate 48-h save counts per opportunity efficiently.';

COMMENT ON INDEX idx_opportunities_type_category_status IS
  'Used by similar() to find open opps with matching type + category for recommendations.';
