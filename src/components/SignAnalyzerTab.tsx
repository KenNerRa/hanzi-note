import React, { useState } from 'react';
import {
  Volume2,
  BookmarkPlus,
  Brush,
  Sparkles,
  Copy,
  Check,
  Eraser,
} from 'lucide-react';
import type { VoiceAccent } from '../types/vocab';
import {
  analyzeCharacters,
  generatePinyin,
  getToneBadgeColor,
  getToneColorClass,
  speakChinese,
  toSimplified,
  toTraditional,
} from '../utils/chinese';

interface SignAnalyzerTabProps {
  accent: VoiceAccent;
  useToneColors: boolean;
  onSaveAsVocab: (text: string) => void;
  onInspectStroke: (simp: string, trad: string, py: string) => void;
}

const SAMPLE_SENTENCES = [
  { text: '熟能生巧', label: 'ฝึกฝนบ่อยๆ จนชำนาญ' },
  { text: '千里之行，始于足下', label: 'หนทางพันลี้เริ่มที่ก้าวแรก' },
  { text: '不好意思，让你久等了', label: 'ขอโทษที่ทำให้รอนาน' },
  { text: '请问可以刷卡吗？', label: 'รูดบัตรได้ไหมครับ?' },
  { text: '我对中文很感兴趣', label: 'ฉันสนใจภาษาจีนมาก' },
];

export const SignAnalyzerTab: React.FC<SignAnalyzerTabProps> = ({
  accent,
  useToneColors,
  onSaveAsVocab,
  onInspectStroke,
}) => {
  const [inputText, setInputText] = useState('我对学习中文很感兴趣');
  const [copied, setCopied] = useState(false);

  const simpText = toSimplified(inputText);
  const tradText = toTraditional(inputText);
  const fullPinyin = generatePinyin(simpText);
  const chars = analyzeCharacters(simpText, tradText);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${simpText} (${tradText}) - ${fullPinyin}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              เครื่องมือแกะประโยค & แปลงพินอิน/ตัวเต็มด่วน
            </h2>
            <p className="text-xs text-slate-500">
              วางประโยคจากบทเรียน ซีรีส์ หรือข้อความที่ไม่แน่ใจคำอ่าน เพื่อดูพินอิน ตัวเต็ม-ตัวย่อ และแยกดูทีละตัวอักษร
            </p>
          </div>
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-50"
            >
              <Eraser className="w-3.5 h-3.5" /> ล้าง
            </button>
          )}
        </div>

        {/* Textarea Input */}
        <textarea
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="พิมพ์หรือวางคำศัพท์/ประโยคภาษาจีนที่นี่..."
          className="w-full text-xl font-bold bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
        />

        {/* Quick Sample Sentence Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium mr-1">
            ตัวอย่างประโยค/สำนวน:
          </span>
          {SAMPLE_SENTENCES.map((s) => (
            <button
              key={s.text}
              onClick={() => setInputText(s.text)}
              className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 px-2.5 py-1 rounded-full transition font-medium"
            >
              {s.text} <span className="text-[10px] text-slate-400">({s.label})</span>
            </button>
          ))}
        </div>

        {/* Decoded Result Box */}
        {inputText.trim() && (
          <div className="bg-gradient-to-b from-rose-50/50 to-amber-50/30 border border-rose-200/70 rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/50 pb-3">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-slate-500">
                  ตัวย่อ: <strong className="text-slate-900 text-sm">{simpText}</strong>
                  {' • '}
                  ตัวเต็ม: <strong className="text-amber-800 text-sm">{tradText}</strong>
                </div>
                <div className="text-sm font-bold text-rose-600">{fullPinyin}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakChinese(simpText, accent)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Volume2 className="w-4 h-4" /> ฟังเสียงทั้งประโยค
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs"
                  title="คัดลอก"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Character-by-Character Breakdown */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-2">
                แยกทีละตัวอักษร (กดที่ตัวอักษรเพื่อฟังเสียงและฝึกเขียนลำดับขีด):
              </div>
              <div className="flex flex-wrap gap-2">
                {chars.map((c, idx) => {
                  const isChinese = /[\u4e00-\u9fa5]/.test(c.char);
                  if (!isChinese) {
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-center px-1 text-xl font-bold text-slate-400"
                      >
                        {c.char}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        speakChinese(c.char, accent);
                        onInspectStroke(c.char, c.tradChar, c.pinyin);
                      }}
                      className="group bg-white hover:bg-rose-50/60 border border-slate-200 hover:border-rose-300 rounded-2xl p-2.5 min-w-[68px] flex flex-col items-center shadow-2xs transition active:scale-95"
                    >
                      <span className="text-xs font-semibold text-rose-600 mb-0.5">
                        {c.pinyin}
                      </span>
                      <span
                        className={`text-2xl font-bold ${getToneColorClass(
                          c.tone,
                          useToneColors
                        )}`}
                      >
                        {c.char}
                      </span>
                      {c.tradChar !== c.char ? (
                        <span className="text-xs font-bold text-amber-700 mt-0.5 bg-amber-50 px-1.5 rounded">
                          เต็ม: {c.tradChar}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 mt-0.5">
                          ย่อ=เต็ม
                        </span>
                      )}
                      <span
                        className={`mt-1.5 text-[10px] px-1.5 py-0.2 rounded-full border ${getToneBadgeColor(
                          c.tone
                        )}`}
                      >
                        {c.tone ? `เสียง ${c.tone}` : 'เสียงเบา'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => onSaveAsVocab(inputText.trim())}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <BookmarkPlus className="w-4 h-4 text-amber-400" />
                จดคำนี้เข้าสมุดคำศัพท์
              </button>
              <button
                onClick={() =>
                  onInspectStroke(simpText, tradText, fullPinyin)
                }
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Brush className="w-4 h-4 text-rose-600" />
                ดูลำดับขีดเขียน
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
