import * as OpenCC from 'opencc-js';
import { pinyin } from 'pinyin-pro';
import type { VoiceAccent } from '../types/vocab';

// สร้างตัวแปลง ตัวย่อ <-> ตัวเต็ม
const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });
const t2sConverter = OpenCC.Converter({ from: 'tw', to: 'cn' });

export function toTraditional(text: string): string {
  if (!text) return '';
  return s2tConverter(text);
}

export function toSimplified(text: string): string {
  if (!text) return '';
  return t2sConverter(text);
}

export function generatePinyin(text: string): string {
  if (!text) return '';
  return pinyin(text, { toneType: 'symbol', nonZh: 'consecutive' });
}

export interface CharToneInfo {
  char: string;
  tradChar: string;
  pinyin: string;
  tone: number; // 1, 2, 3, 4, 0 (neutral/non-chinese)
}

/**
 * แยกตัวอักษรจีนแต่ละตัว พร้อม Pinyin และเลขวรรณยุกต์ (1-4) เพื่อทำสี Tone Color
 */
export function analyzeCharacters(simplifiedText: string, traditionalText?: string): CharToneInfo[] {
  if (!simplifiedText) return [];
  const trad = traditionalText || toTraditional(simplifiedText);
  const chars = Array.from(simplifiedText);
  const tradChars = Array.from(trad);

  return chars.map((char, index) => {
    const isChinese = /[\u4e00-\u9fa5]/.test(char);
    if (!isChinese) {
      return {
        char,
        tradChar: tradChars[index] || char,
        pinyin: '',
        tone: 0,
      };
    }

    const pySymbol = pinyin(char, { toneType: 'symbol' });
    const pyNum = pinyin(char, { pattern: 'num' });
    const toneNum = parseInt(pyNum, 10);

    return {
      char,
      tradChar: tradChars[index] || char,
      pinyin: pySymbol,
      tone: isNaN(toneNum) ? 0 : toneNum,
    };
  });
}

/**
 * คืนค่าคลาสสีตามเสียงวรรณยุกต์ภาษาจีน (ช่วยให้จำวรรณยุกต์ได้แม่นขึ้น)
 * เสียง 1 (สามัญ - สูงยาว): สีแดง/ชมพูเข้ม
 * เสียง 2 (จัตวา - พุ่งขึ้น): สีส้ม/อำพัน
 * เสียง 3 (เอก - ลงแล้วขึ้น): สีเขียวเข้ม
 * เสียง 4 (โท - พุ่งลงหนัก): สีน้ำเงิน/คราม
 * เสียงเบา (0/5): สีเทา
 */
export function getToneColorClass(tone: number, enabled = true): string {
  if (!enabled) return 'text-slate-900';
  switch (tone) {
    case 1:
      return 'text-rose-600';
    case 2:
      return 'text-amber-600';
    case 3:
      return 'text-emerald-600';
    case 4:
      return 'text-blue-600';
    default:
      return 'text-slate-600';
  }
}

export function getToneBadgeColor(tone: number): string {
  switch (tone) {
    case 1:
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 2:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 3:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 4:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

/**
 * อ่านออกเสียงภาษาจีนด้วย Web Speech API
 */
export function speakChinese(text: string, accent: VoiceAccent = 'zh-CN', rate = 0.85) {
  if (!('speechSynthesis' in window) || !text) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent;
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice =
    voices.find((v) => v.lang.replace('_', '-') === accent) ||
    voices.find((v) => v.lang.startsWith('zh'));

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * ย่อขนาดรูปภาพป้ายก่อนบันทึก (เพื่อให้เก็บใน Supabase หรือ LocalStorage ได้เร็วและไม่เต็ม)
 */
export function compressImageFile(file: File, maxWidth = 700, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
