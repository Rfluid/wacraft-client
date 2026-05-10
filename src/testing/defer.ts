export interface Deferred<T> {
    promise: Promise<T>;
    resolve: (v: T) => void;
    reject: (err?: unknown) => void;
}

export function defer<T>(): Deferred<T> {
    let resolve!: (v: T) => void;
    let reject!: (err?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}
