import { apiClient, ApiResponse } from './api';

// API에서 가져오는 Note 타입
export interface DeterminedNote {
  name: string;
  type: 'top' | 'middle' | 'base';
  weight: number | null;
  koreanName: string;
}

// 자주 사용되는 Note 정보 (perfume_count_by_note.csv 기반 상위 20개)
export const POPULAR_NOTES = [
  { name: 'musk', koreanName: '머스크', count: 2377 },
  { name: 'jasmine', koreanName: '자스민', count: 1701 },
  { name: 'bergamot', koreanName: '베르가못', count: 1686 },
  { name: 'vanilla', koreanName: '바닐라', count: 841 },
  { name: 'patchouli', koreanName: '파출리', count: 635 },
  { name: 'rose', koreanName: '장미', count: 623 },
  { name: 'mandarin orange orange', koreanName: '만다린 오렌지', count: 463 },
  { name: 'sandalwood', koreanName: '샌달우드', count: 308 },
  { name: 'cedar', koreanName: '시더(삼나무)', count: 275 },
  { name: 'amber', koreanName: '앰버', count: 265 },
  { name: 'orange blossom', koreanName: '오렌지 블로섬', count: 225 },
  { name: 'lavender', koreanName: '라벤더', count: 215 },
  { name: 'lemon', koreanName: '레몬', count: 213 },
  { name: 'pink pepper', koreanName: '핑크 페퍼', count: 199 },
  { name: 'cardamom', koreanName: '카다멈', count: 188 },
  { name: 'iris', koreanName: '아이리스', count: 149 },
  { name: 'grapefruit', koreanName: '자몽', count: 144 },
  { name: 'vetiver', koreanName: '베티버', count: 140 },
  { name: 'peony', koreanName: '피오니', count: 119 },
  { name: 'peach', koreanName: '복숭아', count: 111 }
];

// Note 카테고리 정의
export const NOTE_CATEGORIES = [
  { id: 'citrus', name: '시트러스', description: 'Citrus 계열' },
  { id: 'floral', name: '플로럴', description: 'Floral 계열' },
  { id: 'woody', name: '우디', description: 'Woody 계열' },
  { id: 'chypre', name: '시프레', description: 'Chypre 계열' },
  { id: 'green', name: '그린', description: 'Green 계열' },
  { id: 'fougere', name: '푸제르', description: 'Fougere 계열' },
  { id: 'oriental', name: '오리엔탈', description: 'Oriental 계열' },
  { id: 'amber', name: '앰버', description: 'Amber 계열' },
  { id: 'spicy', name: '스파이시', description: 'Spicy 계열' },
  { id: 'fruity', name: '프루티', description: 'Fruity(과일향) 계열' },
  { id: 'aldehyde', name: '알데히드', description: 'Aldehyde 계열' },
  { id: 'oceanic', name: '오셔닉', description: 'Oceanic 계열' },
  { id: 'tobacco_leather', name: '타바코 레더', description: 'Tobacco Leather 계열' },
  { id: 'powdery', name: '파우더리', description: 'Powdery 계열' },
  { id: 'gourmand', name: '구르망', description: 'Gourmand 계열' },
  { id: 'bouquet', name: '부케', description: 'Bouquet 계열' },
  { id: 'warm', name: '웜', description: 'Warm 계열' }
];

// Note 카테고리별 분류 (주요 note들의 카테고리 매핑)
export const NOTE_TO_CATEGORY: { [key: string]: string } = {
  // 시트러스
  'bergamot': 'citrus',
  'lemon': 'citrus',
  'grapefruit': 'citrus',
  'mandarin orange orange': 'citrus',
  'orange blossom': 'citrus',
  'lime': 'citrus',
  'yuzu': 'citrus',
  'citron': 'citrus',
  
  // 플로럴
  'jasmine': 'floral',
  'rose': 'floral',
  'lavender': 'floral',
  'iris': 'floral',
  'peony': 'floral',
  'freesia': 'floral',
  'ylang-ylang': 'floral',
  'tuberose': 'floral',
  'orchid': 'floral',
  'lily-of-the-valley': 'floral',
  'magnolia': 'floral',
  'violet': 'floral',
  'gardenia': 'floral',
  'neroli': 'floral',
  
  // 우디
  'sandalwood': 'woody',
  'cedar': 'woody',
  'vetiver': 'woody',
  'patchouli': 'woody',
  'cedarwood': 'woody',
  'cashmere wood': 'woody',
  'guaiac wood': 'woody',
  'agarwood': 'woody',
  
  // 앰버/오리엔탈
  'amber': 'amber',
  'vanilla': 'amber',
  'musk': 'amber',
  'tonka bean': 'amber',
  'benzoin': 'amber',
  'labdanum': 'amber',
  'incense': 'oriental',
  'myrrh': 'oriental',
  'olibanum': 'oriental',
  
  // 스파이시
  'pink pepper': 'spicy',
  'cardamom': 'spicy',
  'pepper': 'spicy',
  'ginger': 'spicy',
  'cinnamon': 'spicy',
  'nutmeg': 'spicy',
  'saffron': 'spicy',
  'black pepper': 'spicy',
  
  // 프루티
  'peach': 'fruity',
  'pear': 'fruity',
  'apple': 'fruity',
  'plum': 'fruity',
  'raspberry': 'fruity',
  'black currant': 'fruity',
  'strawberry': 'fruity',
  'apricot': 'fruity',
  
  // 그린
  'green notes': 'green',
  'violet leaf': 'green',
  'green tea': 'green',
  'mint': 'green',
  'basil': 'green',
  'sage': 'green',
  
  // 구르망
  'caramel': 'gourmand',
  'honey': 'gourmand',
  'chocolate': 'gourmand',
  'coffee': 'gourmand',
  'almond': 'gourmand',
  'coconut': 'gourmand',
  
  // 기타 매핑...
};

class NoteService {
  // 모든 결정된 note 정보 가져오기
  async getAllDeterminedNotes(): Promise<ApiResponse<DeterminedNote[]>> {
    try {
      const response = await apiClient.get<DeterminedNote[]>('/perfume/getAllDeterminedNotes');
      return response;
    } catch (error) {
      console.error('Failed to fetch determined notes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch note information'
      };
    }
  }

  // 자주 사용되는 note들 가져오기
  getPopularNotes(): typeof POPULAR_NOTES {
    return POPULAR_NOTES;
  }

  // Note 카테고리 목록 가져오기
  getNoteCategories(): typeof NOTE_CATEGORIES {
    return NOTE_CATEGORIES;
  }

  // Note를 카테고리로 분류
  categorizeNote(noteName: string): string {
    const lowerName = noteName.toLowerCase();
    return NOTE_TO_CATEGORY[lowerName] || 'other';
  }

  // 카테고리별로 note들을 그룹화
  groupNotesByCategory(notes: DeterminedNote[]): { [categoryId: string]: DeterminedNote[] } {
    const grouped: { [categoryId: string]: DeterminedNote[] } = {};
    
    // 모든 카테고리 초기화
    NOTE_CATEGORIES.forEach(category => {
      grouped[category.id] = [];
    });
    grouped['other'] = [];

    // Note들을 카테고리별로 분류
    notes.forEach(note => {
      const categoryId = this.categorizeNote(note.name);
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(note);
    });

    return grouped;
  }

  // Note 검색 (이름과 한국어 이름 모두 검색)
  searchNotes(notes: DeterminedNote[], query: string): DeterminedNote[] {
    if (!query.trim()) return notes;
    
    const lowerQuery = query.toLowerCase();
    return notes.filter(note => 
      note.name.toLowerCase().includes(lowerQuery) ||
      note.koreanName.toLowerCase().includes(lowerQuery)
    );
  }

  // 타입별로 note 필터링
  filterNotesByType(notes: DeterminedNote[], type: 'top' | 'middle' | 'base' | 'all'): DeterminedNote[] {
    if (type === 'all') return notes;
    return notes.filter(note => note.type === type);
  }

  // 사용자 보유 note 추가
  async addUserNote(userId: string, noteName: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/perfume/note', {
        userId: userId,
        note: noteName
      });
      return response;
    } catch (error) {
      console.error('Failed to add user note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to add note to user inventory'
      };
    }
  }

  // 사용자 보유 note 제거
  async removeUserNote(userId: string, noteName: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/perfume/note?userId=${encodeURIComponent(userId)}&noteName=${encodeURIComponent(noteName)}`);
      return response;
    } catch (error) {
      console.error('Failed to remove user note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to remove note from user inventory'
      };
    }
  }

  // 사용자 보유 note 조회
  async getUserNotes(userId: string): Promise<ApiResponse<DeterminedNote[]>> {
    try {
      const response = await apiClient.get<DeterminedNote[]>(`/perfume/note/${encodeURIComponent(userId)}`);
      return response;
    } catch (error) {
      console.error('Failed to get user notes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch user note inventory'
      };
    }
  }
}

export const noteService = new NoteService();
export default noteService;