import {
  isTouchDevice,
  isMobileDevice,
  getDeviceInfo,
} from "../device-detection";

// Mock navigator properties
const createMockNavigator = (overrides: Partial<Navigator>) =>
  ({
    userAgent: "",
    maxTouchPoints: 0,
    ...overrides,
  }) as Navigator;

describe("device-detection", () => {
  beforeEach(() => {
    // Reset navigator mock
    Object.defineProperty(window, "navigator", {
      writable: true,
      value: createMockNavigator({}),
    });

    // Reset touch event support - explicitly remove it for desktop tests
    Object.defineProperty(window, "ontouchstart", {
      writable: true,
      value: undefined,
    });

    // Reset msMaxTouchPoints for IE compatibility
    Object.defineProperty(navigator, "msMaxTouchPoints", {
      writable: true,
      value: 0,
    });
  });

  describe("isTouchDevice", () => {
    it("应该检测到支持触摸的设备", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 1,
        }),
      });

      expect(isTouchDevice()).toBe(true);
    });

    it("应该检测到不支持触摸的设备", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 0,
        }),
      });

      expect(isTouchDevice()).toBe(false);
    });

    it("应该检测到移动设备（通过maxTouchPoints）", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 1,
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        }),
      });

      expect(isTouchDevice()).toBe(true);
    });

    it("应该检测到iPad设备", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 5,
          userAgent: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)",
        }),
      });

      expect(isTouchDevice()).toBe(true);
    });

    it("应该检测到Android设备", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 10,
          userAgent: "Mozilla/5.0 (Linux; Android 10; SM-G975F)",
        }),
      });

      expect(isTouchDevice()).toBe(true);
    });

    it("应该检测到桌面设备", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 0,
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        }),
      });

      expect(isTouchDevice()).toBe(false);
    });
  });

  describe("isMobileDevice", () => {
    it("应该检测到iPhone", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        }),
      });

      expect(isMobileDevice()).toBe(true);
    });

    it("应该检测到Android手机", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          userAgent: "Mozilla/5.0 (Linux; Android 10; SM-G975F)",
        }),
      });

      expect(isMobileDevice()).toBe(true);
    });

    it("应该检测到iPad但不认为是手机", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          userAgent: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)",
        }),
      });

      expect(isMobileDevice()).toBe(false);
    });

    it("应该检测到桌面设备", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        }),
      });

      expect(isMobileDevice()).toBe(false);
    });

    it("应该检测到平板设备但不是手机", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          userAgent: "Mozilla/5.0 (Android Tablet; 10; SM-T870)",
        }),
      });

      expect(isMobileDevice()).toBe(false);
    });
  });

  describe("getDeviceInfo", () => {
    it("应该返回iPad设备信息", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 5,
          userAgent:
            "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
        }),
      });

      const deviceInfo = getDeviceInfo();
      expect(deviceInfo).toEqual({
        isTouch: true,
        isMobile: false,
        isTablet: true,
        platform: "ios",
        maxTouchPoints: 5,
        userAgent: expect.stringContaining("iPad"),
      });
    });

    it("应该返回iPhone设备信息", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 1,
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
        }),
      });

      const deviceInfo = getDeviceInfo();
      expect(deviceInfo).toEqual({
        isTouch: true,
        isMobile: true,
        isTablet: false,
        platform: "ios",
        maxTouchPoints: 1,
        userAgent: expect.stringContaining("iPhone"),
      });
    });

    it("应该返回Android设备信息", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 10,
          userAgent:
            "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36",
        }),
      });

      const deviceInfo = getDeviceInfo();
      expect(deviceInfo).toEqual({
        isTouch: true,
        isMobile: true,
        isTablet: false,
        platform: "android",
        maxTouchPoints: 10,
        userAgent: expect.stringContaining("Android"),
      });
    });

    it("应该返回Windows桌面设备信息", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 0,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }),
      });

      const deviceInfo = getDeviceInfo();
      expect(deviceInfo).toEqual({
        isTouch: false,
        isMobile: false,
        isTablet: false,
        platform: "windows",
        maxTouchPoints: 0,
        userAgent: expect.stringContaining("Windows"),
      });
    });

    it("应该返回macOS桌面设备信息", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 0,
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        }),
      });

      const deviceInfo = getDeviceInfo();
      expect(deviceInfo).toEqual({
        isTouch: false,
        isMobile: false,
        isTablet: false,
        platform: "macos",
        maxTouchPoints: 0,
        userAgent: expect.stringContaining("Macintosh"),
      });
    });

    it("应该处理未知的userAgent", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 0,
          userAgent: "Unknown Browser",
        }),
      });

      const deviceInfo = getDeviceInfo();
      expect(deviceInfo).toEqual({
        isTouch: false,
        isMobile: false,
        isTablet: false,
        platform: "unknown",
        maxTouchPoints: 0,
        userAgent: "Unknown Browser",
      });
    });

    it("应该检测支持触摸的Windows设备", () => {
      Object.defineProperty(window, "navigator", {
        writable: true,
        value: createMockNavigator({
          maxTouchPoints: 10,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
        }),
      });

      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.isTouch).toBe(true);
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.platform).toBe("windows");
      expect(deviceInfo.maxTouchPoints).toBe(10);
    });
  });
});
