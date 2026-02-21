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
