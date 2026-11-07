import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookMarked,
  Layers,
  Sparkles,
  Database,
  Volume2,
  Palette,
  Star,
} from 'lucide-react';
import type {
  DisplayScriptMode,
  VocabItem,
  VoiceAccent,
} from './types/vocab';
import {
  fetchAllVocab,
  upsertVocabItem,
  upsertVocabBatch,
  deleteVocabItem,
} from './services/db';
import { VocabCard } from './components/VocabCard';
import { AddVocabModal } from './components/AddVocabModal';
import { StrokeOrderModal } from './components/StrokeOrderModal';
import { FlashcardReview } from './components/FlashcardReview';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { AISmartExtractor } from './components/AISmartExtractor';

type ActiveTab = 'ai-extract' | 'vocab' | 'review';

export function App() {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & UI Preferences (เปิดมาหน้าแรกเป็น AI แกะคำศัพท์จากประโยคเลย!)
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai-extract');
  const [scriptMode, setScriptMode] = useState<DisplayScriptMode>('both');
  const [accent, setAccent] = useState<VoiceAccent>('zh-CN');
  const [useToneColors, setUseToneColors] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [onlyStarred, setOnlyStarred] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VocabItem | null>(null);
  const [strokeItem, setStrokeItem] = useState<{
    simplified: string;
    traditional: string;
    pinyin: string;
    meaning: string;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await fetchAllVocab();
    setItems(res.items);
    setDataSource(res.source);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(['ทั้งหมด']);
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (onlyStarred && !item.is_starred) return false;
      if (selectedCategory !== 'ทั้งหมด' && item.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.simplified.toLowerCase().includes(q) ||
        item.traditional.toLowerCase().includes(q) ||
        item.pinyin.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.location_note && item.location_note.toLowerCase().includes(q)) ||
        (item.mnemonic && item.mnemonic.toLowerCase().includes(q)) ||
        item.examples?.some(
          (ex) =>
            ex.chinese.includes(q) ||
            ex.meaning.toLowerCase().includes(q) ||
            ex.pinyin.toLowerCase().includes(q)
        )
      );
    });
  }, [items, searchQuery, selectedCategory, onlyStarred]);

  const handleSaveVocab = async (item: VocabItem) => {
    const { savedItem, synced } = await upsertVocabItem(item);
    if (synced) setDataSource('supabase');

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id || x.id === savedItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedItem;
        return next;
      }
      return [savedItem, ...prev];
    });
    setEditingItem(null);
  };

  const handleSaveBatchFromAI = async (newVocabItems: VocabItem[]) => {
    const { allItems, synced } = await upsertVocabBatch(newVocabItems);
    if (synced) setDataSource('supabase');
    setItems(allItems);
  };

  const handleToggleStar = async (item: VocabItem) => {
    const updated = { ...item, is_starred: !item.is_starred };
    await handleSaveVocab(updated);
  };

  const handleDeleteVocab = async (id: string) => {
    if (!window.confirm('ต้องการลบคำศัพท์นี้ใช่ไหมครับ?')) return;
    await deleteVocabItem(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Header Banner */}
      <header className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-xl font-bold border border-white/25 shadow-inner">
                词
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-2">
                  汉字本 Hanzi AI & HSK
                </h1>
                <p className="text-[11px] text-rose-100">
                  ส่งประโยคให้ AI แยกศัพท์ตาม HSK • ย่อ/เต็ม • ทบทวนพร้อมประโยคที่เจอ
                </p>
              </div>
            </div>

            {/* Cloud & AI Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 hover:bg-black/30 text-xs font-medium border border-white/15 transition"
              title="ตั้งค่า Gemini AI & ฐานข้อมูล Supabase"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dataSource === 'supabase' ? 'bg-emerald-400' : 'bg-amber-300'
                }`}
              />
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {dataSource === 'supabase' ? 'Supabase + AI' : 'ตั้งค่า AI / Cloud'}
              </span>
            </button>
          </div>

          {/* Quick Learning Preferences Bar */}
          <div className="mt-3 pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Script Mode Switcher */}
            <div className="flex items-center bg-black/20 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setScriptMode('both')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  scriptMode === 'both'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-rose-100 hover:text-white'
                }`}
              >
                ย่อ+เต็ม
              </button>
              <button
                onClick={() => setScriptMode('simplified')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  scriptMode === 'simplified'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-rose-100 hover:text-white'
                }`}
              >
                简体 (ย่อ)
              </button>
              <button
                onClick={() => setScriptMode('traditional')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  scriptMode === 'traditional'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-rose-100 hover:text-white'
                }`}
              >
                繁體 (เต็ม)
              </button>
            </div>

            {/* Voice Accent & Tone Colors Toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setAccent(accent === 'zh-CN' ? 'zh-TW' : 'zh-CN')
                }
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/20 hover:bg-black/30 text-white border border-white/10 transition"
                title="สลับสำเนียงเสียงอ่าน จีนแผ่นดินใหญ่ / ไต้หวัน"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>{accent === 'zh-CN' ? 'สำเนียงจีน' : 'สำเนียงไต้หวัน'}</span>
              </button>

              <button
                onClick={() => setUseToneColors(!useToneColors)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition ${
                  useToneColors
                    ? 'bg-white/95 text-rose-700 border-white font-semibold'
                    : 'bg-black/20 text-rose-100 border-white/10'
                }`}
                title="เปิด/ปิด สีตามเสียงวรรณยุกต์ 1-4"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>สีวรรณยุกต์</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4">
        {/* Tone Color Legend Pill */}
        {useToneColors && (
          <div className="mb-3 bg-white border border-slate-200/70 rounded-2xl px-3.5 py-2 flex items-center justify-between flex-wrap gap-2 text-[11px] shadow-2xs">
            <span className="text-slate-500 font-medium">
              สีช่วยจำวรรณยุกต์:
            </span>
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-rose-600">● เสียง 1 (ā)</span>
              <span className="text-amber-600">● เสียง 2 (á)</span>
              <span className="text-emerald-600">● เสียง 3 (ǎ)</span>
              <span className="text-blue-600">● เสียง 4 (à)</span>
            </div>
          </div>
        )}

        {/* TAB 1: AI SMART EXTRACTOR (ส่งประโยค/คำศัพท์ให้ AI แยกคำตาม HSK) */}
        {activeTab === 'ai-extract' && (
          <AISmartExtractor
            accent={accent}
            existingVocab={items}
            onSaveBatch={handleSaveBatchFromAI}
            onInspectStroke={(simp, trad, py, meaning) =>
              setStrokeItem({
                simplified: simp,
                traditional: trad,
                pinyin: py,
                meaning,
              })
            }
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* TAB 2: VOCABULARY BOOK (คลังคำศัพท์แยกตาม HSK) */}
        {activeTab === 'vocab' && (
          <div className="space-y-4">
            {/* Search & Add Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาตัวจีน (ย่อ/เต็ม), พินอิน, คำแปล, HSK หรือประโยค..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <button
                onClick={() => setOnlyStarred(!onlyStarred)}
                className={`px-3.5 rounded-2xl border flex items-center gap-1 text-xs font-semibold transition ${
                  onlyStarred
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="แสดงเฉพาะคำที่ติดดาว"
              >
                <Star
                  className={`w-4 h-4 ${
                    onlyStarred ? 'fill-amber-400 text-amber-400' : ''
                  }`}
                />
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                title="เพิ่มคำศัพท์เอง"
              >
                <Plus className="w-4 h-4" /> เพิ่มเอง
              </button>
            </div>

            {/* HSK / Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Vocab List */}
            {isLoading ? (
              <div className="text-center py-12 text-sm text-slate-400">
                กำลังโหลดคลังคำศัพท์...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
                <p className="text-sm font-semibold text-slate-700">
                  ไม่พบคำศัพท์ที่ค้นหา
                </p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  ส่งประโยคให้ AI แยกคำศัพท์เข้าคลัง หรือกดเพิ่มคำศัพท์เองได้เลย
                </p>
                <button
                  onClick={() => setActiveTab('ai-extract')}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> ไปหน้าส่งประโยคให้ AI แยกคำ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <VocabCard
                    key={item.id}
                    item={item}
                    scriptMode={scriptMode}
                    useToneColors={useToneColors}
                    accent={accent}
                    onToggleStar={handleToggleStar}
                    onOpenStroke={(v) =>
                      setStrokeItem({
                        simplified: v.simplified,
                        traditional: v.traditional,
                        pinyin: v.pinyin,
                        meaning: v.meaning,
                      })
                    }
                    onEdit={(v) => {
                      setEditingItem(v);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={handleDeleteVocab}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FLASHCARD REVIEW */}
        {activeTab === 'review' && (
          <FlashcardReview
            items={items}
            scriptMode={scriptMode}
            useToneColors={useToneColors}
            accent={accent}
            onUpdateItem={handleSaveVocab}
            onOpenStroke={(v) =>
              setStrokeItem({
                simplified: v.simplified,
                traditional: v.traditional,
                pinyin: v.pinyin,
                meaning: v.meaning,
              })
            }
          />
        )}
      </main>

      {/* Bottom Navigation Bar (Mobile App Style) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
        <div className="max-w-2xl mx-auto grid grid-cols-3 h-16">
          <button
            onClick={() => setActiveTab('ai-extract')}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
              activeTab === 'ai-extract'
                ? 'text-rose-600'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>AI แยกศัพท์ HSK</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
              activeTab === 'vocab'
                ? 'text-rose-600'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <BookMarked className="w-5 h-5" />
            <span>คลังศัพท์ ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
              activeTab === 'review'
                ? 'text-rose-600'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>ทบทวน (Flashcard)</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {isAddModalOpen && (
        <AddVocabModal
          initialItem={editingItem}
          accent={accent}
          onSave={handleSaveVocab}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {strokeItem && (
        <StrokeOrderModal
          simplified={strokeItem.simplified}
          traditional={strokeItem.traditional}
          pinyin={strokeItem.pinyin}
          meaning={strokeItem.meaning}
          accent={accent}
          onClose={() => setStrokeItem(null)}
        />
      )}

      {isSettingsOpen && (
        <SupabaseSettingsModal
          isConnected={dataSource === 'supabase'}
          onConfigSaved={loadData}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
