import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateStep2Component } from './state-step2.component';

describe('StateStep2Component', () => {
  let component: StateStep2Component;
  let fixture: ComponentFixture<StateStep2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StateStep2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
