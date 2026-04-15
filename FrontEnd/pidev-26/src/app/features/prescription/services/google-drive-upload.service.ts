import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleAccounts = {
  oauth2: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (response: { access_token?: string; error?: string }) => void;
      error_callback?: (err: unknown) => void;
    }) => GoogleTokenClient;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleDriveUploadService {
  private readonly gisScriptUrl = 'https://accounts.google.com/gsi/client';
  private readonly driveScope = 'https://www.googleapis.com/auth/drive.file';

  private gisScriptLoadPromise: Promise<void> | null = null;
  private tokenClient: GoogleTokenClient | null = null;
  private accessToken: string | null = null;

  async uploadPdfToDrive(pdfBlob: Blob, fileName: string): Promise<{ id?: string; webViewLink?: string }> {
    const clientId = (environment as any).googleDriveClientId as string | undefined;
    if (!clientId) {
      throw new Error('Google Drive Client ID is missing in environment files.');
    }

    await this.ensureGoogleIdentityScriptLoaded();

    const token = await this.getAccessToken(clientId);
    const metadata = {
      name: fileName,
      mimeType: 'application/pdf',
    };

    const boundary = `pidev_boundary_${Date.now()}`;
    const delimiter = `--${boundary}`;
    const closeDelimiter = `--${boundary}--`;

    const body = new Blob(
      [
        `${delimiter}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
        `${delimiter}\r\nContent-Type: application/pdf\r\n\r\n`,
        pdfBlob,
        `\r\n${closeDelimiter}`,
      ],
      { type: `multipart/related; boundary=${boundary}` }
    );

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Google Drive upload failed: ${errorText || uploadResponse.statusText}`);
    }

    const uploaded = await uploadResponse.json();
    return {
      id: uploaded?.id,
      webViewLink: uploaded?.webViewLink,
    };
  }

  private async ensureGoogleIdentityScriptLoaded(): Promise<void> {
    if (window.google?.accounts?.oauth2) {
      return;
    }

    if (!this.gisScriptLoadPromise) {
      this.gisScriptLoadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src=\"${this.gisScriptUrl}\"]`) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = this.gisScriptUrl;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity script'));
        document.head.appendChild(script);
      });
    }

    await this.gisScriptLoadPromise;
  }

  private async getAccessToken(clientId: string): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    return new Promise<string>((resolve, reject) => {
      const googleAccounts = window.google?.accounts;
      if (!googleAccounts?.oauth2) {
        reject(new Error('Google OAuth client is not available.'));
        return;
      }

      this.tokenClient = googleAccounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: this.driveScope,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          if (!response.access_token) {
            reject(new Error('No Google access token returned.'));
            return;
          }

          this.accessToken = response.access_token;
          resolve(response.access_token);
        },
        error_callback: () => reject(new Error('Google authentication failed.')),
      });

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }
}
