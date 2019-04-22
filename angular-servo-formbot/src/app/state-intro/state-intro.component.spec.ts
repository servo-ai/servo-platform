import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateIntroComponent } from './state-intro.component';

describe('StateIntroComponent', () => {
  let component: StateIntroComponent;
  let fixture: ComponentFixture<StateIntroComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StateIntroComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateIntroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
