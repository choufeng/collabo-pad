/**
 * 空值转换工具函数的单元测试
 */

import {
  toNull,
  toNullObject,
  toNullDeep,
  filterEmptyFields,
} from "../null-conversion";

describe("null-conversion utils", () => {
  describe("toNull", () => {
    it("应该将空字符串转换为 null", () => {
      expect(toNull("")).toBeNull();
      expect(toNull(" ")).toBe(" "); // 非空字符串应该保持不变
      expect(toNull("\n")).toBe("\n"); // 换行符应该保持不变
    });

    it("应该将 undefined 转换为 null", () => {
      expect(toNull(undefined)).toBeNull();
    });

    it("应该保持 null 值不变", () => {
      expect(toNull(null)).toBeNull();
    });

    it("应该保持其他类型的值不变", () => {
      expect(toNull("valid string")).toBe("valid string");
      expect(toNull(0)).toBe(0);
      expect(toNull(-1)).toBe(-1);
      expect(toNull(42)).toBe(42);
      expect(toNull(true)).toBe(true);
      expect(toNull(false)).toBe(false);
      expect(toNull([])).toEqual([]);
      expect(toNull({})).toEqual({});
    });

    it("应该支持泛型类型", () => {
      const result1: string | null = toNull("");
      expect(result1).toBeNull();

      const result2: number | null = toNull(42);
      expect(result2).toBe(42);

      const result3: boolean | null = toNull(undefined);
      expect(result3).toBeNull();
    });
  });

  describe("toNullObject", () => {
    it("应该转换对象中的空字符串为 null", () => {
      const input = {
        name: "John",
        email: "",
        phone: "123-456-7890",
      };
      const expected = {
        name: "John",
        email: null,
        phone: "123-456-7890",
      };
      expect(toNullObject(input)).toEqual(expected);
    });

    it("应该转换对象中的 undefined 为 null", () => {
      const input = {
        name: "John",
        email: undefined,
        phone: "123-456-7890",
      };
      const expected = {
        name: "John",
        email: null,
        phone: "123-456-7890",
      };
      expect(toNullObject(input)).toEqual(expected);
    });

    it("应该保持现有的 null 值不变", () => {
      const input = {
        name: "John",
        email: null,
        phone: "123-456-7890",
      };
      const expected = {
        name: "John",
        email: null,
        phone: "123-456-7890",
      };
      expect(toNullObject(input)).toEqual(expected);
    });

    it("应该处理复杂的混合情况", () => {
      const input = {
        name: "John",
        email: "",
        phone: undefined,
        age: null,
        active: false,
        count: 0,
        tags: [],
        metadata: {},
      };
      const expected = {
        name: "John",
        email: null,
        phone: null,
        age: null,
        active: false,
        count: 0,
        tags: [],
        metadata: {},
      };
      expect(toNullObject(input)).toEqual(expected);
    });

    it("应该处理空对象", () => {
      const input = {};
      const expected = {};
      expect(toNullObject(input)).toEqual(expected);
    });
  });

  describe("toNullDeep", () => {
    it("应该深度转换嵌套对象中的空值", () => {
      const input = {
        user: {
          name: "John",
          email: "",
          profile: {
            bio: undefined,
            avatar: null,
          },
        },
        settings: {
          theme: "dark",
          notifications: "",
        },
      };
      const expected = {
        user: {
          name: "John",
          email: null,
          profile: {
            bio: null,
            avatar: null,
          },
        },
        settings: {
          theme: "dark",
          notifications: null,
        },
      };
      expect(toNullDeep(input)).toEqual(expected);
    });

    it("应该深度转换数组中的空值", () => {
      const input = {
        users: [
          { name: "John", email: "" },
          undefined,
          { name: "Jane", email: "jane@example.com" },
          null,
          { name: "", email: "invalid@example.com" },
        ],
        tags: ["", "tag1", undefined, "tag2", null],
      };
      const expected = {
        users: [
          { name: "John", email: null },
          null,
          { name: "Jane", email: "jane@example.com" },
          null,
          { name: null, email: "invalid@example.com" },
        ],
        tags: [null, "tag1", null, "tag2", null],
      };
      expect(toNullDeep(input)).toEqual(expected);
    });

    it("应该正确处理 Date 对象", () => {
      const date = new Date("2023-01-01");
      const input = {
        created: date,
        updated: "",
        deleted: undefined,
      };
      const expected = {
        created: date,
        updated: null,
        deleted: null,
      };
      expect(toNullDeep(input)).toEqual(expected);
    });

    it("应该处理基本类型的空值转换", () => {
      expect(toNullDeep("")).toBeNull();
      expect(toNullDeep(undefined)).toBeNull();
      expect(toNullDeep(null)).toBeNull();
      expect(toNullDeep("valid")).toBe("valid");
      expect(toNullDeep(42)).toBe(42);
      expect(toNullDeep(false)).toBe(false);
    });
  });

  describe("filterEmptyFields", () => {
    it("应该过滤掉空字符串字段", () => {
      const input = {
        name: "John",
        email: "",
        phone: "123-456-7890",
      };
      const expected = {
        name: "John",
        phone: "123-456-7890",
      };
      expect(filterEmptyFields(input)).toEqual(expected);
    });

    it("应该过滤掉 undefined 字段", () => {
      const input = {
        name: "John",
        email: undefined,
        phone: "123-456-7890",
      };
      const expected = {
        name: "John",
        phone: "123-456-7890",
      };
      expect(filterEmptyFields(input)).toEqual(expected);
    });

    it("应该过滤掉 null 字段", () => {
      const input = {
        name: "John",
        email: null,
        phone: "123-456-7890",
      };
      const expected = {
        name: "John",
        phone: "123-456-7890",
      };
      expect(filterEmptyFields(input)).toEqual(expected);
    });

    it("应该保留有效字段，包括假值", () => {
      const input = {
        name: "John",
        email: "",
        active: false,
        count: 0,
        tags: [],
        metadata: {},
      };
      const expected = {
        name: "John",
        active: false,
        count: 0,
        tags: [],
        metadata: {},
      };
      expect(filterEmptyFields(input)).toEqual(expected);
    });

    it("应该处理空对象", () => {
      const input = {};
      const expected = {};
      expect(filterEmptyFields(input)).toEqual(expected);
    });

    it("应该处理所有字段都为空的情况", () => {
      const input = {
        name: "",
        email: undefined,
        phone: null,
      };
      const expected = {};
      expect(filterEmptyFields(input)).toEqual(expected);
    });
  });

  describe("边界情况和错误处理", () => {
    it("应该处理循环引用（不抛出错误）", () => {
      const obj: any = { name: "John" };
      obj.self = obj;

      // 由于循环引用，我们应该能够处理而不抛出错误
      expect(() => toNullDeep(obj)).not.toThrow();

      // 验证结果仍然包含原始对象结构
      const result = toNullDeep(obj);
      expect(result.name).toBe("John");
      expect(result.self).toBe(obj.self); // 循环引用应该被保留
    });

    it("应该处理 Symbol 键", () => {
      const symbol = Symbol("test");
      const obj = {
        [symbol]: "value",
        name: "",
      };

      // Symbol 键应该被 Object.entries 忽略
      const result = toNullObject(obj);
      expect(result.name).toBeNull();
      expect(result[symbol]).toBeUndefined();
    });

    it("应该处理 RegExp 对象", () => {
      const regex = /test/g;
      const input = {
        pattern: regex,
        flags: "",
      };

      const expected = {
        pattern: regex,
        flags: null,
      };

      expect(toNullDeep(input)).toEqual(expected);
    });
  });
});
