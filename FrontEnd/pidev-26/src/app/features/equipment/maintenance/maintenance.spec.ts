import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  ArrowLeftOutline,
  CalendarOutline,
  DeleteOutline,
  EditOutline,
  ExclamationCircleFill,
  ToolOutline,
} from '@ant-design/icons-angular/icons';

import { Maintenance } from './maintenance';
import { MaintenanceService } from './services/maintenance.service';
import { EquipmentService } from '../services/equipment-service';
import { ReservationService } from '../reservation/services/reservation.service';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { MaintenanceStatus } from './models/maintenance-status.enum';

describe('Maintenance', () => {
  let component: Maintenance;
  let fixture: ComponentFixture<Maintenance>;
  let maintenanceService: jasmine.SpyObj<MaintenanceService>;
  let equipmentService: jasmine.SpyObj<EquipmentService>;
  let reservationService: jasmine.SpyObj<ReservationService>;
  let queryParams$: BehaviorSubject<Record<string, unknown>>;

  beforeEach(async () => {
    maintenanceService = jasmine.createSpyObj<MaintenanceService>('MaintenanceService', [
      'getMaintenanceByEquipmentId',
      'checkAvailability',
      'create',
      'update',
      'delete',
    ]);
    equipmentService = jasmine.createSpyObj<EquipmentService>('EquipmentService', ['getAll']);
    reservationService = jasmine.createSpyObj<ReservationService>('ReservationService', [
      'checkAvailability',
    ]);
    queryParams$ = new BehaviorSubject<Record<string, unknown>>({ equipmentId: 7 });

    equipmentService.getAll.and.returnValue(
      of([
        {
          id: 7,
          name: 'Ultrasound',
          description: 'Portable device',
          status: 'AVAILABLE',
          conditionScore: 88,
          imageUrl: '',
        },
      ]),
    );
    maintenanceService.getMaintenanceByEquipmentId.and.returnValue(of([]));
    maintenanceService.checkAvailability.and.returnValue(of(null));
    maintenanceService.create.and.returnValue(of({ id: 1 } as any));
    maintenanceService.update.and.returnValue(of({ id: 1 } as any));
    maintenanceService.delete.and.returnValue(of(void 0));
    reservationService.checkAvailability.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [Maintenance],
      providers: [
        { provide: API_BASE_URL, useValue: 'http://api-test' },
        { provide: MaintenanceService, useValue: maintenanceService },
        { provide: EquipmentService, useValue: equipmentService },
        { provide: ReservationService, useValue: reservationService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } },
        provideNzIcons([
          ArrowLeftOutline,
          CalendarOutline,
          DeleteOutline,
          EditOutline,
          ExclamationCircleFill,
          ToolOutline,
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Maintenance);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the equipment and maintenance list from the route equipment id', () => {
    component.ngOnInit();

    expect(component.equipmentId).toBe(7);
    expect(equipmentService.getAll).toHaveBeenCalled();
    expect(maintenanceService.getMaintenanceByEquipmentId).toHaveBeenCalledWith(7);
    expect(component.equipment?.name).toBe('Ultrasound');
    expect(component.loading).toBeFalse();
  });

  it('opens the schedule modal with a scheduled default status', () => {
    component.openScheduleModal();

    expect(component.isScheduleModalOpen).toBeTrue();
    expect(component.newMaintenance.status).toBe(MaintenanceStatus.SCHEDULED);
    expect(component.overlapError).toBeNull();
  });

  it('rejects scheduling when a maintenance overlap exists', () => {
    component.equipmentId = 7;
    component.equipment = {
      id: 7,
      name: 'Ultrasound',
      description: 'Portable device',
      status: 'AVAILABLE',
      conditionScore: 88,
      imageUrl: '',
    };
    component.newMaintenance = {
      maintenanceDate: new Date(2026, 11, 31),
      maintenanceTime: new Date(2026, 11, 31, 10, 0),
      completionDate: new Date(2026, 11, 31),
      completionTime: new Date(2026, 11, 31, 11, 0),
      description: 'Check filters',
      status: MaintenanceStatus.SCHEDULED,
    } as any;
    maintenanceService.checkAvailability.and.returnValue(
      of({ maintenanceTime: '2026-12-31T10:00:00', maintenanceCompletionTime: '2026-12-31T11:00:00' } as any),
    );

    component.scheduleMaintenance();

    expect(component.overlapError).toContain('already a scheduled maintenance');
    expect(maintenanceService.create).not.toHaveBeenCalled();
  });

  it('rejects scheduling when a reservation overlap exists', () => {
    component.equipmentId = 7;
    component.equipment = {
      id: 7,
      name: 'Ultrasound',
      description: 'Portable device',
      status: 'AVAILABLE',
      conditionScore: 88,
      imageUrl: '',
    };
    component.newMaintenance = {
      maintenanceDate: new Date(2026, 11, 31),
      maintenanceTime: new Date(2026, 11, 31, 10, 0),
      completionDate: new Date(2026, 11, 31),
      completionTime: new Date(2026, 11, 31, 11, 0),
      description: 'Check filters',
      status: MaintenanceStatus.SCHEDULED,
    } as any;
    maintenanceService.checkAvailability.and.returnValue(of(null));
    reservationService.checkAvailability.and.returnValue(
      of({ reservationDate: '2026-12-31T10:00:00', returnDate: '2026-12-31T11:00:00' } as any),
    );

    component.scheduleMaintenance();

    expect(component.overlapError).toContain('already reserved');
    expect(maintenanceService.create).not.toHaveBeenCalled();
  });

  it('creates a maintenance when there are no overlaps', () => {
    component.equipmentId = 7;
    component.equipment = {
      id: 7,
      name: 'Ultrasound',
      description: 'Portable device',
      status: 'AVAILABLE',
      conditionScore: 88,
      imageUrl: '',
    };
    component.newMaintenance = {
      maintenanceDate: new Date(2026, 11, 31),
      maintenanceTime: new Date(2026, 11, 31, 10, 0),
      completionDate: new Date(2026, 11, 31),
      completionTime: new Date(2026, 11, 31, 11, 0),
      description: 'Check filters',
      status: MaintenanceStatus.SCHEDULED,
    } as any;

    component.scheduleMaintenance();

    expect(maintenanceService.checkAvailability).toHaveBeenCalled();
    expect(reservationService.checkAvailability).toHaveBeenCalled();
    expect(maintenanceService.create).toHaveBeenCalled();
    const created = maintenanceService.create.calls.mostRecent().args[0] as any;
    expect(created.status).toBe(MaintenanceStatus.SCHEDULED);
    expect(component.isScheduleModalOpen).toBeFalse();
  });

  it('prefills edit modal state from a maintenance record', () => {
    component.openEditModal({
      id: 3,
      equipment: { id: 7, name: 'Ultrasound', description: '', status: 'AVAILABLE', conditionScore: 88, imageUrl: '' },
      maintenanceTime: '2026-12-31T10:00:00',
      maintenanceCompletionTime: '2026-12-31T11:00:00',
      description: 'Replace parts',
      status: MaintenanceStatus.IN_PROGRESS,
    } as any);

    expect(component.isEditModalOpen).toBeTrue();
    expect(component.maintenanceToEdit?.id).toBe(3);
    expect(component.editMaintenance.description).toBe('Replace parts');
    expect(component.editMaintenance.status).toBe(MaintenanceStatus.IN_PROGRESS);
  });
});
