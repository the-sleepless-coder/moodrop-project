import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Modal, Animated, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlaskConical, Plus, Minus, RefreshCw, Save, X, Trash2, AlertTriangle, CheckCircle, Search, Filter, Star } from 'lucide-react-native';
import Svg, { Polygon, Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import CustomModal, { ModalAction } from '@/components/CustomModal';
import useStore from '@/store/useStore';
import noteService, { DeterminedNote, POPULAR_NOTES, NOTE_CATEGORIES } from '@/services/noteService';

const { width } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(width, 400); // 더 큰 컨테이너 크기
const CENTER_SIZE = CONTAINER_SIZE * 0.22; // 중앙부 비율 조정 (컴팩트)
const SLOT_SIZE = CONTAINER_SIZE * 0.19; // 더 큰 슬롯 크기

interface Ingredient {
  id: string;
  name: string;
  slot: number;
  amount: number;
  maxAmount: number;
  color: string;
  isEmpty?: boolean;
}

interface AvailableIngredient {
  id: string;
  name: string;
  koreanName: string;
  color: string;
  category: string;
  type: 'top' | 'middle' | 'base';
  isPopular?: boolean;
}

export default function IngredientSettingsScreen() {
  // zustand store에서 상태와 액션 가져오기
  const { 
    deviceIngredients, 
    updateIngredientAmount, 
    addIngredientToSlot, 
    removeIngredientFromSlot, 
    clearAllIngredients 
  } = useStore();

  // API 기반 향료 데이터
  const [allNotes, setAllNotes] = useState<DeterminedNote[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<AvailableIngredient[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  
  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);

  // Note 색상 매핑 (카테고리별)
  const getCategoryColor = (categoryId: string): string => {
    const colorMap: { [key: string]: string } = {
      'citrus': '#f59e0b',
      'floral': '#ec4899', 
      'woody': '#8b6f47',
      'amber': '#d97706',
      'oriental': '#6366f1',
      'spicy': '#ef4444',
      'fruity': '#10b981',
      'green': '#059669',
      'gourmand': '#a855f7',
      'oceanic': '#06b6d4',
      'powdery': '#f472b6',
      'chypre': '#84cc16',
      'fougere': '#22c55e',
      'aldehyde': '#64748b',
      'tobacco_leather': '#7c2d12',
      'bouquet': '#f97316',
      'warm': '#dc2626',
      'other': '#6b7280'
    };
    return colorMap[categoryId] || '#6b7280';
  };

  // API에서 Note 데이터 로드 및 사용자 보유 향료 설정
  useEffect(() => {
    const loadNotesAndUserInventory = async () => {
      setIsLoadingNotes(true);
      try {
        // 1. 모든 향료 정보 가져오기
        const response = await noteService.getAllDeterminedNotes();
        if (response.success && response.data) {
          setAllNotes(response.data);
          
          // API 데이터를 AvailableIngredient 형태로 변환 (unique notes only)
          const uniqueNotes = new Map<string, typeof response.data[0]>();
          
          // type에 관계없이 name으로 unique하게 만들기
          response.data.forEach(note => {
            if (!uniqueNotes.has(note.name)) {
              uniqueNotes.set(note.name, note);
            }
          });
          
          const ingredients: AvailableIngredient[] = Array.from(uniqueNotes.values()).map(note => {
            const categoryId = noteService.categorizeNote(note.name);
            const category = NOTE_CATEGORIES.find(cat => cat.id === categoryId);
            const isPopular = POPULAR_NOTES.some(pop => pop.name === note.name);
            
            return {
              id: note.name,
              name: note.name,
              koreanName: note.koreanName,
              color: getCategoryColor(categoryId),
              category: category?.name || '기타',
              type: note.type,
              isPopular
            };
          });

          // 에탄올 추가 (베이스 솔루션)
          ingredients.push({
            id: 'ethanol',
            name: 'ethanol',
            koreanName: '에탄올',
            color: '#3b82f6',
            category: '베이스',
            type: 'base',
            isPopular: true
          });

          setAvailableIngredients(ingredients);
          setFilteredIngredients(ingredients);

          // 2. 사용자 보유 향료 가져와서 슬롯에 자동 할당
          const userNotesResponse = await noteService.getUserNotes('json');
          if (userNotesResponse.success && userNotesResponse.data) {
            console.log('User owned notes:', userNotesResponse.data);
            
            // 먼저 모든 슬롯을 비우기
            clearAllIngredients();
            
            // 짧은 지연 후 사용자 보유 향료를 슬롯에 순서대로 할당
            setTimeout(() => {
              userNotesResponse.data.forEach((userNote, index) => {
                // 최대 9개 슬롯까지만 할당 (마지막 슬롯은 히노키용으로 예약)
                if (index < 9) {
                  const slotOrder = [1, 2, 4, 5, 6, 7, 8, 10, 11]; // 12번 슬롯 제외
                  const slotNumber = slotOrder[index];
                  const slotId = `slot-${slotNumber}`;
                  
                  // 해당 향료의 상세 정보 찾기
                  const ingredientInfo = ingredients.find(ing => ing.name === userNote.name);
                  if (ingredientInfo) {
                    const ingredientToAdd = {
                      id: userNote.name,
                      name: ingredientInfo.koreanName, // 한국어 이름 사용
                      color: ingredientInfo.color,
                      category: ingredientInfo.category
                    };
                    
                    console.log(`Adding ${userNote.name} (${ingredientInfo.koreanName}) to slot ${slotNumber}`);
                    addIngredientToSlot(slotId, ingredientToAdd);
                  }
                }
              });
              
              // 마지막 슬롯(12번)에 히노키 추가
              const hinokiIngredient = {
                id: 'hinoki',
                name: '히노키', // 한국어 이름
                color: '#22c55e', // 초록색
                category: '우디'
              };
              
              console.log('Adding 히노키 to slot 12');
              addIngredientToSlot('slot-12', hinokiIngredient);
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    loadNotesAndUserInventory();
  }, [addIngredientToSlot, clearAllIngredients]);

  // 검색 및 필터링
  useEffect(() => {
    let filtered = [...availableIngredients];

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ingredient => 
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.koreanName.toLowerCase().includes(query)
      );
    }

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ingredient => ingredient.category === selectedCategory);
    }

    // 인기 향료만 표시
    if (showOnlyPopular) {
      filtered = filtered.filter(ingredient => ingredient.isPopular);
    }

    // 이미 사용 중인 향료 제외
    filtered = filtered.filter(ingredient => 
      !deviceIngredients.some(slot => slot.name === ingredient.koreanName && !slot.isEmpty)
    );

    setFilteredIngredients(filtered);
  }, [searchQuery, selectedCategory, showOnlyPopular, availableIngredients, deviceIngredients]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [showIngredientSettings, setShowIngredientSettings] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    actions: ModalAction[];
    icon?: React.ReactNode;
  }>({ title: '', message: '', actions: [] });
  
  // 애니메이션 상태
  const centerAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const swirleAnimation = useRef(new Animated.Value(0)).current;
  const [centerColors, setCenterColors] = useState<string[]>(['#171717']);

  // 중앙부 색상 업데이트 및 애니메이션
  const updateCenterColors = () => {
    const activeIngredients = deviceIngredients.filter(ing => !ing.isEmpty);
    if (activeIngredients.length === 0) {
      setCenterColors(['#171717']);
    } else {
      // 향료 색상들을 배열에 추가
      const ingredientColors = activeIngredients.map(ing => ing.color);
      setCenterColors(['#171717', ...ingredientColors]);
    }
  };

  // 색상 유효성 검사 및 투명도 추가
  const addOpacityToColor = (color: string, opacity: string) => {
    if (!color || typeof color !== 'string') {
      return '#171717';
    }
    // #으로 시작하는 hex 색상인지 확인
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      return `${color}${opacity}`;
    }
    return '#171717';
  };

  // 중앙부 배경색 계산
  const getCenterBackgroundColor = () => {
    const activeIngredients = deviceIngredients.filter(ing => !ing.isEmpty);
    if (activeIngredients.length === 0) {
      return '#171717';
    }
    // 첫 번째 향료 색상을 더 진하게 적용
    return addOpacityToColor(activeIngredients[0].color, '80'); // 50% 불투명도
  };

  const triggerColorMixAnimation = () => {
    // 펄스 애니메이션
    Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.15,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 소용돌이 애니메이션
    swirleAnimation.setValue(0);
    Animated.timing(swirleAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  // 지속적인 소용돌이 애니메이션 시작
  const startContinuousSwirl = () => {
    const activeIngredients = deviceIngredients.filter(ing => !ing.isEmpty);
    if (activeIngredients.length > 0) {
      swirleAnimation.setValue(0);
      Animated.loop(
        Animated.timing(swirleAnimation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      ).start();
    }
  };

  // ingredients 변경 감지 (초기 로드 제외)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    updateCenterColors();
    if (!isInitialLoad) {
      triggerColorMixAnimation();
      startContinuousSwirl();
    } else {
      setIsInitialLoad(false);
      // 초기 로드 후에도 향료가 있으면 소용돌이 시작
      const activeIngredients = deviceIngredients.filter(ing => !ing.isEmpty);
      if (activeIngredients.length > 0) {
        startContinuousSwirl();
      }
    }
  }, [deviceIngredients, isInitialLoad]);

  // updateIngredientAmount는 store에서 가져옴

  const handleClearAll = () => {
    setModalConfig({
      title: '전체 비우기',
      message: '모든 원료를 제거하시겠습니까?',
      icon: <Trash2 size={32} color="#ef4444" />,
      actions: [
        { text: '취소', style: 'cancel', onPress: () => {} },
        { 
          text: '비우기', 
          style: 'destructive',
          onPress: () => {
            clearAllIngredients();
            setModalConfig({
              title: '완료',
              message: '모든 원료가 제거되었습니다.',
              icon: <CheckCircle size={32} color="#22c55e" />,
              actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
            });
            setModalVisible(true);
          }
        }
      ]
    });
    setModalVisible(true);
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoadingNotes(true);
      
      // 1. 현재 DB에서 사용자 보유 향료 조회
      const currentUserNotesResponse = await noteService.getUserNotes('json');
      if (!currentUserNotesResponse.success) {
        throw new Error('Failed to fetch current user notes');
      }
      
      const currentDbNotes = currentUserNotesResponse.data || [];
      const currentDbNoteNames = currentDbNotes.map(note => note.name);
      
      // 2. 현재 슬롯에 있는 향료들 (빈 슬롯 제외)
      const currentSlotNotes = deviceIngredients
        .filter(slot => !slot.isEmpty && slot.name)
        .map(slot => {
          // 한국어 이름을 영어 이름으로 변환
          const ingredient = availableIngredients.find(ing => ing.koreanName === slot.name);
          return ingredient ? ingredient.name : null;
        })
        .filter(name => name !== null);
      
      console.log('Current DB notes:', currentDbNoteNames);
      console.log('Current slot notes:', currentSlotNotes);
      
      // 3. 추가할 향료들 (슬롯에는 있지만 DB에는 없는 것들)
      const notesToAdd = currentSlotNotes.filter(noteName => !currentDbNoteNames.includes(noteName));
      
      // 4. 삭제할 향료들 (DB에는 있지만 슬롯에는 없는 것들)
      const notesToRemove = currentDbNoteNames.filter(noteName => !currentSlotNotes.includes(noteName));
      
      console.log('Notes to add:', notesToAdd);
      console.log('Notes to remove:', notesToRemove);
      
      // 5. 추가 작업 수행
      const addPromises = notesToAdd.map(noteName => 
        noteService.addUserNote('json', noteName)
      );
      
      // 6. 삭제 작업 수행
      const removePromises = notesToRemove.map(noteName => 
        noteService.removeUserNote('json', noteName)
      );
      
      // 7. 모든 작업 병렬 실행
      const allPromises = [...addPromises, ...removePromises];
      const results = await Promise.allSettled(allPromises);
      
      // 8. 결과 확인
      const failedOperations = results.filter(result => result.status === 'rejected');
      
      if (failedOperations.length > 0) {
        console.error('Some operations failed:', failedOperations);
        setModalConfig({
          title: '저장 오류',
          message: `일부 향료 설정 저장에 실패했습니다. (${failedOperations.length}개 실패)`,
          icon: <AlertTriangle size={32} color="#ef4444" />,
          actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
        });
      } else {
        setModalConfig({
          title: '설정 저장 완료',
          message: `원료 설정이 저장되었습니다.\n추가: ${notesToAdd.length}개, 제거: ${notesToRemove.length}개`,
          icon: <Save size={32} color="#22c55e" />,
          actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
        });
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setModalConfig({
        title: '저장 실패',
        message: '원료 설정 저장 중 오류가 발생했습니다.',
        icon: <AlertTriangle size={32} color="#ef4444" />,
        actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
      });
    } finally {
      setIsLoadingNotes(false);
      setModalVisible(true);
    }
  };

  const getAmountStatus = (amount: number, maxAmount: number) => {
    const percentage = (amount / maxAmount) * 100;
    if (percentage > 70) return { status: '충분', color: '#22c55e' };
    if (percentage > 30) return { status: '보통', color: '#f59e0b' };
    return { status: '부족', color: '#ef4444' };
  };

  const handleAddIngredientToSlot = (slotId: string, ingredient: AvailableIngredient) => {
    // AvailableIngredient를 기존 형태로 변환
    const ingredientToAdd = {
      id: ingredient.id,
      name: ingredient.koreanName, // 한국어 이름 사용
      color: ingredient.color,
      category: ingredient.category
    };
    addIngredientToSlot(slotId, ingredientToAdd);
    setShowIngredientSelector(false);
    setSelectedSlot(null);
  };

  // 인기 향료 빠른 추가 함수
  const handleQuickAddPopularNote = (slotId: string, popularNote: typeof POPULAR_NOTES[0]) => {
    const ingredient = availableIngredients.find(ing => ing.name === popularNote.name);
    if (ingredient) {
      handleAddIngredientToSlot(slotId, ingredient);
    }
  };

  // 필터 초기화
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowOnlyPopular(false);
  };

  const handleRemoveIngredientFromSlot = (slotId: string) => {
    removeIngredientFromSlot(slotId);
    setSelectedSlot(null);
  };

  const getSlotPosition = (slot: number) => {
    // 10개 슬롯을 10등분으로 균등 배치 (36도씩)
    // 1번 슬롯이 144도 위치에 오도록 시작점 설정 (180 - 36도)
    const slotOrder = [1, 2, 4, 5, 6, 7, 8, 10, 11, 12]; // 현재 존재하는 10개 슬롯
    const slotToAngleMap: { [key: number]: number } = {};
    
    slotOrder.forEach((slotNum, index) => {
      // 1번이 144도 위치에 오도록 하고, 반시계방향으로 36도씩 배치
      slotToAngleMap[slotNum] = 144 - (index * 36);
    });
    
    const angle = (slotToAngleMap[slot] || 0) * (Math.PI / 180);
    const radius = (CONTAINER_SIZE - SLOT_SIZE) / 2 - 30; // 반지름을 조금 줄여서 프레임 안쪽으로 배치
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      left: CONTAINER_SIZE / 2 + x - SLOT_SIZE / 2,
      top: CONTAINER_SIZE / 2 + y - SLOT_SIZE / 2,
    };
  };

  // const selectedIngredient = selectedSlot ? ingredients.find(ing => ing.id === selectedSlot) : null;

  // 파이차트 원형 슬롯 컴포넌트
  const PieChartSlot = ({ 
    size, 
    color, 
    amount, 
    maxAmount, 
    isEmpty,
    isSelected,
    slotId 
  }: { 
    size: number, 
    color: string, 
    amount: number, 
    maxAmount: number,
    isEmpty: boolean,
    isSelected: boolean,
    slotId: string
  }) => {
    const radius = size * 0.4;
    const strokeWidth = size * 0.1;
    const center = size / 2;
    
    // 비율 계산 (0-1 사이)
    const percentage = isEmpty ? 0 : amount / maxAmount;
    
    // 파이차트 경로 계산
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - percentage);
    
    const gradientId = `pieGradient-${slotId}`;
    
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </SvgLinearGradient>
        </Defs>
        
        {/* 배경 원 */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        
        {/* 진행률 원 (파이차트) */}
        {!isEmpty && percentage > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`} // -90도 회전으로 12시 방향부터 시작
          />
        )}
        
        
        {/* 중앙 원 */}
        <Circle
          cx={center}
          cy={center}
          r={radius - strokeWidth/2 - 2}
          fill="#ffffff"
          stroke={isEmpty ? "#e5e7eb" : color}
          strokeWidth="2"
        />
      </Svg>
    );
  };

  const selectedIngredient = selectedSlot ? deviceIngredients.find(ing => ing.id === selectedSlot) : null;

  // 6각형 좌표 계산 (슬롯들이 완전히 들어갈 수 있도록 훨씬 크게)
  const getHexagonPoints = (size: number) => {
    const points = [];
    const hexRadius = size/2 - 2; // 거의 최대 크기로 설정
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 90) * (Math.PI / 180); // -90도로 시작해서 위쪽 꼭짓점이 맨 위
      const x = size/2 + hexRadius * Math.cos(angle);
      const y = size/2 + hexRadius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.subtitle}>Moodrop Station의 원료를 관리하세요</Text>
        <Text style={styles.guideText}>빈 공간을 터치하여 향료를 추가하거나, 기존 향료를 터치하여 수량을 조절하세요</Text>
        
        {/* 6각형 기기 시각화 */}
        <View style={styles.deviceContainer}>
          <View style={[styles.deviceHexagon, { width: CONTAINER_SIZE, height: CONTAINER_SIZE }]}>
            {/* 6각형 배경 */}
            <Svg 
              width={CONTAINER_SIZE} 
              height={CONTAINER_SIZE} 
              style={styles.hexagonSvg}
            >
              <Polygon
                points={getHexagonPoints(CONTAINER_SIZE)}
                fill="#fafafa"
                stroke="#e5e7eb"
                strokeWidth="4"
              />
            </Svg>
            
            {/* 중앙부 - 애니메이션 효과가 있는 Moodrop Station */}
            <View style={[styles.centerContainer, { 
              width: CENTER_SIZE, 
              height: CENTER_SIZE,
              left: (CONTAINER_SIZE - CENTER_SIZE) / 2,
              top: (CONTAINER_SIZE - CENTER_SIZE) / 2,
            }]}>
              <Animated.View style={[
                styles.centerCircle,
                {
                  transform: [{ scale: pulseAnimation }],
                }
              ]}>
                {centerColors && centerColors.length > 1 ? (
                  // 향료가 있을 때: 그라데이션과 소용돌이 효과
                  <>
                    <LinearGradient
                      colors={[
                        centerColors[0] || '#171717',
                        centerColors[1] || '#171717',
                        centerColors[centerColors.length - 1] || centerColors[1] || '#171717'
                      ]}
                      style={styles.centerGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    
                    {/* 소용돌이 레이어들 */}
                    {Array.isArray(centerColors) && centerColors.slice(1).map((color, index) => (
                      <Animated.View
                        key={`swirl-layer-${index}`}
                        style={[
                          styles.swirlLayer,
                          {
                            transform: [
                              {
                                rotate: swirleAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [`${index * 60}deg`, `${(index * 60) + 360}deg`],
                                }),
                              },
                              { scale: 1 + (index * 0.1) }
                            ],
                          }
                        ]}
                      >
                        <LinearGradient
                          colors={[
                            addOpacityToColor(color, '80'),
                            addOpacityToColor(color, '40'),
                            'transparent',
                            addOpacityToColor(color, '60')
                          ]}
                          style={styles.swirlGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                      </Animated.View>
                    ))}
                  </>
                ) : (
                  // 향료가 없을 때: 기본 검은색
                  <View style={[styles.centerGradient, { backgroundColor: '#171717' }]} />
                )}
                
                <View style={styles.centerTextContainer}>
                  <Text style={styles.centerText}>Moodrop</Text>
                  <Text style={styles.centerSubText}>Station</Text>
                </View>
              </Animated.View>
            </View>
            
            {/* 10개 파이차트 슬롯 */}
            {deviceIngredients.map((ingredient) => {
              const position = getSlotPosition(ingredient.slot);
              
              return (
                <View
                  key={ingredient.id}
                  style={[
                    styles.ingredientSlotContainer,
                    {
                      left: position.left,
                      top: position.top,
                      width: SLOT_SIZE,
                      height: SLOT_SIZE,
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.pieChartWrapper}
                    onPress={() => {
                      if (ingredient.isEmpty) {
                        // 빈 공간을 클릭하면 바로 향료 추가 모달 열기
                        setSelectedSlot(ingredient.id);
                        setShowIngredientSelector(true);
                      } else {
                        // 향료가 있으면 원료 설정 모달 열기
                        setSelectedSlot(ingredient.id);
                        setShowIngredientSettings(true);
                      }
                    }}
                  >
                    <PieChartSlot
                      size={SLOT_SIZE}
                      color={ingredient.isEmpty ? '#e5e7eb' : ingredient.color}
                      amount={ingredient.amount}
                      maxAmount={ingredient.maxAmount}
                      isEmpty={ingredient.isEmpty || false}
                      isSelected={false}
                      slotId={ingredient.id}
                    />
                    
                    {/* 슬롯 정보 중앙 표시 */}
                    <View style={styles.slotCenterInfo}>
                      {ingredient.isEmpty ? (
                        null
                      ) : (
                        <Text style={styles.slotName}>{ingredient.name}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>


        {/* 전체 관리 버튼들 */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Trash2 size={20} color="#ffffff" />
            <Text style={styles.clearButtonText}>전체 비우기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>설정 저장</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <FlaskConical size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              원료를 터치하여 개별 조정하거나, 전체 보충으로 모든 원료를 최대치로 채울 수 있습니다.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 향료 선택 모달 */}
      <Modal
        visible={showIngredientSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIngredientSelector(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>향료 선택</Text>
            <TouchableOpacity onPress={() => setShowIngredientSelector(false)}>
              <X size={24} color="#737373" />
            </TouchableOpacity>
          </View>
          
          {isLoadingNotes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e40af" />
              <Text style={styles.loadingText}>향료 정보를 불러오는 중...</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalContent}>
              {/* 인기 향료 빠른 추가 섹션 */}
              <View style={styles.popularSection}>
                <View style={styles.popularHeader}>
                  <Star size={16} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.popularTitle}>인기 향료</Text>
                  <Text style={styles.popularSubtitle}>빠른 추가</Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularScrollContent}
                >
                  {/* 에탄올 추가 */}
                  {(() => {
                    const ethanolIngredient = availableIngredients.find(ing => ing.id === 'ethanol');
                    if (ethanolIngredient && !deviceIngredients.some(slot => slot.name === ethanolIngredient.koreanName && !slot.isEmpty)) {
                      return (
                        <TouchableOpacity
                          key="ethanol"
                          style={[styles.popularCard, styles.baseIngredientCard, { borderColor: ethanolIngredient.color }]}
                          onPress={() => selectedSlot && handleAddIngredientToSlot(selectedSlot, ethanolIngredient)}
                        >
                          <View style={[styles.popularDot, { backgroundColor: ethanolIngredient.color }]} />
                          <Text style={styles.popularName}>{ethanolIngredient.koreanName}</Text>
                          <Text style={styles.popularCount}>베이스</Text>
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  })()}
                  
                  {POPULAR_NOTES.slice(0, 15).map(popularNote => {
                    const ingredient = availableIngredients.find(ing => ing.name === popularNote.name);
                    if (!ingredient || deviceIngredients.some(slot => slot.name === ingredient.koreanName && !slot.isEmpty)) {
                      return null;
                    }
                    
                    return (
                      <TouchableOpacity
                        key={popularNote.name}
                        style={[styles.popularCard, { borderColor: ingredient.color }]}
                        onPress={() => selectedSlot && handleQuickAddPopularNote(selectedSlot, popularNote)}
                      >
                        <View style={[styles.popularDot, { backgroundColor: ingredient.color }]} />
                        <Text style={styles.popularName}>{ingredient.koreanName}</Text>
                        <Text style={styles.popularCount}>{popularNote.count}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 검색 및 필터 섹션 */}
              <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                  <Search size={20} color="#737373" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="향료 이름으로 검색..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9ca3af"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X size={16} color="#737373" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 필터 버튼들 */}
                <View style={styles.filtersContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filterChips}>
                      <TouchableOpacity
                        style={[styles.filterChip, showOnlyPopular && styles.filterChipActive]}
                        onPress={() => setShowOnlyPopular(!showOnlyPopular)}
                      >
                        <Star size={12} color={showOnlyPopular ? "#ffffff" : "#f59e0b"} fill={showOnlyPopular ? "#ffffff" : "#f59e0b"} />
                        <Text style={[styles.filterChipText, showOnlyPopular && styles.filterChipTextActive]}>인기</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.filterChip, selectedCategory !== 'all' && styles.filterChipActive]}
                        onPress={() => setShowCategoryFilter(true)}
                      >
                        <Filter size={12} color={selectedCategory !== 'all' ? "#ffffff" : "#525252"} />
                        <Text style={[styles.filterChipText, selectedCategory !== 'all' && styles.filterChipTextActive]}>
                          {selectedCategory === 'all' ? '카테고리' : selectedCategory}
                        </Text>
                      </TouchableOpacity>

                      {(searchQuery || selectedCategory !== 'all' || showOnlyPopular) && (
                        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                          <X size={12} color="#ef4444" />
                          <Text style={styles.clearFiltersText}>초기화</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* 통합 향료 목록 */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  모든 향료 ({filteredIngredients.length})
                </Text>
                <View style={styles.ingredientGrid}>
                  {filteredIngredients.map(ingredient => (
                    <TouchableOpacity
                      key={ingredient.id}
                      style={[
                        styles.ingredientCard, 
                        { borderColor: ingredient.color },
                        ingredient.category === '베이스' && styles.baseIngredientCard
                      ]}
                      onPress={() => selectedSlot && handleAddIngredientToSlot(selectedSlot, ingredient)}
                    >
                      <View style={[styles.ingredientDot, { backgroundColor: ingredient.color }]} />
                      <View style={styles.ingredientInfo}>
                        <Text style={[
                          styles.ingredientName,
                          ingredient.category === '베이스' && styles.baseIngredientName
                        ]}>
                          {ingredient.koreanName}
                        </Text>
                        <Text style={styles.ingredientSubName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
                      </View>
                      <View style={styles.ingredientMeta}>
                        {ingredient.isPopular && (
                          <Star size={10} color="#f59e0b" fill="#f59e0b" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {filteredIngredients.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
                  <Text style={styles.noResultsSubText}>다른 검색어를 시도해보세요</Text>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* 원료 설정 모달 */}
      <Modal
        visible={showIngredientSettings}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowIngredientSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowIngredientSettings(false)}
          />
          
          {selectedIngredient && !selectedIngredient.isEmpty && (
            <View style={styles.ingredientSettingsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>원료 설정</Text>
                <TouchableOpacity onPress={() => setShowIngredientSettings(false)}>
                  <X size={24} color="#737373" />
                </TouchableOpacity>
              </View>

              <View style={styles.selectedHeader}>
                <View style={styles.selectedInfo}>
                  <View style={[styles.selectedDot, { backgroundColor: selectedIngredient.color }]} />
                  <Text style={styles.selectedName}>{selectedIngredient.name}</Text>
                </View>
              </View>

              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>
                  {selectedIngredient.amount}ml / {selectedIngredient.maxAmount}ml
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${(selectedIngredient.amount / selectedIngredient.maxAmount) * 100}%`, 
                        backgroundColor: getAmountStatus(selectedIngredient.amount, selectedIngredient.maxAmount).color 
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={() => updateIngredientAmount(selectedIngredient.id, selectedIngredient.amount - 1)}
                >
                  <Minus size={20} color="#737373" />
                </TouchableOpacity>
                
                <View style={styles.controlDisplay}>
                  <Text style={styles.controlAmount}>{selectedIngredient.amount}</Text>
                  <Text style={styles.controlUnit}>ml</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={() => updateIngredientAmount(selectedIngredient.id, selectedIngredient.amount + 1)}
                >
                  <Plus size={20} color="#737373" />
                </TouchableOpacity>
              </View>

              <View style={styles.removeSection}>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => {
                    handleRemoveIngredientFromSlot(selectedIngredient.id);
                    setShowIngredientSettings(false);
                  }}
                >
                  <X size={16} color="#ef4444" />
                  <Text style={styles.removeButtonText}>제거</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* 카테고리 필터 모달 */}
      <Modal
        visible={showCategoryFilter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryFilter(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>카테고리 선택</Text>
            <TouchableOpacity onPress={() => setShowCategoryFilter(false)}>
              <X size={24} color="#737373" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.categoryFilterSection}>
              {/* 전체 옵션 */}
              <TouchableOpacity
                style={[
                  styles.categoryFilterItem,
                  selectedCategory === 'all' && styles.categoryFilterItemActive
                ]}
                onPress={() => {
                  setSelectedCategory('all');
                  setShowCategoryFilter(false);
                }}
              >
                <View style={styles.categoryFilterInfo}>
                  <Text style={[
                    styles.categoryFilterName,
                    selectedCategory === 'all' && styles.categoryFilterNameActive
                  ]}>
                    전체 카테고리
                  </Text>
                  <Text style={styles.categoryFilterDescription}>모든 향료 표시</Text>
                </View>
                {selectedCategory === 'all' && (
                  <View style={styles.categoryFilterCheck}>
                    <Text style={styles.categoryFilterCheckMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 베이스 카테고리 */}
              {(() => {
                const baseIngredients = availableIngredients.filter(ingredient => ingredient.category === '베이스');
                if (baseIngredients.length === 0) return null;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryFilterItem,
                      selectedCategory === '베이스' && styles.categoryFilterItemActive
                    ]}
                    onPress={() => {
                      setSelectedCategory('베이스');
                      setShowCategoryFilter(false);
                    }}
                  >
                    <View style={styles.categoryFilterInfo}>
                      <Text style={[
                        styles.categoryFilterName,
                        selectedCategory === '베이스' && styles.categoryFilterNameActive
                      ]}>
                        베이스
                      </Text>
                      <Text style={styles.categoryFilterDescription}>
                        에탄올 등 기본 용매 ({baseIngredients.length}개)
                      </Text>
                    </View>
                    {selectedCategory === '베이스' && (
                      <View style={styles.categoryFilterCheck}>
                        <Text style={styles.categoryFilterCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })()}

              {/* NOTE_CATEGORIES */}
              {NOTE_CATEGORIES.map(category => {
                const categoryIngredients = availableIngredients.filter(ingredient => ingredient.category === category.name);
                
                // 향료가 없는 카테고리는 제외
                if (categoryIngredients.length === 0) return null;
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryFilterItem,
                      selectedCategory === category.name && styles.categoryFilterItemActive
                    ]}
                    onPress={() => {
                      setSelectedCategory(category.name);
                      setShowCategoryFilter(false);
                    }}
                  >
                    <View style={styles.categoryFilterInfo}>
                      <Text style={[
                        styles.categoryFilterName,
                        selectedCategory === category.name && styles.categoryFilterNameActive
                      ]}>
                        {category.name}
                      </Text>
                      <Text style={styles.categoryFilterDescription}>
                        {category.description} ({categoryIngredients.length}개)
                      </Text>
                    </View>
                    {selectedCategory === category.name && (
                      <View style={styles.categoryFilterCheck}>
                        <Text style={styles.categoryFilterCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* 기타 카테고리 */}
              {(() => {
                const otherIngredients = availableIngredients.filter(ingredient => ingredient.category === '기타');
                if (otherIngredients.length === 0) return null;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryFilterItem,
                      selectedCategory === '기타' && styles.categoryFilterItemActive
                    ]}
                    onPress={() => {
                      setSelectedCategory('기타');
                      setShowCategoryFilter(false);
                    }}
                  >
                    <View style={styles.categoryFilterInfo}>
                      <Text style={[
                        styles.categoryFilterName,
                        selectedCategory === '기타' && styles.categoryFilterNameActive
                      ]}>
                        기타
                      </Text>
                      <Text style={styles.categoryFilterDescription}>
                        분류되지 않은 향료 ({otherIngredients.length}개)
                      </Text>
                    </View>
                    {selectedCategory === '기타' && (
                      <View style={styles.categoryFilterCheck}>
                        <Text style={styles.categoryFilterCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })()}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
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
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 20, // 탭바와의 적절한 여백
  },
  subtitle: {
    fontSize: 16,
    color: '#525252',
    textAlign: 'center',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  deviceContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  deviceHexagon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagonSvg: {
    position: 'absolute',
  },
  centerContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  centerGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  swirlLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  swirlGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  centerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerSubText: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ingredientSlotContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotCenterInfo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
    height: '60%',
    pointerEvents: 'none', // 터치 이벤트 통과
  },
  slotName: {
    fontSize: 12,
    color: '#171717',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 1,
  },
  slotAmount: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ingredientSettingsModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 32,
    minWidth: 320,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
  },
  closeButton: {
    padding: 4,
  },
  amountSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 16,
    color: '#525252',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  controlDisplay: {
    alignItems: 'center',
  },
  controlAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171717',
  },
  controlUnit: {
    fontSize: 14,
    color: '#737373',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    alignItems: 'stretch',
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 24,
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
  emptySlotActions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  addIngredientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addIngredientButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  removeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#525252',
    marginTop: 16,
  },
  popularSection: {
    marginBottom: 24,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
  },
  popularSubtitle: {
    fontSize: 12,
    color: '#737373',
    marginLeft: 'auto',
  },
  popularScrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  popularCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  popularDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  popularName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#171717',
    textAlign: 'center',
    marginBottom: 2,
  },
  popularCount: {
    fontSize: 9,
    color: '#737373',
    textAlign: 'center',
  },
  searchSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#171717',
    marginLeft: 12,
    marginRight: 8,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#525252',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  ingredientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: '45%',
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ingredientDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    flexShrink: 0,
  },
  ingredientInfo: {
    flex: 1,
    marginRight: 8,
  },
  ingredientName: {
    fontSize: 13,
    color: '#171717',
    fontWeight: '600',
    marginBottom: 2,
  },
  ingredientSubName: {
    fontSize: 10,
    color: '#737373',
    fontStyle: 'italic',
  },
  ingredientCategory: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 1,
  },
  ingredientMeta: {
    alignItems: 'center',
    gap: 2,
  },
  ingredientType: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 4,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  // 베이스 재료 (에탄올) 전용 스타일
  baseIngredientCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  baseIngredientName: {
    color: '#1e40af',
    fontWeight: '600',
  },
  baseIngredientLabel: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  // 카테고리 필터 모달 스타일
  categoryFilterSection: {
    paddingBottom: 20,
  },
  categoryFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryFilterItemActive: {
    backgroundColor: '#eff6ff',
  },
  categoryFilterInfo: {
    flex: 1,
  },
  categoryFilterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  categoryFilterNameActive: {
    color: '#1e40af',
  },
  categoryFilterDescription: {
    fontSize: 14,
    color: '#737373',
  },
  categoryFilterCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilterCheckMark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});