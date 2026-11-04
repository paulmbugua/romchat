BEGIN;

ALTER TABLE romchat_gifts
  ALTER COLUMN token_cost SET DEFAULT 0,
  ALTER COLUMN redeemable_usd SET DEFAULT 0;

UPDATE romchat_gifts
SET token_cost = 0,
    redeemable_usd = 0
WHERE token_cost <> 0
   OR redeemable_usd <> 0;

COMMIT;
