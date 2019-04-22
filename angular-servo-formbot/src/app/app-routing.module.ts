import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { StateAgeComponent } from './state-age/state-age.component';
import { StateStep1Component } from './state-step1/state-step1.component';
import { StateStep2Component } from './state-step2/state-step2.component';
import { StateStartComponent } from './state-start/state-start.component';
import { StateMonthComponent } from './state-month/state-month.component';
import { StateYearsComponent } from './state-years/state-years.component';
import { StateDenyComponent } from './state-deny/state-deny.component';
import { StateAccidentComponent } from './state-accident/state-accident.component';
import { StateCarComponent } from './state-car/state-car.component';

const routes: Routes = [{
  path: 'age',
  component: StateAgeComponent
}, {
  path: 'years',
  component: StateYearsComponent
}, {
  path: 'deny',
  component: StateDenyComponent
}, {
  path: 'accident',
  component: StateAccidentComponent
}, {
  path: 'step1',
  component: StateStep1Component
}, {
  path: 'car',
  component: StateCarComponent
}, {
  path: 'month',
  component: StateMonthComponent
}, {
  path: 'step2',
  component: StateStep2Component
}, {
  path: 'start',
  component: StateStartComponent
}, {
  path: '',
  redirectTo: '/start',
  pathMatch: 'full'
}];

@NgModule({
  imports: [RouterModule.forRoot(routes), BrowserAnimationsModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
