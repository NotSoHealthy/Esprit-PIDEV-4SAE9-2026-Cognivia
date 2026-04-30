import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TasksPage } from './tasks.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

// Import des services et modèles
import { TaskService } from '../../core/api/task.service';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { Task, TaskSubmission } from '../../core/api/models/task.model';

describe('TasksPage', () => {
  let component: TasksPage;
  let fixture: ComponentFixture<TasksPage>;

  // Spies pour les services
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let keycloakSpy: jasmine.SpyObj<KeycloakService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockTasks: Task[] = [
    { 
      id: 1, 
      task: 'Prendre médicament', 
      taskType: 'MEDICATION', 
      isDone: false, 
      patientId: 101, 
      userId: 1, // ✅ Ajouté ici
      dueAt: '2026-04-16T14:00:00' 
    },
    { 
      id: 2, 
      task: 'Exercice physique', 
      taskType: 'EXERCISE', 
      isDone: true, 
      patientId: 101, 
      userId: 1, // ✅ Ajouté ici
      dueAt: '2026-04-16T10:00:00' 
    }
  ];

  const mockPatients = [
    { id: 101, firstName: 'Jean', lastName: 'Patient', roomNumber: '10A' }
  ];

  const mockSubmission: TaskSubmission = {
    id: 1,
    taskId: 1,
    patientId: 101,
    description: 'Fait avec succès',
    validationStatus: 'pending',
    submittedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getPatients', 'getPatientByUserId', 'getCaregiverByUserId', 'getDoctorByUserId',
      'getAll', 'getByPatient', 'update', 'delete', 'markDone', 'submitTask', 
      'getSubmissions', 'validateSubmission', 'deleteSubmission'
    ]);
    keycloakSpy = jasmine.createSpyObj('KeycloakService', ['getUserRole', 'getUserId']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Configuration des retours par défaut
    taskServiceSpy.getAll.and.returnValue(of(mockTasks));
    taskServiceSpy.getPatients.and.returnValue(of(mockPatients));
    keycloakSpy.getUserId.and.returnValue('abc-123');

    await TestBed.configureTestingModule({
      imports: [TasksPage, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksPage);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization and Roles', () => {
    it('should configure view for ROLE_PATIENT', fakeAsync(() => {
      keycloakSpy.getUserRole.and.returnValue('ROLE_PATIENT');
      taskServiceSpy.getPatientByUserId.and.returnValue(of({ id: 101 }));
      taskServiceSpy.getByPatient.and.returnValue(of(mockTasks));

      fixture.detectChanges(); // ngOnInit + load()
      tick();

      expect(component.isPatient).toBeTrue();
      expect(taskServiceSpy.getPatientByUserId).toHaveBeenCalled();
      expect(component.tasks.length).toBe(2);
    }));

    it('should configure view for ROLE_CAREGIVER and load patients', fakeAsync(() => {
      keycloakSpy.getUserRole.and.returnValue('ROLE_CAREGIVER');
      taskServiceSpy.getCaregiverByUserId.and.returnValue(of({ id: 50 }));

      fixture.detectChanges();
      tick();

      expect(component.isCaregiverOrDoctor).toBeTrue();
      expect(taskServiceSpy.getPatients).toHaveBeenCalled();
      expect(component.patients.length).toBe(1);
    }));
  });

  describe('Task Filtering and Search', () => {
    beforeEach(fakeAsync(() => {
      keycloakSpy.getUserRole.and.returnValue('ROLE_ADMIN');
      fixture.detectChanges();
      tick();
    }));

    it('should filter tasks by patient when selected', () => {
      component.tasks = [...mockTasks];
      component.selectPatient(101);
      expect(component.filteredTasks.length).toBe(2);

      component.selectPatient(999); // Patient inconnu
      expect(component.filteredTasks.length).toBe(0);
    });

    it('should filter tasks by search query', () => {
      component.searchQuery = 'médicament';
      expect(component.filteredTasks.length).toBe(1);
      expect(component.filteredTasks[0].task).toContain('médicament');
    });
  });

  describe('Task Submissions (Patient)', () => {
    it('should submit a task with photo evidence', fakeAsync(() => {
      component.isPatient = true;
      component.currentUserId = 101;
      component.selectedTask = mockTasks[0];
      component.submissionForm = {
        description: 'J\'ai pris ma pilule',
        picturePreview: 'data:image/png;base64,fake-data'
      };

      taskServiceSpy.submitTask.and.returnValue(of(mockSubmission));
      taskServiceSpy.getSubmissions.and.returnValue(of([mockSubmission]));

      component.submitTaskWork();
      tick();

      expect(taskServiceSpy.submitTask).toHaveBeenCalled();
      expect(component.showSubmissionForm).toBeFalse();
    }));

    it('should alert if photo is missing during submission', () => {
      spyOn(window, 'alert');
      component.submissionForm.picturePreview = '';
      component.submitTaskWork();
      expect(window.alert).toHaveBeenCalledWith('Please select a photo');
    });
  });

  describe('Validations (Staff)', () => {
    it('should approve a submission and mark task as done', fakeAsync(() => {
      component.isCaregiverOrDoctor = true;
      component.currentUserId = 50;
      component.selectedTask = { ...mockTasks[0] };

      taskServiceSpy.validateSubmission.and.returnValue(of({ ...mockSubmission, validationStatus: 'approved' }));
      taskServiceSpy.markDone.and.returnValue(of({ ...mockTasks[0], isDone: true }));
      taskServiceSpy.getSubmissions.and.returnValue(of([]));

      component.approveSubmission(1, 'Bien joué');
      tick();

      expect(taskServiceSpy.validateSubmission).toHaveBeenCalled();
      expect(taskServiceSpy.markDone).toHaveBeenCalledWith(mockTasks[0].id!, true);
    }));
  });

  describe('Navigation', () => {
    it('should navigate to create page', () => {
      component.isCaregiverOrDoctor = true;
      component.selectedPatientId = 101;
      component.goCreate();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/tasks/create'], { queryParams: { patientId: 101 } });
    });

    it('should navigate to history page', () => {
      const task = mockTasks[0];
      component.viewHistory(task);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/tasks', task.id, 'history'], jasmine.any(Object));
    });
  });

  describe('Helper Methods', () => {
    it('should return correct badge class for task types', () => {
      expect(component.badgeClass('MEDICATION')).toBe('badge-medication');
      expect(component.badgeClass('EXERCISE')).toBe('badge-exercise');
      expect(component.badgeClass('UNKNOWN')).toBe('badge-general');
    });

    it('should calculate task stats correctly', () => {
      component.tasks = [...mockTasks]; // 1 done, 1 not done
      expect(component.totalTasks).toBe(2);
      expect(component.inProgressTasks).toBe(1);
      expect(component.completedTasks).toBe(1);
    });
  });
});