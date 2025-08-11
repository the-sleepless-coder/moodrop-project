import Constants from 'expo-constants';

// 환경변수 타입 정의
export interface EnvConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENV: 'development' | 'staging' | 'production';
  DEVICE_ID: string;
  MAX_SLOTS: number;
}

// 환경변수 읽기 및 검증
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

// 환경변수 설정
export const ENV: EnvConfig = {
  API_BASE_URL: getEnvVar('EXPO_PUBLIC_API_BASE_URL'),
  API_TIMEOUT: parseInt(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', '10000'), 10),
  ENV: getEnvVar('EXPO_PUBLIC_ENV', 'development') as EnvConfig['ENV'],
  DEVICE_ID: getEnvVar('EXPO_PUBLIC_DEVICE_ID', 'moodrop-station-001'),
  MAX_SLOTS: parseInt(getEnvVar('EXPO_PUBLIC_MAX_SLOTS', '10'), 10),
};

// 환경별 설정
export const isDevelopment = ENV.ENV === 'development';
export const isProduction = ENV.ENV === 'production';

// API 엔드포인트
export const API_ENDPOINTS = {
  // 카테고리 및 무드
  CATEGORY_MOOD: '/categoryMood',
  
  // 향수 관련
  PERFUME: {
    ACCORD: '/perfume/accord',
    LIST: '/perfume/accord', // POST /perfume/accord/{userId}
  },
  
  // 향료 관련
  INGREDIENTS: {
    LIST: '/ingredients',
    AVAILABLE: '/ingredients/available',
    UPDATE_AMOUNT: '/ingredients/update-amount',
  },
  // 슬롯 관리
  SLOTS: {
    LIST: '/slots',
    UPDATE: '/slots/update',
    ADD_INGREDIENT: '/slots/add-ingredient',
    REMOVE_INGREDIENT: '/slots/remove-ingredient',
  },
  // 디바이스 관리
  DEVICE: {
    STATUS: '/device/status',
    CONNECT: '/device/connect',
    DISCONNECT: '/device/disconnect',
  },
  // 제조 관련
  MANUFACTURING: {
    START: '/manufacturing/start',
    STATUS: '/manufacturing/status',
    STOP: '/manufacturing/stop',
  },
} as const;