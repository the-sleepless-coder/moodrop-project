// 무드(소분류) 타입 정의
export interface Mood {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
}

// 카테고리(대분류) 타입 정의  
export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  moods: Mood[];
}

// 실제 API 응답 원본 타입 (플랫한 구조)
export interface CategoryMoodApiItem {
  categoryId: number;
  categoryDescription: string;
  moodId: number;
  moodDescription: string;
}

// categoryMood API 응답 타입 (실제 서버 응답)
export interface CategoryMoodResponse {
  categories: Category[];
}

// API 원본 응답 타입
export type CategoryMoodApiResponse = CategoryMoodApiItem[];

// 카테고리 선택 상태 타입
export interface CategorySelection {
  selectedCategory: Category | null;
  selectedMoods: Mood[];
}

// 기존 향료 발견 흐름을 위한 매핑 타입 (호환성)
export type FragranceCategory = '플로럴' | '우디' | '프레시' | '오리엔탈';

// API 카테고리를 앱 내 카테고리로 매핑하는 헬퍼 타입
export interface CategoryMapping {
  [key: string]: FragranceCategory;
}