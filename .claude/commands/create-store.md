# Create a New Store Service

You are a code generation assistant for this Angular project. Your job is to scaffold a new store service that follows the project's component => store => controller pattern.

## Context

- Stores live in `src/core/{domain}/store/`
- Stores are **Injectable with `providedIn: "root"`** (singleton services)
- Stores inject their corresponding **controller** for HTTP calls
- Stores manage **local state** (arrays, maps, flags) — they are the source of truth for the UI
- Components read from stores directly (plain property access)
- Stores handle **pagination**, **search**, **caching**, and **data normalization**

## Architecture

```
Component (UI)
  ↓ inject
Store (state + orchestration)
  ↓ inject
Controller (HTTP calls via MainServerControllerService)
  ↓
Backend API
```

## Arguments

$ARGUMENTS

Parse the arguments for:

- **Domain name** (required): e.g., "product", "order", "invoice"
- **Features**: Which features to include — crud, search, pagination (default: all)

## Workflow

### Step 1: Ensure the domain folder exists

```bash
mkdir -p src/core/{domain}/store
```

### Step 2: Generate with Angular CLI

```bash
ng generate service core/{domain}/store/{domain}-store --skip-tests
```

### Step 3: Modify the generated service

The CLI generates a basic service. Modify it to follow the store pattern:

1. **Inject the controller** (must already exist — use `/create-controller` first if needed)
2. **Add state properties**: items array, itemsById map, loading/hasMore flags
3. **Add methods**: get (paginated), create, update, delete, search

Key modifications to make on the generated file:

```typescript
import { Injectable, inject } from "@angular/core";
import { {Domain}ControllerService } from "../controller/{domain}-controller.service";
import { {Domain}Fields } from "../entity/{domain}.entity";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrder, DateOrderEnum } from "../../common/model/date-order.model";
```

Add these state properties and methods:

- `items: {Domain}Fields[] = []` — main list
- `itemsById = new Map<string, {Domain}Fields>()` — O(1) lookup cache
- `isLoading = false` — loading flag
- `hasMore = true` — pagination flag
- `searchResults: {Domain}Fields[] = []` — search results (separate from main list)
- `async get(reset = false)` — paginated fetch with offset derived from `items.length`
- `async create(payload)` — creates and prepends to local state
- `async update(id, payload)` — updates in both array and map
- `async delete(id)` — removes from both array and map
- `async search(query)` — populates searchResults

### Step 4: Run lint and format

```bash
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(ts)$')
if [ -n "$CHANGED_FILES" ]; then
    npx prettier --write $CHANGED_FILES
fi
```

## Patterns and Guidelines

### State is mutable, not observable

Stores use plain arrays and Maps, not BehaviorSubjects. Components access properties directly. Angular's change detection picks up mutations.

### Pagination pattern

- `get(reset = false)` — call with `reset = true` on first load or refresh
- Track `hasMore` by comparing result length to page size
- `offset` is derived from `items.length`
- Default page size: 15

### Search pattern

- Separate `searchResults` array from main `items`
- Clear results on empty query
- For debounced search, implement in the component with `setTimeout`

### Cache invalidation

- On create: prepend to `items`, add to map
- On update: replace in both `items` array and map
- On delete: remove from both

### When NOT to use a store

- If data is only used in one component and doesn't need caching, call the controller directly
- If data is static/config, use environment or a constant
