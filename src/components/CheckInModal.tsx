import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';

const HeaderIcon = ({ size = 28 }: { size?: number }) => (
  <Image source={require('../../assets/icons/profile.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const SuccessIcon = ({ size = 48 }: { size?: number }) => (
  <Image source={require('../../assets/icons/logs.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const CheckInModal = ({ navigation, route }: any) => {
  const { appData, checkIn } = useApp();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(true);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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

  useEffect(() => {
    if (!appData.employeeName) {
      setStatus('error');
      setMessage(t('modal.profileRequired'));
      return;
    }

    const run = async () => {
      setStatus('processing');
      try {
        await checkIn();
        setStatus('success');
        setMessage(
          t('modal.checkedInSuccess').replace('{name}', appData.employeeName),
        );
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || t('modal.checkInError'));
      }
    };

    run();
  }, [appData.employeeName]);

  if (!modalVisible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.iconWrap}>
          {status === 'success' ? <SuccessIcon size={44} /> : <HeaderIcon size={28} />}
        </View>
        <Text style={styles.modalTitle}>{t('modal.checkInTitle')}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={closeModal} activeOpacity={0.85}>
            <Text style={styles.buttonText}>{t('modal.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  footer: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: fonts.sizes.lg,
    color: colors.bgMain,
    fontWeight: fonts.weights.bold as any,
  },
});

export default CheckInModal;
