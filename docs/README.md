# ATTENARY - React Native Mobile App

A professional, high-performance mobile application built with React Native and Expo that replicates the functionality of the original HTML pharmacy attendance system with a modern, intuitive user interface.

## Features

### Core Functionality
- **Time Clock Management**: Check-in and check-out system for pharmacy employees
- **Employee Profiles**: Create and manage employee profiles
- **Real-time Tracking**: Live tracking of active employees and session durations
- **Daily Logs**: View today's attendance sessions with detailed information
- **Monthly Reports**: Comprehensive monthly statistics and summaries
- **History & Calendar**: Calendar view with detailed session history
- **Analytics Dashboard**: Visual charts and performance metrics
- **Employee Comparison**: Side-by-side comparison of employee statistics
- **Data Privacy**: PIN-based encryption for sensitive employee data
- **Backup & Export**: Export attendance data for external use

### Key Features
- **Offline-First**: All data stored locally on the device
- **Modern UI**: Beautiful, responsive design with dark theme
- **Professional Design**: Clean, intuitive interface optimized for pharmacy workflows
- **Data Security**: Employee data privacy through PIN protection
- **Real-time Updates**: Live session tracking and statistics
- **Cross-Platform**: Works on both iOS and Android

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- Expo CLI
- Yarn or npm

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Scan the QR code with the Expo Go app on your mobile device
   - Or use the simulator options in the Expo development server

## App Structure

```
src/
├── components/          # Reusable UI components
│   ├── CheckInModal.tsx
│   ├── CheckOutModal.tsx
│   └── PINModal.tsx
├── screens/             # Main application screens
│   ├── TimeClockScreen.tsx
│   ├── DailyLogScreen.tsx
│   ├── MonthlyReportScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── AnalyticsScreen.tsx
│   ├── CompareScreen.tsx
│   └── ManageScreen.tsx
├── context/             # React Context for state management
│   └── AppContext.tsx
├── navigation/          # App navigation setup
│   └── Navigation.tsx
├── theme/               # Theme and styling system
│   ├── ThemeContext.tsx
│   └── colors.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── timeUtils.ts
└── App.js               # Main application entry point
```

## Screenshots

### Time Clock Screen
- Real-time clock display
- Active employee tracking
- Quick check-in/check-out buttons
- Today's statistics overview

### Daily Log Screen
- Today's attendance sessions
- Employee session details
- Duration tracking
- PIN-protected data access

### Monthly Report Screen
- Monthly statistics summary
- Employee performance metrics
- Days worked tracking
- Average hours analysis

### Analytics Dashboard
- Interactive charts and graphs
- Performance visualization
- Time-based analytics
- Employee comparison charts

### History & Calendar
- Calendar view of attendance
- Session detail modal
- Date-specific filtering
- Historical data access

## Data Management

### Storage
- Uses AsyncStorage for local data persistence
- All employee profiles and sessions stored locally
- No internet connection required for basic functionality

### Privacy & Security
- Employee data protected by 6-digit PINs
- Unlocked data shows full details
- Locked data displays masked information (***)
- Individual employee PIN management

### Backup & Export
- Export attendance data to JSON format
- Timestamped backup files
- Complete data including sessions and profiles
- Ready for external processing or archiving

## Usage Guide

### Getting Started
1. Open the app and you'll see the Time Clock screen
2. Use "Check In" to add new employees or select existing ones
3. Use "Check Out" to end employee sessions
4. Navigate through the bottom tabs to access different features

### Employee Management
- **Adding Employees**: Use Check In modal to create new profiles
- **PIN Setup**: First unlock prompts PIN creation
- **Data Privacy**: Employees can lock/unlock their data
- **Profile Management**: Delete employees from Manage screen

### Session Tracking
- **Real-time Updates**: Active sessions update every second
- **Duration Calculation**: Automatic time tracking
- **Session History**: Complete record of all check-ins/check-outs
- **Status Indicators**: Clear active/completed session status

## Technical Details

### Technologies Used
- **React Native**: Cross-platform mobile development
- **Expo**: Development framework and tools
- **AsyncStorage**: Local data persistence
- **React Navigation**: Screen navigation
- **TypeScript**: Type-safe development (basic support)
- **React Context**: State management

### Design System
- **Color Palette**: Dark theme with purple/blue accents
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: Consistent spacing system
- **Components**: Reusable, accessible UI components
- **Responsive**: Works on various screen sizes

### Performance
- **Optimized Rendering**: Efficient list rendering with FlatList
- **State Management**: Context-based with minimal re-renders
- **Memory Usage**: Efficient data structures
- **Smooth Animations**: Native animations for modals and transitions

## Development

### Adding New Features
1. Create new screens in `src/screens/`
2. Add navigation in `src/navigation/Navigation.tsx`
3. Update types in `src/types/index.ts`
4. Add utility functions in `src/utils/`
5. Create components in `src/components/`

### Styling Guidelines
- Use the color system from `src/theme/colors.ts`
- Follow spacing guidelines (4px, 8px, 12px, 16px, 20px, 24px, 32px)
- Use border radius values (8px, 12px, 16px, 20px, 24px, 9999px)
- Maintain consistent typography hierarchy

### Testing
- Test on both iOS and Android simulators
- Verify functionality on different screen sizes
- Test offline scenarios
- Validate data persistence across app restarts

## Troubleshooting

### Common Issues
1. **App won't start**: Ensure all dependencies are installed
2. **Data not saving**: Check AsyncStorage permissions
3. **Navigation issues**: Verify Expo and React Navigation versions
4. **Styling problems**: Check theme context setup

### Reset Data
To reset all app data:
1. Clear app data from device settings
2. Or uninstall and reinstall the app
3. Or implement a data reset feature in Manage screen

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the Expo documentation
- Review React Native best practices
- Test on physical devices when possible
- Use Expo Go for development testing

---

**Note**: This mobile app is a complete rewrite of the original HTML system, designed specifically for mobile devices with enhanced UX/UI and modern development practices.