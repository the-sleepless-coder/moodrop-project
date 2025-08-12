import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { RefreshCw, RotateCcw, Save, FlaskConical } from 'lucide-react-native';
import useStore from '@/store/useStore';
import { PerfumeNote } from '@/types/category';
import { categoryService } from '@/services/categoryService';

export default function RecipeScreen() {
  const { selectedPerfume } = useStore();
  const [editMode, setEditMode] = useState(false);
  const [recipe, setRecipe] = useState<{ [key: string]: number }>({});
  const [totalPercentage, setTotalPercentage] = useState(100);
  const [perfumeNotes, setPerfumeNotes] = useState<PerfumeNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 향수 제조 note 데이터 로드 및 초기 레시피 설정
  useEffect(() => {
    const loadPerfumeData = async () => {
      if (selectedPerfume?.id) {
        setIsLoading(true);
        try {
          // 향수 제조 note API 호출
          const response = await categoryService.getPerfumeNote(selectedPerfume.id);
          if (response.success && response.data) {
            setPerfumeNotes(response.data);
            
            // API 데이터를 기본 레시피로 설정
            const initialRecipe: { [key: string]: number } = {};
            response.data.forEach(note => {
              initialRecipe[note.name] = note.weight;
            });
            
            setRecipe(initialRecipe);
          } else {
            // API 실패 시 향수 notes 데이터로 폴백
            const fallbackRecipe: { [key: string]: number } = {};
            let remainingPercentage = 100;
            const allNotes = [
              ...(selectedPerfume.notes.top || []),
              ...(selectedPerfume.notes.middle || []),
              ...(selectedPerfume.notes.base || [])
            ];
            
            // 균등 분배
            const evenWeight = Math.floor(100 / allNotes.length);
            allNotes.forEach((note, index) => {
              const weight = index === allNotes.length - 1 
                ? remainingPercentage // 마지막 노트에 남은 비율 할당
                : evenWeight;
              fallbackRecipe[note] = weight;
              remainingPercentage -= weight;
            });
            
            setRecipe(fallbackRecipe);
          }
        } catch (error) {
          console.error('Failed to load perfume data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPerfumeData();
  }, [selectedPerfume]);

  useEffect(() => {
    const total = Object.values(recipe).reduce((sum, value) => sum + value, 0);
    setTotalPercentage(total);
  }, [recipe]);

  if (!selectedPerfume) {
    router.back();
    return null;
  }

  const handleSliderChange = (ingredient: string, value: number) => {
    const roundedValue = Math.round(value);
    setRecipe(prev => ({
      ...prev,
      [ingredient]: roundedValue
    }));
  };

  const handleAutoBalance = () => {
    const ingredients = Object.keys(recipe);
    const evenPercentage = Math.floor(100 / ingredients.length);
    const remainder = 100 - (evenPercentage * ingredients.length);
    
    const newRecipe: { [key: string]: number } = {};
    ingredients.forEach((ingredient, index) => {
      newRecipe[ingredient] = evenPercentage + (index === 0 ? remainder : 0);
    });
    
    setRecipe(newRecipe);
  };

  const handleReset = () => {
    if (perfumeNotes.length > 0) {
      // API 데이터가 있으면 API 기본값으로 리셋
      const resetRecipe: { [key: string]: number } = {};
      perfumeNotes.forEach(note => {
        resetRecipe[note.name] = note.weight;
      });
      setRecipe(resetRecipe);
    } else {
      // API 데이터가 없으면 균등 분배로 리셋
      const ingredients = Object.keys(recipe);
      const evenPercentage = Math.floor(100 / ingredients.length);
      const remainder = 100 - (evenPercentage * ingredients.length);
      
      const resetRecipe: { [key: string]: number } = {};
      ingredients.forEach((ingredient, index) => {
        resetRecipe[ingredient] = evenPercentage + (index === 0 ? remainder : 0);
      });
      setRecipe(resetRecipe);
    }
  };

  const handleSave = () => {
    if (totalPercentage !== 100) {
      Alert.alert(
        '저장 실패',
        '성분 비율의 합이 100%가 되어야 합니다.',
        [{ text: '확인' }]
      );
      return;
    }

    Alert.alert(
      '레시피 저장',
      '이 레시피를 저장하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '저장', 
          onPress: () => {
            // 여기서 레시피 저장 로직 구현
            Alert.alert('저장 완료', '나만의 레시피가 저장되었습니다.');
            setEditMode(false);
          } 
        }
      ]
    );
  };

  const handleStartManufacturing = () => {
    if (totalPercentage !== 100) {
      Alert.alert(
        '제조 불가',
        '성분 비율의 합이 100%가 되어야 제조할 수 있습니다.',
        [{ text: '확인' }]
      );
      return;
    }

    Alert.alert(
      '향수 제조',
      '이 레시피로 향수 제조를 시작하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '제조 시작', 
          onPress: () => {
            // 제조 화면으로 이동
            router.push('/manufacturing');
          } 
        }
      ]
    );
  };

  const getIngredientColor = (ingredient: string): string => {
    const colors: { [key: string]: string } = {
      '장미': '#d97066',
      '자스민': '#8b5cf6',
      '피오니': '#ec4899',
      '머스크': '#6b7280',
      '바닐라': '#f59e0b',
      '샌달우드': '#8b6f47',
      '시더우드': '#059669',
      '패촐리': '#7c2d12',
      '베티버': '#365314',
      '시트러스': '#f97316',
      '아쿠아틱': '#0ea5e9',
      '그린': '#16a34a',
      '오존': '#06b6d4',
      '앰버': '#d97706',
      '스파이시': '#dc2626',
    };
    return colors[ingredient] || '#9ca3af';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{selectedPerfume.name}</Text>
          <Text style={styles.subtitle}>레시피 커스터마이징</Text>
          
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, !editMode && styles.modeButtonActive]}
              onPress={() => setEditMode(false)}
            >
              <Text style={[styles.modeButtonText, !editMode && styles.modeButtonTextActive]}>
                보기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, editMode && styles.modeButtonActive]}
              onPress={() => setEditMode(true)}
            >
              <Text style={[styles.modeButtonText, editMode && styles.modeButtonTextActive]}>
                편집
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>전체 비율</Text>
            <Text style={[
              styles.totalValue,
              totalPercentage === 100 ? styles.totalValueValid : styles.totalValueInvalid
            ]}>
              {totalPercentage}%
            </Text>
            {totalPercentage !== 100 && (
              <Text style={styles.totalWarning}>
                {totalPercentage > 100 ? '100%를 초과했습니다' : '100%가 되어야 합니다'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.ingredientsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>성분 비율</Text>
            {editMode && (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleAutoBalance}>
                  <RefreshCw size={16} color="#3b82f6" />
                  <Text style={styles.actionButtonText}>균등 분배</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
                  <RotateCcw size={16} color="#ef4444" />
                  <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>초기화</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.ingredientsContainer}>
            {Object.entries(recipe).map(([ingredient, percentage]) => {
              const isFromAPI = perfumeNotes.some(note => note.name === ingredient);
              const originalWeight = perfumeNotes.find(note => note.name === ingredient)?.weight || 0;
              const isModified = isFromAPI && percentage !== originalWeight;
              
              return (
                <View key={ingredient} style={[
                  styles.ingredientCard,
                  isFromAPI && styles.apiIngredientCard
                ]}>
                  <View style={styles.ingredientHeader}>
                    <View style={styles.ingredientInfo}>
                      <View style={[
                        styles.ingredientDot, 
                        { backgroundColor: getIngredientColor(ingredient) },
                        isFromAPI && styles.apiIngredientDot
                      ]} />
                      <Text style={[
                        styles.ingredientName,
                        isFromAPI && styles.apiIngredientName
                      ]}>
                        {ingredient}
                      </Text>
                      {isFromAPI && (
                        <Text style={styles.apiLabel}>제조용</Text>
                      )}
                    </View>
                    <View style={styles.percentageContainer}>
                      <Text style={[
                        styles.ingredientPercentage,
                        isModified && styles.modifiedPercentage
                      ]}>
                        {percentage}%
                      </Text>
                      {isFromAPI && isModified && (
                        <Text style={styles.originalPercentage}>
                          (원래: {originalWeight}%)
                        </Text>
                      )}
                    </View>
                  </View>
                
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(percentage, 100)}%`, 
                        backgroundColor: getIngredientColor(ingredient) 
                      }
                    ]} 
                  />
                </View>

                {editMode && (
                  <View style={styles.sliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      value={percentage}
                      onValueChange={(value) => handleSliderChange(ingredient, value)}
                      minimumTrackTintColor={getIngredientColor(ingredient)}
                      maximumTrackTintColor="#f3f4f6"
                      thumbTintColor={getIngredientColor(ingredient)}
                    />
                    <View style={styles.sliderLabels}>
                      <Text style={styles.sliderLabel}>0%</Text>
                      <Text style={styles.sliderLabel}>100%</Text>
                    </View>
                  </View>
                )}
                </View>
              );
            })}
          </View>
        </View>

        {editMode && (
          <View style={styles.recipeActions}>
            <TouchableOpacity 
              style={[styles.saveButton, totalPercentage !== 100 && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={totalPercentage !== 100}
            >
              <Save size={16} color="#ffffff" />
              <Text style={styles.saveButtonText}>레시피 저장</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.manufacturingSection}>
          <Text style={styles.sectionTitle}>향수 제조</Text>
          <View style={styles.manufacturingCard}>
            <View style={styles.manufacturingInfo}>
              <FlaskConical size={24} color="#22c55e" />
              <View style={styles.manufacturingText}>
                <Text style={styles.manufacturingTitle}>Moodrop Station에서 제조</Text>
                <Text style={styles.manufacturingDescription}>
                  이 레시피를 바탕으로 실제 향수를 제조할 수 있습니다
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.manufacturingButton, totalPercentage !== 100 && styles.manufacturingButtonDisabled]}
              onPress={handleStartManufacturing}
              disabled={totalPercentage !== 100}
            >
              <Text style={[
                styles.manufacturingButtonText,
                totalPercentage !== 100 && styles.manufacturingButtonTextDisabled
              ]}>
                제조 시작하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {!editMode && (
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.editButtonText}>레시피 편집하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#525252',
    marginBottom: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    color: '#737373',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#171717',
    fontWeight: '600',
  },
  totalSection: {
    padding: 24,
    paddingBottom: 16,
  },
  totalCard: {
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalValueValid: {
    color: '#22c55e',
  },
  totalValueInvalid: {
    color: '#ef4444',
  },
  totalWarning: {
    fontSize: 12,
    color: '#ef4444',
  },
  ingredientsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  ingredientsContainer: {
    gap: 16,
  },
  ingredientCard: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#171717',
  },
  ingredientPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderContainer: {
    marginTop: 16,
  },
  slider: {
    width: '100%',
    height: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#737373',
  },
  recipeActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171717',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  manufacturingSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  manufacturingCard: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  manufacturingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  manufacturingText: {
    flex: 1,
    marginLeft: 12,
  },
  manufacturingTitle: {
    fontSize: 16,
    fontWeight: '600',  
    color: '#171717',
    marginBottom: 4,
  },
  manufacturingDescription: {
    fontSize: 14,
    color: '#525252',
  },
  manufacturingButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manufacturingButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  manufacturingButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  manufacturingButtonTextDisabled: {
    color: '#9ca3af',
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // API 기반 향료 스타일
  apiIngredientCard: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  apiIngredientDot: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  apiIngredientName: {
    fontWeight: '600',
    color: '#1e40af',
  },
  apiLabel: {
    fontSize: 10,
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    fontWeight: '600',
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  modifiedPercentage: {
    color: '#ef4444',
    fontWeight: '700',
  },
  originalPercentage: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});