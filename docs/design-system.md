# Documentation AI Assistant Design System

This file is the source of truth for UI work in the renderer. Agents must read and follow it before creating or changing UI components.

## Product UI Principles

- The application language is English.
- The interface is desktop-first, dense enough for engineering workflows, but still readable.
- Use dark surfaces, high contrast text, and restrained accent colors.
- Prefer direct actions over hidden menus while the product is early.
- Do not create custom CSS files for component styling. Use Tailwind utility classes in components.
- Keep the single Tailwind entry file at `src/renderer/src/styles/tailwind.css`.

## Design Tokens

Use Tailwind classes directly:

- App background: `bg-slate-950`
- Sidebar surface: `bg-gradient-to-b from-slate-900 to-slate-950`
- Card surface: `bg-white/[0.045]` or `bg-white/[0.055]`
- Borders: `border-white/10`, hover `border-white/20`
- Primary accent: `indigo-300`, `indigo-400`
- Text primary: `text-white` or `text-slate-100`
- Text secondary: `text-slate-400`
- Success: `emerald`
- Warning / queued: `amber`
- Processing: `cyan`
- Danger / failed: `red`

## Atomic Design Structure

Renderer UI components live under:

```text
src/renderer/src/components/
  atoms/
  molecules/
  organisms/
```

### Atoms

Atoms are the smallest reusable UI pieces. They must not know business API details.

Current atoms:

- `Button` - shared button primitive with variants: `primary`, `secondary`, `danger`, `ghost`.
- `StatusBadge` - renders a document status badge.
- `ErrorMessage` - renders an error alert.
- `EmptyState` - renders an empty/loading placeholder message.

Before creating a new atom, check if an existing atom can be extended with a small prop.

### Molecules

Molecules combine atoms into focused UI blocks. They may receive domain data as props, but must not fetch data directly.

Current molecules:

- `FileDropzone` - drag-and-drop and file picker input.
- `DocumentCard` - displays one document, status, parse action, delete action.

Molecules should expose callbacks like `onDelete`, `onParse`, `onFileSelected`. They should not import API clients.

### Organisms

Organisms own a full feature area. They can use TanStack Query and Zustand.

Current organisms:

- `DocumentsSidebar` - owns document list, upload, parse, delete, polling for active documents.
- `Workspace` - main content area for the future chat/chunk previews.

Organisms may compose atoms and molecules. If an organism grows past one feature area, split it into smaller organisms.

## Data Fetching

Use TanStack Query for server state:

- API clients live in `src/renderer/src/api/`.
- Query keys should be stable arrays, for example `['documents']`.
- Use `useQuery` for lists/details.
- Use `useMutation` for upload, parse, delete, then invalidate affected queries.
- Do not keep backend documents in Zustand.

## Client State

Use Zustand only for local UI state:

- stores live in `src/renderer/src/store/`.
- current store: `documents-ui.store.ts`.
- Good Zustand state: selected document id, panel visibility, local UI preferences.
- Bad Zustand state: lists fetched from the backend, document statuses, parsing results.

## Backend Contracts Used By UI

Current endpoints:

- `GET /documents` - list all uploaded documents.
- `POST /documents/upload` - multipart upload with form field `file`.
- `POST /documents/:id/parse` - enqueue parsing for an uploaded/failed document.
- `DELETE /documents/:id` - delete document metadata and original file.

## Rules For Future Agents

- Keep `App.tsx` as a composition root only.
- Do not put large JSX blocks directly in `App.tsx`.
- Add reusable primitives to `atoms`.
- Add domain UI blocks to `molecules`.
- Add data-aware feature panels to `organisms`.
- Keep all visible app text in English.
- Prefer extending current components over creating parallel variants.
- Do not add new styling systems, CSS modules, styled-components, or ad hoc CSS files.
