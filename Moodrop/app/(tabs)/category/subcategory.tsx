import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Brain, Heart, Palette, Eye, Users, MapPin, Layers, Sparkles } from 'lucide-react-native';
import useStore from '@/store/useStore';
import { Mood } from '@/types/category';

export default function SubcategoryScreen() {
  const { selectedCategory, setSelectedSubcategories, setSelectedMoods: setStoreMoods } = useStore();
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);

  if (!selectedCategory) {
    router.back();
    return null;
  }

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
    if (selectedMoods.length === 0) return;
    
    // Store에 선택된 무드들을 저장 (API에서 사용)
    setStoreMoods(selectedMoods);
    
    // 기존 호환성을 위한 문자열 배열도 저장
    setSelectedSubcategories(selectedMoods.map(mood => mood.name));
    
    router.push('/category/recommendation');
  };

  const CategoryIcon = getCategoryIcon(selectedCategory.name);
  const categoryColor = getCategoryColor(selectedCategory.name);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <CategoryIcon size={16} color="#ffffff" />
            <Text style={styles.categoryBadgeText}>{selectedCategory.name}</Text>
          </View>
          <Text style={styles.title}>무드 선택</Text>
          <Text style={styles.subtitle}>
            {selectedCategory.name}에서 원하는 무드를 최대 3개까지 선택해주세요
          </Text>
        </View>

        <View style={styles.subcategoriesContainer}>
          {selectedCategory.moods.map((mood: Mood) => {
            const isSelected = selectedMoods.some(m => m.id === mood.id);
            const isDisabled = !isSelected && selectedMoods.length >= 3;
            
            return (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.subcategoryCard,
                  isSelected && { backgroundColor: categoryColor + '15', borderColor: categoryColor },
                  isDisabled && styles.subcategoryCardDisabled
                ]}
                onPress={() => handleMoodToggle(mood)}
                disabled={isDisabled}
              >
                <View style={styles.subcategoryContent}>
                  <Text style={[
                    styles.subcategoryName,
                    isSelected && { color: categoryColor },
                    isDisabled && styles.subcategoryNameDisabled
                  ]}>
                    {mood.name}
                  </Text>
                  <Text style={[
                    styles.subcategoryDescription,
                    isDisabled && styles.subcategoryDescriptionDisabled
                  ]}>
                    {mood.description || '특별한 무드를 표현하는 향'}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  isSelected && { backgroundColor: categoryColor, borderColor: categoryColor }
                ]}>
                  {isSelected && <Check size={16} color="#ffffff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedMoods.length}/3개 선택됨
          </Text>
          <Text style={styles.selectionHint}>
            {selectedMoods.length >= 3 
              ? '최대 3개까지 선택할 수 있어요'
              : '선택한 무드를 바탕으로 맞춤 향수를 추천해드려요'
            }
          </Text>
        </View>
      </ScrollView>

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
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#525252',
    lineHeight: 24,
  },
  subcategoriesContainer: {
    marginBottom: 24,
  },
  subcategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subcategoryContent: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  subcategoryDescription: {
    fontSize: 14,
    color: '#525252',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionInfo: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  selectionHint: {
    fontSize: 14,
    color: '#525252',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  nextButton: {
    backgroundColor: '#171717',
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
  subcategoryCardDisabled: {
    opacity: 0.4,
    backgroundColor: '#f8f8f8',
  },
  subcategoryNameDisabled: {
    color: '#9ca3af',
  },
  subcategoryDescriptionDisabled: {
    color: '#d1d5db',
  },
});