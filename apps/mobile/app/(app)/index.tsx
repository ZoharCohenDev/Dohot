// Keep-alive tab navigator — each screen mounts exactly once (lazily on first
// visit) and is parked off-screen between visits.  This eliminates the
// remount cost and repeated API calls that caused the "stuck" feeling during
// tab transitions.
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

// Parking position for off-screen (inactive) tabs.  Must be far enough that
// a tab at this offset is never visible even on the largest device during a
// full-width slide animation (SCREEN_W * 3 ≈ 1200 px on a large phone).
const HIDDEN = SCREEN_W * 3;

export default function AppIndex() {
  const router = useRouter();
  const colors = useColors();
  const { dark, toggleTheme } = useSettings();

  // `stableTab`  — the screen currently at translateX 0 (fully visible).
  // `incomingTab`— the screen currently sliding in; null between transitions.
  const [stableTab, setStableTab] = useState<TabId>('home');
  const [incomingTab, setIncomingTab] = useState<TabId | null>(null);
  const stableTabRef = useRef<TabId>('home');
  const isTransitioning = useRef(false);

  // Track which tabs have been visited at least once.
  // A tab is added on first visit and never removed — it stays alive in the
  // tree indefinitely so its hook state and loaded data are preserved.
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(
    () => new Set<TabId>(['home']),
  );

  // One Animated.Value per tab for translateX.
  // 'home' starts at 0 (visible); all others start parked off-screen.
  const tabTranslate = useRef<Record<TabId, Animated.Value>>({
    home:      new Animated.Value(0),
    docs:      new Animated.Value(HIDDEN),
    create:    new Animated.Value(HIDDEN),
    customers: new Animated.Value(HIDDEN),
    me:        new Animated.Value(HIDDEN),
  }).current;

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
    const fromTab = stableTabRef.current;
    stableTabRef.current = targetTab;

    // Lazily add the incoming tab to the tree on its first visit.
    // If already mounted, this returns the same Set reference → no re-render.
    setMountedTabs(prev => {
      if (prev.has(targetTab)) return prev;
      const next = new Set(prev);
      next.add(targetTab);
      return next;
    });

    // Position the incoming screen at the edge *before* React renders it, so
    // it never appears at its previous parked position for even one frame.
    tabTranslate[targetTab].setValue(enterFrom);
    setIncomingTab(targetTab);

    Animated.parallel([
      Animated.timing(tabTranslate[fromTab], {
        toValue: exitTo,
        duration: DURATION,
        easing: EASING,
        useNativeDriver: true,
      }),
      Animated.timing(tabTranslate[targetTab], {
        toValue: 0,
        duration: DURATION,
        easing: EASING,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        // Park the outgoing tab far off-screen.  The snap is invisible because
        // the tab just animated to the screen edge (exitTo ≈ ±SCREEN_W);
        // moving it further to HIDDEN produces no visible change.
        tabTranslate[fromTab].setValue(HIDDEN);
        setStableTab(targetTab);
        setIncomingTab(null);
      }
      isTransitioning.current = false;
    });
  }, [tabTranslate]);

  // Stable callbacks — memoised once so React.memo'd screens never re-render
  // just because the parent re-renders during a transition.
  const onCreateReport = useCallback(
    () => router.push(ROUTES.WIZARD_VOICE_IDLE as never),
    [router],
  );
  const onCreateType = useCallback(
    () => navigateToTab('create'),
    [navigateToTab],
  );
  const onSelectDocType = useCallback(
    (docType: DocType) => router.push(`${ROUTES.WIZARD_CUSTOMER}?docType=${docType}` as never),
    [router],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      {TAB_ORDER.map((tab) => {
        // Don't render tabs that have never been visited (lazy mount).
        if (!mountedTabs.has(tab)) return null;

        // Only the fully-visible stable tab (with no pending transition)
        // should receive touch events.
        const pointerEvents =
          tab === stableTab && incomingTab === null ? 'auto' : 'none';

        return (
          <Animated.View
            key={tab}
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ translateX: tabTranslate[tab] }] },
            ]}
            pointerEvents={pointerEvents}
          >
            {tab === 'home' && (
              <DashboardScreen
                colors={colors}
                onNavigate={navigateToTab}
                onCreateType={onCreateType}
                onCreateReport={onCreateReport}
              />
            )}
            {tab === 'docs' && (
              <DocumentsScreen colors={colors} onNavigate={navigateToTab} />
            )}
            {tab === 'create' && (
              <CreateDocumentTypeScreen
                colors={colors}
                onNavigate={navigateToTab}
                onSelectType={onSelectDocType}
              />
            )}
            {tab === 'customers' && (
              <CustomersScreen colors={colors} onNavigate={navigateToTab} />
            )}
            {tab === 'me' && (
              <SettingsScreen
                dark={dark}
                colors={colors}
                onToggleTheme={toggleTheme}
                onNavigate={navigateToTab}
              />
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}
