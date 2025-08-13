import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlaskConical, Plus, Minus, RefreshCw, Save, X } from 'lucide-react-native';
import Svg, { Polygon, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(width, 400); // 더 큰 컨테이너 크기
const CENTER_SIZE = CONTAINER_SIZE * 0.3; // 중앙부 비율 조정
const SLOT_SIZE = CONTAINER_SIZE * 0.18; // 더 큰 슬롯 크기

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

  const updateIngredientAmount = (id: string, newAmount: number) => {
    setIngredients(prev => 
      prev.map(ingredient => 
        ingredient.id === id 
          ? { ...ingredient, amount: Math.max(0, Math.min(newAmount, ingredient.maxAmount)) }
          : ingredient
      )
    );
  };

  const handleRefillAll = () => {
    Alert.alert(
      '전체 보충',
      '모든 원료를 최대량으로 보충하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '보충', 
          onPress: () => {
            setIngredients(prev => 
              prev.map(ingredient => 
                ingredient.isEmpty 
                  ? ingredient 
                  : { ...ingredient, amount: ingredient.maxAmount }
              )
            );
            Alert.alert('완료', '모든 원료가 보충되었습니다.');
          }
        }
      ]
    );
  };

  const handleSaveSettings = () => {
    Alert.alert('설정 저장', '원료 설정이 저장되었습니다.');
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
    // 12등분 원에서 3번, 9번 제외
    // 6시 방향을 정면(0도)으로, 8번 슬롯 위치가 1번이 되도록 설정
    // 8번 슬롯은 6시에서 반시계로 2칸 = 6시에서 60도 반시계 방향
    const slotToAngleMap: { [key: number]: number } = {
      1: 150,  // 11시 방향 (시계방향 90도 회전)
      2: 120,  // 10시 방향 (시계방향 90도 회전)
      4: 60,   // 8시 방향 (시계방향 90도 회전)
      5: 30,   // 7시 방향 (시계방향 90도 회전)
      6: 0,    // 6시 방향 (시계방향 90도 회전)
      7: -30,  // 5시 방향 (시계방향 90도 회전)
      8: -60,  // 4시 방향 (시계방향 90도 회전)
      10: -120, // 2시 방향 (시계방향 90도 회전)
      11: -150, // 1시 방향 (시계방향 90도 회전)
      12: 180, // 12시 방향 (시계방향 90도 회전)
    };
    
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
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </LinearGradient>
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
            
            {/* 중앙부 */}
            <View style={[styles.centerCircle, { 
              width: CENTER_SIZE, 
              height: CENTER_SIZE,
              left: (CONTAINER_SIZE - CENTER_SIZE) / 2,
              top: (CONTAINER_SIZE - CENTER_SIZE) / 2,
            }]}>
              {selectedIngredient ? (
                /* 선택된 슬롯 표시 */
                <View style={styles.selectedSlotCenter}>
                  <PieChartSlot
                    size={CENTER_SIZE * 0.95}
                    color={selectedIngredient.isEmpty ? '#e5e7eb' : selectedIngredient.color}
                    amount={selectedIngredient.amount}
                    maxAmount={selectedIngredient.maxAmount}
                    isEmpty={selectedIngredient.isEmpty || false}
                    isSelected={false}
                    slotId={`center-${selectedIngredient.id}`}
                  />
                  
                  {/* 중앙 슬롯 정보 및 컨트롤 */}
                  <View style={styles.centerSlotInfo}>
                    {selectedIngredient.isEmpty ? (
                      <View style={styles.centerEmptyActions}>
                        <Text style={styles.centerEmptyText}>빈 공간</Text>
                        <TouchableOpacity 
                          style={styles.centerAddButton}
                          onPress={() => setShowIngredientSelector(true)}
                        >
                          <Plus size={16} color="#ffffff" />
                          <Text style={styles.centerAddButtonText}>향료 추가</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.centerSlotName}>{selectedIngredient.name}</Text>
                        <Text style={styles.centerSlotAmount}>
                          {selectedIngredient.amount}ml / {selectedIngredient.maxAmount}ml
                        </Text>
                        
                        {/* 수량 조절 버튼 */}
                        <View style={styles.centerControls}>
                          <TouchableOpacity 
                            style={styles.centerControlButton}
                            onPress={() => updateIngredientAmount(selectedIngredient.id, selectedIngredient.amount - 1)}
                          >
                            <Minus size={14} color="#737373" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.centerControlButton}
                            onPress={() => updateIngredientAmount(selectedIngredient.id, selectedIngredient.amount + 1)}
                          >
                            <Plus size={14} color="#737373" />
                          </TouchableOpacity>
                        </View>
                        
                        {/* 제거 버튼 */}
                        <TouchableOpacity 
                          style={styles.centerRemoveButton}
                          onPress={() => removeIngredientFromSlot(selectedIngredient.id)}
                        >
                          <X size={12} color="#ef4444" />
                          <Text style={styles.centerRemoveText}>제거</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                /* 기본 Moodrop Station 표시 */
                <>
                  <Text style={styles.centerText}>Moodrop</Text>
                  <Text style={styles.centerSubText}>Station</Text>
                </>
              )}
            </View>
            
            {/* 10개 파이차트 슬롯 */}
            {ingredients.map((ingredient) => {
              const position = getSlotPosition(ingredient.slot);
              const statusInfo = getAmountStatus(ingredient.amount, ingredient.maxAmount);
              
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
                    onPress={() => setSelectedSlot(selectedSlot === ingredient.id ? null : ingredient.id)}
                  >
                    <PieChartSlot
                      size={SLOT_SIZE}
                      color={ingredient.isEmpty ? '#e5e7eb' : ingredient.color}
                      amount={ingredient.amount}
                      maxAmount={ingredient.maxAmount}
                      isEmpty={ingredient.isEmpty || false}
                      isSelected={selectedSlot === ingredient.id}
                      slotId={ingredient.id}
                    />
                    
                    {/* 슬롯 정보 중앙 표시 */}
                    <View style={styles.slotCenterInfo}>
                      <Text style={styles.slotNumber}>{ingredient.slot}</Text>
                      {ingredient.isEmpty ? (
                        <Text style={styles.emptySlotText}>빈 공간</Text>
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

        {/* 선택된 슬롯 상세 조절 */}
        {selectedIngredient && (
          <View style={styles.selectedIngredientSection}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedInfo}>
                <View style={[styles.selectedDot, { backgroundColor: selectedIngredient.color }]} />
                <View>
                  <Text style={styles.selectedName}>
                    {selectedIngredient.isEmpty ? '빈 공간' : selectedIngredient.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedSlot(null)}
              >
                <X size={20} color="#737373" />
              </TouchableOpacity>
            </View>

            {selectedIngredient.isEmpty ? (
              /* 빈 슬롯일 때 향료 추가 버튼 */
              <View style={styles.emptySlotActions}>
                <TouchableOpacity 
                  style={styles.addIngredientButton}
                  onPress={() => setShowIngredientSelector(true)}
                >
                  <Plus size={20} color="#ffffff" />
                  <Text style={styles.addIngredientButtonText}>향료 추가</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* 향료가 있을 때 조절 및 제거 */
              <>
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
                    onPress={() => removeIngredientFromSlot(selectedIngredient.id)}
                  >
                    <X size={16} color="#ef4444" />
                    <Text style={styles.removeButtonText}>제거</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* 전체 관리 버튼들 */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.refillButton} onPress={handleRefillAll}>
            <RefreshCw size={20} color="#ffffff" />
            <Text style={styles.refillButtonText}>전체 보충</Text>
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
    marginBottom: 32,
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
  centerCircle: {
    position: 'absolute',
    backgroundColor: '#171717',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerSubText: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.8,
  },
  selectedSlotCenter: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  centerSlotInfo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '70%',
    height: '70%',
  },
  centerSlotName: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  centerSlotAmount: {
    fontSize: 12,
    color: '#737373',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  centerEmptyActions: {
    alignItems: 'center',
  },
  centerEmptyText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 8,
  },
  centerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  centerAddButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  centerControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  centerControlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  centerRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  centerRemoveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '500',
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
  slotNumber: {
    fontSize: 12,
    color: '#737373',
    fontWeight: '600',
    marginBottom: 2,
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
  selectedIngredientSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 20,
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
  },
  refillButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  refillButtonText: {
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
    borderRadius: 12,
    gap: 8,
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
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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