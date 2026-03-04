import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api/api.tokens';

export interface PlayerStreak {
    id: number | null;
    patientId: string;
    currentStreak: number;
    longestStreak: number;
    totalGamesPlayed: number;
    lastActivityDate: string | null;
}

@Injectable({
    providedIn: 'root',
})
export class StreakService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    getStreak(patientId: string): Observable<PlayerStreak> {
        return this.http
            .get<PlayerStreak>(`${this.baseUrl}/games/streak/${patientId}`)
            .pipe(
                catchError(() =>
                    of({
                        id: null,
                        patientId,
                        currentStreak: 0,
                        longestStreak: 0,
                        totalGamesPlayed: 0,
                        lastActivityDate: null,
                    }),
                ),
            );
    }
}
