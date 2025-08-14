import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 순차적 애니메이션 실행
    Animated.sequence([
      // 1단계: 로고 페이드인 + 스케일
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      
      // 2단계: 로고 살짝 위로 이동하며 태그라인 나타남
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: -30,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // 3단계: 잠시 대기
      Animated.delay(1000),
      
      // 4단계: 페이드아웃
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#ffffff', '#f8fafc']}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: logoAnim }
              ],
            },
          ]}
        >
          {/* 배경 장식 원들 */}
          <View style={styles.decorativeCircles}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
          </View>

          {/* 메인 로고 */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/moodrop-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* 태그라인 */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineAnim,
              transform: [
                {
                  translateY: taglineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.tagline}>나만의 향수를 만드는 특별한 여정</Text>
          <Text style={styles.subTagline}>Custom Perfume Experience</Text>
        </Animated.View>

        {/* 하단 로딩 인디케이터 */}
        <Animated.View
          style={[
            styles.loadingContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.loadingDots}>
            <LoadingDot delay={0} />
            <LoadingDot delay={200} />
            <LoadingDot delay={400} />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

// 로딩 도트 컴포넌트
function LoadingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    const timeout = setTimeout(() => {
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.dot,
        { opacity }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 320,
    height: 140,
  },
  taglineContainer: {
    position: 'absolute',
    bottom: height * 0.25,
    alignItems: 'center',
    paddingHorizontal: 40,
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
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.08,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
});