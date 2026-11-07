import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { X, Play, Edit3, RotateCcw, Volume2 } from 'lucide-react';
import { speakChinese } from '../utils/chinese';
import type { VoiceAccent } from '../types/vocab';

interface StrokeOrderModalProps {
  simplified: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  accent: VoiceAccent;
  onClose: () => void;
}

export const StrokeOrderModal: React.FC<StrokeOrderModalProps> = ({
  simplified,
  traditional,
  pinyin,
  meaning,
  accent,
  onClose,
}) => {
  // ดึงเฉพาะตัวอักษรจีนออกมา
  const simpChars = Array.from(simplified).filter((c) => /[\u4e00-\u9fa5]/.test(c));
  const tradChars = Array.from(traditional).filter((c) => /[\u4e00-\u9fa5]/.test(c));

  const [scriptType, setScriptType] = useState<'simplified' | 'traditional'>('simplified');
  const activeChars = scriptType === 'simplified' ? simpChars : tradChars;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizMessage, setQuizMessage] = useState<string>('');

  const writerRef = useRef<HTMLDivElement | null>(null);
  const hanziInstance = useRef<HanziWriter | null>(null);

  const currentChar = activeChars[selectedIndex] || activeChars[0] || '汉';

  useEffect(() => {
    if (!writerRef.current || !currentChar) return;
    writerRef.current.innerHTML = '';
    setQuizMessage('');

    try {
      const writer = HanziWriter.create(writerRef.current, currentChar, {
        width: 220,
        height: 220,
        padding: 16,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 180,
        strokeColor: '#e11d48', // rose-600
        radicalColor: '#2563eb', // blue-600 (แยกสีหมวดนำ/รากศัพท์!)
        outlineColor: '#e2e8f0',
        drawingWidth: 22,
        showCharacter: !isQuizMode,
      });

      hanziInstance.current = writer;

      if (isQuizMode) {
        setQuizMessage('ใช้นิ้วหรือเมาส์ลากตามลำดับขีดได้เลย!');
        writer.quiz({
          onMistake: () => {
            setQuizMessage('ผิดขีด! ลองดูใบ้สีฟ้าแล้วลากใหม่นะ');
          },
          onCorrectStroke: (strokeData) => {
            setQuizMessage(`ถูกต้อง! (ขีดที่ ${strokeData.strokeNum + 1})`);
          },
          onComplete: (summaryData) => {
            setQuizMessage(
              `เก่งมาก! เขียนครบทุกขีดแล้ว (พลาดไป ${summaryData.totalMistakes} ครั้ง)`
            );
          },
        });
      } else {
        writer.animateCharacter();
      }
    } catch (err) {
      console.error('HanziWriter error:', err);
    }
  }, [currentChar, isQuizMode, scriptType]);

  const handleAnimate = () => {
    setIsQuizMode(false);
    hanziInstance.current?.showCharacter();
    hanziInstance.current?.animateCharacter();
  };

  const handleStartQuiz = () => {
    setIsQuizMode(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              ลำดับขีดและฝึกเขียน
              <button
                onClick={() => speakChinese(currentChar, accent)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition"
                title="ฟังเสียงอ่าน"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </h3>
            <p className="text-xs text-rose-100">
              สีน้ำเงิน = หมวดนำ (Radical) • สีแดง = ขีดประกอบ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          {/* Toggle Simplified / Traditional */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full mb-4">
            <button
              onClick={() => setScriptType('simplified')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                scriptType === 'simplified'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตัวย่อ ({simplified})
            </button>
            <button
              onClick={() => setScriptType('traditional')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                scriptType === 'traditional'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตัวเต็ม ({traditional})
            </button>
          </div>

          {/* Character Selector Tabs */}
          {activeChars.length > 1 && (
            <div className="flex gap-2 mb-4 flex-wrap justify-center">
              {activeChars.map((ch, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-11 h-11 rounded-xl text-xl font-bold border transition flex items-center justify-center ${
                    selectedIndex === idx
                      ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}

          {/* Hanzi Writer Canvas with Chinese Tianzige Grid */}
          <div className="relative bg-amber-50/40 border-2 border-rose-200 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden">
            {/* เส้นประตารางคัดจีน (Tianzige) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-1/2 border-b border-dashed border-rose-200/80" />
              <div className="h-full w-1/2 border-r border-dashed border-rose-200/80 absolute top-0 left-0" />
            </div>
            <div ref={writerRef} className="relative z-10 cursor-crosshair" />
          </div>

          {quizMessage && (
            <p className="mt-3 text-xs font-medium text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full">
              {quizMessage}
            </p>
          )}

          <div className="mt-3 text-center">
            <div className="text-sm font-semibold text-slate-700">{pinyin}</div>
            <div className="text-xs text-slate-500">{meaning}</div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2.5 w-full mt-5">
            <button
              onClick={handleAnimate}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-medium border transition ${
                !isQuizMode
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Play className="w-4 h-4" />
              ดูวิธีเขียน
            </button>
            <button
              onClick={handleStartQuiz}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-medium border transition ${
                isQuizMode
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isQuizMode ? <RotateCcw className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isQuizMode ? 'เริ่มเขียนใหม่' : 'ฝึกเขียนเอง'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
