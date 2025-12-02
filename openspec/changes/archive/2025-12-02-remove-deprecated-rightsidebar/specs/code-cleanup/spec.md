# Code Cleanup Specification

## ADDED Requirements

### Requirement: Remove Deprecated Components

The project **MUST** remove unused RightSidebar component and related files to ensure codebase cleanliness.

#### Scenario: Core component cleanup

- Given the project has replaced RightSidebar with SideTrowser
- When executing code cleanup
- Then RightSidebar.tsx component file MUST be deleted
- And related test files MUST be deleted
- And no files SHOULD import RightSidebar component

### Requirement: Migrate Shared Types

The project **MUST** migrate shared types exported by RightSidebar to appropriate locations to ensure other components can use them normally.

#### Scenario: Type definition migration

- Given NodeData and SidebarMode types are used by multiple files
- When deleting RightSidebar.tsx
- Then these types MUST be migrated to src/types/node.ts
- And all files using these types MUST update import paths
- And type definitions MUST remain fully compatible

### Requirement: Maintain Build Integrity

The project **MUST** maintain build integrity during code cleanup to ensure deletion operations don't break existing functionality.

#### Scenario: Build integrity

- Given code deletion and migration is complete
- When running TypeScript compilation check
- Then there MUST be no type errors
- And the project MUST build successfully
- And all tests MUST pass

## MODIFIED Requirements

### Requirement: Type Organization

The project **MUST** optimize type definition organization by centralizing shared types scattered across component files.

#### Scenario: Type organization optimization

- Given existing types are scattered across different component files
- When cleaning up RightSidebar related code
- Then shared types MUST be organized into dedicated type files
- And types MUST be organized by functional domain
- And clear import/export structure MUST be maintained

## REMOVED Requirements

### Requirement: RightSidebar Component

The project **MUST** remove deprecated RightSidebar component and all related code since functionality has been completely replaced by SideTrowser.

#### Scenario: Deprecated component removal

- Given RightSidebar functionality has been completely replaced by SideTrowser
- When executing code cleanup
- Then RightSidebar component MUST be completely removed from the project
- And no unused imports SHOULD remain
