## Why

Enhance the user experience by adding smooth slide animations for sidebar interactions and improving user visibility by displaying the current username alongside the channel ID in the status bar.

## What Changes

- **Add sidebar slide animations**: Implement smooth slide-in from right and slide-out to right animations when the sidebar opens and closes
- **Display username with channel ID**: Add the current username display next to the channel ID in the status bar using the same visual styling
- **Improve visual feedback**: Add overlay backdrop during sidebar open/close animations for better focus management
- **Maintain responsive design**: Ensure animations work smoothly across all device sizes

## Impact

- Affected specs: ui-layout, user-data
- Affected code:
  - src/components/SideTrowser.tsx (animation implementation)
  - src/components/Board.tsx (username display in status bar)
  - src/stores/side-trowser-store.ts (animation state management)
  - globals.css (animation CSS)

## Breaking Changes

None - these are UI enhancements that maintain existing functionality while improving user experience.
