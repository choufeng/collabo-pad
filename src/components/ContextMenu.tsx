"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({
  visible,
  x,
  y,
  items,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  // 调整菜单位置以避免超出视口边界
  useEffect(() => {
    if (visible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // 检查右边界
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10; // 10px margin
      }

      // 检查底部边界
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10; // 10px margin
      }

      // 确保不超出左边界和顶部边界
      adjustedX = Math.max(10, adjustedX);
      adjustedY = Math.max(10, adjustedY);

      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    }
  }, [visible, x, y]);

  // 处理键盘事件
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          event.preventDefault();
          // TODO: 实现键盘导航
          break;
        case "ArrowUp":
          event.preventDefault();
          // TODO: 实现键盘导航
          break;
        case "Enter":
          event.preventDefault();
          // TODO: 实现键盘导航
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  // 处理点击外部关闭
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 延迟添加事件监听器，避免立即触发关闭
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-48"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
      onContextMenu={(e) => e.preventDefault()} // 防止再次打开右键菜单
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`
            w-full text-left px-4 py-2 text-sm flex items-center gap-2
            hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150
            disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-white
          `}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
        >
          {item.icon && (
            <span className="w-4 h-4 flex items-center justify-center">
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  );
}
