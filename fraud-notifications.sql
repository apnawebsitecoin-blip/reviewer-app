-- ── Fraud Detection Schema ────────────────────────────────

-- Self-referral constraint
alter table profiles drop constraint if exists no_self_referral;
alter table profiles add constraint no_self_referral
  check (referred_by is null or referred_by != id);

-- Track signup IP
alter table profiles add column if not exists signup_ip text;

-- OneSignal player ID (for push notifications)
alter table profiles add column if not exists onesignal_player_id text;

-- Notification preferences
alter table profiles add column if not exists notification_prefs jsonb
  default '{"wallet_credit": true, "withdrawal_update": true, "price_drop": true}'::jsonb;

-- ── Referral Leaderboard RPC ──────────────────────────────
create or replace function get_top_referrers(lim int default 20)
returns table(id uuid, name text, referral_count bigint) as $$
  select p.id, p.name, count(r.id) as referral_count
  from profiles p
  inner join profiles r on r.referred_by = p.id
  where p.is_blocked = false
  group by p.id, p.name
  order by referral_count desc
  limit lim;
$$ language sql security definer;

-- ── Admin: flag accounts sharing same signup IP ───────────
create or replace view duplicate_signup_ips as
  select
    signup_ip,
    count(*)              as account_count,
    array_agg(id)         as user_ids,
    array_agg(name)       as names,
    min(created_at)       as first_signup
  from profiles
  where signup_ip is not null
  group by signup_ip
  having count(*) > 1
  order by account_count desc;
