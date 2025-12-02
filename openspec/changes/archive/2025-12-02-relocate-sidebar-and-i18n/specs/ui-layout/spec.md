# UI Layout Specifications - Sidebar Relocation

## MODIFIED Requirements

### Requirement: Sidebar Positioning

The sidebar **SHALL** be positioned on the right side of the screen instead of the left side.

#### Scenario: User opens sidebar

- When the user triggers the sidebar to open, it should slide in from the right side of the screen
- The sidebar should maintain its current width (w-80 / 320px)
- The sidebar should overlay the main content area

#### Scenario: Responsive behavior

- On mobile devices, the sidebar should still appear on the right side
- The sidebar should be fully accessible via swipe gestures on touch devices
- Keyboard navigation should work with the right-side positioning

### Requirement: Border Styling Update

The sidebar border **SHALL** be updated to reflect its new right-side position.

#### Scenario: Border rendering

- The sidebar should have a left border (`border-l`) instead of right border (`border-r`)
- The border should maintain the same styling (`border-gray-200`)
- The border should be visible when the sidebar is open

## REMOVED Requirements

### Requirement: Left-Side Positioning (Removed)

The sidebar shall be positioned on the left side of the screen.

#### Reason for Removal

The requirement has been superseded by the new right-side positioning requirement to improve user workflow and content creation experience.
