import { Audit } from "../../common/model/audit.model";
import { CampaignMessageFields } from "./campaign-message.entity";

export interface CampaignMessageSendErrorFields extends Audit {
    error_data: any;
    campaign_message_id: string;
}

export interface CampaignMessageSendError extends CampaignMessageSendErrorFields {
    campaign_message: CampaignMessageFields;
}
