import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private static readonly MANUFACTURING_NOTIFICATION_ID = 'manufacturing-progress';

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('알림 권한이 거부되었습니다.');
        return false;
      }

      // Android 채널 설정
      if (Platform.OS === 'android') {
        // 진행 알림용 채널 (조용함)
        await Notifications.setNotificationChannelAsync('manufacturing', {
          name: '향수 제조 진행',
          importance: Notifications.AndroidImportance.LOW, // 조용한 알림
          vibrationPattern: [0],
          lightColor: '#1e40af',
          sound: false,
          showBadge: false,
        });

        // 완료 알림용 채널 (진동 있음)
        await Notifications.setNotificationChannelAsync('manufacturing_complete', {
          name: '향수 제조 완료',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 300, 200, 300], // 진동 패턴
          lightColor: '#22c55e',
          sound: true,
          showBadge: false,
        });
      }

      return true;
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  }

  // 제조 진행 알림 생성/업데이트
  async showManufacturingNotification(
    perfumeName: string,
    progress: number,
    stage: string
  ): Promise<void> {
    try {
      const progressText = progress === 0 ? '시작됨' : `${progress}% 완료`;

      const notificationContent = {
        title: '🧪 향수 제조 중',
        body: `${perfumeName} - ${progressText}\n${stage}`,
        data: {
          type: 'manufacturing',
          perfumeName,
          progress,
          stage,
        },
        priority: Notifications.AndroidNotificationPriority.LOW,
        sticky: true, // Android에서 지속적인 알림
        categoryIdentifier: 'manufacturing',
      };

      // 고정된 ID로 알림 업데이트 (기존 알림이 있으면 대체됨)
      await Notifications.scheduleNotificationAsync({
        identifier: NotificationService.MANUFACTURING_NOTIFICATION_ID,
        content: notificationContent,
        trigger: null, // 즉시 표시
      });

      console.log('제조 알림 업데이트:', perfumeName, progressText);
    } catch (error) {
      console.error('제조 알림 표시 실패:', error);
    }
  }

  // 제조 완료 알림
  async showManufacturingCompleteNotification(perfumeName: string): Promise<void> {
    try {
      // 진행 중 알림 제거 (고정 ID 사용)
      await Notifications.dismissNotificationAsync(NotificationService.MANUFACTURING_NOTIFICATION_ID);

      // 진동 실행 (2초간 지속)
      Vibration.vibrate(2000);

      // 완료 알림 표시 (일반 알림, 자동으로 사라짐)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ 향수 제조 완료!',
          body: `${perfumeName}이(가) 성공적으로 제조되었습니다.`,
          data: {
            type: 'manufacturing_complete',
            perfumeName,
          },
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'manufacturing_complete',
        },
        trigger: null,
      });

      console.log('제조 완료 알림 표시:', perfumeName);
    } catch (error) {
      console.error('제조 완료 알림 표시 실패:', error);
    }
  }

  // 제조 알림 제거
  async cancelManufacturingNotification(): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(NotificationService.MANUFACTURING_NOTIFICATION_ID);
      console.log('제조 알림 제거됨');
    } catch (error) {
      console.error('제조 알림 제거 실패:', error);
    }
  }

  // 모든 알림 제거
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      console.log('모든 알림 제거됨');
    } catch (error) {
      console.error('모든 알림 제거 실패:', error);
    }
  }
}

export default new NotificationService();