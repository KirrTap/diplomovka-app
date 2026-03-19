# AGENTS.md

---

Agent Contribution Guide for Diplomovka Repository

## Overview
This repository uses React (TypeScript), ESLint (flat config), Vitest (tests), Vite (build/dev), and Tailwind CSS (styling). All code agents (Copilot, GPT, Cursor) must adhere to these conventions for readable, robust, maintainable code.

## Build, Lint, Test, and Dev Commands

### Build
- Build the project:
  ```bash
  npm run build
  ```
  Equivalent to: `tsc -b && vite build`

### Development Server
- Start local dev server:
  ```bash
  npm run dev
  ```

### Lint
- Run ESLint linter:
  ```bash
  npm run lint
  ```
  Lints `.ts`, `.tsx`, `.js` files.

### Test
- Run all tests:
  ```bash
  npm run test
  ```
- Run a single test file or glob pattern:
  ```bash
  npx vitest src/components/Foo.test.tsx
  npx vitest src/**/*.test.ts
  ```
  (Partial paths or globs supported; see [Vitest docs](https://vitest.dev/))

### Preview Built App
- Preview production build:
  ```bash
  npm run preview
  ```

## Project Structure & Ignored Files
- Main source: `src/`
- Tests: `tests/` or alongside code in `src/`
- `dist/` is globally ignored (per ESLint config)

## ESLint & Formatting
- Flat config via `eslint.config.js`
- Extends:
  - `@eslint/js` (JS recommendations)
  - `typescript-eslint`
  - `eslint-plugin-react-hooks`
  - `eslint-plugin-react-refresh`
- ECMAScript version: 2020
- Browser globals via `globals.browser`
- Tailwind handled via `postcss.config.js`; always use `className` for styles

## Code Style Guidelines

### Imports
- Order: external then type imports, then relative imports
- Tidy import blocks; remove unused imports
- Always type-import TypeScript types/interfaces

### Formatting
- Indentation: 2 spaces
- Always use semicolons
- Prefer single quotes (except JSX attributes)
- Single space after commas; avoid trailing spaces
- Recommend max line length: 100 characters
- Keep JSX readable and compact

### Types
- Explicit types for props/context
- Use interfaces for props:
  ```ts
  interface Props { ... }
  ```
- Explicit return types for all functions/components
- Type all hooks/state:
  ```ts
  const [value, setValue] = useState<string>('')
  ```
- Avoid `any`; use precise types

### Naming Conventions
- camelCase for functions, variables, files (except React components)
- PascalCase for React components/classes
- ALL_CAPS for constants
- Descriptive names; favor clarity over conciseness

### Error Handling
- Always validate required props
- Custom hooks: throw clear errors if context is missing:
  ```ts
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  ```
- Return error boundaries/fallback UI for user-facing failures:
  ```tsx
  <ErrorBoundary fallback={<div>Something went wrong</div>}>
    <App />
  </ErrorBoundary>
  ```

### Component Guidelines
- Use function components (`React.FC<Props>`); avoid class components
- Strong interface for props (use destructuring)
- Always destructure props and hooks
- CSS exclusively via Tailwind (`className`); never `style={{...}}` inline

### State Management
- Use hooks, type state (`useState<Type>`) and context
- Type context values/updater; organize context logic in a module

### Test Guidelines
- Tests use Vitest (`*.test.ts` or `*.test.tsx`)
- Use descriptive test names robust against edge cases
- Place tests alongside source or in `tests/`

### Best Practices
- Keep functions/components small and single-responsibility
- Memoize expensive operations; avoid unnecessary re-renders
- Never abbreviate prop/function names (use `onSubmit`, not `onSbmt`)
- Document non-obvious logic with comments
- Remove unused variables and dead code

## Example Recipes

### Creating a New Component
1. File: `ComponentName.tsx`
2. PascalCase for names
3. Typed props:
   ```ts
   interface MyComponentProps {
     value: string;
     onClick: () => void;
   }
   export const MyComponent: React.FC<MyComponentProps> = ({ value, onClick }) => { ... }
   ```

### Adding a Test
- For component in `src/components/Foo.tsx`, create `src/components/Foo.test.tsx`:
   ```ts
   import { render, screen } from '@testing-library/react';
   import { Foo } from './Foo';
   test('renders Foo', () => {
     render(<Foo ... />);
     expect(screen.getByText('...')).toBeInTheDocument();
   });
   ```

### Handling Context
- Type context value:
   ```ts
   type ValueType = { lang: string; setLang: (l: string) => void };
   const Context = createContext<ValueType | null>(null);
   ```
- Throw on missing context (see Error Handling)

## Contributing Workflow for Agents
1. Run lint/test after changes; ensure both pass
2. Uphold all code style rules above
3. Build before submitting PR if builds are expected
4. Only modify files relevant to your task; preserve project structure
5. Document changes if logic is non-trivial
6. Agents MUST rigorously test new code (including edge cases)
7. If ambiguous, be explicit and leave comments
8. Commit/PR messages must summarize intent clearly

---

For questions, review this AGENTS.md or consult ESLint/Vitest docs.

> Keep it consistent, robust, and readable.

---
