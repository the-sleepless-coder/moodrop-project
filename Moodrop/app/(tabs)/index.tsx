import { router } from 'expo-router';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Wrench, Cpu, User, Flower2, Star, Clock, Lightbulb } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const quickActions = [
    { id: 1, title: '향수 찾기', subtitle: '나에게 맞는 향수 찾기', icon: Search, color: '#d97066', route: '/category' },
    { id: 2, title: '제조 현황', subtitle: '향수 제조 진행 상황', icon: Wrench, color: '#8b6f47', route: '/manufacturing' },
    { id: 3, title: '기기 설정', subtitle: 'Moodrop Station 설정', icon: Cpu, color: '#4a90b8', route: '/device' },
    { id: 4, title: '마이페이지', subtitle: '내 정보 및 설정', icon: User, color: '#b8860b', route: '/profile' },
  ];

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

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>안녕하세요!</Text>
          <Text style={styles.subtitle}>오늘의 향수를 찾아보세요</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 실행</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => handleQuickAction(action.route)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <action.icon size={24} color="#ffffff" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 향수</Text>
          <View style={styles.todayCard}>
            <View style={styles.todayCardHeader}>
              <View style={[styles.todayCardIcon, { backgroundColor: '#d97066' }]}>
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
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
