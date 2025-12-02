"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useSideTrowserStore } from "@/stores/side-trowser-store";
import { useUserStore } from "@/stores/user-store";
import { createTopicAPI } from "@/lib/topicApi";
import type { CreateTopicRequest } from "@/types/redis-stream";
import { BaseComponentProps } from "@/types";

interface NodeFormProps extends BaseComponentProps {
  onCancel?: () => void;
  onSubmitSuccess?: (response: any) => void;
  placeholder?: string;
  submitButtonText?: string;
}

const NodeForm: React.FC<NodeFormProps> = ({
  onCancel,
  onSubmitSuccess,
  placeholder = "Enter node content...",
  submitButtonText = "Create Node",
  className = "",
}) => {
  const params = useParams();
  const channelId = params?.["channel-id"] as string;

  const {
    form,
    formResponseLoading,
    updateForm,
    setFormResponseLoading,
    resetForm,
  } = useSideTrowserStore();
  const { currentUser } = useUserStore();

  console.log("NodeForm component re-rendering, current form state:", form);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (value: string) => {
    updateForm({ content: value });

    if (errors.content) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.content;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.content || !form.content.trim()) {
      newErrors.content = "Node content cannot be empty";
    } else if (form.content.length > 500) {
      newErrors.content = "Node content cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      setErrors({
        content: "User information not loaded, please refresh the page",
      });
      return;
    }

    if (!channelId) {
      setErrors({
        content: "Channel information missing, please refresh the page",
      });
      return;
    }

    setFormResponseLoading(true);

    try {
      const requestData: CreateTopicRequest = {
        content: form.content.trim(),
        channel_id: channelId,
        user_id: currentUser.id,
        user_name: currentUser.username,
        parent_id: form.parent_id,
        x: form.x,
        y: form.y,
        metadata: form.metadata,
        tags: form.tags,
      };

      console.log("NodeForm submit data:", requestData);

      const response = await createTopicAPI(requestData);

      console.log("NodeForm API response:", response);

      if (response.success) {
        resetForm();
        setErrors({});

        if (onSubmitSuccess) {
          onSubmitSuccess(response);
        }
      } else {
        throw new Error(response.message || "Failed to create node");
      }
    } catch (error) {
      console.error("NodeForm submit failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Submit failed, please try again";
      setErrors({ content: errorMessage });
    } finally {
      setFormResponseLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setErrors({});
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="node-content"
            className="block text-sm font-medium text-gray-700"
          >
            {form.parent_id ? "Reply Topic" : "New Topic"}
          </label>
          <div className="relative">
            <textarea
              id="node-content"
              value={form.content}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={formResponseLoading}
              rows={4}
              maxLength={500}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                errors.content
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${formResponseLoading ? "bg-gray-100 cursor-not-allowed" : ""}`}
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? "content-error" : undefined}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {form.content.length}/500
            </div>
          </div>

          {errors.content && (
            <div
              id="content-error"
              className="flex items-center text-red-600 text-sm"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.content}
            </div>
          )}
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="p-3 bg-gray-100 rounded-lg text-xs">
            <div className="font-mono space-y-1">
              <div>User: {currentUser?.username || "Not loaded"}</div>
              <div>Channel: {channelId || "Not found"}</div>
              <div>Parent: {form.parent_id || "None"}</div>
              <div>
                Position: ({form.x || "Not set"}, {form.y || "Not set"})
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={formResponseLoading || !form.content.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {formResponseLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </div>
            ) : (
              submitButtonText
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={formResponseLoading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 disabled:text-gray-400 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NodeForm;
