import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { AppointmentApiService } from '../../core/api/appointment.service';
import { Appointment, AppointmentStatus } from '../../core/api/models/appointment.model';
import { PatientApiService } from '../../core/api/patient.service';
import { DoctorApiService } from '../../core/api/doctor.service';
import { CaregiverApiService } from '../../core/api/caregiver.service';
import { PersonLite } from '../../core/api/models/person-lite.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NzDatePickerModule,
    NzIconModule,
    NzCardModule,
    NzTooltipModule,
  ],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.css'],
})
export class Appointments implements OnInit {
  private readonly api = inject(AppointmentApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly doctorApi = inject(DoctorApiService);
  private readonly caregiverApi = inject(CaregiverApiService);
  private readonly modal = inject(NzModalService);
  private readonly notif = inject(NzNotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  loadingRefs = false;
  items: Appointment[] = [];
  filteredItems: Appointment[] = [];
  filterNotes = '';

  patients: PersonLite[] = [];
  doctors: PersonLite[] = [];
  caregivers: PersonLite[] = [];

  statuses: AppointmentStatus[] = ['PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'];

  // filters
  filterPatientId?: number;
  filterDoctorId?: number;
  filterCaregiverId?: number;
  filterStatus?: AppointmentStatus;

  // create/edit form
  isModalOpen = false;
  editingId: number | null = null;

  form: any = {
    caregiverId: null,
    patientId: null,
    doctorId: null,
    appointmentDate: new Date(),
    status: 'PENDING',
    notes: '',
  };

  ngOnInit(): void {
    this.fetch();
    this.loadRefs();
  }

  loadRefs(): void {
    if (this.patients.length > 0 && this.doctors.length > 0 && this.caregivers.length > 0) return;

    this.loadingRefs = true;
    forkJoin({
      patients: this.patientApi.getAll(),
      doctors: this.doctorApi.getAll(),
      caregivers: this.caregiverApi.getAll()
    }).subscribe({
      next: (res) => {
        this.patients = res.patients;
        this.doctors = res.doctors;
        this.caregivers = res.caregivers;
        this.loadingRefs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingRefs = false;
        this.notif.error('Error', 'Failed to load reference lists');
        console.error('Reference loading error:', err);
      }
    });
  }

  fetch(): void {
    setTimeout(() => {
      this.loading = true;

      this.api
        .getAll({
          patientId: this.filterPatientId,
          doctorId: this.filterDoctorId,
          caregiverId: this.filterCaregiverId,
          status: this.filterStatus,
        })
        .subscribe({
          next: (data) => {
            this.items = data;
            this.onSearch(); // Initialize filteredItems
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            this.loading = false;
            this.cdr.detectChanges();
            this.notif.error('Erreur', 'Impossible de charger les rendez-vous');
            console.error('GET /appointments error:', err);
          },
        });
    });
  }

  onSearch(): void {
    const term = this.filterNotes.toLowerCase().trim();
    if (!term) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter((item) =>
        item.notes?.toLowerCase().includes(term)
      );
    }
  }

  resetFilters(): void {
    this.filterPatientId = undefined;
    this.filterDoctorId = undefined;
    this.filterCaregiverId = undefined;
    this.filterStatus = undefined;
    this.filterNotes = '';
    this.fetch();
  }

  openCreate(): void {
    this.loadRefs();
    this.editingId = null;
    this.form = {
      caregiverId: null,
      patientId: null,
      doctorId: null,
      appointmentDate: new Date(),
      status: 'PENDING',
      notes: '',
    };
    this.isModalOpen = true;
  }

  openEdit(item: Appointment): void {
    this.loadRefs();
    this.editingId = item.id ?? null;
    this.form = {
      ...item,
      appointmentDate: item.appointmentDate ? new Date(item.appointmentDate) : new Date()
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  labelOf(p: PersonLite): string {
    if (p.name) return p.name;
    if (p.firstName || p.lastName) return `${p.firstName || ''} ${p.lastName || ''}`.trim();
    return `#${p.id}`;
  }

  save(): void {
    if (!this.form.patientId || !this.form.doctorId || !this.form.caregiverId) {
      this.notif.warning('Validation', 'Please select Patient, Doctor, and Caregiver.');
      return;
    }

    const payload: Appointment = {
      ...this.form,
      appointmentDate: this.form.appointmentDate instanceof Date
        ? this.form.appointmentDate.toISOString()
        : new Date(this.form.appointmentDate).toISOString(),
    };

    this.loading = true;

    const req$ =
      this.editingId == null
        ? this.api.create(payload)
        : this.api.update(this.editingId, payload);

    req$.subscribe({
      next: () => {
        this.loading = false;
        this.isModalOpen = false;
        this.notif.success('Succès', this.editingId ? 'Mis à jour' : 'Créé');
        this.fetch();
      },
      error: (err: any) => {
        this.loading = false;
        this.notif.error('Erreur', 'Vérifie les champs envoyés (400/500)');
        console.error('SAVE appointment error:', err);
      },
    });
  }

  confirmDelete(item: Appointment): void {
    if (!item.id) return;

    this.modal.confirm({
      nzTitle: 'Supprimer ce rendez-vous ?',
      nzOkText: 'Oui',
      nzCancelText: 'Non',
      nzOnOk: () => {
        this.loading = true;
        this.api.delete(item.id!).subscribe({
          next: () => {
            this.loading = false;
            this.notif.success('Supprimé', 'Rendez-vous supprimé');
            this.fetch();
          },
          error: (err: any) => {
            this.loading = false;
            this.notif.error('Erreur', 'Suppression impossible');
            console.error('DELETE appointment error:', err);
          },
        });
      },
    });
  }
}