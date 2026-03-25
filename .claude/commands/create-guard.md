# Create a New Route Guard

You are a code generation assistant for this Angular project. Your job is to scaffold a new route guard for protecting routes.

## Context

- Guards live in `src/core/auth/guard/` (for auth-related) or `src/core/{domain}/guard/` (for domain-specific)
- Guards are **functional guards** (not class-based) — Angular's modern pattern
- Guards return `boolean | UrlTree` and can be async
- Guards are referenced in route definitions via `canActivate: [guardFn]`
- The project uses `inject()` inside functional guards for dependency injection

## Arguments

$ARGUMENTS

Parse the arguments for:

- **Guard name** (required): e.g., "admin", "email-verified", "policy"
- **Guard type**: canActivate (default), canDeactivate, canMatch
- **Location**: auth or domain-specific (default: auth)

## Workflow

### Step 1: Generate with Angular CLI

```bash
ng generate guard core/auth/guard/{guard-name} --functional --skip-tests
```

Or for domain-specific:

```bash
ng generate guard core/{domain}/guard/{guard-name} --functional --skip-tests
```

### Step 2: Modify the generated guard

The CLI generates a basic functional guard. Modify it to:

1. **Inject required services** using `inject()` (e.g., `AuthService`, stores)
2. **Implement the access logic** — check conditions and return `true` or redirect
3. **Return a `UrlTree`** for redirects using `Router.createUrlTree()`

Example pattern for the generated guard:

```typescript
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

export const {guardName}Guard: CanActivateFn = async () => {
    const router = inject(Router);
    // Inject services as needed
    // const someStore = inject(SomeStoreService);

    // Check condition
    const allowed = true; // Replace with actual check

    if (!allowed) {
        return router.createUrlTree(["/home"]); // Redirect destination
    }

    return true;
};
```

### Step 3: Add to route definitions

In `src/app/app.routes.ts`, import and add the guard:

```typescript
import { {guardName}Guard } from "../core/auth/guard/{guard-name}.guard";

// In route definition:
{
    path: RoutePath.{route},
    component: {Component},
    canActivate: [userGuard, {guardName}Guard],  // Chain with existing guards
},
```

### Step 4: Run lint and format

```bash
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(ts)$')
if [ -n "$CHANGED_FILES" ]; then
    npx prettier --write $CHANGED_FILES
fi
```

## Existing Guards Reference

- **`userGuard`**: Checks auth token, refreshes if needed, loads user + workspaces, redirects to login
- **`adminGuard`**: Checks `user.role === Role.admin`, redirects to home
- **`devtoolsGuard`**: Only allows access in non-production environments

## Patterns

### Guard ordering matters

Guards in `canActivate` run in order. Always put `userGuard` first (it loads the user data other guards depend on):

```typescript
canActivate: [userGuard, adminGuard, customGuard];
```

### Async guards

Guards can be async — useful for loading data before checking:

```typescript
export const myGuard: CanActivateFn = async () => {
    const store = inject(SomeStoreService);
    await store.loadIfNeeded();
    return store.hasPermission;
};
```

### Redirect with query params

```typescript
return router.createUrlTree(["/login"], {
    queryParams: { returnUrl: state.url },
});
```
