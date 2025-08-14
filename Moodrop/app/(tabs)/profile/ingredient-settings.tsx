import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlaskConical, Plus, Minus, RefreshCw, Save, X, Trash2, AlertTriangle, CheckCircle } from 'lucide-react-native';
import Svg, { Polygon, Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import CustomModal, { ModalAction } from '@/components/CustomModal';

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
  color: string;
  category: string;
}

export default function IngredientSettingsScreen() {
  // 사용 가능한 향료 라이브러리 (에탄올 포함)
  const [availableIngredients] = useState<AvailableIngredient[]>([
    // 향료들
    { id: 'rose', name: '장미', color: '#d97066', category: '플로럴' },
    { id: 'jasmine', name: '자스민', color: '#8b5cf6', category: '플로럴' },
    { id: 'lavender', name: '라벤더', color: '#ec4899', category: '플로럴' },
    { id: 'vanilla', name: '바닐라', color: '#f59e0b', category: '오리엔탈' },
    { id: 'musk', name: '머스크', color: '#6b7280', category: '오리엔탈' },
    { id: 'citrus', name: '시트러스', color: '#f97316', category: '프레시' },
    { id: 'sandalwood', name: '샌달우드', color: '#8b6f47', category: '우디' },
    { id: 'patchouli', name: '패촐리', color: '#7c2d12', category: '우디' },
    { id: 'bergamot', name: '베르가못', color: '#10b981', category: '프레시' },
    { id: 'cedarwood', name: '시더우드', color: '#92400e', category: '우디' },
    { id: 'ylang', name: '일랑일랑', color: '#fbbf24', category: '플로럴' },
    { id: 'amber', name: '앰버', color: '#d97706', category: '오리엔탈' },
    { id: 'lemon', name: '레몬', color: '#eab308', category: '프레시' },
    { id: 'neroli', name: '네롤리', color: '#06b6d4', category: '플로럴' },
    { id: 'oakmoss', name: '오크모스', color: '#059669', category: '우디' },
    
    // 베이스 솔루션
    { id: 'ethanol', name: '에탄올', color: '#3b82f6', category: '베이스' },
  ]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '장미', slot: 1, amount: 25, maxAmount: 30, color: '#d97066' },
    { id: '2', name: '자스민', slot: 2, amount: 22, maxAmount: 30, color: '#8b5cf6' },
    { id: '4', name: '라벤더', slot: 4, amount: 27, maxAmount: 30, color: '#ec4899' },
    { id: '5', name: '바닐라', slot: 5, amount: 23, maxAmount: 30, color: '#f59e0b' },
    { id: '6', name: '머스크', slot: 6, amount: 18, maxAmount: 30, color: '#6b7280' },
    { id: '7', name: '', slot: 7, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: '8', name: '', slot: 8, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: '10', name: '', slot: 10, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: '11', name: '', slot: 11, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
    { id: '12', name: '', slot: 12, amount: 0, maxAmount: 30, color: '#e5e7eb', isEmpty: true },
  ]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [showIngredientSettings, setShowIngredientSettings] = useState(false);
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
    const activeIngredients = ingredients.filter(ing => !ing.isEmpty);
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
    const activeIngredients = ingredients.filter(ing => !ing.isEmpty);
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
    const activeIngredients = ingredients.filter(ing => !ing.isEmpty);
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
      const activeIngredients = ingredients.filter(ing => !ing.isEmpty);
      if (activeIngredients.length > 0) {
        startContinuousSwirl();
      }
    }
  }, [ingredients, isInitialLoad]);

  const updateIngredientAmount = (id: string, newAmount: number) => {
    setIngredients(prev => 
      prev.map(ingredient => 
        ingredient.id === id 
          ? { ...ingredient, amount: Math.max(0, Math.min(newAmount, ingredient.maxAmount)) }
          : ingredient
      )
    );
  };

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
            setIngredients(prev => 
              prev.map(ingredient => ({
                ...ingredient,
                name: '',
                color: '#e5e7eb',
                isEmpty: true,
                amount: 0
              }))
            );
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

  const handleSaveSettings = () => {
    setModalConfig({
      title: '설정 저장',
      message: '원료 설정이 저장되었습니다.',
      icon: <Save size={32} color="#22c55e" />,
      actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
    });
    setModalVisible(true);
  };

  const getAmountStatus = (amount: number, maxAmount: number) => {
    const percentage = (amount / maxAmount) * 100;
    if (percentage > 70) return { status: '충분', color: '#22c55e' };
    if (percentage > 30) return { status: '보통', color: '#f59e0b' };
    return { status: '부족', color: '#ef4444' };
  };

  const addIngredientToSlot = (slotId: string, ingredient: AvailableIngredient) => {
    setIngredients(prev => 
      prev.map(slot => 
        slot.id === slotId 
          ? { 
              ...slot, 
              name: ingredient.name, 
              color: ingredient.color, 
              isEmpty: false,
              amount: 30 // 새로 추가할 때 최대치로 설정
            }
          : slot
      )
    );
    setShowIngredientSelector(false);
    setSelectedSlot(null);
  };

  const removeIngredientFromSlot = (slotId: string) => {
    setIngredients(prev => 
      prev.map(slot => 
        slot.id === slotId 
          ? { 
              ...slot, 
              name: '', 
              color: '#e5e7eb', 
              isEmpty: true,
              amount: 0
            }
          : slot
      )
    );
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

  const selectedIngredient = selectedSlot ? ingredients.find(ing => ing.id === selectedSlot) : null;

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
            {ingredients.map((ingredient) => {
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
          
          <ScrollView style={styles.modalContent}>
            {['베이스', '플로럴', '우디', '프레시', '오리엔탈'].map(category => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.ingredientGrid}>
                  {availableIngredients
                    .filter(ingredient => ingredient.category === category)
                    .filter(ingredient => !ingredients.some(slot => slot.name === ingredient.name && !slot.isEmpty))
                    .map(ingredient => (
                      <TouchableOpacity
                        key={ingredient.id}
                        style={[
                          styles.ingredientCard, 
                          { borderColor: ingredient.color },
                          // 에탄올은 베이스 재료로 시각적 구분
                          ingredient.category === '베이스' && styles.baseIngredientCard
                        ]}
                        onPress={() => selectedSlot && addIngredientToSlot(selectedSlot, ingredient)}
                      >
                        <View style={[styles.ingredientDot, { backgroundColor: ingredient.color }]} />
                        <Text style={[
                          styles.ingredientName,
                          ingredient.category === '베이스' && styles.baseIngredientName
                        ]}>
                          {ingredient.name}
                        </Text>
                        {ingredient.category === '베이스' && (
                          <Text style={styles.baseIngredientLabel}>베이스</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            ))}
          </ScrollView>
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
                    removeIngredientFromSlot(selectedIngredient.id);
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: '45%',
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
  },
  ingredientName: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '500',
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
});