import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flower2, Trees, Droplets, Sparkles, ChevronRight, Info } from 'lucide-react-native';
import useStore from '@/store/useStore';

const { width } = Dimensions.get('window');

export default function CategoryScreen() {
  const { setSelectedCategory } = useStore();

  const categories = [
    {
      id: 'floral',
      name: '플로럴',
      description: '꽃향기를 중심으로 한 향수',
      color: '#d97066',
      icon: Flower2,
      subcategories: ['장미', '자스민', '라벤더', '피오니']
    },
    {
      id: 'woody',
      name: '우디',
      description: '나무와 흙 냄새의 따뜻한 향수',
      color: '#8b6f47',
      icon: Trees,
      subcategories: ['샌달우드', '시더우드', '패촐리', '베티버']
    },
    {
      id: 'fresh',
      name: '프레시',
      description: '시원하고 깔끔한 향수',
      color: '#4a90b8',
      icon: Droplets,
      subcategories: ['시트러스', '아쿠아틱', '그린', '오존']
    },
    {
      id: 'oriental',
      name: '오리엔탈',
      description: '이국적이고 신비로운 향수',
      color: '#b8860b',
      icon: Sparkles,
      subcategories: ['앰버', '바닐라', '머스크', '스파이시']
    },
  ];

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    router.push('/category/subcategory');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>향수 카테고리 선택</Text>
          <Text style={styles.subtitle}>선호하는 향의 계열을 선택해주세요</Text>
        </View>

        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(category)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <category.icon size={32} color="#ffffff" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <View style={styles.subcategoriesPreview}>
                  <Text style={styles.subcategoriesText}>
                    {category.subcategories.slice(0, 2).join(', ')} 등
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#737373" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Info size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              여러 카테고리가 혼합된 향수도 있어요. 가장 선호하는 계열을 선택해주세요.
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
});