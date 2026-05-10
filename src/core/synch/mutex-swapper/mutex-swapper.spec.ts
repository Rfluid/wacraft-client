import { MutexSwapper } from "./mutex-swapper";
import { defer, drain } from "../../../testing";

describe("MutexSwapper", () => {
    let swapper: MutexSwapper<string>;

    beforeEach(() => {
        swapper = new MutexSwapper<string>();
    });

    describe("basic semantics", () => {
        it("acquires and releases a mutex for a single id", async () => {
            await swapper.acquire("id1");
            await swapper.release("id1");
            expect().nothing();
        });

        it("permits sequential acquisitions for the same id", async () => {
            await swapper.acquire("id1");
            await swapper.release("id1");
            await swapper.acquire("id1");
            await swapper.release("id1");
            expect().nothing();
        });

        it("blocks concurrent acquisitions for the same id until release", async () => {
            let acquired2 = false;

            await swapper.acquire("id1");

            const p2 = swapper.acquire("id1").then(() => {
                acquired2 = true;
            });

            await drain();
            expect(acquired2).toBe(false);

            await swapper.release("id1");
            await p2;
            expect(acquired2).toBe(true);
            await swapper.release("id1");
        });

        it("does not block concurrent acquisitions across distinct ids", async () => {
            await swapper.acquire("id1");
            await swapper.acquire("id2");
            // If they shared a lock the second await would never resolve.
            await swapper.release("id1");
            await swapper.release("id2");
            expect().nothing();
        });

        it("tolerates release without acquire", async () => {
            await swapper.release("id1");
            expect().nothing();
        });

        it("tolerates over-release after the last acquire", async () => {
            await swapper.acquire("id1");
            await swapper.release("id1");
            await swapper.release("id1");
            expect().nothing();
        });

        it("permits re-acquisition after the previous owner released", async () => {
            await swapper.acquire("id1");
            await swapper.release("id1");
            await swapper.acquire("id1");
            await swapper.release("id1");
            expect().nothing();
        });
    });

    describe("waiter ordering and concurrency", () => {
        it("serializes N concurrent acquirers in queue order", async () => {
            const log: number[] = [];
            const N = 5;

            await swapper.acquire("k");
            log.push(-1);

            const tasks = Array.from({ length: N }, (_, i) =>
                (async () => {
                    await swapper.acquire("k");
                    log.push(i);
                    // Force a microtask gap inside the critical section to make
                    // the test sensitive to overlapping holders if mutual exclusion broke.
                    await drain(2);
                    await swapper.release("k");
                })(),
            );

            // Give the waiters a chance to enqueue before the holder releases.
            await drain();
            expect(log).toEqual([-1]);

            await swapper.release("k");
            await Promise.all(tasks);

            expect(log.length).toBe(N + 1);
            // First entry is the original holder, then waiters in FIFO order.
            expect(log[0]).toBe(-1);
            expect(log.slice(1)).toEqual([0, 1, 2, 3, 4]);
        });

        it("guarantees mutual exclusion: at most one holder per key at any time", async () => {
            // Run a stress loop with overlapping critical sections that read-then-write
            // a shared counter; if the lock leaks, the final count will mismatch.
            const counters = new Map<string, number>();
            const writers = 30;

            const tasks = Array.from({ length: writers }, (_, i) =>
                (async () => {
                    const key = i % 3 === 0 ? "a" : i % 3 === 1 ? "b" : "c";
                    await swapper.acquire(key);
                    const before = counters.get(key) ?? 0;
                    await drain(3); // race window if the lock is broken
                    counters.set(key, before + 1);
                    await swapper.release(key);
                })(),
            );

            await Promise.all(tasks);

            // Each key got exactly its share of writers.
            const a = Math.floor((writers + 2) / 3);
            const b = Math.floor((writers + 1) / 3);
            const c = Math.floor(writers / 3);
            expect(counters.get("a")).toBe(a);
            expect(counters.get("b")).toBe(b);
            expect(counters.get("c")).toBe(c);
        });

        it("releases unblock exactly one waiter at a time", async () => {
            await swapper.acquire("k");

            let r1 = false;
            let r2 = false;
            const w1 = swapper.acquire("k").then(() => {
                r1 = true;
            });
            const w2 = swapper.acquire("k").then(() => {
                r2 = true;
            });

            await drain();
            expect(r1).toBe(false);
            expect(r2).toBe(false);

            await swapper.release("k");
            await w1;
            await drain();
            expect(r1).toBe(true);
            expect(r2).toBe(false); // second waiter still blocked

            await swapper.release("k");
            await w2;
            expect(r2).toBe(true);
            await swapper.release("k");
        });
    });

    describe("refcount lifecycle", () => {
        it("permits a fresh acquire after the previous holder fully released and the entry was reaped", async () => {
            // After release with refcount → 0 the implementation deletes the
            // mutex entry from the map. A subsequent acquire must create a new
            // mutex transparently and not deadlock.
            for (let i = 0; i < 10; i++) {
                await swapper.acquire("k");
                await swapper.release("k");
            }
            expect().nothing();
        });

        it("does not lose a waiter when the holder's release races with a new acquire", async () => {
            // Holder A is holding. B starts to acquire (queues on the existing mutex).
            // A releases. B should be unblocked. Then C acquires after the entry was reaped.
            await swapper.acquire("k");

            const bDone = defer<void>();
            const cDone = defer<void>();

            const b = (async () => {
                await swapper.acquire("k");
                bDone.resolve();
                await swapper.release("k");
            })();

            await drain();
            await swapper.release("k");
            await bDone.promise;

            const c = (async () => {
                await swapper.acquire("k");
                cDone.resolve();
                await swapper.release("k");
            })();

            await Promise.all([b, c, cDone.promise]);
            expect().nothing();
        });
    });
});
