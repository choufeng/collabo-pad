/**
 * 可填写下拉框组件 (ComboBox)
 * 支持输入过滤和选择已有选项
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// 选项接口
export interface ComboBoxOption {
  value: string;
  label: string;
}

// 组件属性接口
interface ComboBoxProps {
  value?: string;
  placeholder?: string;
  options: ComboBoxOption[];
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  onSelect: (value: string) => void;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  // 错误状态
  error?: boolean;
  // 最大显示选项数
  maxOptions?: number;
  // 是否在没有匹配项时显示创建选项
  allowCreate?: boolean;
  // 创建新选项的文本
  createOptionText?: string;
}

export function ComboBox({
  value = "",
  placeholder = "请输入或选择...",
  options = [],
  isLoading = false,
  disabled = false,
  className = "",
  onSelect,
  onChange,
  onBlur,
  onFocus,
  error = false,
  maxOptions = 10,
  allowCreate = true,
  createOptionText = "创建新用户",
}: ComboBoxProps) {
  // 状态管理
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] =
    useState<ComboBoxOption[]>(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showCreateOption, setShowCreateOption] = useState(false);

  // 引用
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 过滤选项
  const filterOptions = useCallback(
    (inputValue: string) => {
      if (!inputValue.trim()) {
        return options.slice(0, maxOptions);
      }

      const filtered = options
        .filter((option) =>
          option.label.toLowerCase().includes(inputValue.toLowerCase()),
        )
        .slice(0, maxOptions);

      return filtered;
    },
    [options, maxOptions],
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    const filtered = filterOptions(inputValue);
    setFilteredOptions(filtered);

    // 检查是否需要显示创建选项
    const hasExactMatch = filtered.some(
      (option) => option.label.toLowerCase() === inputValue.toLowerCase(),
    );
    setShowCreateOption(
      allowCreate && inputValue.trim().length > 0 && !hasExactMatch,
    );
    setHighlightedIndex(-1);
  };

  // 处理输入框获得焦点
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      const filtered = filterOptions(value);
      setFilteredOptions(filtered);

      // 检查是否需要显示创建选项
      const hasExactMatch = filtered.some(
        (option) => option.label.toLowerCase() === value.toLowerCase(),
      );
      setShowCreateOption(
        allowCreate && value.trim().length > 0 && !hasExactMatch,
      );
      setHighlightedIndex(-1);
    }
    onFocus?.();
  };

  // 处理选项选择
  const handleOptionSelect = (option: ComboBoxOption) => {
    onChange(option.label);
    onSelect(option.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // 处理创建新选项
  const handleCreateOption = () => {
    const currentValue = value.trim();
    if (currentValue) {
      onChange(currentValue);
      onSelect(currentValue);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        handleInputFocus();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const nextIndex = prev + 1;
          const maxIndex =
            filteredOptions.length + (showCreateOption ? 1 : 0) - 1;
          return nextIndex > maxIndex ? 0 : nextIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const nextIndex = prev - 1;
          const maxIndex =
            filteredOptions.length + (showCreateOption ? 1 : 0) - 1;
          return nextIndex < 0 ? maxIndex : nextIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < filteredOptions.length) {
            handleOptionSelect(filteredOptions[highlightedIndex]);
          } else if (showCreateOption) {
            handleCreateOption();
          }
        } else if (value.trim()) {
          onSelect(value.trim());
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case "Tab":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        listRef.current &&
        !listRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 处理滚动高亮项到视图中
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // 输入框样式
  const inputClassName = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
    error ? "border-red-300" : "border-gray-300"
  } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${className}`;

  return (
    <div className="relative">
      {/* 输入框 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={() => {
            // 延迟关闭，让选项点击有时间处理
            setTimeout(() => {
              setIsOpen(false);
              setHighlightedIndex(-1);
            }, 200);
            onBlur?.();
          }}
          disabled={disabled}
          className={inputClassName}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-label={placeholder}
        />

        {/* 加载指示器 */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* 下拉箭头 */}
        {!isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 选项列表 */}
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {filteredOptions.length === 0 && !showCreateOption && !isLoading && (
            <li className="px-3 py-2 text-gray-500 text-sm">
              没有找到匹配的选项
            </li>
          )}

          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                highlightedIndex === index
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleOptionSelect(option)}
              role="option"
              aria-selected={highlightedIndex === index}
            >
              {option.label}
            </li>
          ))}

          {/* 创建新用户选项 */}
          {showCreateOption && (
            <li
              className={`px-3 py-2 cursor-pointer transition-colors border-t border-gray-200 ${
                highlightedIndex === filteredOptions.length
                  ? "bg-green-100 text-green-900"
                  : "hover:bg-gray-100"
              }`}
              onClick={handleCreateOption}
              role="option"
              aria-selected={highlightedIndex === filteredOptions.length}
            >
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {createOptionText}: "{value}"
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
