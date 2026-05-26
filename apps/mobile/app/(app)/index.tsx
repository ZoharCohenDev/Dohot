import React, { useRef, useState, useCallback } from 'react';
import { View, Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { DocumentsScreen } from '@/screens/output/DocumentsScreen';
import { CustomersScreen } from '@/screens/customers/CustomersScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { CreateDocumentTypeScreen } from '@/screens/dashboard/CreateDocumentTypeScreen';
import { ROUTES } from '@/navigation/constants';
import { useColors } from '@/theme';
import { useSettings } from '@/context/SettingsContext';
import type { TabId } from '@/components/layout';
import type { DocType } from '@/config/documentTypes';

// Must match the visual order of BottomNav (flexDirection: 'row-reverse').
// Data array: ['home','docs','create','customers','me']
// Visual left→right:  me | customers | create | docs | home
// Higher data index = further LEFT visually.
const TAB_ORDER: TabId[] = ['home', 'docs', 'create', 'customers', 'me'];

const SCREEN_W = Dimensions.get('window').width;
const DURATION = 300;
// Smooth deceleration — fast start, eases to rest. Matches iOS native feel.
const EASING = Easing.bezier(0.25, 0.1, 0.25, 1.0);

export default function AppIndex() {
  const router = useRouter();
  const colors = useColors();
  const { dark, toggleTheme } = useSettings();

  // `stableTab`  — the screen currently occupying the center (slideOut starts at 0).
  // `incomingTab`— the screen sliding in; null when no transition is active.
  const [stableTab, setStableTab] = useState<TabId>('home');
  const [incomingTab, setIncomingTab] = useState<TabId | null>(null);
  const stableTabRef = useRef<TabId>('home');
  const isTransitioning = useRef(false);

  // slideOut: animates the LEAVING screen (0 → off-screen).
  //   Never reset with setValue before a transition — it's already at 0.
  // slideIn:  animates the ENTERING screen (off-screen → 0).
  //   Set to enterFrom BEFORE incomingTab is rendered, so no existing
  //   view is ever teleported.
  const slideOut = useRef(new Animated.Value(0)).current;
  const slideIn  = useRef(new Animated.Value(SCREEN_W)).current;

  const navigateToTab = useCallback((targetTab: TabId) => {
    if (isTransitioning.current) return;
    const currentIdx = TAB_ORDER.indexOf(stableTabRef.current);
    const targetIdx  = TAB_ORDER.indexOf(targetTab);
    if (currentIdx === targetIdx) return;

    // Higher data index = further left visually (row-reverse nav bar).
    const goingLeft  = targetIdx > currentIdx;
    const enterFrom  = goingLeft ? -SCREEN_W : SCREEN_W;
    const exitTo     = -enterFrom;

    isTransitioning.current = true;
    stableTabRef.current = targetTab;

    // Position the incoming screen off-screen BEFORE React renders it.
    // slideOut is untouched — the stable screen stays at 0, no teleport.
    slideIn.setValue(enterFrom);
    setIncomingTab(targetTab);

    Animated.parallel([
      Animated.timing(slideOut, {
        toValue: exitTo,
        duration: DURATION,
        easing: EASING,
        useNativeDriver: true,
      }),
      Animated.timing(slideIn, {
        toValue: 0,
        duration: DURATION,
        easing: EASING,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        // Promote incoming → stable; reset slideOut for the next transition.
        slideOut.setValue(0);
        setStableTab(targetTab);
        setIncomingTab(null);
      }
      isTransitioning.current = false;
    });
  }, [slideOut, slideIn]);

  const renderTab = (tab: TabId): React.ReactElement | null => {
    switch (tab) {
      case 'home':
        return (
          <DashboardScreen
            colors={colors}
            onNavigate={navigateToTab}
            onCreateType={() => navigateToTab('create')}
            onCreateReport={() => router.push(ROUTES.WIZARD_VOICE_IDLE)}
          />
        );
      case 'docs':
        return <DocumentsScreen colors={colors} onNavigate={navigateToTab} />;
      case 'create':
        return (
          <CreateDocumentTypeScreen
            colors={colors}
            onNavigate={navigateToTab}
            onSelectType={(docType: DocType) =>
              router.push(`${ROUTES.WIZARD_CUSTOMER}?docType=${docType}` as never)
            }
          />
        );
      case 'customers':
        return <CustomersScreen colors={colors} onNavigate={navigateToTab} />;
      case 'me':
        return (
          <SettingsScreen
            dark={dark}
            colors={colors}
            onToggleTheme={toggleTheme}
            onNavigate={navigateToTab}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Exiting screen — starts centered, slides out */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideOut }] }]}
        pointerEvents={incomingTab !== null ? 'none' : 'auto'}
      >
        {renderTab(stableTab)}
      </Animated.View>

      {/* Entering screen — starts off-screen, slides to center */}
      {incomingTab !== null && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideIn }] }]}
        >
          {renderTab(incomingTab)}
        </Animated.View>
      )}
    </View>
  );
}
