/**
 * Haptic Feedback Hook
 * Provides vibration patterns for different interaction types
 * Falls back gracefully on unsupported devices
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

// Vibration patterns in milliseconds
const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30, 50, 10],
  error: [50, 100, 50],
  warning: [30, 50, 30],
  selection: 5,
};

export function useHaptic() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = (pattern: HapticPattern = 'light') => {
    if (!isSupported) return;
    
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // Silently fail if vibration is not allowed
    }
  };

  const light = () => trigger('light');
  const medium = () => trigger('medium');
  const heavy = () => trigger('heavy');
  const success = () => trigger('success');
  const error = () => trigger('error');
  const warning = () => trigger('warning');
  const selection = () => trigger('selection');

  return {
    trigger,
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
    isSupported,
  };
}

// Standalone functions for use outside React components
export const haptic = {
  trigger: (pattern: HapticPattern = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(patterns[pattern]);
      } catch {
        // Silently fail
      }
    }
  },
  light: () => haptic.trigger('light'),
  medium: () => haptic.trigger('medium'),
  heavy: () => haptic.trigger('heavy'),
  success: () => haptic.trigger('success'),
  error: () => haptic.trigger('error'),
  warning: () => haptic.trigger('warning'),
  selection: () => haptic.trigger('selection'),
};
