import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Clock, Heart, ArrowRight, Download, Settings, FlaskConical } from 'lucide-react-native';
import useStore from '@/store/useStore';

const { width } = Dimensions.get('window');

export default function DetailScreen() {
  const { selectedPerfume } = useStore();
  const [activeTab, setActiveTab] = useState<'info' | 'ingredients' | 'reviews'>('info');

  if (!selectedPerfume) {
    router.back();
    return null;
  }

  const handleEditRecipe = () => {
    router.push('/category/recipe');
  };

  const handleStartManufacturing = () => {
    router.push('/category/recipe');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <View style={styles.tabContent}>
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>향수 정보</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>브랜드:</Text>
                <Text style={styles.infoValue}>{selectedPerfume.brand}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>지속시간:</Text>
                <Text style={styles.infoValue}>{selectedPerfume.duration}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>향의 구성</Text>
              <View style={styles.notesContainer}>
                <View style={styles.noteGroup}>
                  <Text style={styles.noteGroupTitle}>Top Notes</Text>
                  <Text style={styles.noteGroupText}>{selectedPerfume.topNotes.join(', ')}</Text>
                </View>
                <View style={styles.noteGroup}>
                  <Text style={styles.noteGroupTitle}>Middle Notes</Text>
                  <Text style={styles.noteGroupText}>{selectedPerfume.middleNotes.join(', ')}</Text>
                </View>
                <View style={styles.noteGroup}>
                  <Text style={styles.noteGroupTitle}>Base Notes</Text>
                  <Text style={styles.noteGroupText}>{selectedPerfume.baseNotes.join(', ')}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      
      case 'ingredients':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>성분 비율</Text>
            <View style={styles.ingredientsContainer}>
              {Object.entries(selectedPerfume.ingredients).map(([ingredient, percentage]) => (
                <View key={ingredient} style={styles.ingredientRow}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient}</Text>
                    <Text style={styles.ingredientPercentage}>{percentage}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${percentage}%`, backgroundColor: getIngredientColor(ingredient) }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.editRecipeSection}>
              <Text style={styles.editRecipeTitle}>나만의 레시피로 커스터마이징</Text>
              <Text style={styles.editRecipeDescription}>
                이 향수를 기반으로 성분 비율을 조정하여 나만의 향수를 만들어보세요
              </Text>
              <TouchableOpacity style={styles.editRecipeButton} onPress={handleEditRecipe}>
                <Text style={styles.editRecipeButtonText}>레시피 편집하기</Text>
                <ArrowRight size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>사용자 리뷰</Text>
              <View style={styles.overallRating}>
                <Star size={20} color="#f59e0b" />
                <Text style={styles.overallRatingText}>{selectedPerfume.rating}</Text>
                <Text style={styles.reviewCount}>(24개 리뷰)</Text>
              </View>
            </View>
            
            {[
              { author: '향수러버', rating: 5, comment: '정말 오래 지속되고 은은한 향이 좋아요!', date: '2024.01.15' },
              { author: '플라워걸', rating: 4, comment: '플로럴 향이 너무 예뻐요. 데이트할 때 완벽!', date: '2024.01.10' },
              { author: '향수초보', rating: 5, comment: '첫 향수로 선택했는데 만족스러워요', date: '2024.01.08' }
            ].map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author}</Text>
                  <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        color={i < review.rating ? '#f59e0b' : '#d1d5db'} 
                        fill={i < review.rating ? '#f59e0b' : 'transparent'}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.perfumeName}>{selectedPerfume.name}</Text>
          <Text style={styles.perfumeDescription}>{selectedPerfume.description}</Text>
          
          <View style={styles.quickStats}>
            <View style={styles.statCard}>
              <Star size={16} color="#f59e0b" />
              <Text style={styles.statText}>{selectedPerfume.rating}</Text>
            </View>
            <View style={styles.statCard}>
              <Clock size={16} color="#737373" />
              <Text style={styles.statText}>{selectedPerfume.duration}</Text>
            </View>
            <View style={styles.statCard}>
              <Heart size={16} color="#ef4444" />
              <Text style={styles.statText}>{selectedPerfume.popularity}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {[
            { key: 'info', label: '정보' },
            { key: 'ingredients', label: '성분' },
            { key: 'reviews', label: '리뷰' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderTabContent()}
        
        <View style={styles.manufacturingSection}>
          <View style={styles.manufacturingCard}>
            <View style={styles.manufacturingInfo}>
              <FlaskConical size={28} color="#22c55e" />
              <View style={styles.manufacturingText}>
                <Text style={styles.manufacturingTitle}>이 향수로 제작하기</Text>
                <Text style={styles.manufacturingDescription}>
                  이 향수를 기반으로 나만의 레시피를 만들어 실제 향수를 제작해보세요
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.manufacturingButton} onPress={handleStartManufacturing}>
          <FlaskConical size={20} color="#ffffff" />
          <Text style={styles.manufacturingButtonText}>향수 제작하기</Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getIngredientColor(ingredient: string): string {
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
  perfumeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 8,
  },
  perfumeDescription: {
    fontSize: 16,
    color: '#525252',
    lineHeight: 24,
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statText: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '500',
    marginLeft: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#171717',
  },
  tabText: {
    fontSize: 16,
    color: '#737373',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#171717',
    fontWeight: '600',
  },
  tabContent: {
    padding: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 16,
    color: '#525252',
  },
  infoValue: {
    fontSize: 16,
    color: '#171717',
    fontWeight: '500',
  },
  notesContainer: {
    gap: 16,
  },
  noteGroup: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 8,
  },
  noteGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 8,
  },
  noteGroupText: {
    fontSize: 14,
    color: '#525252',
  },
  ingredientsContainer: {
    marginBottom: 24,
  },
  ingredientRow: {
    marginBottom: 16,
  },
  ingredientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 16,
    color: '#171717',
    fontWeight: '500',
  },
  ingredientPercentage: {
    fontSize: 16,
    color: '#171717',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  editRecipeSection: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 12,
  },
  editRecipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 8,
  },
  editRecipeDescription: {
    fontSize: 14,
    color: '#525252',
    lineHeight: 20,
    marginBottom: 16,
  },
  editRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171717',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editRecipeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overallRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
  },
  reviewCount: {
    fontSize: 14,
    color: '#737373',
  },
  reviewCard: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#737373',
    marginLeft: 'auto',
  },
  reviewComment: {
    fontSize: 14,
    color: '#525252',
    lineHeight: 20,
  },
  manufacturingSection: {
    padding: 24,
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
  },
  manufacturingText: {
    flex: 1,
    marginLeft: 16,
  },
  manufacturingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 4,
  },
  manufacturingDescription: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  manufacturingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  manufacturingButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});