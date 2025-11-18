import { Component, OnInit } from "@angular/core";
import { environment } from "../../environments/environment";
import { CommonModule } from "@angular/common";
import { SafeUrlPipe } from "../../core/common/pipe/safe-url.pipe";
import { UrlWithHttpPipe } from "../../core/common/pipe/url-with-http.pipe";
import { AuthService } from "../../core/auth/service/auth.service";

@Component({
    selector: "app-node-red",
    imports: [CommonModule, SafeUrlPipe, UrlWithHttpPipe],
    templateUrl: "./node-red.component.html",
    styleUrl: "./node-red.component.scss",
    standalone: true,
})
export class NodeRedComponent implements OnInit {
    environment = environment;
    accessToken = "";

    constructor(public authService: AuthService) {}

    ngOnInit() {
        this.accessToken = this.authService.getToken();
        this.authService.token.subscribe(token => {
            this.authService.setAuthCookie();
        });
    }
}
