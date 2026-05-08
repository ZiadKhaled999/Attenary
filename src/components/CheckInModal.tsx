import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, borderRadius, fonts } from '../theme/colors';

// SVG Icons
const UserIcon = ({ color = '#94a3b8', size = 24 }) => (
  <View style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" fill="none">
      <path 
        d="M20 21v-2a8 8 0 1 0-16 0v2" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </svg>
  </View>
);

const CheckIcon = ({ color = '#22c55e', size = 24 }) => (
  <View style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" fill="none">
      <path 
        d="M20 6L9 17l-5-5" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  </View>
);

const CheckInModal = ({ navigation, route }: any) => {
  const { appData, checkIn } = useApp();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // If no employee name is set, redirect to Profile screen
    if (!appData.employeeName) {
      Alert.alert(
        t('modal.profileRequired'),
        t('modal.profileRequiredMessage'),
        [
          {
            text: t('modal.goToProfile'),
            onPress: () => {
              setModalVisible(false);
              navigation.goBack();
              // Navigate to Profile tab
              navigation.getParent()?.navigate('Profile');
            }
          }
        ]
      );
      return;
    }

    // If name exists, auto check-in immediately
    const performAutoCheckIn = async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      
      try {
        await checkIn();
        Alert.alert(t('modal.success'), t('modal.checkedInSuccess').replace('{name}', appData.employeeName));
        setModalVisible(false);
        navigation.goBack();
      } catch (error: any) {
        Alert.alert(t('modal.error'), error.message || t('modal.checkInError'));
        setModalVisible(false);
        navigation.goBack();
      }
    };

    performAutoCheckIn();
  }, [appData.employeeName]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      e.preventDefault();
      setModalVisible(false);
      navigation.dispatch(e.data.action);
    });

    return unsubscribe;
  }, [navigation]);

  const closeModal = () => {
    setModalVisible(false);
    navigation.goBack();
  };

  if (!modalVisible) {
    return null;
  }

  // Show loading state while processing
  return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <UserIcon color="#94a3b8" size={24} />
            <Text style={styles.modalTitle}>{t('modal.checkInTitle')}</Text>
          </View>

          <View style={styles.loadingContainer}>
            <Text style={styles.modalMessage}>
              {appData.employeeName 
                ? t('modal.checkingInAs').replace('{name}', appData.employeeName) 
                : t('modal.processing')}
            </Text>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>{t('modal.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  modalMessage: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.bgGlassLight,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.neonGlowSubtle,
  },
  cancelButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.medium as any,
    color: colors.textPrimary,
  },
});

export default CheckInModal;
