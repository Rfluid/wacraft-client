# Create a New WebSocket Gateway Service

You are a code generation assistant for this Angular project. Your job is to scaffold a new WebSocket gateway service that extends `MainServerGatewayService` for real-time communication.

## Context

- Gateways live in `src/core/{domain}/gateway/`
- Gateways extend `MainServerGatewayService` which provides:
    - WebSocket connection with auto-reconnect (exponential backoff, max 10 attempts)
    - Token hot-swap (re-establishes connection when auth token changes)
    - Application-level ping/keep-alive
    - Message subject for reactive message handling
    - Workspace ID in connection URL params
- Gateways are used for real-time features (chat, live updates, notifications)
- The WebSocket URL is built from `environment.mainServerUrl` with `ws://` or `wss://`

## Arguments

$ARGUMENTS

Parse the arguments for:

- **Domain name** (required): e.g., "notification", "chat", "live-update"
- **Server endpoint path**: The WebSocket endpoint path
- **Message types**: Types of messages expected from the server (optional)

## Workflow

### Step 1: Add the server endpoint

In `src/core/common/constant/server-endpoints.enum.ts`, add the WebSocket endpoint:

```typescript
{domain}Ws = "{domain}/ws",
```

### Step 2: Define message models

Create `src/core/{domain}/model/{domain}-message.model.ts` with interfaces for each message type your WebSocket will send/receive.

### Step 3: Generate with Angular CLI

```bash
mkdir -p src/core/{domain}/gateway
ng generate service core/{domain}/gateway/{domain}-gateway --skip-tests
```

### Step 4: Modify the generated service

The CLI generates a basic service. Modify it to:

1. **Extend `MainServerGatewayService`** instead of being a plain service
2. **Set the path and WebSocket** in the constructor
3. **Subscribe to `messageSubject`** to parse and route incoming messages
4. **Create typed Subjects** for each message type

Key modifications:

```typescript
import { Injectable, inject } from "@angular/core";
import { MainServerGatewayService } from "../../common/gateway/main-server-gateway.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { Subject } from "rxjs";
import { NGXLogger } from "ngx-logger";
```

The class must:

- `extends MainServerGatewayService`
- Call `super()`, `this.setPath(ServerEndpoints.{domain}Ws)`, `this.setWs()` in constructor
- Subscribe to `this.messageSubject` and parse JSON messages
- Route parsed messages to typed Subject properties
- Expose `async send{Action}()` methods using `this.sendWebSocketMessage()`

### Step 5: Connect gateway to store (optional)

If the gateway should update store state in real-time, inject it in the store and subscribe to its typed subjects in the store constructor.

### Step 6: Run lint and format

```bash
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(ts)$')
if [ -n "$CHANGED_FILES" ]; then
    npx prettier --write $CHANGED_FILES
fi
```

## Key Patterns

### Gateway lifecycle

The gateway connects automatically in the constructor via `setWs()`. Token changes trigger reconnection automatically (inherited from `MainServerGatewayService`).

### Message handling

- Subscribe to `messageSubject` for raw WebSocket messages
- Parse JSON and route to typed Subjects for consumers
- Use `Subject` (not `BehaviorSubject`) — messages are events, not state

### Sending messages

Use `sendWebSocketMessage()` which waits for the connection to be open:

```typescript
await this.sendWebSocketMessage(JSON.stringify({ type: "action", payload }));
```

### Connection events

- `opened` — resolves once when first connected (use with `await`)
- `openSubject` — emits on every connection open
- `errorSubject` — emits on connection errors

### When to use a gateway vs controller

- **Gateway (WebSocket)**: Real-time updates, live data, chat, notifications
- **Controller (HTTP)**: CRUD operations, one-off requests, file uploads

### Ping configuration

The base gateway sends pings at `environment.webSocketBasePingInterval` (default 30s). Override per-gateway:

```typescript
this.pingInterval = 15_000; // 15s for high-frequency gateway
```
