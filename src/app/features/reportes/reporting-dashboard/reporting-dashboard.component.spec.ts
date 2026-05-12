import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReportingDashboardComponent } from './reporting-dashboard.component';

describe('ReportingDashboardComponent', () => {
  let component: ReportingDashboardComponent;
  let fixture: ComponentFixture<ReportingDashboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReportingDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportingDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
