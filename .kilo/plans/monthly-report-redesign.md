# MonthlyReportScreen Redesign Plan

## Objective
Rewrite `src/screens/MonthlyReportScreen.tsx` to match `assets/Redesign-Pages/Monthly Report.html` exactly, using real data from `appData.sessions`.

---

## Steps

### 1. Rewrite component header, imports, and structure
- Remove: `CircularProgressChart`, `ComponentErrorBoundary`, `Image`, `CalendarIcon`, `ClockIcon`, `SessionIcon` utilities
- Add: `Svg`, `Rect`, `Line`, `Text as SvgText`, `Pressable`, `useState`, `useMemo`, `useRef`, `useCallback`, `Dimensions`, `Platform` from `react-native-svg`
- Keep: `useApp`, `touch/gesture` utilities, `theme` tokens (colors, spacing, borderRadius, fonts, shadows)
- Keep file path and default export name unchanged

---

### 2. Top Bar — Title + Year Dropdown
- Title: **"Monthly Report"** in white (`#dadada`), font size 20px (or `fonts.sizes.lg`), bold
- Year button: background `#212121`, border 1px `#363636`, color `#dadada`, font size 12px, font semibold, rounded-lg, padding 6px 12px
- Include chevron down icon (inline SVG or simple unicode ▲/▼)
- Dropdown menu: same background/border as button, absolute positioned, width 96px, rounded-lg, zIndex 50
- Years extracted from `appData.sessions` — distinct years, sorted descending. If no sessions, fallback to current year
- Dropdown closes on outside tap using transparent `Pressable` overlay

---

### 3. Month Carousel
- Horizontal `ScrollView` with `gap: 8px`, hidden scrollbar, `showsHorizontalScrollIndicator={false}`
- 12 month buttons: **Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec**
- Button states:
  - **selected**: `backgroundColor: '#a882ff'`, `color: '#1e1e1e'`, fontWeight 700, shadow 0 2px 8px rgba(168,130,255,0.2), rounded-xl, padding 8px 16px, font size 12px, font semibold
  - **hasData** (sessions exist for month/year, but not selected): `backgroundColor: 'rgba(36,36,36,0.6)'`, `color: '#999999'`, border 1px solid `#2a2a2a`, rounded-xl, padding same, **purple dot** (4px circle, rgba(168,130,255,0.5)) appended as suffix
  - **noData** (no sessions for month/year): `backgroundColor: 'rgba(38,38,38,0.2)'`, `color: '#555555'`, border 1px solid `#262626`, rounded-xl, disabled
- Auto-scroll behavior: use `scrollViewRef` + `measure`/`onLayout` to scroll active pill to left offset 120px

---

### 4. Metrics Grid (3-Column)
- `flexDirection: row`, `gap: 10` (or `spacing.sm + 2`)
- Each card `flex: 1`, `backgroundColor: '#242424'`, border 1px `#2a2a2a`, `borderRadius: 20`, `padding: 14`, `minHeight: 72`, flex-col
- Label: `fontSize: 10`, `fontWeight: 500`, color `#666666`, `textTransform: uppercase`, `letterSpacing: 0.8`, marginTop 4
- Value: `fontSize: 15` (text-base equivalent), `fontWeight: 700`, `fontFamily: 'monospace'`, color `#ffffff`, marginTop 4
- **Tracked** card: add 6x6 purple dot (via `View` with `width: 6`, `height: 6`, `borderRadius: 3`, `backgroundColor: '#a882ff'`) above label
- Value suffixes: `totalHours → ${Math.floor(totalHours)}h`, `totalSessions → plain number`, `activeDays → ${activeDays} d`

---

### 5. Custom SVG Bar Chart (Replaces CircularProgressChart)
Build a fully custom `BarChart` component using `react-native-svg`:

```tsx
interface DayChartData {
  day: number;
  hours: number;
  label: string;
}

const CustomBarChart = ({
  data,
  selectedMonth,
  selectedYear,
}: {
  data: DayChartData[];
  selectedMonth: string;
  selectedYear: number;
}) => {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 48; // 24px padding each side
  const chartHeight = 176; // h-44

  const padding = { top: 4, right: 4, bottom: 0, left: 0 };
  const maxHours = 10;
  const innerWidth = chartWidth - padding.left - padding.right;
  const barSlotWidth = innerWidth / data.length;
  const barWidth = barSlotWidth * 0.75;
  const barGap = barSlotWidth * 0.25;
  const borderRadius = 3;

  return (
    <View style={{ height: chartHeight + 16 }}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Horizontal grid lines at 0, 4, 8 */}
        {[0, 4, 8].map((val) => {
          const y = chartHeight - (val / maxHours) * chartHeight;
          return (
            <Line
              key={val}
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="#2a2a2a"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max(2, (d.hours / maxHours) * chartHeight);
          const x = padding.left + i * barSlotWidth + barGap / 2;
          const yPos = chartHeight - barH;
          return (
            <Rect
              key={i}
              x={x}
              y={yPos}
              width={barWidth}
              height={barH}
              rx={borderRadius}
              ry={borderRadius}
              fill={d.hours > 0 ? 'rgba(168, 130, 255, 0.85)' : 'rgba(54, 54, 54, 0.4)'}
              onPress={() => {
                if (Platform.OS === 'web') {
                  setSelectedBar(selectedBar === i ? null : i);
                }
              }}
            />
          );
        })}
        {/* X-axis labels — only 1st, 5th, 10th, 15th, 20th, 25th, last */}
        {data.map((d, i) => {
          if (!d.label) return null;
          const x = padding.left + i * barSlotWidth + barSlotWidth / 2;
          return (
            <SvgText
              key={i}
              x={x}
              y={chartHeight + 12}
              fill="#666666"
              fontSize={9}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
      {/* Tooltip on press */}
      {selectedBar !== null && data[selectedBar] && (
        <Pressable
          style={[
            styles.tooltip,
            {
              left: Math.min(
                selectedBar * barSlotWidth + barSlotWidth / 2 - 40,
                chartWidth - 80
              ),
              top: chartHeight - (data[selectedBar].hours / maxHours) * chartHeight - 32,
            },
          ]}
          onPress={() => setSelectedBar(null)}
        >
          <Text style={styles.tooltipText}>
            {selectedMonth} {data[selectedBar].day}: {data[selectedBar].hours.toFixed(1)}h
          </Text>
        </Pressable>
      )}
    </View>
  );
};
```

Tooltip style:
```
tooltip: {
  position: 'absolute',
  backgroundColor: '#212121',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: '#2a2a2a',
},
tooltipText: {
  color: '#dadada',
  fontSize: 9,
  fontFamily: 'monospace',
}
```

Note: For web long-press hovering matching HTML tooltip, add `onMouseEnter`/`onMouseLeave` when `Platform.OS === 'web'`, or keep press-to-show for now.

---

### 6. Daily Breakdown Card (Premium)
- Card: `backgroundColor: '#242424'`, border 1px `#2a2a2a`, `borderRadius: 20`, `padding: 16`, flex-col, gap 16
- Header row: purple dot (6x6 rounded-full, bg `#a882ff`) + text **"Daily Breakdown"** (`fontSize: 11`, fontWeight 600, uppercase tracking 0.8, color `#999999`)
- Chart container: `position: relative`, `height: 176` (h-44)
- Render `<CustomBarChart>` inside

---

### 7. Peak Output Card (Premium)
- Same premium card style
- Left column: label **"Peak Output"** (`fontSize: 10`, fontWeight 600, uppercase, color `#999999`) + sublabel **"Highest single-day focus duration"** (`fontSize: 11`, color `#666666`, marginTop 2)
- Right column: `peakOutput.toFixed(1) + ' hrs'`, `fontSize: 16`, fontWeight 700, `fontFamily: 'monospace'`, color `#a882ff`

---

### 8. Data Computation (Real, no mocks)

```tsx
const sessionsInPeriod = useMemo(() => {
  return appData.sessions.filter((s: any) => {
    const d = new Date(s.checkInTime);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
  });
}, [appData.sessions, selectedYear, selectedMonthIndex]);

const dailyHoursMap = useMemo(() => {
  const map: Record<number, number> = {};
  sessionsInPeriod.forEach((s: any) => {
    const day = new Date(s.checkInTime).getDate();
    const dur = s.checkOutTime ? (s.checkOutTime - s.checkInTime) : 0;
    map[day] = (map[day] || 0) + dur;
  });
  return map;
}, [sessionsInPeriod]);

const metrics = useMemo(() => {
  const hoursArr = Object.values(dailyHoursMap);
  const totalSeconds = hoursArr.reduce((sum, s) => sum + s, 0);
  const totalSessions = sessionsInPeriod.length;
  const activeDays = hoursArr.filter((h) => h > 0).length;
  const peakOutput = hoursArr.length > 0 ? Math.max(...hoursArr) / 3600 : 0;
  return {
    totalHours: totalSeconds / 3600,
    totalSessions,
    activeDays,
    peakOutput,
  };
}, [dailyHoursMap, sessionsInPeriod]);

const chartData = useMemo(() => {
  const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      day,
      hours: (dailyHoursMap[day] || 0) / 3600,
      label:
        day === 1 || day % 5 === 0 || day === daysInMonth ? String(day) : '',
    };
  });
}, [dailyHoursMap, selectedYear, selectedMonthIndex]);

const distinctYears = useMemo(() => {
  const years = new Set(
    appData.sessions.map((s: any) => new Date(s.checkInTime).getFullYear())
  );
  return Array.from(years).sort((a, b) => b - a);
}, [appData.sessions]);

const monthHasData = useCallback(
  (mIndex: number) => {
    return appData.sessions.some((s: any) => {
      const d = new Date(s.checkInTime);
      return d.getFullYear() === selectedYear && d.getMonth() === mIndex;
    });
  },
  [appData.sessions, selectedYear]
);
```

---

### 9. Styles (complete removal of old glass styles)
Replace the full `StyleSheet.create` block with new styles matching the HTML exactly:

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  scrollView: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 48, paddingBottom: 120 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: fonts.sizes.lg, // 17 then override to ~20 if needed
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.5,
  },
  yearButton: {
    backgroundColor: colors.base05,
    borderWidth: 1,
    borderColor: colors.base30,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yearButtonText: {
    color: colors.base100,
    fontSize: 12,
    fontWeight: '600',
  },
  yearDropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  yearDropdown: {
    position: 'absolute',
    right: 0,
    top: 40,
    width: 96,
    borderRadius: 8,
    backgroundColor: colors.base05,
    borderWidth: 1,
    borderColor: colors.base30,
    paddingVertical: 4,
    zIndex: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  yearOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.base60,
    fontWeight: '600',
  },
  monthCarousel: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  monthScrollView: {
    maxHeight: 50,
  },
  monthPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthPillSelected: {
    backgroundColor: colors.fnPurple,
    color: colors.base00,
    borderColor: colors.fnPurple,
    fontWeight: '700',
    shadowColor: colors.fnPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  monthPillActive: {
    backgroundColor: 'rgba(36,36,36,0.6)',
    color: colors.base60,
    borderColor: colors.base25,
  },
  monthPillEmpty: {
    backgroundColor: 'rgba(38,38,38,0.2)',
    color: colors.base40,
    borderColor: colors.base20,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.base10,
    borderWidth: 1,
    borderColor: colors.base25,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'column',
    minHeight: 72,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.base50,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: colors.white,
    marginTop: 4,
  },
  dailyCard: {
    backgroundColor: colors.base10,
    borderWidth: 1,
    borderColor: colors.base25,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.fnPurple,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.base60,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chartContainer: {
    position: 'relative',
    height: 176,
  },
  peakCard: {
    backgroundColor: colors.base10,
    borderWidth: 1,
    borderColor: colors.base25,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  peakLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.base60,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  peakSublabel: {
    fontSize: 11,
    color: colors.base50,
    marginTop: 2,
  },
  peakValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: colors.fnPurple,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#212121',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    zIndex: 50,
  },
  tooltipText: {
    color: '#dadada',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  purpleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(168, 130, 255, 0.5)',
  },
});
```

---

### 10. Validation
- Run `npx expo lint` or `npm run lint` after changes
- Verify: chart renders purple bars on active days, gray on zero days
- Verify: month carousel highlights selected, shows purple dots for hasData, disables noData months
- Verify: year dropdown opens/closes and lists distinct years from session data
- Verify: metrics (Tracked / Sessions / Active Days) match real `appData.sessions`
- Verify: Peak Output displays real `Math.max(...dailyHoursMap) / 3600`

---

### 11. No Mock Data
- All values derived from `appData.sessions`
- No hardcoded stat values; only design tokens (colors, spacing, typography) are hardcoded
- Years dropdown derived dynamically from session dates

---

## Tradeoffs Considered
- **Chart**: Pure SVG chosen over `react-native-chart-kit` to enable per-bar color control (purple for active, gray for inactive), matching HTML exactly.
- **Web tooltip**: Press-to-show implemented; hovering via `onMouseEnter` could be added later.
- **Lag reduction**: `useMemo` for all derived data and stable keys (day number).
