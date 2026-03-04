import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { StreakService, PlayerStreak } from '../streak.service';
import { Subject, interval } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-memory-game-view',
    standalone: true,
    imports: [CommonModule, NzButtonModule, NzIconModule],
    templateUrl: './memory-game-view.component.html',
    styleUrls: ['./memory-game-view.component.css']
})
export class MemoryGameViewComponent implements OnInit, OnDestroy {

    isGameStarted: boolean = false;
    gameUrl: SafeResourceUrl = '';
    streak: PlayerStreak | null = null;

    private userId: string | undefined = undefined;
    private destroy$ = new Subject<void>();

    constructor(
        private router: Router,
        private keycloakService: KeycloakService,
        private sanitizer: DomSanitizer,
        private streakService: StreakService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.userId = this.keycloakService.getUserId();
        const baseUrl = '/assets/memory-game/index.html';
        const finalUrl = this.userId ? `${baseUrl}?patientId=${this.userId}` : baseUrl;
        this.gameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);

        // Fetch streak data
        this.refreshStreak();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    startGame(): void {
        this.isGameStarted = true;
        // Start polling for streak updates every 10 seconds while game is active
        this.startStreakPolling();
    }

    goBack(): void {
        this.router.navigate(['/dashboard']);
    }

    private refreshStreak(): void {
        if (this.userId) {
            this.streakService.getStreak(this.userId).subscribe((data) => {
                this.streak = data;
                this.cdr.detectChanges();
            });
        }
    }

    private startStreakPolling(): void {
        if (!this.userId) return;

        const patientId = this.userId;
        interval(10000).pipe(
            takeUntil(this.destroy$),
            switchMap(() => this.streakService.getStreak(patientId))
        ).subscribe((data) => {
            this.streak = data;
            this.cdr.detectChanges();
        });
    }

    get streakFlameColor(): string {
        if (!this.streak) return '#94a3b8'; // gray
        if (this.streak.currentStreak >= 14) return '#ef4444'; // red-hot
        if (this.streak.currentStreak >= 7) return '#f97316';  // orange
        if (this.streak.currentStreak >= 3) return '#eab308';  // yellow
        return '#94a3b8'; // gray (no streak)
    }
}
