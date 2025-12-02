export interface DeviceInfo {
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  platform: "ios" | "android" | "windows" | "macos" | "linux" | "unknown";
  maxTouchPoints: number;
  userAgent: string;
}

/**
 * 检测设备是否支持触摸
 */
export function isTouchDevice(): boolean {
  // 检查是否支持触摸事件API
  if (typeof window !== "undefined") {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - 检查旧的触摸事件API
      navigator.msMaxTouchPoints > 0
    );
  }
  return false;
}

/**
 * 检测是否为移动设备（手机）
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;

  // 检测手机设备，排除平板
  return (
    /Mobi|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Android.*Mobile/i.test(
      userAgent,
    ) && !/iPad|Android.*Tablet|Android(?!.*Mobile)/i.test(userAgent)
  );
}

/**
 * 获取详细的设备信息
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

  // 检测平台
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
 * 检测是否为iOS设备
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * 检测是否为iPad设备
 */
export function isIPadDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  // iOS 13+ 上的iPad会被检测为Mac，需要额外检查
  return (
    /iPad/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * 检测是否为Android设备
 */
export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Android/i.test(navigator.userAgent);
}
