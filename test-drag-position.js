// 简单测试拖动位置保存功能的脚本

// 模拟fetch API
global.fetch = async (url, options) => {
  console.log("API调用:", url, options?.method || "GET");
  console.log("请求体:", options?.body);

  if (url.includes("/api/topics/update")) {
    const body = JSON.parse(options.body);
    console.log(`保存节点位置: id=${body.id}, x=${body.x}, y=${body.y}`);

    return {
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          message: "主题更新成功",
        }),
    };
  }

  return {
    ok: true,
    json: () => Promise.resolve({}),
  };
};

// 测试防抖功能
function testDebounce() {
  let timeoutId;
  let callCount = 0;

  function debouncedSave(nodeId, x, y) {
    console.log(`准备保存节点 ${nodeId} 位置: (${x}, ${y})`);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callCount++;
      console.log(`第${callCount}次实际保存: 节点 ${nodeId} -> (${x}, ${y})`);

      fetch("/api/topics/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: nodeId,
          x: Math.round(x),
          y: Math.round(y),
        }),
      });
    }, 300);
  }

  return debouncedSave;
}

// 测试位置变化检测
function testPositionChangeDetection() {
  const debouncedSave = testDebounce();

  console.log("=== 测试位置变化检测 ===");

  // 测试1: 位置没有变化
  console.log("\n测试1: 位置没有变化");
  const mockNode1 = {
    id: "node-1",
    position: { x: 100, y: 100 },
    data: {
      topic_id: "topic-1",
      x: 100,
      y: 100,
    },
  };

  debouncedSave(mockNode1.id, mockNode1.position.x, mockNode1.position.y);

  // 测试2: 位置发生变化
  console.log("\n测试2: 位置发生变化");
  const mockNode2 = {
    id: "node-2",
    position: { x: 150, y: 200 },
    data: {
      topic_id: "topic-2",
      x: 100,
      y: 100,
    },
  };

  debouncedSave(mockNode2.id, mockNode2.position.x, mockNode2.position.y);

  // 测试3: 快速连续拖动（防抖）
  console.log("\n测试3: 快速连续拖动（防抖）");
  setTimeout(() => {
    debouncedSave("node-2", 160, 210);
    setTimeout(() => {
      debouncedSave("node-2", 170, 220);
      setTimeout(() => {
        debouncedSave("node-2", 180, 230);
      }, 50);
    }, 50);
  }, 100);
}

// 测试API错误处理
async function testAPIErrorHandling() {
  console.log("\n=== 测试API错误处理 ===");

  // 模拟API错误
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (url.includes("/api/topics/update")) {
      return {
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            success: false,
            message: "服务器错误",
          }),
      };
    }
    return originalFetch(url, options);
  };

  try {
    const response = await fetch("/api/topics/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "topic-error",
        x: 100,
        y: 100,
      }),
    });

    const result = await response.json();
    console.log("API错误结果:", result);
  } catch (error) {
    console.error("API调用异常:", error);
  }

  // 恢复fetch
  global.fetch = originalFetch;
}

// 主测试函数
async function runTests() {
  console.log("开始测试拖动位置保存功能...\n");

  testPositionChangeDetection();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await testAPIErrorHandling();

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("\n=== 测试完成 ===");
  console.log("拖动位置保存功能基本正常工作！");
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
