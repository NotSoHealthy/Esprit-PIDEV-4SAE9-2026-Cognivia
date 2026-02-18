import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../api/api.tokens';

export type CurrentUserKind = 'patient' | 'doctor' | 'caregiver' | 'unknown';

export interface CurrentUserState {
  kind: CurrentUserKind;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly user = signal<CurrentUserState | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  clear(): void {
    this.user.set(null);
    this.error.set(null);
    this.isLoading.set(false);
  }

  async loadFromApi(role: string | undefined, userId: string | undefined): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (!role || !userId) {
        this.user.set({ kind: 'unknown', data: null });
        return;
      }

      const { endpoint, kind } = this.getEndpointForRole(role, userId);
      if (!endpoint) {
        this.user.set({ kind: 'unknown', data: null });
        return;
      }

      const data = await this.http.get(`${this.apiBaseUrl}${endpoint}`).toPromise();
      this.user.set({ kind, data });
    } catch (e: any) {
      this.user.set(null);
      this.error.set(e?.message ?? 'Failed to load current user.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEndpointForRole(
    role: string,
    userId: string,
  ): { endpoint: string | null; kind: CurrentUserKind } {
    if (role === 'ROLE_PATIENT')
      return { endpoint: `/care/patient/user/${userId}`, kind: 'patient' };
    if (role === 'ROLE_DOCTOR') return { endpoint: `/care/doctor/user/${userId}`, kind: 'doctor' };
    if (role === 'ROLE_CAREGIVER')
      return { endpoint: `/care/caregiver/user/${userId}`, kind: 'caregiver' };

    return { endpoint: null, kind: 'unknown' };
  }
}
