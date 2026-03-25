# Create a New Controller Service

You are a code generation assistant for this Angular project. Your job is to scaffold a new controller service that extends `MainServerControllerService` for HTTP communication with the backend.

## Context

- Controllers live in `src/core/{domain}/controller/`
- Controllers extend `MainServerControllerService` which provides an Axios HTTP client with:
    - Automatic token injection (Authorization header)
    - Workspace ID header (`X-Workspace-ID`) if workspace multi-tenancy is enabled
    - Base URL construction from environment config
- Controllers define the API path via `ServerEndpoints` enum
- Controllers return raw data — no state management (that's the store's job)
- Each controller method maps to one backend API endpoint

## Arguments

$ARGUMENTS

Parse the arguments for:

- **Domain name** (required): e.g., "product", "order", "invoice"
- **API base path**: The server endpoint path (default: domain name)
- **Methods**: Which CRUD methods to include (default: get, create, update, delete, search)

## Workflow

### Step 1: Add the server endpoint

In `src/core/common/constant/server-endpoints.enum.ts`, add the endpoint:

```typescript
{domain} = "{domain}",
```

Also add any sub-endpoints the controller will use.

### Step 2: Create the entity (if it doesn't exist)

Create `src/core/{domain}/entity/{domain}.entity.ts`:

```typescript
import { Audit } from "../../common/model/audit.model";

export interface {Domain}Fields extends Audit {
    // Add domain-specific fields
    name: string;
}
```

### Step 3: Generate with Angular CLI

```bash
mkdir -p src/core/{domain}/controller
ng generate service core/{domain}/controller/{domain}-controller --skip-tests
```

### Step 4: Modify the generated service

The CLI generates a basic service. Modify it to:

1. **Extend `MainServerControllerService`** instead of being a plain service
2. **Set the path and HTTP client** in the constructor
3. **Add CRUD methods** that use `this.http` (Axios instance)

Key modifications:

```typescript
import { Injectable } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { {Domain}Fields } from "../entity/{domain}.entity";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrder } from "../../common/model/date-order.model";
```

The class must:

- `extends MainServerControllerService`
- Call `super()`, `this.setPath(ServerEndpoints.{domain})`, and `this.setHttp()` in constructor
- Define async methods that return `(await this.http.{method}<T>(...)).data`

### Step 5: Create model files (if needed)

```bash
mkdir -p src/core/{domain}/model
```

Create request/query models as plain TypeScript interfaces in `src/core/{domain}/model/`.

### Step 6: Run lint and format

```bash
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(ts)$')
if [ -n "$CHANGED_FILES" ]; then
    npx prettier --write $CHANGED_FILES
fi
```

## Key Patterns

### Constructor setup

Every controller must call `setPath()` and `setHttp()` in the constructor:

```typescript
constructor() {
    super();
    this.setPath(ServerEndpoints.{domain});
    this.setHttp();
}
```

### Multi-segment paths

For nested resources, chain multiple endpoints:

```typescript
this.setPath(ServerEndpoints.workspace, workspaceId, ServerEndpoints.member);
```

### Requests without workspace header

Use `requestWithoutWorkspace()` for endpoints that shouldn't include the workspace ID:

```typescript
return (await this.requestWithoutWorkspace<T>("get", "")).data;
```

### Error handling

Controllers don't handle errors — they propagate to the store or component. The base class interceptor handles global concerns (billing, auth). For domain-specific error handling, catch in the store.
