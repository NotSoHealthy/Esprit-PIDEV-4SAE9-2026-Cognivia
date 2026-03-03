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
import { filter } from 'rxjs/operators';
import { KeycloakService } from '../auth/keycloak.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { CurrentUserService } from '../user/current-user.service';

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
      link: '/caregivers',
      label: 'Caregivers',
      icon: 'user',
      roles: ['ROLE_DOCTOR', 'ROLE_ADMIN'],
    },
    {
      link: '/equipment',
      label: 'Equipment',
      icon: 'medicine-box',
      roles: ['ROLE_DOCTOR','ROLE_CAREGIVER' , 'ROLE_ADMIN'],
    },
    {
      link: '/complaint',
      label: 'Reports',
      icon: 'container',
      roles: ['ROLE_ADMIN'],
    }
  ];
  currentRouteLabel = '';
  ngOnInit(): void {
    this.updateCurrentRouteLabel();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.updateCurrentRouteLabel());

    console.log('User Roles:', this.keycloak.getUserRole());
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
