import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminReportedPosts } from './admin-reported-posts';

describe('AdminReportedPosts', () => {
  let component: AdminReportedPosts;
  let fixture: ComponentFixture<AdminReportedPosts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReportedPosts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminReportedPosts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
