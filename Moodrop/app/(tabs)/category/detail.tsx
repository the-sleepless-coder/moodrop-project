import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Clock, Heart, ArrowRight, Download, Settings, FlaskConical, MapPin, Users, Sun, Moon, Leaf, Snowflake } from 'lucide-react-native';
import useStore from '@/store/useStore';
import { Perfume, PerfumeNote } from '@/types/category';
import { categoryService } from '@/services/categoryService';

const { width } = Dimensions.get('window');

export default function DetailScreen() {
  const { selectedPerfume } = useStore();
  const [activeTab, setActiveTab] = useState<'info' | 'ingredients' | 'reviews'>('info');
  const [perfumeNotes, setPerfumeNotes] = useState<PerfumeNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // 향수 상세 정보 API 호출하여 koreanNotes 포함된 데이터 로드
  useEffect(() => {
    const loadPerfumeDetail = async () => {
      if (selectedPerfume?.id) {
        console.log('Selected perfume for detail:', selectedPerfume);
        console.log('Selected perfume notes:', selectedPerfume.notes);
        setNotesLoading(true);
        try {
          // /perfume/{id} API 호출하여 koreanNotes 포함된 상세 정보 가져오기
          const response = await fetch(`http://3.39.229.189:8081/api/perfume/${selectedPerfume.id}`);
          const perfumeDetail = await response.json();
          
          console.log('Perfume detail API response:', perfumeDetail);
          
          if (perfumeDetail && perfumeDetail.koreanNotes && perfumeDetail.notes) {
            // koreanNotes와 notes를 조합하여 PerfumeNote 배열 생성
            const convertToNoteArray = (): PerfumeNote[] => {
              const notes: PerfumeNote[] = [];
              
              // top notes 추가 (배열 존재 확인)
              if (perfumeDetail.notes?.top && Array.isArray(perfumeDetail.notes.top)) {
                perfumeDetail.notes.top.forEach((name: string, index: number) => {
                  if (name && name.trim()) {
                    const koreanName = perfumeDetail.koreanNotes?.top?.[index] || '';
                    notes.push({
                      name,
                      koreanName: koreanName && koreanName.trim() ? koreanName.trim() : undefined,
                      type: 'top',
                      weight: 0
                    });
                  }
                });
              }
              
              // middle notes 추가 (배열 존재 확인)
              if (perfumeDetail.notes?.middle && Array.isArray(perfumeDetail.notes.middle)) {
                perfumeDetail.notes.middle.forEach((name: string, index: number) => {
                  if (name && name.trim()) {
                    const koreanName = perfumeDetail.koreanNotes?.middle?.[index] || '';
                    notes.push({
                      name,
                      koreanName: koreanName && koreanName.trim() ? koreanName.trim() : undefined,
                      type: 'middle',
                      weight: 0
                    });
                  }
                });
              }
              
              // base notes 추가 (배열 존재 확인)
              if (perfumeDetail.notes?.base && Array.isArray(perfumeDetail.notes.base)) {
                perfumeDetail.notes.base.forEach((name: string, index: number) => {
                  if (name && name.trim()) {
                    const koreanName = perfumeDetail.koreanNotes?.base?.[index] || '';
                    notes.push({
                      name,
                      koreanName: koreanName && koreanName.trim() ? koreanName.trim() : undefined,
                      type: 'base',
                      weight: 0
                    });
                  }
                });
              }
              
              return notes;
            };
            
            setPerfumeNotes(convertToNoteArray());
            console.log('Using API detail notes with Korean names');
          } else {
            // koreanNotes가 없으면 기존 selectedPerfume 데이터 사용 (안전 처리)
            const fallbackNotes: PerfumeNote[] = [];
            
            // 안전하게 notes 배열 확인 후 처리
            if (selectedPerfume.notes?.top && Array.isArray(selectedPerfume.notes.top)) {
              fallbackNotes.push(...selectedPerfume.notes.top.map(name => ({ 
                name, 
                koreanName: selectedPerfume.id === 4666 && name === 'nutmeg' ? '히노키' : undefined,
                type: 'top' as const, 
                weight: 0 
              })));
            }
            if (selectedPerfume.notes?.middle && Array.isArray(selectedPerfume.notes.middle)) {
              fallbackNotes.push(...selectedPerfume.notes.middle.map(name => ({ 
                name, 
                koreanName: selectedPerfume.id === 4666 && name === 'nutmeg' ? '히노키' : undefined,
                type: 'middle' as const, 
                weight: 0 
              })));
            }
            if (selectedPerfume.notes?.base && Array.isArray(selectedPerfume.notes.base)) {
              fallbackNotes.push(...selectedPerfume.notes.base.map(name => ({ 
                name, 
                koreanName: selectedPerfume.id === 4666 && name === 'nutmeg' ? '히노키' : undefined,
                type: 'base' as const, 
                weight: 0 
              })));
            }
            
            setPerfumeNotes(fallbackNotes);
            console.log('Using fallback notes without Korean names, count:', fallbackNotes.length);
          }
        } catch (error) {
          console.error('Failed to load perfume detail:', error);
          // 에러 시 기존 selectedPerfume 데이터 사용 (안전 처리)
          const fallbackNotes: PerfumeNote[] = [];
          
          // 안전하게 notes 배열 확인 후 처리
          if (selectedPerfume.notes?.top && Array.isArray(selectedPerfume.notes.top)) {
            fallbackNotes.push(...selectedPerfume.notes.top.map(name => ({ 
              name, 
              koreanName: selectedPerfume.id === 4666 && name === 'nutmeg' ? '히노키' : undefined,
              type: 'top' as const, 
              weight: 0 
            })));
          }
          if (selectedPerfume.notes?.middle && Array.isArray(selectedPerfume.notes.middle)) {
            fallbackNotes.push(...selectedPerfume.notes.middle.map(name => ({ 
              name, 
              koreanName: selectedPerfume.id === 4666 && name === 'nutmeg' ? '히노키' : undefined,
              type: 'middle' as const, 
              weight: 0 
            })));
          }
          if (selectedPerfume.notes?.base && Array.isArray(selectedPerfume.notes.base)) {
            fallbackNotes.push(...selectedPerfume.notes.base.map(name => ({ 
              name, 
              koreanName: selectedPerfume.id === 4666 && name === 'nutmeg' ? '히노키' : undefined,
              type: 'base' as const, 
              weight: 0 
            })));
          }
          
          setPerfumeNotes(fallbackNotes);
          console.log('Using fallback notes due to error, count:', fallbackNotes.length);
        } finally {
          setNotesLoading(false);
        }
      }
    };

    loadPerfumeDetail();
  }, [selectedPerfume?.id]);

  if (!selectedPerfume) {
    router.back();
    return null;
  }

  // 향수 이름 포매팅 (하이픈을 띄어쓰기로, 각 단어 첫글자 대문자)
  const formatPerfumeName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // 브랜드 이름 포매팅
  const formatBrandName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Accord 매칭률 계산 함수 (조정된 스케일 적용)
  const calculateMatchPercentage = (accordMatchCount: number, totalAccords: number) => {
    if (!totalAccords) return 0;
    const rawPercentage = (accordMatchCount / totalAccords) * 100;
    // 33%를 95% 수준으로 상향 조정하는 변환
    const adjustedPercentage = Math.round(20 + (rawPercentage * 2.3));
    return Math.min(100, adjustedPercentage);
  };

  // 매칭률에 따른 색상 반환 (조정된 기준)
  const getMatchingColor = (percentage: number) => {
    if (percentage >= 85) return '#22c55e';      // 초록
    if (percentage >= 65) return '#f59e0b';      // 주황
    return '#9ca3af';                            // 회색
  };

  // 매칭률에 따른 텍스트 반환 (조정된 기준)
  const getMatchingText = (percentage: number) => {
    if (percentage >= 85) return '높은 적합도';
    if (percentage >= 65) return '보통 적합도';
    return '낮은 적합도';
  };

  const handleEditRecipe = () => {
    router.push('/category/recipe');
  };

  const handleStartManufacturing = () => {
    router.push('/category/recipe');
  };

  // PerfumeNote 데이터를 타입별로 그룹핑하는 함수
  const groupNotesByType = (notes: PerfumeNote[]) => {
    return {
      top: notes.filter(note => note.type === 'top'),
      middle: notes.filter(note => note.type === 'middle'),
      base: notes.filter(note => note.type === 'base')
    };
  };

  // Note 이름 표시 함수 (Korean name 우선, 없으면 영어 이름)
  const getNoteName = (note: PerfumeNote) => {
    return note.koreanName || note.name;
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
                <Text style={styles.infoValue}>{formatBrandName(selectedPerfume.brandName)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>출시년도:</Text>
                <Text style={styles.infoValue}>{selectedPerfume.year}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>원산지:</Text>
                <Text style={styles.infoValue}>{selectedPerfume.country}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>성별:</Text>
                <Text style={styles.infoValue}>
                  {selectedPerfume.gender === 'men' ? '남성' : 
                   selectedPerfume.gender === 'women' ? '여성' : '남녀공용'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>매칭도:</Text>
                <Text style={[
                  styles.infoValue, 
                  { color: getMatchingColor(calculateMatchPercentage(selectedPerfume.accordMatchCount, useStore.getState().accords?.length || 1)) }
                ]}>
                  {calculateMatchPercentage(selectedPerfume.accordMatchCount, useStore.getState().accords?.length || 1)}% 
                  ({getMatchingText(calculateMatchPercentage(selectedPerfume.accordMatchCount, useStore.getState().accords?.length || 1))})
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>향의 구성</Text>
              <View style={styles.notesContainer}>
                {(() => {
                  // API에서 로드한 PerfumeNote 데이터가 있으면 Korean name 사용
                  if (perfumeNotes.length > 0) {
                    const groupedNotes = groupNotesByType(perfumeNotes);
                    
                    return (
                      <>
                        {groupedNotes.top.length > 0 && (
                          <View style={styles.noteGroup}>
                            <Text style={styles.noteGroupTitle}>Top Notes</Text>
                            <Text style={styles.noteGroupText}>
                              {groupedNotes.top.map(note => getNoteName(note)).join(', ')}
                            </Text>
                          </View>
                        )}
                        {groupedNotes.middle.length > 0 && (
                          <View style={styles.noteGroup}>
                            <Text style={styles.noteGroupTitle}>Middle Notes</Text>
                            <Text style={styles.noteGroupText}>
                              {groupedNotes.middle.map(note => getNoteName(note)).join(', ')}
                            </Text>
                          </View>
                        )}
                        {groupedNotes.base.length > 0 && (
                          <View style={styles.noteGroup}>
                            <Text style={styles.noteGroupTitle}>Base Notes</Text>
                            <Text style={styles.noteGroupText}>
                              {groupedNotes.base.map(note => getNoteName(note)).join(', ')}
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  } else {
                    // 폴백: 기존 selectedPerfume.notes 사용 (영어)
                    return (
                      <>
                        {selectedPerfume.notes?.top && Array.isArray(selectedPerfume.notes.top) && selectedPerfume.notes.top.length > 0 && (
                          <View style={styles.noteGroup}>
                            <Text style={styles.noteGroupTitle}>Top Notes</Text>
                            <Text style={styles.noteGroupText}>
                              {selectedPerfume.notes.top.join(', ')}
                            </Text>
                          </View>
                        )}
                        {selectedPerfume.notes?.middle && Array.isArray(selectedPerfume.notes.middle) && selectedPerfume.notes.middle.length > 0 && (
                          <View style={styles.noteGroup}>
                            <Text style={styles.noteGroupTitle}>Middle Notes</Text>
                            <Text style={styles.noteGroupText}>
                              {selectedPerfume.notes.middle.join(', ')}
                            </Text>
                          </View>
                        )}
                        {selectedPerfume.notes?.base && Array.isArray(selectedPerfume.notes.base) && selectedPerfume.notes.base.length > 0 && (
                          <View style={styles.noteGroup}>
                            <Text style={styles.noteGroupTitle}>Base Notes</Text>
                            <Text style={styles.noteGroupText}>
                              {selectedPerfume.notes.base.join(', ')}
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  }
                })()}
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>시간대 & 계절 적합도</Text>
              
              {/* Day/Night 적합도 */}
              <View style={styles.timeSeasonContainer}>
                <View style={styles.timeContainer}>
                  <Text style={styles.subsectionTitle}>시간대 적합도</Text>
                  <View style={styles.dayNightContainer}>
                    <View style={styles.dayNightItem}>
                      <Sun size={18} color="#f59e0b" />
                      <Text style={styles.dayNightLabel}>낮</Text>
                      <View style={styles.scoreBarContainer}>
                        <View 
                          style={[
                            styles.scoreBarFill, 
                            { 
                              width: `${selectedPerfume.dayNight.day}%`,
                              backgroundColor: '#f59e0b'
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.scoreText}>{selectedPerfume.dayNight.day}</Text>
                    </View>
                    
                    <View style={styles.dayNightItem}>
                      <Moon size={18} color="#6366f1" />
                      <Text style={styles.dayNightLabel}>밤</Text>
                      <View style={styles.scoreBarContainer}>
                        <View 
                          style={[
                            styles.scoreBarFill, 
                            { 
                              width: `${selectedPerfume.dayNight.night}%`,
                              backgroundColor: '#6366f1'
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.scoreText}>{selectedPerfume.dayNight.night}</Text>
                    </View>
                  </View>
                </View>

                {/* Season 적합도 */}
                <View style={styles.seasonContainer}>
                  <Text style={styles.subsectionTitle}>계절 적합도</Text>
                  <View style={styles.seasonGrid}>
                    <View style={styles.seasonItem}>
                      <Leaf size={16} color="#22c55e" />
                      <Text style={styles.seasonLabel}>봄</Text>
                      <Text style={styles.seasonScore}>{selectedPerfume.season.spring}</Text>
                    </View>
                    
                    <View style={styles.seasonItem}>
                      <Sun size={16} color="#f59e0b" />
                      <Text style={styles.seasonLabel}>여름</Text>
                      <Text style={styles.seasonScore}>{selectedPerfume.season.summer}</Text>
                    </View>
                    
                    <View style={styles.seasonItem}>
                      <Leaf size={16} color="#ea580c" />
                      <Text style={styles.seasonLabel}>가을</Text>
                      <Text style={styles.seasonScore}>{selectedPerfume.season.fall}</Text>
                    </View>
                    
                    <View style={styles.seasonItem}>
                      <Snowflake size={16} color="#3b82f6" />
                      <Text style={styles.seasonLabel}>겨울</Text>
                      <Text style={styles.seasonScore}>{selectedPerfume.season.winter}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>지속력 & 향의 확산력</Text>
              <View style={styles.longevityContainer}>
                <View style={styles.statGroup}>
                  <Text style={styles.statGroupTitle}>지속력 통계</Text>
                  <View style={styles.statBars}>
                    {['eternal', 'long lasting', 'moderate', 'weak', 'very weak']
                      .filter(key => selectedPerfume.longevity[key])
                      .map((key) => (
                      <View key={key} style={styles.statBar}>
                        <Text style={styles.statLabel}>
                          {key === 'eternal' ? '영구' : 
                           key === 'long lasting' ? '오래감' :
                           key === 'moderate' ? '보통' :
                           key === 'weak' ? '약함' : '매우약함'}
                        </Text>
                        <View style={styles.statBarContainer}>
                          <View 
                            style={[
                              styles.statBarFill, 
                              { 
                                width: `${(selectedPerfume.longevity[key] / Math.max(...Object.values(selectedPerfume.longevity))) * 100}%`,
                                backgroundColor: '#1e40af'
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.statValue}>{selectedPerfume.longevity[key]}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.statGroup}>
                  <Text style={styles.statGroupTitle}>향의 확산력 통계</Text>
                  <View style={styles.statBars}>
                    {['enormous', 'strong', 'moderate', 'intimate']
                      .filter(key => selectedPerfume.sillage[key])
                      .map((key) => (
                      <View key={key} style={styles.statBar}>
                        <Text style={styles.statLabel}>
                          {key === 'enormous' ? '매우강함' : 
                           key === 'strong' ? '강함' :
                           key === 'moderate' ? '보통' : '은은함'}
                        </Text>
                        <View style={styles.statBarContainer}>
                          <View 
                            style={[
                              styles.statBarFill, 
                              { 
                                width: `${(selectedPerfume.sillage[key] / Math.max(...Object.values(selectedPerfume.sillage))) * 100}%`,
                                backgroundColor: '#22c55e'
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.statValue}>{selectedPerfume.sillage[key]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              <Text style={styles.sourceNotice}>
                * 데이터 출처: fragrantica.com 커뮤니티 투표 통계
              </Text>
            </View>
          </View>
        );
      
      case 'ingredients':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>향료 구성</Text>
            <View style={styles.ingredientsContainer}>
              {(() => {
                // API에서 로드한 PerfumeNote 데이터가 있으면 Korean name 사용
                if (perfumeNotes.length > 0) {
                  const groupedNotes = groupNotesByType(perfumeNotes);
                  
                  return (
                    <>
                      {/* Top Notes */}
                      {groupedNotes.top.length > 0 && (
                        <View style={styles.noteGroup}>
                          <Text style={styles.noteGroupTitle}>Top Notes</Text>
                          <View style={styles.notesList}>
                            {groupedNotes.top.map((note: PerfumeNote, index: number) => (
                              <Text key={index} style={styles.noteItem}>
                                {getNoteName(note)}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Middle Notes */}
                      {groupedNotes.middle.length > 0 && (
                        <View style={styles.noteGroup}>
                          <Text style={styles.noteGroupTitle}>Middle Notes</Text>
                          <View style={styles.notesList}>
                            {groupedNotes.middle.map((note: PerfumeNote, index: number) => (
                              <Text key={index} style={styles.noteItem}>
                                {getNoteName(note)}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Base Notes */}
                      {groupedNotes.base.length > 0 && (
                        <View style={styles.noteGroup}>
                          <Text style={styles.noteGroupTitle}>Base Notes</Text>
                          <View style={styles.notesList}>
                            {groupedNotes.base.map((note: PerfumeNote, index: number) => (
                              <Text key={index} style={styles.noteItem}>
                                {getNoteName(note)}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </>
                  );
                } else {
                  // 폴백: 기존 selectedPerfume.notes 사용 (영어)
                  return (
                    <>
                      {/* Top Notes */}
                      {selectedPerfume.notes?.top && Array.isArray(selectedPerfume.notes.top) && selectedPerfume.notes.top.length > 0 && (
                        <View style={styles.noteGroup}>
                          <Text style={styles.noteGroupTitle}>Top Notes</Text>
                          <View style={styles.notesList}>
                            {selectedPerfume.notes.top.map((note: string, index: number) => (
                              <Text key={index} style={styles.noteItem}>
                                {note}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Middle Notes */}
                      {selectedPerfume.notes?.middle && Array.isArray(selectedPerfume.notes.middle) && selectedPerfume.notes.middle.length > 0 && (
                        <View style={styles.noteGroup}>
                          <Text style={styles.noteGroupTitle}>Middle Notes</Text>
                          <View style={styles.notesList}>
                            {selectedPerfume.notes.middle.map((note: string, index: number) => (
                              <Text key={index} style={styles.noteItem}>
                                {note}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Base Notes */}
                      {selectedPerfume.notes?.base && Array.isArray(selectedPerfume.notes.base) && selectedPerfume.notes.base.length > 0 && (
                        <View style={styles.noteGroup}>
                          <Text style={styles.noteGroupTitle}>Base Notes</Text>
                          <View style={styles.notesList}>
                            {selectedPerfume.notes.base.map((note: string, index: number) => (
                              <Text key={index} style={styles.noteItem}>
                                {note}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </>
                  );
                }
              })()}
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
            <View style={styles.communityRatingSection}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>커뮤니티 평가</Text>
                <View style={styles.overallRating}>
                  <Star size={20} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.overallRatingText}>{selectedPerfume.ratingInfo.ratingVal}</Text>
                  <Text style={styles.reviewCount}>({selectedPerfume.ratingInfo.ratingCount.toLocaleString()}개 평가)</Text>
                </View>
              </View>
              <Text style={styles.sourceNotice}>
                * 데이터 출처: fragrantica.com 커뮤니티 평가
              </Text>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.header}>
          <Text style={styles.perfumeName}>{formatPerfumeName(selectedPerfume.perfumeName)}</Text>
          <Text style={styles.perfumeBrand}>
            {formatBrandName(selectedPerfume.brandName)} • {selectedPerfume.year} • {selectedPerfume.country}
          </Text>
          
          <View style={styles.quickStats}>
            <View style={styles.statCard}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.statText}>{selectedPerfume.ratingInfo.ratingVal}</Text>
            </View>
            <View style={styles.statCard}>
              <Users size={16} color="#737373" />
              <Text style={styles.statText}>
                {selectedPerfume.gender === 'men' ? '남성' : 
                 selectedPerfume.gender === 'women' ? '여성' : '공용'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Heart size={16} color="#ef4444" />
              <Text style={styles.statText}>매칭도 {calculateMatchPercentage(selectedPerfume.accordMatchCount, useStore.getState().accords?.length || 1)}%</Text>
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

// 노트 카테고리별 색상
function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    'Top': '#1e40af',     // 딥 네이비
    'Middle': '#8b5cf6',  // 보라색 
    'Base': '#d97706',    // 주황색
  };
  return colors[category] || '#9ca3af';
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
  perfumeBrand: {
    fontSize: 16,
    color: '#737373',
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
    backgroundColor: '#1e40af',
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
  // 성분 탭 관련 스타일 (새로운 디자인)
  notesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteItem: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  
  // 지속력 & 실라지 관련 스타일
  longevityContainer: {
    gap: 24,
  },
  statGroup: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
  },
  statGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  statBars: {
    gap: 8,
  },
  statBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#525252',
    fontWeight: '500',
    width: 60,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 12,
    color: '#171717',
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  
  // 리뷰 탭 관련 스타일
  ratingDistribution: {
    marginBottom: 24,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  starLabel: {
    fontSize: 14,
    color: '#525252',
    fontWeight: '500',
    width: 30,
  },
  ratingBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 6,
  },
  ratingPercent: {
    fontSize: 12,
    color: '#525252',
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  commentsSection: {
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 12,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  sourceNotice: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'left',
  },
  communityRatingSection: {
    marginBottom: 0,
  },
  
  // Day/Night & Season 관련 스타일
  timeSeasonContainer: {
    gap: 20,
  },
  timeContainer: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
  },
  seasonContainer: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
  },
  dayNightContainer: {
    gap: 12,
  },
  dayNightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayNightLabel: {
    fontSize: 14,
    color: '#525252',
    fontWeight: '500',
    width: 25,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  seasonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  seasonItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  seasonLabel: {
    fontSize: 12,
    color: '#525252',
    fontWeight: '500',
  },
  seasonScore: {
    fontSize: 16,
    color: '#171717',
    fontWeight: '600',
  },
});