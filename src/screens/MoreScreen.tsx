import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fonts, shadows, glassStyles } from '../theme/colors';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Session } from '../types';
import { formatHoursMinutes, getDateString, getMonthString } from '../utils/timeUtils';

// ═══════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════

const InfoIcon = ({ size = 24 }: { size?: number }) => (
  <Image 
    source={require('../../assets/icons/about.png')} 
    style={{ width: size, height: size }} 
    resizeMode="contain"
  />
);

const FeedbackIcon = ({ size = 24 }: { size?: number }) => (
  <Image 
    source={require('../../assets/icons/feedback.png')} 
    style={{ width: size, height: size }} 
    resizeMode="contain"
  />
);

const ShieldIcon = ({ size = 24 }: { size?: number }) => (
  <Image 
    source={require('../../assets/icons/privacy.png')} 
    style={{ width: size, height: size }} 
    resizeMode="contain"
  />
);

const CoffeeIcon = ({ size = 24 }: { size?: number }) => (
  <Image 
    source={require('../../assets/icons/buymeacoffee.png')} 
    style={{ width: size, height: size }} 
    resizeMode="contain"
  />
);

const GlobeIcon = ({ size = 24 }: { size?: number }) => (
  <Image 
    source={require('../../assets/icons/Language.png')} 
    style={{ width: size, height: size }} 
    resizeMode="contain"
  />
);

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DownloadIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 10l5 5 5-5" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 15V3" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UploadIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 8l-5-5-5 5" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 3v12" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Navigation item type
interface NavItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  screen?: string;
  onPress?: () => void;
}

const MoreScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useLanguage();
  const { appData, addSessions } = useApp();

  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<'month' | 'year' | 'range'>('month');
  const [exportFileType, setExportFileType] = useState<'excel' | 'text'>('excel');
  const [exportStartDate, setExportStartDate] = useState(new Date());
  const [exportEndDate, setExportEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<{ name: string; uri: string } | null>(null);

  const navItems = [
    {
      id: 'languages',
      title: t('more.languages'),
      subtitle: t('more.languagesSubtitle'),
      icon: <GlobeIcon size={32} />,
      screen: 'Languages',
    },
    {
      id: 'about',
      title: t('more.about'),
      subtitle: t('more.aboutSubtitle'),
      icon: <InfoIcon size={32} />,
      screen: 'About',
    },
    // Feedback temporarily hidden - see issue review for details
    // {
    //   id: 'feedbacks',
    //   title: t('more.feedbacks'),
    //   subtitle: t('more.feedbacksSubtitle'),
    //   icon: <FeedbackIcon size={24} />,
    //   screen: 'Feedbacks',
    // },
    {
      id: 'privacy',
      title: t('more.privacy'),
      subtitle: t('more.privacySubtitle'),
      icon: <ShieldIcon size={32} />,
      screen: 'PrivacyPolicy',
    },
    {
      id: 'coffee',
      title: t('more.coffee'),
      subtitle: t('more.coffeeSubtitle'),
      icon: <CoffeeIcon size={32} />,
      screen: 'BuyMeCoffee',
    },
    {
      id: 'export',
      title: 'Export Data',
      subtitle: 'Export your time tracking data',
      icon: <DownloadIcon size={32} />,
      onPress: () => setIsExportModalVisible(true),
    },
    {
      id: 'import',
      title: 'Import Data',
      subtitle: 'Import time tracking data from file',
      icon: <UploadIcon size={32} />,
      onPress: () => setIsImportModalVisible(true),
    },
  ];

  const handleNavigation = (screen: string) => {
    navigation.navigate(screen as never);
  };

  const handleItemPress = (item: NavItem) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.screen) {
      handleNavigation(item.screen);
    }
  };

  const filterSessionsByDateRange = (sessions: Session[]): Session[] => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (exportDateRange) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'range':
        startDate = new Date(exportStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(exportEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return sessions;
    }

    return sessions.filter(session => {
      const checkInDate = new Date(session.checkInTime);
      return checkInDate >= startDate && checkInDate <= endDate;
    });
  };

  const exportToExcel = async (filteredSessions: Session[]): Promise<boolean> => {
    try {
      const data = filteredSessions.map(session => ({
        'Session ID': session.sessionId,
        'Check In Time': new Date(session.checkInTime).toLocaleString(),
        'Check Out Time': session.checkOutTime ? new Date(session.checkOutTime).toLocaleString() : 'Active',
        'Duration': session.checkOutTime
          ? formatHoursMinutes(Math.floor((session.checkOutTime - session.checkInTime) / 1000))
          : 'Active',
        'Reason': session.reason || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sessions');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `attendance_export_${timestamp}.xlsx`;

      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: 'base64' });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Attendance Data',
        });
        return true;
      } else {
        Alert.alert('Export', 'Sharing is not available on this device');
        return false;
      }
    } catch (error) {
      console.error('Excel export error:', error);
      Alert.alert('Export Error', 'Failed to export to Excel. Please try again.');
      return false;
    }
  };

  const exportToJSON = async (filteredSessions: Session[]): Promise<boolean> => {
    try {
      const now = new Date();
      const exportData = {
        exportDate: now.toISOString(),
        exportTimestamp: Date.now(),
        version: '2.0',
        appName: 'Attenary',
        employeeName: appData.employeeName || 'Unknown',
        email: appData.email || '',
        jobTitle: appData.jobTitle || '',
        department: appData.department || '',
        dateRange: exportDateRange,
        summary: {
          totalSessions: filteredSessions.length,
          completedSessions: filteredSessions.filter(s => s.checkOutTime).length,
          activeSessions: filteredSessions.filter(s => !s.checkOutTime).length,
        },
        sessions: filteredSessions.map(session => ({
          sessionId: session.sessionId,
          checkInTime: session.checkInTime,
          checkInTimeReadable: new Date(session.checkInTime).toLocaleString(),
          checkOutTime: session.checkOutTime || null,
          checkOutTimeReadable: session.checkOutTime ? new Date(session.checkOutTime).toLocaleString() : null,
          duration: session.checkOutTime
            ? formatHoursMinutes(Math.floor((session.checkOutTime - session.checkInTime) / 1000))
            : 'Active',
          durationSeconds: session.checkOutTime ? Math.floor((session.checkOutTime - session.checkInTime) / 1000) : null,
          reason: session.reason || null,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `attendance_export_${timestamp}.json`;

      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: 'utf8' });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Attendance Data',
        });
        return true;
      } else {
        Alert.alert('Export', 'Sharing is not available on this device');
        return false;
      }
    } catch (error) {
      console.error('JSON export error:', error);
      Alert.alert('Export Error', 'Failed to export to JSON. Please try again.');
      return false;
    }
  };

  const validateSession = (session: any): session is Session => {
    return (
      typeof session === 'object' &&
      session !== null &&
      typeof session.sessionId === 'string' &&
      session.sessionId.length > 0 &&
      typeof session.checkInTime === 'number' &&
      session.checkInTime > 0 &&
      (session.checkOutTime === null || session.checkOutTime === undefined || typeof session.checkOutTime === 'number') &&
      (session.reason === null || session.reason === undefined || typeof session.reason === 'string')
    );
  };

  const handleImport = async () => {
    if (!selectedImportFile) {
      Alert.alert('No File Selected', 'Please select a file to import.');
      return;
    }

    setIsImporting(true);
    try {
      let importedSessions: Session[] = [];

      if (selectedImportFile.name.endsWith('.xlsx')) {
        // Parse Excel file - read as base64 for proper binary handling
        const fileContent = await FileSystem.readAsStringAsync(selectedImportFile.uri, { encoding: 'base64' });
        const workbook = XLSX.read(fileContent, { type: 'base64' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Convert Excel data to Session objects
        importedSessions = jsonData.map((row: any) => ({
          sessionId: row['Session ID'] || row['sessionId'] || '',
          checkInTime: row['Check In Time'] || row['checkInTime'] || 0,
          checkOutTime: row['Check Out Time'] || row['checkOutTime'] || null,
          reason: row['Reason'] || row['reason'] || null,
        })).filter(validateSession);
      } else if (selectedImportFile.name.endsWith('.json')) {
        // Parse JSON file
        const fileContent = await FileSystem.readAsStringAsync(selectedImportFile.uri);
        const jsonData = JSON.parse(fileContent);

        // Handle different JSON formats
        if (Array.isArray(jsonData)) {
          importedSessions = jsonData.filter(validateSession);
        } else if (jsonData.sessions && Array.isArray(jsonData.sessions)) {
          importedSessions = jsonData.sessions.filter(validateSession);
        } else if (jsonData.rawData && jsonData.rawData.sessions && Array.isArray(jsonData.rawData.sessions)) {
          importedSessions = jsonData.rawData.sessions.filter(validateSession);
        } else {
          throw new Error('Invalid JSON format. Expected an array of sessions or an object with sessions property.');
        }
      } else {
        throw new Error('Unsupported file format. Please select a .xlsx or .json file.');
      }

      if (importedSessions.length === 0) {
        Alert.alert('No Valid Sessions', 'The selected file contains no valid session data.');
        return;
      }

      // Filter out duplicates based on checkInTime
      const existingCheckInTimes = new Set(appData.sessions.map(s => s.checkInTime));
      const newSessions = importedSessions.filter(session => !existingCheckInTimes.has(session.checkInTime));

      if (newSessions.length === 0) {
        Alert.alert('No New Sessions', 'All sessions in the file already exist in your data.');
        return;
      }

// Add sessions using context function
      await addSessions(newSessions);

       Alert.alert(
        'Import Successful',
        `Successfully imported ${newSessions.length} new sessions. ${importedSessions.length - newSessions.length} duplicates were skipped.`
      );

      setIsImportModalVisible(false);
      setSelectedImportFile(null);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Error', error instanceof Error ? error.message : 'Failed to import data. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImportFile({
          name: asset.name,
          uri: asset.uri,
        });
      }
    } catch (error) {
      console.error('File selection error:', error);
      Alert.alert('File Selection Error', 'Failed to select file. Please try again.');
    }
  };

  const handleExport = async () => {
    if (appData.sessions.length === 0) {
      Alert.alert('No Data', 'There are no sessions to export.');
      return;
    }

    const filteredSessions = filterSessionsByDateRange(appData.sessions);

    if (filteredSessions.length === 0) {
      Alert.alert('No Data', 'No sessions found for the selected date range.');
      return;
    }

    setIsExporting(true);
    let success = false;

    try {
      if (exportFileType === 'excel') {
        success = await exportToExcel(filteredSessions);
      } else {
        success = await exportToJSON(filteredSessions);
      }

      if (success) {
        Alert.alert('Export Successful', `Exported ${filteredSessions.length} sessions successfully.`);
        setIsExportModalVisible(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'An unexpected error occurred during export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('more.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('more.subtitle')}</Text>
      </View>

      {/* Navigation Items */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.settings')}</Text>
          <View style={styles.cardContainer}>
            {navItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navItem,
                  index === 0 && styles.navItemFirst,
                  index === navItems.length - 1 && styles.navItemLast,
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.navItemIcon}>
                  {item.icon}
                </View>
                <View style={styles.navItemContent}>
                  <Text style={styles.navItemTitle}>{item.title}</Text>
                  <Text style={styles.navItemSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRightIcon size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Export Modal */}
        <Modal
          visible={isExportModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsExportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Export Data</Text>
              <Text style={styles.modalSubtitle}>Select date range and file type</Text>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Date Range</Text>
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={[styles.optionButton, exportDateRange === 'month' && styles.optionButtonSelected]}
                    onPress={() => setExportDateRange('month')}
                  >
                    <Text style={[styles.optionText, exportDateRange === 'month' && styles.optionTextSelected]}>Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, exportDateRange === 'year' && styles.optionButtonSelected]}
                    onPress={() => setExportDateRange('year')}
                  >
                    <Text style={[styles.optionText, exportDateRange === 'year' && styles.optionTextSelected]}>Year</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, exportDateRange === 'range' && styles.optionButtonSelected]}
                    onPress={() => setExportDateRange('range')}
                  >
                    <Text style={[styles.optionText, exportDateRange === 'range' && styles.optionTextSelected]}>Range</Text>
                  </TouchableOpacity>
                </View>
                {exportDateRange === 'range' && (
                  <View style={styles.dateRangeContainer}>
                    <View style={styles.datePickerRow}>
                      <Text style={styles.datePickerLabel}>From:</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowStartDatePicker(true)}
                      >
                        <Text style={styles.datePickerText}>
                          {exportStartDate.toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerRow}>
                      <Text style={styles.datePickerLabel}>To:</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowEndDatePicker(true)}
                      >
                        <Text style={styles.datePickerText}>
                          {exportEndDate.toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>File Type</Text>
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={[styles.optionButton, exportFileType === 'excel' && styles.optionButtonSelected]}
                    onPress={() => setExportFileType('excel')}
                  >
                    <Text style={[styles.optionText, exportFileType === 'excel' && styles.optionTextSelected]}>Excel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, exportFileType === 'text' && styles.optionButtonSelected]}
                    onPress={() => setExportFileType('text')}
                  >
                    <Text style={[styles.optionText, exportFileType === 'text' && styles.optionTextSelected]}>Text</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsExportModalVisible(false)}
                  disabled={isExporting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.actionButton, isExporting && styles.actionButtonDisabled]}
                  onPress={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <Text style={styles.actionButtonText}>Export</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={exportStartDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setExportStartDate(selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={exportEndDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setExportEndDate(selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Import Modal */}
        <Modal
          visible={isImportModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setIsImportModalVisible(false);
            setSelectedImportFile(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Import Data</Text>
              <Text style={styles.modalSubtitle}>Select an Excel (.xlsx) or JSON (.json) file to import sessions</Text>

              <TouchableOpacity
                style={styles.filePickerButton}
                onPress={handleFileSelection}
                disabled={isImporting}
              >
                <Text style={styles.filePickerText}>
                  {selectedImportFile ? selectedImportFile.name : 'Select File'}
                </Text>
              </TouchableOpacity>

              {selectedImportFile && (
                <View style={styles.selectedFileContainer}>
                  <Text style={styles.selectedFileText}>
                    Selected: {selectedImportFile.name}
                  </Text>
                  <Text style={styles.selectedFileHint}>
                    This will add new sessions to your existing data, skipping duplicates.
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsImportModalVisible(false);
                    setSelectedImportFile(null);
                  }}
                  disabled={isImporting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.actionButton, isImporting && styles.actionButtonDisabled]}
                  onPress={handleImport}
                  disabled={isImporting || !selectedImportFile}
                >
                  {isImporting ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <Text style={styles.actionButtonText}>Import</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Attenary</Text>
          <Text style={styles.footerSubtext}>Time Tracking Made Simple</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.bgMain,
  },
  headerTitle: {
    fontSize: fonts.sizes.hero,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.md,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold as any,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  cardContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navItemFirst: {
    borderTopLeftRadius: borderRadius.card,
    borderTopRightRadius: borderRadius.card,
  },
  navItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: borderRadius.card,
    borderBottomRightRadius: borderRadius.card,
  },
  navItemIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgGlassLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  navItemContent: {
    flex: 1,
  },
  navItemTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.medium as any,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  navItemSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  footerText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.medium as any,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 400,
    ...shadows.card,
  },
  modalTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.medium as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.textWhite,
  },
  filePickerButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  filePickerText: {
    fontSize: fonts.sizes.md,
    color: colors.textPrimary,
  },
  selectedFileContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgGlassLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedFileText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.medium as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedFileHint: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.bgGlassLight,
  },
  cancelButtonText: {
    fontSize: fonts.sizes.md,
    color: colors.textPrimary,
  },
  actionButton: {
    backgroundColor: colors.primary,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: fonts.sizes.md,
    color: colors.textPrimary,
  },
  dateRangeContainer: {
    marginTop: spacing.md,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  datePickerLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    width: 50,
    marginRight: spacing.sm,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgGlassLight,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
  },
});

export default MoreScreen;
