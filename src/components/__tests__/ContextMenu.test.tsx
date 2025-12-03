import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ContextMenu, { ContextMenuItem } from "../ContextMenu";

// Mock React Portal
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactElement) => element,
}));

describe("ContextMenu", () => {
  const mockItems: ContextMenuItem[] = [
    {
      id: "test-item-1",
      label: "Test Item 1",
      onClick: jest.fn(),
    },
    {
      id: "test-item-2",
      label: "Test Item 2",
      onClick: jest.fn(),
      disabled: true,
    },
  ];

  const defaultProps = {
    visible: true,
    x: 100,
    y: 200,
    items: mockItems,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when visible", () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByText("Test Item 1")).toBeInTheDocument();
    expect(screen.getByText("Test Item 2")).toBeInTheDocument();
  });

  it("does not render when not visible", () => {
    render(<ContextMenu {...defaultProps} visible={false} />);

    expect(screen.queryByText("Test Item 1")).not.toBeInTheDocument();
  });

  it("calls onClick when enabled item is clicked", () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByText("Test Item 1"));

    expect(mockItems[0].onClick).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled item is clicked", () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByText("Test Item 2"));

    expect(mockItems[1].onClick).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when ESC key is pressed", () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("prevents default context menu", () => {
    render(<ContextMenu {...defaultProps} />);

    const menu = screen.getByRole("menu");
    const contextMenuEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });

    fireEvent(menu, contextMenuEvent);

    expect(contextMenuEvent.defaultPrevented).toBe(true);
  });
});
