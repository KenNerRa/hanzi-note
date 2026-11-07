import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  RotateCcw,
  Eye,
  Brush,
  BookOpen,
  Lightbulb,
  Sparkles,
  Shuffle,
  Star,
  Headphones,
  MessageSquareQuote,
} from 'lucide-react';
import type { DisplayScriptMode, VocabItem, VoiceAccent } from '../types/vocab';
import {
  analyzeCharacters,
  getToneColorClass,
  speakChinese,
} from '../utils/chinese';

interface FlashcardReviewProps {
  items: VocabItem[];
  scriptMode: DisplayScriptMode;
  useToneColors: boolean;
  accent: VoiceAccent;
  onUpdateItem: (item: VocabItem) => Promise<void>;
  onOpenStroke: (item: VocabItem) => void;
}

type ReviewFilter = 'all' | 'due' | 'starred';
type QuizMode = 'hanzi-to-meaning' | 'meaning-to-hanzi' | 'listening';

/**
 * ไฮไลต์คำศัพท์เป้าหมายในประโยคตัวอย่างตอนทบทวน
 */
function highlightWord(sentence: string, targetWord: string, hideTarget = false) {
  if (!targetWord || !sentence.includes(targetWord)) return sentence;
  const parts = sentence.split(targetWord);
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="bg-amber-200 text-rose-700 px-1.5 py-0.5 rounded-md font-extrabold underline decoration-rose-500">
          {hideTarget ? ' [ ? ] ' : targetWord}
        </span>
      )}
    </React.Fragment>
  ));
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  items,
  scriptMode,
  useToneColors,
  accent,
  onUpdateItem,
  onOpenStroke,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [selectedHsk, setSelectedHsk] = useState<string>('ทั้งหมด');
  const [quizMode, setQuizMode] = useState<QuizMode>('hanzi-to-meaning');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [autoSpeakOnReveal, setAutoSpeakOnReveal] = useState(true);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const availableHskLevels = useMemo(() => {
    const set = new Set<string>(['ทั้งหมด']);
    items.forEach((x) => {
      if (x.category) set.add(x.category);
    });
    return Array.from(set);
  }, [items]);

  const deck = useMemo(() => {
    let filtered = [...items];
    if (filter === 'due') {
      filtered = filtered.filter((x) => x.srs_level < 2);
    } else if (filter === 'starred') {
      filtered = filtered.filter((x) => x.is_starred);
    }
    if (selectedHsk !== 'ทั้งหมด') {
      filtered = filtered.filter((x) => x.category === selectedHsk);
    }
    if (shuffleSeed > 0) {
      filtered.sort(() => Math.random() - 0.5);
    }
    return filtered;
  }, [items, filter, selectedHsk, shuffleSeed]);

  const currentCard = deck[currentIndex];

  const handleReveal = () => {
    setIsRevealed(true);
    if (autoSpeakOnReveal && currentCard) {
      const textToSpeak =
        scriptMode === 'traditional'
          ? currentCard.traditional
          : currentCard.simplified;
      speakChinese(textToSpeak, accent);
    }
  };

  const handleRateCard = async (rating: 'again' | 'good' | 'easy') => {
    if (!currentCard) return;

    let newLevel = currentCard.srs_level;
    let nextHours = 4;

    if (rating === 'again') {
      newLevel = 0;
      nextHours = 1;
    } else if (rating === 'good') {
      newLevel = Math.min(currentCard.srs_level + 1, 3);
      nextHours = 24;
    } else if (rating === 'easy') {
      newLevel = Math.min(currentCard.srs_level + 2, 3);
      nextHours = 72;
    }

    const updated: VocabItem = {
      ...currentCard,
      srs_level: newLevel,
      review_count: (currentCard.review_count || 0) + 1,
      next_review: new Date(Date.now() + nextHours * 3600 * 1000).toISOString(),
    };

    await onUpdateItem(updated);
    setIsRevealed(false);
    setCompletedCount((c) => c + 1);

    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      setCurrentIndex(0);
    }
  };

  const handleShuffle = () => {
    setShuffleSeed((s) => s + 1);
    setCurrentIndex(0);
    setIsRevealed(false);
  };

  if (deck.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs my-4">
        <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">
          ไม่มีการ์ดคำศัพท์ในตัวกรองนี้
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          ลองเลือกดูคำศัพท์ทั้งหมด หรือส่งประโยคใหม่ให้ AI ดึงคำศัพท์เข้าคลังได้เลย!
        </p>
        <button
          onClick={() => {
            setFilter('all');
            setSelectedHsk('ทั้งหมด');
          }}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
        >
          ดูคำศัพท์ทั้งหมด ({items.length})
        </button>
      </div>
    );
  }

  const charInfos = analyzeCharacters(
    currentCard.simplified,
    currentCard.traditional
  );

  const primaryExample = currentCard.examples?.[0];
  const targetWordForHighlight =
    scriptMode === 'traditional'
      ? currentCard.traditional
      : currentCard.simplified;

  return (
    <div className="space-y-4">
      {/* Filter & HSK Level Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setFilter('all');
                setCurrentIndex(0);
                setIsRevealed(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({items.length})
            </button>
            <button
              onClick={() => {
                setFilter('due');
                setCurrentIndex(0);
                setIsRevealed(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === 'due'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ยังจำไม่แม่น ({items.filter((x) => x.srs_level < 2).length})
            </button>
            <button
              onClick={() => {
                setFilter('starred');
                setCurrentIndex(0);
                setIsRevealed(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                filter === 'starred'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              ติดดาว ({items.filter((x) => x.is_starred).length})
            </button>
          </div>

          <button
            onClick={handleShuffle}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 font-medium transition"
            title="สลับการ์ดแบบสุ่ม"
          >
            <Shuffle className="w-3.5 h-3.5" /> สุ่มลำดับ
          </button>
        </div>

        {/* HSK Level Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">
            ระดับ HSK:
          </span>
          {availableHskLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedHsk(lvl);
                setCurrentIndex(0);
                setIsRevealed(false);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedHsk === lvl
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Quiz Mode Switcher */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">
            โหมดทบทวน:
          </span>
          <button
            onClick={() => {
              setQuizMode('hanzi-to-meaning');
              setIsRevealed(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              quizMode === 'hanzi-to-meaning'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ดูตัวจีน+ประโยค → ทายคำแปล
          </button>
          <button
            onClick={() => {
              setQuizMode('meaning-to-hanzi');
              setIsRevealed(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              quizMode === 'meaning-to-hanzi'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ดูคำแปลไทย → นึกคำจีน
          </button>
          <button
            onClick={() => {
              setQuizMode('listening');
              setIsRevealed(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 transition ${
              quizMode === 'listening'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Headphones className="w-3 h-3" /> ฟังเสียง → ทายคำ
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
        <span>
          การ์ดใบที่ <strong className="text-slate-800">{currentIndex + 1}</strong> จาก{' '}
          {deck.length}
        </span>
        <span>ทบทวนไปแล้ว {completedCount} คำในรอบนี้</span>
      </div>

      {/* Flashcard Box */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg overflow-hidden transition-all">
        {/* Card Header Banner */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            🎯 ระดับ: {currentCard.category}
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSpeakOnReveal}
                onChange={(e) => setAutoSpeakOnReveal(e.target.checked)}
                className="rounded accent-rose-500"
              />
              อ่านออกเสียงตอนเฉลย
            </label>
          </div>
        </div>

        {/* Front of Card */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center bg-gradient-to-b from-amber-50/30 to-white">
          {currentCard.location_note && (
            <div className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <BookOpen className="w-3.5 h-3.5 text-rose-500" />
              <span>{currentCard.location_note}</span>
            </div>
          )}

          {/* แสดงด้านหน้าการ์ดตามโหมดที่เลือก */}
          {quizMode === 'hanzi-to-meaning' && (
            <div className="my-2 px-8 py-6 rounded-2xl border-2 border-rose-100 bg-white shadow-xs min-w-[220px]">
              <div className="text-5xl sm:text-6xl font-bold tracking-widest flex flex-wrap justify-center gap-1">
                {charInfos.map((info, idx) => {
                  const displayChar =
                    scriptMode === 'traditional' ? info.tradChar : info.char;
                  return (
                    <span
                      key={idx}
                      className={
                        isRevealed
                          ? getToneColorClass(info.tone, useToneColors)
                          : 'text-slate-900'
                      }
                    >
                      {displayChar}
                    </span>
                  );
                })}
              </div>

              {scriptMode === 'both' &&
                currentCard.simplified !== currentCard.traditional && (
                  <div className="mt-3 pt-2 border-t border-dashed border-slate-200 text-lg font-bold text-amber-800">
                    ตัวเต็ม: {currentCard.traditional}
                  </div>
                )}
            </div>
          )}

          {quizMode === 'meaning-to-hanzi' && (
            <div className="my-2 px-6 py-8 rounded-2xl border-2 border-amber-200/80 bg-amber-50/40 min-w-[240px]">
              <div className="text-xs font-semibold text-amber-700 uppercase mb-1">
                คำนี้ภาษาจีนพูดและเขียนว่าอย่างไร?
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {currentCard.meaning}
              </div>
            </div>
          )}

          {quizMode === 'listening' && (
            <div className="my-2 px-8 py-8 rounded-2xl border-2 border-rose-200 bg-rose-50/40 min-w-[240px] flex flex-col items-center">
              <button
                onClick={() =>
                  speakChinese(
                    scriptMode === 'traditional'
                      ? currentCard.traditional
                      : currentCard.simplified,
                    accent
                  )
                }
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/25 transition active:scale-95 mb-3"
              >
                <Volume2 className="w-8 h-8" />
              </button>
              <span className="text-xs font-semibold text-rose-700">
                กดปุ่มลำโพงเพื่อฟังเสียง แล้วทายตัวจีนและความหมาย
              </span>
            </div>
          )}

          {/* แสดงประโยคตัวอย่างที่เราใส่เข้ามาตั้งแต่ด้านหน้าการ์ด เพื่อให้นึกบริบทออก! */}
          {primaryExample && (
            <div className="mt-4 w-full max-w-md bg-rose-50/50 border border-rose-200/80 rounded-2xl p-3.5 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  ประโยคตัวอย่างจากที่คุณใส่:
                </span>
                <button
                  onClick={() => speakChinese(primaryExample.chinese, accent)}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5" /> ฟังประโยค
                </button>
              </div>
              <div className="text-base font-bold text-slate-900">
                {highlightWord(
                  scriptMode === 'traditional' && primaryExample.traditional
                    ? primaryExample.traditional
                    : primaryExample.chinese,
                  targetWordForHighlight,
                  quizMode !== 'hanzi-to-meaning' && !isRevealed
                )}
              </div>
              {isRevealed && (
                <div className="mt-1 space-y-0.5 border-t border-rose-200/50 pt-1.5">
                  <div className="text-xs text-rose-600 font-medium">
                    {primaryExample.pinyin}
                  </div>
                  <div className="text-xs text-slate-700 font-medium">
                    {primaryExample.meaning}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() =>
                speakChinese(
                  scriptMode === 'traditional'
                    ? currentCard.traditional
                    : currentCard.simplified,
                  accent
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
            >
              <Volume2 className="w-4 h-4" /> ฟังเสียงคำศัพท์
            </button>
            <button
              onClick={() => onOpenStroke(currentCard)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <Brush className="w-4 h-4" /> ดูขีด / ฝึกเขียน
            </button>
          </div>

          {/* Before Reveal vs After Reveal */}
          {!isRevealed ? (
            <div className="w-full mt-6">
              <button
                onClick={handleReveal}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <Eye className="w-4 h-4" />
                พลิกดูเฉลย (พินอิน • คำแปล • ประโยคตัวอย่าง)
              </button>
            </div>
          ) : (
            <div className="w-full mt-6 pt-5 border-t border-slate-200 text-left space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                {quizMode !== 'hanzi-to-meaning' && (
                  <div className="text-3xl font-bold text-slate-900">
                    {currentCard.simplified}
                    {currentCard.traditional !== currentCard.simplified && (
                      <span className="text-xl text-amber-700 ml-2">
                        ({currentCard.traditional})
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xl font-bold text-rose-600 tracking-wide">
                  {currentCard.pinyin}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {currentCard.meaning}
                </div>
              </div>

              {currentCard.mnemonic && (
                <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl text-xs text-amber-950">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">เทคนิคช่วยจำ: </span>
                    {currentCard.mnemonic}
                  </div>
                </div>
              )}

              {/* ประโยคตัวอย่างเพิ่มเติม (ถ้ามีมากกว่า 1 ประโยค) */}
              {currentCard.examples && currentCard.examples.length > 1 && (
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">
                    ประโยคตัวอย่างเพิ่มเติม
                  </div>
                  {currentCard.examples.slice(1).map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-start justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-100"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {highlightWord(
                            scriptMode === 'traditional' && ex.traditional
                              ? ex.traditional
                              : ex.chinese,
                            targetWordForHighlight
                          )}
                        </div>
                        <div className="text-xs text-rose-600 font-medium">
                          {ex.pinyin}
                        </div>
                        <div className="text-xs text-slate-600">{ex.meaning}</div>
                      </div>
                      <button
                        onClick={() => speakChinese(ex.chinese, accent)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 shrink-0"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SRS Self-Rating Buttons */}
              <div className="pt-2">
                <p className="text-center text-[11px] font-medium text-slate-400 mb-2">
                  ประเมินตัวเองเพื่อจัดตารางทบทวนรอบถัดไป:
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleRateCard('again')}
                    className="py-3 px-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex flex-col items-center gap-0.5 transition active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 mb-0.5" />
                    <span>ยังจำไม่ได้</span>
                    <span className="text-[10px] font-normal text-rose-500">
                      ทวนซ้ำเร็วๆ นี้
                    </span>
                  </button>
                  <button
                    onClick={() => handleRateCard('good')}
                    className="py-3 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex flex-col items-center gap-0.5 transition active:scale-95"
                  >
                    <span>พอคุ้นๆ</span>
                    <span className="text-[10px] font-normal text-amber-600">
                      ทวนอีกทีพรุ่งนี้
                    </span>
                  </button>
                  <button
                    onClick={() => handleRateCard('easy')}
                    className="py-3 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex flex-col items-center gap-0.5 transition active:scale-95"
                  >
                    <span>จำแม่นแล้ว!</span>
                    <span className="text-[10px] font-normal text-emerald-600">
                      ผ่านฉลุย (+3 วัน)
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
