"use client";

import { useState, useEffect, useCallback } from "react";
import RedisTestComponent from "@/components/RedisTest";

export default function RedisTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Redis集成测试
          </h1>
          <p className="text-gray-600 mb-8">
            测试Redis连接、数据读写和SSE实时流功能
          </p>
          <RedisTestComponent />
        </div>
      </div>
    </div>
  );
}
