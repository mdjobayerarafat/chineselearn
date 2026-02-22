export interface Chapter {
  id: number;
  name: string;
  description: string;
  created_at: string;
  vocabularies?: Vocabulary[];
}

export interface Vocabulary {
  id: number;
  chinese: string;
  pinyin: string;
  meaning: string;
  image_url: string;
  chapter_id: number;
  created_at: string;
}

export interface Sentence {
  id: number;
  dialogue_id: number;
  speaker: string;
  chinese: string;
  pinyin: string;
  english: string;
  audio_url: string;
  order: number;
  created_at: string;
}

export interface Dialogue {
  id: number;
  chapter_id: number;
  title: string;
  description: string;
  sentences?: Sentence[];
  created_at: string;
}
