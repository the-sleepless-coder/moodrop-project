import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import useStore from '@/store/useStore';

export default function SubcategoryScreen() {
  const { selectedCategory, setSelectedSubcategories } = useStore();
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  if (!selectedCategory) {
    router.back();
    return null;
  }

  const handleSubcategoryToggle = (subcategory: string) => {
    setSelectedSubs(prev => {
      if (prev.includes(subcategory)) {
        return prev.filter(item => item !== subcategory);
      } else {
        return [...prev, subcategory];
      }
    });
  };

  const handleNext = () => {
    if (selectedSubs.length === 0) return;
    
    setSelectedSubcategories(selectedSubs);
    router.push('/category/recommendation');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.categoryBadge, { backgroundColor: selectedCategory.color }]}>
            <selectedCategory.icon size={16} color="#ffffff" />
            <Text style={styles.categoryBadgeText}>{selectedCategory.name}</Text>
          </View>
          <Text style={styles.title}>세부 카테고리 선택</Text>
          <Text style={styles.subtitle}>
            {selectedCategory.name} 계열에서 선호하는 향을 모두 선택해주세요
          </Text>
        </View>

        <View style={styles.subcategoriesContainer}>
          {selectedCategory.subcategories.map((subcategory: string, index: number) => {
            const isSelected = selectedSubs.includes(subcategory);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.subcategoryCard,
                  isSelected && { backgroundColor: selectedCategory.color + '15', borderColor: selectedCategory.color }
                ]}
                onPress={() => handleSubcategoryToggle(subcategory)}
              >
                <View style={styles.subcategoryContent}>
                  <Text style={[
                    styles.subcategoryName,
                    isSelected && { color: selectedCategory.color }
                  ]}>
                    {subcategory}
                  </Text>
                  <Text style={styles.subcategoryDescription}>
                    {getSubcategoryDescription(subcategory)}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  isSelected && { backgroundColor: selectedCategory.color, borderColor: selectedCategory.color }
                ]}>
                  {isSelected && <Check size={16} color="#ffffff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedSubs.length}개 선택됨
          </Text>
          <Text style={styles.selectionHint}>
            선택한 향을 바탕으로 맞춤 향수를 추천해드려요
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedSubs.length === 0 && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={selectedSubs.length === 0}
        >
          <Text style={[
            styles.nextButtonText,
            selectedSubs.length === 0 && styles.nextButtonTextDisabled
          ]}>
            다음 ({selectedSubs.length}개 선택)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getSubcategoryDescription(subcategory: string): string {
  const descriptions: { [key: string]: string } = {
    '장미': '우아하고 클래식한 장미 향',
    '자스민': '달콤하고 관능적인 자스민 향',
    '라벤더': '편안하고 진정시키는 라벤더 향',
    '피오니': '부드럽고 상쾌한 작약 향',
    '샌달우드': '따뜻하고 크리미한 백단향',
    '시더우드': '신선하고 건조한 삼나무 향',
    '패촐리': '흙내음이 나는 진한 허브 향',
    '베티버': '스모키하고 우디한 향',
    '시트러스': '상큼하고 활기찬 감귤 향',
    '아쿠아틱': '바다와 같은 시원한 향',
    '그린': '풀잎과 같은 자연스러운 향',
    '오존': '깨끗하고 공기같은 향',
    '앰버': '따뜻하고 달콤한 호박 향',
    '바닐라': '부드럽고 달콤한 바닐라 향',
    '머스크': '관능적이고 깊은 사향',
    '스파이시': '따뜻하고 자극적인 향신료 향',
  };
  return descriptions[subcategory] || '특별한 향의 경험';
}

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
});