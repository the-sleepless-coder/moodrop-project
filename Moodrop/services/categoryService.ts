import apiClient, { ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/env';
import { Category, Mood, CategoryMoodResponse, CategoryMoodApiResponse, CategoryMoodApiItem } from '../types/category';

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
}

// 카테고리 서비스 인스턴스 생성 및 내보내기
export const categoryService = new CategoryService();
export default categoryService;