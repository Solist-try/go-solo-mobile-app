-- Additive doorway for the Go Solo mobile apps.
-- Run on the same Supabase database as the website, after 0001, 0002, and 0003.
-- Safe to run more than once. It does not replace existing tables.

alter table public.profiles add column if not exists communication_preference text not null default 'contextual';
alter table public.profiles add column if not exists onboarding_step text;
alter table public.profiles add column if not exists taking_space boolean not null default false;
alter table public.profiles add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.profiles
    add constraint profiles_communication_preference_check
    check (communication_preference in ('anyone', 'contextual', 'none'));
exception when duplicate_object then null;
end $$;

alter table public.campfire_posts add column if not exists image_url text;
alter table public.campfire_posts add column if not exists image_alt text;
alter table public.out_there_posts add column if not exists image_alt text;

alter table public.same_partnerships add column if not exists seeker_consent text;
alter table public.same_partnerships add column if not exists partner_consent text;

alter table public.skill_connections add column if not exists status text not null default 'interest';
alter table public.skill_connections add column if not exists reflection text not null default '';

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.seed_supports (
  id uuid primary key default gen_random_uuid(),
  user_seed_id uuid not null references public.user_seeds (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  supporter_id uuid not null references public.profiles (id) on delete cascade,
  note text not null default '',
  status text not null default 'offered',
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  context_type text not null,
  context_id text not null default '',
  context_label text not null default '',
  status text not null default 'request',
  muted_by text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  image_url text,
  image_alt text,
  client_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.session_requests (
  id uuid primary key default gen_random_uuid(),
  context_type text not null,
  context_id text not null,
  member_a uuid not null references public.profiles (id) on delete cascade,
  member_b uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  a_agreed boolean not null default false,
  b_agreed boolean not null default false,
  continuation_a boolean,
  continuation_b boolean,
  continuation_opened boolean not null default false,
  status text not null default 'proposed',
  created_at timestamptz not null default now()
);

create table if not exists public.dismissed_pins (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table if not exists public.push_tokens (
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.seed_supports enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.session_requests enable row level security;
alter table public.dismissed_pins enable row level security;
alter table public.push_tokens enable row level security;

create or replace function public.can_contact(target uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  pref text;
  stepping_back boolean;
begin
  if auth.uid() is null or auth.uid() = target then
    return false;
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = target)
       or (blocker_id = target and blocked_id = auth.uid())
  ) then
    return false;
  end if;

  select communication_preference, taking_space into pref, stepping_back
  from public.profiles where id = target;

  if stepping_back is true or pref = 'none' then
    return false;
  end if;

  if pref = 'anyone' then
    return true;
  end if;

  if exists (
    select 1 from public.seed_supports
    where (owner_id = auth.uid() and supporter_id = target)
       or (owner_id = target and supporter_id = auth.uid())
  ) then
    return true;
  end if;

  if exists (
    select 1 from public.skill_connections
    where (from_user_id = auth.uid() and to_user_id = target)
       or (from_user_id = target and to_user_id = auth.uid())
  ) then
    return true;
  end if;

  if exists (
    select 1 from public.same_partnerships
    where status = 'matched'
      and seeker_consent = 'accepted'
      and partner_consent = 'accepted'
      and (
        (seeker_id = auth.uid() and partner_id = target)
        or (seeker_id = target and partner_id = auth.uid())
      )
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.comments as comment
    join public.campfire_posts as post
      on comment.target_type = 'campfire' and comment.target_id = post.id
    where (comment.author_id = auth.uid() and post.author_id = target)
       or (comment.author_id = target and post.author_id = auth.uid())
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.comments as comment
    join public.out_there_posts as post
      on comment.target_type = 'out-there' and comment.target_id = post.id
    where (comment.author_id = auth.uid() and post.author_id = target)
       or (comment.author_id = target and post.author_id = auth.uid())
  ) then
    return true;
  end if;

  if exists (
    select 1 from public.conversations
    where status = 'accepted'
      and (
        (requester_id = auth.uid() and recipient_id = target)
        or (requester_id = target and recipient_id = auth.uid())
      )
  ) then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.guard_write_rate()
returns trigger
language plpgsql
as $$
declare
  recent integer;
begin
  if tg_table_name = 'conversation_messages' then
    select count(*) into recent from public.conversation_messages
    where author_id = auth.uid() and created_at > now() - interval '1 minute';
    if recent >= 20 then
      raise exception 'too many messages';
    end if;
  elsif tg_table_name = 'reports' then
    select count(*) into recent from public.reports
    where reporter_id = auth.uid() and created_at > now() - interval '1 hour';
    if recent >= 8 then
      raise exception 'too many reports';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_message_rate on public.conversation_messages;
create trigger guard_message_rate
  before insert on public.conversation_messages
  for each row execute function public.guard_write_rate();

drop trigger if exists guard_report_rate on public.reports;
create trigger guard_report_rate
  before insert on public.reports
  for each row execute function public.guard_write_rate();

create or replace function public.agree_session(session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  update public.session_requests
  set
    a_agreed = case when member_a = auth.uid() then true else a_agreed end,
    b_agreed = case when member_b = auth.uid() then true else b_agreed end
  where id = session_id and (member_a = auth.uid() or member_b = auth.uid());

  update public.session_requests
  set status = 'scheduled'
  where id = session_id and a_agreed and b_agreed and status = 'proposed';
end;
$$;

create or replace function public.answer_session_continuation(session_id uuid, agree boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.session_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.session_requests
  set
    continuation_a = case when member_a = auth.uid() then agree else continuation_a end,
    continuation_b = case when member_b = auth.uid() then agree else continuation_b end
  where id = session_id and (member_a = auth.uid() or member_b = auth.uid())
  returning * into row;

  if row.id is null then
    return;
  end if;

  if row.continuation_a is false or row.continuation_b is false then
    update public.session_requests set status = 'completed' where id = row.id;
    return;
  end if;

  if row.continuation_a is true and row.continuation_b is true and row.continuation_opened is false then
    update public.session_requests
    set continuation_opened = true, status = 'completed'
    where id = row.id;
  end if;
end;
$$;

drop policy if exists "members see their blocks" on public.blocks;
create policy "members see their blocks" on public.blocks
  for select to authenticated using (blocker_id = auth.uid());
drop policy if exists "members create blocks" on public.blocks;
create policy "members create blocks" on public.blocks
  for insert to authenticated with check (blocker_id = auth.uid() and blocked_id <> auth.uid());
drop policy if exists "members remove blocks" on public.blocks;
create policy "members remove blocks" on public.blocks
  for delete to authenticated using (blocker_id = auth.uid());

drop policy if exists "members read own reports" on public.reports;
create policy "members read own reports" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists "members file reports" on public.reports;
create policy "members file reports" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid() and length(trim(reason)) >= 8);
drop policy if exists "stewards update reports" on public.reports;
create policy "stewards update reports" on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "members read related support" on public.seed_supports;
create policy "members read related support" on public.seed_supports
  for select to authenticated using (owner_id = auth.uid() or supporter_id = auth.uid());
drop policy if exists "members offer support" on public.seed_supports;
create policy "members offer support" on public.seed_supports
  for insert to authenticated with check (
    supporter_id = auth.uid()
    and owner_id <> auth.uid()
    and exists (
      select 1 from public.user_seeds
      where id = user_seed_id and user_id = owner_id and status = 'active'
    )
  );

drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations" on public.conversations
  for select to authenticated using (requester_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "members request conversations" on public.conversations;
create policy "members request conversations" on public.conversations
  for insert to authenticated with check (
    requester_id = auth.uid()
    and status = 'request'
    and public.can_contact(recipient_id)
  );
drop policy if exists "participants update conversations" on public.conversations;
create policy "participants update conversations" on public.conversations
  for update to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid())
  with check (requester_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "participants read messages" on public.conversation_messages;
create policy "participants read messages" on public.conversation_messages
  for select to authenticated using (
    exists (
      select 1 from public.conversations
      where id = conversation_id and (requester_id = auth.uid() or recipient_id = auth.uid())
    )
  );
drop policy if exists "participants write messages" on public.conversation_messages;
create policy "participants write messages" on public.conversation_messages
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.conversations
      where id = conversation_id
        and (requester_id = auth.uid() or recipient_id = auth.uid())
        and status in ('request', 'accepted', 'space')
    )
  );

drop policy if exists "participants read sessions" on public.session_requests;
create policy "participants read sessions" on public.session_requests
  for select to authenticated using (member_a = auth.uid() or member_b = auth.uid());
drop policy if exists "participants propose sessions" on public.session_requests;
create policy "participants propose sessions" on public.session_requests
  for insert to authenticated with check (
    member_a = auth.uid()
    and a_agreed is true
    and b_agreed is false
    and public.can_contact(member_b)
  );

drop policy if exists "members read own dismissals" on public.dismissed_pins;
create policy "members read own dismissals" on public.dismissed_pins
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "members dismiss pins" on public.dismissed_pins;
create policy "members dismiss pins" on public.dismissed_pins
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "members restore pins" on public.dismissed_pins;
create policy "members restore pins" on public.dismissed_pins
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "members read own push tokens" on public.push_tokens;
create policy "members read own push tokens" on public.push_tokens
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "members save push tokens" on public.push_tokens;
create policy "members save push tokens" on public.push_tokens
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "members remove push tokens" on public.push_tokens;
create policy "members remove push tokens" on public.push_tokens
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "participants update skill exchanges" on public.skill_connections;
create policy "participants update skill exchanges" on public.skill_connections
  for update to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid())
  with check (from_user_id = auth.uid() or to_user_id = auth.uid());

revoke all on function public.can_contact(uuid) from public;
revoke all on function public.agree_session(uuid) from public;
revoke all on function public.answer_session_continuation(uuid, boolean) from public;
grant execute on function public.can_contact(uuid) to authenticated;
grant execute on function public.agree_session(uuid) to authenticated;
grant execute on function public.answer_session_continuation(uuid, boolean) to authenticated;

create or replace function public.guard_session_window()
returns trigger
language plpgsql
as $$
begin
  if new.ends_at <= new.starts_at or new.ends_at > new.starts_at + interval '24 hours' then
    raise exception 'invalid session window';
  end if;
  if tg_op = 'INSERT' and new.starts_at < now() - interval '5 minutes' then
    raise exception 'invalid session window';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_session_window on public.session_requests;
create trigger guard_session_window
  before insert or update on public.session_requests
  for each row execute function public.guard_session_window();

create or replace function public.reject_local_media()
returns trigger
language plpgsql
as $$
begin
  if new.image_url is null or new.image_url = '' then
    return new;
  end if;
  if new.image_url ~* '^(file:|content:|blob:|data:|/)' then
    raise exception 'media must be stored by the server';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_local_campfire_media on public.campfire_posts;
create trigger reject_local_campfire_media
  before insert or update on public.campfire_posts
  for each row execute function public.reject_local_media();

drop trigger if exists reject_local_story_media on public.out_there_posts;
create trigger reject_local_story_media
  before insert or update on public.out_there_posts
  for each row execute function public.reject_local_media();

drop trigger if exists reject_local_message_media on public.conversation_messages;
create trigger reject_local_message_media
  before insert or update on public.conversation_messages
  for each row execute function public.reject_local_media();

insert into storage.buckets (id, name, public)
values ('member-media', 'member-media', false)
on conflict (id) do nothing;

do $$ begin
  create policy "members read member media" on storage.objects
    for select to authenticated
    using (bucket_id = 'member-media');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "members upload their media" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'member-media'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
exception when duplicate_object then null;
end $$;
