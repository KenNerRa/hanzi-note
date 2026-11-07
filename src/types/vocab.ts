export interface ExampleSentence {
  id: string;
  chinese: string; // เก็บตัวย่อ
  traditional?: string;
  pinyin: string;
  meaning: string;
  is_user_context?: boolean; // true = ประโยคต้นฉบับที่เราเจอและส่งเข้ามาเอง!
}

export type HskLevel = 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5' | 'HSK 6' | 'นอก HSK / น่ารู้';

export interface VocabItem {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  category: HskLevel | string; // เก็บระดับ HSK เช่น 'HSK 3' หรือหมวดหมู่
  location_note?: string; // ชนิดของคำ (Part of speech) + ประโยคต้นฉบับที่เจอ
  mnemonic?: string; // เทคนิคช่วยจำ / รากศัพท์ที่ AI วิเคราะห์ให้
  image_url?: string;
  examples: ExampleSentence[];
  srs_level: number; // 0 = ใหม่/จำไม่ได้, 1 = พอคุ้น, 2 = จำได้, 3+ = แม่นมาก
  next_review: string;
  review_count: number;
  is_starred: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ExtractedVocabCandidate {
  simplified: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  hsk_level: HskLevel;
  part_of_speech: string;
  mnemonic: string;
  extra_example?: {
    chinese: string;
    pinyin: string;
    meaning: string;
  };
  selected?: boolean;
}

export interface AIExtractionResult {
  original_simplified: string;
  original_traditional: string;
  original_pinyin: string;
  original_meaning: string;
  grammar_or_context_note: string;
  words: ExtractedVocabCandidate[];
}

export type DisplayScriptMode = 'both' | 'simplified' | 'traditional';
export type VoiceAccent = 'zh-CN' | 'zh-TW';
