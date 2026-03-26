# Add Workspace Multi-Tenancy

You are an assistant for this Angular project. Your job is to add workspace multi-tenancy support to an existing domain or the application.

## Context

Workspace multi-tenancy allows users to belong to multiple workspaces and switch between them. When enabled:

- Every HTTP request includes an `X-Workspace-ID` header (handled by `MainServerControllerService`)
- Every WebSocket connection includes a `workspace_id` URL param (handled by `MainServerGatewayService`)
- `WorkspaceContextService` stores the current workspace ID in localStorage
- Stores clear their state when the workspace changes
- The sidebar shows a workspace switcher

## What's Needed

### 1. WorkspaceContextService

This is a simple service that tracks the current workspace:

```
src/core/workspace/store/workspace-context.service.ts
```

- `currentWorkspaceId: string` — persisted in localStorage
- `workspaceChanged: Subject<void>` — emitted on workspace switch

### 2. Workspace entity and controller

Standard domain structure in `src/core/workspace/` with:

- Entity: `Workspace { name, slug, description, created_by }`
- Controller: CRUD for workspaces
- Store: Manages workspace list, current workspace, and workspace restoration on login

### 3. Store state clearing

Any store managing workspace-scoped data must clear on workspace change:

```typescript
constructor() {
    const workspaceContext = inject(WorkspaceContextService);
    workspaceContext.workspaceChanged.subscribe(() => {
        this.items = [];
        this.itemsById.clear();
        this.hasMore = true;
    });
}
```

### 4. MainServerControllerService integration

The `setHttp()` method already reads from `WorkspaceContextService.currentWorkspaceId` and sets the `X-Workspace-ID` header. The `watchWorkspace()` method re-creates the HTTP client when the workspace changes.

### 5. Sidebar workspace switcher

Add a workspace selector component to the sidebar that:

- Lists available workspaces
- Sets `WorkspaceContextService.currentWorkspaceId` on selection
- Emits `workspaceChanged`

## Arguments

$ARGUMENTS

If an argument is provided (a domain name), add workspace clearing to that domain's store. Otherwise, set up the full workspace infrastructure.

## Workflow

### For full workspace setup:

1. Generate `WorkspaceContextService`:

    ```bash
    ng generate service core/workspace/store/workspace-context --skip-tests
    ```

2. Use `/create-core-domain workspace` to scaffold the workspace domain

3. Generate the workspace switcher component:

    ```bash
    ng generate component common/workspace-switcher --flat=false
    ```

4. Wire workspace-aware stores to clear on `workspaceChanged`

### For adding workspace awareness to an existing domain:

1. Inject `WorkspaceContextService` in the store constructor
2. Subscribe to `workspaceChanged` and clear state
3. Ensure the controller extends `MainServerControllerService` (which handles the header automatically)
