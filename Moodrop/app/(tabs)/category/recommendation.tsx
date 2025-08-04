import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Clock, ChevronRight } from 'lucide-react-native';
import useStore from '@/store/useStore';

export default function RecommendationScreen() {
  const { selectedCategory, selectedSubcategories, recommendations, setRecommendations, setSelectedPerfume } = useStore();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'duration' | 'popularity'>('rating');

  useEffect(() => {
    if (!selectedCategory || selectedSubcategories.length === 0) {
      router.back();
      return;
    }
    loadRecommendations();
  }, [selectedCategory, selectedSubcategories, sortBy]);

  const loadRecommendations = async () => {
    setLoading(true);
    // 모의 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockRecommendations = generateMockRecommendations();
    setRecommendations(mockRecommendations, 1, 1);
    setLoading(false);
  };

  const generateMockRecommendations = () => {
    const baseRecommendations = [
      {
        id: 1,
        name: '로맨틱 가든',
        brand: 'Moodrop',
        rating: 4.8,
        duration: '6-8시간',
        description: '장미와 자스민이 어우러진 로맨틱한 향수',
        topNotes: ['베르가못', '레몬'],
        middleNotes: ['장미', '자스민', '피오니'],
        baseNotes: ['머스크', '바닐라'],
        ingredients: {
          '장미': 35,
          '자스민': 25,
          '피오니': 20,
          '머스크': 15,
          '바닐라': 5
        },
        popularity: 95
      },
      {
        id: 2,
        name: '미스틱 포레스트',
        brand: 'Moodrop',
        rating: 4.6,
        duration: '8-10시간',
        description: '신비로운 숲속을 연상시키는 우디 향수',
        topNotes: ['시트러스', '그린리프'],
        middleNotes: ['샌달우드', '시더우드'],
        baseNotes: ['패촐리', '베티버'],
        ingredients: {
          '샌달우드': 30,
          '시더우드': 25,
          '패촐리': 20,
          '베티버': 15,
          '그린리프': 10
        },
        popularity: 87
      },
      {
        id: 3,
        name: '오션 브리즈',
        brand: 'Moodrop',
        rating: 4.7,
        duration: '4-6시간',
        description: '바다 바람 같은 상쾌하고 시원한 향수',
        topNotes: ['오존', '시트러스'],
        middleNotes: ['아쿠아틱노트', '그린'],
        baseNotes: ['화이트머스크', '앰버그리스'],
        ingredients: {
          '시트러스': 40,
          '아쿠아틱': 30,
          '그린': 15,
          '오존': 10,
          '화이트머스크': 5
        },
        popularity: 92
      }
    ];

    // 선택된 카테고리에 따라 필터링 및 정렬
    let filtered = baseRecommendations.filter(perfume => {
      return selectedSubcategories.some(sub => 
        Object.keys(perfume.ingredients).includes(sub) ||
        perfume.middleNotes.includes(sub) ||
        perfume.topNotes.includes(sub)
      );
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'duration':
          return b.duration.split('-')[1].replace('시간', '') - a.duration.split('-')[1].replace('시간', '');
        case 'popularity':
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    });

    return filtered.length > 0 ? filtered : baseRecommendations;
  };

  const handlePerfumeSelect = (perfume: any) => {
    setSelectedPerfume(perfume);
    router.push('/category/detail');
  };

  const handleSortChange = (newSort: 'rating' | 'duration' | 'popularity') => {
    setSortBy(newSort);
  };

  if (!selectedCategory || selectedSubcategories.length === 0) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.selectionSummary}>
          <View style={[styles.categoryBadge, { backgroundColor: selectedCategory.color }]}>
            <selectedCategory.icon size={14} color="#ffffff" />
            <Text style={styles.categoryBadgeText}>{selectedCategory.name}</Text>
          </View>
          <Text style={styles.subcategoriesText}>
            {selectedSubcategories.join(', ')} 기반 추천
          </Text>
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>정렬:</Text>
          <View style={styles.sortButtons}>
            {[
              { key: 'rating', label: '평점순' },
              { key: 'duration', label: '지속시간' },
              { key: 'popularity', label: '인기순' }
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={selectedCategory.color} />
            <Text style={styles.loadingText}>맞춤 향수를 찾고 있어요...</Text>
          </View>
        ) : (
          <View style={styles.recommendationsContainer}>
            {recommendations.map((perfume) => (
              <TouchableOpacity
                key={perfume.id}
                style={styles.perfumeCard}
                onPress={() => handlePerfumeSelect(perfume)}
              >
                <View style={styles.perfumeInfo}>
                  <Text style={styles.perfumeName}>{perfume.name}</Text>
                  <Text style={styles.perfumeBrand}>{perfume.brand}</Text>
                  <Text style={styles.perfumeDescription}>{perfume.description}</Text>
                  
                  <View style={styles.perfumeDetails}>
                    <View style={styles.rating}>
                      <Star size={14} color="#f59e0b" />
                      <Text style={styles.ratingText}>{perfume.rating}</Text>
                    </View>
                    <View style={styles.duration}>
                      <Clock size={14} color="#737373" />
                      <Text style={styles.durationText}>{perfume.duration}</Text>
                    </View>
                  </View>

                  <View style={styles.notesPreview}>
                    <Text style={styles.notesTitle}>주요 향료:</Text>
                    <Text style={styles.notesText}>
                      {Object.keys(perfume.ingredients).slice(0, 3).join(', ')}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#737373" />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    backgroundColor: '#171717',
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
  perfumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
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
    fontSize: 14,
    color: '#737373',
    marginBottom: 8,
  },
  perfumeDescription: {
    fontSize: 14,
    color: '#525252',
    marginBottom: 12,
    lineHeight: 20,
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
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#737373',
    marginLeft: 4,
  },
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesTitle: {
    fontSize: 12,
    color: '#737373',
    marginRight: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#525252',
    flex: 1,
  },
});