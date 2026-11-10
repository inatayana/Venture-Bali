'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getBottomNavVisibility, getActiveBottomNavKey } from '@/lib/bottomNavRules';

/**
 * Hook untuk mengelola visibilitas dan state bottom navigation.
 * Menggabungkan: route matching, keyboard detection (visualViewport),
 * input focus, dan forced visibility untuk edge cases.
 */
export function useBottomNavigation() {
  const pathname = usePathname();

  const [isVisible, setIsVisible] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState<'HIDDEN' | 'IMMERSIVE' | 'VISIBLE'>('VISIBLE');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const forceVisibleRef = useRef(false);

  // Update active key based on route
  useEffect(() => {
    const key = getActiveBottomNavKey(pathname);
    setActiveKey(key);
  }, [pathname]);

  // Route-based visibility
  useEffect(() => {
    if (forceVisibleRef.current) return;

    const visibility = getBottomNavVisibility(pathname);
    setHideReason(visibility);
    setIsVisible(visibility === 'VISIBLE');
  }, [pathname]);

  // Keyboard detection via visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || typeof VisualViewport === 'undefined') return;

    const vv = window.visualViewport;
    if (!vv) return;

    let lastKeyboardHeight = 0;
    const DEBOUNCE_MS = 150;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      if (!vv) return;

      // Calculate keyboard height
      // layoutViewport = window.innerHeight (CSS pixels)
      // visualViewport = visible area after keyboard
      // offsetTop = how much page is scrolled up to keep input visible
      const layoutViewportHeight = window.innerHeight;
      const visualViewportHeight = vv.height;
      const visualViewportOffsetTop = vv.offsetTop || 0;

      const currentKeyboardHeight = Math.max(
        0,
        layoutViewportHeight - visualViewportHeight - visualViewportOffsetTop
      );

      // Significant change threshold (avoid flicker on small adjustments)
      if (Math.abs(currentKeyboardHeight - lastKeyboardHeight) > 20) {
        lastKeyboardHeight = currentKeyboardHeight;
        setKeyboardHeight(currentKeyboardHeight);
      }

      // Debounced visibility update
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (forceVisibleRef.current) return;

        // Hide nav if keyboard is substantial (> 100px) and we're not on a hidden route
        const routeHidden = getBottomNavVisibility(pathname) !== 'VISIBLE';
        const shouldHideForKeyboard = currentKeyboardHeight > 100 && !routeHidden;

        setIsVisible(!shouldHideForKeyboard);
      }, DEBOUNCE_MS);
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);

    // Initial calculation
    handleResize();

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
      clearTimeout(debounceTimer);
    };
  }, [pathname]);

  // Input focus fallback (catches cases where visualViewport doesn't fire)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const isTextInput = target.matches('input[type="text"], input[type="email"], input[type="tel"], input[type="search"], input[type="url"], textarea, [contenteditable="true"]');
      if (isTextInput && !forceVisibleRef.current) {
        // Small delay to let visualViewport catch up
        setTimeout(() => setIsVisible(false), 50);
      }
    };

    const handleFocusOut = () => {
      if (!forceVisibleRef.current) {
        const routeHidden = getBottomNavVisibility(pathname) !== 'VISIBLE';
        if (!routeHidden) setIsVisible(true);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [pathname]);

  // Expose force visible for special cases (e.g., consent full-screen)
  const setForceVisible = useCallback((force: boolean) => {
    forceVisibleRef.current = force;
    if (force) {
      setIsVisible(true);
    } else {
      // Re-evaluate based on current conditions
      const routeHidden = getBottomNavVisibility(pathname) !== 'VISIBLE';
      const keyboardVisible = keyboardHeight > 100;
      setIsVisible(!routeHidden && !keyboardVisible);
    }
  }, [pathname, keyboardHeight]);

  return {
    isVisible,
    activeKey,
    hideReason,
    setForceVisible,
  };
}