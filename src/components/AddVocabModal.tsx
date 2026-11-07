import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Camera,
  BookOpen,
  Lightbulb,
  Volume2,
  Check,
  Star,
  Tag,
} from 'lucide-react';
import type { ExampleSentence, HskLevel, VocabItem, VoiceAccent } from '../types/vocab';
import {
  generatePinyin,
  toSimplified,
  toTraditional,
  speakChinese,
  compressImageFile,
} from '../utils/chinese';

interface AddVocabModalProps {
  initialItem?: VocabItem | null;
  accent: VoiceAccent;
  onSave: (item: VocabItem) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: HskLevel[] = [
  'HSK 1',
  'HSK 2',
  'HSK 3',
  'HSK 4',
  'HSK 5',
  'HSK 6',
  'นอก HSK / น่ารู้',
];

const QUICK_TAGS = [
  'คำนาม (名词)',
  'คำกริยา (动词)',
  'คำคุณศัพท์ (形容词)',
  'คำวิเศษณ์ (副词)',
  'ไวยากรณ์ (语法)',
  'สำนวน/วลี (短语)',
];

export const AddVocabModal: React.FC<AddVocabModalProps> = ({
  initialItem,
  accent,
  onSave,
  onClose,
}) => {
  const [inputChinese, setInputChinese] = useState(initialItem?.simplified || '');
  const [simplified, setSimplified] = useState(initialItem?.simplified || '');
  const [traditional, setTraditional] = useState(initialItem?.traditional || '');
  const [pinyin, setPinyin] = useState(initialItem?.pinyin || '');
  const [meaning, setMeaning] = useState(initialItem?.meaning || '');
  const [category, setCategory] = useState<string>(
    initialItem?.category || 'HSK 3'
  );
  const [locationNote, setLocationNote] = useState(initialItem?.location_note || '');
  const [mnemonic, setMnemonic] = useState(initialItem?.mnemonic || '');
  const [imageUrl, setImageUrl] = useState(initialItem?.image_url || '');
  const [isStarred, setIsStarred] = useState(initialItem?.is_starred ?? false);
  const [examples, setExamples] = useState<ExampleSentence[]>(
    initialItem?.examples?.length ? initialItem.examples : []
  );
  const [autoConvert, setAutoConvert] = useState(!initialItem);
  const [isSaving, setIsSaving] = useState(false);

  // เมื่อพิมพ์ตัวจีนหลัก (ไม่ว่าจะพิมพ์ตัวย่อหรือตัวเต็ม) ให้แปลงทั้งตัวย่อ ตัวเต็ม และพินอินอัตโนมัติ
  useEffect(() => {
    if (!autoConvert) return;
    const simp = toSimplified(inputChinese);
    const trad = toTraditional(inputChinese);
    const py = generatePinyin(simp);
    setSimplified(simp);
    setTraditional(trad);
    setPinyin(py);
  }, [inputChinese, autoConvert]);

  const handleChineseInputChange = (val: string) => {
    setInputChinese(val);
    if (!autoConvert) {
      setSimplified(toSimplified(val));
      setTraditional(toTraditional(val));
      setPinyin(generatePinyin(val));
    }
  };

  const handleAppendQuickTag = (tag: string) => {
    setLocationNote((prev) => {
      if (!prev.trim()) return tag;
      if (prev.includes(tag)) return prev;
      return `${tag} • ${prev}`;
    });
  };

  const handleAddExample = () => {
    setExamples((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        chinese: '',
        traditional: '',
        pinyin: '',
        meaning: '',
      },
    ]);
  };

  const handleExampleChange = (
    id: string,
    field: keyof ExampleSentence,
    value: string
  ) => {
    setExamples((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        if (field === 'chinese') {
          const simp = toSimplified(value);
          const trad = toTraditional(value);
          const py = generatePinyin(simp);
          return {
            ...ex,
            chinese: simp,
            traditional: trad,
            pinyin: py,
          };
        }
        return { ...ex, [field]: value };
      })
    );
  };

  const handleRemoveExample = (id: string) => {
    setExamples((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simplified.trim() || !meaning.trim()) return;

    setIsSaving(true);
    const validExamples = examples.filter((ex) => ex.chinese.trim() !== '');

    const newItem: VocabItem = {
      id: initialItem?.id || crypto.randomUUID(),
      simplified: simplified.trim(),
      traditional: traditional.trim() || toTraditional(simplified.trim()),
      pinyin: pinyin.trim() || generatePinyin(simplified.trim()),
      meaning: meaning.trim(),
      category: category.trim() || 'คำศัพท์ทั่วไป',
      location_note: locationNote.trim(),
      mnemonic: mnemonic.trim(),
      image_url: imageUrl,
      examples: validExamples,
      srs_level: initialItem?.srs_level ?? 0,
      next_review: initialItem?.next_review || new Date().toISOString(),
      review_count: initialItem?.review_count ?? 0,
      is_starred: isStarred,
      created_at: initialItem?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await onSave(newItem);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-lg">
              {initialItem ? 'แก้ไขคำศัพท์ภาษาจีน' : 'จดคำศัพท์ภาษาจีนใหม่'}
            </h2>
            <p className="text-xs text-rose-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              พิมพ์จีนแค่ช่องเดียว ระบบแปลงตัวย่อ/ตัวเต็ม/พินอินให้อัตโนมัติ
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsStarred(!isStarred)}
              className={`p-1.5 rounded-full transition ${
                isStarred
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title="ติดดาวคำสำคัญ / คำที่จำยาก"
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* ช่องพิมพ์ตัวจีนหลัก (Quick Input) */}
          <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-rose-800">
                คำศัพท์ หรือ สำนวนภาษาจีน (พิมพ์ตัวย่อหรือตัวเต็มก็ได้) *
              </label>
              {simplified && (
                <button
                  type="button"
                  onClick={() => speakChinese(simplified, accent)}
                  className="text-xs flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium bg-white px-2.5 py-1 rounded-full shadow-2xs border border-rose-100"
                >
                  <Volume2 className="w-3.5 h-3.5" /> ฟังเสียง
                </button>
              )}
            </div>

            <input
              type="text"
              required
              value={inputChinese}
              onChange={(e) => handleChineseInputChange(e.target.value)}
              placeholder="เช่น 差不多, 原来, 来不及, 買 / 賣..."
              className="w-full text-2xl font-bold bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-300 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            {/* ผลลัพธ์ Auto-convert: ตัวย่อ / ตัวเต็ม / พินอิน (แก้ไขเองได้ถ้าต้องการ) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  จีนตัวย่อ (简体)
                </label>
                <input
                  type="text"
                  value={simplified}
                  onChange={(e) => {
                    setAutoConvert(false);
                    setSimplified(e.target.value);
                  }}
                  className="w-full text-base font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  จีนตัวเต็ม (繁體)
                </label>
                <input
                  type="text"
                  value={traditional}
                  onChange={(e) => {
                    setAutoConvert(false);
                    setTraditional(e.target.value);
                  }}
                  className="w-full text-base font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                พินอิน (Pinyin - แปลงอัตโนมัติ แก้ไขได้)
              </label>
              <input
                type="text"
                value={pinyin}
                onChange={(e) => {
                  setAutoConvert(false);
                  setPinyin(e.target.value);
                }}
                placeholder="chà bu duō"
                className="w-full text-sm font-medium bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-rose-700"
              />
            </div>
          </div>

          {/* คำแปลภาษาไทย */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              ความหมาย / คำแปลภาษาไทย *
            </label>
            <input
              type="text"
              required
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="เช่น พอๆ กัน / เกือบจะ, ที่แท้ก็..., ไปไม่ทันแล้ว"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* หมวดหมู่ (เลือกจากปุ่ม หรือพิมพ์เองก็ได้) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1.5">
              <span>หมวดหมู่คำศัพท์</span>
              <span className="text-[11px] font-normal text-slate-400">
                เลือกด้านล่างหรือพิมพ์หมวดหมู่เองได้
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition border ${
                    category === cat
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="หรือพิมพ์หมวดหมู่เอง เช่น บทที่ 5, HSK4, ศัพท์ธุรกิจ..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* ที่มา / บทเรียน / ชนิดของคำ & เทคนิคช่วยจำ */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                ที่มา / ชนิดของคำ / บริบทการใช้
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAppendQuickTag(tag)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition flex items-center gap-0.5"
                  >
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                placeholder="เช่น บทที่ 3 หนังสือเรียน, ใช้พูดตอนปฏิเสธ, เจอในซีรีส์/ป้าย"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                เทคนิคช่วยจำ (Mnemonic) / แยกส่วนประกอบอักษร / คำที่มักจำสลับ
              </label>
              <input
                type="text"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="เช่น 休 = คน(亻)พิงต้นไม้(木)พักผ่อน, ระวังสับสนกับคำว่า..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* แนบรูปประกอบ (หน้าหนังสือ / สไลด์เรียน / รูปป้าย) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                รูปประกอบช่วยจำ (ถ่ายหน้าหนังสือเรียน / ชีทสรุป / รูปภาพ)
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-rose-500 text-[11px] hover:underline"
                >
                  ลบรูปภาพ
                </button>
              )}
            </label>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-40 bg-slate-100 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Vocab attachment"
                  className="object-contain max-h-40 w-full"
                />
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-rose-400 rounded-xl py-2.5 px-4 cursor-pointer bg-slate-50/50 hover:bg-rose-50/30 transition text-xs text-slate-500">
                <Camera className="w-4 h-4 text-slate-400" />
                <span>กดเพื่อแนบรูปภาพประกอบหรือถ่ายรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* ประโยคตัวอย่าง (Examples) */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-800">
                ประโยคตัวอย่าง ({examples.length})
              </label>
              <button
                type="button"
                onClick={handleAddExample}
                className="text-xs flex items-center gap-1 font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มประโยคตัวอย่าง
              </button>
            </div>

            {examples.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                ยังไม่มีประโยคตัวอย่าง กดปุ่ม "+ เพิ่มประโยคตัวอย่าง" ด้านบนได้เลย (สร้างพินอินและตัวเต็มให้อัตโนมัติ)
              </p>
            )}

            <div className="space-y-3">
              {examples.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      ประโยคที่ {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(ex.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={ex.chinese}
                    onChange={(e) =>
                      handleExampleChange(ex.id, 'chinese', e.target.value)
                    }
                    placeholder="พิมพ์ประโยคภาษาจีน เช่น 这两个词的意思差不多。"
                    className="w-full text-sm font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />

                  {ex.traditional && ex.traditional !== ex.chinese && (
                    <div className="text-[11px] text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded">
                      ตัวเต็ม: <span className="font-semibold">{ex.traditional}</span>
                    </div>
                  )}

                  <input
                    type="text"
                    value={ex.pinyin}
                    onChange={(e) =>
                      handleExampleChange(ex.id, 'pinyin', e.target.value)
                    }
                    placeholder="พินอิน (สร้างอัตโนมัติ)"
                    className="w-full text-xs text-rose-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1"
                  />

                  <input
                    type="text"
                    value={ex.meaning}
                    onChange={(e) =>
                      handleExampleChange(ex.id, 'meaning', e.target.value)
                    }
                    placeholder="คำแปลประโยค เช่น คำสองคำนี้ความหมายพอๆ กันเลย"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-2 py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกคำศัพท์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
