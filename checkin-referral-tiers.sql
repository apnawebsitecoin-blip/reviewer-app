-- ── Daily Check-ins ──────────────────────────────────────
create table if not exists daily_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  checked_in_at date not null default current_date,
  reward_amount numeric not null default 5,
  unique(user_id, checked_in_at)
);

alter table daily_checkins enable row level security;

create policy "Users manage own checkins" on daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trigger: credit wallet on check-in insert
create or replace function handle_checkin_reward()
returns trigger as $$
begin
  update profiles
    set wallet_balance = wallet_balance + new.reward_amount
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_daily_checkin on daily_checkins;
create trigger on_daily_checkin
  after insert on daily_checkins
  for each row execute procedure handle_checkin_reward();
