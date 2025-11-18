import { Audit } from "../../common/model/audit.model";

export interface MessagingProductFields extends Audit {
    name: string;
}

// export interface MessagingProduct extends MessagingProductFields {}
export type MessagingProduct = MessagingProductFields;
