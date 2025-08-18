import { create } from 'zustand';

const useStore = create((set, get) => ({
  // 향수 카테고리 관련 상태
  selectedCategory: null,
  selectedSubcategories: [], // 문자열 배열 (호환성)
  selectedMoods: [], // Mood 객체 배열 (새로 추가)
  accords: [], // 조회된 accord 목록
  recommendations: [],
  selectedPerfume: null,
  currentPage: 1,
  totalPages: 0,
  
  // API 로딩 상태
  accordsLoading: false,
  recommendationsLoading: false,

  // 제조 관련 상태
  manufacturingStatus: 'idle', // idle, connecting, manufacturing, completed
  manufacturingProgress: 0,
  manufacturingJobs: [],

  // 기기 연결 상태
  deviceConnected: false,
  deviceInfo: null,

  // 사용자 정보
  userProfile: {
    name: '',
    email: '',
    favoriteScents: [],
    manufacturingHistory: [],
  },

  // 날씨 기반 오늘의 향수 추천
  todayRecommendation: null,
  weatherData: null,
  recommendationLoading: false,
  lastRecommendationDate: null,

  // 기기 원료 정보 (초기에는 빈 슬롯들)
  deviceIngredients: [
    { id: 'slot-1', name: '', slot: 1, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-2', name: '', slot: 2, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-4', name: '', slot: 4, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-5', name: '', slot: 5, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-6', name: '', slot: 6, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-7', name: '', slot: 7, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-8', name: '', slot: 8, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-10', name: '', slot: 10, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-11', name: '', slot: 11, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: 'slot-12', name: '', slot: 12, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
  ],

  // Actions
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  setSelectedSubcategories: (subcategories) => set({ selectedSubcategories: subcategories }),
  
  setSelectedMoods: (moods) => set({ selectedMoods: moods }),
  
  setAccords: (accords) => set({ accords }),
  
  setAccordsLoading: (loading) => set({ accordsLoading: loading }),
  
  setRecommendationsLoading: (loading) => set({ recommendationsLoading: loading }),
  
  setRecommendations: (recommendations, page, totalPages) => set({
    recommendations,
    currentPage: page,
    totalPages
  }),
  
  setSelectedPerfume: (perfume) => set({ selectedPerfume: perfume }),
  
  setManufacturingStatus: (status) => set({ manufacturingStatus: status }),
  
  setManufacturingProgress: (progress) => set({ manufacturingProgress: progress }),
  
  addManufacturingJob: (job) => set((state) => ({
    manufacturingJobs: [...state.manufacturingJobs, job]
  })),
  
  updateManufacturingJob: (jobId, updates) => set((state) => ({
    manufacturingJobs: state.manufacturingJobs.map(job =>
      job.id === jobId ? { ...job, ...updates } : job
    )
  })),
  
  setDeviceConnected: (connected) => set({ deviceConnected: connected }),
  
  setDeviceInfo: (info) => set({ deviceInfo: info }),
  
  updateUserProfile: (updates) => set((state) => ({
    userProfile: { ...state.userProfile, ...updates }
  })),

  // 기기 원료 관리 액션들
  setDeviceIngredients: (ingredients) => set({ deviceIngredients: ingredients }),
  
  updateIngredientAmount: (id, newAmount) => set((state) => ({
    deviceIngredients: state.deviceIngredients.map(ingredient =>
      ingredient.id === id 
        ? { ...ingredient, amount: Math.max(0, Math.min(newAmount, ingredient.maxAmount)) }
        : ingredient
    )
  })),
  
  addIngredientToSlot: (slotId, ingredientData) => set((state) => ({
    deviceIngredients: state.deviceIngredients.map(slot =>
      slot.id === slotId 
        ? { 
            ...slot, 
            name: ingredientData.name, 
            color: ingredientData.color, 
            isEmpty: false,
            amount: 30 // 새로 추가할 때 최대치로 설정
          }
        : slot
    )
  })),
  
  removeIngredientFromSlot: (slotId) => set((state) => ({
    deviceIngredients: state.deviceIngredients.map(slot =>
      slot.id === slotId 
        ? { 
            ...slot, 
            name: '', 
            color: '#e5e7eb', 
            isEmpty: true,
            amount: 0
          }
        : slot
    )
  })),
  
  clearAllIngredients: () => set((state) => ({
    deviceIngredients: state.deviceIngredients.map(ingredient => ({
      ...ingredient,
      name: '',
      color: '#e5e7eb',
      isEmpty: true,
      amount: 0
    }))
  })),
  
  // 에탄올 확인 헬퍼 함수
  hasEthanol: () => {
    const state = get();
    const ethanolIngredient = state.deviceIngredients.find(ingredient => 
      !ingredient.isEmpty && (ingredient.name === '에탄올' || ingredient.name === 'ethanol')
    );
    return ethanolIngredient && ethanolIngredient.amount > 0;
  },

  // 날씨 기반 추천 액션들
  setTodayRecommendation: (perfume) => set({ todayRecommendation: perfume }),
  
  setWeatherData: (weather) => set({ weatherData: weather }),
  
  setRecommendationLoading: (loading) => set({ recommendationLoading: loading }),
  
  setLastRecommendationDate: (date) => set({ lastRecommendationDate: date }),
  
  // 오늘 추천이 이미 있는지 확인하는 헬퍼 함수
  shouldFetchTodayRecommendation: () => {
    const state = get();
    if (!state.lastRecommendationDate || !state.todayRecommendation) {
      return true;
    }
    
    const today = new Date().toDateString();
    const lastDate = new Date(state.lastRecommendationDate).toDateString();
    
    return today !== lastDate;
  },

  // Reset functions
  resetRecommendations: () => set({
    selectedCategory: null,
    selectedSubcategories: [],
    recommendations: [],
    selectedPerfume: null,
    currentPage: 1,
    totalPages: 0
  }),
}));

export default useStore;