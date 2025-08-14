import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';

const { width: screenWidth } = Dimensions.get('window');

export interface ModalAction {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel' | 'primary';
}

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  actions: ModalAction[];
  icon?: React.ReactNode;
}

export default function CustomModal({
  visible,
  onClose,
  title,
  message,
  actions,
  icon,
}: CustomModalProps) {
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getActionButtonStyle = (style?: string) => {
    switch (style) {
      case 'primary':
        return [styles.actionButton, styles.primaryButton];
      case 'destructive':
        return [styles.actionButton, styles.destructiveButton];
      case 'cancel':
        return [styles.actionButton, styles.cancelButton];
      default:
        return [styles.actionButton, styles.defaultButton];
    }
  };

  const getActionTextStyle = (style?: string) => {
    switch (style) {
      case 'primary':
        return [styles.actionText, styles.primaryText];
      case 'destructive':
        return [styles.actionText, styles.destructiveText];
      case 'cancel':
        return [styles.actionText, styles.cancelText];
      default:
        return [styles.actionText, styles.defaultText];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  opacity: opacityValue,
                  transform: [{ scale: scaleValue }],
                },
              ]}
            >
              {/* 아이콘 영역 */}
              {icon && (
                <View style={styles.iconContainer}>
                  {icon}
                </View>
              )}

              {/* 제목 */}
              <Text style={styles.title}>{title}</Text>

              {/* 메시지 */}
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}

              {/* 액션 버튼들 */}
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={getActionButtonStyle(action.style)}
                    onPress={() => {
                      action.onPress();
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={getActionTextStyle(action.style)}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: screenWidth - 48,
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 16,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#1e40af',
    shadowColor: '#1e40af',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  defaultButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  primaryText: {
    color: '#ffffff',
  },
  destructiveText: {
    color: '#ffffff',
  },
  cancelText: {
    color: '#6b7280',
  },
  defaultText: {
    color: '#374151',
  },
});