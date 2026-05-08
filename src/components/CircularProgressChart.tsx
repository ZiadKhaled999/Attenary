import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, spacing, fonts, borderRadius, shadows } from '../theme/colors';
import CompactTimeStats from './CompactTimeStats';

interface CircularProgressChartProps {
  data: {
    label: string;
    value: number;
    color: string;
    ringIndex?: number;
  }[];
  centerLabel?: string;
  centerValue?: string;
  title?: string;
  showAnimation?: boolean;
  interactive?: boolean;
  onSegmentPress?: (index: number, item: any) => void;
  darkMode?: boolean;
}

const CircularProgressChart: React.FC<CircularProgressChartProps> = ({
  data,
  centerLabel,
  centerValue,
  title,
  showAnimation = true,
  interactive = true,
  onSegmentPress,
  darkMode = true
}) => {
  const [animatedValues] = useState(data.map(() => new Animated.Value(0)));
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  // Detect low-end devices for simplified animations
  const isLowEndDevice = Platform.OS === 'android' || Dimensions.get('window').width < 360;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Glassmorphism theme colors
  const theme = {
    background: colors.bgCard,
    cardBackground: colors.bgCard,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    border: colors.border,
    borderAccent: colors.borderAccent,
    circleBg: 'rgba(255, 255, 255, 0.05)',
    glowPrimary: colors.primaryGlow,
  };

  const svgSize = 200;
  const center = svgSize / 2;
  
  // Ring configurations with neon glow effect
  const circles = [
    { radius: 55, strokeWidth: 10, bgStrokeWidth: 6 },
    { radius: 42, strokeWidth: 10, bgStrokeWidth: 6 },
    { radius: 29, strokeWidth: 10, bgStrokeWidth: 6 },
  ];
  
  const getCircumference = (radius: number) => 2 * Math.PI * radius;

  useEffect(() => {
    if (showAnimation && !isLowEndDevice) {
      const animations = data.map((_, index) =>
        Animated.timing(animatedValues[index], {
          toValue: 1,
          duration: 600 + index * 150, // Reduced duration for better performance
          useNativeDriver: false,
        })
      );

      Animated.stagger(100, animations).start(); // Reduced stagger delay
    } else {
      // Disable animations for low-end devices or when showAnimation is false
      animatedValues.forEach(value => value.setValue(1));
    }
  }, [showAnimation, isLowEndDevice]);

  const handleSegmentPress = (index: number, item: any) => {
    if (!interactive) return;
    
    setPressedIndex(index);
    setTimeout(() => setPressedIndex(null), 200);
    
    if (onSegmentPress) {
      onSegmentPress(index, item);
    }
  };

  const renderCircularChart = () => {
    return (
      <View style={styles.chartContainer}>
        {/* Glow effect behind chart */}
        <View style={styles.chartGlow} />
        
        <Svg 
          width={svgSize} 
          height={svgSize} 
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          {circles.map((circleConfig, index) => {
            const dataItem = data[index] || { value: 0, color: colors.textMuted };
            const circumference = getCircumference(circleConfig.radius);
            const strokeDasharray = `${(dataItem.value / 100) * circumference}, ${circumference}`;
            
            return (
              <React.Fragment key={index}>
                {/* Background ring */}
                <Circle
                  cx={center}
                  cy={center}
                  r={circleConfig.radius}
                  fill="none"
                  stroke={theme.circleBg}
                  strokeWidth={circleConfig.bgStrokeWidth}
                />
                {/* Progress ring with glow */}
                <Circle
                  cx={center}
                  cy={center}
                  r={circleConfig.radius}
                  fill="none"
                  stroke={dataItem.color}
                  strokeWidth={circleConfig.strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  opacity={0.9}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Get color based on label type
  const getLegendColor = (label: string, defaultColor: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('completed') || lowerLabel.includes('done')) {
      return colors.primary;
    } else if (lowerLabel.includes('remaining') || lowerLabel.includes('left')) {
      return colors.info;
    } else if (lowerLabel.includes('overtime') || lowerLabel.includes('extra')) {
      return colors.warning;
    }
    return defaultColor;
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.cardBackground, 
      borderColor: theme.border,
    }]}>
      {/* Title Header */}
      {title && (
        <View style={styles.headerContainer}>
          <View style={styles.titleIconContainer}>
            <View style={styles.titleIconGlow} />
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>Live</Text>
          </View>
        </View>
      )}
      
      {/* Chart Section */}
      <View style={styles.chartSection}>
        <View style={styles.chartWrapper}>
          {renderCircularChart()}
        </View>
      </View>

      {/* Time Stats - Now positioned below the chart */}
      <CompactTimeStats
        stats={data.map((item, index) => {
          const hours = Math.floor(item.value * 24 / 100);
          const minutes = Math.floor((item.value * 24 % 100) * 0.6);
          const color = getLegendColor(item.label, item.color);
          return {
            label: item.label.toUpperCase(),
            hours,
            minutes,
            color: color,
            backgroundColor: `${color}30`,
          };
        })}
      />
      
      {/* Legend and Progress Summary */}
      <View style={styles.legendContainer}>
        <View style={styles.legend}>
          {data.map((item, index) => {
            const animatedScale = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            });
            
            const isPressed = pressedIndex === index;
            const legendColor = getLegendColor(item.label, item.color);
            
            return (
              <Animated.View 
                key={`legend-${index}`} 
                style={[
                  styles.legendItem,
                  {
                    transform: [{ scale: animatedScale }],
                    opacity: isPressed ? 0.7 : 1,
                    borderColor: legendColor + '30',
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.legendContent}
                  onPress={() => handleSegmentPress(index, item)}
                  activeOpacity={interactive ? 0.7 : 1}
                  disabled={!interactive}
                >
                  <View style={styles.legendLeft}>
                    <View 
                      style={[
                        styles.legendColor, 
                        { backgroundColor: legendColor },
                        isPressed && styles.legendColorPressed
                      ]} 
                    />
                    <View style={styles.legendTextContainer}>
                      <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>
                        {item.label}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.legendValueContainer, { backgroundColor: legendColor + '15' }]}>
                    <Text style={[styles.legendValue, { color: legendColor }]}>
                      {item.value}%
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Progress Summary */}
        <View style={[styles.progressSummary, { borderTopColor: theme.border }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Progress</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{Math.round(total)}%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressBarBackground, { backgroundColor: theme.circleBg }]}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  {
                    width: animatedValues[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: colors.primary,
                  }
                ]}
              />
              {/* Glow effect on progress bar */}
              <Animated.View 
                style={[
                  styles.progressBarGlow,
                  {
                    width: animatedValues[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]}
              />
            </View>
          </View>
          
          {/* Summary Stats Row */}
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatLabel, { color: theme.textMuted }]}>Completed</Text>
              <Text style={[styles.summaryStatValue, { color: colors.primary }]}>
                {data[0]?.value || 0}%
              </Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatLabel, { color: theme.textMuted }]}>Remaining</Text>
              <Text style={[styles.summaryStatValue, { color: colors.info }]}>
                {data[1]?.value || 0}%
              </Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatLabel, { color: theme.textMuted }]}>Overtime</Text>
              <Text style={[styles.summaryStatValue, { color: colors.warning }]}>
                {data[2]?.value || 0}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  titleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    marginRight: spacing.md,
  },
  titleIconGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 15,
    backgroundColor: colors.primaryGlow,
    opacity: 0.3,
  },
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    flex: 1,
  },
  titleBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  titleBadgeText: {
    fontSize: fonts.sizes.xs,
    color: colors.primary,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chartGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -70,
    marginTop: -70,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryGlow,
    opacity: 0.15,
  },
  legendContainer: {
    gap: 12,
  },
  legend: {
    gap: 10,
    marginBottom: 20,
  },
  legendItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  legendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.md,
    ...shadows.neonGlowSubtle,
  },
  legendColorPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.8,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  legendValueContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  legendValue: {
    fontSize: fonts.sizes.md,
    fontWeight: '700' as const,
    fontFamily: 'monospace',
  },
  progressSummary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  summaryValueContainer: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  summaryValue: {
    fontSize: fonts.sizes.lg,
    fontWeight: '800' as const,
    fontFamily: 'monospace',
  },
  progressBar: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarGlow: {
    position: 'absolute',
    top: -4,
    height: 16,
    backgroundColor: colors.primaryGlow,
    opacity: 0.4,
    borderRadius: 8,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  summaryStatLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryStatValue: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700' as const,
    fontFamily: 'monospace',
  },
});

export default CircularProgressChart;
