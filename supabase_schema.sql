-- คัดลอก SQL นี้ไปวางในเมนู SQL Editor ของ Supabase แล้วกด Run ได้เลยครับ

create table if not exists public.chinese_vocab (
  id uuid primary key default gen_random_uuid(),
  simplified text not null,
  traditional text not null,
  pinyin text not null,
  meaning text not null,
  category text default 'ป้ายทั่วไป',
  location_note text default '',
  mnemonic text default '',
  image_url text default '',
  examples jsonb default '[]'::jsonb,
  srs_level integer default 0,
  next_review timestamptz default now(),
  review_count integer default 0,
  is_starred boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- เปิดใช้งาน Row Level Security (RLS) และอนุญาตให้อ่าน/เขียนผ่าน Anon Key สำหรับใช้งานส่วนตัว
alter table public.chinese_vocab enable row level security;

create policy "Allow full access for personal vocab app"
  on public.chinese_vocab
  for all
  using (true)
  with check (true);
