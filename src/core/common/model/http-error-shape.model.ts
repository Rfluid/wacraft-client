export interface HttpErrorShape {
    response?: {
        data?: {
            description?: string;
            [key: string]: unknown;
        };
    };
}

export function isHttpError(err: unknown): err is HttpErrorShape {
    if (typeof err !== "object" || err === null) return false;

    const maybeErr = err as Record<string, unknown>;

    if (!("response" in maybeErr)) return false;
    if (typeof maybeErr["response"] !== "object" || maybeErr["response"] === null) return false;

    return true;
}
