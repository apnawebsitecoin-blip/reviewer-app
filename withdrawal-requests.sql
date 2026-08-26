-- ── Withdrawal Requests ──────────────────────────────────
create table if not exists withdrawal_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null check (amount >= 100),
  status text check (status in ('pending','approved','rejected','paid')) default 'pending',
  upi_id text,
  pan_number text,
  bank_account text,
  bank_ifsc text,
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table withdrawal_requests enable row level security;

create policy "Users insert own withdrawal requests" on withdrawal_requests
  for insert with check (auth.uid() = user_id);

create policy "Users or admins select withdrawal requests" on withdrawal_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins update withdrawal requests" on withdrawal_requests
  for update using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Trigger: deduct wallet balance on new request (atomic check)
create or replace function handle_withdrawal_deduction()
returns trigger as $$
begin
  update profiles
    set wallet_balance = wallet_balance - new.amount
  where id = new.user_id
    and wallet_balance >= new.amount;

  if not found then
    raise exception 'Insufficient wallet balance';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_withdrawal_insert on withdrawal_requests;
create trigger on_withdrawal_insert
  before insert on withdrawal_requests
  for each row execute procedure handle_withdrawal_deduction();

-- Trigger: refund wallet on rejection
create or replace function handle_withdrawal_rejection()
returns trigger as $$
begin
  if new.status = 'rejected' and old.status != 'rejected' then
    update profiles
      set wallet_balance = wallet_balance + old.amount
    where id = old.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_withdrawal_status_change on withdrawal_requests;
create trigger on_withdrawal_status_change
  after update on withdrawal_requests
  for each row execute procedure handle_withdrawal_rejection();

-- Trigger: auto-update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_withdrawal_updated_at on withdrawal_requests;
create trigger set_withdrawal_updated_at
  before update on withdrawal_requests
  for each row execute procedure set_updated_at();
