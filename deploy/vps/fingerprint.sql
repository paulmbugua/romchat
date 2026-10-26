\set ON_ERROR_STOP on
SELECT current_database() AS database_name, current_setting('server_version') AS server_version;
SELECT count(*) AS application_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT count(*) AS accounts FROM romchat_accounts;
SELECT count(*) AS member_profiles FROM romchat_member_profiles;
SELECT count(*) AS profile_media FROM romchat_profile_media;
SELECT count(*) AS matches FROM romchat_matches;
SELECT count(*) AS messages FROM romchat_messages;
SELECT count(*) AS swipes FROM romchat_swipes;
SELECT auth_provider, count(*) FROM romchat_accounts GROUP BY auth_provider ORDER BY auth_provider;
SELECT email_verified, count(*) FROM romchat_accounts GROUP BY email_verified ORDER BY email_verified;
SELECT verification_status, count(*) FROM romchat_member_profiles GROUP BY verification_status ORDER BY verification_status;
