import {
  Component, ElementRef, NgZone, OnDestroy, OnInit,
  ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentApiService } from '../../../core/api/appointment.service';
import { Appointment } from '../../../core/api/models/appointment.model';
import { Doctor, Patient } from '../../../core/api/models/doctor.model';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-doc-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doc-map.component.html',
  styleUrls: ['./doc-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocMapComponent implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private api = inject(AppointmentApiService);

  @ViewChild('charSvg') charSvg!: ElementRef<SVGSVGElement>;

  readonly MAP_W = 2000;
  MAP_H = 1200;
  readonly SPEED = 5.5;
  readonly PROXIMITY = 120;
  
  rowArray: number[] = [0];

  charX = 1000;
  charY = 550;
  cameraX = -530;
  cameraY = -280;
  isLeft = false;
  isMoving = false;
  stepPhase = 0;

  particles: { x: number; y: number; opacity: number; size: number; vx: number; vy: number; color: string }[] = [];

  uiState: 'map' | 'menu' | 'list' | 'detail' | 'patient-history' = 'map';
  menuIndex = 0;

  doctors: Doctor[] = [];
  patients: Patient[] = [];
  doctorApptsStore = new Map<number, Appointment[]>();

  detailedAppts: any[] = [];
  selectedAppt: any | null = null;
  patientAppointments: any[] = [];

  activeDoctor: Doctor | null = null;
  activeDoctorIndex = -1;
  activePatient: Patient | null = null;
  activePatientIndex = -1;

  toastMessage = '';
  toastVisible = false;
  private toastTimer: any;

  sideMode: 'edit' | 'delete' | null = null;
  editingAppt: any | null = null;
  pendingDeleteAppt: any | null = null;
  editForm = { status: 'PENDING', notes: '' };

  svgRooms: any[] = [
    { type: 'office', x: 50, y: 50, label: 'OFFICE A', desc: 'General Medicine', color: '#38bdf8' },
    { type: 'office', x: 550, y: 50, label: 'OFFICE B', desc: 'Cardiology', color: '#34d399' },
    { type: 'office', x: 1050, y: 50, label: 'OFFICE C', desc: 'Neurology', color: '#f472b6' },
    { type: 'office', x: 1550, y: 50, label: 'OFFICE D', desc: 'Pediatrics', color: '#fb923c' }
  ];

  // Doctor positions — centered inside each top office room
  officePositions = [
    { x: 256, y: 156 },   // Office A — top row 1
    { x: 756, y: 156 },   // Office B — top row 2
    { x: 1256, y: 156 },  // Office C — top row 3
    { x: 1756, y: 156 }   // Office D — top row 4
  ];

  doctorColors = [
    { accent: '#38bdf8', glow: 'rgba(56,189,248,0.4)',  bg: 'rgba(56,189,248,0.1)',  border: '#0ea5e9' },
    { accent: '#34d399', glow: 'rgba(52,211,153,0.4)',  bg: 'rgba(52,211,153,0.1)',  border: '#10b981' },
    { accent: '#f472b6', glow: 'rgba(244,114,182,0.4)', bg: 'rgba(244,114,182,0.1)', border: '#ec4899' },
    { accent: '#fb923c', glow: 'rgba(251,146,60,0.4)',  bg: 'rgba(251,146,60,0.1)',  border: '#f97316' }
  ];

  // Patient properties - Generated dynamically
  patientPositions: {x: number, y: number}[] = [];

  patientColors = [
    { accent: '#c084fc', glow: 'rgba(192,132,252,0.4)', bg: 'rgba(192,132,252,0.1)', border: '#a855f7' },
    { accent: '#e879f9', glow: 'rgba(232,121,249,0.4)', bg: 'rgba(232,121,249,0.1)', border: '#d946ef' },
    { accent: '#818cf8', glow: 'rgba(129,140,248,0.4)', bg: 'rgba(129,140,248,0.1)', border: '#6366f1' },
    { accent: '#f8fafc', glow: 'rgba(248,250,252,0.4)', bg: 'rgba(248,250,252,0.1)', border: '#cbd5e1' }
  ];

  private keys = new Set<string>();
  private rafId: number | null = null;
  private particleColors = ['#38bdf8','#34d399','#f472b6','#fb923c','#818cf8'];

  ngOnInit() {
    this.initParticles();
    window.addEventListener('keydown', this.handleInput);
    window.addEventListener('keyup',   this.handleInput);
    this.fetchData();
    this.zone.runOutsideAngular(() => this.engineLoop());
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.handleInput);
    window.removeEventListener('keyup',   this.handleInput);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    clearTimeout(this.toastTimer);
  }

  private initParticles() {
    this.particles = Array.from({ length: 45 }, (_, i) => ({
      x: Math.random() * this.MAP_W,
      y: Math.random() * this.MAP_H,
      opacity: Math.random() * 0.5 + 0.1,
      size: Math.random() * 2.5 + 0.8,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: this.particleColors[i % this.particleColors.length]
    }));
  }

  private updateParticles() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0)   p.x = this.MAP_W;
      if (p.x > this.MAP_W) p.x = 0;
      if (p.y < 0)   p.y = this.MAP_H;
      if (p.y > this.MAP_H) p.y = 0;
    });
  }

  private handleInput = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (e.type === 'keydown') {
      this.keys.add(key);
      if (this.uiState === 'menu') {
        if (key === 'arrowup'   || key === 'w') this.menuIndex = 0;
        if (key === 'arrowdown' || key === 's') this.menuIndex = 1;
        if (key === 'enter') this.executeMenuSelection();
        return;
      }
      if (this.uiState === 'map' && (key === 'enter' || key === ' ')) {
        const idx = this.doctors.findIndex((_, i) => this.checkProximity(i));
        if (idx >= 0) {
          this.activeDoctor = this.doctors[idx];
          this.activeDoctorIndex = idx;
          this.uiState = 'menu';
          this.menuIndex = 0;
          this.keys.clear();
          this.zone.run(() => this.cdr.markForCheck());
        } else {
          // Check if near a patient ward
          const patIdx = this.patients.findIndex((_, i) => this.checkPatientProximity(i));
          if (patIdx >= 0) {
            this.activePatient = this.patients[patIdx];
            this.activePatientIndex = patIdx;
            this.openPatientHistory();
            this.keys.clear();
            this.zone.run(() => this.cdr.markForCheck());
          }
        }
      }
    } else {
      this.keys.delete(key);
    }
  };

  executeMenuSelection() {
    if (this.menuIndex === 0) {
      this.openList();
    } else {
      this.closeUI();
    }
  }

  openList() {
    const raw = this.doctorApptsStore.get(this.activeDoctor!.id) || [];
    this.detailedAppts = raw.map(a => {
      const patient = this.patients.find(p => p.id === a.patientId);
      return {
        ...a,
        patientName: patient
          ? `${patient.firstName} ${patient.lastName}`.trim()
          : `Patient #${a.patientId}`
      };
    });
    this.sideMode = null;
    this.uiState = 'list';
    this.cdr.markForCheck();
  }

  openPatientHistory() {
    this.uiState = 'patient-history';
    const allAppts: any[] = [];
    this.doctorApptsStore.forEach((appts, docId) => {
      const doc = this.doctors.find(d => d.id === docId);
      const filtered = appts.filter(a => a.patientId === this.activePatient!.id);
      filtered.forEach(a => {
        allAppts.push({
          ...a,
          doctorName: doc ? `Dr. ${doc.firstName} ${doc.lastName}` : `Doctor #${docId}`,
          doctorSpeciality: doc ? doc.speciality : 'General'
        });
      });
    });
    // Sort descending by date
    this.patientAppointments = allAppts.sort((a, b) => new Date(b.appointmentDate || 0).getTime() - new Date(a.appointmentDate || 0).getTime());
    this.cdr.markForCheck();
  }

  private engineLoop() {
    const frame = () => {
      this.updateParticles();
      if (this.uiState === 'map') {
        let dx = 0, dy = 0;
        if (this.keys.has('w') || this.keys.has('arrowup'))    dy -= this.SPEED;
        if (this.keys.has('s') || this.keys.has('arrowdown'))  dy += this.SPEED;
        if (this.keys.has('a') || this.keys.has('arrowleft'))  { dx -= this.SPEED; this.isLeft = true; }
        if (this.keys.has('d') || this.keys.has('arrowright')) { dx += this.SPEED; this.isLeft = false; }

        this.isMoving = dx !== 0 || dy !== 0;
        if (this.isMoving) {
          this.charX = Math.max(40, Math.min(this.MAP_W - 40, this.charX + dx));
          this.charY = Math.max(40, Math.min(this.MAP_H - 40, this.charY + dy));
          this.stepPhase += 0.35;
          this.animateStep(Math.sin(this.stepPhase) * 18);
        } else {
          this.stepPhase = 0;
          this.animateStep(0);
        }

        // Camera Update
        this.cameraX = Math.min(0, Math.max(940 - this.MAP_W, 470 - this.charX));
        this.cameraY = Math.min(0, Math.max(540 - this.MAP_H, 270 - this.charY));
      }
      this.zone.run(() => this.cdr.detectChanges());
      this.rafId = requestAnimationFrame(frame);
    };
    this.rafId = requestAnimationFrame(frame);
  }

  private fetchData() {
    this.doctorApptsStore.clear();
    forkJoin({
      docs: this.api.getDoctors().pipe(catchError(() => of([]))),
      pts:  this.api.getPatients().pipe(catchError(() => of([])))
    }).subscribe(({ docs, pts }) => {
      this.doctors  = docs;
      this.patients = pts;

      // Expand map dynamically based on patient count
      const ptRows = Math.ceil(this.patients.length / 4);
      this.MAP_H = 500 + (Math.max(1, ptRows) * 650);
      this.rowArray = Array.from({ length: ptRows }, (_, i) => i);

      // Rebuild arrays
      this.patientPositions = [];
      this.svgRooms = this.svgRooms.filter(r => r.type === 'office');
      this.patients.forEach((pat, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        this.patientPositions.push({ x: 256 + (col * 500), y: 906 + (row * 650) });
        this.svgRooms.push({
          type: 'patient',
          x: 50 + (col * 500),
          y: 800 + (row * 650),
          label: `ROOM 10${index + 1}`,
          desc: 'Inpatient Ward',
          color: this.getPatientColor(index).accent
        });
      });

      docs.forEach(d => {
        this.api.getAppointmentsByDoctor(d.id).subscribe({
          next: appts => {
            this.doctorApptsStore.set(d.id, (appts || []).filter(a => a.doctorId === d.id));
            this.cdr.markForCheck();
          },
          error: () => { this.doctorApptsStore.set(d.id, []); this.cdr.markForCheck(); }
        });
      });
    });
  }

  checkProximity(docIndex: number): boolean {
    const pos = this.officePositions[docIndex % 4];
    return Math.hypot(this.charX - pos.x, this.charY - pos.y) < this.PROXIMITY;
  }

  getDocColor(i: number) { return this.doctorColors[i % this.doctorColors.length]; }

  checkPatientProximity(patientIndex: number): boolean {
    const pos = this.patientPositions[patientIndex];
    if (!pos) return false;
    return Math.hypot(this.charX - pos.x, this.charY - pos.y) < this.PROXIMITY;
  }

  getPatientColor(i: number) { return this.patientColors[i % this.patientColors.length]; }

  getPendingCount(doctorId: number): number {
    return (this.doctorApptsStore.get(doctorId) || []).filter(a => a.status === 'PENDING').length;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'st-pending', CONFIRMED: 'st-confirmed',
      COMPLETED: 'st-completed', CANCELLED: 'st-cancelled'
    };
    return map[status] ?? 'st-pending';
  }

  closeUI() {
    this.uiState = 'map';
    this.activeDoctor = null;
    this.activeDoctorIndex = -1;
    this.activePatient = null;
    this.activePatientIndex = -1;
    this.sideMode = null;
    this.editingAppt = null;
    this.pendingDeleteAppt = null;
    this.cdr.markForCheck();
  }

  goBackToMenu() { this.uiState = 'menu'; this.sideMode = null; this.cdr.markForCheck(); }
  goBackToList() { this.uiState = 'list'; this.sideMode = null; this.cdr.markForCheck(); }

  selectApptDetail(appt: any) {
    this.selectedAppt = { ...appt };
    this.sideMode = null;
    this.uiState = 'detail';
    this.cdr.markForCheck();
  }

  openEdit(appt: any) {
    this.editingAppt = { ...appt };
    this.editForm = { status: appt.status || 'PENDING', notes: appt.notes || '' };
    this.sideMode = 'edit';
    this.cdr.markForCheck();
  }

  openDeleteConfirm(appt: any) {
    this.pendingDeleteAppt = { ...appt };
    this.sideMode = 'delete';
    this.cdr.markForCheck();
  }

  cancelSide() {
    this.sideMode = null;
    this.editingAppt = null;
    this.pendingDeleteAppt = null;
    this.cdr.markForCheck();
  }

  saveEdit() {
    if (!this.editingAppt) return;
    const payload: Appointment = { ...this.editingAppt, status: this.editForm.status as any, notes: this.editForm.notes };
    this.api.updateAppointment(this.editingAppt.id, payload)
      .pipe(catchError(() => of(null))).subscribe(res => {
        if (res) {
          const idx = this.detailedAppts.findIndex(a => a.id === this.editingAppt!.id);
          if (idx >= 0) {
            this.detailedAppts[idx] = { ...this.detailedAppts[idx], status: this.editForm.status, notes: this.editForm.notes };
            this.detailedAppts = [...this.detailedAppts];
          }
          const docId = this.activeDoctor!.id;
          const store = [...(this.doctorApptsStore.get(docId) || [])];
          const si = store.findIndex(a => a.id === this.editingAppt!.id);
          if (si >= 0) store[si] = { ...store[si], status: this.editForm.status as any, notes: this.editForm.notes };
          this.doctorApptsStore.set(docId, store);
          this.showToast('Appointment updated ✓');
        } else { this.showToast('Update failed'); }
        this.cancelSide();
        this.cdr.markForCheck();
      });
  }

  confirmDelete() {
    if (!this.pendingDeleteAppt) return;
    const id = this.pendingDeleteAppt.id;
    const name = this.pendingDeleteAppt.patientName;
    this.api.deleteAppointment(id).pipe(catchError(() => of(null))).subscribe(() => {
      this.detailedAppts = this.detailedAppts.filter(a => a.id !== id);
      const docId = this.activeDoctor!.id;
      this.doctorApptsStore.set(docId, (this.doctorApptsStore.get(docId) || []).filter(a => a.id !== id));
      this.showToast(`${name} deleted`);
      this.cancelSide();
      this.cdr.markForCheck();
    });
  }

  changeStatusInline(appt: any, newStatus: string) {
    this.api.updateStatus(appt.id, newStatus).pipe(catchError(() => of(null))).subscribe(res => {
      if (res) { appt.status = newStatus; this.showToast('Status → ' + newStatus); this.cdr.markForCheck(); }
    });
  }

  private showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible = false; this.cdr.markForCheck(); }, 2500);
    this.cdr.markForCheck();
  }

  startMove(dir: string) { this.keys.add(this.dirToKey(dir)); }
  stopMove(dir: string)  { this.keys.delete(this.dirToKey(dir)); }
  private dirToKey(d: string): string {
    return ({ up:'arrowup', down:'arrowdown', left:'arrowleft', right:'arrowright' } as any)[d] ?? d;
  }

  private animateStep(angle: number) {
    const svg = this.charSvg?.nativeElement;
    if (!svg) return;
    svg.querySelector('#L-Leg')?.setAttribute('transform', `rotate(${-angle} 12 6)`);
    svg.querySelector('#R-Leg')?.setAttribute('transform', `rotate(${angle}  12 6)`);
    svg.querySelector('#L-Arm')?.setAttribute('transform', `rotate(${angle * 0.6}  4 4)`);
    svg.querySelector('#R-Arm')?.setAttribute('transform', `rotate(${-angle * 0.6} 20 4)`);
  }
}