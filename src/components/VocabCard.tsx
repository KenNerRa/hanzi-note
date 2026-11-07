import React, { useState } from 'react';
import {
  Volume2,
  Star,
  BookOpen,
  Lightbulb,
  Brush,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
} from 'lucide-react';
import type { DisplayScriptMode, VocabItem, VoiceAccent } from '../types/vocab';
import {
  analyzeCharacters,
  getToneColorClass,
  speakChinese,
} from '../utils/chinese';

interface VocabCardProps {
  item: VocabItem;
  scriptMode: DisplayScriptMode;
  useToneColors: boolean;
  accent: VoiceAccent;
  onToggleStar: (item: VocabItem) => void;
  onOpenStroke: (item: VocabItem) => void;
  onEdit: (item: VocabItem) => void;
  onDelete: (id: string) => void;
}

const SRS_BADGES: Record<number, { label: string; color: string }> = {
  0: { label: 'คำใหม่ / ต้องทวน', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  1: { label: 'พอคุ้นๆ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  2: { label: 'จำได้แล้ว', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  3: { label: 'แม่นขึ้นใจ', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const HSK_BADGE_STYLES: Record<string, string> = {
  'HSK 1': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'HSK 2': 'bg-teal-100 text-teal-800 border-teal-300',
  'HSK 3': 'bg-blue-100 text-blue-800 border-blue-300',
  'HSK 4': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'HSK 5': 'bg-purple-100 text-purple-800 border-purple-300',
  'HSK 6': 'bg-rose-100 text-rose-800 border-rose-300',
};

/**
 * ไฮไลต์คำศัพท์เป้าหมายในประโยคตัวอย่าง
 */
function highlightWordInSentence(sentence: string, targetWord: string) {
  if (!targetWord || !sentence.includes(targetWord)) return sentence;
  const parts = sentence.split(targetWord);
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="bg-amber-200/80 text-rose-700 px-1 rounded font-extrabold underline decoration-rose-400">
          {targetWord}
        </span>
      )}
    </React.Fragment>
  ));
}

export const VocabCard: React.FC<VocabCardProps> = ({
  item,
  scriptMode,
  useToneColors,
  accent,
  onToggleStar,
  onOpenStroke,
  onEdit,
  onDelete,
}) => {
  // เปิดแสดงประโยคตัวอย่างตั้งแต่แรกถ้ามีประโยคที่เราส่งเข้ามาเอง
  const [expanded, setExpanded] = useState(true);
  const charInfos = analyzeCharacters(item.simplified, item.traditional);
  const isDiffScript = item.simplified !== item.traditional;
  const srsBadge = SRS_BADGES[Math.min(item.srs_level, 3)] || SRS_BADGES[0];
  const hskStyle =
    HSK_BADGE_STYLES[item.category] ||
    'bg-slate-100 text-slate-700 border-slate-200';

  const handlePlayWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToSpeak =
      scriptMode === 'traditional' ? item.traditional : item.simplified;
    speakChinese(textToSpeak, accent);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Top Section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${hskStyle}`}
            >
              {item.category}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${srsBadge.color}`}
            >
              {srsBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleStar(item)}
              className={`p-1.5 rounded-full transition ${
                item.is_starred
                  ? 'text-amber-400 bg-amber-50'
                  : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
              }`}
              title="ติดดาวคำสำคัญ / คำที่จำยาก"
            >
              <Star className={`w-4 h-4 ${item.is_starred ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => onOpenStroke(item)}
              className="p-1.5 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              title="ดูลำดับขีดและฝึกเขียน"
            >
              <Brush className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="แก้ไขคำศัพท์"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="ลบคำศัพท์"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Chinese Display + Audio */}
        <div className="flex items-baseline justify-between gap-3 mt-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <button
              onClick={() => onOpenStroke(item)}
              className="text-left group focus:outline-none"
              title="กดเพื่อดูลำดับขีดเขียน"
            >
              <div className="text-3xl sm:text-4xl font-bold tracking-wide flex flex-wrap items-baseline gap-0.5">
                {charInfos.map((info, idx) => {
                  const displayChar =
                    scriptMode === 'traditional' ? info.tradChar : info.char;
                  return (
                    <span
                      key={idx}
                      className={`${getToneColorClass(
                        info.tone,
                        useToneColors
                      )} group-hover:underline decoration-rose-300 decoration-2 underline-offset-4`}
                    >
                      {displayChar}
                    </span>
                  );
                })}
              </div>
            </button>

            {scriptMode === 'both' && isDiffScript && (
              <div className="flex items-center gap-1 bg-amber-50/90 border border-amber-200/80 px-2.5 py-0.5 rounded-xl">
                <span className="text-[10px] font-semibold text-amber-700 uppercase">
                  ตัวเต็ม
                </span>
                <span className="text-xl font-bold text-amber-900 tracking-wide">
                  {item.traditional}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handlePlayWord}
            className="w-10 h-10 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 transition active:scale-95 shadow-2xs border border-rose-100"
            title="กดฟังเสียงอ่าน"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Pinyin & Meaning */}
        <div className="mt-2">
          <div className="text-sm font-semibold text-rose-600 tracking-wide">
            {item.pinyin}
          </div>
          <div className="text-base font-semibold text-slate-800 mt-0.5">
            {item.meaning}
          </div>
        </div>

        {/* Part of Speech / Note & Mnemonic */}
        {(item.location_note || item.mnemonic) && (
          <div className="mt-3 space-y-1.5">
            {item.location_note && (
              <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl">
                <BookOpen className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{item.location_note}</span>
              </div>
            )}
            {item.mnemonic && (
              <div className="flex items-start gap-1.5 text-xs text-amber-900 bg-amber-50/60 px-2.5 py-1.5 rounded-xl border border-amber-100">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{item.mnemonic}</span>
              </div>
            )}
          </div>
        )}

        {/* รูปประกอบ (ถ้ามี) */}
        {item.image_url && (
          <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-h-44 bg-slate-900 flex items-center justify-center">
            <img
              src={item.image_url}
              alt={item.simplified}
              className="object-contain max-h-44 w-full"
            />
          </div>
        )}
      </div>

      {/* Example Sentences (Highlighting target word in user's sentence) */}
      {item.examples && item.examples.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <span className="flex items-center gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-rose-500" />
              ประโยคจากที่คุณใส่ & ตัวอย่าง ({item.examples.length})
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expanded && (
            <div className="px-4 pb-3.5 space-y-2">
              {item.examples.map((ex, idx) => {
                const showTradEx =
                  scriptMode === 'traditional' && ex.traditional
                    ? ex.traditional
                    : ex.chinese;
                const targetHighlight =
                  scriptMode === 'traditional'
                    ? item.traditional
                    : item.simplified;

                return (
                  <div
                    key={ex.id || idx}
                    className={`rounded-xl p-3 border shadow-2xs flex items-start justify-between gap-2 ${
                      idx === 0
                        ? 'bg-rose-50/40 border-rose-200/80'
                        : 'bg-white border-slate-200/70'
                    }`}
                  >
                    <div className="space-y-0.5">
                      {idx === 0 && (
                        <span className="inline-block text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.2 rounded-md mb-0.5">
                          📌 ประโยคที่คุณเจอ
                        </span>
                      )}
                      <div className="text-sm font-bold text-slate-900">
                        {highlightWordInSentence(showTradEx, targetHighlight)}
                        {scriptMode === 'both' &&
                          ex.traditional &&
                          ex.traditional !== ex.chinese && (
                            <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              ตัวเต็ม: {ex.traditional}
                            </span>
                          )}
                      </div>
                      <div className="text-xs text-rose-600 font-medium">
                        {ex.pinyin}
                      </div>
                      <div className="text-xs text-slate-600">{ex.meaning}</div>
                    </div>
                    <button
                      onClick={() => speakChinese(showTradEx, accent)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 shrink-0 transition border border-slate-200/60"
                      title="ฟังเสียงอ่านประโยค"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
