import { TemplateComponent } from "./template-component.model";

export enum TemplateCategory {
    account_update = "ACCOUNT_UPDATE",
    payment_update = "PAYMENT_UPDATE",
    personal_finance_update = "PERSONAL_FINANCE_UPDATE",
    shipping_update = "SHIPPING_UPDATE",
    reservation_update = "RESERVATION_UPDATE",
    issue_resolution = "ISSUE_RESOLUTION",
    appointment_update = "APPOINTMENT_UPDATE",
    transportation_update = "TRANSPORTATION_UPDATE",
    ticket_update = "TICKET_UPDATE",
    alert_update = "ALERT_UPDATE",
    auto_reply = "AUTO_REPLY",
    transactional = "TRANSACTIONAL",
    otp = "OTP",
    utility = "UTILITY",
    marketing = "MARKETING",
    authentication = "AUTHENTICATION",
    free_service = "FREE_SERVICE",
}

export enum TemplateStatus {
    approved = "APPROVED",
    in_appeal = "IN_APPEAL",
    pending = "PENDING",
    rejected = "REJECTED",
    pending_deletion = "PENDING_DELETION",
    deleted = "DELETED",
    disabled = "DISABLED",
    paused = "PAUSED",
    limit_exceeded = "LIMIT_EXCEEDED",
    archived = "ARCHIVED",
}

export interface Template {
    id: string;
    name: string;
    language?: string;
    status?: TemplateStatus;
    category?: TemplateCategory;
    components: TemplateComponent[];
}
