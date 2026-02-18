import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Caregiver } from './caregiver';

describe('Caregiver', () => {
  let component: Caregiver;
  let fixture: ComponentFixture<Caregiver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Caregiver]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Caregiver);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
