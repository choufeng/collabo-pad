import type { CreateTopicRequest, CreateTopicResponse } from "@/types/topic";

// 创建主题的API调用函数
export async function createTopicAPI(
  requestData: CreateTopicRequest,
): Promise<CreateTopicResponse> {
  try {
    const response = await fetch("/api/topic/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "API call failed");
    }

    return response.json();
  } catch (error) {
    console.error("Topic API call failed:", error);
    throw error;
  }
}
