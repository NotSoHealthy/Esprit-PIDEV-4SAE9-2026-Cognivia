import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';
import { interval } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { CurrentUserService } from '../user/current-user.service';
import { StreakService } from '../../features/games/streak.service';
import { StreakFlameComponent } from '../../shared/components/streak-flame/streak-flame.component';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzIconModule,
    NzDropdownModule,
    NzMenuModule,
    StreakFlameComponent
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayout implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly keycloak = inject(KeycloakService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly streakService = inject(StreakService);
  public readonly routes = [
    {
      link: '/dashboard',
      label: 'Dashboard',
      icon: 'appstore',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_PATIENT', 'ROLE_ADMIN', 'ROLE_PHARMACY'],
    },
    {
      link: '/patient-management',
      label: 'Patient Management',
      icon: 'user-add',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'],
    },
    {
      link: '/admin/tests',
      label: 'Tests',
      icon: 'form',
      roles: ['ROLE_DOCTOR', 'ROLE_ADMIN'],
    },
    {
      link: '/user/tests',
      label: 'Tests',
      icon: 'form',
      roles: ['ROLE_PATIENT'],
    },
    {
      link: '/user/games/memory',
      label: 'Cognitive Games',
      icon: 'play-circle',
      roles: ['ROLE_PATIENT'],
    },
    {
      link: '/doctor/risk-assessment',
      label: 'Risk Intelligence',
      icon: 'line-chart',
      roles: ['ROLE_DOCTOR', 'ROLE_ADMIN'],
    },
    {
      link: '/posts',
      label: 'Forum',
      icon: 'team',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER'],
    },
    {
      link: '/chat',
      label: 'Messages',
      icon: 'message',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_PATIENT', 'ROLE_ADMIN', 'ROLE_PHARMACY'],
    },
    {
      link: '/admin/reported-posts',
      label: 'Reported Posts',
      icon: 'warning',
      roles: ['ROLE_ADMIN'],
    },
  ];
  currentRouteLabel = '';
  streakCount = 0;
  ngOnInit(): void {
    this.updateCurrentRouteLabel();

    this.router.events
      .pipe(
        filter((event: any) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.updateCurrentRouteLabel();
        // Refresh streak on every navigation (e.g. returning from a game)
        if (this.userRole === 'ROLE_PATIENT') {
          this.fetchStreak();
        }
      });

    if (this.userRole === 'ROLE_PATIENT') {
      this.fetchStreak();

      // Also poll every 30 seconds so the flame stays in sync
      interval(30_000).pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          const pid = this.keycloak.getUserId();
          return pid ? this.streakService.getStreak(pid) : [];
        }),
      ).subscribe(s => this.streakCount = s.currentStreak);
    }
  }

  private fetchStreak(): void {
    const patientId = this.keycloak.getUserId();
    if (patientId) {
      this.streakService.getStreak(patientId).subscribe(s => {
        this.streakCount = s.currentStreak;
      });
    }
  }

  private getDeepestActiveRoute(route: ActivatedRoute): ActivatedRoute {
    let current: ActivatedRoute = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

  private updateCurrentRouteLabel(): void {
    const deepestRoute = this.getDeepestActiveRoute(this.activeRoute);
    const title = deepestRoute.snapshot.title as string | undefined;

    if (title) {
      this.currentRouteLabel = title;
      return;
    }

    // Fallback: map URL segment to configured nav labels.
    const pathOnly = this.router.url.split('?')[0]?.split('#')[0] ?? '';
    const firstSegment = pathOnly.split('/').filter(Boolean)[0] ?? '';
    const routePath = firstSegment ? `/${firstSegment}` : '';
    const matchingRoute = this.routes.find((route) => route.link === routePath);

    this.currentRouteLabel = matchingRoute?.label ?? this.formatRouteLabel(this.router.url);
  }

  private formatRouteLabel(url: string): string {
    const pathOnly = url.split('?')[0]?.split('#')[0] ?? '';
    const firstSegment = pathOnly.split('/').filter(Boolean)[0] ?? '';
    if (!firstSegment) return '';
    return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
  }

  get isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  get username(): string {
    return this.keycloak.getUsername() ?? 'Guest';
  }

  get fullName(): string | undefined {
    const user = this.currentUser.user();
    if (!user || user.kind === 'unknown') return undefined;
    const firstName = (user.data as any)?.firstName;
    const lastName = (user.data as any)?.lastName;
    return firstName && lastName ? `${firstName} ${lastName}` : undefined;
  }

  async logout(): Promise<void> {
    await this.keycloak.logout(window.location.origin);
  }

  get userRole(): string | undefined {
    return this.keycloak.getUserRole();
  }
}
