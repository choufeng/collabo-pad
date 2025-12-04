/**
 * 空值转换工具函数
 * 用于在数据持久化前统一处理空值转换
 */

/**
 * 将空值转换为 null
 * @param value - 需要转换的值
 * @returns 转换后的值，空字符串、undefined 转为 null，其他值保持不变
 *
 * @example
 * ```typescript
 * toNull("")           // returns null
 * toNull(undefined)    // returns null
 * toNull(null)         // returns null
 * toNull("valid")      // returns "valid"
 * toNull(0)            // returns 0
 * toNull(false)        // returns false
 * ```
 */
export const toNull = <T>(value: T | "" | undefined | null): T | null => {
  return value === "" || value === undefined ? null : value;
};

/**
 * 批量转换对象中的空值为 null
 * @param obj - 需要处理的对象
 * @returns 处理后的对象，空字符串和 undefined 值转为 null
 *
 * @example
 * ```typescript
 * const data = {
 *   name: "John",
 *   email: "",
 *   phone: undefined,
 *   age: null,
 *   active: false
 * };
 * const result = toNullObject(data);
 * // result = {
 * //   name: "John",
 * //   email: null,
 * //   phone: null,
 * //   age: null,
 * //   active: false
 * // }
 * ```
 */
export const toNullObject = <T extends Record<string, any>>(obj: T): T => {
  const result = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    (result as any)[key] = toNull(value);
  }

  return result;
};

/**
 * 深度转换对象中的空值为 null，包括嵌套对象和数组
 * @param value - 需要处理的值
 * @param visited - 用于检测循环引用的 WeakSet
 * @returns 处理后的值，空字符串和 undefined 递归转为 null
 *
 * @example
 * ```typescript
 * const data = {
 *   user: {
 *     name: "John",
 *     email: ""
 *   },
 *   tags: [undefined, "tag1", ""],
 *   meta: null
 * };
 * const result = toNullDeep(data);
 * // result = {
 * //   user: {
 * //     name: "John",
 * //     email: null
 * //   },
 * //   tags: [null, "tag1", null],
 * //   meta: null
 * // }
 * ```
 */
export const toNullDeep = <T>(value: T, visited = new WeakSet()): T => {
  // 处理基本类型的空值转换
  if (value === "" || value === undefined) {
    return null as T;
  }

  // 保持 null 值不变
  if (value === null) {
    return null as T;
  }

  // 处理数组
  if (Array.isArray(value)) {
    return value.map((item) => toNullDeep(item, visited)) as T;
  }

  // 处理对象（排除 Date、RegExp 等特殊对象）
  if (typeof value === "object" && value.constructor === Object) {
    // 检测循环引用
    if (visited.has(value)) {
      return value; // 返回原对象，避免无限递归
    }
    visited.add(value);

    const result = {} as T;
    for (const [key, val] of Object.entries(value)) {
      (result as any)[key] = toNullDeep(val, visited);
    }
    return result;
  }

  // 其他类型（number, boolean, string, Date, RegExp等）保持不变
  return value;
};

/**
 * 过滤掉空值字段，只保留有效字段
 * @param obj - 需要处理的对象
 * @returns 过滤后的对象，移除 null、undefined 和空字符串字段
 *
 * @example
 * ```typescript
 * const data = {
 *   name: "John",
 *   email: "",
 *   phone: undefined,
 *   age: 25,
 *   active: false
 * };
 * const result = filterEmptyFields(data);
 * // result = {
 * //   name: "John",
 * //   age: 25,
 * //   active: false
 * // }
 * ```
 */
export const filterEmptyFields = <T extends Record<string, any>>(
  obj: T,
): Partial<T> => {
  const result = {} as Partial<T>;

  for (const [key, value] of Object.entries(obj)) {
    if (value !== "" && value !== undefined && value !== null) {
      (result as any)[key] = value;
    }
  }

  return result;
};
