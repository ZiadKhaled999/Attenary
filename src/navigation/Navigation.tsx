import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TimeClockScreen from '../screens/TimeClockScreen';
import DailyLogScreen from '../screens/DailyLogScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MoreScreen from '../screens/MoreScreen';
import BackupScreen from '../screens/BackupScreen';
import RestoreBackupScreen from '../screens/RestoreBackupScreen';
import BuyMeCoffeeScreen from '../screens/BuyMeCoffeeScreen';
import SessionDetailsScreen from '../screens/SessionDetailsScreen';
import LanguagesScreen from '../screens/LanguagesScreen';
import FeedbacksScreen from '../screens/FeedbacksScreen';
import HourRateScreen from '../screens/HourRateScreen';
import BossExportScreen from '../screens/BossExportScreen';

import CheckInModal from '../components/CheckInModal';
import CheckOutModal from '../components/CheckOutModal';
import CustomTabBar from '../components/CustomTabBar';
import { TabBarVisibilityProvider } from '../context/TabBarVisibilityContext';
import { checkForUpdate, UpdateInfo } from '../utils/updateService';
import { useApp } from '../context/AppContext';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      id="MainTabs"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="TimeClock" component={TimeClockScreen} />
      <Tab.Screen name="DailyLog" component={DailyLogScreen} />
      <Tab.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};

type MainStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  CheckInModal: undefined;
  CheckOutModal: undefined;
  BuyMeCoffee: undefined;
  SessionDetails: { sessionId: string };
  Languages: undefined;
  Feedbacks: undefined;
  Backup: undefined;
  RestoreBackup: undefined;
  HourRate: undefined;
  BossExport: undefined;
};

const Navigation = () => {
  const { appData } = useApp();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const onboardingCompleted = appData.onboardingCompleted;

  useEffect(() => {
    if (!onboardingCompleted && Platform.OS !== 'web') {
      checkForUpdate()
        .then(update => {
          if (update) {
            setUpdateInfo(update);
            setShowUpdateModal(true);
          }
        })
        .catch(error => {
          console.log('Update check failed (non-critical):', error?.message || error);
        });
    }
  }, [onboardingCompleted]);

  const initialRoute = onboardingCompleted ? 'Main' : 'Onboarding';

  const handleDismissUpdate = () => {
    setShowUpdateModal(false);
  };

  return (
    <TabBarVisibilityProvider>
      <NavigationContainer>
        <Stack.Navigator
          id="RootStack"
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#f1f5f9',
            contentStyle: { backgroundColor: '#0f172a' },
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CheckInModal"
            component={CheckInModal}
            options={{
              presentation: 'transparentModal',
              headerTitle: 'Check In',
              headerStyle: { backgroundColor: '#0f172a' },
              headerTintColor: '#f1f5f9',
            }}
          />
          <Stack.Screen
            name="CheckOutModal"
            component={CheckOutModal}
            options={{
              presentation: 'transparentModal',
              headerTitle: 'Check Out',
              headerStyle: { backgroundColor: '#0f172a' },
              headerTintColor: '#f1f5f9',
            }}
          />
          <Stack.Screen name="BuyMeCoffee" component={BuyMeCoffeeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SessionDetails" component={SessionDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Languages" component={LanguagesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Feedbacks" component={FeedbacksScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Backup" component={BackupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RestoreBackup" component={RestoreBackupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="HourRate" component={HourRateScreen} options={{ headerShown: false }} />
          <Stack.Screen name="BossExport" component={BossExportScreen} options={{ headerShown: false }} />
        </Stack.Navigator>

        {showUpdateModal && updateInfo && (
          <Modal
            transparent
            animationType="fade"
            visible={showUpdateModal}
            onRequestClose={handleDismissUpdate}
          >
            <View style={styles.updateOverlay}>
              <View style={styles.updateContainer}>
                <View style={styles.updateIconContainer}>
                  <Text style={styles.updateIcon}>⬆️</Text>
                </View>
                <Text style={styles.updateTitle}>New Update Available!</Text>
                <Text style={styles.updateVersion}>Version {updateInfo.version}</Text>
                <Text style={styles.updateReleaseNotes}>{updateInfo.releaseNotes}</Text>
                {updateInfo.mandatory && (
                  <Text style={styles.updateMandatory}>This update is required</Text>
                )}
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={async () => {
                    const { downloadAndInstallUpdate } = await import('../utils/updateService');
                    const success = await downloadAndInstallUpdate(updateInfo.downloadUrl);
                    if (!success) {
                      Alert.alert('Error', 'Could not open download link. Please try again or visit the app store.');
                    }
                  }}
                >
                  <Text style={styles.updateButtonText}>Update Now</Text>
                </TouchableOpacity>
                {!updateInfo.mandatory && (
                  <TouchableOpacity style={styles.laterButton} onPress={handleDismissUpdate}>
                    <Text style={styles.laterButtonText}>Later</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}
      </NavigationContainer>
    </TabBarVisibilityProvider>
  );
};

const styles = StyleSheet.create({
  updateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  updateContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  updateIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateIcon: { fontSize: 28 },
  updateTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 8, textAlign: 'center' },
  updateVersion: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  updateReleaseNotes: { fontSize: 14, color: '#cbd5e1', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  updateMandatory: { fontSize: 12, color: '#ef4444', marginBottom: 16, fontWeight: '600' },
  updateButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  updateButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  laterButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  laterButtonText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
});

export default Navigation;
