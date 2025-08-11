import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import categoryService from '../services/categoryService';
import { Category, Accord, Perfume } from '../types/category';

export default function ApiTestComponent() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accords, setAccords] = useState<Accord[]>([]);
  const [accordLoading, setAccordLoading] = useState(false);
  const [perfumes, setPerfumes] = useState<{ match: Perfume[]; noMatch: Perfume[] }>({ match: [], noMatch: [] });
  const [perfumeLoading, setPerfumeLoading] = useState(false);

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

  const testAccordAPI = async () => {
    setAccordLoading(true);
    try {
      // 테스트용 무드 ID들 (1, 3, 5)
      const testMoodIds = [1, 3, 5];
      console.log('Testing Accord API with moodIds:', testMoodIds);
      
      const response = await categoryService.getAccordsByMoods(testMoodIds);
      
      console.log('Full Accord API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        setAccords(response.data.accords || []);
        Alert.alert(
          'Accord API 테스트 성공', 
          `${response.data.accords?.length || 0}개 accord 조회됨\n첫 번째 accord: ${response.data.accords?.[0]?.name || 'N/A'}`
        );
        console.log('Accords loaded:', response.data.accords);
      } else {
        console.log('Accord API Response failed:', response);
        Alert.alert('Accord API 오류', response.message || response.error || '데이터를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('Accord API Test Error:', error);
      Alert.alert('연결 오류', `Accord API 호출 실패: ${error}`);
    } finally {
      setAccordLoading(false);
    }
  };

  const testPerfumeListAPI = async () => {
    setPerfumeLoading(true);
    try {
      // 테스트용 accord들 (이전 accord API에서 받은 데이터 활용)
      const testAccords = ["cinnamon", "rum", "terpenic", "alcohol", "whiskey"];
      console.log('Testing PerfumeList API with accords:', testAccords);
      
      const response = await categoryService.getPerfumesByAccords(testAccords, 1);
      
      console.log('Full PerfumeList API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        setPerfumes({
          match: response.data.Match || [],
          noMatch: response.data.NoMatch || []
        });
        Alert.alert(
          'PerfumeList API 테스트 성공', 
          `매치: ${response.data.Match?.length || 0}개\n노매치: ${response.data.NoMatch?.length || 0}개`
        );
        console.log('Perfumes loaded:', {
          match: response.data.Match?.length || 0,
          noMatch: response.data.NoMatch?.length || 0
        });
      } else {
        console.log('PerfumeList API Response failed:', response);
        Alert.alert('PerfumeList API 오류', response.message || response.error || '데이터를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('PerfumeList API Test Error:', error);
      Alert.alert('연결 오류', `PerfumeList API 호출 실패: ${error}`);
    } finally {
      setPerfumeLoading(false);
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

      <TouchableOpacity 
        style={[styles.testButton, styles.accordButton, accordLoading && styles.buttonDisabled]}
        onPress={testAccordAPI}
        disabled={accordLoading}
      >
        <Text style={styles.buttonText}>
          {accordLoading ? 'Accord API 테스트 중...' : 'Accord API 테스트 (무드 1,3,5)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.testButton, styles.perfumeButton, perfumeLoading && styles.buttonDisabled]}
        onPress={testPerfumeListAPI}
        disabled={perfumeLoading}
      >
        <Text style={styles.buttonText}>
          {perfumeLoading ? 'PerfumeList API 테스트 중...' : 'PerfumeList API 테스트 (userId=1)'}
        </Text>
      </TouchableOpacity>

      {(perfumes.match.length > 0 || perfumes.noMatch.length > 0) && (
        <ScrollView style={[styles.resultContainer, styles.perfumeResults]}>
          <Text style={styles.resultTitle}>향수 조회 결과:</Text>
          
          <View style={styles.perfumeSection}>
            <Text style={styles.sectionTitle}>매치 (보유 note 포함): {perfumes.match.length}개</Text>
            {perfumes.match.slice(0, 3).map((perfume, index) => (
              <View key={perfume.id} style={[styles.perfumeItem, styles.matchItem]}>
                <Text style={styles.perfumeName}>
                  {perfume.perfumeName} ({perfume.brandName})
                </Text>
                <Text style={styles.perfumeInfo}>
                  {perfume.year} • {perfume.country} • {perfume.gender}
                </Text>
                <Text style={styles.accordMatch}>
                  Accord 매치: {perfume.accordMatchCount}개 • 평점: {perfume.ratingInfo.ratingVal}/5
                </Text>
              </View>
            ))}
            {perfumes.match.length > 3 && (
              <Text style={styles.moreText}>... 외 {perfumes.match.length - 3}개</Text>
            )}
          </View>

          <View style={styles.perfumeSection}>
            <Text style={styles.sectionTitle}>노매치 (보유 note 미포함): {perfumes.noMatch.length}개</Text>
            {perfumes.noMatch.slice(0, 5).map((perfume, index) => (
              <View key={perfume.id} style={[styles.perfumeItem, styles.noMatchItem]}>
                <Text style={styles.perfumeName}>
                  {perfume.perfumeName} ({perfume.brandName})
                </Text>
                <Text style={styles.perfumeInfo}>
                  {perfume.year} • {perfume.country} • {perfume.gender}
                </Text>
                <Text style={styles.accordMatch}>
                  Accord 매치: {perfume.accordMatchCount}개 • 평점: {perfume.ratingInfo.ratingVal}/5
                </Text>
              </View>
            ))}
            {perfumes.noMatch.length > 5 && (
              <Text style={styles.moreText}>... 외 {perfumes.noMatch.length - 5}개</Text>
            )}
          </View>
        </ScrollView>
      )}

      {accords.length > 0 && (
        <ScrollView style={[styles.resultContainer, styles.accordResults]}>
          <Text style={styles.resultTitle}>조회된 Accord ({accords.length}개):</Text>
          {accords.map((accord, index) => (
            <View key={accord.accordId || index} style={styles.accordItem}>
              <Text style={styles.accordName}>
                {accord.accordId}. {accord.accord}
              </Text>
              <Text style={styles.accordWeight}>
                가중치: {accord.totalWeight.toFixed(6)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

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
    marginBottom: 16,
  },
  accordButton: {
    backgroundColor: '#22c55e',
  },
  perfumeButton: {
    backgroundColor: '#8b5cf6',
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
  accordResults: {
    marginBottom: 20,
  },
  accordItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  accordName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  accordDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  accordWeight: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  perfumeResults: {
    marginBottom: 20,
  },
  perfumeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
  },
  perfumeItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  matchItem: {
    borderLeftColor: '#22c55e',
  },
  noMatchItem: {
    borderLeftColor: '#f59e0b',
  },
  perfumeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  perfumeInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  accordMatch: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginLeft: 8,
    marginTop: 4,
  },
});