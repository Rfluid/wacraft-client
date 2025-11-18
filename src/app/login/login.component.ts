import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../core/auth/service/auth.service";
import { AuthModule } from "../../core/auth/auth.module";
import { UserModule } from "../../core/user/user.module";

@Component({
    selector: "app-login",
    imports: [CommonModule, AuthModule, UserModule],
    templateUrl: "./login.component.html",
    styleUrl: "./login.component.scss",
    standalone: true,
})
export class LoginComponent {
    isLoading = false;

    @ViewChild("username") username!: ElementRef;
    @ViewChild("password") password!: ElementRef;

    errorMessage?: string;

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    async login(): Promise<void> {
        this.isLoading = true;

        const email = this.username.nativeElement.value;
        const password = this.password.nativeElement.value;
        try {
            await this.authService.login(email, password);
            this.router.navigate([""]);
        } catch (error: any) {
            this.errorMessage =
                error?.response?.data?.description || "Some error occurred login in"; // Assuming customMessage is a property in MainServerError
        } finally {
            this.isLoading = false;
        }
    }

    showPassword = false;
    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }
}
