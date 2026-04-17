import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  CalendarOutline,
  DeleteOutline,
  EditOutline,
  FileSearchOutline,
  IdcardOutline,
  MoreOutline,
  SelectOutline,
  UnorderedListOutline,
  BookOutline,
} from '@ant-design/icons-angular/icons';

import { Equipment } from './equipment';
import { EquipmentService } from './services/equipment-service';
import { MaintenanceService } from './maintenance/services/maintenance.service';
import { ReservationService } from './reservation/services/reservation.service';

describe('Equipment', () => {
  let component: Equipment;
  let fixture: ComponentFixture<Equipment>;
  let equipmentService: jasmine.SpyObj<EquipmentService>;
  let maintenanceService: jasmine.SpyObj<MaintenanceService>;
  let reservationService: jasmine.SpyObj<ReservationService>;

  beforeEach(async () => {
    equipmentService = jasmine.createSpyObj<EquipmentService>('EquipmentService', [
      'getAll',
      'create',
      'update',
      'delete',
      'uploadImage',
      'extractEquipmentFromText',
      'getEquipmentParts',
      'createEquipmentPart',
      'updateEquipmentPart',
      'deleteEquipmentPart',
    ]);
    maintenanceService = jasmine.createSpyObj<MaintenanceService>('MaintenanceService', [
      'getClosestMaintenance',
    ]);
    reservationService = jasmine.createSpyObj<ReservationService>('ReservationService', [
      'getClosestReservation',
    ]);

    await TestBed.configureTestingModule({
      imports: [Equipment],
      providers: [
        { provide: EquipmentService, useValue: equipmentService },
        { provide: MaintenanceService, useValue: maintenanceService },
        { provide: ReservationService, useValue: reservationService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        provideNzIcons([
          IdcardOutline,
          UnorderedListOutline,
          MoreOutline,
          EditOutline,
          DeleteOutline,
          FileSearchOutline,
          SelectOutline,
          CalendarOutline,
          BookOutline,
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Equipment);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads equipments and fetches closest maintenance or reservation when needed', () => {
    equipmentService.getAll.and.returnValue(
      of([
        { id: 1, name: 'Bed', description: '', status: 'MAINTENANCE', conditionScore: 50, imageUrl: '' },
        { id: 2, name: 'Monitor', description: '', status: 'RESERVED', conditionScore: 80, imageUrl: '' },
        { id: 3, name: 'Chair', description: '', status: 'AVAILABLE', conditionScore: 90, imageUrl: '' },
      ]),
    );
    maintenanceService.getClosestMaintenance.and.returnValue(of({ id: 11 } as any));
    reservationService.getClosestReservation.and.returnValue(of({ id: 22 } as any));

    component.selectedIds.add(99);
    component.loadEquipments();

    expect(component.equipments.length).toBe(3);
    expect(component.selectedIds.size).toBe(0);
    expect(maintenanceService.getClosestMaintenance).toHaveBeenCalledWith(1);
    expect(reservationService.getClosestReservation).toHaveBeenCalledWith(2);
    expect(component.closestMaintenanceMap.get(1)).toEqual({ id: 11 } as any);
    expect(component.closestReservationMap.get(2)).toEqual({ id: 22 } as any);
  });

  it('prefills the edit modal from the selected equipment', () => {
    component.openEditModal({
      id: 7,
      name: 'Wheelchair',
      description: 'Lightweight',
      status: 'RESERVED',
      conditionScore: 77,
      imageUrl: 'image.png',
    });

    expect(component.isEditMode).toBeTrue();
    expect(component.editingEquipmentId).toBe(7);
    expect(component.newEquipment).toEqual({
      name: 'Wheelchair',
      description: 'Lightweight',
      status: 'RESERVED',
      conditionScore: 77,
      imageUrl: 'image.png',
    });
    expect(component.imagePreview).toBe('image.png');
    expect(component.isModalOpen).toBeTrue();
  });

  it('rejects add mode submission without an image', () => {
    component.openModal();
    component.newEquipment = {
      name: 'Pump',
      description: 'Infusion pump',
      status: 'AVAILABLE',
      conditionScore: 92,
      imageUrl: '',
    };

    component.submitEquipment();

    expect(component.formError).toBe('Please select an image for the equipment.');
    expect(equipmentService.create).not.toHaveBeenCalled();
  });

  it('creates equipment with an uploaded image in add mode', () => {
    const file = new File(['image'], 'pump.png', { type: 'image/png' });
    equipmentService.uploadImage.and.returnValue(of('https://cdn.example/image.png'));
    equipmentService.create.and.returnValue(of({ id: 10 } as any));
    equipmentService.getAll.and.returnValue(of([]));

    component.openModal();
    component.selectedImage = file;
    component.newEquipment = {
      name: 'Pump',
      description: 'Infusion pump',
      status: 'MAINTENANCE',
      conditionScore: 92,
      imageUrl: '',
    };

    component.submitEquipment();

    expect(equipmentService.uploadImage).toHaveBeenCalledWith(file);
    expect(equipmentService.create).toHaveBeenCalledWith({
      name: 'Pump',
      description: 'Infusion pump',
      status: 'AVAILABLE',
      conditionScore: 92,
      imageUrl: 'https://cdn.example/image.png',
    });
  });

  it('updates equipment without reuploading the image when editing', () => {
    equipmentService.update.and.returnValue(of({ id: 7 } as any));
    equipmentService.getAll.and.returnValue(of([]));

    component.isEditMode = true;
    component.editingEquipmentId = 7;
    component.newEquipment = {
      name: 'Wheelchair',
      description: 'Updated',
      status: 'RESERVED',
      conditionScore: 65,
      imageUrl: 'existing.png',
    };

    component.submitEquipment();

    expect(equipmentService.uploadImage).not.toHaveBeenCalled();
    expect(equipmentService.update).toHaveBeenCalledWith({
      id: 7,
      name: 'Wheelchair',
      description: 'Updated',
      status: 'RESERVED',
      conditionScore: 65,
      imageUrl: 'existing.png',
    });
  });
});
