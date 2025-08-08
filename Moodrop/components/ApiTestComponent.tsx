import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import categoryService from '../services/categoryService';
import { Category } from '../types/category';

export default function ApiTestComponent() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const testCategoryMoodAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing CategoryMood API...');
      const response = await categoryService.getCategoriesWithMoods();
      
      console.log('Full API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        setCategories(response.data.categories);
        Alert.alert(
          'API 테스트 성공', 
          `${response.data.categories.length}개 카테고리 조회됨\n첫 번째 카테고리: ${response.data.categories[0]?.name || 'N/A'}`
        );
        console.log('Categories loaded:', response.data.categories);
      } else {
        console.log('API Response failed:', response);
        Alert.alert('API 오류', response.message || response.error || '데이터를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('API Test Error:', error);
      Alert.alert('연결 오류', `API 호출 실패: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.testButton, loading && styles.buttonDisabled]}
        onPress={testCategoryMoodAPI}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'API 테스트 중...' : 'CategoryMood API 테스트'}
        </Text>
      </TouchableOpacity>

      {categories.length > 0 && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>조회된 카테고리 ({categories.length}개):</Text>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <Text style={styles.categoryName}>
                {category.id}. {category.name}
              </Text>
              {category.description && (
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              )}
              <Text style={styles.moodCount}>
                무드: {category.moods?.length || 0}개
              </Text>
              {category.moods?.slice(0, 3).map((mood) => (
                <Text key={mood.id} style={styles.moodItem}>
                  • {mood.name}
                </Text>
              ))}
              {category.moods && category.moods.length > 3 && (
                <Text style={styles.moodMore}>
                  ... 외 {category.moods.length - 3}개
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  testButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    maxHeight: 400,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  categoryItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  moodCount: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 8,
  },
  moodItem: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    marginBottom: 2,
  },
  moodMore: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
    fontStyle: 'italic',
  },
});