export interface DeviceInfo {
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  platform: "ios" | "android" | "windows" | "macos" | "linux" | "unknown";
  maxTouchPoints: number;
  userAgent: string;
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  // Check if touch event APIs are supported
  if (typeof window !== "undefined") {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - Check legacy touch event APIs
      navigator.msMaxTouchPoints > 0
    );
  }
  return false;
}

/**
 * Check if device is mobile (phone)
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;

  // Check for phone devices, exclude tablets
  return (
    /Mobi|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Android.*Mobile/i.test(
      userAgent,
    ) && !/iPad|Android.*Tablet|Android(?!.*Mobile)/i.test(userAgent)
  );
}

/**
 * Get detailed device information
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const maxTouchPoints =
    typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0;

  const isTouch = isTouchDevice();
  const isMobile = isMobileDevice();
  const isTablet =
    isTouch &&
    !isMobile &&
    (/iPad|Android(?!.*Mobile)/i.test(userAgent) || maxTouchPoints > 1);

  // Detect platform
  let platform: DeviceInfo["platform"] = "unknown";

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    platform = "ios";
  } else if (/Android/i.test(userAgent)) {
    platform = "android";
  } else if (/Windows/i.test(userAgent)) {
    platform = "windows";
  } else if (/Macintosh|Mac OS/i.test(userAgent)) {
    platform = "macos";
  } else if (/Linux/i.test(userAgent)) {
    platform = "linux";
  }

  return {
    isTouch,
    isMobile,
    isTablet,
    platform,
    maxTouchPoints,
    userAgent,
  };
}

/**
 * Check if device is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if device is iPad
 */
export function isIPadDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  // iPad on iOS 13+ gets detected as Mac, need additional check
  return (
    /iPad/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Check if device is Android
 */
export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Android/i.test(navigator.userAgent);
}
