import { InteractiveType, ReceivedInteractiveType } from "./interactive-type.model";
import { Header } from "./header.model";
import { Body } from "./body.model";
import { Footer } from "./footer.model";
import { Action, compareAction } from "./action.model";
import { ButtonReplyData } from "./button-data.model";
import { ListReplyData } from "./list-reply-data.model";
import { HeaderType } from "./header-type.model";
import { compareUseMedia, UseMedia } from "./media-data.model";

export interface Interactive {
    type: InteractiveType; // Type of interactive message (required)

    header?: Header; // Header content (optional)
    body?: Body; // Body content (optional for type product, required otherwise)
    footer?: Footer; // Footer content (optional)
    action?: Action; // Action object (optional)
}

export interface ReceivedInteractive {
    type: ReceivedInteractiveType; // Type of interactive message (required)
    button_reply?: ButtonReplyData;
    list_reply?: ListReplyData;
}

export function compareInteractive(interactive1: Interactive, interactive2: Interactive): boolean {
    if (interactive1.type !== interactive2.type) return false;

    const header1 = interactive1.header;
    const header2 = interactive2.header;

    if (header1 || header2) {
        if (!header1 || !header2) return false;
        if (header1.type !== header2.type) return false;

        switch (header1.type) {
            case HeaderType.text:
                if ((header1.text || header2.text) && header1.text !== header2.text) return false;
                break;
            default:
                const headerData1 = header1[header1.type] as UseMedia;
                const headerData2 = header2[header2.type] as UseMedia;

                const useMediaComparison = compareUseMedia(headerData1, headerData2);
                if (!useMediaComparison) return false;
        }
    }

    const body1 = interactive1.body;
    const body2 = interactive2.body;

    if ((body1?.text || body2?.text) && body1?.text !== body2?.text) return false;

    const footer1 = interactive1.footer;
    const footer2 = interactive2.footer;

    if ((footer1?.text || footer2?.text) && footer1?.text !== footer2?.text) return false;

    const action1 = interactive1.action;
    const action2 = interactive2.action;

    if (action1 || action2) {
        if (!action1 || !action2) return false;
        compareAction(action1, action2, interactive1.type);
    }
    return true;
}
