import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Flower2, 
  Clock, 
  Lightbulb,
  FlaskConical,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Timer,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Sunrise,
  Moon,
  Leaf,
  Snowflake
} from 'lucide-react-native';
import useStore from '@/store/useStore';
import { ENV, isDevelopment } from '@/config/env';
import { weatherService } from '@/services/weatherService';
import { categoryService } from '@/services/categoryService';

interface ManufacturingJob {
  id: string;
  name: string;
  status: 'waiting' | 'preparing' | 'mixing' | 'filtering' | 'packaging' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  estimatedTime: string;
}

export default function HomeScreen() {
  const { 
    manufacturingJobs, 
    todayRecommendation, 
    weatherData, 
    recommendationLoading,
    shouldFetchTodayRecommendation,
    setTodayRecommendation,
    setWeatherData,
    setRecommendationLoading,
    setLastRecommendationDate
  } = useStore();
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // 날씨 기반 오늘의 향수 추천 로직
  useEffect(() => {
    const fetchTodayRecommendation = async () => {
      // 이미 오늘 추천이 있으면 skip
      if (!shouldFetchTodayRecommendation()) {
        return;
      }

      setRecommendationLoading(true);
      
      try {
        console.log('Fetching weather-based recommendation...');
        
        // 1. 날씨 정보와 무드 가져오기
        const { weather, moods } = await weatherService.getWeatherBasedMoods();
        setWeatherData(weather);
        
        console.log('Weather moods:', moods);
        
        // 2. 카테고리 정보 가져오기 (무드를 ID로 변환하기 위해)
        const categoriesResponse = await categoryService.getCategoriesWithMoods();
        if (!categoriesResponse.success) {
          throw new Error('Failed to fetch categories');
        }
        
        // 3. 무드 이름을 ID로 변환
        const allMoods = categoriesResponse.data.categories.flatMap(cat => cat.moods);
        const selectedMoodIds = moods
          .map(moodName => allMoods.find(mood => mood.name === moodName)?.id)
          .filter(id => id !== undefined);
        
        console.log('Selected mood IDs:', selectedMoodIds);
        
        if (selectedMoodIds.length === 0) {
          throw new Error('No matching moods found');
        }
        
        // 4. Accord 가져오기
        const accordResponse = await categoryService.getAccordsByMoods(selectedMoodIds.slice(0, 3)); // 최대 3개
        if (!accordResponse.success || !accordResponse.data?.accords?.length) {
          throw new Error('No accords found for selected moods');
        }
        
        // 5. 향수 추천 가져오기
        const accordNames = accordResponse.data.accords.map(accord => accord.accord);
        const perfumeResponse = await categoryService.getPerfumesByAccords(accordNames, 'weather-user');
        
        if (!perfumeResponse.success) {
          throw new Error('Failed to fetch perfumes');
        }
        
        // 6. 랜덤으로 1개 선택 (Match 우선, 없으면 NoMatch에서)
        const { Match, NoMatch } = perfumeResponse.data;
        const availablePerfumes = Match.length > 0 ? Match : NoMatch;
        
        if (availablePerfumes.length > 0) {
          const randomIndex = Math.floor(Math.random() * availablePerfumes.length);
          const selectedPerfume = availablePerfumes[randomIndex];
          
          setTodayRecommendation({
            ...selectedPerfume,
            weatherDescription: weather.weather[0]?.description || '맑음',
            temperature: Math.round(weather.main.temp),
            location: weather.name,
            selectedMoods: moods
          });
          
          setLastRecommendationDate(new Date().toISOString());
          
          console.log('Today recommendation set:', selectedPerfume.perfumeName);
        } else {
          throw new Error('No perfumes found');
        }
        
      } catch (error) {
        console.error('Failed to fetch weather-based recommendation:', error);
        // 실패 시 기본 추천
        setTodayRecommendation({
          perfumeName: '플로럴 부케',
          brandName: 'moodrop',
          description: '날씨 정보를 가져올 수 없어 기본 추천을 제공합니다',
          weatherDescription: '정보 없음',
          temperature: '--',
          location: '위치 정보 없음',
          selectedMoods: ['따뜻함']
        });
      } finally {
        setRecommendationLoading(false);
      }
    };

    fetchTodayRecommendation();
  }, []);

  // 표시용 오늘의 향수 정보
  const todayPerfume = todayRecommendation || {
    name: '로딩 중...',
    description: '날씨에 맞는 향수를 찾고 있습니다',
    duration: '',
  };

  const tips = [
    '향수는 체온이 높은 부위에 뿌리면 더 오래 지속됩니다',
    '향수를 뿌린 후 문지르지 마세요. 향이 변질될 수 있습니다',
    '하루에 2-3번 정도가 적당합니다',
  ];

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'waiting':
        return { text: '대기 중', color: '#f59e0b', icon: Clock };
      case 'preparing':
        return { text: '준비 중', color: '#3b82f6', icon: Timer };
      case 'mixing':
        return { text: '조합 중', color: '#8b5cf6', icon: FlaskConical };
      case 'filtering':
        return { text: '여과 중', color: '#06b6d4', icon: Timer };
      case 'packaging':
        return { text: '포장 중', color: '#10b981', icon: Timer };
      case 'completed':
        return { text: '완료', color: '#22c55e', icon: CheckCircle };
      case 'failed':
        return { text: '실패', color: '#ef4444', icon: Timer };
      default:
        return { text: '제작 중..', color: '#9ca3af', icon: Timer };
    }
  };

  // 현재 진행 중인 작업만 필터링
  const activeJobs = manufacturingJobs.filter((job: ManufacturingJob) => 
    job.status !== 'completed' && job.status !== 'failed'
  );

  // 최근 완료된 작업 (최대 2개)
  const completedJobs = manufacturingJobs
    .filter((job: ManufacturingJob) => job.status === 'completed')
    .slice(0, 2);

  // 향수/브랜드 이름 포매팅 함수들
  const formatPerfumeName = (name: string) => {
    if (!name) return '';
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatBrandName = (name: string) => {
    if (!name) return '';
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Day/Night 적합도 판단 함수
  const getDayNightInfo = (dayNight: { day: number; night: number }) => {
    if (!dayNight) return null;
    const dayScore = dayNight.day;
    const nightScore = dayNight.night;
    
    if (dayScore > nightScore + 20) {
      return { icon: Sunrise, color: '#f59e0b', type: 'day' };
    } else if (nightScore > dayScore + 20) {
      return { icon: Moon, color: '#6366f1', type: 'night' };
    } else {
      return null;
    }
  };

  // Season 적합도 판단 함수
  const getSeasonInfo = (season: { spring: number; summer: number; fall: number; winter: number }) => {
    if (!season) return null;
    const seasons = [
      { key: 'spring', score: season.spring, icon: Leaf, color: '#22c55e' },
      { key: 'summer', score: season.summer, icon: Sun, color: '#ef4444' },
      { key: 'fall', score: season.fall, icon: Leaf, color: '#ea580c' },
      { key: 'winter', score: season.winter, icon: Snowflake, color: '#3b82f6' }
    ];
    
    const maxSeason = seasons.reduce((max, current) => 
      current.score > max.score ? current : max
    );
    
    if (maxSeason.score >= 70) {
      return maxSeason;
    }
    
    return null;
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>안녕하세요!</Text>
          <Text style={styles.subtitle}>오늘의 향수를 찾아보세요</Text>
        </View>


        {/* 제조 현황 섹션 */}
        {(activeJobs.length > 0 || completedJobs.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>제조 현황</Text>
            
            {/* 진행 중인 작업 */}
            {activeJobs.map((job: ManufacturingJob) => {
              const statusInfo = getStatusInfo(job.status);
              const isExpanded = expandedJobs.has(job.id);
              
              return (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => toggleJobExpansion(job.id)}
                >
                  <View style={styles.manufacturingCard}>
                    <View style={styles.manufacturingHeader}>
                    <View style={styles.manufacturingInfo}>
                      <Text style={styles.manufacturingName}>{job.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                        <statusInfo.icon size={12} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                          {statusInfo.text}
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#737373" />
                    ) : (
                      <ChevronDown size={20} color="#737373" />
                    )}
                  </View>
                  
                  {job.status !== 'waiting' && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>진행률: {job.progress}%</Text>
                        <Text style={styles.estimatedTime}>예상 완료: 45초</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${job.progress}%`, backgroundColor: statusInfo.color }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                  
                  {isExpanded && (
                    <View style={styles.expandedInfo}>
                      <Text style={styles.startTime}>시작: {job.startTime}</Text>
                    </View>
                  )}
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* 완료된 작업 */}
            {completedJobs.map((job: ManufacturingJob) => (
              <View key={job.id} style={styles.completedCard}>
                <View style={styles.completedHeader}>
                  <CheckCircle size={16} color="#22c55e" />
                  <Text style={styles.completedName}>{job.name}</Text>
                  <Text style={styles.completedText}>제조 완료</Text>
                </View>
                <Text style={styles.completedTime}>완료 시간: {job.startTime}</Text>
              </View>
            ))}
            
            {manufacturingJobs.length === 0 && (
              <View style={styles.emptyManufacturing}>
                <FlaskConical size={32} color="#d1d5db" />
                <Text style={styles.emptyText}>진행 중인 제조가 없습니다</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 향수</Text>
          <TouchableOpacity
            style={styles.todayCard}
            onPress={() => {
              if (todayRecommendation) {
                // 선택된 향수로 설정하고 레시피 페이지로 이동
                useStore.getState().setSelectedPerfume(todayRecommendation);
                router.push('/category/recipe');
              }
            }}
            disabled={!todayRecommendation || recommendationLoading}
          >
            <View style={styles.perfumeInfo}>
              <Text style={styles.perfumeName}>
                {recommendationLoading ? '추천 중...' : formatPerfumeName(todayRecommendation?.perfumeName || todayPerfume.name)}
              </Text>
              <Text style={styles.perfumeBrand}>
                {!recommendationLoading && todayRecommendation ? 
                  `${formatBrandName(todayRecommendation.brandName)} • ${todayRecommendation.year || 'Unknown'} • ${todayRecommendation.country || 'Unknown'}` :
                  (recommendationLoading ? '날씨에 맞는 향수를 찾고 있습니다' : (todayRecommendation?.description || todayPerfume.description))
                }
              </Text>
              
              <View style={styles.perfumeDetails}>
                {!recommendationLoading && todayRecommendation?.ratingInfo && (
                  <View style={styles.rating}>
                    <FlaskConical size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.ratingText}>{todayRecommendation.ratingInfo.ratingVal}</Text>
                    <Text style={styles.ratingCount}>({todayRecommendation.ratingInfo.ratingCount})</Text>
                  </View>
                )}
                
                {/* 날씨 정보 */}
                {todayRecommendation && (
                  <View style={styles.weatherInfoCompact}>
                    <View style={styles.weatherItem}>
                      <Thermometer size={12} color="#1e40af" />
                      <Text style={styles.weatherTextCompact}>{todayRecommendation.temperature}°C</Text>
                    </View>
                    <View style={styles.weatherItem}>
                      <Cloud size={12} color="#1e40af" />
                      <Text style={styles.weatherTextCompact}>{todayRecommendation.weatherDescription}</Text>
                    </View>
                  </View>
                )}
                
                {/* Day/Night & Season 아이콘 - 있다면 표시 */}
                {!recommendationLoading && todayRecommendation?.dayNight && todayRecommendation?.season && (
                  <View style={styles.iconBar}>
                    {(() => {
                      const dayNightInfo = getDayNightInfo(todayRecommendation.dayNight);
                      const seasonInfo = getSeasonInfo(todayRecommendation.season);
                      
                      return (
                        <>
                          {dayNightInfo && (
                            <View style={styles.iconItem}>
                              <dayNightInfo.icon size={12} color={dayNightInfo.color} />
                            </View>
                          )}
                          {seasonInfo && (
                            <View style={styles.iconItem}>
                              <seasonInfo.icon size={12} color={seasonInfo.color} />
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </View>
                )}
              </View>
              
              {/* 선택된 무드 표시 */}
              {todayRecommendation?.selectedMoods && (
                <View style={styles.moodsContainer}>
                  <Text style={styles.moodsLabel}>날씨 기반 무드: </Text>
                  <Text style={styles.moodsText}>{todayRecommendation.selectedMoods.join(', ')}</Text>
                </View>
              )}
            </View>
            
            {!recommendationLoading && todayRecommendation && (
              <View style={styles.chevronContainer}>
                <Text style={styles.actionText}>제조하기</Text>
                <FlaskConical size={18} color="#1e40af" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>향수 팁</Text>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Lightbulb size={16} color="#f59e0b" />
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* 디버그 정보 - 백업 (주석 처리) */}
        {/* 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 디버그 정보</Text>
          <View style={styles.debugCard}>
            <Text style={styles.debugLabel}>API URL:</Text>
            <Text style={styles.debugValue}>{ENV.API_BASE_URL}</Text>
            <Text style={styles.debugLabel}>Environment:</Text>
            <Text style={styles.debugValue}>{ENV.ENV}</Text>
            <Text style={styles.debugLabel}>Build Mode:</Text>
            <Text style={styles.debugValue}>{__DEV__ ? 'Development' : 'Production'}</Text>
            <Text style={styles.debugLabel}>Recommendation Status:</Text>
            <Text style={styles.debugValue}>
              {recommendationLoading ? '로딩 중...' : 
               todayRecommendation ? `성공: ${todayRecommendation.source || 'unknown'}` : '대기 중'}
            </Text>
            {weatherData && (
              <>
                <Text style={styles.debugLabel}>Weather Source:</Text>
                <Text style={styles.debugValue}>{weatherData.source}</Text>
              </>
            )}
            
            <TouchableOpacity 
              style={styles.testButton}
              onPress={async () => {
                try {
                  const response = await fetch(`${ENV.API_BASE_URL}/categoryMood`);
                  const text = await response.text();
                  alert(`API Test:\nStatus: ${response.status}\nResponse: ${text.substring(0, 200)}...`);
                } catch (error) {
                  alert(`API Test Failed:\n${error.message}`);
                }
              }}
            >
              <Text style={styles.testButtonText}>API 연결 테스트</Text>
            </TouchableOpacity>
          </View>
        </View>
        */}
      </ScrollView>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#525252',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  // 제조 현황 스타일
  manufacturingCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  manufacturingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  manufacturingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manufacturingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#525252',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#737373',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  expandedInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  startTime: {
    fontSize: 13,
    color: '#737373',
  },
  completedCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  completedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
    flex: 1,
  },
  completedText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  completedTime: {
    fontSize: 12,
    color: '#16a34a',
  },
  emptyManufacturing: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  perfumeInfo: {
    flex: 1,
  },
  perfumeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  perfumeBrand: {
    fontSize: 13,
    color: '#737373',
    marginBottom: 8,
  },
  perfumeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#171717',
    marginLeft: 4,
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: 12,
    color: '#737373',
    marginLeft: 4,
  },
  weatherInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherTextCompact: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '500',
  },
  iconBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconItem: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chevronContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  actionText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '500',
    marginBottom: 4,
  },
  moodsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  moodsLabel: {
    fontSize: 11,
    color: '#737373',
  },
  moodsText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#525252',
    lineHeight: 20,
  },
  // 디버그 정보 스타일
  debugCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  debugLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  debugValue: {
    fontSize: 14,
    color: '#1e40af',
    fontFamily: 'monospace',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
});
