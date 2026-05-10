import { Conversation } from "../core/message/model/conversation.model";
import { Status } from "../core/status/entity/status.entity";
import { drain } from "./flush";

// Gateways register a callback via `watchNewX`. Tests need to drive that
// callback as if a WS frame arrived. The `opened` Promise must resolve so
// the store's `init` Promise.all completes.
//
// `emit()` awaits the registered callback then drains microtasks, since
// the store fires fan-out work (removeSent, appendConversationIfAtBottom)
// without awaiting.

export class MockMessageGateway {
    opened: Promise<void> = Promise.resolve();
    cb?: (msg: Conversation) => void | Promise<void>;
    watchNewMessage(cb: (msg: Conversation) => void | Promise<void>): void {
        this.cb = cb;
    }
    async emit(msg: Conversation): Promise<void> {
        await this.cb?.(msg);
        await drain();
    }
}

export class MockStatusGateway {
    opened: Promise<void> = Promise.resolve();
    cb?: (s: Status) => void;
    watchNewStatus(cb: (s: Status) => void): void {
        this.cb = cb;
    }
    emit(status: Status): void {
        this.cb?.(status);
    }
}
