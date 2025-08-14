import { router } from 'expo-router';
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flower2, Trees, Droplets, Sparkles, ChevronRight, Info, Brain, Heart, Palette, Eye, Users, MapPin, Layers } from 'lucide-react-native';
import useStore from '@/store/useStore';
import { Category } from '@/types/category';

const { width } = Dimensions.get('window');

const CategoryScreen = memo(() => {
  const setSelectedCategory = useStore(state => state.setSelectedCategory);

  // 하드코딩된 카테고리 데이터 (API 응답 기반)
  const categories: Category[] = [
    {
      id: 1,
      name: '감각(Sensory)',
      description: '촉각적이고 직관적인 향의 느낌',
      moods: [
        { id: 1, name: '따뜻함' },
        { id: 19, name: '청결' },
        { id: 31, name: '달콤함' },
        { id: 32, name: '청량함' },
        { id: 33, name: '촉촉함' },
        { id: 34, name: '쌉쌀함' },
        { id: 37, name: '씁쓸함' },
        { id: 38, name: '차가움' }
      ]
    },
    {
      id: 2,
      name: '정서(Emotion)',
      description: '감정적이고 내면적인 향의 느낌',
      moods: [
        { id: 6, name: '자신감' },
        { id: 7, name: '편안함' },
        { id: 20, name: '고독' },
        { id: 21, name: '자유로움' },
        { id: 22, name: '설렘' },
        { id: 23, name: '기대감' },
        { id: 39, name: '자극적' }
      ]
    },
    {
      id: 3,
      name: '분위기(Ambience)',
      description: '특별한 순간과 분위기를 연출하는 향',
      moods: [
        { id: 4, name: '로맨틱' },
        { id: 5, name: '신비로움' },
        { id: 24, name: '차분함' },
        { id: 25, name: '절제됨' },
        { id: 30, name: '우중충함' },
        { id: 41, name: '지적인' },
        { id: 43, name: '무심함' },
        { id: 48, name: '안정감' }
      ]
    },
    {
      id: 4,
      name: '시각 이미지(Visual)',
      description: '시각적으로 떠오르는 이미지와 인상',
      moods: [
        { id: 8, name: '우아함' },
        { id: 42, name: '반짝임' },
        { id: 44, name: '은은함' },
        { id: 45, name: '짙음' },
        { id: 47, name: '청초함' }
      ]
    },
    {
      id: 5,
      name: '무게/질감(Texture)',
      description: '향의 밀도와 질감적인 특성',
      moods: [
        { id: 35, name: '무거움' },
        { id: 36, name: '부드러움' },
        { id: 40, name: '신선함' },
        { id: 46, name: '고소함' }
      ]
    },
    {
      id: 6,
      name: '스타일(Style)',
      description: '패션과 라이프스타일을 표현하는 향',
      moods: [
        { id: 15, name: '클래식' },
        { id: 16, name: '모던' },
        { id: 17, name: '캐주얼' },
        { id: 18, name: '섹시' },
        { id: 26, name: '미니멀' },
        { id: 27, name: '빈티지' },
        { id: 28, name: '큐트' },
        { id: 29, name: '시크' }
      ]
    },
    {
      id: 7,
      name: '장소(Space)',
      description: '특정 공간과 장소를 연상시키는 향',
      moods: [
        { id: 9, name: '숲속' },
        { id: 10, name: '바다' },
        { id: 11, name: '정원' },
        { id: 12, name: '도시' },
        { id: 13, name: '휴양지' },
        { id: 14, name: '아늑한 실내' }
      ]
    },
    {
      id: 8,
      name: '기타(Misc)',
      description: '독특하고 개성적인 향의 느낌',
      moods: [
        { id: 2, name: '고요함' },
        { id: 3, name: '활력' }
      ]
    }
  ];

  // 카테고리별 아이콘 및 색상 매핑
  const getCategoryStyle = (categoryName: string) => {
    const styleMap: { [key: string]: { icon: any, color: string } } = {
      '감각(Sensory)': { icon: Brain, color: '#ef4444' },
      '정서(Emotion)': { icon: Heart, color: '#f97316' },
      '분위기(Ambience)': { icon: Palette, color: '#8b5cf6' },
      '시각 이미지(Visual)': { icon: Eye, color: '#3b82f6' },
      '무게/질감(Texture)': { icon: Layers, color: '#10b981' },
      '스타일(Style)': { icon: Sparkles, color: '#f59e0b' },
      '장소(Space)': { icon: MapPin, color: '#06b6d4' },
      '기타(Misc)': { icon: Users, color: '#6b7280' },
    };
    
    return styleMap[categoryName] || { icon: Brain, color: '#6b7280' };
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    router.push('/category/subcategory');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>향수 카테고리 선택</Text>
          <Text style={styles.subtitle}>선호하는 무드의 계열을 선택해주세요</Text>
        </View>

        <View style={styles.categoriesContainer}>
          {categories.map((category) => {
            const categoryStyle = getCategoryStyle(category.name);
            const IconComponent = categoryStyle.icon;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(category)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: categoryStyle.color }]}>
                  <IconComponent size={32} color="#ffffff" />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                  <View style={styles.subcategoriesPreview}>
                    <Text style={styles.subcategoriesText}>
                      {category.moods.slice(0, 2).map(mood => mood.name).join(', ')} 등 {category.moods.length}개
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#737373" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Info size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              각 카테고리에는 다양한 무드가 포함되어 있어요. 원하는 느낌의 카테고리를 선택해주세요.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

CategoryScreen.displayName = 'CategoryScreen';

export default CategoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
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
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#525252',
    marginBottom: 8,
  },
  subcategoriesPreview: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  subcategoriesText: {
    fontSize: 12,
    color: '#737373',
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 12,
    lineHeight: 20,
  },
});