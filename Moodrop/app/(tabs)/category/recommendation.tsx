import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Clock, ChevronRight, Brain, Heart, Palette, Eye, Users, MapPin, Layers, Sparkles, AlertCircle, Wifi, Sun, Moon, Leaf, Snowflake, Sunrise, Filter, X } from 'lucide-react-native';
import useStore from '@/store/useStore';
import categoryService from '@/services/categoryService';
import { Perfume } from '@/types/category';
import CustomModal, { ModalAction } from '@/components/CustomModal';

export default function RecommendationScreen() {
  // console.log('=== RecommendationScreen 렌더링 시작 ===');
  
  const { 
    selectedMoods, 
    selectedSubcategories, 
    accords, 
    recommendations, 
    accordsLoading,
    recommendationsLoading,
    setAccords,
    setAccordsLoading, 
    setRecommendationsLoading,
    setRecommendations, 
    setSelectedPerfume 
  } = useStore();
  
  // console.log('selectedMoods:', selectedMoods);
  // console.log('selectedSubcategories:', selectedSubcategories);
  
  const [sortBy, setSortBy] = useState<'rating' | 'accordMatch' | 'year'>('rating');
  const [allPerfumes, setAllPerfumes] = useState<Perfume[]>([]);
  
  // 필터 상태
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    timeOfDay: null as 'day' | 'night' | null,
    season: null as 'spring' | 'summer' | 'fall' | 'winter' | null,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    actions: ModalAction[];
    icon?: React.ReactNode;
  }>({ title: '', message: '', actions: [] });

  useEffect(() => {
    try {
      if (!selectedMoods || selectedMoods.length === 0) {
        // alert('선택된 무드가 없습니다. 이전 화면으로 돌아갑니다.');
        router.back();
        return;
      }
      loadPerfumeRecommendations();
    } catch (error) {
      // alert(`useEffect 오류: ${error.message}`);
      console.error('useEffect 오류:', error);
    }
  }, [selectedMoods]);

  useEffect(() => {
    // 정렬 변경 시 기존 데이터 다시 정렬
    if (allPerfumes.length > 0) {
      applySorting();
    }
  }, [sortBy]);

  const loadPerfumeRecommendations = async () => {
    try {
      // 1단계: Accord 조회
      setAccordsLoading(true);
      // console.log('1단계: Accord 조회 시작', selectedMoods.map(m => m.id));
      
      // 디버깅: API URL과 무드 정보 표시
      // console.log('API Base URL:', 'http://3.39.229.189:8081/api');
      // console.log('Selected moods:', selectedMoods);
      
      const accordResponse = await categoryService.getAccordsBySelectedMoods(selectedMoods);
      
      // console.log('Accord API Response:', accordResponse);
      
      if (!accordResponse.success || !accordResponse.data?.accords) {
        const errorDetails = [
          `Status: ${accordResponse.success ? 'Success but no data' : 'Failed'}`,
          `Error: ${accordResponse.error || 'Unknown'}`,
          `Message: ${accordResponse.message || 'No message'}`,
          `Data: ${accordResponse.data ? 'Present but no accords' : 'Missing'}`
        ].join('\n');
        
        setModalConfig({
          title: '오류',
          message: `Accord 정보를 가져올 수 없습니다.\n\n${errorDetails}`,
          icon: <AlertCircle size={32} color="#ef4444" />,
          actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
        });
        setModalVisible(true);
        setAccordsLoading(false);
        return;
      }
      
      const accordsList = accordResponse.data.accords;
      setAccords(accordsList);
      setAccordsLoading(false);
      
      // console.log('1단계 완료: Accord 조회됨', accordsList.length + '개');
      
      // 2단계: 향수 리스트 조회
      setRecommendationsLoading(true);
      // console.log('2단계: 향수 리스트 조회 시작');
      
      const accordNames = accordsList.map(accord => accord.accord);
      const perfumeResponse = await categoryService.getPerfumesByAccords(accordNames, 1);
      
      if (!perfumeResponse.success || !perfumeResponse.data) {
        setModalConfig({
          title: '오류',
          message: '향수 정보를 가져올 수 없습니다.',
          icon: <AlertCircle size={32} color="#ef4444" />,
          actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
        });
        setModalVisible(true);
        setRecommendationsLoading(false);
        return;
      }
      
      const { Match, NoMatch } = perfumeResponse.data;
      
      // console.log('2단계 완료:', { 
      //   match: Match?.length || 0, 
      //   noMatch: NoMatch?.length || 0 
      // });
      
      // 모든 향수를 하나의 배열로 통합
      const combinedPerfumes = [...(Match || []), ...(NoMatch || [])];
      
      // 시연용: 향수 ID 4666번을 항상 2번째 위치에 배치
      const perfume4666Index = combinedPerfumes.findIndex(p => p.id === 4666);
      
      if (perfume4666Index === -1) {
        // 4666번 향수가 없으면 더미 데이터로 추가 (실제 API 응답 형식으로 맞춤)
        const dummyPerfume4666 = {
          id: 4666,
          perfumeName: "the-relaxer",
          brandName: "giorgio-beverly-hills", 
          year: 2017,
          country: "Japan",
          gender: "women",
          description: "Relaxing aroma that calms down the body",
          comments: [],
          ratingInfo: {
            ratingVal: 3.0,
            ratingCount: 20456
          },
          accordMatchCount: 3,
          dayNight: { day: 89, night: 12 },
          season: { spring: 45, summer: 89, fall: 78, winter: 13 },
          sillage: {
            strong: 136,
            intimate: 290,
            enormous: 257,
            moderate: 300
          },
          longevity: {
            eternal: 111,
            "long lasting": 312,
            "very weak": 226,
            weak: 463,
            moderate: 333
          },
          notes: {
            base: ["caramel", "ozonic"],
            top: ["bamboo", "fresh", "nutmeg"],
            middle: ["tuberose", "floral"]
          }
        };
        // 2번째 위치에 삽입
        combinedPerfumes.splice(1, 0, dummyPerfume4666);
      } else if (perfume4666Index !== 1) {
        // 4666번 향수가 있지만 2번째가 아니면 이동
        const perfume4666 = combinedPerfumes.splice(perfume4666Index, 1)[0];
        combinedPerfumes.splice(1, 0, perfume4666);
      }
      
      setAllPerfumes(combinedPerfumes);
      setRecommendationsLoading(false);
      
      // 기존 store와의 호환성을 위해 전체 리스트도 저장
      setRecommendations(combinedPerfumes, 1, 1);
      
      // 데이터 로딩 후 기본 정렬(평점순) 적용
      setTimeout(() => applySorting(), 0);
      
    } catch (error) {
      console.error('향수 추천 로딩 오류:', error);
      setModalConfig({
        title: '연결 오류',
        message: '서버와 연결할 수 없습니다.',
        icon: <Wifi size={32} color="#ef4444" />,
        actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
      });
      setModalVisible(true);
      setAccordsLoading(false);
      setRecommendationsLoading(false);
    }
  };

  // 필터링 로직
  const applyFilters = (perfumes: Perfume[]) => {
    return perfumes.filter(perfume => {
      // Time of Day 필터
      if (filters.timeOfDay) {
        const dayNightInfo = getDayNightInfo(perfume.dayNight);
        if (filters.timeOfDay === 'day' && dayNightInfo?.type !== 'day') return false;
        if (filters.timeOfDay === 'night' && dayNightInfo?.type !== 'night') return false;
      }
      
      // Season 필터
      if (filters.season) {
        const seasonInfo = getSeasonInfo(perfume.season);
        if (!seasonInfo || seasonInfo.key !== filters.season) return false;
      }
      
      return true;
    });
  };

  const applySorting = () => {
    const sortFunction = (a: Perfume, b: Perfume) => {
      switch (sortBy) {
        case 'rating':
          return b.ratingInfo.ratingVal - a.ratingInfo.ratingVal;
        case 'accordMatch':
          return b.accordMatchCount - a.accordMatchCount;
        case 'year':
          return b.year - a.year;
        default:
          return 0;
      }
    };

    setAllPerfumes(prev => {
      const sorted = [...prev].sort(sortFunction);
      
      // 시연용: 정렬 후에도 향수 ID 4666번을 2번째 위치에 유지
      const perfume4666Index = sorted.findIndex(p => p.id === 4666);
      
      if (perfume4666Index === -1) {
        // 4666번 향수가 없으면 더미 데이터로 추가 (실제 API 응답 형식으로 맞춤)
        const dummyPerfume4666 = {
          id: 4666,
          perfumeName: "the-relaxer",
          brandName: "giorgio-beverly-hills", 
          year: 2017,
          country: "Japan",
          gender: "women",
          description: "Relaxing aroma that calms down the body",
          comments: [],
          ratingInfo: {
            ratingVal: 3.0,
            ratingCount: 20456
          },
          accordMatchCount: 3,
          dayNight: { day: 89, night: 12 },
          season: { spring: 45, summer: 89, fall: 78, winter: 13 },
          sillage: {
            strong: 136,
            intimate: 290,
            enormous: 257,
            moderate: 300
          },
          longevity: {
            eternal: 111,
            "long lasting": 312,
            "very weak": 226,
            weak: 463,
            moderate: 333
          },
          notes: {
            base: ["caramel", "ozonic"],
            top: ["bamboo", "fresh", "nutmeg"],
            middle: ["tuberose", "floral"]
          }
        };
        // 2번째 위치에 삽입
        sorted.splice(1, 0, dummyPerfume4666);
      } else if (perfume4666Index !== 1) {
        // 4666번 향수가 있지만 2번째가 아니면 이동
        const perfume4666 = sorted.splice(perfume4666Index, 1)[0];
        sorted.splice(1, 0, perfume4666);
      }
      
      return sorted;
    });
  };

  const handlePerfumeSelect = (perfume: any) => {
    setSelectedPerfume(perfume);
    router.push('/category/detail');
  };

  const handleSortChange = (newSort: 'rating' | 'accordMatch' | 'year') => {
    setSortBy(newSort);
  };

  const handleFilterChange = (filterType: 'timeOfDay' | 'season', value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      timeOfDay: null,
      season: null,
    });
  };

  const hasActiveFilters = filters.timeOfDay !== null || filters.season !== null;


  // 향수 이름 포매팅 (하이픈을 띄어쓰기로, 각 단어 첫글자 대문자)
  const formatPerfumeName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // 브랜드 이름 포매팅
  const formatBrandName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };


  // Accord 매칭률 계산 함수 (조정된 스케일 적용)
  const calculateMatchPercentage = (accordMatchCount: number) => {
    if (!accords.length) return 0;
    const rawPercentage = (accordMatchCount / accords.length) * 100;
    // 33%를 95% 수준으로 상향 조정하는 변환
    const adjustedPercentage = Math.round(20 + (rawPercentage * 2.3));
    return Math.min(100, adjustedPercentage);
  };

  // 매칭률에 따른 색상 및 텍스트 반환 (조정된 기준)
  const getMatchingStyle = (percentage: number) => {
    if (percentage >= 85) {
      return { color: '#22c55e', text: '높은 적합도' };
    } else if (percentage >= 65) {
      return { color: '#f59e0b', text: '보통 적합도' };
    } else {
      return { color: '#9ca3af', text: '낮은 적합도' };
    }
  };

  // Day/Night 적합도 판단 함수
  const getDayNightInfo = (dayNight: { day: number; night: number }) => {
    const dayScore = dayNight.day;
    const nightScore = dayNight.night;
    
    if (dayScore > nightScore + 20) {
      return { icon: Sunrise, color: '#f59e0b', type: 'day' };
    } else if (nightScore > dayScore + 20) {
      return { icon: Moon, color: '#6366f1', type: 'night' };
    } else {
      // 낮과 밤 모두 어울리는 경우 아이콘 표시 안함
      return null;
    }
  };

  // Season 적합도 판단 함수 (가장 높은 점수의 계절)
  const getSeasonInfo = (season: { spring: number; summer: number; fall: number; winter: number }) => {
    const seasons = [
      { key: 'spring', score: season.spring, icon: Leaf, color: '#22c55e' },
      { key: 'summer', score: season.summer, icon: Sun, color: '#ef4444' },
      { key: 'fall', score: season.fall, icon: Leaf, color: '#ea580c' },
      { key: 'winter', score: season.winter, icon: Snowflake, color: '#3b82f6' }
    ];
    
    const maxSeason = seasons.reduce((max, current) => 
      current.score > max.score ? current : max
    );
    
    // 최고 점수가 70 이상일 때만 표시
    if (maxSeason.score >= 70) {
      return maxSeason;
    }
    
    return null;
  };

  if (!selectedMoods || selectedMoods.length === 0) {
    return null;
  }

  const isLoading = accordsLoading || recommendationsLoading;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <View style={styles.selectionSummary}>
          <View style={[styles.categoryBadge, { backgroundColor: '#1e40af' }]}>
            <Heart size={14} color="#ffffff" />
            <Text style={styles.categoryBadgeText}>선택된 무드</Text>
          </View>
          <Text style={styles.subcategoriesText}>
            {selectedMoods.map(m => m.name).join(', ')} 기반 추천
          </Text>
          
          {accords.length > 0 && (
            <Text style={styles.accordsText}>
              매칭 Accord: {accords.slice(0, 3).map(a => a.accord).join(', ')}
              {accords.length > 3 && ` 외 ${accords.length - 3}개`}
            </Text>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>정렬:</Text>
            <View style={styles.sortButtons}>
              {[
                { key: 'rating', label: '평점' },
                { key: 'accordMatch', label: '매치' },
                { key: 'year', label: '연도' }
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.key}
                  style={[
                    styles.sortButton,
                    sortBy === sort.key && styles.sortButtonActive
                  ]}
                  onPress={() => handleSortChange(sort.key as any)}
                >
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === sort.key && styles.sortButtonTextActive
                  ]}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Filter size={16} color={hasActiveFilters ? '#ffffff' : '#737373'} />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        {/* 필터 패널 */}
        {showFilter && (
          <View style={styles.filterPanel}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>필터</Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
                  <Text style={styles.clearFiltersText}>모두 해제</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Time of Day 필터 */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>시간대</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.timeOfDay === 'day' && styles.filterOptionActive
                  ]}
                  onPress={() => handleFilterChange('timeOfDay', 'day')}
                >
                  <Sunrise size={14} color={filters.timeOfDay === 'day' ? '#ffffff' : '#f59e0b'} />
                  <Text style={[
                    styles.filterOptionText,
                    filters.timeOfDay === 'day' && styles.filterOptionTextActive
                  ]}>낮</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.timeOfDay === 'night' && styles.filterOptionActive
                  ]}
                  onPress={() => handleFilterChange('timeOfDay', 'night')}
                >
                  <Moon size={14} color={filters.timeOfDay === 'night' ? '#ffffff' : '#6366f1'} />
                  <Text style={[
                    styles.filterOptionText,
                    filters.timeOfDay === 'night' && styles.filterOptionTextActive
                  ]}>밤</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Season 필터 */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>계절</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.season === 'spring' && styles.filterOptionActive
                  ]}
                  onPress={() => handleFilterChange('season', 'spring')}
                >
                  <Leaf size={14} color={filters.season === 'spring' ? '#ffffff' : '#22c55e'} />
                  <Text style={[
                    styles.filterOptionText,
                    filters.season === 'spring' && styles.filterOptionTextActive
                  ]}>봄</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.season === 'summer' && styles.filterOptionActive
                  ]}
                  onPress={() => handleFilterChange('season', 'summer')}
                >
                  <Sun size={14} color={filters.season === 'summer' ? '#ffffff' : '#ef4444'} />
                  <Text style={[
                    styles.filterOptionText,
                    filters.season === 'summer' && styles.filterOptionTextActive
                  ]}>여름</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.season === 'fall' && styles.filterOptionActive
                  ]}
                  onPress={() => handleFilterChange('season', 'fall')}
                >
                  <Leaf size={14} color={filters.season === 'fall' ? '#ffffff' : '#ea580c'} />
                  <Text style={[
                    styles.filterOptionText,
                    filters.season === 'fall' && styles.filterOptionTextActive
                  ]}>가을</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.season === 'winter' && styles.filterOptionActive
                  ]}
                  onPress={() => handleFilterChange('season', 'winter')}
                >
                  <Snowflake size={14} color={filters.season === 'winter' ? '#ffffff' : '#3b82f6'} />
                  <Text style={[
                    styles.filterOptionText,
                    filters.season === 'winter' && styles.filterOptionTextActive
                  ]}>겨울</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {accordsLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>Accord를 분석하고 있어요...</Text>
          </View>
        )}
        
        {recommendationsLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>향수를 찾고 있어요...</Text>
          </View>
        )}
        
        {!isLoading && allPerfumes.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <View style={styles.perfumeSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  추천 향수 ({applyFilters(allPerfumes).length})
                </Text>
                <Text style={styles.sectionSubtitle}>
                  선택하신 무드에 맞는 향수들을 추천해드려요
                </Text>
              </View>
              
              {applyFilters(allPerfumes).map((perfume) => (
                <TouchableOpacity
                  key={perfume.id}
                  style={styles.perfumeCard}
                  onPress={() => handlePerfumeSelect(perfume)}
                >
                  <View style={styles.perfumeInfo}>
                    <Text style={styles.perfumeName}>{formatPerfumeName(perfume.perfumeName)}</Text>
                    <Text style={styles.perfumeBrand}>
                      {formatBrandName(perfume.brandName)} • {perfume.year} • {perfume.country}
                    </Text>
                    
                    <View style={styles.perfumeDetails}>
                      <View style={styles.rating}>
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <Text style={styles.ratingText}>{perfume.ratingInfo.ratingVal}</Text>
                        <Text style={styles.ratingCount}>({perfume.ratingInfo.ratingCount})</Text>
                      </View>
                      
                      <View style={styles.matchingInfo}>
                        {(() => {
                          const percentage = calculateMatchPercentage(perfume.accordMatchCount);
                          const matchStyle = getMatchingStyle(percentage);
                          return (
                            <>
                              <Text style={[styles.accordMatch, { color: matchStyle.color }]}>
                                매칭도: {percentage}%
                              </Text>
                              <Text style={[styles.accordMatchLabel, { color: matchStyle.color }]}>
                                {matchStyle.text}
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                      
                      {/* Day/Night & Season 아이콘 - 오른쪽 배치 */}
                      <View style={styles.iconBar}>
                        {(() => {
                          const dayNightInfo = getDayNightInfo(perfume.dayNight);
                          const seasonInfo = getSeasonInfo(perfume.season);
                          
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
                    </View>
                  </View>
                  <ChevronRight size={20} color="#737373" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectionSummary: {
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  subcategoriesText: {
    fontSize: 14,
    color: '#525252',
    marginBottom: 4,
  },
  accordsText: {
    fontSize: 12,
    color: '#737373',
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
  },
  sortLabel: {
    fontSize: 14,
    color: '#525252',
    marginRight: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  sortButtonActive: {
    backgroundColor: '#1e40af',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#737373',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#525252',
    marginTop: 16,
  },
  recommendationsContainer: {
    padding: 24,
  },
  perfumeSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#737373',
    lineHeight: 20,
  },
  perfumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
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
  matchingInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    flex: 1,
    marginLeft: 16,
  },
  accordMatch: {
    fontSize: 12,
    fontWeight: '600',
  },
  accordMatchLabel: {
    fontSize: 10,
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
  
  // 필터 관련 스타일
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  filterPanel: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#737373',
    fontWeight: '500',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#525252',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  filterOptionActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#525252',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
});