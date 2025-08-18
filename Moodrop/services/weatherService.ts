import { ENV } from '@/config/env';

// 기상청 API 응답 타입
export interface KmaWeatherItem {
  baseDate: string;
  baseTime: string;
  category: string;
  nx: number;
  ny: number;
  obsrValue: string;
}

export interface KmaWeatherResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      dataType: string;
      items: {
        item: KmaWeatherItem[];
      };
      pageNo: number;
      numOfRows: number;
      totalCount: number;
    };
  };
}

// 통합 날씨 데이터 타입 (앱에서 사용)
export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
  source: 'kma' | 'openweather';
}

// 위치 정보 타입
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

// 날씨 기반 무드 매핑
const weatherToMoodMapping = {
  // 맑은 날씨 (800)
  'Clear': ['청량함', '따뜻함'],
  
  // 구름 (801-804)
  'Clouds': ['촉촉함', '차가움'],
  
  // 비 (500-531)
  'Rain': ['촉촉함', '차가움', '청결'],
  'Drizzle': ['촉촉함', '청결'],
  
  // 눈 (600-622)
  'Snow': ['차가움', '청결'],
  
  // 안개/연무 (700-781)
  'Mist': ['촉촉함'],
  'Smoke': ['쌉쌀함'],
  'Haze': ['촉촉함'],
  'Fog': ['촉촉함'],
  
  // 천둥번개 (200-232)
  'Thunderstorm': ['씁쓸함', '차가움'],
  
  // 극한 날씨
  'Tornado': ['차가움'],
  'Squall': ['차가움'],
} as const;

// 계절별 무드 매핑 (온도 기반)
const temperatureToMoodMapping = (temp: number): string[] => {
  if (temp >= 28) return ['청량함', '달콤함']; // 여름 (28도 이상)
  if (temp >= 20) return ['따뜻함', '달콤함']; // 늦봄/초가을 (20-27도)
  if (temp >= 10) return ['따뜻함', '청결']; // 봄/가을 (10-19도)
  return ['차가움', '촉촉함']; // 겨울 (10도 미만)
};

class WeatherService {
  private readonly OPENWEATHER_API_KEY = '4a67650bfe53d22acc23dba49a568ce6'; // OpenWeatherMap 무료 API 키
  private readonly OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
  
  // 기상청 API 설정
  private readonly KMA_API_KEY = ENV.WEATHER_API_KEY;
  private readonly KMA_BASE_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

  /**
   * 기상청 API로 서울 지역 현재 날씨 정보를 가져옵니다
   */
  async getKmaCurrentWeather(): Promise<WeatherData> {
    // 서울 기상청 격자 좌표 (nx=60, ny=127)
    const nx = 60;
    const ny = 127;
    
    // 현재 시간 설정
    const now = new Date();
    const baseDate = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0');
    
    // 기상청은 매시간 40분에 업데이트되므로 이전 시간 데이터 사용
    const currentHour = now.getHours();
    const baseTime = (currentHour < 1 ? 23 : currentHour - 1).toString().padStart(2, '0') + '00';
    
    const url = `${this.KMA_BASE_URL}/getUltraSrtNcst?serviceKey=${this.KMA_API_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
    
    try {
      console.log('KMA API URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`KMA API error: ${response.status}`);
      }
      
      const data: KmaWeatherResponse = await response.json();
      console.log('KMA API Response:', data);
      
      if (data.response.header.resultCode !== '00') {
        throw new Error(`KMA API error: ${data.response.header.resultMsg}`);
      }
      
      // 기상청 데이터를 WeatherData 형태로 변환
      return this.convertKmaToWeatherData(data);
      
    } catch (error) {
      console.error('Failed to fetch KMA weather data:', error);
      throw error;
    }
  }

  /**
   * 기상청 API 응답을 WeatherData 형태로 변환합니다
   */
  private convertKmaToWeatherData(kmaData: KmaWeatherResponse): WeatherData {
    const items = kmaData.response.body.items.item;
    
    // 데이터 추출
    const tempItem = items.find(item => item.category === 'T1H'); // 기온
    const humidityItem = items.find(item => item.category === 'REH'); // 습도
    const rainItem = items.find(item => item.category === 'PTY'); // 강수형태
    const rainAmountItem = items.find(item => item.category === 'RN1'); // 1시간 강수량
    
    const temperature = tempItem ? parseFloat(tempItem.obsrValue) : 20;
    const humidity = humidityItem ? parseFloat(humidityItem.obsrValue) : 50;
    const rainType = rainItem ? parseInt(rainItem.obsrValue) : 0;
    const rainAmount = rainAmountItem ? parseFloat(rainAmountItem.obsrValue) : 0;
    
    // 강수형태 변환 (0: 없음, 1: 비, 2: 비/눈, 3: 눈, 5: 빗방울, 6: 빗방울눈날림, 7: 눈날림)
    let weatherMain = 'Clear';
    let weatherDescription = '맑음';
    
    if (rainType === 1 || rainType === 5) {
      weatherMain = 'Rain';
      weatherDescription = rainAmount > 0 ? '비' : '흐림';
    } else if (rainType === 2 || rainType === 6) {
      weatherMain = 'Rain';
      weatherDescription = '비/눈';
    } else if (rainType === 3 || rainType === 7) {
      weatherMain = 'Snow';
      weatherDescription = '눈';
    } else if (humidity > 80) {
      weatherMain = 'Clouds';
      weatherDescription = '흐림';
    }
    
    return {
      main: {
        temp: temperature,
        feels_like: temperature, // 기상청에서 체감온도 미제공
        humidity: humidity,
      },
      weather: [{
        id: rainType,
        main: weatherMain,
        description: weatherDescription,
        icon: this.getWeatherIcon(weatherMain, rainType),
      }],
      name: '서울',
      source: 'kma'
    };
  }

  /**
   * 날씨 상태에 따른 아이콘 코드 반환
   */
  private getWeatherIcon(weatherMain: string, rainType: number): string {
    switch (weatherMain) {
      case 'Clear': return '01d';
      case 'Clouds': return '03d';
      case 'Rain': return rainType === 2 || rainType === 6 ? '13d' : '10d';
      case 'Snow': return '13d';
      default: return '01d';
    }
  }

  /**
   * 현재 위치의 날씨 정보를 가져옵니다 (OpenWeatherMap - fallback용)
   */
  async getCurrentWeather(coords: LocationCoords): Promise<WeatherData> {
    const { latitude, longitude } = coords;
    const url = `${this.OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${this.OPENWEATHER_API_KEY}&units=metric&lang=kr`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('OpenWeather API Response:', data);
      
      return {
        ...data,
        source: 'openweather'
      };
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      throw error;
    }
  }

  /**
   * 도시 이름으로 날씨 정보를 가져옵니다 (fallback용)
   */
  async getWeatherByCity(cityName: string = 'Seoul'): Promise<WeatherData> {
    const url = `${this.BASE_URL}/weather?q=${cityName}&appid=${this.API_KEY}&units=metric&lang=kr`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data: WeatherData = await response.json();
      console.log('Weather API Response (City):', data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch weather data by city:', error);
      throw error;
    }
  }

  /**
   * 날씨 정보를 바탕으로 적합한 무드를 선택합니다
   */
  getMoodFromWeather(weather: WeatherData): string[] {
    const mainWeather = weather.weather[0]?.main || 'Clear';
    const temperature = weather.main.temp;
    
    // 날씨 조건에 따른 무드
    const weatherMoods = weatherToMoodMapping[mainWeather as keyof typeof weatherToMoodMapping] || ['따뜻함'];
    
    // 온도에 따른 무드
    const tempMoods = temperatureToMoodMapping(temperature);
    
    // 두 조건을 합치고 중복 제거
    const combinedMoods = [...new Set([...weatherMoods, ...tempMoods])];
    
    console.log(`Weather: ${mainWeather}, Temp: ${temperature}°C`);
    console.log(`Selected moods: ${combinedMoods.join(', ')}`);
    
    return combinedMoods;
  }

  /**
   * 위치 권한을 요청하고 현재 위치를 가져옵니다
   */
  async getCurrentLocation(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5분 캐시
        }
      );
    });
  }

  /**
   * 날씨 기반 향수 추천을 위한 통합 메서드
   */
  async getWeatherBasedMoods(): Promise<{ weather: WeatherData; moods: string[] }> {
    try {
      let weather: WeatherData;
      
      try {
        // 1. 기상청 API 우선 시도 (한국 사용자에게 더 정확)
        console.log('Trying KMA API first...');
        weather = await this.getKmaCurrentWeather();
        console.log('KMA API success');
      } catch (kmaError) {
        console.warn('KMA API failed, trying location-based weather:', kmaError);
        
        try {
          // 2. 위치 기반 OpenWeatherMap API 시도
          const coords = await this.getCurrentLocation();
          weather = await this.getCurrentWeather(coords);
          console.log('Location-based weather success');
        } catch (locationError) {
          console.warn('Location-based weather failed, using Seoul fallback:', locationError);
          // 3. 최종 fallback: 서울 날씨
          weather = await this.getWeatherByCity('Seoul');
          console.log('Seoul fallback weather success');
        }
      }
      
      // 날씨에 따른 무드 선택
      const moods = this.getMoodFromWeather(weather);
      
      return { weather, moods };
    } catch (error) {
      console.error('All weather APIs failed:', error);
      throw error;
    }
  }
}

export const weatherService = new WeatherService();