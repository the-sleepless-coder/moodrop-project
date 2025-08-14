import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Clock, ChevronRight, Brain, Heart, Palette, Eye, Users, MapPin, Layers, Sparkles, AlertCircle, Wifi } from 'lucide-react-native';
import useStore from '@/store/useStore';
import categoryService from '@/services/categoryService';
import { Perfume } from '@/types/category';
import CustomModal, { ModalAction } from '@/components/CustomModal';

export default function RecommendationScreen() {
  const { 
    selectedCategory, 
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
  
  const [sortBy, setSortBy] = useState<'rating' | 'accordMatch' | 'year'>('rating');
  const [matchPerfumes, setMatchPerfumes] = useState<Perfume[]>([]);
  const [noMatchPerfumes, setNoMatchPerfumes] = useState<Perfume[]>([]);
  const [showNoMatch, setShowNoMatch] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    actions: ModalAction[];
    icon?: React.ReactNode;
  }>({ title: '', message: '', actions: [] });

  useEffect(() => {
    if (!selectedCategory || !selectedMoods || selectedMoods.length === 0) {
      router.back();
      return;
    }
    loadPerfumeRecommendations();
  }, [selectedCategory, selectedMoods]);

  useEffect(() => {
    // 정렬 변경 시 기존 데이터 다시 정렬
    if (matchPerfumes.length > 0 || noMatchPerfumes.length > 0) {
      applySorting();
    }
  }, [sortBy]);

  const loadPerfumeRecommendations = async () => {
    try {
      // 1단계: Accord 조회
      setAccordsLoading(true);
      console.log('1단계: Accord 조회 시작', selectedMoods.map(m => m.id));
      
      const accordResponse = await categoryService.getAccordsBySelectedMoods(selectedMoods);
      
      if (!accordResponse.success || !accordResponse.data?.accords) {
        setModalConfig({
          title: '오류',
          message: 'Accord 정보를 가져올 수 없습니다.',
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
      
      console.log('1단계 완료: Accord 조회됨', accordsList.length + '개');
      
      // 2단계: 향수 리스트 조회
      setRecommendationsLoading(true);
      console.log('2단계: 향수 리스트 조회 시작');
      
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
      
      console.log('2단계 완료:', { 
        match: Match?.length || 0, 
        noMatch: NoMatch?.length || 0 
      });
      
      setMatchPerfumes(Match || []);
      setNoMatchPerfumes(NoMatch || []);
      setRecommendationsLoading(false);
      
      // 기존 store와의 호환성을 위해 전체 리스트도 저장
      const allPerfumes = [...(Match || []), ...(NoMatch || [])];
      setRecommendations(allPerfumes, 1, 1);
      
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

    setMatchPerfumes(prev => [...prev].sort(sortFunction));
    setNoMatchPerfumes(prev => [...prev].sort(sortFunction));
  };

  const handlePerfumeSelect = (perfume: any) => {
    setSelectedPerfume(perfume);
    router.push('/category/detail');
  };

  const handleSortChange = (newSort: 'rating' | 'accordMatch' | 'year') => {
    setSortBy(newSort);
  };

  // 카테고리별 아이콘 매핑
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: any } = {
      '감각(Sensory)': Brain,
      '정서(Emotion)': Heart,
      '분위기(Ambience)': Palette,
      '시각 이미지(Visual)': Eye,
      '무게/질감(Texture)': Layers,
      '스타일(Style)': Sparkles,
      '장소(Space)': MapPin,
      '기타(Misc)': Users,
    };
    return iconMap[categoryName] || Brain;
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (categoryName: string) => {
    const colorMap: { [key: string]: string } = {
      '감각(Sensory)': '#ef4444',
      '정서(Emotion)': '#f97316',
      '분위기(Ambience)': '#8b5cf6',
      '시각 이미지(Visual)': '#3b82f6',
      '무게/질감(Texture)': '#10b981',
      '스타일(Style)': '#f59e0b',
      '장소(Space)': '#06b6d4',
      '기타(Misc)': '#6b7280',
    };
    return colorMap[categoryName] || '#6b7280';
  };

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

  if (!selectedCategory || !selectedMoods || selectedMoods.length === 0) {
    return null;
  }

  const CategoryIcon = getCategoryIcon(selectedCategory.name);
  const categoryColor = getCategoryColor(selectedCategory.name);
  const isLoading = accordsLoading || recommendationsLoading;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <View style={styles.selectionSummary}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <CategoryIcon size={14} color="#ffffff" />
            <Text style={styles.categoryBadgeText}>{selectedCategory.name}</Text>
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

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>정렬:</Text>
          <View style={styles.sortButtons}>
            {[
              { key: 'rating', label: '평점순' },
              { key: 'accordMatch', label: 'Accord 매치순' },
              { key: 'year', label: '출시년도순' }
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
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {accordsLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={categoryColor} />
            <Text style={styles.loadingText}>Accord를 분석하고 있어요...</Text>
          </View>
        )}
        
        {recommendationsLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={categoryColor} />
            <Text style={styles.loadingText}>향수를 찾고 있어요...</Text>
          </View>
        )}
        
        {!isLoading && (matchPerfumes.length > 0 || noMatchPerfumes.length > 0) && (
          <View style={styles.recommendationsContainer}>
            {/* Match 섹션 */}
            {matchPerfumes.length > 0 && (
              <View style={styles.perfumeSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: '#22c55e' }]}>
                    보유 향료로 제작 가능 ({matchPerfumes.length})
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    현재 보유한 향료로 바로 제작할 수 있는 향수들이에요
                  </Text>
                </View>
                
                {matchPerfumes.map((perfume) => (
                  <TouchableOpacity
                    key={perfume.id}
                    style={[styles.perfumeCard, styles.matchCard]}
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
                      </View>
                    </View>
                    <ChevronRight size={20} color="#737373" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* NoMatch 섹션 */}
            {noMatchPerfumes.length > 0 && (
              <View style={styles.perfumeSection}>
                <View style={styles.sectionHeader}>
                  <TouchableOpacity 
                    style={styles.sectionTitleRow}
                    onPress={() => setShowNoMatch(!showNoMatch)}
                  >
                    <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>
                      추가 향료 필요 ({noMatchPerfumes.length})
                    </Text>
                    <Text style={styles.expandText}>{showNoMatch ? '접기' : '펼치기'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.sectionSubtitle}>
                    향료를 추가 구매하면 제작할 수 있는 향수들이에요
                  </Text>
                </View>
                
                {showNoMatch && noMatchPerfumes.slice(0, 10).map((perfume) => (
                  <TouchableOpacity
                    key={perfume.id}
                    style={[styles.perfumeCard, styles.noMatchCard]}
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
                      </View>
                    </View>
                    <ChevronRight size={20} color="#737373" />
                  </TouchableOpacity>
                ))}
                
                {showNoMatch && noMatchPerfumes.length > 10 && (
                  <Text style={styles.moreText}>
                    ... 외 {noMatchPerfumes.length - 10}개 향수
                  </Text>
                )}
              </View>
            )}
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#525252',
    marginRight: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
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
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  expandText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  perfumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  matchCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
    borderLeftWidth: 4,
  },
  noMatchCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderLeftWidth: 4,
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
    marginBottom: 12,
    gap: 16,
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
    gap: 2,
  },
  accordMatch: {
    fontSize: 12,
    fontWeight: '600',
  },
  accordMatchLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
});