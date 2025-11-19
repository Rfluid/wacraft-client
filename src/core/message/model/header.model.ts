// header.model.ts

import { HeaderType } from "./header-type.model";
import { UseMedia } from "./media-data.model";

export interface Header {
    type: HeaderType; // Type of the header

    text?: string; // Text header (optional)
    image?: UseMedia; // Image header (optional)
    video?: UseMedia; // Video header (optional)
    document?: UseMedia; // Document header (optional)
    audio?: UseMedia; // Audio header (optional)
}
