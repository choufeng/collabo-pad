# Relocate Sidebar and Internationalization

## Why

This change addresses two key usability improvements for the collabo-pad application:

1. **User Experience Enhancement**: Moving the sidebar to the right side creates a more intuitive content creation workflow, as users typically read left-to-right and prefer creation tools on the right side of the screen.

2. **International Accessibility**: Replacing Chinese text with English makes the application accessible to a broader international user base and improves maintainability for a global development team.

3. **Consistency**: Standardizing on English provides a consistent interface experience and reduces localization complexity.

## What Changes

### 1. Sidebar Relocation

The sidebar **SHALL** be relocated from the left side to the right side of the screen.

- **Component**: `src/components/SideTrowser.tsx`
- **Positioning**: Change from `left-0` to `right-0`
- **Border**: Update from `border-r` to `border-l`
- **Functionality**: All existing interactions **SHALL** be preserved

### 2. Text Internationalization

All Chinese user interface text **SHALL** be replaced with English equivalents.

**SideTrowser Component**:
- "侧边栏" **SHALL** become "Sidebar"
- "关闭侧边栏" **SHALL** become "Close sidebar"
- "创建新节点" **SHALL** become "Create New Node"
- "为节点...创建子节点" **SHALL** become "Create child node for..."
- "创建顶级节点" **SHALL** become "Create top-level node"

**NodeContentView Component**:
- "翻译内容" **SHALL** become "Translated Content"
- "此节点暂无内容" **SHALL** become "This node has no content"
- "标签" **SHALL** become "Tags"

**NodeForm Component**:
- Console log messages **SHALL** use English

## Impact Assessment

### Benefits

- Improved UI consistency with English interface
- Better accessibility for international users
- More intuitive right-sided sidebar for content creation workflows
- Maintains all existing functionality

### Risks

- None identified - this is a pure UI positioning and text change
- No functional logic modifications required

## Dependencies

- No external dependencies required
- No API changes needed
- Pure front-end component modification

## Testing Strategy

- Visual regression testing for sidebar positioning
- Functional testing for all sidebar interactions
- Text rendering verification
- Responsive design validation
- Accessibility compliance testing
