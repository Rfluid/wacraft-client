# Add Billing Redirect Interceptor

You are an assistant for this Angular project. Your job is to add billing-aware HTTP interceptor logic to `MainServerControllerService`.

## Context

The billing redirect interceptor is an optional pattern that handles 429 (rate limit) responses with a `billing` context by redirecting the user to a billing page. This is useful when the backend enforces usage quotas.

## How It Works

In `MainServerControllerService.attachInterceptors()`, add an Axios response interceptor:

```typescript
this.http.interceptors.response.use(undefined, error => {
    if (
        error?.response?.status === 429 &&
        error?.response?.data?.context === "billing" &&
        !this.billingRedirectInProgress &&
        !this.router.url.startsWith(`/${RoutePath.billing}`) &&
        !this.router.url.startsWith(`/${RoutePath.auth}`)
    ) {
        this.billingRedirectInProgress = true;
        this.router.navigate([`/${RoutePath.billing}`]);
    }
    return Promise.reject(error);
});
```

Key points:

- Only triggers on 429 with `context: "billing"` in the response body
- Prevents redirect loops (checks `billingRedirectInProgress` flag)
- Doesn't redirect if already on billing or auth pages
- Resets the flag on `NavigationEnd` events

## Arguments

$ARGUMENTS

## Workflow

1. Inject `Router` in `MainServerControllerService`
2. Add `billingRedirectInProgress = false` flag
3. Add the interceptor logic in `attachInterceptors()`
4. Add a `watchBillingRedirect()` method that resets the flag on `NavigationEnd`
5. Add `RoutePath.billing` to the route enum
6. Create the billing page component with `/create-component billing`

## Prerequisites

- A billing page must exist at `RoutePath.billing`
- The backend must return `{ context: "billing" }` in 429 responses for quota violations
