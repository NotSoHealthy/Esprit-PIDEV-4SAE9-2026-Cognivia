import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';

import { IMGBB_API_KEY } from './imgbb.tokens';

type ImgbbUploadResponse = {
  data?: {
    url?: string;
    display_url?: string;
  };
  success?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class ImgbbImageService {
  private readonly http = inject(HttpClient);
  private readonly apiKey = inject(IMGBB_API_KEY);

  uploadImage(file: File): Observable<string> {
    if (!this.apiKey) {
      return throwError(() => new Error('IMGBB API key is not configured.'));
    }

    const url = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(this.apiKey)}`;
    const body = new FormData();
    body.append('image', file);

    return this.http.post<ImgbbUploadResponse>(url, body).pipe(
      map((res) => {
        const imageUrl = res?.data?.url ?? res?.data?.display_url;
        if (!imageUrl) {
          throw new Error('IMGBB upload succeeded but no URL was returned.');
        }
        return imageUrl;
      }),
    );
  }
}
