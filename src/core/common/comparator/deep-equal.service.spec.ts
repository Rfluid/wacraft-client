import { TestBed } from "@angular/core/testing";

import { DeepEqualService } from "./deep-equal.service";

describe("DeepEqualService", () => {
    let svc: DeepEqualService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        svc = TestBed.inject(DeepEqualService);
    });

    describe("primitives", () => {
        it("returns true for equal primitives", () => {
            expect(svc.areEqual(1, 1)).toBe(true);
            expect(svc.areEqual("a", "a")).toBe(true);
            expect(svc.areEqual(true, true)).toBe(true);
        });

        it("returns false for unequal primitives", () => {
            expect(svc.areEqual(1, 2)).toBe(false);
            expect(svc.areEqual("a", "b")).toBe(false);
            expect(svc.areEqual(true, false)).toBe(false);
        });

        it("treats different number/string types as unequal", () => {
            expect(svc.areEqual(1, "1")).toBe(false);
            expect(svc.areEqual(0, false)).toBe(false);
        });
    });

    describe("normalization (empty values)", () => {
        // The service normalizes null, undefined, "", and {} to null before comparison.
        it("treats null and undefined as equal", () => {
            expect(svc.areEqual(null, undefined)).toBe(true);
        });

        it("treats empty string as equal to null/undefined", () => {
            expect(svc.areEqual("", null)).toBe(true);
            expect(svc.areEqual("", undefined)).toBe(true);
        });

        it("treats empty object as equal to null/undefined/empty string", () => {
            expect(svc.areEqual({}, null)).toBe(true);
            expect(svc.areEqual({}, undefined)).toBe(true);
            expect(svc.areEqual({}, "")).toBe(true);
        });

        it("does not treat empty array as empty (arrays bypass the empty check)", () => {
            // Empty array is a valid array that compares structurally; not normalized to null.
            expect(svc.areEqual([], [])).toBe(true);
            expect(svc.areEqual([], null)).toBe(false);
            expect(svc.areEqual([], {})).toBe(false);
        });
    });

    describe("Date", () => {
        it("compares Dates by epoch time", () => {
            const a = new Date("2024-01-01T00:00:00Z");
            const b = new Date("2024-01-01T00:00:00Z");
            expect(svc.areEqual(a, b)).toBe(true);
        });

        it("returns false for different Dates", () => {
            const a = new Date("2024-01-01");
            const b = new Date("2024-01-02");
            expect(svc.areEqual(a, b)).toBe(false);
        });

        it("does not treat Date as an empty object even when its key set is empty", () => {
            // `{}` normalizes to null but Date instances must not.
            expect(svc.areEqual(new Date(0), null)).toBe(false);
            expect(svc.areEqual(new Date(0), {})).toBe(false);
        });
    });

    describe("arrays", () => {
        it("compares arrays element-wise", () => {
            expect(svc.areEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(svc.areEqual([1, 2, 3], [1, 2, 4])).toBe(false);
        });

        it("returns false for arrays of different lengths", () => {
            expect(svc.areEqual([1, 2], [1, 2, 3])).toBe(false);
        });

        it("recurses into nested structures", () => {
            expect(
                svc.areEqual(
                    [
                        { a: 1, b: [2, 3] },
                        { a: 4, b: [5] },
                    ],
                    [
                        { a: 1, b: [2, 3] },
                        { a: 4, b: [5] },
                    ],
                ),
            ).toBe(true);
            expect(
                svc.areEqual(
                    [
                        { a: 1, b: [2, 3] },
                        { a: 4, b: [5] },
                    ],
                    [
                        { a: 1, b: [2, 3] },
                        { a: 4, b: [6] },
                    ],
                ),
            ).toBe(false);
        });

        it("normalization applies inside arrays (null / undefined / '' equal)", () => {
            expect(svc.areEqual([null, "x"], [undefined, "x"])).toBe(true);
            expect(svc.areEqual(["", "x"], [null, "x"])).toBe(true);
        });
    });

    describe("objects", () => {
        it("compares same-shape objects deeply", () => {
            expect(svc.areEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
            expect(svc.areEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
        });

        it("treats keys missing on one side as 'present-undefined' on the other (which normalizes)", () => {
            // a vs b: { x: 1, y: undefined } vs { x: 1 } → both y values normalize to null → equal.
            expect(svc.areEqual({ x: 1, y: undefined }, { x: 1 })).toBe(true);
            // But a missing key vs a real value mismatches.
            expect(svc.areEqual({ x: 1, y: 2 }, { x: 1 })).toBe(false);
        });

        it("compares nested objects recursively", () => {
            expect(svc.areEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(true);
            expect(svc.areEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(false);
        });

        it("matches the sender_data fallback shape used by user-conversations-store", () => {
            // The concurrent removeSent fallback compares msg.sender_data[type] objects.
            const a = { body: "hello" };
            const b = { body: "hello" };
            expect(svc.areEqual(a, b)).toBe(true);
            expect(svc.areEqual(a, { body: "world" })).toBe(false);
        });

        it("returns false when comparing an object against a primitive", () => {
            expect(svc.areEqual({ a: 1 }, 1)).toBe(false);
            expect(svc.areEqual({ a: 1 }, "a")).toBe(false);
        });
    });
});
