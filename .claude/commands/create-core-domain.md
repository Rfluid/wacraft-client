# Create a New Core Domain

You are a code generation assistant for this Angular project. Your job is to scaffold a complete new domain in `src/core/` following the project's architecture.

## Context

A "domain" is a business concept (e.g., product, order, invoice) that gets its own folder in `src/core/` with a standard structure:

```
src/core/{domain}/
├── controller/    — HTTP client (extends MainServerControllerService)
├── entity/        — TypeScript interface for the backend entity
├── model/         — Request/response/query models
├── store/         — State management service
└── gateway/       — WebSocket client (optional, only for real-time features)
```

The three-layer data flow is: **Component => Store => Controller => Backend**

## Arguments

$ARGUMENTS

Parse the arguments for:

- **Domain name** (required): e.g., "product", "order", "invoice"
- **Entity fields** (optional): Key fields beyond the Audit base (id, created_at, updated_at)
- **Real-time**: Whether to include a WebSocket gateway (default: no)

## Workflow

### Step 1: Create directory structure

```bash
mkdir -p src/core/{domain}/{controller,entity,model,store}
```

If real-time is needed:

```bash
mkdir -p src/core/{domain}/gateway
```

### Step 2: Create the entity

Create `src/core/{domain}/entity/{domain}.entity.ts`:

```typescript
import { Audit } from "../../common/model/audit.model";

export interface {Domain}Fields extends Audit {
    // Domain-specific fields
    name: string;
}
```

The `Audit` base provides: `id: string`, `created_at: Date`, `updated_at: Date`.

### Step 3: Create models

Create request/query models as needed:

- `src/core/{domain}/model/create-{domain}.model.ts` — fields for creation (no Audit fields)
- `src/core/{domain}/model/query-{domain}.model.ts` — optional filter fields

### Step 4: Add server endpoint

In `src/core/common/constant/server-endpoints.enum.ts`, add:

```typescript
{domain} = "{domain}",
```

### Step 5: Generate controller with Angular CLI

```bash
ng generate service core/{domain}/controller/{domain}-controller --skip-tests
```

Modify to extend `MainServerControllerService`, set path and HTTP in constructor, add CRUD methods. See `/create-controller` for details.

### Step 6: Generate store with Angular CLI

```bash
ng generate service core/{domain}/store/{domain}-store --skip-tests
```

Modify to inject the controller, add state properties and CRUD/search/pagination methods. See `/create-store` for details.

### Step 7: Generate gateway (if real-time)

```bash
ng generate service core/{domain}/gateway/{domain}-gateway --skip-tests
```

Modify to extend `MainServerGatewayService`, set path and WebSocket in constructor, add message routing. See `/create-gateway` for details.

### Step 8: Run lint and format

```bash
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(ts)$')
if [ -n "$CHANGED_FILES" ]; then
    npx prettier --write $CHANGED_FILES
fi
```

## What goes where

| Layer          | Location      | Responsibility                            |
| -------------- | ------------- | ----------------------------------------- |
| **Entity**     | `entity/`     | Backend data shape (extends Audit)        |
| **Model**      | `model/`      | Request payloads, query filters, DTOs     |
| **Controller** | `controller/` | HTTP calls, returns raw data              |
| **Store**      | `store/`      | State arrays/maps, caching, orchestration |
| **Gateway**    | `gateway/`    | WebSocket real-time messages              |

## When to use `core/` vs `app/`

- `src/core/` — Reusable business logic: services, entities, models, controllers, stores, pipes, guards. Domain-agnostic of UI.
- `src/app/` — UI components: pages, layouts, shared UI components. Imports from `core/`.

A core domain should **never** import from `src/app/`. The dependency flows one way: `app/ → core/`.
