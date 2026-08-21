-- Recursive policy drop करो
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_update" on profiles;

-- is_admin check के लिए security definer function (recursion नहीं होगा)
create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- नई non-recursive policies
create policy "profiles_select" on profiles
  for select using (auth.uid() = id or public.is_admin_user());

create policy "profiles_update" on profiles
  for update using (auth.uid() = id);

-- Signup के लिए INSERT policy (ज़रूरी है क्योंकि trigger हटा दिया)
create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);
