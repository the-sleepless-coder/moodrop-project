import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Flower2, 
  Clock, 
  Lightbulb,
  FlaskConical,
  CheckCircle,
  ChevronUp,
  ChevronDown,
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
}

export default function HomeScreen() {
  const { manufacturingJobs } = useStore();
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const todayPerfume = {
    name: '플로럴',
    description: '봄날의 꽃향기 같은 따뜻함',
    duration: '6-8시간 지속',
  };

  const tips = [
    '향수는 체온이 높은 부위에 뿌리면 더 오래 지속됩니다',
    '향수를 뿌린 후 문지르지 마세요. 향이 변질될 수 있습니다',
    '하루에 2-3번 정도가 적당합니다',
  ];

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'waiting':
        return { text: '대기 중', color: '#f59e0b', icon: Clock };
      case 'preparing':
        return { text: '준비 중', color: '#3b82f6', icon: Timer };
      case 'mixing':
        return { text: '조합 중', color: '#8b5cf6', icon: FlaskConical };
      case 'filtering':
        return { text: '여과 중', color: '#06b6d4', icon: Timer };
      case 'packaging':
        return { text: '포장 중', color: '#10b981', icon: Timer };
      case 'completed':
        return { text: '완료', color: '#22c55e', icon: CheckCircle };
      case 'failed':
        return { text: '실패', color: '#ef4444', icon: Timer };
      default:
        return { text: '알 수 없음', color: '#9ca3af', icon: Timer };
    }
  };

  // 현재 진행 중인 작업만 필터링
  const activeJobs = manufacturingJobs.filter((job: ManufacturingJob) => 
    job.status !== 'completed' && job.status !== 'failed'
  );

  // 최근 완료된 작업 (최대 2개)
  const completedJobs = manufacturingJobs
    .filter((job: ManufacturingJob) => job.status === 'completed')
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>안녕하세요!</Text>
          <Text style={styles.subtitle}>오늘의 향수를 찾아보세요</Text>
        </View>


        {/* 제조 현황 섹션 */}
        {(activeJobs.length > 0 || completedJobs.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>제조 현황</Text>
            
            {/* 진행 중인 작업 */}
            {activeJobs.map((job: ManufacturingJob) => {
              const statusInfo = getStatusInfo(job.status);
              const isExpanded = expandedJobs.has(job.id);
              
              return (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => toggleJobExpansion(job.id)}
                >
                  <View style={styles.manufacturingCard}>
                    <View style={styles.manufacturingHeader}>
                    <View style={styles.manufacturingInfo}>
                      <Text style={styles.manufacturingName}>{job.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                        <statusInfo.icon size={12} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                          {statusInfo.text}
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#737373" />
                    ) : (
                      <ChevronDown size={20} color="#737373" />
                    )}
                  </View>
                  
                  {job.status !== 'waiting' && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>진행률: {job.progress}%</Text>
                        <Text style={styles.estimatedTime}>예상 완료: {job.estimatedTime}</Text>
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
                  
                  {isExpanded && (
                    <View style={styles.expandedInfo}>
                      <Text style={styles.startTime}>시작: {job.startTime}</Text>
                    </View>
                  )}
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* 완료된 작업 */}
            {completedJobs.map((job: ManufacturingJob) => (
              <View key={job.id} style={styles.completedCard}>
                <View style={styles.completedHeader}>
                  <CheckCircle size={16} color="#22c55e" />
                  <Text style={styles.completedName}>{job.name}</Text>
                  <Text style={styles.completedText}>제조 완료</Text>
                </View>
                <Text style={styles.completedTime}>완료 시간: {job.startTime}</Text>
              </View>
            ))}
            
            {manufacturingJobs.length === 0 && (
              <View style={styles.emptyManufacturing}>
                <FlaskConical size={32} color="#d1d5db" />
                <Text style={styles.emptyText}>진행 중인 제조가 없습니다</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 향수</Text>
          <View style={styles.todayCard}>
            <View style={styles.todayCardHeader}>
              <View style={[styles.todayCardIcon, { backgroundColor: '#1e40af' }]}>
                <Flower2 size={20} color="#ffffff" />
              </View>
              <View style={styles.todayCardInfo}>
                <Text style={styles.todayCardTitle}>{todayPerfume.name}</Text>
                <Text style={styles.todayCardDescription}>{todayPerfume.description}</Text>
              </View>
            </View>
            <Text style={styles.todayCardDuration}>{todayPerfume.duration}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>향수 팁</Text>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Lightbulb size={16} color="#f59e0b" />
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#525252',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  // 제조 현황 스타일
  manufacturingCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  manufacturingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  manufacturingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manufacturingName: {
    fontSize: 16,
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
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#525252',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#737373',
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
  expandedInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  startTime: {
    fontSize: 13,
    color: '#737373',
  },
  completedCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  completedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
    flex: 1,
  },
  completedText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  completedTime: {
    fontSize: 12,
    color: '#16a34a',
  },
  emptyManufacturing: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  todayCard: {
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 12,
  },
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  todayCardInfo: {
    flex: 1,
  },
  todayCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 2,
  },
  todayCardDescription: {
    fontSize: 14,
    color: '#525252',
  },
  todayCardDuration: {
    fontSize: 13,
    color: '#737373',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#525252',
    lineHeight: 20,
  },
});
