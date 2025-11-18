import { AfterViewInit, Directive, ElementRef, HostListener, QueryList } from "@angular/core";

@Directive() // marker, no selector needed
export abstract class KeyboardNavigableList implements AfterViewInit {
    private focusShortcutEnable = true;
    private focusShortcutKey = "k";

    protected abstract rows: QueryList<ElementRef<HTMLElement>>;
    private activeIndex = 0;

    constructor(focusShortcutEnable: boolean = true, focusShortcutKey: string = "k") {
        this.focusShortcutEnable = focusShortcutEnable;
        this.focusShortcutKey = focusShortcutKey;
    }

    ngAfterViewInit() {
        this.rows.changes.subscribe(() => this.init());
        this.init();
        if (!this.focusShortcutEnable) this.focusActive();
    }

    /* Ctrl/⌘ K – jump into list */
    @HostListener("window:keydown", ["$event"])
    handleGlobalKeys(e: KeyboardEvent) {
        if (!this.focusShortcutEnable) return;
        const t = e.target as HTMLElement;
        if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === this.focusShortcutKey) {
            e.preventDefault();
            this.focusActive();
        }
    }

    /* ↑ / ↓ / Enter / Space inside the list */
    @HostListener("keydown", ["$event"])
    handleListKeys(e: KeyboardEvent) {
        const t = e.target as HTMLElement;
        if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            this.move(1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            this.move(-1);
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.onEnter(this.activeIndex);
        }
    }

    /* rows[i] should “activate” when Enter/Space pressed */
    protected abstract onEnter(index: number): void;

    /* ─ helpers below ─ */
    private init() {
        if (this.rows.length) this.setActive(0);
    }

    private move(step: 1 | -1) {
        const max = this.rows.length - 1;
        const next = Math.min(max, Math.max(0, this.activeIndex + step));
        this.setActive(next);
        this.focusActive();
    }

    private setActive(i: number) {
        const list = this.rows.toArray().map(r => r.nativeElement);
        list[this.activeIndex]?.setAttribute("tabindex", "-1");
        list[i]?.setAttribute("tabindex", "0");
        this.activeIndex = i;
    }

    private focusActive() {
        const el = this.rows.toArray()[this.activeIndex]?.nativeElement;
        el?.focus();
        el?.scrollIntoView({ block: "nearest" });
    }
}
