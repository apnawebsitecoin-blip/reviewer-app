-- पुराना trigger हटाओ
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Fixed version: search_path set है, error handling है
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_code text;
begin
  ref_code := upper(substring(new.id::text from 1 for 8));
  insert into public.profiles (id, name, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    ref_code
  );
  return new;
exception when others then
  raise log 'handle_new_user error: %', sqlerrm;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
