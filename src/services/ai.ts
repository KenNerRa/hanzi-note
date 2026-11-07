import type { AIExtractionResult, ExtractedVocabCandidate, HskLevel } from '../types/vocab';
import { generatePinyin, toSimplified, toTraditional } from '../utils/chinese';

const GEMINI_API_KEY_STORAGE = 'hanzi_note_gemini_api_key';

export function getSavedGeminiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE) || envKey;
  } catch {
    return envKey;
  }
}

export function saveGeminiKey(key: string) {
  localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
}

// คลังคำศัพท์ HSK พื้นฐานในเครื่องสำหรับโหมดทดลองทันที (เมื่อยังไม่ได้ใส่ Gemini API Key)
const BUILTIN_HSK_DICT: Record<
  string,
  {
    meaning: string;
    hsk: HskLevel;
    pos: string;
    mnemonic: string;
    extraEx?: { chinese: string; meaning: string };
  }
> = {
  原来: {
    meaning: 'ที่แท้ก็... / เดิมที',
    hsk: 'HSK 3',
    pos: 'คำวิเศษณ์ / คำนาม (副词/名词)',
    mnemonic: '原 (ดั้งเดิม/ต้นตอ) + 来 (มา) = ที่แท้เรื่องราวมันมาแบบนี้เอง',
    extraEx: { chinese: '原来你也喜欢喝茶。', meaning: 'ที่แท้เธอก็ชอบดื่มชาเหมือนกันนะเนี่ย' },
  },
  差不多: {
    meaning: 'พอๆ กัน / เกือบจะ / ประมาณนั้น',
    hsk: 'HSK 3',
    pos: 'คำวิเศษณ์ / คุณศัพท์ (副词/形容词)',
    mnemonic: '差 (ต่างกัน) + 不 (ไม่) + 多 (มาก) = ต่างกันไม่มาก (พอๆ กัน)',
    extraEx: { chinese: '这两个词的意思差不多。', meaning: 'คำสองคำนี้ความหมายพอๆ กัน' },
  },
  来不及: {
    meaning: 'ไม่ทันแล้ว / ไปไม่ทัน',
    hsk: 'HSK 4',
    pos: 'คำกริยาวลี (动词短语)',
    mnemonic: '来 (มา) + 不 (ไม่) + 及 (ถึง/ทัน) = มาไม่ทันเวลา',
    extraEx: { chinese: '快点吧，要不然来不及了！', meaning: 'เร็วเข้าเถอะ ไม่งั้นไม่ทันแล้ว!' },
  },
  感兴趣: {
    meaning: 'สนใจใน... / รู้สึกสนใจ',
    hsk: 'HSK 3',
    pos: 'คำกริยาวลี (ใช้คู่กับ 对...感兴趣)',
    mnemonic: '感 (รู้สึก) + 兴趣 (ความสนใจ/ความรื่นรมย์)',
    extraEx: { chinese: '我对中国历史很感兴趣。', meaning: 'ฉันสนใจประวัติศาสตร์จีนมาก' },
  },
  兴趣: {
    meaning: 'ความสนใจ / งานอดิเรก',
    hsk: 'HSK 3',
    pos: 'คำนาม (名词)',
    mnemonic: '兴 (ตื่นเต้น/เบิกบาน) + 趣 (ความน่าสนใจ)',
  },
  学习: {
    meaning: 'เรียน / ศึกษา',
    hsk: 'HSK 1',
    pos: 'คำกริยา (动词)',
    mnemonic: '学 (เรียน) + 习 (ฝึกฝนทบทวน)',
    extraEx: { chinese: '我每天都学习中文。', meaning: 'ฉันเรียนภาษาจีนทุกวัน' },
  },
  中文: {
    meaning: 'ภาษาจีน',
    hsk: 'HSK 1',
    pos: 'คำนาม (名词)',
    mnemonic: '中 (จีน/ตรงกลาง) + 文 (ภาษา/อักษร)',
  },
  如果: {
    meaning: 'ถ้า / หากว่า (If)',
    hsk: 'HSK 3',
    pos: 'คำสันธาน (连词)',
    mnemonic: 'มักใช้คู่กับ 如果...就... (ถ้า...ก็...)',
    extraEx: { chinese: '如果明天下雨，我就不去了。', meaning: 'ถ้าพรุ่งนี้ฝนตก ฉันก็ไม่ไปแล้ว' },
  },
  虽然: {
    meaning: 'ถึงแม้ว่า... (Although)',
    hsk: 'HSK 2',
    pos: 'คำสันธาน (连词)',
    mnemonic: 'ใช้คู่กับ 虽然...但是... (ถึงแม้ว่า...แต่...)',
    extraEx: { chinese: '虽然汉字很难，但是很有意思。', meaning: 'ถึงแม้อักษรจีนจะยาก แต่น่าสนใจมาก' },
  },
  但是: {
    meaning: 'แต่ / แต่ว่า (But)',
    hsk: 'HSK 2',
    pos: 'คำสันธาน (连词)',
    mnemonic: 'คำเชื่อมแสดงความขัดแย้ง ใช้คู่กับ 虽然',
  },
  汉字: {
    meaning: 'ตัวอักษรจีน (Hanzi)',
    hsk: 'HSK 2',
    pos: 'คำนาม (名词)',
    mnemonic: '汉 (ชาวฮั่น/จีน) + 字 (ตัวอักษร)',
  },
  有意思: {
    meaning: 'น่าสนใจ / สนุก',
    hsk: 'HSK 2',
    pos: 'คำคุณศัพท์ (形容词)',
    mnemonic: '有 (มี) + 意思 (ความหมาย/ความน่าสนใจ)',
  },
  决定: {
    meaning: 'ตัดสินใจ / การตัดสินใจ',
    hsk: 'HSK 3',
    pos: 'คำกริยา / คำนาม (动词/名词)',
    mnemonic: '决 (ชี้ขาด) + 定 (กำหนดนิ่ง)',
    extraEx: { chinese: '我决定明年去中国留学。', meaning: 'ฉันตัดสินใจว่าปีหน้าจะไปเรียนต่อที่จีน' },
  },
  准备: {
    meaning: 'เตรียมตัว / เตรียมพร้อม',
    hsk: 'HSK 2',
    pos: 'คำกริยา (动词)',
    mnemonic: '准 (แม่นยำ/อนุญาต) + 备 (จัดเตรียม)',
    extraEx: { chinese: '你准备好考试了吗？', meaning: 'เธอเตรียมตัวสอบพร้อมหรือยัง?' },
  },
  考试: {
    meaning: 'การสอบ / สอบ',
    hsk: 'HSK 2',
    pos: 'คำนาม / คำกริยา (名词/动词)',
    mnemonic: '考 (ทดสอบ) + 试 (ลอง)',
  },
  营业: {
    meaning: 'เปิดทำการ / ดำเนินกิจการ',
    hsk: 'HSK 5',
    pos: 'คำกริยา (动词)',
    mnemonic: '营 (บริหารจัดการ) + 业 (กิจการ/อาชีพ)',
  },
  小心: {
    meaning: 'ระวัง / ระมัดระวัง',
    hsk: 'HSK 3',
    pos: 'คำกริยา / คุณศัพท์ (动词/形容词)',
    mnemonic: '小 (เล็ก) + 心 (หัวใจ) = ทำใจให้ละเอียดรอบคอบ',
  },
};

/**
 * ส่งข้อความ/ประโยคภาษาจีน (หรือรูปภาพ) ไปให้ Gemini AI แยกคำศัพท์ + จัดระดับ HSK + ผูกประโยคตัวอย่าง
 */
export async function analyzeChineseWithAI(
  inputText: string,
  imageBase64?: string
): Promise<{
  result: AIExtractionResult;
  usedAI: boolean;
  error?: string;
}> {
  const apiKey = getSavedGeminiKey();
  const cleanText = inputText.trim();

  if (apiKey) {
    try {
      const prompt = `คุณคือครูสอนภาษาจีนระดับเชี่ยวชาญสำหรับคนไทย
ผู้ใช้ส่งข้อความ/ประโยคหรือคำศัพท์ภาษาจีนนี้เข้ามาเพื่อเก็บคำศัพท์เข้าสมุดทบทวน:
"${cleanText}"

กรุณาวิเคราะห์และตอบกลับเป็น JSON เท่านั้น ตามโครงสร้างนี้:
{
  "original_simplified": "ประโยคหรือคำศัพท์ต้นฉบับในรูปจีนตัวย่อ (ถ้ารับรูปภาพมา ให้อ่านข้อความจีนจากรูปภาพเป็นประโยคต้นฉบับ)",
  "original_meaning": "คำแปลภาษาไทยที่เข้าใจง่ายและเป็นธรรมชาติของประโยคหรือข้อความต้นฉบับนี้",
  "grammar_or_context_note": "อธิบายโครงสร้างไวยากรณ์หรือบริบทการใช้ของประโยคนี้สั้นๆ 1 บรรทัด",
  "words": [
    {
      "simplified": "คำศัพท์จีนตัวย่อที่แยกออกมา (เลือกเฉพาะคำสำคัญที่น่าทบทวน หากผู้ใช้ส่งมาแค่คำเดียวก็ให้วิเคราะห์คำนั้นละเอียดๆ)",
      "meaning": "คำแปลภาษาไทยของคำนี้ (กระชับ ชัดเจน)",
      "hsk_level": "ระบุระดับ HSK ให้ตรงจากตัวเลือก: 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', หรือ 'นอก HSK / น่ารู้'",
      "part_of_speech": "ชนิดของคำ เช่น คำกริยา (动词), คำนาม (名词), คำคุณศัพท์ (形容词), คำวิเศษณ์ (副词), คำสันธาน (连词), สำนวน (成语)",
      "mnemonic": "เทคนิคช่วยจำตัวอักษรนี้ แยกส่วนประกอบรากศัพท์ หรือบอกคำที่มักจำสลับกัน",
      "extra_example": {
        "chinese": "แต่งประโยคตัวอย่างสั้นๆ เพิ่มอีก 1 ประโยคที่ใช้คำนี้ในชีวิตประจำวัน (จีนตัวย่อ)",
        "meaning": "คำแปลไทยของประโยคตัวอย่างเสริมนี้"
      }
    }
  ]
}`;

      const parts: Array<Record<string, unknown>> = [{ text: prompt }];

      if (imageBase64 && imageBase64.includes('base64,')) {
        const [meta, data] = imageBase64.split('base64,');
        const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/jpeg';
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data,
          },
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API Error ${response.status}`);
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(rawText);

      const origSimp = toSimplified(parsed.original_simplified || cleanText);
      const origTrad = toTraditional(origSimp);
      const origPy = generatePinyin(origSimp);

      const words: ExtractedVocabCandidate[] = (parsed.words || []).map(
        (w: Record<string, any>) => {
          const wSimp = toSimplified(w.simplified || '');
          const wTrad = toTraditional(wSimp);
          const wPy = generatePinyin(wSimp);
          const extraChinese = w.extra_example?.chinese
            ? toSimplified(w.extra_example.chinese)
            : '';

          return {
            simplified: wSimp,
            traditional: wTrad,
            pinyin: wPy,
            meaning: w.meaning || '',
            hsk_level: (w.hsk_level as HskLevel) || 'HSK 3',
            part_of_speech: w.part_of_speech || 'คำศัพท์ทั่วไป',
            mnemonic: w.mnemonic || '',
            extra_example: extraChinese
              ? {
                  chinese: extraChinese,
                  pinyin: generatePinyin(extraChinese),
                  meaning: w.extra_example?.meaning || '',
                }
              : undefined,
            selected: true,
          };
        }
      );

      return {
        result: {
          original_simplified: origSimp,
          original_traditional: origTrad,
          original_pinyin: origPy,
          original_meaning: parsed.original_meaning || '',
          grammar_or_context_note: parsed.grammar_or_context_note || '',
          words,
        },
        usedAI: true,
      };
    } catch (err: any) {
      console.warn('Gemini API fallback to local segmenter:', err);
      return {
        result: fallbackSegmentAnalysis(cleanText),
        usedAI: false,
        error: err?.message,
      };
    }
  }

  return {
    result: fallbackSegmentAnalysis(cleanText),
    usedAI: false,
  };
}

/**
 * ระบบแยกคำศัพท์อัจฉริยะในเครื่อง (ทำงานได้ทันทีแม้ยังไม่ได้ใส่ Gemini API Key)
 * ใช้ Intl.Segmenter ของเบราว์เซอร์ร่วมกับคลังคำศัพท์ HSK ในเครื่อง
 */
function fallbackSegmentAnalysis(text: string): AIExtractionResult {
  const simp = toSimplified(text);
  const trad = toTraditional(simp);
  const py = generatePinyin(simp);

  const foundWords: ExtractedVocabCandidate[] = [];
  const seen = new Set<string>();

  // 1. ค้นหาคำที่ตรงกับคลัง HSK ในเครื่องก่อน
  Object.entries(BUILTIN_HSK_DICT).forEach(([word, info]) => {
    if (simp.includes(word) && !seen.has(word)) {
      seen.add(word);
      foundWords.push({
        simplified: word,
        traditional: toTraditional(word),
        pinyin: generatePinyin(word),
        meaning: info.meaning,
        hsk_level: info.hsk,
        part_of_speech: info.pos,
        mnemonic: info.mnemonic,
        extra_example: info.extraEx
          ? {
              chinese: info.extraEx.chinese,
              pinyin: generatePinyin(info.extraEx.chinese),
              meaning: info.extraEx.meaning,
            }
          : undefined,
        selected: true,
      });
    }
  });

  // 2. ใช้ Intl.Segmenter แยกคำภาษาจีนที่เหลือออกมาให้ครบ
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
    const segments = Array.from(segmenter.segment(simp));
    for (const seg of segments) {
      const w = seg.segment.trim();
      if (!/[\u4e00-\u9fa5]/.test(w)) continue;
      if (seen.has(w)) continue;
      // ข้ามคำไวยากรณ์พื้นฐานสั้นๆ ที่มีในคำที่ดึงมาแล้ว
      if (['我', '你', '他', '的', '了', '吗', '吧', '啊', '很', '都', '是'].includes(w) && simp.length > 2) {
        continue;
      }
      seen.add(w);
      const dictHit = BUILTIN_HSK_DICT[w];
      foundWords.push({
        simplified: w,
        traditional: toTraditional(w),
        pinyin: generatePinyin(w),
        meaning: dictHit?.meaning || '(พิมพ์คำแปลเพิ่ม หรือใส่ Gemini API Key เพื่อให้ AI แปลอัตโนมัติ)',
        hsk_level: dictHit?.hsk || 'HSK 3',
        part_of_speech: dictHit?.pos || 'คำศัพท์ในประโยค',
        mnemonic: dictHit?.mnemonic || '',
        selected: true,
      });
    }
  }

  // ถ้ายังไม่เจอคำย่อยเลย ให้เอาทั้งก้อนเป็น 1 คำศัพท์
  if (foundWords.length === 0 && simp) {
    foundWords.push({
      simplified: simp,
      traditional: trad,
      pinyin: py,
      meaning: '',
      hsk_level: 'HSK 3',
      part_of_speech: 'คำศัพท์',
      mnemonic: '',
      selected: true,
    });
  }

  return {
    original_simplified: simp,
    original_traditional: trad,
    original_pinyin: py,
    original_meaning:
      simp === '虽然汉字很难，但是我觉得很有意思，准备明年去参加考试。'
        ? 'ถึงแม้ตัวอักษรจีนจะยาก แต่ฉันรู้สึกว่าน่าสนใจมาก เตรียมตัวว่าปีหน้าจะไปเข้าสอบ'
        : simp === '快点儿吧，要不然来不及了，原来今天人这么多！'
        ? 'เร็วเข้าเถอะ ไม่งั้นไปไม่ทันแล้ว ที่แท้คนวันนี้เยอะขนาดนี้เลย!'
        : '',
    grammar_or_context_note:
      'ประโยคต้นฉบับที่คุณส่งเข้ามา จะถูกบันทึกเป็นประโยคตัวอย่างของทุกคำที่เลือกด้านล่างโดยอัตโนมัติ',
    words: foundWords,
  };
}
