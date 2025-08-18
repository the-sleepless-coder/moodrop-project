import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Brain, Heart, Palette, Eye, Users, MapPin, Layers, Sparkles, X } from 'lucide-react-native';
import useStore from '@/store/useStore';
import { Mood, Category } from '@/types/category';
import { categoryService } from '@/services/categoryService';

export default function SubcategoryScreen() {
  const setSelectedSubcategories = useStore(state => state.setSelectedSubcategories);
  const setStoreMoods = useStore(state => state.setSelectedMoods);
  
  // 로컬 상태
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // 페이지 포커스 변화 감지하여 상태 초기화
  useFocusEffect(
    useCallback(() => {
      // 페이지에 포커스될 때 로컬 상태 초기화
      setSelectedMoods([]);
      setActiveTabIndex(0);
      
      // 언마운트될 때 정리 함수
      return () => {
        setSelectedMoods([]);
        setActiveTabIndex(0);
      };
    }, [])
  );

  // 모든 카테고리와 무드 데이터 로드
  useEffect(() => {
    const loadAllCategories = async () => {
      setLoading(true);
      try {
        const response = await categoryService.getCategoriesWithMoods();
        if (response.success && response.data) {
          // 카테고리별 무드 재분류
          const categories = response.data.categories.map(category => {
            const moods = [...category.moods];
            
            // 기타 카테고리에서 고요함(moodId: 2)과 활력(moodId: 3) 제거
            if (category.name === '기타(Misc)') {
              return {
                ...category,
                moods: moods.filter(mood => mood.id !== 2 && mood.id !== 3)
              };
            }
            
            // 감각 카테고리에 고요함 추가
            if (category.name === '감각(Sensory)') {
              const quietnessMood = response.data.categories
                .find(c => c.name === '기타(Misc)')
                ?.moods.find(m => m.id === 2);
              if (quietnessMood) {
                moods.push(quietnessMood);
              }
            }
            
            // 정서 카테고리에 활력 추가
            if (category.name === '정서(Emotion)') {
              const vitalityMood = response.data.categories
                .find(c => c.name === '기타(Misc)')
                ?.moods.find(m => m.id === 3);
              if (vitalityMood) {
                moods.push(vitalityMood);
              }
            }
            
            return { ...category, moods };
          });
          
          // 빈 카테고리 제거 (기타 카테고리가 비어있을 경우)
          const filteredCategories = categories.filter(category => category.moods.length > 0);
          
          setAllCategories(filteredCategories);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllCategories();
  }, []);

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

  // 현재 활성 탭의 카테고리 가져오기
  const activeCategory = allCategories[activeTabIndex];
  
  // 현재 카테고리의 무드들 가져오기
  const currentMoods = activeCategory ? activeCategory.moods : [];

  const handleMoodToggle = (mood: Mood) => {
    setSelectedMoods(prev => {
      if (prev.some(m => m.id === mood.id)) {
        // 이미 선택된 항목이면 제거
        return prev.filter(m => m.id !== mood.id);
      } else {
        // 새로 선택하려는데 이미 3개가 선택된 경우
        if (prev.length >= 3) {
          return prev; // 추가하지 않음
        }
        return [...prev, mood];
      }
    });
  };

  const handleNext = () => {
    // APK 디버깅용 Alert (비활성화)
    // alert(`DEBUG: selectedMoods.length = ${selectedMoods.length}`);
    
    if (selectedMoods.length === 0) {
      // alert('무드가 선택되지 않았습니다');
      return;
    }
    
    try {
      // Store에 선택된 무드들을 저장 (API에서 사용)
      setStoreMoods(selectedMoods);
      
      // 기존 호환성을 위한 문자열 배열도 저장
      const moodNames = selectedMoods.map(mood => mood.name);
      setSelectedSubcategories(moodNames);
      
      // alert(`무드 저장 완료: ${moodNames.join(', ')}`);
      
      router.push('/category/recommendation');
    } catch (error) {
      // alert(`오류: ${error.message}`);
      console.error('오류:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>무드 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        {/* 상단 선택 상태 표시 */}
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>무드 선택 ({selectedMoods.length}/3)</Text>
          <View style={styles.selectedMoodsContainer}>
            {selectedMoods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={styles.selectedMoodChip}
                onPress={() => handleMoodToggle(mood)}
              >
                <Text style={styles.selectedMoodText}>{mood.name}</Text>
                <X size={14} color="#ffffff" style={styles.selectedMoodRemove} />
              </TouchableOpacity>
            ))}
            {selectedMoods.length < 3 && (
              <View style={styles.emptyMoodSlot}>
                <Text style={styles.emptyMoodSlotText}>+</Text>
              </View>
            )}
          </View>
        </View>

        {/* 카테고리 탭들 */}
        <View style={styles.tabsContainer}>
          {allCategories.map((category, index) => {
            const CategoryIcon = getCategoryIcon(category.name);
            const categoryColor = getCategoryColor(category.name);
            const isActive = index === activeTabIndex;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: categoryColor }
                ]}
                onPress={() => setActiveTabIndex(index)}
              >
                <CategoryIcon size={16} color={isActive ? "#ffffff" : categoryColor} />
              </TouchableOpacity>
            );
          })}
        </View>


        {/* 현재 탭의 무드 목록 */}
        <ScrollView 
          style={styles.moodsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {activeCategory && (
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{activeCategory.name}</Text>
              <Text style={styles.categoryDescription}>
                {currentMoods.length}개의 무드가 있습니다
              </Text>
            </View>
          )}
          
          <View style={styles.moodsGrid}>
            {currentMoods.map((mood: Mood) => {
              const isSelected = selectedMoods.some(m => m.id === mood.id);
              const isDisabled = !isSelected && selectedMoods.length >= 3;
              const categoryColor = activeCategory ? getCategoryColor(activeCategory.name) : '#6b7280';
              
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodCard,
                    isSelected && { backgroundColor: categoryColor + '15', borderColor: categoryColor },
                    isDisabled && styles.moodCardDisabled
                  ]}
                  onPress={() => handleMoodToggle(mood)}
                  disabled={isDisabled}
                >
                  <View style={styles.moodContent}>
                    <Text style={[
                      styles.moodName,
                      isSelected && { color: categoryColor },
                      isDisabled && styles.moodNameDisabled
                    ]}>
                      {mood.name}
                    </Text>
                    <Text style={[
                      styles.moodDescription,
                      isDisabled && styles.moodDescriptionDisabled
                    ]}>
                      {mood.description || '특별한 무드를 표현하는 향'}
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    isSelected && { backgroundColor: categoryColor, borderColor: categoryColor }
                  ]}>
                    {isSelected && <Check size={14} color="#ffffff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>


          {/* 하단 안내 */}
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionHint}>
              {selectedMoods.length >= 3 
                ? '최대 3개까지 선택할 수 있어요'
                : '선택한 무드를 바탕으로 맞춤 향수를 추천해드려요'
              }
            </Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedMoods.length === 0 && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={selectedMoods.length === 0}
        >
          <Text style={[
            styles.nextButtonText,
            selectedMoods.length === 0 && styles.nextButtonTextDisabled
          ]}>
            다음 ({selectedMoods.length}개 선택)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// getSubcategoryDescription 함수 제거 (더 이상 필요하지 않음)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#525252',
    marginTop: 16,
  },
  // 상단 선택 상태 표시
  selectionHeader: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  selectedMoodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedMoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedMoodText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedMoodRemove: {
    marginLeft: 2,
  },
  emptyMoodSlot: {
    width: 40,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMoodSlotText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: '300',
  },
  // 탭 컨테이너
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  // 무드 목록 컨테이너
  moodsList: {
    flex: 1,
  },
  // 카테고리 정보
  categoryInfo: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#737373',
  },
  // 무드 그리드
  moodsGrid: {
    gap: 12,
    paddingHorizontal: 24,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodContent: {
    flex: 1,
  },
  moodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  moodDescription: {
    fontSize: 13,
    color: '#525252',
    lineHeight: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 비활성화 상태
  moodCardDisabled: {
    opacity: 0.4,
    backgroundColor: '#f8f8f8',
  },
  moodNameDisabled: {
    color: '#9ca3af',
  },
  moodDescriptionDisabled: {
    color: '#d1d5db',
  },
  // 하단 정보
  selectionInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  selectionHint: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
  },
  // 하단 버튼
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  nextButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
});