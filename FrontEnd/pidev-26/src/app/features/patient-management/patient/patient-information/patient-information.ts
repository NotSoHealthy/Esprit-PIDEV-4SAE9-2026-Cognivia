import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../core/api/api.tokens';

import * as L from 'leaflet';
import 'leaflet-draw';

let leafletIconsConfigured = false;

@Component({
  selector: 'app-patient-information',
  imports: [TitleCasePipe],
  templateUrl: './patient-information.html',
  styleUrl: './patient-information.css',
})
export class PatientInformation implements OnInit, AfterViewInit, OnDestroy {
  @Input() patient: any | null = null;
  @ViewChild('perimeterMap') perimeterMapEl?: ElementRef<HTMLDivElement>;

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);

  private map: L.Map | null = null;
  private readonly drawnItems = new L.FeatureGroup();
  private drawControl: L.Control.Draw | null = null;
  private housePerimeterId: number | null = null;
  private isLoadingPerimeter = false;
  private isSavingPerimeter = false;

  private currentUserMarker: L.CircleMarker | null = null;
  private currentUserWatchId: number | null = null;
  private locateControl: L.Control | null = null;

  get severity(): string | null {
    const p = this.patient as any;
    return p?.severity ?? p?.severityLevel ?? p?.severityStatus ?? null;
  }
  email: string | null = null;
  phoneNumber: string | null = null;

  get severityPillClass(): string {
    const s = this.severity;
    const tone =
      (s === 'LOW' && 'bg-green-100 text-green-800') ||
      (s === 'MEDIUM' && 'bg-amber-100 text-amber-800') ||
      (s === 'HIGH' && 'bg-red-100 text-red-800') ||
      (s === 'EXTREME' && 'bg-purple-100 text-purple-800') ||
      'bg-slate-100 text-slate-700';

    return `px-2 py-1 rounded-lg text-xs font-semibold ${tone}`;
  }

  fetchContactInformation(): void {
    this.http.get<any>(`${this.apiBaseUrl}/care/patient/${this.patient?.id}/contact`).subscribe({
      next: (response) => {
        this.email = response.email ?? null;
        this.phoneNumber = response.phoneNumber ?? null;
        console.log('Fetched contact information:', this.email, this.phoneNumber);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching patients:', error);
        this.cdr.detectChanges();
      },
      complete: () => {
        this.cdr.detectChanges();
      },
    });
  }

  ngOnInit(): void {
    if (this.patient) {
      this.fetchContactInformation();
    }
  }

  ngAfterViewInit(): void {
    this.initPerimeterMap();
  }

  ngOnDestroy(): void {
    if (this.currentUserWatchId !== null) {
      try {
        navigator.geolocation.clearWatch(this.currentUserWatchId);
      } catch {
        // ignore
      }
      this.currentUserWatchId = null;
    }

    if (this.map) {
      try {
        this.locateControl?.remove();
      } catch {
        // ignore
      }
      this.locateControl = null;

      try {
        this.currentUserMarker?.remove();
      } catch {
        // ignore
      }
      this.currentUserMarker = null;

      this.map.remove();
      this.map = null;
    }
  }

  initials(): string {
    const first = (this.patient as any)?.firstName?.[0] ?? '';
    const last = (this.patient as any)?.lastName?.[0] ?? '';
    const value = `${first}${last}`.trim();
    return value || 'P';
  }

  display(value: unknown): string {
    if (value === null || value === undefined) return '-';
    const str = String(value).trim();
    return str ? str : '-';
  }

  formatDobWithAge(dateOfBirth: unknown): string {
    const dob = this.toDate(dateOfBirth);
    if (!dob) return typeof dateOfBirth === 'string' ? dateOfBirth : '-';

    const age = this.getAgeYears(dob);

    let formattedDob = '';
    try {
      formattedDob = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(dob);
    } catch {
      formattedDob = dob.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    }

    if (age === null) return formattedDob;
    return `${formattedDob} (${age} y.o.)`;
  }

  private getAgeYears(dob: Date): number | null {
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age;
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  private initPerimeterMap(): void {
    if (!this.perimeterMapEl?.nativeElement) return;
    if (this.map) return;

    this.configureLeafletDefaultIcons();

    const map = L.map(this.perimeterMapEl.nativeElement, {
      zoomControl: true,
      attributionControl: true,
    });

    // Leaflet requires an initial view; we'll refine it after loading saved geometry
    // or after acquiring a better center (patient coords / user location).
    map.setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    this.drawnItems.addTo(map);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {},
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: this.drawnItems,
        edit: {},
        remove: true,
      },
    });

    map.addControl(drawControl);
    this.drawControl = drawControl;

    map.on(L.Draw.Event.CREATED, (e: any) => {
      this.drawnItems.clearLayers();
      if (e?.layer) {
        this.drawnItems.addLayer(e.layer);
      }
      this.savePerimeterToApi();
      this.updateDrawToolAvailability();
    });

    map.on(L.Draw.Event.EDITED, () => {
      this.savePerimeterToApi();
      this.updateDrawToolAvailability();
    });

    map.on(L.Draw.Event.DELETED, () => {
      this.savePerimeterToApi();
      this.updateDrawToolAvailability();
    });

    this.map = map;

    // Add a locate button (snap to GPS) control.
    this.addLocateControl(map);

    // Load saved perimeter from backend (if present).
    this.loadPerimeterFromApi();

    if (this.drawnItems.getLayers().length > 0) {
      const bounds = this.drawnItems.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1));
      }
    } else {
      const center = this.getInitialHomeLatLng();
      if (center) {
        map.setView(center, 18);
      } else {
        this.centerMapOnUserLocation(map);
      }
    }

    // Always try to show the current caregiver GPS position as a dot for reference.
    // If we already used user location as a fallback center, also center once on the first fix.
    const centerOnFirstFix =
      this.drawnItems.getLayers().length === 0 && !this.getInitialHomeLatLng();
    this.startUserLocationTracking(map, centerOnFirstFix);

    // Ensure correct sizing after render.
    setTimeout(() => map.invalidateSize(), 0);
  }

  private addLocateControl(map: L.Map): void {
    if (this.locateControl) return;

    const LocateControl = (L.Control as any).extend({
      options: { position: 'topright' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar');
        const button = L.DomUtil.create('a', '', container) as HTMLAnchorElement;

        button.href = '#';
        button.title = 'Snap to your location';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Snap to your location');
        button.style.fontSize = '1.5rem';
        button.innerHTML = '⌖';

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', () => this.snapMapToUserLocation(map));

        return container;
      },
    });

    const control: L.Control = new LocateControl();
    control.addTo(map);
    this.locateControl = control;
  }

  private snapMapToUserLocation(map: L.Map): void {
    // Prefer centering to the live marker if we already have it.
    const markerLatLng = this.currentUserMarker?.getLatLng?.();
    if (markerLatLng) {
      try {
        map.setView(markerLatLng, Math.max(map.getZoom(), 18));
      } catch {
        // ignore
      }
      return;
    }

    // Otherwise request a one-time position fix.
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;
        const latLng: L.LatLngExpression = [lat, lng];
        try {
          map.setView(latLng, Math.max(map.getZoom(), 18));
        } catch {
          // ignore
        }
      },
      () => {
        // ignore
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10_000,
      },
    );
  }

  private updateDrawToolAvailability(): void {
    if (!this.drawControl) return;

    const hasPerimeter = this.drawnItems.getLayers().length > 0;
    const drawToolbar = (this.drawControl as any)?._toolbars?.draw;
    const polygonMode = drawToolbar?._modes?.polygon;
    const polygonButton: HTMLElement | undefined = polygonMode?.button;
    const polygonHandler: { enable?: () => void; disable?: () => void } | undefined =
      polygonMode?.handler;

    if (hasPerimeter) {
      polygonHandler?.disable?.();
      if (polygonButton) {
        polygonButton.classList.add('leaflet-disabled');
        polygonButton.style.pointerEvents = 'none';
        polygonButton.setAttribute('title', 'Delete the current perimeter to draw a new one');
      }
    } else {
      if (polygonButton) {
        polygonButton.classList.remove('leaflet-disabled');
        polygonButton.style.pointerEvents = '';
        polygonButton.removeAttribute('title');
      }
    }
  }

  private centerMapOnUserLocation(map: L.Map): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;
        map.setView([lat, lng], 18);
      },
      () => {
        // Ignore errors (permission denied, timeout, etc.) and keep the default world view.
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60_000,
      },
    );
  }

  private startUserLocationTracking(map: L.Map, centerOnFirstFix: boolean): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    if (this.currentUserWatchId !== null) return;

    let hasCentered = false;

    try {
      this.currentUserWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos?.coords?.latitude;
          const lng = pos?.coords?.longitude;
          if (typeof lat !== 'number' || typeof lng !== 'number') return;

          const latLng: L.LatLngExpression = [lat, lng];

          if (!this.currentUserMarker) {
            // Default Leaflet circleMarker styling; keep it minimal.
            this.currentUserMarker = L.circleMarker(latLng, {
              radius: 6,
              weight: 2,
            }).addTo(map);
          } else {
            this.currentUserMarker.setLatLng(latLng);
          }

          if (centerOnFirstFix && !hasCentered) {
            hasCentered = true;
            try {
              map.setView(latLng, Math.max(map.getZoom(), 18));
            } catch {
              // ignore
            }
          }
        },
        () => {
          // Ignore errors (permission denied, timeout, etc.).
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10_000,
        },
      );
    } catch {
      this.currentUserWatchId = null;
    }
  }

  private housePerimetersBaseUrl(): string {
    return `${this.apiBaseUrl}/monitoring/house-perimeters`;
  }

  private loadPerimeterFromApi(): void {
    const patientId = this.patient?.id;
    if (!patientId) return;
    const map = this.map;
    if (!map) return;
    if (this.isLoadingPerimeter) return;

    this.isLoadingPerimeter = true;

    this.http
      .get<any>(this.housePerimetersBaseUrl(), {
        params: { patientId: String(patientId) },
      })
      .subscribe({
        next: (res) => {
          const id = res?.id;
          this.housePerimeterId = typeof id === 'number' ? id : id ? Number(id) : null;

          const rawGeo =
            res?.geometry ?? res?.geoJson ?? res?.geojson ?? res?.polygon ?? res?.perimeter ?? null;
          const polygon = this.parseGeoJsonPolygon(rawGeo);
          if (polygon) {
            const asFeature: GeoJSON.Feature = {
              type: 'Feature',
              properties: {},
              geometry: polygon as any,
            };
            this.addGeoJsonToDrawnItems(asFeature as any);
          }

          this.updateDrawToolAvailability();

          if (this.drawnItems.getLayers().length > 0) {
            const bounds = this.drawnItems.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds.pad(0.1));
            }
          }

          this.isLoadingPerimeter = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          // If none exists, backend may respond 404.
          if (err?.status !== 404) {
            console.error('Failed to load house perimeter', err);
          }
          this.isLoadingPerimeter = false;
          this.updateDrawToolAvailability();
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Persists the current polygon to the backend.
   */
  private savePerimeterToApi(): void {
    const patientId = this.patient?.id;
    if (!patientId) return;
    if (this.isSavingPerimeter) return;

    const polygon = this.extractPolygonGeometry();
    if (!polygon) {
      // Polygon removed from the map.
      if (this.housePerimeterId) {
        this.deletePerimeterFromApi(this.housePerimeterId);
      }
      return;
    }

    const body = JSON.stringify(polygon);

    this.isSavingPerimeter = true;

    if (this.housePerimeterId) {
      this.http
        .put<any>(`${this.housePerimetersBaseUrl()}/${this.housePerimeterId}`, body, {
          headers: { 'Content-Type': 'application/json' },
        })
        .subscribe({
          next: () => {
            this.isSavingPerimeter = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.isSavingPerimeter = false;
            console.error('Failed to update house perimeter', err);
            this.cdr.detectChanges();
          },
        });
    } else {
      // Create only when we actually have a polygon.
      this.http
        .post<any>(this.housePerimetersBaseUrl(), body, {
          params: { patientId: String(patientId) },
          headers: { 'Content-Type': 'application/json' },
        })
        .subscribe({
          next: (res) => {
            const id = res?.id;
            this.housePerimeterId = typeof id === 'number' ? id : id ? Number(id) : null;
            this.isSavingPerimeter = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.isSavingPerimeter = false;
            console.error('Failed to create house perimeter', err);
            this.cdr.detectChanges();
          },
        });
    }
  }

  private deletePerimeterFromApi(id: number): void {
    if (this.isSavingPerimeter) return;

    this.isSavingPerimeter = true;
    this.http.delete<void>(`${this.housePerimetersBaseUrl()}/${id}`).subscribe({
      next: () => {
        this.housePerimeterId = null;
        this.isSavingPerimeter = false;
        this.updateDrawToolAvailability();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingPerimeter = false;
        console.error('Failed to delete house perimeter', err);
        this.cdr.detectChanges();
      },
    });
  }

  private extractPolygonGeometry(): GeoJSON.Polygon | null {
    const layer = this.drawnItems.getLayers()[0] as any;
    if (!layer?.toGeoJSON) return null;

    const gj = layer.toGeoJSON() as any;
    const geometry = gj?.geometry ?? gj;
    if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) {
      return null;
    }

    return geometry as GeoJSON.Polygon;
  }

  private parseGeoJsonPolygon(value: unknown): GeoJSON.Polygon | null {
    if (!value) return null;

    let parsed: any = value;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch {
        return null;
      }
    }

    // Accept: Polygon geometry, Feature<Polygon>, FeatureCollection with first Polygon.
    if (parsed?.type === 'FeatureCollection' && Array.isArray(parsed?.features)) {
      parsed = parsed.features[0];
    }
    if (parsed?.type === 'Feature') {
      parsed = parsed.geometry;
    }

    if (!parsed || parsed.type !== 'Polygon' || !Array.isArray(parsed.coordinates)) {
      return null;
    }

    return parsed as GeoJSON.Polygon;
  }

  private addGeoJsonToDrawnItems(geojson: GeoJSON.GeoJsonObject): void {
    this.drawnItems.clearLayers();
    const layerGroup = L.geoJSON(geojson);
    layerGroup.eachLayer((layer) => this.drawnItems.addLayer(layer));
  }

  private getInitialHomeLatLng(): L.LatLngExpression | null {
    const p = this.patient as any;
    const latCandidates = [
      p?.homeLatitude,
      p?.latitude,
      p?.lat,
      p?.addressLatitude,
      p?.location?.latitude,
      p?.location?.lat,
    ];
    const lngCandidates = [
      p?.homeLongitude,
      p?.longitude,
      p?.lng,
      p?.lon,
      p?.addressLongitude,
      p?.location?.longitude,
      p?.location?.lng,
      p?.location?.lon,
    ];

    const lat = latCandidates.find((v) => typeof v === 'number' && isFinite(v));
    const lng = lngCandidates.find((v) => typeof v === 'number' && isFinite(v));

    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return [lat, lng];
  }

  private configureLeafletDefaultIcons(): void {
    if (leafletIconsConfigured) return;

    try {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
        iconUrl: 'assets/leaflet/marker-icon.png',
        shadowUrl: 'assets/leaflet/marker-shadow.png',
      });
      leafletIconsConfigured = true;
    } catch (e) {
      console.warn('Failed to configure Leaflet icon URLs', e);
    }
  }
}
