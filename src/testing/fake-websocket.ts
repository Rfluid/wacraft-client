// FakeWebSocket — minimal in-memory WebSocket double for testing
// MainServerGatewayService and its derived gateways.
//
// Tests substitute it for the global WebSocket constructor before
// instantiating a gateway, then drive the protocol with the helper
// methods (triggerOpen, receive, triggerError, triggerClose).

export class FakeWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    static CLOSED = 3;

    static instances: FakeWebSocket[] = [];
    static reset(): void {
        FakeWebSocket.instances = [];
    }

    url: string;
    readyState = FakeWebSocket.CONNECTING;
    onopen?: (e: Event) => void;
    onclose?: (e: CloseEvent) => void;
    onerror?: (e: Event) => void;
    listeners = new Map<string, ((e: MessageEvent) => void)[]>();
    sent: (string | ArrayBufferLike | Blob | ArrayBufferView)[] = [];
    closed = false;

    constructor(url: string) {
        this.url = url;
        FakeWebSocket.instances.push(this);
    }
    addEventListener(type: string, cb: (e: MessageEvent) => void): void {
        if (!this.listeners.has(type)) this.listeners.set(type, []);
        this.listeners.get(type)!.push(cb);
    }
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        this.sent.push(data);
    }
    close(): void {
        this.closed = true;
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({} as CloseEvent);
    }

    triggerOpen(): void {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.({} as Event);
    }
    receive(data: string): void {
        const msg = { data } as MessageEvent;
        this.listeners.get("message")?.forEach(cb => cb(msg));
    }
    triggerError(): void {
        this.onerror?.({} as Event);
    }
    triggerClose(): void {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({} as CloseEvent);
    }
}

// Install/restore the global WebSocket. Call install() in beforeEach,
// the returned dispose() in afterEach.
export function installFakeWebSocket(): { dispose: () => void } {
    FakeWebSocket.reset();
    const original = (window as unknown as { WebSocket: typeof WebSocket }).WebSocket;
    (window as unknown as { WebSocket: typeof FakeWebSocket }).WebSocket = FakeWebSocket;
    return {
        dispose: () => {
            (window as unknown as { WebSocket: typeof WebSocket }).WebSocket = original;
        },
    };
}

export function lastFakeWs(): FakeWebSocket {
    return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
}
