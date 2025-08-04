import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Clock, 
  Settings, 
  FlaskConical, 
  Filter,
  Package,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Thermometer,
  Gauge,
  Timer
} from 'lucide-react-native';
import useStore from '@/store/useStore';

interface ManufacturingJob {
  id: string;
  name: string;
  status: 'waiting' | 'preparing' | 'mixing' | 'filtering' | 'packaging' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  estimatedTime: string;
  recipe: { [key: string]: number };
}

export default function ManufacturingScreen() {
  const { manufacturingJobs, addManufacturingJob, updateManufacturingJob } = useStore();
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 모의 제조 작업 시뮬레이션
    if (manufacturingJobs.length === 0) {
      const mockJobs: ManufacturingJob[] = [
        {
          id: '1',
          name: '로맨틱 가든',
          status: 'mixing',
          progress: 65,
          startTime: '2024-01-15 14:30',
          estimatedTime: '25분',
          recipe: { '장미': 35, '자스민': 25, '피오니': 20, '머스크': 15, '바닐라': 5 }
        },
        {
          id: '2',
          name: '오션 브리즈 (커스텀)',
          status: 'completed',
          progress: 100,
          startTime: '2024-01-15 13:15',
          estimatedTime: '완료',
          recipe: { '시트러스': 40, '아쿠아틱': 30, '그린': 15, '오존': 10, '화이트머스크': 5 }
        },
        {
          id: '3',
          name: '미스틱 포레스트',
          status: 'waiting',
          progress: 0,
          startTime: '대기 중',
          estimatedTime: '30분 예상',
          recipe: { '샌달우드': 30, '시더우드': 25, '패촐리': 20, '베티버': 15, '그린리프': 10 }
        }
      ];

      mockJobs.forEach(job => addManufacturingJob(job));
    }
  }, []);

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getStatusInfo = (status: ManufacturingJob['status']) => {
    switch (status) {
      case 'waiting':
        return { text: '대기 중', color: '#f59e0b', icon: Clock };
      case 'preparing':
        return { text: '준비 중', color: '#3b82f6', icon: Settings };
      case 'mixing':
        return { text: '조합 중', color: '#8b5cf6', icon: FlaskConical };
      case 'filtering':
        return { text: '여과 중', color: '#06b6d4', icon: Filter };
      case 'packaging':
        return { text: '포장 중', color: '#10b981', icon: Package };
      case 'completed':
        return { text: '완료', color: '#22c55e', icon: CheckCircle };
      case 'failed':
        return { text: '실패', color: '#ef4444', icon: XCircle };
      default:
        return { text: '알 수 없음', color: '#9ca3af', icon: HelpCircle };
    }
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
      '그린리프': '#16a34a',
      '오존': '#06b6d4',
      '화이트머스크': '#9ca3af',
    };
    return colors[ingredient] || '#9ca3af';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>제조 현황</Text>
        <Text style={styles.subtitle}>향수 제조 진행 상황을 확인하세요</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {manufacturingJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <FlaskConical size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>진행 중인 제조가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              향수 찾기에서 레시피를 선택하고 제조를 시작해보세요
            </Text>
          </View>
        ) : (
          <View style={styles.jobsContainer}>
            {manufacturingJobs.map((job) => {
              const statusInfo = getStatusInfo(job.status);
              const isExpanded = expandedJobs.has(job.id);

              return (
                <View key={job.id} style={styles.jobCard}>
                  <TouchableOpacity 
                    style={styles.jobHeader}
                    onPress={() => toggleJobExpansion(job.id)}
                  >
                    <View style={styles.jobInfo}>
                      <View style={styles.jobTitleRow}>
                        <Text style={styles.jobName}>{job.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                          <statusInfo.icon size={12} color={statusInfo.color} />
                          <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.jobDetails}>
                        <Text style={styles.jobDetail}>시작: {job.startTime}</Text>
                        <Text style={styles.jobDetail}>소요시간: {job.estimatedTime}</Text>
                      </View>

                      {job.status !== 'waiting' && job.status !== 'completed' && job.status !== 'failed' && (
                        <View style={styles.progressSection}>
                          <View style={styles.progressInfo}>
                            <Text style={styles.progressText}>진행률</Text>
                            <Text style={styles.progressPercentage}>{job.progress}%</Text>
                          </View>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${job.progress}%`, backgroundColor: statusInfo.color }
                              ]} 
                            />
                          </View>
                        </View>
                      )}
                    </View>

                    {isExpanded ? (
                      <ChevronUp size={20} color="#737373" />
                    ) : (
                      <ChevronDown size={20} color="#737373" />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.jobExpanded}>
                      <View style={styles.recipeSection}>
                        <Text style={styles.recipeTitle}>레시피 구성</Text>
                        <View style={styles.recipeGrid}>
                          {Object.entries(job.recipe).map(([ingredient, percentage]) => (
                            <View key={ingredient} style={styles.recipeItem}>
                              <View style={styles.recipeItemHeader}>
                                <View style={[styles.ingredientDot, { backgroundColor: getIngredientColor(ingredient) }]} />
                                <Text style={styles.ingredientName}>{ingredient}</Text>
                                <Text style={styles.ingredientPercentage}>{percentage}%</Text>
                              </View>
                              <View style={styles.miniProgressBar}>
                                <View 
                                  style={[
                                    styles.miniProgressFill, 
                                    { 
                                      width: `${percentage}%`, 
                                      backgroundColor: getIngredientColor(ingredient) 
                                    }
                                  ]} 
                                />
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>

                      {job.status === 'mixing' && (
                        <View style={styles.realTimeSection}>
                          <Text style={styles.realTimeTitle}>실시간 상태</Text>
                          <View style={styles.realTimeStatus}>
                            <View style={styles.realTimeItem}>
                              <Thermometer size={16} color="#f59e0b" />
                              <Text style={styles.realTimeText}>온도: 23°C</Text>
                            </View>
                            <View style={styles.realTimeItem}>
                              <Gauge size={16} color="#3b82f6" />
                              <Text style={styles.realTimeText}>압력: 1.2atm</Text>
                            </View>
                            <View style={styles.realTimeItem}>
                              <Timer size={16} color="#8b5cf6" />
                              <Text style={styles.realTimeText}>남은 시간: 8분</Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {job.status === 'completed' && (
                        <View style={styles.completedSection}>
                          <View style={styles.completedInfo}>
                            <CheckCircle size={24} color="#22c55e" />
                            <Text style={styles.completedText}>제조 완료!</Text>
                          </View>
                          <Text style={styles.completedDescription}>
                            향수가 성공적으로 제조되었습니다. 기기에서 수령하세요.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#525252',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 24,
  },
  jobsContainer: {
    padding: 24,
  },
  jobCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  jobName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  jobDetail: {
    fontSize: 14,
    color: '#737373',
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#525252',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
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
  jobExpanded: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  recipeSection: {
    marginBottom: 20,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
  },
  recipeGrid: {
    gap: 8,
  },
  recipeItem: {
    marginBottom: 8,
  },
  recipeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  ingredientName: {
    fontSize: 14,
    color: '#171717',
    flex: 1,
  },
  ingredientPercentage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#171717',
  },
  miniProgressBar: {
    height: 3,
    backgroundColor: '#f3f4f6',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginLeft: 16,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  realTimeSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  realTimeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
  },
  realTimeStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  realTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  realTimeText: {
    fontSize: 12,
    color: '#525252',
    marginLeft: 4,
  },
  completedSection: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginLeft: 8,
  },
  completedDescription: {
    fontSize: 14,
    color: '#166534',
  },
});