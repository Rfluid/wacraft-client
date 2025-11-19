export interface FlowActionPayload {
    screen: string; // ID of the first screen of the Flow (required)
    data?: Record<string, unknown>; // Optional input data for the first screen
}
