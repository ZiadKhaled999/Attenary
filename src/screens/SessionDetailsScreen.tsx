import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

// ─────────────────────────────────────────────────
// theme tokens (mirrors HistoryScreen palette)
// ─────────────────────────────────────────────────
const C = {
  bgMain: '#1e1e1e',
  card: '#242424',
  alt: '#262626',
  border: '#363636',
  borderSubtle: '#2a2a2a',
  main: '#dadada',
  muted: '#999999',
  faint: '#555555',
  purple: '#a882ff',
  red: '#fb464c',
  redGlow: 'rgba(251,70,76,0.15)',
  redBorder: 'rgba(251,70,76,0.35)',
  purpleSoft: 'rgba(139,108,239,0.08)',
  purpleBorder: 'rgba(139,108,239,0.4)',
  green: '#44cf6e',
  white: '#fff',
};

// ─────────────────────────────────────────────────
// responsive breakpoints
// ─────────────────────────────────────────────────
const { width: W0, height: H0 } = Dimensions.get('window');

// ─────────────────────────────────────────────────
// SVG icons (match HistoryScreen stroke style)
// ─────────────────────────────────────────────────
const BackIcon = ({ size = 22, color = C.main }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CalendarIcon = ({ size = 20, color = C.purple }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <Path d="M3 10h18M8 2v4M16 2v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ClockIcon = ({ size = 14, color = C.muted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ size = 22 }: { size?: number }) => {
  const r = size / 2;
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 24 24" fill="none">
        <Path d="M5 13l4 4L19 7" stroke={C.bgMain} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};

const ChatIcon = ({ size = 20, color = C.purple }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ size = 16, color = C.purple }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─────────────────────────────────────────────────
// Live pulse SVG for active sessions
// ─────────────────────────────────────────────────
const LivePulseIcon = ({ size = 22 }: { size?: number }) => {
  const p = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(p, { toValue: 1.35, duration: 900, useNativeDriver: true }),
        Animated.timing(p, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: p }], width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="7" fill={C.redGlow} />
        <Circle cx="12" cy="12" r="3.5" fill={C.red} />
      </Svg>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
const fmtTime = (s: number) => {
  if (!s || s < 0) return '00:00:00';
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const fmtTime12 = (d: Date) => {
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = h % 12 || 12;
  return `${hh}:${pad(m)}${h >= 12 ? 'PM' : 'AM'}`;
};

// ─────────────────────────────────────────────────
// component
// ─────────────────────────────────────────────────
interface SessionDetailsScreenProps {
  route: { params: { session: Session } };
}

const SessionDetailsScreen: React.FC<SessionDetailsScreenProps> = ({ route }) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t, language } = useLanguage();
  const { updateSessionReason, appData } = useApp();
  const paramSession = route.params.session;
  const session = appData.sessions.find((s: any) => s.sessionId === paramSession.sessionId) || paramSession;

  const [dims, setDims] = useState({ w: W0, h: H0 });
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims({ w: window.width, h: window.height }));
    return () => (sub as any).remove?.();
  }, []);

  const isTablet = dims.w >= 768;
  const isLandscape = dims.w > dims.h;
  const padH = isTablet ? 48 : 20;
  const padV = isLandscape ? 20 : isTablet ? 24 : 20;
  const headerPadTop = isLandscape ? 16 : 40;
  const cardGap = isTablet ? 24 : 20;
  const cardMaxW = isTablet ? 720 : '100%';
  const fontSizeScale = isTablet ? 1.1 : 1;

  const isActive = session.checkOutTime === null;
  const checkIn = new Date(session.checkInTime);
  const checkOut = session.checkOutTime ? new Date(session.checkOutTime) : null;
  const durS = isActive
    ? Math.max(Math.floor((Date.now() - session.checkInTime) / 1000), 0)
    : Math.max(Math.floor((session.checkOutTime - session.checkInTime) / 1000), 0);

  const statusLabel = isActive
    ? t('sessiondetails.active') ?? 'Active Session'
    : t('sessiondetails.completed') ?? 'Completed';
  const statusColor = isActive ? C.red : C.green;
  const borderColor = isActive ? C.redBorder : C.purpleBorder;

  const durHM = `${Math.floor(durS / 3600)} hrs, ${Math.floor((durS % 3600) / 60)} mins`;
  const durBadge = isActive ? 'Active Now' : durHM;
  const durDesc = isActive
    ? t('sessiondetails.sessionStillActive')
    : durS < 120
    ? 'This session was completed under 2 minutes.'
    : `${Math.floor(durS / 3600)} hours, ${Math.floor((durS % 3600) / 60)} minutes`;

  const [open, setOpen] = useState(false);
  const [text, setText] = useState(session.reason ?? '');
  const [editedAt, setEditedAt] = useState<number | null>(((session as any).reasonEditedAt ?? null));
  const [saving, setSaving] = useState(false);
  const slide = useRef(new Animated.Value(H0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!open) return;
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 340, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [open, slide, fade]);

  // keep editedAt in sync with the live session from context
  useEffect(() => {
    setEditedAt(((session as any).reasonEditedAt ?? null));
  }, [session]);

  const show = () => {
    if (editedAt !== null || isActive) return;
    setText(session.reason ?? '');
    setOpen(true);
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(slide, { toValue: H0, duration: 260, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await updateSessionReason(session.sessionId, text.trim() || null);
      if (ok) {
        setEditedAt(Date.now());
        hide();
      }
    } catch {
      Alert.alert('Error', 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const isRTL = language === 'ar';

  return (
    <View style={[S.root, { backgroundColor: C.bgMain }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: padH, paddingVertical: padV, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[S.inner, { maxWidth: cardMaxW, alignSelf: 'center', width: '100%', gap: cardGap }, isRTL && { direction: 'rtl' }]}>

          {/* header */}
          <View style={[S.header, { paddingTop: headerPadTop }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={S.backBtn}>
              <BackIcon size={22} />
              <Text style={[S.backText, { fontSize: 15 * fontSizeScale }]}>{t('sessiondetails.back')}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[S.hTitle, { fontSize: 20 * fontSizeScale }]}>{t('sessiondetails.title')}</Text>
              <Text style={[S.hSub, { fontSize: 12 * fontSizeScale }]}>Attendance Overview</Text>
            </View>
            <View style={{ width: 80 }} />
          </View>

          {/* status — mirrors HistoryScreen chevronCircle + live pulse */}
          <View style={[S.card, { backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[S.label, { fontSize: 11 * fontSizeScale, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }]}>
                  {t('sessiondetails.sessionStatus')}
                </Text>
                <Text style={[S.statusText, { fontSize: 20 * fontSizeScale, fontWeight: '700' }, { color: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
              <View
                style={[
                  {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: C.alt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor,
                  },
                ]}
              >
                {isActive ? <LivePulseIcon size={22} /> : <CheckIcon size={28} />}
              </View>
            </View>
            <View style={{ marginTop: 14, height: 6, backgroundColor: C.alt, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
              <View style={{ flex: 1 }}>
                <View style={[{ flex: 1, borderRadius: 3 }, { backgroundColor: isActive ? 'rgba(251,70,76,0.9)' : C.green }]} />
              </View>
            </View>
          </View>

          {/* date & time */}
          <View style={[S.card, { backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CalendarIcon size={18} color={C.purple} />
              <Text style={[S.secTitle, { fontSize: 16 * fontSizeScale, color: C.white }]}>{t('sessiondetails.dateTime')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <ClockIcon size={11} color={C.muted} />
                  <Text style={[S.small, { fontSize: 11 * fontSizeScale, color: C.muted }]}>{t('sessiondetails.checkInLabel')}</Text>
                </View>
                <Text style={[S.bold, { fontSize: 17 * fontSizeScale, color: C.main, marginBottom: 4 }]}>{fmtTime12(checkIn)}</Text>
                <Text style={[S.small, { fontSize: 11 * fontSizeScale, color: C.muted }]}>{fmtDate(session.checkInTime)}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <ClockIcon size={11} color={C.muted} />
                  <Text style={[S.small, { fontSize: 11 * fontSizeScale, color: C.muted }]}>{t('sessiondetails.checkOutLabel')}</Text>
                </View>
                {checkOut ? (
                  <>
                    <Text style={[S.bold, { fontSize: 17 * fontSizeScale, color: C.main, marginBottom: 4 }]}>{fmtTime12(checkOut)}</Text>
                    <Text style={[S.small, { fontSize: 11 * fontSizeScale, color: C.muted }]}>{fmtDate(session.checkOutTime)}</Text>
                  </>
                ) : (
                  <Text style={[S.bold, { fontSize: 15 * fontSizeScale, color: C.muted, fontStyle: 'italic' }]}>
                    {t('sessiondetails.sessionStillActive')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* duration */}
          <View style={[S.card, { backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ClockIcon size={20} color={C.purple} />
                <Text style={[S.secTitle, { fontSize: 15 * fontSizeScale, color: C.main, fontWeight: '500' }]}>{t('sessiondetails.totalDuration')}</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, backgroundColor: C.purpleSoft, borderColor: C.purpleBorder }}>
                <Text style={[{ fontSize: 11 * fontSizeScale, fontWeight: '700', color: C.purple }]}>{durBadge}</Text>
              </View>
            </View>
            <Text style={[S.clock, { fontSize: 30 * fontSizeScale, fontWeight: '800', color: C.main, fontFamily: 'monospace', letterSpacing: 2, textAlign: 'center', marginVertical: 4 }]}>
              {fmtTime(durS)}
            </Text>
            <Text style={[S.small, { color: C.muted, textAlign: 'center', marginTop: 4, fontSize: 13 * fontSizeScale }]}>{durDesc}</Text>
          </View>

          {/* reason */}
          <View style={[S.card, { backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ChatIcon size={18} color={C.purple} />
                <Text style={[S.secTitle, { fontSize: 16 * fontSizeScale, fontWeight: '700', color: C.white }]}>{t('sessiondetails.reasonForCheckingOut')}</Text>
              </View>
              {editedAt != null && !isActive ? (
                <Text style={[S.small, { fontSize: 11 * fontSizeScale, color: C.muted, fontWeight: '500' }]}>
                  Self Assessment | Edited {new Date(editedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              ) : !isActive ? (
                <Text style={[S.small, { fontSize: 11 * fontSizeScale, color: C.muted, fontWeight: '500' }]}>
                  {checkOut?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              ) : null}
            </View>
            <View style={{ backgroundColor: C.alt, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
              {session.reason ? (
                <Text style={{ fontSize: 15 * fontSizeScale, color: C.main, lineHeight: 24, fontStyle: 'italic' }}>&quot;{session.reason}&quot;</Text>
              ) : (
                <>
                  <Text style={[S.bold, { textAlign: 'center', marginBottom: 4, fontSize: 14 * fontSizeScale, color: C.white }]}>
                    {t('sessiondetails.noReason')}
                  </Text>
                  <Text style={[S.small, { color: C.muted, textAlign: 'center', fontSize: 13 * fontSizeScale }]}>
                    {t('sessiondetails.noReasonSubtext')}
                  </Text>
                </>
              )}
              {editedAt != null && (
                <Text style={[{ marginTop: 10, textAlign: 'center', fontSize: 12 * fontSizeScale, color: C.muted }]}>
                  Edited {new Date(editedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
            {editedAt == null && !isActive ? (
              <TouchableOpacity onPress={show} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: C.purpleSoft, borderRadius: 16, borderWidth: 1, borderColor: C.purpleBorder }}>
                <EditIcon size={15} color={C.purple} />
                <Text style={[{ fontSize: 13 * fontSizeScale, fontWeight: '700', color: C.purple, letterSpacing: 0.2 }]}>{t('sessiondetails.editAssessment')}</Text>
              </TouchableOpacity>
            ) : editedAt != null ? (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={[{ fontSize: 13 * fontSizeScale, fontWeight: '600', color: C.muted }]}>Assessment saved once</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* bottom sheet */}
      <Modal visible={open} transparent animationType="none" onRequestClose={hide}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', opacity: fade }}>
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={hide} />
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: C.card,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderWidth: 1,
              borderTopColor: C.border,
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 34,
              maxHeight: H0 * 0.75,
              transform: [{ translateY: slide }],
            }}
          >
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: C.border }} />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={[{ fontSize: 18 * fontSizeScale, fontWeight: '700', color: C.main, marginBottom: 4 }]}>{t('sessiondetails.assessmentTitle')}</Text>
              <Text style={[{ fontSize: 14 * fontSizeScale, color: C.muted }]}>{t('sessiondetails.assessmentSubtitle')}</Text>
            </View>
            <View style={{ gap: 16 }}>
              <TextInput
                style={{ backgroundColor: C.bgMain, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, fontSize: 15, color: C.main, minHeight: 120, textAlignVertical: 'top' }}
                multiline
                numberOfLines={4}
                value={text}
                onChangeText={setText}
                placeholder={t('sessiondetails.placeholder')}
                placeholderTextColor={C.faint}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={hide} activeOpacity={0.8} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, backgroundColor: C.alt, borderWidth: 1, borderColor: C.border }}>
                  <Text style={[{ fontSize: 15 * fontSizeScale, fontWeight: '600', color: C.muted }]}>{t('sessiondetails.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={save} activeOpacity={0.8} disabled={saving} style={[S.saveBtn, saving && { opacity: 0.6 }]}>
                  <Text style={[S.saveTxt, { fontSize: 15 * fontSizeScale }]}>{saving ? 'Saving...' : t('sessiondetails.saveAssessment')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────
// styles (only static / non-themed values here)
// ─────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, minHeight: '100%' },
  inner: {},
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingRight: 12 },
  backText: { fontWeight: '600', marginLeft: 4, color: C.white },
  hTitle: { fontWeight: '700', textAlign: 'center', color: C.white },
  hSub: { textAlign: 'center', marginTop: 2, color: C.white },
  card: { ...{} },
  label: {},
  statusText: {},
  bold: { fontWeight: '700' },
  small: {},
  secTitle: { fontWeight: '600', color: C.white },
  clock: {},
  saveBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, backgroundColor: C.purple },
  saveTxt: { fontWeight: '700', color: C.white },
});

export default SessionDetailsScreen;
