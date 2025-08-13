import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Cpu, 
  Battery, 
  BatteryLow, 
  Search, 
  RotateCw,
  FlaskConical
} from 'lucide-react-native';
import useStore from '@/store/useStore';

interface Device {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  batteryLevel: number;
  firmwareVersion: string;
  lastConnected: string;
  status: 'connected' | 'disconnected' | 'connecting';
}

export default function DeviceScreen() {
  const { deviceConnected, deviceInfo, setDeviceConnected, setDeviceInfo } = useStore();
  const [scanning, setScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);

  useEffect(() => {
    // 초기 기기 정보 설정
    if (!deviceInfo) {
      const mockDevice: Device = {
        id: 'moodrop-001',
        name: 'Moodrop Station',
        model: 'MS-2024',
        serialNumber: 'MDS240115001',
        batteryLevel: 87,
        firmwareVersion: '2.1.3',
        lastConnected: '2024-01-15 15:30',
        status: 'connected'
      };
      setDeviceInfo(mockDevice);
      setDeviceConnected(true);
    }
  }, []);

  const handleScanDevices = async () => {
    setScanning(true);
    
    // 모의 스캔 과정
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockDevices: Device[] = [
      {
        id: 'moodrop-001',
        name: 'Moodrop Station',
        model: 'MS-2024',
        serialNumber: 'MDS240115001',
        batteryLevel: 87,
        firmwareVersion: '2.1.3',
        lastConnected: '2024-01-15 15:30',
        status: 'disconnected'
      },
      {
        id: 'moodrop-002',
        name: 'Moodrop Station Pro',
        model: 'MSP-2024',
        serialNumber: 'MDS240115002',
        batteryLevel: 92,
        firmwareVersion: '2.2.0',
        lastConnected: '사용 안함',
        status: 'disconnected'
      }
    ];
    
    setAvailableDevices(mockDevices);
    setScanning(false);
  };

  const handleConnectDevice = async (device: Device) => {
    Alert.alert(
      '기기 연결',
      `${device.name}에 연결하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '연결', 
          onPress: async () => {
            // 연결 시뮬레이션
            const updatedDevice = { ...device, status: 'connecting' as const };
            setDeviceInfo(updatedDevice);
            
            // 연결 과정 시뮬레이션
            setTimeout(() => {
              const connectedDevice = { ...device, status: 'connected' as const, lastConnected: new Date().toLocaleString() };
              setDeviceInfo(connectedDevice);
              setDeviceConnected(true);
              setAvailableDevices([]);
              Alert.alert('연결 완료', '기기에 성공적으로 연결되었습니다.');
            }, 2000);
          } 
        }
      ]
    );
  };

  const handleDisconnectDevice = () => {
    Alert.alert(
      '기기 연결 해제',
      '현재 연결된 기기와의 연결을 해제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '연결 해제', 
          style: 'destructive',
          onPress: () => {
            setDeviceConnected(false);
            if (deviceInfo) {
              setDeviceInfo({ ...deviceInfo, status: 'disconnected' });
            }
          }
        }
      ]
    );
  };

  const handleIngredientSettings = () => {
    router.push('/device/ingredient-settings');
  };

  const handleCheckFirmware = () => {
    Alert.alert(
      '펌웨어 업데이트',
      '현재 최신 버전을 사용 중입니다.',
      [{ text: '확인' }]
    );
  };

  const getBatteryColor = (level: number): string => {
    if (level > 60) return '#22c55e';
    if (level > 30) return '#f59e0b';
    return '#ef4444';
  };

  const getBatteryIcon = (level: number) => {
    if (level > 25) return Battery;
    return BatteryLow;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>기기 설정</Text>
        <Text style={styles.subtitle}>Moodrop Station을 연결하고 관리하세요</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {deviceConnected && deviceInfo ? (
          <View style={styles.connectedSection}>
            <View style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <View style={styles.deviceIcon}>
                  <Cpu size={32} color="#22c55e" />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{deviceInfo.name}</Text>
                  <View style={styles.connectionStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>연결됨</Text>
                  </View>
                </View>
              </View>

              <View style={styles.deviceDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>마지막 연결</Text>
                  <Text style={styles.detailValue}>{deviceInfo.lastConnected}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>배터리</Text>
                  <View style={styles.batteryInfo}>
                    {React.createElement(getBatteryIcon(deviceInfo.batteryLevel), {
                      size: 16,
                      color: getBatteryColor(deviceInfo.batteryLevel)
                    })}
                    <Text style={[styles.batteryText, { color: getBatteryColor(deviceInfo.batteryLevel) }]}>
                      {deviceInfo.batteryLevel}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.deviceActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleIngredientSettings}>
                  <FlaskConical size={16} color="#8b5cf6" />
                  <Text style={styles.actionButtonText}>원료 설정</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnectDevice}>
                  <Text style={styles.disconnectButtonText}>연결 해제</Text>
                </TouchableOpacity>
              </View>

            </View>

          </View>
        ) : (
          <View style={styles.disconnectedSection}>
            <View style={styles.noDeviceCard}>
              <Cpu size={64} color="#d1d5db" />
              <Text style={styles.noDeviceTitle}>연결된 기기가 없습니다</Text>
              <Text style={styles.noDeviceDescription}>
                Moodrop Station을 스캔하여 연결하세요
              </Text>
            </View>

            <View style={styles.scanSection}>
              <TouchableOpacity 
                style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
                onPress={handleScanDevices}
                disabled={scanning}
              >
                {scanning ? (
                  <RotateCw size={20} color="#ffffff" style={styles.spinning} />
                ) : (
                  <Search size={20} color="#ffffff" />
                )}
                <Text style={styles.scanButtonText}>
                  {scanning ? '스캔 중...' : '기기 스캔'}
                </Text>
              </TouchableOpacity>
            </View>

            {availableDevices.length > 0 && (
              <View style={styles.availableDevicesSection}>
                <Text style={styles.sectionTitle}>사용 가능한 기기</Text>
                {availableDevices.map((device) => (
                  <View key={device.id} style={styles.availableDeviceCard}>
                    <View style={styles.availableDeviceInfo}>
                      <View style={styles.deviceIcon}>
                        <Cpu size={24} color="#737373" />
                      </View>
                      <View style={styles.deviceDetails}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.connectButton}
                      onPress={() => handleConnectDevice(device)}
                    >
                      <Text style={styles.connectButtonText}>연결</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.instructionsSection}>
              <Text style={styles.sectionTitle}>연결 가이드</Text>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>1</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Moodrop Station의 전원을 켜주세요
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>2</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    기기의 블루투스가 활성화되어 있는지 확인하세요
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>3</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    '기기 스캔' 버튼을 눌러 주변 기기를 찾아보세요
                  </Text>
                </View>
              </View>
            </View>
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
  connectedSection: {
    padding: 24,
  },
  disconnectedSection: {
    padding: 24,
  },
  deviceCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
  },
  disconnectButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  deviceDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 14,
    color: '#525252',
  },
  detailValue: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '500',
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  noDeviceCard: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 32,
  },
  noDeviceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginTop: 16,
    marginBottom: 8,
  },
  noDeviceDescription: {
    fontSize: 16,
    color: '#525252',
    textAlign: 'center',
  },
  scanSection: {
    marginBottom: 32,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171717',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spinning: {
    // 애니메이션은 별도 구현 필요
  },
  availableDevicesSection: {
    marginBottom: 32,
  },
  availableDeviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  availableDeviceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsSection: {},
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#525252',
    lineHeight: 20,
  },
});