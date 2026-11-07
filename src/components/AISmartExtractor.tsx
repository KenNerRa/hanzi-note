import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Check,
  Brush,
  Camera,
  KeyRound,
  CheckSquare,
  Square,
  BookmarkCheck,
  Lightbulb,
  Loader2,
  Eraser,
} from 'lucide-react';
import type {
  AIExtractionResult,
  ExtractedVocabCandidate,
  HskLevel,
  VocabItem,
  VoiceAccent,
} from '../types/vocab';
import { analyzeChineseWithAI, getSavedGeminiKey } from '../services/ai';
import {
  compressImageFile,
  speakChinese,
  toTraditional,
} from '../utils/chinese';

interface AISmartExtractorProps {
  accent: VoiceAccent;
  existingVocab: VocabItem[];
  onSaveBatch: (newItems: VocabItem[]) => Promise<void>;
  onInspectStroke: (simp: string, trad: string, py: string, meaning: string) => void;
  onOpenSettings: () => void;
}

const HSK_COLORS: Record<string, string> = {
  'HSK 1': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'HSK 2': 'bg-teal-100 text-teal-800 border-teal-300',
  'HSK 3': 'bg-blue-100 text-blue-800 border-blue-300',
  'HSK 4': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'HSK 5': 'bg-purple-100 text-purple-800 border-purple-300',
  'HSK 6': 'bg-rose-100 text-rose-800 border-rose-300',
  'นอก HSK / น่ารู้': 'bg-amber-100 text-amber-800 border-amber-300',
};

const HSK_OPTIONS: HskLevel[] = [
  'HSK 1',
  'HSK 2',
  'HSK 3',
  'HSK 4',
  'HSK 5',
  'HSK 6',
  'นอก HSK / น่ารู้',
];

const SAMPLE_INPUTS = [
  {
    text: '虽然汉字很难，但是我觉得很有意思，准备明年去参加考试。',
    label: 'ประโยคบทเรียน (HSK 2-3)',
  },
  {
    text: '快点儿吧，要不然来不及了，原来今天人这么多！',
    label: 'ประโยคชีวิตประจำวัน (HSK 3-4)',
  },
  {
    text: '我对中国历史很感兴趣，决定明年去留学。',
    label: 'ประโยคสนทนา (HSK 3)',
  },
];

export const AISmartExtractor: React.FC<AISmartExtractorProps> = ({
  accent,
  existingVocab,
  onSaveBatch,
  onInspectStroke,
  onOpenSettings,
}) => {
  const [inputText, setInputText] = useState(
    '虽然汉字很难，但是我觉得很有意思，准备明年去参加考试。'
  );
  const [imageBase64, setImageBase64] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIExtractionResult | null>(null);
  const [usedAI, setUsedAI] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>();
  const [sentenceMeaning, setSentenceMeaning] = useState('');
  const [candidates, setCandidates] = useState<ExtractedVocabCandidate[]>([]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [savedSuccessCount, setSavedSuccessCount] = useState<number | null>(null);

  const hasGeminiKey = Boolean(getSavedGeminiKey());

  const handleAnalyze = async (customText?: string) => {
    const targetText = customText !== undefined ? customText : inputText;
    if (!targetText.trim() && !imageBase64) return;

    setIsAnalyzing(true);
    setSavedSuccessCount(null);
    setAiError(undefined);

    const { result, usedAI: isAiUsed, error } = await analyzeChineseWithAI(
      targetText,
      imageBase64 || undefined
    );

    setAnalysis(result);
    setSentenceMeaning(result.original_meaning);
    setCandidates(result.words);
    setUsedAI(isAiUsed);
    setAiError(error);
    setIsAnalyzing(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file);
    setImageBase64(compressed);
  };

  const toggleSelectCandidate = (idx: number) => {
    setCandidates((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, selected: !c.selected } : c))
    );
  };

  const updateCandidateField = (
    idx: number,
    field: keyof ExtractedVocabCandidate,
    value: string
  ) => {
    setCandidates((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const selectedCount = candidates.filter((c) => c.selected).length;

  const handleSaveSelectedToDeck = async () => {
    if (!analysis || selectedCount === 0) return;
    setIsSavingBatch(true);

    const userSentenceExample = {
      id: crypto.randomUUID(),
      chinese: analysis.original_simplified,
      traditional: analysis.original_traditional,
      pinyin: analysis.original_pinyin,
      meaning: sentenceMeaning.trim() || 'ประโยคตัวอย่างที่คุณใส่เข้ามา',
      is_user_context: true,
    };

    const itemsToSave: VocabItem[] = candidates
      .filter((c) => c.selected && c.simplified.trim())
      .map((c) => {
        const examples = [userSentenceExample];
        if (
          c.extra_example?.chinese &&
          c.extra_example.chinese !== analysis.original_simplified
        ) {
          examples.push({
            id: crypto.randomUUID(),
            chinese: c.extra_example.chinese,
            traditional: toTraditional(c.extra_example.chinese),
            pinyin: c.extra_example.pinyin,
            meaning: c.extra_example.meaning,
            is_user_context: false,
          });
        }

        // ถ้าเคยมีคำนี้ในคลังอยู่แล้ว ให้เอาข้อมูลเก่ามาอัปเดตและเพิ่มประโยคตัวอย่างที่เราเพิ่งเจอเข้าไป!
        const existing = existingVocab.find(
          (v) => v.simplified === c.simplified
        );

        if (existing) {
          const hasSameSentence = existing.examples?.some(
            (ex) => ex.chinese === userSentenceExample.chinese
          );
          return {
            ...existing,
            category: c.hsk_level || existing.category,
            mnemonic: c.mnemonic || existing.mnemonic,
            examples: hasSameSentence
              ? existing.examples
              : [userSentenceExample, ...(existing.examples || [])],
            updated_at: new Date().toISOString(),
          };
        }

        return {
          id: crypto.randomUUID(),
          simplified: c.simplified,
          traditional: c.traditional,
          pinyin: c.pinyin,
          meaning: c.meaning,
          category: c.hsk_level,
          location_note: c.part_of_speech,
          mnemonic: c.mnemonic,
          image_url: imageBase64 || '',
          examples,
          srs_level: 0,
          next_review: new Date().toISOString(),
          review_count: 0,
          is_starred: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

    await onSaveBatch(itemsToSave);
    setIsSavingBatch(false);
    setSavedSuccessCount(itemsToSave.length);
  };

  return (
    <div className="space-y-4">
      {/* Top Input Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600" />
              ส่งประโยคหรือคำศัพท์ให้ AI แยกคำตาม HSK
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              วางประโยคจากบทเรียน ซีรีส์ หรือคำศัพท์ที่เจอ ระบบจะดึงคำศัพท์น่าทบทวน จัดระดับ HSK และผูกประโยคที่คุณใส่ไว้ใช้ทบทวนอัตโนมัติ
            </p>
          </div>

          <button
            onClick={onOpenSettings}
            className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 border transition ${
              hasGeminiKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            {hasGeminiKey ? 'Gemini AI พร้อมใช้' : 'ใส่คีย์ Gemini AI (ฟรี)'}
          </button>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="วางประโยคภาษาจีน หรือคำศัพท์ที่เจอที่นี่ เช่น 虽然汉字很难，但是我觉得很有意思..."
            className="w-full text-lg sm:text-xl font-bold bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 placeholder:text-slate-300 placeholder:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {inputText && (
            <button
              onClick={() => {
                setInputText('');
                setAnalysis(null);
              }}
              className="absolute top-3 right-3 text-xs text-slate-400 hover:text-rose-600 bg-white/80 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1"
            >
              <Eraser className="w-3 h-3" /> ล้าง
            </button>
          )}
        </div>

        {/* Sample Sentences + Photo Attachment */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">
              ลองกดประโยคตัวอย่าง:
            </span>
            {SAMPLE_INPUTS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setInputText(sample.text);
                  handleAnalyze(sample.text);
                }}
                className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 px-2.5 py-1 rounded-full transition font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <label className="text-xs flex items-center gap-1.5 text-slate-600 hover:text-rose-600 cursor-pointer bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-xl font-medium transition">
            <Camera className="w-3.5 h-3.5" />
            <span>{imageBase64 ? 'เปลี่ยนรูปภาพ' : 'แนบรูปบทเรียน/ป้าย'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        </div>

        {imageBase64 && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-36 bg-slate-900 flex items-center justify-center">
            <img
              src={imageBase64}
              alt="Uploaded context"
              className="object-contain max-h-36"
            />
            <button
              onClick={() => setImageBase64('')}
              className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full"
            >
              ลบรูป
            </button>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={() => handleAnalyze()}
          disabled={isAnalyzing || (!inputText.trim() && !imageBase64)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังแยกคำศัพท์และวิเคราะห์ระดับ HSK...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              แยกคำศัพท์น่าทบทวน & จัดระดับ HSK
            </>
          )}
        </button>
      </div>

      {/* Analysis Result Section */}
      {analysis && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 1. Original Context Sentence Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                📌 ประโยคต้นฉบับของคุณ (จะถูกผูกเป็นตัวอย่างให้ทุกคำที่บันทึก)
              </span>
              <button
                onClick={() => speakChinese(analysis.original_simplified, accent)}
                className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1 transition"
              >
                <Volume2 className="w-3.5 h-3.5" /> ฟังทั้งประโยค
              </button>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-bold tracking-wide">
                {analysis.original_simplified}
              </div>
              {analysis.original_traditional !== analysis.original_simplified && (
                <div className="text-sm text-amber-300 font-medium mt-0.5">
                  ตัวเต็ม: {analysis.original_traditional}
                </div>
              )}
              <div className="text-sm text-rose-300 font-medium mt-1">
                {analysis.original_pinyin}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">
                คำแปลประโยคของคุณ (แก้ไขหรือพิมพ์เพิ่มได้):
              </label>
              <input
                type="text"
                value={sentenceMeaning}
                onChange={(e) => setSentenceMeaning(e.target.value)}
                placeholder="พิมพ์คำแปลของประโยคนี้ (หรือใช้ Gemini AI แปลให้อัตโนมัติ)..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {!usedAI && (
              <div className="text-[11px] text-amber-200/90 bg-white/5 px-3 py-2 rounded-xl flex items-center justify-between gap-2">
                <span>
                  💡 ตอนนี้ใช้โหมดแยกคำ HSK ในเครื่อง หากต้องการให้ AI แปลทุกคำและแต่งประโยคเสริมอัตโนมัติ กดใส่ Gemini API Key ฟรีได้เลยครับ
                </span>
                <button
                  onClick={onOpenSettings}
                  className="shrink-0 underline font-semibold text-amber-300"
                >
                  ตั้งค่า AI Key
                </button>
              </div>
            )}
            {aiError && (
              <div className="text-xs text-rose-300 bg-rose-950/50 px-3 py-1.5 rounded-xl">
                หมายเหตุ AI: {aiError}
              </div>
            )}
          </div>

          {/* 2. Extracted Words List */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  คำศัพท์ที่ดึงออกมาจากประโยค ({candidates.length} คำ)
                </h3>
                <p className="text-xs text-slate-500">
                  ติ๊กเลือกคำที่คุณยังไม่แม่นหรืออยากเก็บไว้ทบทวน (แก้ไขคำแปลหรือระดับ HSK ได้เลย)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCandidates((prev) =>
                      prev.map((c) => ({ ...c, selected: true }))
                    )
                  }
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  เลือกทั้งหมด
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setCandidates((prev) =>
                      prev.map((c) => ({ ...c, selected: false }))
                    )
                  }
                  className="text-xs text-slate-500 hover:underline font-medium"
                >
                  ยกเลิกทั้งหมด
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {candidates.map((word, idx) => {
                const alreadyInDeck = existingVocab.some(
                  (v) => v.simplified === word.simplified
                );
                const hskBadgeStyle =
                  HSK_COLORS[word.hsk_level] || HSK_COLORS['HSK 3'];

                return (
                  <div
                    key={`${word.simplified}-${idx}`}
                    className={`rounded-2xl border-2 p-4 transition ${
                      word.selected
                        ? 'border-rose-500/80 bg-rose-50/20'
                        : 'border-slate-200 bg-slate-50/50 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Checkbox + Word + Pinyin */}
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectCandidate(idx)}
                          className="mt-1 text-rose-600 focus:outline-none"
                        >
                          {word.selected ? (
                            <CheckSquare className="w-5 h-5 fill-rose-600 text-white" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-baseline gap-2.5 flex-wrap">
                            <span className="text-2xl font-bold text-slate-900">
                              {word.simplified}
                            </span>
                            {word.traditional !== word.simplified && (
                              <span className="text-base font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                เต็ม: {word.traditional}
                              </span>
                            )}
                            <span className="text-sm font-bold text-rose-600">
                              {word.pinyin}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <select
                              value={word.hsk_level}
                              onChange={(e) =>
                                updateCandidateField(
                                  idx,
                                  'hsk_level',
                                  e.target.value
                                )
                              }
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer ${hskBadgeStyle}`}
                            >
                              {HSK_OPTIONS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl}
                                </option>
                              ))}
                            </select>

                            <span className="text-xs text-slate-500">
                              {word.part_of_speech}
                            </span>

                            {alreadyInDeck && (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                มีในคลังแล้ว (จะเพิ่มประโยคนี้เข้าไป)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Audio + Stroke */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => speakChinese(word.simplified, accent)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          title="ฟังเสียงอ่าน"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onInspectStroke(
                              word.simplified,
                              word.traditional,
                              word.pinyin,
                              word.meaning
                            )
                          }
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="ดูลำดับขีดและฝึกเขียน"
                        >
                          <Brush className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Meaning & Mnemonic Editable Inputs */}
                    <div className="mt-3 pl-8 space-y-2">
                      <div>
                        <input
                          type="text"
                          value={word.meaning}
                          onChange={(e) =>
                            updateCandidateField(idx, 'meaning', e.target.value)
                          }
                          placeholder="คำแปลภาษาไทย..."
                          className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      {word.mnemonic && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-100">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{word.mnemonic}</span>
                        </div>
                      )}

                      {word.extra_example && (
                        <div className="text-xs text-slate-600 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200/70">
                          <span className="font-semibold text-slate-700">
                            ตัวอย่างเสริม:{' '}
                          </span>
                          {word.extra_example.chinese} ({word.extra_example.meaning})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Selected Button */}
            {savedSuccessCount !== null ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Check className="w-5 h-5 text-emerald-600" />
                  บันทึก {savedSuccessCount} คำศัพท์ พร้อมประโยคของคุณเข้าคลังทบทวนเรียบร้อยแล้ว!
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSavingBatch || selectedCount === 0}
                onClick={handleSaveSelectedToDeck}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
              >
                <BookmarkCheck className="w-5 h-5 text-amber-400" />
                {isSavingBatch
                  ? 'กำลังบันทึกเข้าคลัง...'
                  : `บันทึกคำที่เลือก (${selectedCount} คำ) พร้อมประโยคนี้เข้าคลังทบทวน`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
