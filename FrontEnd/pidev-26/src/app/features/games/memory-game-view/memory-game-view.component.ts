import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { KeycloakService } from '../../../core/auth/keycloak.service';

@Component({
    selector: 'app-memory-game-view',
    standalone: true,
    imports: [CommonModule, NzButtonModule, NzIconModule],
    templateUrl: './memory-game-view.component.html',
    styleUrls: ['./memory-game-view.component.css']
})
export class MemoryGameViewComponent implements OnInit {

    isGameStarted: boolean = false;
    gameUrl: SafeResourceUrl = '';

    constructor(
        private router: Router,
        private keycloakService: KeycloakService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        const userId = this.keycloakService.getUserId();
        const baseUrl = '/assets/memory-game/index.html';
        const finalUrl = userId ? `${baseUrl}?patientId=${userId}` : baseUrl;
        this.gameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
    }

    startGame(): void {
        this.isGameStarted = true;
    }

    goBack(): void {
        // Navigate back to the patient dashboard
        this.router.navigate(['/profile']);
    }

}
