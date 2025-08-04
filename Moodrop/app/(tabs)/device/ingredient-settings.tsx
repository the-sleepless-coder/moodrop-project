import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlaskConical, Plus, Minus, RefreshCw, Save, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(width - 48, 350);
const CENTER_SIZE = CONTAINER_SIZE * 0.3;
const SLOT_SIZE = CONTAINER_SIZE * 0.15;

interface Ingredient {
  id: string;
  name: string;
  slot: number;
  amount: number;
  maxAmount: number;
  color: string;
}

export default function IngredientSettingsScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '장미', slot: 1, amount: 25, maxAmount: 30, color: '#d97066' },
    { id: '2', name: '자스민', slot: 2, amount: 22, maxAmount: 30, color: '#8b5cf6' },
    { id: '3', name: '라벤더', slot: 3, amount: 27, maxAmount: 30, color: '#ec4899' },
    { id: '4', name: '바닐라', slot: 4, amount: 23, maxAmount: 30, color: '#f59e0b' },
    { id: '5', name: '머스크', slot: 5, amount: 18, maxAmount: 30, color: '#6b7280' },
    { id: '6', name: '시트러스', slot: 6, amount: 21, maxAmount: 30, color: '#f97316' },
    { id: '7', name: '샌달우드', slot: 7, amount: 15, maxAmount: 30, color: '#8b6f47' },
    { id: '8', name: '패촐리', slot: 8, amount: 14, maxAmount: 30, color: '#7c2d12' },
  ]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

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
              prev.map(ingredient => ({ ...ingredient, amount: ingredient.maxAmount }))
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

  const getSlotPosition = (slot: number) => {
    const angle = ((slot - 1) * 45 - 90) * (Math.PI / 180); // 8개 슬롯, 상단부터 시작
    const radius = (CONTAINER_SIZE - SLOT_SIZE) / 2 - 20;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      left: CONTAINER_SIZE / 2 + x - SLOT_SIZE / 2,
      top: CONTAINER_SIZE / 2 + y - SLOT_SIZE / 2,
    };
  };

  const selectedIngredient = selectedSlot ? ingredients.find(ing => ing.id === selectedSlot) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Moodrop Station의 8개 원료 슬롯을 관리하세요</Text>
        
        {/* 원통형 기기 시각화 */}
        <View style={styles.deviceContainer}>
          <View style={[styles.deviceCircle, { width: CONTAINER_SIZE, height: CONTAINER_SIZE }]}>
            {/* 중앙부 */}
            <View style={[styles.centerCircle, { 
              width: CENTER_SIZE, 
              height: CENTER_SIZE,
              left: (CONTAINER_SIZE - CENTER_SIZE) / 2,
              top: (CONTAINER_SIZE - CENTER_SIZE) / 2,
            }]}>
              <Text style={styles.centerText}>Moodrop</Text>
              <Text style={styles.centerSubText}>Station</Text>
            </View>
            
            {/* 8개 원료 슬롯 */}
            {ingredients.map((ingredient) => {
              const position = getSlotPosition(ingredient.slot);
              const statusInfo = getAmountStatus(ingredient.amount, ingredient.maxAmount);
              const percentage = (ingredient.amount / ingredient.maxAmount) * 100;
              
              return (
                <TouchableOpacity
                  key={ingredient.id}
                  style={[
                    styles.ingredientSlot,
                    {
                      left: position.left,
                      top: position.top,
                      width: SLOT_SIZE,
                      height: SLOT_SIZE,
                      borderColor: selectedSlot === ingredient.id ? '#171717' : ingredient.color,
                      borderWidth: selectedSlot === ingredient.id ? 3 : 2,
                    }
                  ]}
                  onPress={() => setSelectedSlot(selectedSlot === ingredient.id ? null : ingredient.id)}
                >
                  {/* 원료량 진행바 (원형) */}
                  <View style={[styles.progressRing, { borderColor: ingredient.color }]}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          backgroundColor: statusInfo.color,
                          height: `${percentage}%`,
                        }
                      ]} 
                    />
                  </View>
                  
                  <View style={styles.slotContent}>
                    <Text style={styles.slotNumber}>{ingredient.slot}</Text>
                    <Text style={styles.slotName}>{ingredient.name}</Text>
                    <Text style={[styles.slotAmount, { color: statusInfo.color }]}>
                      {ingredient.amount}ml
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 선택된 원료 상세 조절 */}
        {selectedIngredient && (
          <View style={styles.selectedIngredientSection}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedInfo}>
                <View style={[styles.selectedDot, { backgroundColor: selectedIngredient.color }]} />
                <View>
                  <Text style={styles.selectedName}>{selectedIngredient.name}</Text>
                  <Text style={styles.selectedSlot}>슬롯 {selectedIngredient.slot}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedSlot(null)}
              >
                <X size={20} color="#737373" />
              </TouchableOpacity>
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
              원료 슬롯을 터치하여 개별 조정하거나, 전체 보충으로 모든 원료를 최대치로 채울 수 있습니다.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  deviceCircle: {
    position: 'relative',
    backgroundColor: '#fafafa',
    borderRadius: 9999,
    borderWidth: 4,
    borderColor: '#e5e7eb',
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
  ingredientSlot: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  progressRing: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 9999,
    borderWidth: 2,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 9999,
  },
  slotContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  slotNumber: {
    fontSize: 10,
    color: '#737373',
    fontWeight: '600',
  },
  slotName: {
    fontSize: 11,
    color: '#171717',
    fontWeight: '600',
    textAlign: 'center',
  },
  slotAmount: {
    fontSize: 9,
    fontWeight: '500',
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
  selectedSlot: {
    fontSize: 14,
    color: '#737373',
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
});