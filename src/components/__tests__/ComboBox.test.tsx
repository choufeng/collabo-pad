/**
 * ComboBox组件测试
 */

import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComboBox, ComboBoxOption } from "../ComboBox";

// 模拟选项数据
const mockOptions: ComboBoxOption[] = [
  { value: "1", label: "Alice" },
  { value: "2", label: "Bob" },
  { value: "3", label: "Charlie" },
  { value: "4", label: "David" },
];

describe("ComboBox组件", () => {
  const mockOnSelect = jest.fn();
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();
  const mockOnFocus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("基础渲染", () => {
    it("应该正确渲染输入框", () => {
      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "请输入或选择...");
    });

    it("应该显示自定义占位符", () => {
      render(
        <ComboBox
          value=""
          placeholder="请输入用户名"
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByPlaceholderText("请输入用户名");
      expect(input).toBeInTheDocument();
    });

    it("应该显示当前值", () => {
      render(
        <ComboBox
          value="Alice"
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByDisplayValue("Alice");
      expect(input).toBeInTheDocument();
    });

    it("应该在禁用状态下正确显示", () => {
      render(
        <ComboBox
          value=""
          disabled={true}
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      expect(input).toBeDisabled();
    });
  });

  describe("选项列表", () => {
    it("应该在焦点时显示选项列表", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
        expect(screen.getByText("David")).toBeInTheDocument();
      });
    });

    it("应该限制显示的选项数量", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          maxOptions={2}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
        expect(screen.queryByText("David")).not.toBeInTheDocument();
      });
    });

    it("应该在没有选项时显示空状态", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={[]}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("没有找到匹配的选项")).toBeInTheDocument();
      });
    });
  });

  describe("输入过滤", () => {
    it("应该根据输入内容过滤选项", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      // 输入过滤内容
      await user.type(input, "A");

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
        expect(screen.getByText("David")).toBeInTheDocument(); // David包含'a'
        expect(screen.queryByText("Bob")).not.toBeInTheDocument(); // Bob不包含'a'
      });

      expect(mockOnChange).toHaveBeenCalledWith("A");
    });

    it("应该不区分大小写过滤", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      // 输入小写字母
      await user.type(input, "a");

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });
    });

    it("应该在完全匹配时隐藏创建选项", async () => {
      const user = userEvent.setup();

      // 使用受控组件模式
      function TestComponent() {
        const [value, setValue] = useState("");
        return (
          <ComboBox
            value={value}
            options={mockOptions}
            allowCreate={true}
            onSelect={mockOnSelect}
            onChange={setValue}
          />
        );
      }

      render(<TestComponent />);

      const input = screen.getByRole("combobox");
      await user.click(input);

      // 输入完全匹配的选项
      await user.type(input, "Alice");

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.queryByText(/创建新用户/)).not.toBeInTheDocument();
      });
    });
  });

  describe("选项选择", () => {
    it("应该可以选择选项", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      const aliceOption = await screen.getByText("Alice");
      await user.click(aliceOption);

      expect(mockOnSelect).toHaveBeenCalledWith("1");
    });

    it("应该创建新选项", async () => {
      const user = userEvent.setup();

      // 使用受控组件模式
      function TestComponent() {
        const [value, setValue] = useState("");
        return (
          <ComboBox
            value={value}
            options={mockOptions}
            allowCreate={true}
            createOptionText="创建新用户"
            onSelect={mockOnSelect}
            onChange={setValue}
          />
        );
      }

      render(<TestComponent />);

      const input = screen.getByRole("combobox");
      await user.click(input);

      // 输入不存在的选项
      await user.type(input, "Eve");

      const createOption = await screen.getByText(/创建新用户/);
      await user.click(createOption);

      expect(mockOnSelect).toHaveBeenCalledWith("Eve");
    });
  });

  describe("键盘导航", () => {
    it("应该支持上下箭头导航", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      // 按下箭头
      await user.keyboard("{ArrowDown}");

      await waitFor(() => {
        const aliceOption = screen.getByText("Alice");
        expect(aliceOption).toHaveClass("bg-blue-100");
      });

      // 再按下箭头
      await user.keyboard("{ArrowDown}");

      await waitFor(() => {
        const bobOption = screen.getByText("Bob");
        expect(bobOption).toHaveClass("bg-blue-100");
      });
    });

    it("应该支持回车键选择", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      // 按下箭头然后回车
      await user.keyboard("{ArrowDown}{Enter}");

      expect(mockOnSelect).toHaveBeenCalledWith("1");
    });

    it("应该支持ESC键关闭", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      // 按ESC键
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      });
    });

    it("应该在输入时按回车创建新选项", async () => {
      const user = userEvent.setup();

      // 使用受控组件模式
      function TestComponent() {
        const [value, setValue] = useState("");
        return (
          <ComboBox
            value={value}
            options={mockOptions}
            allowCreate={true}
            onSelect={mockOnSelect}
            onChange={setValue}
          />
        );
      }

      render(<TestComponent />);

      const input = screen.getByRole("combobox");
      await user.click(input);

      await user.type(input, "Eve");
      await user.keyboard("{Enter}");

      expect(mockOnSelect).toHaveBeenCalledWith("Eve");
    });
  });

  describe("加载状态", () => {
    it("应该显示加载指示器", () => {
      render(
        <ComboBox
          value=""
          isLoading={true}
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("错误状态", () => {
    it("应该在错误状态时显示红色边框", () => {
      render(
        <ComboBox
          value=""
          error={true}
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      expect(input).toHaveClass("border-red-300");
    });
  });

  describe("可访问性", () => {
    it("应该有正确的ARIA属性", () => {
      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).toHaveAttribute("aria-haspopup", "listbox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
    });

    it("应该在打开时设置正确的ARIA状态", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      expect(input).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("事件处理", () => {
    it("应该调用onBlur事件", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onBlur={mockOnBlur}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.tab(); // 移开焦点

      expect(mockOnBlur).toHaveBeenCalled();
    });

    it("应该调用onFocus事件", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onFocus={mockOnFocus}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      expect(mockOnFocus).toHaveBeenCalled();
    });
  });

  describe("点击外部关闭", () => {
    it("应该在点击外部时关闭选项列表", async () => {
      const user = userEvent.setup();

      render(
        <ComboBox
          value=""
          options={mockOptions}
          onSelect={mockOnSelect}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole("combobox");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      // 点击外部区域
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      });
    });
  });
});
