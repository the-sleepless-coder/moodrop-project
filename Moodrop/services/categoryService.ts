import apiClient, { ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/env';
import { 
  Category, 
  Mood, 
  CategoryMoodResponse, 
  CategoryMoodApiResponse, 
  CategoryMoodApiItem,
  Accord,
  AccordResponse,
  AccordRequestParams,
  Perfume,
  PerfumeListResponse,
  PerfumeListRequestParams
} from '../types/category';

// 카테고리 및 무드 데이터 서비스
class CategoryService {
  
  /**
   * API 응답을 앱 내부 형식으로 변환합니다.
   */
  private transformApiResponse(apiData: CategoryMoodApiItem[]): Category[] {
    const categoryMap = new Map<number, Category>();
    
    apiData.forEach(item => {
      const { categoryId, categoryDescription, moodId, moodDescription } = item;
      
      // 카테고리가 없으면 생성
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryDescription,
          description: categoryDescription,
          moods: []
        });
      }
      
      // 무드 추가
      const category = categoryMap.get(categoryId)!;
      category.moods.push({
        id: moodId,
        name: moodDescription,
        description: moodDescription,
        categoryId: categoryId
      });
    });
    
    return Array.from(categoryMap.values());
  }

  /**
   * 모든 카테고리와 무드 데이터를 조회합니다.
   */
  async getCategoriesWithMoods(): Promise<ApiResponse<CategoryMoodResponse>> {
    try {
      const response = await apiClient.get<CategoryMoodApiResponse>(
        API_ENDPOINTS.CATEGORY_MOOD
      );
      
      console.log('CategoryMood API Raw Response:', response);
      
      if (response.success && response.data) {
        // API 응답을 변환
        const transformedCategories = this.transformApiResponse(response.data);
        
        const transformedResponse: ApiResponse<CategoryMoodResponse> = {
          success: true,
          data: {
            categories: transformedCategories
          },
          message: response.message
        };
        
        console.log('CategoryMood API Transformed Response:', transformedResponse);
        return transformedResponse;
      }
      
      return response as ApiResponse<CategoryMoodResponse>;
    } catch (error) {
      console.error('Failed to fetch categories and moods:', error);
      throw error;
    }
  }

  /**
   * 특정 카테고리의 무드 목록만 조회합니다.
   */
  async getMoodsByCategory(categoryId: number): Promise<Mood[]> {
    try {
      const response = await this.getCategoriesWithMoods();
      
      if (response.success && response.data) {
        const category = response.data.categories.find(cat => cat.id === categoryId);
        return category?.moods || [];
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to fetch moods for category ${categoryId}:`, error);
      return [];
    }
  }

  /**
   * 카테고리 ID로 카테고리 정보를 조회합니다.
   */
  async getCategoryById(categoryId: number): Promise<Category | null> {
    try {
      const response = await this.getCategoriesWithMoods();
      
      if (response.success && response.data) {
        return response.data.categories.find(cat => cat.id === categoryId) || null;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch category ${categoryId}:`, error);
      return null;
    }
  }

  /**
   * 무드 ID로 무드 정보를 조회합니다.
   */
  async getMoodById(moodId: number): Promise<Mood | null> {
    try {
      const response = await this.getCategoriesWithMoods();
      
      if (response.success && response.data) {
        for (const category of response.data.categories) {
          const mood = category.moods.find(m => m.id === moodId);
          if (mood) {
            return mood;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch mood ${moodId}:`, error);
      return null;
    }
  }

  /**
   * 카테고리 이름으로 검색합니다.
   */
  async searchCategoriesByName(searchTerm: string): Promise<Category[]> {
    try {
      const response = await this.getCategoriesWithMoods();
      
      if (response.success && response.data) {
        return response.data.categories.filter(category =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to search categories with term "${searchTerm}":`, error);
      return [];
    }
  }

  /**
   * 무드 이름으로 검색합니다.
   */
  async searchMoodsByName(searchTerm: string): Promise<Mood[]> {
    try {
      const response = await this.getCategoriesWithMoods();
      const foundMoods: Mood[] = [];
      
      if (response.success && response.data) {
        response.data.categories.forEach(category => {
          const matchingMoods = category.moods.filter(mood =>
            mood.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          foundMoods.push(...matchingMoods);
        });
      }
      
      return foundMoods;
    } catch (error) {
      console.error(`Failed to search moods with term "${searchTerm}":`, error);
      return [];
    }
  }

  /**
   * 선택된 무드 ID들로 accord 목록을 조회합니다.
   * @param moodIds - 최대 3개의 무드 ID 배열
   * @returns 가중치 높은 순으로 정렬된 12개의 accord 목록
   */
  async getAccordsByMoods(moodIds: number[]): Promise<ApiResponse<AccordResponse>> {
    try {
      // moodId 개수 검증 (최대 3개)
      if (moodIds.length === 0 || moodIds.length > 3) {
        return {
          success: false,
          error: 'moodIds는 1개 이상 3개 이하여야 합니다.',
          message: 'Invalid moodIds count'
        } as ApiResponse<AccordResponse>;
      }

      // 쿼리 파라미터 생성: moodId=1&moodId=3&moodId=5
      const queryParams = moodIds.map(id => `moodId=${id}`).join('&');
      const endpoint = `${API_ENDPOINTS.PERFUME.ACCORD}?${queryParams}`;
      
      console.log('Accord API Request:', endpoint);
      
      const response = await apiClient.get<Accord[]>(endpoint);
      
      console.log('Accord API Raw Response:', response);
      
      if (response.success && response.data) {
        // 서버는 Accord 배열을 직접 반환하므로 AccordResponse 형태로 래핑
        const wrappedResponse: ApiResponse<AccordResponse> = {
          success: true,
          data: {
            accords: response.data
          },
          message: response.message
        };
        console.log('Accord API Success Response:', wrappedResponse);
        return wrappedResponse;
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch accords:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch accords'
      } as ApiResponse<AccordResponse>;
    }
  }

  /**
   * 선택된 무드들의 이름으로 accord를 조회합니다.
   * @param selectedMoods - 선택된 무드 객체 배열
   * @returns accord 목록
   */
  async getAccordsBySelectedMoods(selectedMoods: Mood[]): Promise<ApiResponse<AccordResponse>> {
    const moodIds = selectedMoods.map(mood => mood.id);
    return this.getAccordsByMoods(moodIds);
  }

  /**
   * accord 배열을 사용하여 향수 리스트를 조회합니다.
   * @param accords - accord 문자열 배열
   * @param userId - 사용자 ID (기본값: 1)
   * @returns Match와 NoMatch로 분류된 향수 목록
   */
  async getPerfumesByAccords(accords: string[], userId: number = 1): Promise<ApiResponse<PerfumeListResponse>> {
    try {
      // accords 배열 검증
      if (!accords || accords.length === 0) {
        return {
          success: false,
          error: 'accords 배열이 비어있습니다.',
          message: 'Empty accords array'
        } as ApiResponse<PerfumeListResponse>;
      }

      const endpoint = `${API_ENDPOINTS.PERFUME.LIST}/${userId}`;
      const requestBody: PerfumeListRequestParams = { accords };
      
      console.log('PerfumeList API Request:', endpoint, requestBody);
      
      const response = await apiClient.post<PerfumeListResponse>(endpoint, requestBody);
      
      console.log('PerfumeList API Raw Response:', response);
      
      if (response.success && response.data) {
        console.log('PerfumeList API Success:', {
          matchCount: response.data.Match?.length || 0,
          noMatchCount: response.data.NoMatch?.length || 0
        });
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch perfumes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch perfumes'
      } as ApiResponse<PerfumeListResponse>;
    }
  }

  /**
   * Accord 객체 배열을 사용하여 향수 리스트를 조회합니다.
   * @param accordObjects - Accord 객체 배열
   * @param userId - 사용자 ID (기본값: 1)
   * @returns Match와 NoMatch로 분류된 향수 목록
   */
  async getPerfumesByAccordObjects(accordObjects: Accord[], userId: number = 1): Promise<ApiResponse<PerfumeListResponse>> {
    const accordNames = accordObjects.map(accord => accord.accord);
    return this.getPerfumesByAccords(accordNames, userId);
  }
}

// 카테고리 서비스 인스턴스 생성 및 내보내기
export const categoryService = new CategoryService();
export default categoryService;