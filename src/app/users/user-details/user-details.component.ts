import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { Role } from "../../../core/user/model/role.model";
import { User } from "../../../core/user/entity/user.entity";
import { QueryParamsService } from "../../../core/navigation/service/query-params.service";
import { UserControllerService } from "../../../core/user/controller/user-controller.service";
import { UserStoreService } from "../../../core/user/store/user-store.service";
import { NGXLogger } from "ngx-logger";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TimeoutErrorModalComponent } from "../../common/timeout-error-modal/timeout-error-modal.component";

@Component({
    selector: "app-user-details",
    imports: [FormsModule, CommonModule, MatIconModule, MatTooltipModule, TimeoutErrorModalComponent],
    templateUrl: "./user-details.component.html",
    styleUrl: "./user-details.component.scss",
    preserveWhitespaces: false,
    standalone: true,
})
export class UserDetailsComponent implements OnInit {
    Role = Role;
    Event = Event;

    user!: User;
    userId?: string;

    isEditing = false;

    @ViewChild("errorModal") errorModal!: TimeoutErrorModalComponent;

    constructor(
        private queryParamsService: QueryParamsService,
        private userController: UserControllerService,
        private route: ActivatedRoute,
        private router: Router,
        public userStore: UserStoreService,
        private logger: NGXLogger,
    ) {}

    ngOnInit(): void {
        this.watchQueryParams();
    }

    async saveChanges() {
        if (this.user)
            try {
                if (!this.userId) {
                    const wh = await this.userController.create({
                        email: this.user.email,
                        name: this.user.name,
                        password: this.user.password,
                        role: this.user.role || Role.user,
                    });
                    await this.router.navigate([], {
                        queryParams: {
                            "user.id": wh.id,
                            ...this.queryParamsService.globalQueryParams,
                        },
                        preserveFragment: true,
                        queryParamsHandling: "replace",
                    });
                    window.location.reload();
                    return;
                }
                await this.userController.update({
                    id: this.userId,
                    name: this.user.name,
                    email: this.user.email,
                    role: this.user.role,
                });
                this.isEditing = false;
                return;
            } catch (error) {
                this.handleErr("Error saving changes", error);
            }
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(async (params) => {
            const userId = params["user.id"];
            if (!(userId != this.userId)) return await this.loadUser();
            this.userId = userId;
            return await this.loadUser();
        });
    }

    async loadUser() {
        if (!this.userId) {
            this.user = {
                id: "",
                name: "",
                email: "",
                password: "",
                role: Role.user,
                created_at: new Date(),
                updated_at: new Date(),
            };
            this.isEditing = true;
            return;
        }
        this.isEditing = false;
        try {
            this.user = await this.userStore.getById(this.userId);
        } catch (error) {
            this.handleErr("Error loading user", error);
            return;
        }
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
    }

    cancelEdit() {
        if (!this.userId) {
            this.user = {
                id: "",
                name: "",
                email: "",
                password: "",
                role: Role.user,
                created_at: new Date(),
                updated_at: new Date(),
            };
            this.isEditing = true;
            return;
        }
        this.isEditing = false;
        this.loadUser();
    }

    async delete() {
        if (!this.userId) return;

        // Show confirmation alert
        const confirmed = window.confirm("Are you sure you want to delete this user? This action cannot be undone.");

        // If the user confirms, proceed with the deletion
        if (confirmed) {
            try {
                await this.userController.delete(this.userId);
                await this.resetUserId();
                window.location.reload();
                this.resetUserId(); // Call to reset or clean up after deletion
            } catch (error) {
                this.handleErr("Error deleting user", error);
                return;
            }
        }
    }

    async resetUserId() {
        await this.router.navigate([], {
            queryParams: this.queryParamsService.globalQueryParams,
            preserveFragment: true,
            queryParamsHandling: "replace",
        });
    }

    // Copy the given value to the clipboard
    async copyToClipboard(value?: string) {
        if (value) {
            await navigator.clipboard.writeText(value);
        }
    }

    errorStr: string = "";
    errorData: any;
    handleErr(message: string, err: any) {
        this.errorData = err?.response?.data;
        this.errorStr = err?.response?.data?.description || message;
        this.logger.error("Async error", err);
        this.errorModal.openModal();
    }
}
