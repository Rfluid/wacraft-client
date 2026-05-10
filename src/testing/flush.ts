// Tick the microtask queue. Stores that use MutexSwapper or fire-and-forget
// `.then` chains issue many awaits before reaching a stable state, so tests
// that observe state after such operations need to drain enough microtasks.
// 100 is intentionally generous; the ceiling is single-millisecond per call.
export async function drain(times = 100): Promise<void> {
    for (let i = 0; i < times; i++) await Promise.resolve();
}
