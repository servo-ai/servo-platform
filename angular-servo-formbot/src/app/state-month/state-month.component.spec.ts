import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateMonthComponent } from './state-month.component';

describe('StateMonthComponent', () => {
  let component: StateMonthComponent;
  let fixture: ComponentFixture<StateMonthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StateMonthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
