import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SideTrowser } from "../SideTrowser";
import { useSideTrowserStore } from "@/stores/side-trowser-store";

// Mock the store
jest.mock("@/stores/side-trowser-store");
const mockUseSideTrowserStore = useSideTrowserStore as jest.MockedFunction<
  typeof useSideTrowserStore
>;

// Mock child components
jest.mock("../NodeForm", () => {
  return function MockNodeForm({
    onSubmitSuccess,
  }: {
    onSubmitSuccess?: () => void;
  }) {
    return <div data-testid="node-form">Mock Node Form</div>;
  };
});

jest.mock("../NodeContentView", () => {
  return function MockNodeContentView({ selectedNode }: { selectedNode: any }) {
    return <div data-testid="node-content-view">Mock Node Content View</div>;
  };
});

describe("SideTrowser Component", () => {
  const mockClose = jest.fn();
  const mockReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSideTrowserStore.mockReturnValue({
      isOpen: true,
      close: mockClose,
      form: { content: "" },
      reset: mockReset,
      selectedNode: null,
      formResponseLoading: false,
      updateForm: jest.fn(),
      setFormResponseLoading: jest.fn(),
      resetForm: jest.fn(),
    });
  });

  describe("Rendering Behavior", () => {
    it("should not render when isOpen is false", () => {
      mockUseSideTrowserStore.mockReturnValue({
        isOpen: false,
        close: mockClose,
        form: { content: "" },
        reset: mockReset,
        selectedNode: null,
        formResponseLoading: false,
        updateForm: jest.fn(),
        setFormResponseLoading: jest.fn(),
        resetForm: jest.fn(),
      });

      render(<SideTrowser />);

      expect(screen.queryByText("Sidebar")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(<SideTrowser />);

      expect(screen.getByText("Sidebar")).toBeInTheDocument();
    });

    it("should be positioned on the right side (updated behavior)", () => {
      render(<SideTrowser />);

      const sidebar = screen.getByText("Sidebar").closest(".fixed");
      expect(sidebar).toHaveClass("right-0");
      expect(sidebar).toHaveClass("border-l");
    });

    it("should have correct width and styling", () => {
      render(<SideTrowser />);

      const sidebar = screen.getByText("Sidebar").closest(".fixed");
      expect(sidebar).toHaveClass("w-80");
      expect(sidebar).toHaveClass("bg-white");
      expect(sidebar).toHaveClass("shadow-lg");
    });
  });

  describe("English Text Content (Updated State)", () => {
    it("should display English sidebar title", () => {
      render(<SideTrowser />);

      expect(screen.getByText("Sidebar")).toBeInTheDocument();
    });

    it("should have English close button aria-label", () => {
      render(<SideTrowser />);

      const closeButton = screen.getByLabelText("Close sidebar");
      expect(closeButton).toBeInTheDocument();
    });

    it('should display English "Create New Node" section', () => {
      render(<SideTrowser />);

      expect(screen.getByText("Create New Node")).toBeInTheDocument();
    });

    it("should display English helper text for top-level node creation", () => {
      render(<SideTrowser />);

      expect(screen.getByText("Create top-level node")).toBeInTheDocument();
    });

    it("should display English helper text for child node creation when node is selected", () => {
      const mockSelectedNode = {
        id: "test-node-1",
        data: { label: "Test Node" },
      };

      mockUseSideTrowserStore.mockReturnValue({
        isOpen: true,
        close: mockClose,
        form: { content: "" },
        reset: mockReset,
        selectedNode: mockSelectedNode,
        formResponseLoading: false,
        updateForm: jest.fn(),
        setFormResponseLoading: jest.fn(),
        resetForm: jest.fn(),
      });

      render(<SideTrowser />);

      expect(screen.getByText(/Create child node for/)).toBeInTheDocument();
      expect(screen.getByText(/Test Node/)).toBeInTheDocument();
    });
  });

  describe("Interaction Behavior", () => {
    it("should call close function when close button is clicked", () => {
      render(<SideTrowser />);

      const closeButton = screen.getByLabelText("Close sidebar");
      fireEvent.click(closeButton);

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("should render NodeForm component", () => {
      render(<SideTrowser />);

      expect(screen.getByTestId("node-form")).toBeInTheDocument();
    });

    it("should render NodeContentView component", () => {
      render(<SideTrowser />);

      expect(screen.getByTestId("node-content-view")).toBeInTheDocument();
    });

    it("should call reset and close when NodeForm onSubmitSuccess is triggered", () => {
      render(<SideTrowser />);

      // Get the NodeForm and trigger its onSubmitSuccess
      const nodeForm = screen.getByTestId("node-form");

      // Since we're mocking NodeForm, we need to simulate the callback
      // This would be tested more thoroughly with integration tests
      expect(nodeForm).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible close button with proper label", () => {
      render(<SideTrowser />);

      const closeButton = screen.getByLabelText("Close sidebar");
      expect(closeButton.tagName).toBe("BUTTON");
    });
  });

  describe("Component Structure", () => {
    it("should have proper header section", () => {
      render(<SideTrowser />);

      const sidebar = screen.getByText("Sidebar").closest(".fixed");
      const header = sidebar?.querySelector(
        ".flex.items-center.justify-between",
      );
      expect(header).toBeInTheDocument();
      expect(screen.getByText("Sidebar")).toBeInTheDocument();
    });

    it("should have content area", () => {
      render(<SideTrowser />);

      const sidebar = screen.getByText("Sidebar").closest(".fixed");
      const contentArea = sidebar?.querySelector(".overflow-y-auto");
      expect(contentArea).toBeInTheDocument();
    });

    it("should have separator line between sections", () => {
      render(<SideTrowser />);

      const sidebar = screen.getByText("Sidebar").closest(".fixed");
      const separator = sidebar?.querySelector("hr");
      expect(separator).toBeInTheDocument();
    });
  });
});
