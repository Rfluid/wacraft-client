import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy } from "@angular/core";

@Component({
    selector: "app-timeout-error-modal",
    imports: [CommonModule],
    templateUrl: "./timeout-error-modal.component.html",
    styleUrl: "./timeout-error-modal.component.scss",
    standalone: true,
})
export class TimeoutErrorModalComponent implements OnDestroy {
    @Input() timeout = 7000; // Default timeout to 7 seconds
    @Input() headerMessage = "An error occurred";
    @Input() message?: string;
    @Input() data: unknown; // JSON data to display

    isVisible = false;
    showData = false;
    progress = 100;
    intervalId?: ReturnType<typeof setInterval>;

    ngOnDestroy() {
        this.stopTimer();
    }

    openModal() {
        if (this.isVisible) return;
        this.isVisible = true;
        this.startTimer();
    }

    closeModal() {
        this.isVisible = false;
        this.progress = 100;
        this.stopTimer();
    }

    startTimer() {
        const interval = 10; // Progress bar update interval in ms
        const decrement = (100 / this.timeout) * interval;
        this.intervalId = setInterval(() => {
            this.progress -= decrement;
            if (this.progress <= 0) {
                this.closeModal();
            }
        }, interval);
    }

    stopTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    toggleData() {
        this.showData = !this.showData;
        if (this.showData) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }
}
