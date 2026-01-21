/**
 * Listener Guard Utilities
 * Prevents duplicate subscriptions and ensures proper cleanup
 */

type UnsubscribeFn = () => void;

/**
 * Guard to prevent duplicate listener subscriptions
 * Returns a function that manages subscription lifecycle
 */
export const createListenerGuard = <T>(
  subscribeFn: (callback: (data: T) => void) => UnsubscribeFn,
  callback: (data: T) => void
): UnsubscribeFn => {
  let unsubscribe: UnsubscribeFn | null = null;
  let isSubscribed = false;

  const start = () => {
    if (!isSubscribed) {
      isSubscribed = true;
      unsubscribe = subscribeFn(callback);
    }
  };

  const stop = () => {
    if (isSubscribed && unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      isSubscribed = false;
    }
  };

  // Auto-start
  start();

  // Return cleanup function
  return stop;
};

/**
 * Guard for conditional subscriptions
 * Only subscribes when condition is true
 */
export const createConditionalListenerGuard = <T>(
  condition: () => boolean,
  subscribeFn: (callback: (data: T) => void) => UnsubscribeFn,
  callback: (data: T) => void
): UnsubscribeFn => {
  let unsubscribe: UnsubscribeFn | null = null;
  let isSubscribed = false;

  const checkAndSubscribe = () => {
    if (condition()) {
      if (!isSubscribed) {
        isSubscribed = true;
        unsubscribe = subscribeFn(callback);
      }
    } else {
      if (isSubscribed && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        isSubscribed = false;
      }
    }
  };

  // Initial check
  checkAndSubscribe();

  // Return cleanup function
  return () => {
    if (isSubscribed && unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      isSubscribed = false;
    }
  };
};
