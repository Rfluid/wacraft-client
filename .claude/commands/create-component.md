# Create a New Page Component

You are a code generation assistant for this Angular project. Your job is to scaffold a new page component that follows the project's layout and routing conventions.

## Context

- This project uses **standalone components** (no NgModules)
- Pages wrap their content in `SidebarLayoutComponent` for navigation
- Routes are defined in `src/app/app.routes.ts` using a `RoutePath` enum
- Protected routes use `canActivate: [userGuard]` (and optionally `adminGuard`)
- Components use the `app-` prefix (kebab-case selector)
- Each component has its own folder under `src/app/`
- Styling uses SCSS + Tailwind utility classes

## Arguments

$ARGUMENTS

Parse the arguments for:

- **Component name** (required): e.g., "settings", "dashboard", "profile"
- **Protected**: Whether it requires authentication (default: yes)
- **Admin only**: Whether it requires admin role (default: no)
- **Layout**: Whether it uses sidebar layout (default: yes)

## Workflow

### Step 1: Generate with Angular CLI

```bash
ng generate component {component-name} --flat=false
```

This creates:

- `src/app/{component-name}/{component-name}.component.ts`
- `src/app/{component-name}/{component-name}.component.html`
- `src/app/{component-name}/{component-name}.component.scss`
- `src/app/{component-name}/{component-name}.component.spec.ts`

### Step 2: Modify the generated component for layout

Update the generated `.component.ts` to import `SidebarLayoutComponent` and `RoutePath`:

```typescript
import { SidebarLayoutComponent } from "../common/sidebar-layout/sidebar-layout.component";
import { RoutePath } from "../app.routes";
```

Add `SidebarLayoutComponent` to the `imports` array and expose `RoutePath`:

```typescript
readonly RoutePath = RoutePath;
```

### Step 3: Set up the template with sidebar layout

Replace the generated `.component.html` with:

```html
<app-sidebar-layout [activePage]="RoutePath.{componentName}">
    <div class="p-6">
        <h1 class="text-2xl font-bold" i18n>{Component Title}</h1>
    </div>
</app-sidebar-layout>
```

If the page does NOT use sidebar layout (e.g., auth pages), skip `SidebarLayoutComponent` and render content directly.

### Step 4: Add the route path

In `src/app/app.routes.ts`:

1. Add to the `RoutePath` enum:

    ```typescript
    {componentName} = "{component-name}",
    ```

2. Add the import at the top:

    ```typescript
    import { {ComponentName}Component } from "./{component-name}/{component-name}.component";
    ```

3. Add the route in the `routes` array (before the catch-all redirect):
    ```typescript
    {
        path: RoutePath.{componentName},
        component: {ComponentName}Component,
        canActivate: [userGuard],  // Add adminGuard if admin-only
    },
    ```

### Step 5: Add to sidebar navigation (if needed)

If this page should appear in the sidebar, update `src/app/common/sidebar/sidebar.component.ts`:

- Add to the `navItems` array with appropriate icon, label, and route
- Add visibility conditions based on policies if applicable

### Step 6: Run lint and format

```bash
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(html|ts|scss)$')
if [ -n "$CHANGED_FILES" ]; then
    npx prettier --write $CHANGED_FILES
fi
```

### Step 7: Extract i18n (if component has translatable text)

```bash
ng extract-i18n --output-path src/locale
```

Then add translations to `messages.pt-BR.xlf` and `messages.es-CL.xlf` for any new `<trans-unit>` entries with `state="new"`.

## Notes

- For pages that use a store, inject the store in the component and call load methods in `ngOnInit()`
- Keep components focused — delegate business logic to stores and controllers in `src/core/`
