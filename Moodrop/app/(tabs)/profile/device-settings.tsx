import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Cpu, Search, Settings, Bluetooth, CheckCircle, WifiOff } from 'lucide-react-native';
import useStore from '@/store/useStore';
import CustomModal, { ModalAction } from '@/components/CustomModal';

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

export default function DeviceSettingsScreen() {
  const { deviceConnected, deviceInfo, setDeviceConnected, setDeviceInfo } = useStore();
  const [scanning, setScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    actions: ModalAction[];
    icon?: React.ReactNode;
  }>({ title: '', message: '', actions: [] });

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
    setModalConfig({
      title: '기기 연결',
      message: `${device.name}에 연결하시겠습니까?`,
      icon: <Bluetooth size={32} color="#1e40af" />,
      actions: [
        { text: '취소', style: 'cancel', onPress: () => {} },
        { 
          text: '연결', 
          style: 'primary',
          onPress: async () => {
            // 연결 시뮬레이션
            const updatedDevice = { ...device, status: 'connecting' as const };
            setDeviceInfo(updatedDevice);
            
            // 연결 과정 시뮬레이션
            setTimeout(() => {
              const connectedDevice = { 
                ...device, 
                status: 'connected' as const, 
                lastConnected: new Date().toLocaleString() 
              };
              setDeviceInfo(connectedDevice);
              setDeviceConnected(true);
              setAvailableDevices([]);
              setModalConfig({
                title: '연결 완료',
                message: '기기에 성공적으로 연결되었습니다.',
                icon: <CheckCircle size={32} color="#22c55e" />,
                actions: [{ text: '확인', style: 'primary', onPress: () => {} }]
              });
              setModalVisible(true);
            }, 2000);
          } 
        }
      ]
    });
    setModalVisible(true);
  };

  const handleDisconnectDevice = () => {
    setModalConfig({
      title: '기기 연결 해제',
      message: '현재 연결된 기기와의 연결을 해제하시겠습니까?',
      icon: <WifiOff size={32} color="#ef4444" />,
      actions: [
        { text: '취소', style: 'cancel', onPress: () => {} },
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
    });
    setModalVisible(true);
  };

  const handleIngredientSettings = () => {
    router.push('/profile/ingredient-settings');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {deviceConnected && deviceInfo ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>연결된 기기</Text>
            <View style={styles.connectedDeviceCard}>
              <View style={styles.deviceHeader}>
                <View style={styles.deviceIconConnected}>
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


              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.updateButton} 
                  onPress={handleIngredientSettings}
                >
                  <Settings size={16} color="#1e40af" />
                  <Text style={styles.updateButtonText}>원료 설정</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기기 연결</Text>
            <View style={styles.disconnectedDeviceCard}>
              <View style={styles.noDeviceInfo}>
                <Cpu size={64} color="#d1d5db" />
                <Text style={styles.noDeviceTitle}>연결된 기기가 없습니다</Text>
                <Text style={styles.noDeviceDescription}>
                  Moodrop Station을 스캔하여 연결하세요
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
                onPress={handleScanDevices}
                disabled={scanning}
              >
                <Search size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.scanButtonText}>
                  {scanning ? '스캔 중...' : '기기 스캔'}
                </Text>
              </TouchableOpacity>

              {availableDevices.length > 0 && (
                <View style={styles.availableDevicesSection}>
                  <Text style={styles.availableDevicesTitle}>사용 가능한 기기</Text>
                  {availableDevices.map((device) => (
                    <View key={device.id} style={styles.availableDeviceCard}>
                      <View style={styles.deviceIcon}>
                        <Cpu size={24} color="#6b7280" />
                      </View>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <Text style={styles.deviceModel}>{device.model}</Text>
                        <Text style={styles.deviceSerial}>
                          Serial: {device.serialNumber}
                        </Text>
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
            </View>
          </View>
        )}

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
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  connectedDeviceCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 20,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceIconConnected: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  deviceModel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
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
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
  },
  deviceDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
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
  actionButtons: {
    gap: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e40af',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectedDeviceCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 24,
  },
  noDeviceInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  noDeviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginTop: 16,
    marginBottom: 8,
  },
  noDeviceDescription: {
    fontSize: 14,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  scanButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  availableDevicesSection: {
    marginTop: 8,
  },
  availableDevicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
  },
  availableDeviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceSerial: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
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
    fontWeight: '600',
  },
});