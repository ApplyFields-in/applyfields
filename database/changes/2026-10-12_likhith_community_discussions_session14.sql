-- Why: Session 14 — Community Discussions, Q&A, Admit Card / Result Threads, Report + Moderation
-- Provisions community_threads, community_comments, community_upvotes and triggers for stats.

-- 1. Community Threads
create table if not exists community_threads (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid references opportunities(id) on delete set null,
  category        text not null default 'general', -- general, admit_card, exam_prep, syllabus, result, counselling
  user_id         uuid references users(id) on delete set null,
  author_name     text not null,
  title           text not null,
  content         text not null,
  is_pinned       boolean not null default false,
  is_locked       boolean not null default false,
  is_hidden       boolean not null default false,
  view_count      integer not null default 0,
  upvotes_count   integer not null default 0,
  replies_count   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table community_threads is 'Discussion threads linked to jobs/exams or general guidance topics.';

-- 2. Community Comments / Replies
create table if not exists community_comments (
  id                  uuid primary key default gen_random_uuid(),
  thread_id           uuid not null references community_threads(id) on delete cascade,
  user_id             uuid references users(id) on delete set null,
  author_name         text not null,
  parent_comment_id   uuid references community_comments(id) on delete cascade,
  content             text not null,
  upvotes_count       integer not null default 0,
  is_official_answer  boolean not null default false,
  is_hidden           boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table community_comments is 'Responses, answers and Q&A comments on community discussion threads.';

-- 3. Community Upvotes
create table if not exists community_upvotes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  thread_id   uuid references community_threads(id) on delete cascade,
  comment_id  uuid references community_comments(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint unique_user_thread_upvote unique (user_id, thread_id),
  constraint unique_user_comment_upvote unique (user_id, comment_id),
  constraint upvote_target_check check (
    (thread_id is not null and comment_id is null) or
    (thread_id is null and comment_id is not null)
  )
);

-- 4. Indexes for rapid lookups and opportunity linking
create index if not exists idx_community_threads_opp on community_threads(opportunity_id, created_at desc);
create index if not exists idx_community_threads_cat on community_threads(category, created_at desc);
create index if not exists idx_community_threads_user on community_threads(user_id);
create index if not exists idx_community_comments_thread on community_comments(thread_id, created_at asc);
create index if not exists idx_community_comments_parent on community_comments(parent_comment_id);
create index if not exists idx_community_upvotes_thread on community_upvotes(thread_id);
create index if not exists idx_community_upvotes_comment on community_upvotes(comment_id);

-- 5. Auto-sync trigger for reply counts
create or replace function trg_community_comments_count_sync()
returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update community_threads
    set replies_count = replies_count + 1,
        updated_at = now()
    where id = new.thread_id;
    return new;
  elsif tg_op = 'DELETE' then
    update community_threads
    set replies_count = greatest(0, replies_count - 1),
        updated_at = now()
    where id = old.thread_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_community_comments_count on community_comments;
create trigger trg_community_comments_count
after insert or delete on community_comments
for each row execute function trg_community_comments_count_sync();
