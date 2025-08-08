import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flower2, Trees, Droplets, Sparkles, ChevronRight, Info, Brain, Heart, Palette, Eye, Users, MapPin, Layers } from 'lucide-react-native';
import useStore from '@/store/useStore';
import categoryService from '@/services/categoryService';
import { Category } from '@/types/category';

const { width } = Dimensions.get('window');

export default function CategoryScreen() {
  const { setSelectedCategory } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategoriesWithMoods();
      
      if (response.success && response.data) {
        setCategories(response.data.categories);
      } else {
        Alert.alert('오류', '카테고리 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      Alert.alert('네트워크 오류', '카테고리를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    router.push('/category/subcategory');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>향수 카테고리 선택</Text>
          <Text style={styles.subtitle}>선호하는 무드의 계열을 선택해주세요</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>카테고리를 불러오는 중...</Text>
          </View>
        ) : (
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
                      {category.description || '다양한 무드를 표현하는 향'}
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
        )}

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
}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#525252',
  },
});