# TaskFlow

TaskFlow is a modern React Native task-management app built with Expo and TypeScript. It is designed as a technical-assessment project with a focus on clean architecture, reusable UI, local persistence, validation, and a polished mobile experience.

## Features

- Create, edit, view, complete, and delete tasks
- Task priorities: Low, Medium, High
- Task statuses: Pending, Completed
- Start and due date validation
- Dashboard with task progress and task statistics
- Light and dark themes
- Persistent local storage with SQLite
- Draft preservation for unfinished task forms
- CSV bulk import with row-level validation
- Duplicate detection during CSV import
- Partial-import handling
- CSV template download and task export
- Responsive layouts for smaller screens
- Accessibility labels and loading/disabled states

## Tech Stack

- React Native
- Expo SDK 57
- TypeScript
- Expo Router
- expo-sqlite
- React Native DateTimePicker
- Papa Parse
- pnpm

## Architecture

```text
Screens
  ↓
Reusable UI components
  ↓
Hooks / application logic
  ↓
Repository layer
  ↓
SQLite
```

### State and data flow

- Parent → child: props
- Child → parent: callback props
- Sibling components: shared state is lifted to their common parent
- Theme: React Context
- Persistent task data: SQLite via `useTasks()` and the repository layer
- Unfinished New Task form: `TaskFormDraftContext`
- Screen navigation: Expo Router route parameters

SQLite is the source of truth for task persistence. UI state is updated after successful database operations so the interface stays synchronized with stored data.

## Project Structure

```text
src/
├── app/                  # Expo Router screens
├── components/
│   ├── task/             # Task-specific components
│   └── ui/               # Reusable UI primitives
├── context/              # Application contexts
├── database/             # SQLite initialization and repository
├── hooks/                # Reusable application hooks
├── services/             # Import/export services
├── theme/                # Theme tokens and ThemeContext
├── types/                # Shared TypeScript types
└── utils/                # Validation and task utilities
```

## Bulk CSV Import

The CSV importer expects:

```text
id,title,description,category,priority,start_date,due_date,status
```

Validation includes:

- Required columns and task fields
- Valid `YYYY-MM-DD` dates
- Valid start/due date range
- Valid priority and status values
- Duplicate IDs inside the CSV
- IDs that already exist in SQLite
- Malformed CSV parsing
- Partial failures during import

Invalid rows are skipped while valid rows can still be imported.

## Getting Started

### Requirements

- Node.js
- pnpm
- Android emulator/device or iOS simulator/device

### Install

```bash
pnpm install
```

### Start

```bash
pnpm expo start
```

Useful commands:

```bash
pnpm expo start -c
pnpm expo start --android
pnpm expo start --ios
pnpm expo start --web
pnpm lint
```

## QA Coverage

The current app has been manually tested for:

- Task CRUD flows
- Navigation and back behavior
- Draft persistence
- Form reset after successful creation
- SQLite persistence
- Light/dark theme behavior
- CSV validation and error handling
- Duplicate CSV IDs
- Existing database duplicates
- Mixed valid/invalid CSV rows
- Large CSV imports, including a 500-row test file

## Assessment Notes

The project favors:

- Reusable components over duplicated UI
- Type-safe data models
- Separation between UI, state, and persistence
- Explicit validation and user-facing error states
- Local-first persistence without requiring a backend
- Consistent visual design
- Accessibility labels for interactive controls

## License

This project is a technical-assessment application.
