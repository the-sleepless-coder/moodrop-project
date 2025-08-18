import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  User,
  ChevronRight,
  Receipt,
  FlaskConical,
  CheckCircle,
  Cpu,
  LogOut,
  Clock
} from 'lucide-react-native';
import useStore from '@/store/useStore';
import CustomModal, { ModalAction } from '@/components/CustomModal';


export default function ProfileScreen() {
  const { userProfile, updateUserProfile } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    actions: ModalAction[];
    icon?: React.ReactNode;
  }>({ title: '', message: '', actions: [] });
  const [stats] = useState({
    totalPerfumes: 0,
    favoriteCategory: '없음',
    monthlyUsage: 0,
  });


  const menuItems = [
    {
      id: 'device',
      title: '기기 설정',
      subtitle: 'Moodrop Station 연결 및 관리',
      icon: Cpu,
      color: '#10b981',
    },
    {
      id: 'orders',
      title: '제조 내역',
      subtitle: '제조한 향수 내역 확인',
      icon: Receipt,
      color: '#1e40af',
    },
    {
      id: 'recipes',
      title: '나만의 레시피',
      subtitle: '저장된 커스텀 레시피',
      icon: FlaskConical,
      color: '#8b5cf6',
    },
  ];



  const handleMenuPress = (menuId: string) => {
    switch (menuId) {
      case 'device':
        router.push('/profile/device-settings');
        break;
      case 'orders':
        setModalConfig({
          title: '제조 내역',
          message: '제조 내역을 확인합니다.',
          icon: <Clock size={32} color="#1e40af" />,
          actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
        });
        setModalVisible(true);
        break;
      case 'recipes':
        router.push('/profile/my-recipes');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    setModalConfig({
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      icon: <LogOut size={32} color="#ef4444" />,
      actions: [
        { text: '취소', style: 'cancel', onPress: () => {} },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: () => {
            // 로그아웃 로직
            setModalConfig({
              title: '로그아웃 완료',
              message: '성공적으로 로그아웃되었습니다.',
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <User size={32} color="#ffffff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>json</Text>
              <Text style={styles.userEmail}>user@email.com</Text>
              <TouchableOpacity style={styles.editProfileButton}>
                <Text style={styles.editProfileText}>프로필 편집</Text>
                <ChevronRight size={14} color="#1e40af" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>이용 통계</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalPerfumes}</Text>
              <Text style={styles.statLabel}>제조한 향수</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.favoriteCategory}</Text>
              <Text style={styles.statLabel}>선호 계열</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.monthlyUsage}</Text>
              <Text style={styles.statLabel}>이번 달 제조</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>메뉴</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.id)}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <item.icon size={20} color={item.color} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={16} color="#737373" />
              </TouchableOpacity>
            ))}
          </View>
        </View>



        <View style={styles.appInfoSection}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.appInfoContainer}>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>버전</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>개발사</Text>
              <Text style={styles.appInfoValue}>SKKYHL(서울 A102)</Text>
            </View>
            <TouchableOpacity style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>이용약관</Text>
              <ChevronRight size={14} color="#737373" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>개인정보처리방침</Text>
              <ChevronRight size={14} color="#737373" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 8,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    marginRight: 4,
  },
  statsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  menuContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#171717',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#737373',
  },
  appInfoSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  appInfoContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  appInfoLabel: {
    fontSize: 14,
    color: '#525252',
  },
  appInfoValue: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '500',
  },
  logoutSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
  },
});