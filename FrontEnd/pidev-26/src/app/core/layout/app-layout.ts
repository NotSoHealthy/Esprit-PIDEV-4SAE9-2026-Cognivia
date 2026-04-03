import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, NgZone, OnInit, inject } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, finalize, startWith, switchMap } from 'rxjs/operators';
import { forkJoin, interval, Observable, of } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CurrentUserService } from '../user/current-user.service';
import { StreakService } from '../../features/games/streak.service';
import { StreakFlameComponent } from '../../shared/components/streak-flame/streak-flame.component';
import {
  Notification,
  NotificationPriority,
  RecipientType,
} from '../models/notifications/notification.model';
import { NotificationsService } from '../services/notifications/notifications.service';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzIconModule,
    NzBadgeModule,
    NzDropdownModule,
    NzMenuModule,
    NzTooltipModule,
    StreakFlameComponent,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayout implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly keycloak = inject(KeycloakService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly streakService = inject(StreakService);
  private readonly notificationsService = inject(NotificationsService);
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
      link: '/tasks',
      label: 'Tasks',
      icon: 'check',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_PATIENT', 'ROLE_ADMIN'],
    },
    {
      link: '/appointments',
      label: 'Appointments',
      icon: 'calendar',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'],
    },
    {
      link: '/admin/tests',
      label: 'Tests',
      icon: 'form',
      roles: ['ROLE_DOCTOR', 'ROLE_ADMIN'],
    },
    {
      link: '/pharmacy',
      label: 'Pharmacy',
      icon: 'medicine-box',
      roles: ['ROLE_PHARMACY', 'ROLE_ADMIN', 'ROLE_CAREGIVER', 'ROLE_DOCTOR'],
    },
    {
      link: '/prescriptions',
      label: 'Prescriptions',
      icon: 'file-text',
      roles: ['ROLE_DOCTOR', 'ROLE_PHARMACY', 'ROLE_ADMIN', 'ROLE_CAREGIVER'],
    },
    {
      link: '/calendar',
      label: 'Calendar',
      icon: 'calendar',
      roles: ['ROLE_CAREGIVER'],
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
    {
      link: '/equipment',
      label: 'Equipment',
      icon: 'shop',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER'],
    },
    {
      link: '/complaint',
      label: 'Reports',
      icon: 'container',
      roles: ['ROLE_ADMIN'],
    },
  ];

  currentRouteLabel = '';
  streakCount = 0;
  notifications: Notification[] = [];
  notificationsLoading = false;
  notificationsDropdownOpen = false;
  private readonly hiddenNotificationIds = new Set<string>();
  ngOnInit(): void {
    this.updateCurrentRouteLabel();

    void this.currentUser.loadFromApi(this.userRole, this.keycloak.getUserId()).then(() => {
      interval(10_000)
        .pipe(
          startWith(0),
          takeUntilDestroyed(this.destroyRef),
          switchMap(() => {
            this.notificationsLoading = true;
            return this.fetchNotifications$().pipe(
              finalize(() => {
                this.notificationsLoading = false;
              }),
            );
          }),
        )
        .subscribe((items) => {
          this.zone.run(() => {
            this.notifications = (items ?? []).filter((n) => !this.hiddenNotificationIds.has(n.id));
            if (this.notificationsDropdownOpen) {
              this.markVisibleNotificationsAsSeen();
            }
            this.cdr.detectChanges();
          });
        });
    });

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
      interval(30_000)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap(() => {
            const pid = this.keycloak.getUserId();
            return pid ? this.streakService.getStreak(pid) : [];
          }),
        )
        .subscribe((s) => (this.streakCount = s.currentStreak));
    }
  }

  onNotificationsDropdownVisible(visible: boolean): void {
    this.notificationsDropdownOpen = visible;
    if (visible) this.markVisibleNotificationsAsSeen();
  }

  openNotification(notification: Notification): void {
    this.notificationsService
      .markAsRead(notification.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(notification)),
      )
      .subscribe((updated) => {
        this.zone.run(() => {
          this.hiddenNotificationIds.add(updated.id);
          this.notifications = this.notifications
            .map((n) => (n.id === updated.id ? updated : n))
            .filter((n) => !this.hiddenNotificationIds.has(n.id));
          this.navigateFromNotification(updated);
          this.cdr.detectChanges();
        });
      });
  }

  private navigateFromNotification(notification: Notification): void {
    const commands =
      notification.referenceId === null
        ? ['/notifications', notification.eventType]
        : ['/notifications', notification.eventType, notification.referenceId];

    void this.router.navigate(commands);
  }

  private fetchNotifications$(): Observable<Notification[]> {
    const recipientType = this.getRecipientTypeForRole(this.userRole);
    const recipientId = this.getRecipientId();

    if (!recipientType || recipientId === null) return of([]);

    return this.notificationsService
      .getNotificationsForRecipient(recipientId, recipientType)
      .pipe(catchError(() => of([])));
  }

  private markVisibleNotificationsAsSeen(): void {
    const unseen = this.notifications.filter((n) => !n.seen);
    if (unseen.length === 0) return;

    forkJoin(unseen.map((n) => this.notificationsService.markAsSeen(n.id)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedItems) => {
          this.zone.run(() => {
            const updatedById = new Map(updatedItems.map((n) => [n.id, n] as const));
            this.notifications = this.notifications.map((n) => updatedById.get(n.id) ?? n);
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.zone.run(() => {
            this.notifications = this.notifications.map((n) => (n.seen ? n : { ...n, seen: true }));
            this.cdr.detectChanges();
          });
        },
      });
  }

  private getRecipientTypeForRole(role: string | undefined): RecipientType | null {
    if (role === 'ROLE_PATIENT') return 'PATIENT';
    if (role === 'ROLE_DOCTOR') return 'DOCTOR';
    if (role === 'ROLE_CAREGIVER') return 'CAREGIVER';
    if (role === 'ROLE_PHARMACY') return 'PHARMACY';
    if (role === 'ROLE_ADMIN') return 'ADMIN';
    return null;
  }

  private getRecipientId(): number | string | null {
    const state = this.currentUser.user();
    const candidate = (state as any)?.data?.id;
    if (typeof candidate === 'number') return candidate;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      const trimmed = candidate.trim();
      if (/^\d+$/.test(trimmed)) return Number(trimmed);
    }

    const keycloakId = this.keycloak.getUserId();
    if (typeof keycloakId === 'string' && keycloakId.trim().length > 0) {
      const trimmed = keycloakId.trim();
      if (/^\d+$/.test(trimmed)) return Number(trimmed);
      return trimmed;
    }

    return null;
  }

  private fetchStreak(): void {
    const patientId = this.keycloak.getUserId();
    if (patientId) {
      this.streakService.getStreak(patientId).subscribe((s) => {
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

  get hasUnseenNotifications(): boolean {
    return this.notifications.some((n) => !n.seen);
  }

  priorityPillClass(priority: NotificationPriority): string {
    if (priority === 'CRITICAL') return 'bg-red-100 text-red-700';
    if (priority === 'HIGH') return 'bg-amber-100 text-amber-700';
    return 'bg-[#F2F6FE]! text-[#4D5CAB]';
  }
}
