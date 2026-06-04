import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import { formatTime, formatTimeReversed } from '../utils/timeUtils';

const WarningIcon = ({ size = 24 }: { size?: number }) => (
  <Image source={require('../../assets/icons/export.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const DocumentIcon = ({ size = 24 }: { size?: number }) => (
  <Image source={require('../../assets/icons/report.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const CheckOutModal = ({ navigation, route }: any) => {
  const { appData, checkOut } = useApp();
  const { t } = useLanguage();
  const { setVisible } = useTabBarVisibility();
  const [modalVisible, setModalVisible] = useState(true);
  const [reason, setReason] = useState('');

  useEffect(() => {
    setVisible(false);
  }, [setVisible]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      e.preventDefault();
      setModalVisible(false);
      setVisible(true);
      navigation.dispatch(e.data.action);
    });
    return unsubscribe;
  }, [navigation, setVisible]);

  const closeModal = () => {
    setModalVisible(false);
    setReason('');
    setVisible(true);
    navigation.goBack();
  };

  const activeSession = appData.sessions.find((s: any) => s.checkOutTime === null);

  const handleConfirmCheckOut = async () => {
    if (!activeSession) {
      Alert.alert(t('modal.error'), t('modal.noActiveSessionError'));
      return;
    }
    await checkOut(reason.trim());
    Alert.alert(t('modal.success'), t('modal.checkedOutSuccess'));
    closeModal();
  };

  if (!modalVisible) return null;

  if (!activeSession) {
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <WarningIcon size={24} />
            <Text style={styles.modalTitle}>{t('modal.noActiveSession')}</Text>
          </View>
          <Text style={styles.modalSubtitle}>{t('modal.notCheckedIn')}</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
            <Text style={styles.cancelButtonText}>{t('modal.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const checkinTime = new Date(activeSession.checkInTime);
  const elapsed = Math.floor((Date.now() - activeSession.checkInTime) / 1000);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <DocumentIcon size={24} />
          <Text style={styles.modalTitle}>{t('modal.checkOutTitle')}</Text>
        </View>
        <Text style={styles.modalSubtitle}>
          {t('modal.checkedInSince').replace('{time}', formatTimeReversed(checkinTime))}
        </Text>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            {t('modal.activeFor').replace('{duration}', formatTime(elapsed))}
          </Text>
        </View>
        <Text style={styles.reasonLabel}>{t('modal.reasonOptional')}</Text>
        <TextInput
          style={styles.reasonInput}
          placeholder={t('modal.reasonInputPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
            <Text style={styles.cancelButtonText}>{t('modal.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmCheckOut}>
            <Text style={styles.confirmButtonText}>{t('modal.confirmCheckOut')}</Text>
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
    marginBottom: spacing.md,
  },
  modalIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.md,
    marginBottom: spacing.lg,
  },
  sessionInfo: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sessionText: {
    fontSize: fonts.sizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: fonts.weights.medium as any,
  },
  reasonLabel: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold as any,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  reasonInput: {
    backgroundColor: colors.bgMain,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
    fontSize: fonts.sizes.md,
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.bgGlassLight,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginRight: spacing.sm,
    ...shadows.neonGlowSubtle,
  },
  cancelButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.medium as any,
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.neonGlow,
  },
  confirmButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
  },
});

export default CheckOutModal;
