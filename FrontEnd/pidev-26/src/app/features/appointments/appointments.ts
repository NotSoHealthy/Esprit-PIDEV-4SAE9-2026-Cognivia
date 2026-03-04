import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  NgZone,
} from '@angular/core';
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

import { forkJoin, Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';

type RefsPayload = {
  patients: PersonLite[];
  doctors: PersonLite[];
  caregivers: PersonLite[];
};

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Appointments implements OnInit, AfterViewInit {
  private readonly api = inject(AppointmentApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly doctorApi = inject(DoctorApiService);
  private readonly caregiverApi = inject(CaregiverApiService);
  private readonly modal = inject(NzModalService);
  private readonly notif = inject(NzNotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  loading = false;
  loadingRefs = false;

  items: Appointment[] = [];
  filteredItems: Appointment[] = [];
  filterNotes = '';

  patients: PersonLite[] = [];
  doctors: PersonLite[] = [];
  caregivers: PersonLite[] = [];

  statuses: AppointmentStatus[] = ['PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'];

  filterPatientId?: number;
  filterDoctorId?: number;
  filterCaregiverId?: number;
  filterStatus?: AppointmentStatus;

  isModalOpen = false;
  editingId: number | null = null;

  // ✅ durationMinutes AJOUTÉ + défaut (évite 400 si backend le veut)
  form: any = {
    caregiverId: null,
    patientId: null,
    doctorId: null,
    appointmentDate: new Date(),
    durationMinutes: 60,
    status: 'PENDING',
    notes: '',
    patientEmail: '',
    mailHtml: '',
  };

  // ✅ cache refs (évite multiples appels)
  private refs$?: Observable<RefsPayload>;

  ngOnInit(): void {
    // ❌ NE PAS appeler fetch() ici => cause NG0100 avec ng-zorro table + loading
    // ✅ par contre on peut préparer refs (sans impacter nzData)
    this.loadRefs$().subscribe({ error: () => { } });
  }

  ngAfterViewInit(): void {
    // ✅ premier rendu terminé => safe de changer nzLoading/nzData
    this.microtask(() => this.fetch());
  }

  /** ✅ microtask helper: évite ExpressionChangedAfterItHasBeenCheckedError */
  private microtask(fn: () => void): void {
    Promise.resolve().then(() => {
      this.zone.run(() => {
        fn();
        this.cdr.detectChanges();
      });
    });
  }

  private setLoading(v: boolean): void {
    this.microtask(() => (this.loading = v));
  }

  private setFiltered(list: Appointment[]): void {
    this.microtask(() => (this.filteredItems = list));
  }

  /** ✅ Charge patients/doctors/caregivers une seule fois */
  loadRefs$(): Observable<RefsPayload> {
    if (this.patients.length && this.doctors.length && this.caregivers.length) {
      return of({ patients: this.patients, doctors: this.doctors, caregivers: this.caregivers });
    }
    if (this.refs$) return this.refs$;

    this.loadingRefs = true;
    this.cdr.markForCheck();

    this.refs$ = forkJoin({
      patients: this.patientApi.getAll(),
      doctors: this.doctorApi.getAll(),
      caregivers: this.caregiverApi.getAll(),
    }).pipe(
      tap((res) => {
        this.patients = res.patients;
        this.doctors = res.doctors;
        this.caregivers = res.caregivers;
      }),
      finalize(() => {
        this.loadingRefs = false;
        this.cdr.markForCheck();
      }),
      shareReplay(1)
    );

    return this.refs$;
  }

  /** ✅ FETCH stable (pas de NG0100) */
  fetch(): void {
    this.setLoading(true);

    this.api
      .getAll({
        patientId: this.filterPatientId,
        doctorId: this.filterDoctorId,
        caregiverId: this.filterCaregiverId,
        status: this.filterStatus,
      })
      .subscribe({
        next: (data) => {
          // ✅ nouvelle référence => table stable
          this.items = [...(data ?? [])];
          this.onSearch(); // setFiltered() inside
          this.setLoading(false);
        },
        error: () => {
          this.setLoading(false);
          this.notif.error('Erreur', 'Impossible de charger les rendez-vous');
        },
      });
  }

  onSearch(): void {
    const term = (this.filterNotes ?? '').toLowerCase().trim();
    const res = term
      ? this.items.filter((item) => (item.notes ?? '').toLowerCase().includes(term))
      : [...this.items];

    this.setFiltered(res);
  }

  resetFilters(): void {
    this.filterPatientId = undefined;
    this.filterDoctorId = undefined;
    this.filterCaregiverId = undefined;
    this.filterStatus = undefined;
    this.filterNotes = '';
    this.fetch();
  }

  /** ✅ Modal open stable (un seul clic) */
  openCreate(): void {
    this.editingId = null;

    this.form = {
      caregiverId: null,
      patientId: null,
      doctorId: null,
      appointmentDate: new Date(),
      durationMinutes: 60,
      status: 'PENDING',
      notes: '',
      patientEmail: '',
      mailHtml: '',
    };

    this.loadRefs$().subscribe({
      next: () => this.microtask(() => (this.isModalOpen = true)),
      error: () => this.notif.error('Error', 'Failed to load reference lists'),
    });
  }

  openEdit(item: Appointment): void {
    this.editingId = item.id ?? null;

    this.form = {
      caregiverId: item.caregiverId,
      patientId: item.patientId,
      doctorId: item.doctorId,
      appointmentDate: item.appointmentDate ? new Date(item.appointmentDate) : new Date(),
      durationMinutes: item.durationMinutes ?? 60,
      status: item.status ?? 'PENDING',
      notes: item.notes ?? '',
      patientEmail: (item as any).patientEmail ?? '',
      mailHtml: (item as any).mailHtml ?? '',
    };

    this.loadRefs$().subscribe({
      next: () => this.microtask(() => (this.isModalOpen = true)),
      error: () => this.notif.error('Error', 'Failed to load reference lists'),
    });
  }

  closeModal(): void {
    this.microtask(() => (this.isModalOpen = false));
  }

  labelOf(p: PersonLite): string {
    if ((p as any).name) return (p as any).name;
    if ((p as any).firstName || (p as any).lastName) {
      return `${(p as any).firstName || ''} ${(p as any).lastName || ''}`.trim();
    }
    return `#${(p as any).id ?? ''}`;
  }

  private displayNameOf(p: any): string {
    if (!p) return '';
    if (p.name) return String(p.name);
    const fn = String(p.firstName ?? '').trim();
    const ln = String(p.lastName ?? '').trim();
    const full = `${fn} ${ln}`.trim();
    return full || `#${p.id ?? ''}`;
  }

  private patientNameById(id: any): string {
    const p = this.patients.find((x) => x.id === id);
    return this.displayNameOf(p);
  }

  private doctorNameById(id: any): string {
    const d = this.doctors.find((x) => x.id === id);
    return this.displayNameOf(d);
  }

  // ✅ tu gardes ton HTML complet ici (je l’ai laissé inchangé dans ta version)
  private buildMailHtml(data: any): string {
    const date = data.appointmentDate ? new Date(data.appointmentDate).toLocaleString() : '';
    const patientName = this.patientNameById(data.patientId) || 'Madame/Monsieur';
    const doctorName = this.doctorNameById(data.doctorId) || '-';

    return `.<!doctype html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>Confirmation de Rendez-vous — cognivia</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f0f4f8; }
    @media only screen and (max-width: 640px) {
      .email-wrapper { padding: 12px 8px !important; }
      .email-card { border-radius: 10px !important; }
      .header-cell { padding: 18px 16px 14px !important; }
      .body-cell { padding: 20px 16px !important; }
      .footer-cell { padding: 14px 16px !important; }
      .detail-label { width: 40% !important; }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Inter',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Preheader text (invisible) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:transparent;">
    ✅ Votre rendez-vous chez cognivia est confirmé — Consultez les détails ci-dessous.
  </div>

  <!-- Wrapper table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-wrapper"
         style="background:#f0f4f8;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-card"
               style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 4px 32px rgba(16,24,40,0.10);border:1px solid #e4e7ec;">

          <!-- ───── HEADER ───── -->
          <tr>
            <td class="header-cell"
                style="background:linear-gradient(135deg,#1677ff 0%,#0958d9 100%);padding:24px 28px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <!-- Logo + name -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:rgba(255,255,255,0.18);border-radius:8px;padding:6px 10px;display:inline-block;">
                          <span style="font-size:13px;font-weight:700;color:#ffffff;letter-spacing:.3px;">🩺 cognivia</span>
                        </td>
                      </tr>
                    </table>
                    <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:10px;letter-spacing:-.2px;">
                      Confirmation de rendez-vous
                    </div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.78);margin-top:4px;">
                      Votre rendez-vous a été enregistré avec succès
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <!-- Date badge -->
                    <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);
                                border-radius:8px;padding:6px 12px;display:inline-block;
                                font-size:12px;color:#ffffff;white-space:nowrap;">
                      📅 ${date || ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ───── SUCCESS BANNER ───── -->
          <tr>
            <td style="background:#ecfdf5;border-bottom:1px solid #d1fae5;padding:12px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:20px;padding-right:10px;line-height:1;">✅</td>
                  <td style="font-size:14px;color:#065f46;font-weight:600;">
                    Bonjour <span style="color:#027a48;">${patientName}</span>, votre rendez-vous est confirmé !
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ───── BODY ───── -->
          <tr>
            <td class="body-cell" style="padding:28px 28px 20px;">

              <!-- Details card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f8fafc;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden;">

                <!-- Card header -->
                <tr>
                  <td style="background:#f1f5f9;padding:12px 18px;border-bottom:1px solid #e4e7ec;">
                    <span style="font-size:11px;font-weight:700;color:#475467;text-transform:uppercase;letter-spacing:.8px;">
                      📋 Détails du rendez-vous
                    </span>
                  </td>
                </tr>

                <!-- Card rows -->
                <tr>
                  <td style="padding:0 18px 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           style="font-size:14px;color:#101828;">

                      <!-- Patient -->
                      <tr>
                        <td class="detail-label"
                            style="padding:13px 0;border-bottom:1px solid #eaecf0;width:32%;color:#667085;font-size:13px;font-weight:500;">
                          👤 Patient
                        </td>
                        <td style="padding:13px 0;border-bottom:1px solid #eaecf0;">
                          <span style="font-weight:600;color:#101828;">${patientName}</span>
                        </td>
                      </tr>

                      <!-- Médecin -->
                      <tr>
                        <td class="detail-label"
                            style="padding:13px 0;border-bottom:1px solid #eaecf0;width:32%;color:#667085;font-size:13px;font-weight:500;">
                          🩺 Médecin
                        </td>
                        <td style="padding:13px 0;border-bottom:1px solid #eaecf0;">
                          <span style="font-weight:600;color:#101828;">Dr. ${doctorName}</span>
                        </td>
                      </tr>

                      <!-- Date -->
                      <tr>
                        <td class="detail-label"
                            style="padding:13px 0;border-bottom:1px solid #eaecf0;width:32%;color:#667085;font-size:13px;font-weight:500;">
                          🗓️ Date & heure
                        </td>
                        <td style="padding:13px 0;border-bottom:1px solid #eaecf0;">
                          <span style="font-weight:600;color:#101828;">${date || '—'}</span>
                        </td>
                      </tr>

                      <!-- Statut -->
                      <tr>
                        <td class="detail-label"
                            style="padding:13px 0;border-bottom:1px solid #eaecf0;width:32%;color:#667085;font-size:13px;font-weight:500;">
                          📌 Statut
                        </td>
                        <td style="padding:13px 0;border-bottom:1px solid #eaecf0;">
                          ${(data.status === 'CONFIRMED' || data.status === 'CONFIRMÉ')
        ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;
                                border-radius:999px;font-size:12px;font-weight:700;
                                background:#ecfdf3;color:#027a48;border:1px solid #a7f3d0;">
                                ✓ CONFIRMÉ</span>`
        : `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;
                                border-radius:999px;font-size:12px;font-weight:700;
                                background:#fffbeb;color:#b45309;border:1px solid #fcd34d;">
                                ⏳ ${data.status || 'EN ATTENTE'}</span>`
      }
                        </td>
                      </tr>

                      <!-- Notes -->
                      <tr>
                        <td class="detail-label"
                            style="padding:13px 0;width:32%;color:#667085;font-size:13px;font-weight:500;vertical-align:top;">
                          📝 Notes
                        </td>
                        <td style="padding:13px 0;color:#344054;font-size:14px;line-height:1.6;">
                          ${data.notes
        ? `<span style="background:#f8fafc;border-left:3px solid #1677ff;
                                           padding:6px 10px;border-radius:0 6px 6px 0;display:block;
                                           font-style:italic;color:#475467;">${data.notes}</span>`
        : `<span style="color:#98a2b3;font-style:italic;">Aucune note</span>`
      }
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="margin-top:18px;background:#eff6ff;border:1px solid #bfdbfe;
                            border-radius:10px;padding:0;">
                <tr>
                  <td style="padding:14px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px;padding-right:10px;vertical-align:top;line-height:1.4;">ℹ️</td>
                        <td style="font-size:13px;color:#1e40af;line-height:1.6;">
                          Pour toute <strong>modification ou annulation</strong>, veuillez contacter notre équipe
                          au moins <strong>24h à l'avance</strong> en répondant à cet email ou en appelant notre secrétariat.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ───── DIVIDER ───── -->
          <tr>
            <td style="padding:0 28px;">
              <div style="height:1px;background:linear-gradient(to right,transparent,#e4e7ec,transparent);"></div>
            </td>
          </tr>

          <!-- ───── FOOTER ───── -->
          <tr>
            <td class="footer-cell" style="padding:18px 28px 22px;background:#f8fafc;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <div style="font-size:13px;font-weight:700;color:#344054;">🩺 cognivia</div>
                    <div style="font-size:12px;color:#98a2b3;margin-top:3px;line-height:1.5;">
                      Ceci est un message automatique — merci de ne pas y répondre directement.<br/>
                      © ${new Date().getFullYear()} cognivia. Tous droits réservés.
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <div style="font-size:11px;color:#d0d5dd;
                                background:#ffffff;border:1px solid #e4e7ec;
                                border-radius:6px;padding:5px 10px;white-space:nowrap;">
                      Envoyé le ${date || ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End card -->

        <!-- Bottom note -->
        <div style="margin-top:16px;font-size:11px;color:#98a2b3;text-align:center;line-height:1.6;">
          Vous recevez cet email car vous avez pris un rendez-vous via cognivia.<br/>
          <a href="#" style="color:#1677ff;text-decoration:none;">Politique de confidentialité</a>
          &nbsp;·&nbsp;
          <a href="#" style="color:#1677ff;text-decoration:none;">Nous contacter</a>
        </div>

      </td>
    </tr>
  </table>

</body>
</html>`;
  }

  save(): void {
    if (this.loadingRefs) {
      this.notif.info('Chargement', 'Veuillez patienter, chargement des listes…');
      return;
    }

    // ✅ validations
    if (!this.form.patientId || !this.form.doctorId || !this.form.caregiverId) {
      this.notif.warning('Validation', 'Please select Patient, Doctor, and Caregiver.');
      return;
    }

    // ✅ durationMinutes obligatoire côté backend souvent
    const dur = Number(this.form.durationMinutes);
    if (!Number.isFinite(dur) || dur <= 0) {
      this.notif.warning('Validation', 'Duration must be a positive number (ex: 30, 45, 60).');
      return;
    }

    // ✅ on ferme le modal au click OK (stable)
    this.microtask(() => (this.isModalOpen = false));

    // ✅ CREATE ONLY: auto email + mailHtml
    if (this.editingId == null) {
      const p = this.patients.find((x) => x.id === this.form.patientId);

      if (!this.form.patientEmail || !String(this.form.patientEmail).trim()) {
        this.form.patientEmail = (p as any)?.email ?? '';
      }

      const email = String(this.form.patientEmail || '').trim();
      if (!email || !email.includes('@')) {
        this.notif.warning('Validation', 'Email patient manquant ou invalide.');
        this.microtask(() => (this.isModalOpen = true));
        return;
      }

      this.form.patientEmail = email;

      this.form.mailHtml = this.buildMailHtml({
        ...this.form,
        appointmentDate: this.form.appointmentDate,
      });
    }

    // ✅ payload propre (ISO string + durationMinutes number)
    const payload: Appointment = {
      caregiverId: Number(this.form.caregiverId),
      patientId: Number(this.form.patientId),
      doctorId: Number(this.form.doctorId),
      appointmentDate:
        this.form.appointmentDate instanceof Date
          ? this.form.appointmentDate.toISOString()
          : new Date(this.form.appointmentDate).toISOString(),
      durationMinutes: dur,
      status: this.form.status,
      notes: this.form.notes ?? null,
      // si ton backend accepte ces champs additionnels, sinon retire-les:
      ...(this.editingId == null ? { patientEmail: this.form.patientEmail, mailHtml: this.form.mailHtml } : {}),
    } as any;

    this.setLoading(true);

    const req$ = this.editingId == null ? this.api.create(payload) : this.api.update(this.editingId, payload);

    req$.pipe(finalize(() => this.setLoading(false))).subscribe({
      next: () => {
        this.notif.success('Succès', this.editingId ? 'Mis à jour' : 'Créé + Email envoyé');
        this.fetch();
      },
      error: (err) => {
        if (err.status === 409) {
          const jokes = [
            'The doctor cannot be in two places at once. Pick another time 😉',
            "Our doctor is good, but even they haven't mastered teleportation yet! 🚀",
            'Double trouble! This slot is already taken. Try another? 🩺',
            'Wait! The space-time continuum would rip if we put two people there. 🌌',
            'Someone beat you to it! That doctor is busy saving the world then. 🦸',
          ];
          const joke = jokes[Math.floor(Math.random() * jokes.length)];
          this.notif.warning('Conflict', joke);
        } else {
          this.notif.error('Erreur', 'Vérifie les champs envoyés (duration/date/status).');
        }
        // ré-ouvrir modal si tu veux corriger
        this.microtask(() => (this.isModalOpen = true));
      },
    });
  }

  confirmDelete(item: Appointment): void {
    if (!item.id) return;

    this.modal.confirm({
      nzTitle: 'Supprimer ce rendez-vous ?',
      nzOnOk: () => {
        this.setLoading(true);
        this.api
          .delete(item.id!)
          .pipe(finalize(() => this.setLoading(false)))
          .subscribe({
            next: () => {
              this.notif.success('Supprimé', 'Rendez-vous supprimé');
              this.fetch();
            },
            error: () => this.notif.error('Erreur', 'Suppression impossible'),
          });
      },
    });
  }
}