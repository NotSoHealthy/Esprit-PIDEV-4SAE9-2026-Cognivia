import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { KeycloakService } from '../auth/keycloak.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

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
  private readonly keycloak = inject(KeycloakService);
  public readonly routes = [
    {
      link: '/dashboard',
      label: 'Dashboard',
      icon: 'appstore',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_PATIENT', 'ROLE_ADMIN', 'ROLE_PHARMACY'],
    },
    {
      link: '/patients',
      label: 'Patients',
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
      link: '/posts',
      label: 'Forum',
      icon: 'message',
      roles: ['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_PATIENT', 'ROLE_ADMIN', 'ROLE_PHARMACY'],
    },
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

  private updateCurrentRouteLabel(): void {
    // Router.url includes the leading '/', query params, etc.
    this.currentRouteLabel = this.formatRouteLabel(this.router.url);
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

  async logout(): Promise<void> {
    await this.keycloak.logout(window.location.origin);
  }

  get userRole(): string | undefined {
    return this.keycloak.getUserRole();
  }
}
