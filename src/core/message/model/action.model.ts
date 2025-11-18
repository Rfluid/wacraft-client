import { SectionData } from "./section-data.model";
import { FlowActionPayload } from "./flow-action-payload.model";
import { FlowData } from "./flow-data.model";
import { InteractiveType } from "./interactive-type.model";
import { InteractiveButtonData } from "./button-data.model";

export interface Action extends FlowData {
    button?: string; // Unique button identifier for list messages (optional)
    buttons?: InteractiveButtonData[]; // Array of buttons for reply button messages (optional)
    sections?: SectionData[]; // Array of sections for list and multi-product messages (optional)
    catalog_id?: string; // Catalog ID for product messages (optional)
    product_retailer_id?: string; // Product Retailer ID for product messages (optional)
}

export function compareAction(
    action1: Action,
    action2: Action,
    interactiveType: InteractiveType,
): boolean {
    switch (interactiveType) {
        case InteractiveType.list:
            if (action1.button !== action2.button) return false;

            const sections1 = action1.sections;
            const sections2 = action2.sections;

            if (!sections1 || !sections2) return false;

            const sectionsEqual =
                sections1.length === sections2.length &&
                sections1.every((section, index) => {
                    const correspondingSection = sections2[index];

                    // Check if section titles are equal
                    if (
                        (section.title || correspondingSection.title) &&
                        section.title !== correspondingSection.title
                    )
                        return false;

                    // Check if rows lengths are equal
                    if (section.rows.length !== correspondingSection.rows.length) return false;

                    // Check if all rows are equal
                    return section.rows.every((row, rowIndex) => {
                        const correspondingRow = correspondingSection.rows[rowIndex];
                        return (
                            row.title === correspondingRow.title &&
                            row.id === correspondingRow.id &&
                            (!(row.description || correspondingRow.description) ||
                                row.description === correspondingRow.description)
                        );
                    });
                });

            if (!sectionsEqual) return false;
            break;

        case InteractiveType.button:
            const buttons1 = action1.buttons;
            const buttons2 = action2.buttons;
            if (!buttons1 || !buttons2) return false;
            if (buttons1.length !== buttons2.length) return false;

            const buttonsEqual = buttons1.reduce((acc, button, index) => {
                if (!acc) return false;
                return (
                    button.reply.title === buttons2[index].reply.title &&
                    button.reply.id === buttons2[index].reply.id
                );
            }, true);

            if (!buttonsEqual) return false;
            break;

        case InteractiveType.catalogMessage:
            if (action1.catalog_id !== action2.catalog_id) return false;
            break;
        case InteractiveType.product:
            if (action1.product_retailer_id !== action2.product_retailer_id) return false;
            break;
        case InteractiveType.flow:
            if (action1.flow_action !== action2.flow_action) return false;
            if (action1.flow_id !== action2.flow_id) return false;
            if (action1.flow_token !== action2.flow_token) return false;
            if (action1.flow_cta !== action2.flow_cta) return false;
            if (action1.flow_message_version !== action2.flow_message_version) return false;
            if (action1.flow_mode !== action2.flow_mode) return false;
            const payload1 = action1.flow_action_payload;
            const payload2 = action2.flow_action_payload;
            if (payload1?.screen !== payload2?.screen) return false;
            if (payload1?.data !== payload2?.data) return false;
    }

    return true;
}
