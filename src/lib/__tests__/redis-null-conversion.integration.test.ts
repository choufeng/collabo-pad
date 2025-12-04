/**
 * Redis 空值处理集成测试
 */

import RedisService from "../redis";

describe("Redis null conversion integration", () => {
  let redisService: RedisService;
  const testStreamKey = "test_null_conversion_stream";

  beforeAll(async () => {
    redisService = new RedisService();
    try {
      await redisService.connect();
    } catch (error) {
      console.warn("Redis not available for integration tests:", error);
    }
  });

  afterAll(async () => {
    try {
      // 清理测试数据
      if (redisService.isConnectionActive()) {
        await redisService.clearStream(testStreamKey);
        await redisService.disconnect();
      }
    } catch (error) {
      console.warn("Error cleaning up Redis:", error);
    }
  });

  // 如果Redis不可用，跳过这些测试
  const testOrSkip = (testName: string, testFn: () => void) => {
    const testFunction = redisService.isConnectionActive() ? testFn : test.skip;
    it(testName, testFunction);
  };

  testOrSkip("应该过滤空字段不写入Redis流", async () => {
    const testData = {
      validField: "valid value",
      emptyString: "",
      undefinedField: undefined,
      nullField: null,
      anotherValid: 123,
      falseValue: false, // 假值应该保留
      zeroValue: 0, // 零值应该保留
    };

    // 写入包含空值的数据
    const messageId = await redisService.addToStream(testStreamKey, testData);
    expect(messageId).toBeTruthy();

    // 读取流数据验证
    const streamInfo = await redisService.getStreamInfo(testStreamKey);
    expect(streamInfo).toBeTruthy();
    expect(streamInfo?.length).toBe(1);

    const streamRange = await redisService.getStreamRange(testStreamKey);
    expect(streamRange).toHaveLength(1);

    const message = streamRange[0];
    const data = message.data;

    // 验证有效字段被保留
    expect(data.validField).toBe("valid value");
    expect(data.anotherValid).toBe("123");
    expect(data.falseValue).toBe("false");
    expect(data.zeroValue).toBe("0");

    // 验证空字段被过滤
    expect(data.emptyString).toBeUndefined();
    expect(data.undefinedField).toBeUndefined();
    expect(data.nullField).toBeUndefined();
  });

  testOrSkip("updateMessage也应该过滤空字段", async () => {
    // 先创建一条消息
    const originalData = {
      title: "Original Title",
      description: "Original Description",
      author: "Test Author",
    };

    const messageId = await redisService.addToStream(
      testStreamKey,
      originalData,
    );
    expect(messageId).toBeTruthy();

    // 更新消息，包含空值
    const updateData = {
      title: "Updated Title",
      description: "", // 应该被过滤
      author: undefined, // 应该被过滤
      newField: "New Value", // 应该被保留
      emptyField: "", // 应该被过滤
    };

    const newMessageId = await redisService.updateMessage(
      testStreamKey,
      messageId,
      updateData,
    );
    expect(newMessageId).toBeTruthy();

    // 验证更新结果
    const streamRange = await redisService.getStreamRange(testStreamKey);
    expect(streamRange.length).toBeGreaterThanOrEqual(1);

    // 找到更新后的消息（应该是最后一条）
    const updatedMessage = streamRange[streamRange.length - 1];
    const data = updatedMessage.data;

    // 验证有效更新字段
    expect(data.title).toBe("Updated Title");
    expect(data.newField).toBe("New Value");

    // 验证空字段被过滤
    expect(data.description).toBeUndefined();
    expect(data.author).toBeUndefined();
    expect(data.emptyField).toBeUndefined();
  });

  testOrSkip("应该正确处理所有字段都为空的情况", async () => {
    const emptyData = {
      field1: "",
      field2: undefined,
      field3: null,
    };

    // 即使所有字段都为空，也应该能正常写入（虽然不会有实际数据）
    const messageId = await redisService.addToStream(testStreamKey, emptyData);

    // Redis XADD 要求至少有一个字段，如果所有字段都被过滤，可能会失败
    // 这取决于 Redis 的具体实现，我们主要确保不会抛出异常
    expect(typeof messageId).toBe("string");
  });

  testOrSkip("应该保留有效的假值", async () => {
    const dataWithFalseValues = {
      falseBool: false,
      emptyString: "", // 应该被过滤
      zeroNumber: 0,
      negativeNumber: -1,
      undefinedVal: undefined, // 应该被过滤
      nullVal: null, // 应该被过滤
    };

    const messageId = await redisService.addToStream(
      testStreamKey,
      dataWithFalseValues,
    );
    expect(messageId).toBeTruthy();

    const streamRange = await redisService.getStreamRange(testStreamKey);
    const latestMessage = streamRange[streamRange.length - 1];
    const data = latestMessage.data;

    // 验证有效的假值被保留
    expect(data.falseBool).toBe("false");
    expect(data.zeroNumber).toBe("0");
    expect(data.negativeNumber).toBe("-1");

    // 验证空字段被过滤
    expect(data.emptyString).toBeUndefined();
    expect(data.undefinedVal).toBeUndefined();
    expect(data.nullVal).toBeUndefined();
  });
});
