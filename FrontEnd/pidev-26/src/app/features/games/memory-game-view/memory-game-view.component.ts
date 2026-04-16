import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router } from '@angular/router';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { StreakService, PlayerStreak } from '../streak.service';
import { Subject, interval } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

declare var createUnityInstance: any;

@Component({
    selector: 'app-memory-game-view',
    standalone: true,
    imports: [CommonModule, NzButtonModule, NzIconModule],
    templateUrl: './memory-game-view.component.html',
    styleUrls: ['./memory-game-view.component.css']
})
export class MemoryGameViewComponent implements OnInit, OnDestroy {

    isGameStarted: boolean = false;
    loadingProgress: number = 0;
    streak: PlayerStreak | null = null;

    private userId: string | undefined = undefined;
    private destroy$ = new Subject<void>();
    private unityInstance: any;

    constructor(
        private router: Router,
        private keycloakService: KeycloakService,
        private streakService: StreakService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.userId = this.keycloakService.getUserId();
        // Fetch streak data
        this.refreshStreak();
    }

    ngOnDestroy(): void {
        if (this.unityInstance) {
            this.unityInstance.Quit().then(() => {
                this.unityInstance = null;
            });
        }
        this.destroy$.next();
        this.destroy$.complete();
    }

    async startGame(): Promise<void> {
        this.isGameStarted = true;
        this.startStreakPolling();
        
        // Load the Unity Loader script dynamically from the public folder
        const script = document.createElement('script');
        script.src = '/unity-build/Build/MemoryWebGLBuild.loader.js';
        script.onload = () => {
            this.initUnity();
        };
        document.body.appendChild(script);
    }

    private initUnity(): void {
        const config = {
            dataUrl: '/unity-build/Build/MemoryWebGLBuild.data',
            frameworkUrl: '/unity-build/Build/MemoryWebGLBuild.framework.js',
            codeUrl: '/unity-build/Build/MemoryWebGLBuild.wasm',
            streamingAssetsUrl: 'StreamingAssets',
            companyName: 'DefaultCompany',
            productName: 'MemoryGame',
            productVersion: '1.0',
        };

        const canvas = document.querySelector('#unity-canvas') as HTMLCanvasElement;
        
        createUnityInstance(canvas, config, (progress: number) => {
            this.loadingProgress = Math.round(100 * progress);
            this.cdr.detectChanges();
        }).then((instance: any) => {
            this.unityInstance = instance;
            this.performHandshake();
        }).catch((err: any) => {
            console.error('Unity Initialization Error:', err);
        });
    }

    private async performHandshake(): Promise<void> {
        if (!this.unityInstance) return;

        const token = await this.keycloakService.getToken();
        const userId = this.keycloakService.getUserId();
        const username = this.keycloakService.getUsername();

        const authData = {
            token: token,
            userId: userId,
            username: username
        };

        // Send to Unity WebDataManager
        this.unityInstance.SendMessage('WebDataManager', 'SetAuthContext', JSON.stringify(authData));
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
