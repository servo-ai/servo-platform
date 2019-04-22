import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateStartComponent } from './state-start.component';

describe('StateStartComponent', () => {
  let component: StateStartComponent;
  let fixture: ComponentFixture<StateStartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StateStartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
