## Why

Enhance the sidebar user experience to improve usability, visual hierarchy, and workflow efficiency by addressing current UI limitations in width, user visibility, and node creation flow.

## What Changes

- **Increase sidebar width**: Expand from current 320px (w-80) to 480px (1.5x wider) for better content display and usability
- **Enhance user display**: Make user information more prominent and visible in the sidebar
- **Optimize node creation flow**:
  - Show "Create New Node" only when creating top-level topics (no selected node)
  - Show "Reply Topic" as primary action when a node is selected
  - Remove duplicate "Reply Topic" options
- **Remove debug information**: Hide development debug info from production view

## Impact

- Affected specs: ui-layout, topic-management
- Affected code:
  - src/components/SideTrowser.tsx (width changes)
  - src/components/NodeForm.tsx (UI flow and debug removal)
  - src/components/CustomNode.tsx (user display enhancement)

## Breaking Changes

None - these are UI improvements that maintain existing functionality while enhancing user experience.
