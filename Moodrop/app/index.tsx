import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sparkles, Heart, Droplets } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // 페이지 로드 시 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#ffffff', '#f8fafc']}
        style={styles.gradient}
      >
        {/* 배경 장식 원들 */}
        <View style={styles.decorativeCircles}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* 상단 로고 영역 */}
            <Animated.View 
              style={[
                styles.logoSection,
                {
                  transform: [{ scale: logoScale }]
                }
              ]}
            >
              <Image
                source={require('@/assets/images/moodrop-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={styles.tagline}>나만의 향수를 만드는 특별한 여정</Text>
              <Text style={styles.subTagline}>Custom Perfume Experience</Text>
            </Animated.View>

            {/* 중앙 기능 소개 */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Moodrop과 함께</Text>
              
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: '#3b82f6' }]}>
                    <Heart size={20} color="#ffffff" />
                  </View>
                  <Text style={styles.featureText}>무드 기반 맞춤 향수 추천</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: '#06b6d4' }]}>
                    <Droplets size={20} color="#ffffff" />
                  </View>
                  <Text style={styles.featureText}>AI 기반 향료 조합 최적화</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: '#8b5cf6' }]}>
                    <Sparkles size={20} color="#ffffff" />
                  </View>
                  <Text style={styles.featureText}>실시간 향수 제조 및 배송</Text>
                </View>
              </View>
            </View>

            {/* 하단 시작 버튼 */}
            <Animated.View 
              style={[
                styles.buttonSection,
                {
                  transform: [{ scale: buttonScale }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.startButton} 
                onPress={handleStart}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#1e40af', '#3b82f6']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.startButtonText}>시작하기</Text>
                  <ArrowRight size={20} color="#ffffff" style={styles.buttonIcon} />
                </LinearGradient>
              </TouchableOpacity>
              
              <Text style={styles.bottomNote}>
                당신만의 향수 이야기를 시작해보세요
              </Text>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeCircles: {
    position: 'absolute',
    width: width,
    height: height,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.05,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#3b82f6',
    top: height * 0.15,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#06b6d4',
    bottom: height * 0.2,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#8b5cf6',
    top: height * 0.3,
    left: width * 0.1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  logo: {
    width: 300,
    height: 130,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subTagline: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featuresSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 32,
    textAlign: 'center',
  },
  featureList: {
    gap: 24,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  buttonSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  startButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  bottomNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});