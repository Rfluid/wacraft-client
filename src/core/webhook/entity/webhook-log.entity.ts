import { Audit } from "../../common/model/audit.model";
import { Webhook } from "./webhook.entity";

export interface WebhookLogFields extends Audit {
    payload: unknown;
    http_response_code: number;
    response_data: unknown;
    webhook_id: string;
}

export interface WebhookLog extends WebhookLogFields {
    webhook: Webhook;
}
