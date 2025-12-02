# Internationalization Specifications - Chinese to English

## MODIFIED Requirements

### Requirement: UI Text Localization

All user-facing Chinese text in the sidebar and related components **SHALL** be replaced with English equivalents.

#### Scenario: Sidebar Header

- When the sidebar is displayed, the header text should show "Sidebar" instead of "侧边栏"
- The close button aria-label should be "Close sidebar" instead of "关闭侧边栏"

#### Scenario: Node Creation Section

- The section header should display "Create New Node" instead of "创建新节点"
- When a parent node is selected, the helper text should show "Create child node for [node name]" instead of "为节点 [node name] 创建子节点"
- When no parent is selected, the helper text should show "Create top-level node" instead of "创建顶级节点"

#### Scenario: Node Content Display

- When translated content is shown, the badge should display "Translated Content" instead of "翻译内容"
- Empty node content should show "This node has no content" instead of "此节点暂无内容"
- Section headers should use English: "Tags" instead of "标签"

### Requirement: Accessibility Compliance

All aria-labels and accessibility text **SHALL** be in English.

#### Scenario: Screen Reader Support

- Screen readers should announce English text for all interactive elements
- ARIA labels should be descriptive and in English
- Content should be properly announced for users with accessibility needs

## ADDED Requirements

### Requirement: Console Message Standardization (Optional)

Developer console messages **SHALL** use English for better debugging consistency.

#### Scenario: Development Logging

- Console.log statements in components should use English text
- Error messages in console should be in English
- Debug information should maintain English consistency

## REMOVED Requirements

### Requirement: Chinese UI Text (Removed)

All user-facing Chinese text **SHALL** be removed from the application interface.

#### Reason for Removal

The requirement has been superseded by the internationalization initiative to provide consistent English interface for better user experience and maintainability.
