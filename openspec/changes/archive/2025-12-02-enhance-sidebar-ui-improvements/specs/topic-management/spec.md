## MODIFIED Requirements

### Requirement: Node Creation Interface

The system SHALL provide contextually appropriate node creation options based on the current selection state.

#### Scenario: Top-level topic creation

- **WHEN** no node is selected in the canvas
- **AND** the user opens the sidebar
- **THEN** the interface SHALL display "Create New Node" as the primary action
- **AND** SHALL not display "Reply Topic" options

#### Scenario: Reply topic creation

- **WHEN** a node is selected in the canvas
- **AND** the user opens the sidebar
- **THEN** the interface SHALL display "Reply Topic" as the primary action
- **AND** SHALL not display "Create New Node"
- **AND** SHALL pre-populate the parent relationship

#### Scenario: Duplicate reply option removal

- **WHEN** a node is selected
- **THEN** the sidebar SHALL NOT show duplicate "Reply Topic" options
- **AND** SHALL consolidate all reply functionality into a single interface

## REMOVED Requirements

### Reason: Development debug information in production

Debug information display in the sidebar is being removed from production view to improve user experience and reduce interface clutter.

**Migration**: Debug information will still be available in development environment (NODE_ENV='development') but hidden in production builds.
