# Navbar Design Specification

## Reference Image Analysis
**Source:** `mobile-app/assets/original-0136ac4705ba7a5d4c13bd17f9de72fb.jpg`  
**Image Dimensions:** 410×107 pixels

---

## 1. Overview

This document provides detailed design specifications for a modern bottom navigation bar with a dark theme, featuring an active icon container with accent colors and inactive icons in muted gray tones.

---

## 2. Dimensions & Layout

### 2.1 Total Navbar Dimensions
| Property | Value |
|----------|-------|
| Total Height | 107px |
| Width | 100% (full screen width) |
| Top Dark Strip Height | 27px |
| Main Navbar Area Height | 80px |

### 2.2 Layout Structure
```
┌─────────────────────────────────────────────────────┐
│                  Top Dark Strip                      │ 27px
│                    #131416                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│    ┌──────────┐                                     │
│    │  ACTIVE  │     ○  ○  ○  ○  ○  ○               │ 80px
│    │  ICON    │    inactive icons                   │
│    └──────────┘                                     │
│                  Main Navbar Area                    │
│                    #1e1f24                          │
└─────────────────────────────────────────────────────┘
```

---

## 3. Background Styling

### 3.1 Color Palette

| Element | Hex Code | RGB | Usage |
|---------|----------|-----|-------|
| Top Strip | `#131416` | rgb(19, 20, 22) | Dark accent strip at top |
| Main Background | `#1e1f24` | rgb(30, 31, 36) | Primary navbar background |
| Border/Separator | `#1e1f23` | rgb(30, 31, 35) | Subtle border lines |
| Container Background | `#2c2b3d` | rgb(44, 43, 61) | Active icon container |

### 3.2 Background CSS Properties
```css
.navbar {
  background-color: #1e1f24;
  border-top: 1px solid #1e1f23;
}

.navbar-top-strip {
  background-color: #131416;
  height: 27px;
}
```

### 3.3 Transparency & Blur
- **No visible transparency** - solid colors throughout
- **No blur effects** detected in the reference image
- **No gradient overlays** - flat color backgrounds

---

## 4. Active Icon Container

### 4.1 Container Dimensions
| Property | Value |
|----------|-------|
| Width | ~100px (estimated for single icon) |
| Height | 46px |
| Corner Radius | ~12px |

### 4.2 Container Styling
```css
.active-icon-container {
  background-color: #2c2b3d;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 4.3 Container Colors (Detailed)
| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary | `#2c2b3d` | Main container background |
| Secondary | `#2c2b3b` | Container edge/gradient |
| Tertiary | `#2d2c3c` | Container highlight areas |

---

## 5. Icon Treatment

### 5.1 Active Icon Accent Color

| Property | Value |
|----------|-------|
| Primary Accent | `#9e87fb` |
| RGB | rgb(158, 135, 251) |
| Color Range | `#9480ef` to `#a392f8` |
| Average | rgb(156, 136, 242) |

**Accent Color Palette:**
| Shade | Hex Code | Usage |
|-------|----------|-------|
| Light | `#a392f8` | Highlight areas |
| Primary | `#9e87fb` | Main icon color |
| Dark | `#9480ef` | Shadow areas |

### 5.2 Inactive Icon Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| Primary Gray | `#65666b` | rgb(101, 102, 107) | Main inactive color |
| Light Gray | `#737479` | rgb(115, 116, 121) | Highlight areas |
| Dark Gray | `#525358` | rgb(82, 83, 88) | Shadow areas |

**Inactive Icon Color Range:**
- Minimum: `#45464b` (darkest gray)
- Maximum: `#737479` (lightest gray)
- Average: `#606166`

### 5.3 Icon Size Specifications
| Property | Active | Inactive |
|----------|--------|----------|
| Icon Size | 24×24 px | 24×24 px |
| Container Padding | 12px (top/bottom), 16px (left/right) | None |
| Visual Size with Container | ~72×22 px | ~24×24 px |

### 5.4 Icon CSS Properties
```css
/* Active Icon */
.active-icon {
  color: #9e87fb;
  width: 24px;
  height: 24px;
}

/* Inactive Icon */
.inactive-icon {
  color: #65666b;
  width: 24px;
  height: 24px;
}
```

---

## 6. Spacing & Padding

### 6.1 Internal Container Padding
| Side | Value |
|------|-------|
| Top | 12px |
| Bottom | 12px |
| Left | 16px |
| Right | 16px |

### 6.2 Icon Spacing (Estimated)
| Measurement | Value |
|-------------|-------|
| Gap between icons | ~30-55px |
| Center-to-center distance | ~70-90px |
| Edge padding | ~8px |

---

## 7. Typography

### 7.1 Text Labels
- **No visible text labels** in the reference image
- Icon-only navigation design
- If labels are needed, recommended specifications:

```css
.navbar-label {
  font-size: 11px;
  font-weight: 600;
  color: #65666b; /* inactive */
  margin-top: 4px;
}

.navbar-label-active {
  color: #9e87fb; /* active accent */
}
```

---

## 8. Interactive States

### 8.1 Active State
| Property | Value |
|----------|-------|
| Container Background | `#2c2b3d` |
| Icon Color | `#9e87fb` (violet/purple) |
| Container Visible | Yes |
| Corner Radius | 12px |

### 8.2 Inactive State
| Property | Value |
|----------|-------|
| Container Background | None (transparent) |
| Icon Color | `#65666b` (gray) |
| Container Visible | No |

### 8.3 Hover/Pressed States (Recommended)
```css
/* Hover State */
.inactive-icon:hover {
  color: #737479; /* Lighter gray */
}

/* Pressed State */
.inactive-icon:active {
  color: #525358; /* Darker gray */
  transform: scale(0.95);
}
```

---

## 9. Shadow & Elevation

### 9.1 Current Implementation
- **No visible shadow** on the navbar itself
- **No elevation** detected (flat design)
- **No blur effects** on background

### 9.2 Recommended Enhancements
```css
/* Optional: Add subtle elevation */
.navbar {
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.25);
  elevation: 20;
}

/* Optional: Active container glow */
.active-icon-container {
  box-shadow: 0 0 20px rgba(158, 135, 251, 0.3);
}
```

---

## 10. CSS Implementation Reference

### 10.1 Complete Navbar Styles
```css
/* Main Navbar Container */
.navbar {
  background-color: #1e1f24;
  border-top: 1px solid #1e1f23;
  height: 80px;
  padding-bottom: 12px;
  padding-top: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}

/* Top Dark Strip */
.navbar-top-strip {
  background-color: #131416;
  height: 27px;
  width: 100%;
}

/* Active Icon Container */
.active-icon-container {
  background-color: #2c2b3d;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Active Icon */
.active-icon {
  color: #9e87fb;
  width: 24px;
  height: 24px;
}

/* Inactive Icon */
.inactive-icon {
  color: #65666b;
  width: 24px;
  height: 24px;
}

/* Tab Item */
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 16px;
  margin-horizontal: 2px;
}
```

### 10.2 React Native Implementation
```typescript
const navbarStyles = StyleSheet.create({
  navbar: {
    backgroundColor: '#1e1f24',
    borderTopColor: '#1e1f23',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 12,
    paddingTop: 10,
  },
  topStrip: {
    backgroundColor: '#131416',
    height: 27,
  },
  activeContainer: {
    backgroundColor: '#2c2b3d',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeIcon: {
    color: '#9e87fb',
    width: 24,
    height: 24,
  },
  inactiveIcon: {
    color: '#65666b',
    width: 24,
    height: 24,
  },
  tabItem: {
    borderRadius: 16,
    marginHorizontal: 2,
    paddingVertical: 4,
  },
});
```

---

## 11. Color System Summary

### 11.1 Complete Color Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background Dark | `#131416` | (19, 20, 22) | Top strip |
| Background Main | `#1e1f24` | (30, 31, 36) | Navbar background |
| Border | `#1e1f23` | (30, 31, 35) | Top border |
| Container | `#2c2b3d` | (44, 43, 61) | Active icon container |
| Accent Primary | `#9e87fb` | (158, 135, 251) | Active icon color |
| Accent Light | `#a392f8` | (163, 146, 248) | Active icon highlight |
| Accent Dark | `#9480ef` | (148, 128, 239) | Active icon shadow |
| Gray Primary | `#65666b` | (101, 102, 107) | Inactive icon |
| Gray Light | `#737479` | (115, 116, 121) | Inactive highlight |
| Gray Dark | `#525358` | (82, 83, 88) | Inactive shadow |

### 11.2 Color Contrast Ratios
- Active icon on container: ~4.5:1 (good visibility)
- Inactive icon on background: ~3.2:1 (acceptable for secondary elements)

---

## 12. Responsive Considerations

### 12.1 Breakpoints
| Screen Size | Icon Size | Container Size | Spacing |
|-------------|-----------|----------------|---------|
| Small (<375px) | 20px | 80×40px | 24px |
| Medium (375-414px) | 24px | 100×46px | 30px |
| Large (>414px) | 28px | 110×50px | 36px |

### 12.2 Safe Area Considerations
```css
.navbar {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
```

---

## 13. Animation Recommendations

### 13.1 Transition Effects
```css
/* Smooth color transitions */
.navbar-icon {
  transition: color 0.2s ease-in-out;
}

/* Container appearance animation */
.active-icon-container {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## 14. Accessibility

### 14.1 Color Contrast
- Active state meets WCAG AA standards
- Inactive state may need lighter color for better visibility
- Recommended minimum inactive color: `#737479`

### 14.2 Touch Targets
- Minimum touch target: 44×44px (iOS) / 48×48px (Android)
- Current design: ~50px with padding (acceptable)

---

## 15. Implementation Notes

### 15.1 Key Differences from Current Implementation
| Current | Reference | Change Required |
|---------|-----------|-----------------|
| Green accent (`#22c55e`) | Purple accent (`#9e87fb`) | Update accent color |
| Green container | Purple-gray container | Update container color |
| 7 tabs | Icon-only design | Consider reducing tabs or using scrollable tabs |

### 15.2 Migration Steps
1. Update accent color from `#22c55e` to `#9e87fb`
2. Update container background from `#22c55e` to `#2c2b3d`
3. Update inactive icon color from `#64748b` to `#65666b`
4. Adjust corner radius to 12px
5. Remove green fill from active icons, use purple accent instead

---

*Document generated from reference image analysis*  
*Last updated: 2026-02-24*