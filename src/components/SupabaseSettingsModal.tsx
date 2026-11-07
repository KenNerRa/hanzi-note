import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  CloudUpload,
  Download,
  Globe,
  Sparkles,
} from 'lucide-react';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  syncLocalToSupabase,
  getLocalVocab,
} from '../services/db';
import { getSavedGeminiKey, saveGeminiKey } from '../services/ai';

interface SupabaseSettingsModalProps {
  isConnected: boolean;
  onConfigSaved: () => Promise<void>;
  onClose: () => void;
}

const SQL_SCHEMA = `-- วางในเมนู SQL Editor ของ Supabase แล้วกด Run
create table if not exists public.chinese_vocab (
  id uuid primary key default gen_random_uuid(),
  simplified text not null,
  traditional text not null,
  pinyin text not null,
  meaning text not null,
  category text default 'HSK 3',
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

alter table public.chinese_vocab enable row level security;

create policy "Allow full access for personal vocab app"
  on public.chinese_vocab for all using (true) with check (true);`;

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isConnected,
  onConfigSaved,
  onClose,
}) => {
  const initialConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState(initialConfig.url);
  const [anonKey, setAnonKey] = useState(initialConfig.anonKey);
  const [geminiKey, setGeminiKey] = useState(getSavedGeminiKey());
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiKey(geminiKey.trim());
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    await onConfigSaved();
    setSyncMessage('บันทึกคีย์ Gemini AI และฐานข้อมูล Supabase เรียบร้อยแล้ว!');
  };

  const handleSyncToCloud = async () => {
    saveGeminiKey(geminiKey.trim());
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    setIsSyncing(true);
    setSyncMessage('กำลังอัปโหลดคำศัพท์ในเครื่องขึ้น Supabase...');
    const res = await syncLocalToSupabase();
    setIsSyncing(false);
    if (res.error) {
      setSyncMessage(`เกิดข้อผิดพลาด: ${res.error}`);
    } else {
      setSyncMessage(`ซิงค์สำเร็จ! อัปโหลดคำศัพท์ ${res.count} คำขึ้น Supabase แล้ว`);
      await onConfigSaved();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleExportJson = () => {
    const items = getLocalVocab();
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chinese-vocab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">
                ตั้งค่า Gemini AI & ฐานข้อมูล Supabase
              </h3>
              <p className="text-[11px] text-slate-400">
                สถานะฐานข้อมูล:{' '}
                {isConnected ? (
                  <span className="text-emerald-400 font-semibold">
                    เชื่อมต่อ Supabase Cloud แล้ว
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold">
                    โหมดบันทึกในเครื่อง (Local Storage)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* ส่วนที่ 1: Gemini API Key สำหรับแยกคำศัพท์ HSK */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2">
            <div className="font-bold text-rose-900 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-rose-600" />
              1. ตั้งค่า Google Gemini API Key (สำหรับแยกคำศัพท์ HSK อัตโนมัติ)
            </div>
            <p className="text-slate-600 leading-relaxed">
              รับคีย์ฟรีได้ที่{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-rose-600 font-bold underline"
              >
                Google AI Studio (aistudio.google.com)
              </a>{' '}
              หรือตั้งใน Vercel ชื่อ <code className="bg-white px-1 rounded">VITE_GEMINI_API_KEY</code>
            </p>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* ส่วนที่ 2: สร้างตาราง Supabase */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                2. สร้างตารางใน Supabase (ทำครั้งเดียว)
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> คัดลอก SQL แล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> คัดลอกคำสั่ง SQL
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto text-[11px] max-h-28">
              {SQL_SCHEMA}
            </pre>
          </div>

          {/* ส่วนที่ 3: ใส่ Project URL & Anon Key */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800">
              3. ค่าเชื่อมต่อ Supabase (Project Settings → API)
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Anon Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {syncMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                {syncMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
              >
                บันทึกการตั้งค่าทั้งหมด
              </button>
              <button
                type="button"
                disabled={isSyncing || !url || !anonKey}
                onClick={handleSyncToCloud}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                ซิงค์ศัพท์ขึ้น Supabase
              </button>
            </div>
          </div>

          {/* การเชื่อมเข้ากับโดเมน Vercel เดิม */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-amber-950 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-600" />
              วิธีผูกเข้ากับโดเมน LINE LIFF เดิมบน Vercel
            </div>
            <p className="text-slate-600 leading-relaxed">
              หากต้องการเข้าผ่าน{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border text-rose-700">
                line-finance-liff-eight.vercel.app/chinese
              </code>{' '}
              เพียงใส่ใน <code className="font-bold">vercel.json</code> ของโปรเจกต์การเงินเดิม:
            </p>
            <pre className="bg-slate-900 text-amber-300 p-2.5 rounded-xl overflow-x-auto text-[10px]">
{`{
  "rewrites": [
    {
      "source": "/chinese/:match*",
      "destination": "https://ชื่อโปรเจกต์ศัพท์จีนของคุณ.vercel.app/:match*"
    }
  ]
}`}
            </pre>
          </div>

          {/* Backup JSON */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-slate-500">สำรองข้อมูลคำศัพท์เป็นไฟล์ JSON</span>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1 text-slate-700 hover:text-rose-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" /> ดาวน์โหลด JSON
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
