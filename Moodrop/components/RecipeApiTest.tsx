import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { categoryService } from '@/services/categoryService';

export default function RecipeApiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testUserRecipeApi = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('Starting UserRecipe API test with userId: "json"');
      
      const response = await categoryService.getUserRecipes('json');
      
      console.log('UserRecipe API Test Result:', response);
      setResult(response);
      
      if (response.success) {
        Alert.alert(
          '✅ API 호출 성공', 
          `데이터를 성공적으로 가져왔습니다.\n${Array.isArray(response.data) ? `레시피 개수: ${response.data.length}` : '데이터 확인 필요'}`
        );
      } else {
        Alert.alert(
          '❌ API 호출 실패', 
          response.error || response.message || 'Unknown error'
        );
      }
    } catch (error) {
      console.error('UserRecipe API Test Error:', error);
      Alert.alert('❌ 테스트 실패', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipe API 테스트</Text>
      <Text style={styles.subtitle}>userId: "json"으로 레시피 조회</Text>
      
      <TouchableOpacity 
        style={[styles.testButton, isLoading && styles.disabledButton]} 
        onPress={testUserRecipeApi}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? '🔄 API 호출 중...' : '🧪 getUserRecipes API 테스트'}
        </Text>
      </TouchableOpacity>

      {result && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>📋 API 응답 결과:</Text>
          <View style={styles.resultContent}>
            <Text style={styles.resultText}>
              {JSON.stringify(result, null, 2)}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#525252',
    marginBottom: 24,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
  },
  resultContent: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    lineHeight: 16,
  },
});