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