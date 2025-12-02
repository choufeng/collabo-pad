## MODIFIED Requirements

### Requirement: Field Naming Consistency

The system SHALL use consistent snake_case naming for data fields across all layers to ensure data integrity and maintainability.

#### Scenario: Database field access

- **WHEN** accessing database fields through ORM
- **THEN** field names SHALL use snake_case format consistent with database schema
- **AND** type definitions SHALL match API response format

#### Scenario: API data transformation

- **WHEN** converting data between database and API layers
- **THEN** field mapping SHALL be consistent and predictable
- **AND** SHALL not require complex transformation logic

#### Scenario: Frontend component data access

- **WHEN** frontend components access topic data
- **THEN** field names SHALL use snake_case format
- **AND** SHALL match API response field names exactly

#### Scenario: Type definition consistency

- **WHEN** defining TypeScript interfaces for data structures
- **THEN** all field names SHALL use snake_case format
- **AND** SHALL be consistent across frontend and backend type definitions

#### Scenario: Data flow validation

- **WHEN** data flows from database through API to frontend
- **THEN** field names SHALL remain consistent throughout the pipeline
- **AND** SHALL not require field name transformations
