import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateStep1Component } from './state-step1.component';

describe('StateStep1Component', () => {
  let component: StateStep1Component;
  let fixture: ComponentFixture<StateStep1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StateStep1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
