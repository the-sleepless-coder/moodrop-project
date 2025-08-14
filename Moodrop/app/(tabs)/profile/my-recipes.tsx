import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlaskConical, Clock, Droplets, Eye, Plus, MoreVertical, AlertCircle, Info } from 'lucide-react-native';
import { categoryService } from '@/services/categoryService';
import { UserRecipe, UserRecipeListResponse } from '@/types/category';
import CustomModal, { ModalAction } from '@/components/CustomModal';

export default function MyRecipesScreen() {
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    actions: ModalAction[];
    icon?: React.ReactNode;
  }>({ title: '', message: '', actions: [] });

  // 향료 색상 매핑
  const getIngredientColor = (ingredient: string) => {
    const colors: { [key: string]: string } = {
      '장미': '#d97066', 'rose': '#d97066',
      '자스민': '#8b5cf6', 'jasmine': '#8b5cf6',
      '피오니': '#ec4899', 'peony': '#ec4899',
      '머스크': '#6b7280', 'musk': '#6b7280',
      '바닐라': '#f59e0b', 'vanilla': '#f59e0b',
      '샌달우드': '#8b6f47', 'sandalwood': '#8b6f47',
      '시더우드': '#059669', 'cedarwood': '#059669',
      '패촐리': '#7c2d12', 'patchouli': '#7c2d12',
      '베티버': '#365314', 'vetiver': '#365314',
      '시트러스': '#f97316', 'citrus': '#f97316',
      '아쿠아틱': '#0ea5e9', 'aquatic': '#0ea5e9',
      '그린': '#16a34a', 'green': '#16a34a',
      '오존': '#06b6d4', 'ozone': '#06b6d4',
      '앰버': '#d97706', 'amber': '#d97706',
      '스파이시': '#dc2626', 'spicy': '#dc2626',
      'honey': '#f59e0b',
      'pink pepper': '#ef4444',
      'cinnamon': '#92400e',
      'coconut': '#fbbf24',
      'rosemary': '#059669',
      'melon': '#22c55e',
      'tobacco': '#7c2d12',
    };
    return colors[ingredient.toLowerCase()] || '#9ca3af';
  };

  // 향료 타입별 아이콘
  const getNoteTypeIcon = (type: 'top' | 'middle' | 'base') => {
    switch (type) {
      case 'top':
        return <Droplets size={12} color="#3b82f6" />;
      case 'middle':
        return <FlaskConical size={12} color="#8b5cf6" />;
      case 'base':
        return <Clock size={12} color="#6b7280" />;
    }
  };

  // 레시피 데이터 조회
  const fetchRecipes = async () => {
    try {
      const response = await categoryService.getUserRecipes('json');
      
      if (response.success && response.data) {
        setRecipes(response.data);
        console.log('My Recipes loaded:', response.data.length);
      } else {
        console.error('Failed to load recipes:', response.error);
        setModalConfig({
          title: '오류',
          message: '레시피를 불러오는데 실패했습니다.',
          icon: <AlertCircle size={32} color="#ef4444" />,
          actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setModalConfig({
        title: '오류',
        message: '네트워크 오류가 발생했습니다.',
        icon: <AlertCircle size={32} color="#ef4444" />,
        actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
      });
      setModalVisible(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh 핸들러
  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchRecipes();
  }, []);

  // 새 레시피 추가 (향수 찾기로 이동)
  const handleAddNewRecipe = () => {
    setModalConfig({
      title: '새 레시피 추가',
      message: '향수 찾기 탭에서 새로운 향수를 발견하고 레시피를 저장하세요.',
      icon: <Plus size={32} color="#1e40af" />,
      actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
    });
    setModalVisible(true);
  };

  // 레시피 상세 보기
  const handleRecipeDetail = (recipe: UserRecipe) => {
    setModalConfig({
      title: recipe.perfumeName,
      message: `${recipe.description}\n\n향료 구성:\n${recipe.composition.map(comp => 
        `• ${comp.name} (${comp.type}): ${comp.weight}%`
      ).join('\n')}`,
      icon: <Info size={32} color="#1e40af" />,
      actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
    });
    setModalVisible(true);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <FlaskConical size={48} color="#1e40af" />
          <Text style={styles.loadingText}>레시피를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* 헤더 섹션 */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>나만의 레시피</Text>
            <Text style={styles.subtitle}>저장된 향수 레시피 {recipes.length}개</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNewRecipe}>
            <Plus size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* 레시피 목록 */}
        {recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FlaskConical size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>저장된 레시피가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              향수 찾기 탭에서 마음에 드는 향수를 발견하고{'\n'}
              나만의 레시피로 저장해보세요
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddNewRecipe}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.emptyButtonText}>첫 레시피 추가하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.recipeList}>
            {recipes.map((recipe) => (
              <TouchableOpacity 
                key={recipe.recipeId} 
                style={styles.recipeCard}
                onPress={() => handleRecipeDetail(recipe)}
              >
                {/* 레시피 헤더 */}
                <View style={styles.recipeHeader}>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName}>{recipe.perfumeName}</Text>
                    <Text style={styles.recipeDescription}>{recipe.description}</Text>
                  </View>
                  <View style={styles.recipeActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Eye size={16} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <MoreVertical size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 향료 구성 */}
                <View style={styles.compositionSection}>
                  <Text style={styles.compositionTitle}>향료 구성</Text>
                  <View style={styles.compositionList}>
                    {recipe.composition.map((comp, index) => (
                      <View key={index} style={styles.compositionItem}>
                        <View style={styles.compositionHeader}>
                          <View style={styles.compositionName}>
                            {getNoteTypeIcon(comp.type)}
                            <Text style={styles.ingredientName}>{comp.name}</Text>
                          </View>
                          <Text style={styles.ingredientWeight}>{comp.weight}%</Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${comp.weight}%`,
                                backgroundColor: getIngredientColor(comp.name)
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 레시피 메타 정보 */}
                <View style={styles.recipeFooter}>
                  <View style={styles.metaInfo}>
                    <FlaskConical size={14} color="#6b7280" />
                    <Text style={styles.metaText}>레시피 ID: {recipe.recipeId}</Text>
                  </View>
                  <View style={styles.metaInfo}>
                    <Droplets size={14} color="#6b7280" />
                    <Text style={styles.metaText}>
                      {recipe.composition.length}개 향료
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
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
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  recipeList: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compositionSection: {
    marginBottom: 16,
  },
  compositionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  compositionList: {
    gap: 12,
  },
  compositionItem: {
    gap: 6,
  },
  compositionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compositionName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  ingredientWeight: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
});