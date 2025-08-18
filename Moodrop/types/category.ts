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

// Accord 관련 타입 정의
export interface Accord {
  accordId: number;
  accord: string;
  totalWeight: number;
}

export interface AccordResponse {
  accords: Accord[];
}

// Accord API 요청 파라미터 타입
export interface AccordRequestParams {
  moodIds: number[];
}

// 향수 관련 타입 정의
export interface PerfumeRatingInfo {
  ratingCount: number;
  ratingVal: number;
}

export interface PerfumeSillage {
  strong: number;
  intimate: number;
  enormous: number;
  moderate: number;
}

export interface PerfumeLongevity {
  eternal: number;
  'long lasting': number;
  'very weak': number;
  weak: number;
  moderate: number;
}

export interface PerfumeNotes {
  base: string[];
  top: string[];
  middle: string[];
}

export interface PerfumeDayNight {
  day: number;
  night: number;
}

export interface PerfumeSeason {
  spring: number;
  summer: number;
  fall: number;
  winter: number;
}

export interface Perfume {
  id: number;
  perfumeName: string;
  brandName: string;
  country: string;
  year: number;
  gender: string;
  description: string;
  comments: string | null;
  ratingInfo: PerfumeRatingInfo;
  accordMatchCount: number;
  sillage: PerfumeSillage;
  longevity: PerfumeLongevity;
  notes: PerfumeNotes;
  dayNight: PerfumeDayNight;
  season: PerfumeSeason;
}

export interface PerfumeListResponse {
  Match: Perfume[];
  NoMatch: Perfume[];
}

export interface PerfumeListRequestParams {
  accords: string[];
}

// 향수 제조 Note 관련 타입 정의
export interface PerfumeNote {
  name: string;
  koreanName?: string;  // 한국어 이름 (선택적)
  type: 'top' | 'middle' | 'base';
  weight: number;
}

export type PerfumeNoteResponse = PerfumeNote[];

// 사용자 레시피 관련 타입
export interface RecipeComposition {
  name: string;           // 향료 이름 (예: "honey", "pink pepper")
  type: 'top' | 'middle' | 'base';  // 향료 타입
  weight: number;         // 향료 비율 (백분율)
}

export interface UserRecipe {
  recipeId: number;       // 레시피 고유 ID
  userId: number;         // 숫자형 사용자 ID
  userIdString: string;   // 문자열 사용자 ID
  perfumeName: string;    // 향수 이름
  description: string;    // 향수 설명
  composition: RecipeComposition[];  // 향료 구성 배열
}

// 사용자 레시피 목록 응답 타입
export type UserRecipeListResponse = UserRecipe[];