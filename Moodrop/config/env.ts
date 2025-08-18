import Constants from 'expo-constants';

// 환경변수 타입 정의
export interface EnvConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENV: 'development' | 'staging' | 'production';
  DEVICE_ID: string;
  MAX_SLOTS: number;
  WEATHER_API_KEY: string;
}

// 환경변수 읽기 및 검증
const getEnvVar = (key: string, defaultValue?: string): string => {
  try {
    // EAS 빌드에서는 Constants.expoConfig.extra 우선, 로컬에서는 process.env 사용
    const value = Constants.expoConfig?.extra?.[key] || 
                  (typeof process !== 'undefined' ? process.env?.[key] : undefined);
    
    if (!value && !defaultValue) {
      console.warn(`Environment variable ${key} is not set, using empty string`);
      return '';
    }
    return value || defaultValue || '';
  } catch (error) {
    console.warn(`Error reading environment variable ${key}:`, error);
    return defaultValue || '';
  }
};

// 환경변수 설정
export const ENV: EnvConfig = {
  API_BASE_URL: getEnvVar('EXPO_PUBLIC_API_BASE_URL', 'http://3.39.229.189:8081/api'),
  API_TIMEOUT: parseInt(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', '10000'), 10) || 10000,
  ENV: (getEnvVar('EXPO_PUBLIC_ENV', 'development') as EnvConfig['ENV']) || 'development',
  DEVICE_ID: getEnvVar('EXPO_PUBLIC_DEVICE_ID', 'moodrop-station-001'),
  MAX_SLOTS: parseInt(getEnvVar('EXPO_PUBLIC_MAX_SLOTS', '10'), 10) || 10,
  WEATHER_API_KEY: getEnvVar('Weather_API', 'x1Dmxs1RvFtObms8XR%2BX8kFgfmDQTMbIug78GTCxovSSWbDWME%2BTWD2OqSA68cQSzYrwjwIXhnms7E9NNsXs2w%3D%3D'),
};

// 디버깅용 - APK에서도 확인 가능하도록 (개발 환경에서만)
if (ENV.ENV === 'development') {
  console.log(`API URL: ${ENV.API_BASE_URL}`);
  // APK에서도 확인 가능하도록 전역 변수로 설정
  (global as any).__DEBUG_API_URL = ENV.API_BASE_URL;
}

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
    SELECT_NOTE: '/perfume/selectNote', // GET /perfume/selectNote/{perfumeId}
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