BEGIN;

ALTER TABLE romchat_matches
  ADD COLUMN IF NOT EXISTS pair_key TEXT;

UPDATE romchat_matches
SET pair_key = length(LEAST(actor_id, profile_id))::text || ':' || LEAST(actor_id, profile_id) || '|' || GREATEST(actor_id, profile_id)
WHERE pair_key IS NULL OR pair_key = '';

UPDATE romchat_matches
SET expires_at = NULL
WHERE status = 'active' AND expires_at IS NOT NULL;

WITH ranked AS (
  SELECT id, first_value(id) OVER (PARTITION BY pair_key ORDER BY created_at, id) AS keeper_id,
         row_number() OVER (PARTITION BY pair_key ORDER BY created_at, id) AS position
  FROM romchat_matches
)
UPDATE romchat_messages child
SET match_id = ranked.keeper_id
FROM ranked
WHERE ranked.position > 1 AND child.match_id = ranked.id;

WITH ranked AS (
  SELECT id, first_value(id) OVER (PARTITION BY pair_key ORDER BY created_at, id) AS keeper_id,
         row_number() OVER (PARTITION BY pair_key ORDER BY created_at, id) AS position
  FROM romchat_matches
)
UPDATE romchat_notifications child
SET match_id = ranked.keeper_id
FROM ranked
WHERE ranked.position > 1 AND child.match_id = ranked.id;

WITH ranked AS (
  SELECT id, first_value(id) OVER (PARTITION BY pair_key ORDER BY created_at, id) AS keeper_id,
         row_number() OVER (PARTITION BY pair_key ORDER BY created_at, id) AS position
  FROM romchat_matches
)
UPDATE romchat_gifts child
SET match_id = ranked.keeper_id
FROM ranked
WHERE ranked.position > 1 AND child.match_id = ranked.id;

WITH ranked AS (
  SELECT id, first_value(id) OVER (PARTITION BY pair_key ORDER BY created_at, id) AS keeper_id,
         row_number() OVER (PARTITION BY pair_key ORDER BY created_at, id) AS position
  FROM romchat_matches
)
UPDATE romchat_video_requests child
SET match_id = ranked.keeper_id
FROM ranked
WHERE ranked.position > 1 AND child.match_id = ranked.id;

DELETE FROM romchat_matches duplicate
USING romchat_matches keeper
WHERE duplicate.pair_key = keeper.pair_key
  AND (duplicate.created_at, duplicate.id) > (keeper.created_at, keeper.id);

ALTER TABLE romchat_matches
  ALTER COLUMN pair_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_romchat_matches_pair_key
  ON romchat_matches (pair_key);

CREATE INDEX IF NOT EXISTS idx_romchat_swipes_reciprocal
  ON romchat_swipes (actor_id, profile_id, created_at DESC);

COMMIT;
