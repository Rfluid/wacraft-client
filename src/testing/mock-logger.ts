// No-op NGXLogger replacement. Every store injects NGXLogger, and
// providing the real one in TestBed pulls in TOKEN_LOGGER_CONFIG which
// many stub specs forget to wire up. Use this with
// `{ provide: NGXLogger, useClass: MockLogger }`.
//
// Methods are intentionally no-ops; the eslint disables silence the
// "empty function" / "unused arg" rules since silence is the contract.
/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
export class MockLogger {
    trace(..._args: unknown[]): void {}
    debug(..._args: unknown[]): void {}
    info(..._args: unknown[]): void {}
    log(..._args: unknown[]): void {}
    warn(..._args: unknown[]): void {}
    error(..._args: unknown[]): void {}
    fatal(..._args: unknown[]): void {}
}
