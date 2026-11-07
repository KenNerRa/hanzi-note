import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VocabItem } from '../types/vocab';

const LOCAL_STORAGE_KEY = 'hanzi_note_vocab_v3';
const SUPABASE_CONFIG_KEY = 'hanzi_street_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// ชุดคำศัพท์ตัวอย่างที่สอดคล้องตามระดับ HSK พร้อมประโยคตัวอย่างที่ใส่เข้ามา
export const INITIAL_SAMPLE_VOCAB: VocabItem[] = [
  {
    id: 'sample-1',
    simplified: '差不多',
    traditional: '差不多',
    pinyin: 'chà bu duō',
    meaning: 'พอๆ กัน / เกือบจะ / ประมาณนั้น',
    category: 'HSK 3',
    location_note: 'คำวิเศษณ์ / คุณศัพท์ (副词/形容词)',
    mnemonic: '差 (ต่างกัน/ขาดไป) + 不 (ไม่) + 多 (มาก) = ต่างกันไม่มาก (พอๆ กันเลย)',
    examples: [
      {
        id: 'ex-101',
        chinese: '这两个词的意思差不多。',
        traditional: '這兩個詞的意思差不多。',
        pinyin: 'zhè liǎng gè cí de yì si chà bu duō.',
        meaning: 'คำสองคำนี้ความหมายพอๆ กันเลย',
        is_user_context: true,
      },
      {
        id: 'ex-101b',
        chinese: '我差不多准备好了。',
        traditional: '我差不多準備好了。',
        pinyin: 'wǒ chà bu duō zhǔn bèi hǎo le.',
        meaning: 'ฉันเตรียมตัวเสร็จเกือบหมดแล้ว',
      },
    ],
    srs_level: 1,
    next_review: new Date().toISOString(),
    review_count: 2,
    is_starred: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'sample-2',
    simplified: '原来',
    traditional: '原來',
    pinyin: 'yuán lái',
    meaning: 'ที่แท้ก็... (เพิ่งรู้ความจริง) / เดิมที',
    category: 'HSK 3',
    location_note: 'คำวิเศษณ์ / คำนาม (มักใช้ในโครงสร้าง 原来是这样)',
    mnemonic: '原 (ดั้งเดิม/ต้นตอ) + 来 (มา) = ที่แท้เรื่องราวมันมาแบบนี้เอง',
    examples: [
      {
        id: 'ex-102',
        chinese: '快点儿吧，要不然来不及了，原来今天人这么多！',
        traditional: '快點兒吧，要不然來不及了，原來今天人這麼多！',
        pinyin: 'kuài diǎn er ba, yào bù rán lái bu jí le, yuán lái jīn tiān rén zhè me duō!',
        meaning: 'เร็วเข้าเถอะ ไม่งั้นไปไม่ทันแล้ว ที่แท้คนวันนี้เยอะขนาดนี้เลย!',
        is_user_context: true,
      },
    ],
    srs_level: 0,
    next_review: new Date().toISOString(),
    review_count: 1,
    is_starred: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sample-3',
    simplified: '来不及',
    traditional: '來不及',
    pinyin: 'lái bu jí',
    meaning: 'ไม่ทันแล้ว / ไปไม่ทัน (Too late)',
    category: 'HSK 4',
    location_note: 'คำกริยาวลี (ตรงข้ามกับ 来得及 = ยังทันอยู่)',
    mnemonic: '来 (มา) + 不 (ไม่) + 及 (ถึง/ทันเวลา) = มาไม่ทันเวลาแล้ว',
    examples: [
      {
        id: 'ex-104',
        chinese: '快点儿吧，要不然来不及了，原来今天人这么多！',
        traditional: '快點兒吧，要不然來不及了，原來今天人這麼多！',
        pinyin: 'kuài diǎn er ba, yào bù rán lái bu jí le, yuán lái jīn tiān rén zhè me duō!',
        meaning: 'เร็วเข้าเถอะ ไม่งั้นไปไม่ทันแล้ว ที่แท้คนวันนี้เยอะขนาดนี้เลย!',
        is_user_context: true,
      },
    ],
    srs_level: 0,
    next_review: new Date().toISOString(),
    review_count: 1,
    is_starred: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'sample-4',
    simplified: '虽然',
    traditional: '雖然',
    pinyin: 'suī rán',
    meaning: 'ถึงแม้ว่า... (Although)',
    category: 'HSK 2',
    location_note: 'คำสันธาน (连词) มักใช้คู่กับ 虽然...但是...',
    mnemonic: 'ใช้เปิดประโยคบอกความขัดแย้ง คู่กับ 但是 (แต่ว่า)',
    examples: [
      {
        id: 'ex-105',
        chinese: '虽然汉字很难，但是我觉得很有意思。',
        traditional: '雖然漢字很難，但是我覺得很有意思。',
        pinyin: 'suī rán hàn zì hěn nán, dàn shì wǒ jué de hěn yǒu yì si.',
        meaning: 'ถึงแม้ตัวอักษรจีนจะยาก แต่ฉันรู้สึกว่าน่าสนใจมาก',
        is_user_context: true,
      },
    ],
    srs_level: 2,
    next_review: new Date().toISOString(),
    review_count: 4,
    is_starred: false,
    created_at: new Date().toISOString(),
  },
];

export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
      };
    }
  } catch {
    // ignore
  }

  return { url: envUrl, anonKey: envKey };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  supabaseInstance = null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  const { url, anonKey } = getSavedSupabaseConfig();
  if (url && anonKey && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, anonKey);
      return supabaseInstance;
    } catch (e) {
      console.error('Failed to init Supabase client:', e);
      return null;
    }
  }
  return null;
}

export function getLocalVocab(): VocabItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_VOCAB));
      return INITIAL_SAMPLE_VOCAB;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_VOCAB;
  }
}

export function saveLocalVocab(items: VocabItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Local storage save error:', e);
  }
}

export async function fetchAllVocab(): Promise<{
  items: VocabItem[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('chinese_vocab')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      saveLocalVocab(data as VocabItem[]);
      return { items: data as VocabItem[], source: 'supabase' };
    } else {
      console.warn('Supabase fetch error, falling back to local:', error?.message);
      return {
        items: getLocalVocab(),
        source: 'local',
        error: error?.message,
      };
    }
  }

  return { items: getLocalVocab(), source: 'local' };
}

export async function upsertVocabItem(item: VocabItem): Promise<{
  savedItem: VocabItem;
  synced: boolean;
  error?: string;
}> {
  const localItems = getLocalVocab();
  const existsIndex = localItems.findIndex((x) => x.id === item.id);
  let updatedList: VocabItem[];

  if (existsIndex >= 0) {
    updatedList = [...localItems];
    updatedList[existsIndex] = item;
  } else {
    updatedList = [item, ...localItems];
  }
  saveLocalVocab(updatedList);

  const supabase = getSupabaseClient();
  if (supabase) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      item.id
    );
    const payload = {
      ...item,
      id: isUuid ? item.id : crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('chinese_vocab')
      .upsert(payload)
      .select()
      .single();

    if (!error && data) {
      return { savedItem: data as VocabItem, synced: true };
    }
    return { savedItem: item, synced: false, error: error?.message };
  }

  return { savedItem: item, synced: false };
}

export async function upsertVocabBatch(newItems: VocabItem[]): Promise<{
  allItems: VocabItem[];
  synced: boolean;
}> {
  const currentList = [...getLocalVocab()];

  for (const item of newItems) {
    const idx = currentList.findIndex(
      (x) => x.id === item.id || x.simplified === item.simplified
    );
    if (idx >= 0) {
      currentList[idx] = item;
    } else {
      currentList.unshift(item);
    }
  }

  saveLocalVocab(currentList);

  const supabase = getSupabaseClient();
  if (supabase && newItems.length > 0) {
    const payload = newItems.map((item) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        item.id
      );
      return {
        ...item,
        id: isUuid ? item.id : crypto.randomUUID(),
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase.from('chinese_vocab').upsert(payload);
    return { allItems: currentList, synced: !error };
  }

  return { allItems: currentList, synced: false };
}

export async function deleteVocabItem(id: string): Promise<boolean> {
  const localItems = getLocalVocab().filter((x) => x.id !== id);
  saveLocalVocab(localItems);

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('chinese_vocab').delete().eq('id', id);
    return !error;
  }
  return true;
}

export async function syncLocalToSupabase(): Promise<{
  count: number;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { count: 0, error: 'ยังไม่ได้ตั้งค่า Supabase URL และ Anon Key' };
  }

  const localItems = getLocalVocab();
  const payload = localItems.map((item) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      item.id
    );
    return {
      ...item,
      id: isUuid ? item.id : crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    };
  });

  const { data, error } = await supabase.from('chinese_vocab').upsert(payload).select();
  if (error) {
    return { count: 0, error: error.message };
  }
  if (data) {
    saveLocalVocab(data as VocabItem[]);
  }
  return { count: data?.length || 0 };
}
