import { GraphCursors } from "../../common/model/graph-cursors.model";
import { TemplateSummary } from "./template-summary.model";
import { TemplateCategory, TemplateStatus } from "./template.model";

export enum TemplateQualityScore {
    green = "GREEN",
    yellow = "YELLOW",
    unknown = "UNKNOWN",
}

export interface TemplateQueryParams extends GraphCursors {
    category?: TemplateCategory;
    content?: string;
    language?: string;
    name?: string;
    name_or_content?: string;
    quality_score?: TemplateQualityScore;
    status?: TemplateStatus;

    limit?: number;

    summary?: TemplateSummary[]; // Summary to be returned.
}
