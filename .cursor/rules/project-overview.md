# Pravaas - ETL Application Overview

## Introduction

Pravaas is a modern Extract, Transform, Load (ETL) application that enables users to upload data, perform transformations in an Excel-like interface, and export the results. The application leverages a dual-database architecture to efficiently manage both metadata and actual data.

## Architecture Overview

### Dual-Database Architecture

Pravaas uses a sophisticated dual-database approach to optimize performance and organization:

#### SQLite (via Drizzle ORM)

- **Purpose**: Stores metadata and organizational structures
- **Contains**:
  - Projects
  - Data sources
  - User information
  - Application configuration
  - Relationships between entities
- **Why SQLite**: Lightweight, reliable, and perfect for structured metadata that doesn't require complex analytical queries

#### DuckDB

- **Purpose**: Stores and processes actual data (rows, columns, cells)
- **Contains**:
  - Uploaded datasets
  - Transformed data
  - Intermediate transformation results
- **Why DuckDB**: High-performance analytical database optimized for OLAP workloads, columnar storage, and complex data transformations

### Data Flow

1. **Upload**: Users upload data files (CSV, Excel, etc.)
2. **Storage**: Data is ingested into DuckDB for fast analytical operations
3. **Organization**: Metadata (project, datasource info) is stored in SQLite via Drizzle
4. **Transformation**: Users perform data transformations using DuckDB's powerful SQL capabilities in an Excel-like view
5. **Export**: Final transformed data is exported as CSV

## Key Features

### 1. Project Management

- Organize data sources into projects
- Manage multiple projects simultaneously
- Track project metadata and relationships

### 2. Data Source Management

- Upload various data formats
- Link data sources to projects
- Track data source metadata in SQLite

### 3. Excel-like Data View

- Familiar spreadsheet interface for data exploration
- Real-time data preview
- Cell-level editing capabilities
- Column and row operations

### 4. Data Transformation

- Leverage DuckDB's powerful SQL engine for transformations
- Perform complex analytical operations
- Filter, aggregate, join, and transform data
- Real-time transformation preview

### 5. Export Functionality

- Export transformed data as CSV
- Maintain data integrity during export
- Support for large datasets

## Technology Stack

### Runtime & Build Tools

- **Bun**: Fast JavaScript runtime and package manager
  - Used for development, building, and running the application
  - Provides excellent performance and TypeScript support out of the box

### Routing & Framework

- **TanStack Router**: Type-safe, file-based routing
  - Handles navigation and route management
  - Provides excellent developer experience with type safety
- **TanStack Start**: Full-stack React framework
  - Server-side rendering and API routes
  - Seamless integration with TanStack Router

### Data Management

- **TanStack Query**: Server state management and data fetching
  - Handles API calls and caching
  - Provides loading states and error handling
- **TanStack Store**: Client-side state management
  - Manages application state
  - Supports derived state and reactive updates

### UI Components

- **TanStack Table**: Powerful table component
  - Excel-like data grid functionality
  - Sorting, filtering, pagination
  - Virtual scrolling for large datasets
- **TanStack Virtual**: Virtual scrolling
  - Efficient rendering of large datasets
  - Smooth scrolling performance
- **TanStack Form**: Form state management
  - Type-safe form handling
  - Validation and error management

### Database & ORM

- **Drizzle ORM**: Type-safe SQL ORM
  - Manages SQLite database schema
  - Provides migrations and type safety
  - Used for projects, datasources, and metadata
- **DuckDB**: Analytical database
  - Stores and processes actual data
  - Performs transformations and queries
  - Optimized for analytical workloads

## Project Structure

```
pravaas/
├── src/
│   ├── routes/              # TanStack Router file-based routes
│   │   ├── __root.tsx      # Root layout
│   │   ├── index.tsx       # Home page
│   │   └── api/            # API routes
│   │       └── projects.ts # Projects API endpoint
│   ├── core/
│   │   └── services/       # Business logic and API services
│   │       ├── api.ts      # API client
│   │       └── projects.ts # Projects service
│   ├── drizzle/
│   │   ├── schema/         # Drizzle schema definitions
│   │   │   ├── index.ts
│   │   │   └── user.ts     # User table schema
│   │   ├── migrations/     # Database migrations
│   │   └── index.ts        # Drizzle database instance
│   └── router.tsx          # Router configuration
├── db/
│   └── database.db         # SQLite database file
├── drizzle.config.ts       # Drizzle configuration
└── package.json            # Dependencies and scripts
```

## Database Schema (SQLite)

### Current Schema

- **user**: User information (id, name, age, email)

### Planned Schema

- **projects**: Project metadata
  - id, name, description, created_at, updated_at
- **datasources**: Data source information
  - id, project_id, name, type, duckdb_table_name, created_at
- **transformations**: Transformation history
  - id, datasource_id, query, created_at

## Development Workflow

### Running the Application

```bash
bun install          # Install dependencies
bun run dev          # Start development server (port 3000)
```

### Database Migrations

```bash
# Generate migration from schema changes
bun run drizzle-kit generate

# Apply migrations
bun run drizzle-kit migrate
```

### Building for Production

```bash
bun run build        # Build the application
bun run preview      # Preview production build
```

## Future Enhancements

1. **Data Source Upload**
   - Support for CSV, Excel, JSON, Parquet formats
   - Automatic schema detection
   - Data validation on upload

2. **Transformation Builder**
   - Visual query builder
   - SQL editor with DuckDB syntax highlighting
   - Transformation history and versioning

3. **Excel-like Interface**
   - Cell editing
   - Formula support
   - Column operations (add, delete, rename)
   - Row operations (filter, sort, group)

4. **Export Options**
   - Multiple export formats (CSV, Excel, JSON, Parquet)
   - Custom export configurations
   - Scheduled exports

5. **Collaboration**
   - Share projects with team members
   - Real-time collaboration on transformations
   - Version control for transformations

## Design Principles

1. **Separation of Concerns**: Metadata in SQLite, data in DuckDB
2. **Type Safety**: Full TypeScript support across the stack
3. **Performance**: Leverage DuckDB for fast analytical queries
4. **Developer Experience**: Modern tooling with excellent DX
5. **Scalability**: Architecture supports large datasets efficiently

## Key Integrations

- **Drizzle ORM** ↔ **SQLite**: Manages structured metadata
- **DuckDB**: Handles all data storage and transformation
- **TanStack Router** ↔ **TanStack Start**: Full-stack routing and SSR
- **TanStack Query**: Server state and data fetching
- **TanStack Table** ↔ **TanStack Virtual**: Efficient data grid rendering

---

_Pravaas - Empowering data transformation with the power of modern web technologies and analytical databases._
