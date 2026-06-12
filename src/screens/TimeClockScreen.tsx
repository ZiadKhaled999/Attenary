import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { useConvexSync } from '../context/ConvexContext';
import { colors, spacing, fonts, shadows } from '../theme/colors';
import { getDateString } from '../utils/timeUtils';
import { getOrCreateDeviceId } from '../utils/deviceId';
import Svg, { Line, Polyline, Rect } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════
// ICONS (matched to HTML template SVGs)
// ═══════════════════════════════════════════════════════════════════

const CheckInIcon = ({ color = '#ffffff', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckOutIcon = ({ color = colors.textFaint, size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="5" width="14" height="14" rx="4" stroke={color} strokeWidth="2" />
  </Svg>
);

const TimeClockScreen = () => {
  const { appData, checkIn, checkOut } = useApp();
  const { t, isRTL, language } = useLanguage();
  const { setVisible } = useTabBarVisibility();
  const { queueMutation } = useConvexSync();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employeeName, setEmployeeNameLocal] = useState('');
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  // Bottom sheet state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    const name = appData.employeeName?.trim();
    if (name) {
      setEmployeeNameLocal(name);
    }
  }, [appData.employeeName]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const dateTimer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(dateTimer);
  }, []);

  const activeSession = appData.sessions.find((s: any) => s.checkOutTime === null);
  const todaySessions = appData.sessions.filter((s: any) => getDateString(s.checkInTime) === getDateString(Date.now()));

  let totalSeconds = 0;
  todaySessions.forEach((s: any) => {
    const end = s.checkOutTime || Date.now();
    totalSeconds += Math.floor((end - s.checkInTime) / 1000);
  });

  const [liveSessionSeconds, setLiveSessionSeconds] = useState(0);
  const [liveTotalSeconds, setLiveTotalSeconds] = useState(totalSeconds);

  useEffect(() => {
    if (!activeSession) {
      setLiveSessionSeconds(0);
    }
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => {
      setLiveSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  useEffect(() => {
    setLiveTotalSeconds(totalSeconds);
  }, [totalSeconds]);

  // Bottom sheet animation
  useEffect(() => {
    if (modalVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, slideAnim]);

  const handleCheckIn = async () => {
    await checkIn();
    const newSession = appData.sessions.find((s: any) => s.checkOutTime === null);
    if (!newSession) return;
    await queueMutation('sessions', String(newSession.sessionId), 'upsert', {
      user_id: deviceId,
      check_in_time: newSession.checkInTime,
      check_out_time: null,
      reason: null,
      reason_edited_at: null,
      updated_at: Date.now(),
    });
  };

  const handleCheckOutPress = () => {
    if (!activeSession) return;
    setModalVisible(true);
    setSelectedReason('');
    setCustomReason('');
    setVisible(false);
  };

  const finalizeCheckOut = async () => {
    const reason = selectedReason || customReason.trim() || undefined;
    const sessionId = activeSession?.sessionId;
    await checkOut(reason);
    if (sessionId) {
      await queueMutation('sessions', String(sessionId), 'upsert', {
        user_id: deviceId,
        check_in_time: activeSession?.checkInTime ?? Date.now(),
        check_out_time: Date.now(),
        reason: reason ?? null,
        reason_edited_at: null,
        updated_at: Date.now(),
      });
    }
    setModalVisible(false);
    setSelectedReason('');
    setCustomReason('');
    setVisible(true);
  };

  const skipAndFinish = async () => {
    const sessionId = activeSession?.sessionId;
    await checkOut('Skipped');
    if (sessionId) {
      await queueMutation('sessions', String(sessionId), 'upsert', {
        user_id: deviceId,
        check_in_time: activeSession?.checkInTime ?? Date.now(),
        check_out_time: Date.now(),
        reason: 'Skipped',
        reason_edited_at: null,
        updated_at: Date.now(),
      });
    }
    setModalVisible(false);
    setSelectedReason('');
    setCustomReason('');
    setVisible(true);
  };

  const selectReason = (reason: string) => {
    setSelectedReason(reason);
    setCustomReason('');
  };

  const formatHMS = (totalSecs: number) => {
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatHM = (totalSecs: number) => {
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatCurrentDate = (date: Date) => {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    return date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar Header */}
        <View style={styles.headerSection}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              {(() => {
                const hour = currentTime.getHours();
                if (hour >= 5 && hour < 12) return t('timeclock.goodMorning');
                if (hour >= 12 && hour < 17) return t('timeclock.goodAfternoon');
                if (hour >= 17 && hour < 21) return t('timeclock.goodEvening');
                return t('timeclock.goodNight');
              })()}
            </Text>
            <Text style={styles.employeeName}>{employeeName || t('timeclock.employee')}</Text>
          </View>
        </View>

        {/* Unified Glassmorphism Clock Panel */}
        <View style={styles.clockPanel}>
          <View style={styles.clockGlow} />
          <Text style={styles.clockTime}>{formatCurrentTime(currentTime)}</Text>
          <Text style={styles.clockDate}>{formatCurrentDate(currentDate)}</Text>
        </View>

        {/* State Metrics Component Grid */}
        <View style={styles.metricsGrid}>
          {/* Dynamic Session Status Card */}
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <View style={styles.metricHeader}>
              <View style={[styles.statusDot, { backgroundColor: activeSession ? colors.textSuccess : colors.textWarning }]} />
              <Text style={styles.metricLabel}>{t('timeclock.sessionStatus')}</Text>
            </View>
            <Text style={[styles.metricValue, { color: activeSession ? colors.textSuccess : colors.white }]}>
              {activeSession ? t('timeclock.activeSession') : t('timeclock.idle')}
            </Text>
            
            {activeSession && (
              <View style={styles.sessionTimerContainer}>
                <View style={styles.sessionTimerRow}>
                  <View>
                    <Text style={styles.sessionTimerLabel}>{t('timeclock.sessionTime')}</Text>
                    <Text style={styles.sessionTimerValue}>{formatHMS(liveSessionSeconds)}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Cumulative Analytics Aggregator */}
          <View style={[styles.metricCard, styles.metricCardSecondary]}>
            <Text style={styles.metricLabel}>{t('timeclock.todaySessions')}</Text>
            <Text style={styles.metricValue}>{todaySessions.length}</Text>
            <View style={styles.totalShiftRow}>
              <Text style={styles.totalShiftLabel}>{t('timeclock.totalShift')}</Text>
              <Text style={styles.totalShiftValue}>{formatHM(liveTotalSeconds)}</Text>
            </View>
          </View>
        </View>

        {/* Interactive Button UI Engine */}
        <View style={styles.buttonsContainer}>
          {/* Check In Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, activeSession && styles.buttonDisabled]}
            onPress={handleCheckIn}
            disabled={!!activeSession}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContentRow}>
              <View style={[styles.buttonTextCol, isRTL && styles.buttonTextColRTL]}>
                <Text style={styles.primaryButtonTitle}>{t('timeclock.checkIn')}</Text>
                <Text style={styles.primaryButtonSubtitle}>{t('timeclock.initializeTracking')}</Text>
              </View>
              <View style={[styles.iconCircle, isRTL && styles.iconCircleRTL]}>
                <CheckInIcon size={22} color={colors.textOnAccent} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Check Out Button */}
          <TouchableOpacity 
            style={[
              styles.secondaryButton,
              !activeSession && styles.buttonDisabled
            ]}
            onPress={handleCheckOutPress}
            disabled={!activeSession}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContentRow}>
              <View style={[styles.buttonTextCol, isRTL && styles.buttonTextColRTL]}>
                <Text style={[styles.secondaryButtonTitle, { color: activeSession ? colors.colorRed : colors.textFaint }]}>
                  {t('timeclock.checkOut')}
                </Text>
                <Text style={[styles.secondaryButtonSubtitle, { color: activeSession ? colors.colorRedText : colors.textFaint }]}>
                  {activeSession ? t('timeclock.clickToFinish') : t('timeclock.noActiveSession')}
                </Text>
              </View>
              <View style={[styles.iconCircleSecondary, isRTL && styles.iconCircleRTL]}>
                <CheckOutIcon size={22} color={activeSession ? colors.colorRed : colors.textFaint} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════
          CHECKOUT REASON BOTTOM-SHEET MODAL (HTML exact clone)
          ═══════════════════════════════════════════════════════════ */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => { setModalVisible(false); setVisible(true); }} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Decorative Drag Handle Bar */}
            <View style={styles.dragHandle} />

            <Text style={styles.modalTitle}>{t('timeclock.endSessionTitle') || 'End Current Active Session'}</Text>
            <Text style={styles.modalSubtitle}>{t('timeclock.endSessionSubtitle') || 'Specify a checkout reason or type your own below.'}</Text>
            
            {/* Interactive Reason Tags Grid Layout */}
            <View style={styles.reasonTagsGrid}>
              {['Shift Completed', 'Lunch/Rest Break', 'External Meeting', 'Off-site Duty'].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonTag,
                    selectedReason === reason && styles.reasonTagSelected,
                  ]}
                  onPress={() => selectReason(reason)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.reasonTagText,
                    selectedReason === reason && styles.reasonTagTextSelected,
                  ]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Reason Text Input Area */}
            <View style={styles.customReasonContainer}>
              <Text style={styles.customReasonLabel}>{t('timeclock.customReasonLabel') || 'Or write your own reason:'}</Text>
              <TextInput
                style={styles.customReasonInput}
                placeholder={t('timeclock.customReasonPlaceholder') || 'Type your custom checkout reason here...'}
                placeholderTextColor={colors.textMuted}
                value={customReason}
                onChangeText={(text) => {
                  setCustomReason(text);
                  if (text.trim()) setSelectedReason('');
                }}
              />
            </View>

            {/* Action Footer Split Structure */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalSkipBtn} onPress={skipAndFinish} activeOpacity={0.9}>
                <Text style={styles.modalSkipBtnText}>Skip & Finish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={finalizeCheckOut} activeOpacity={0.9}>
                <Text style={styles.modalSubmitBtnText}>Submit Reason</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },
  scrollView: {
    flex: 1,
    maxHeight: '100%',
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: spacing.huge,
    paddingBottom: 140,
  },

  // Header
  headerSection: {
    marginBottom: spacing.xxxl,
    paddingHorizontal: spacing.xs,
  },
  greetingContainer: {
    marginBottom: spacing.xl,
  },
  greetingText: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: fonts.weights.bold as any,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  employeeName: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.black as any,
    color: colors.white,
    letterSpacing: -0.5,
  },

  // Clock Panel (glass-panel-card exact)
  clockPanel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
    ...shadows.glass,
  },
  clockGlow: {
    position: 'absolute',
    top: -48,
    right: -48,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(83,223,221,0.08)',
  },
  clockTime: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.white,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  clockDate: {
    marginTop: spacing.sm,
    fontSize: fonts.sizes.xs,
    color: colors.textSuccess,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    minHeight: 110,
  },
  metricCardPrimary: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    ...shadows.glass,
  },
  metricCardSecondary: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricValue: {
    marginTop: spacing.sm,
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.white,
  },
  sessionTimerContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sessionTimerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTimerLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSuccess,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sessionTimerValue: {
    fontSize: fonts.sizes.md,
    color: colors.textSuccess,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  totalShiftRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalShiftLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  totalShiftValue: {
    fontSize: fonts.sizes.xs,
    color: colors.textSuccess,
    fontWeight: '900',
  },

  // Buttons
  buttonsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonTextCol: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  buttonTextColRTL: {
    paddingRight: 0,
    paddingLeft: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryButtonTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '900',
    color: colors.textOnAccent,
    letterSpacing: 0.3,
  },
  primaryButtonSubtitle: {
    marginTop: spacing.sm,
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  secondaryButton: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  secondaryButtonTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryButtonSubtitle: {
    marginTop: spacing.sm,
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconCircleRTL: {
    marginLeft: 0,
    marginRight: spacing.lg,
  },
  iconCircleSecondary: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // BOTTOM SHEET MODAL (exact HTML clone)
  // ═══════════════════════════════════════════════════════════════
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomSheet: {
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...shadows.glass,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '600',
  },
  reasonTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  reasonTag: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.base05,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  reasonTagSelected: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: colors.borderLight,
  },
  reasonTagText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reasonTagTextSelected: {
    color: colors.accent,
  },
  customReasonContainer: {
    marginBottom: 20,
  },
  customReasonLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  customReasonInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.textPrimary,
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSkipBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSkipBtnText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.white,
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalSubmitBtnText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
});

export default TimeClockScreen;
