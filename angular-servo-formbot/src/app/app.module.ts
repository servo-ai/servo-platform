import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StateIntroComponent } from './state-intro/state-intro.component';
import { StateStep1Component } from './state-step1/state-step1.component';
import { StateStep2Component } from './state-step2/state-step2.component';
import { HttpModule } from '@angular/http';
import { StateStartComponent } from './state-start/state-start.component';
import { FormsModule } from '@angular/forms';
import { StateMonthComponent } from './state-month/state-month.component';
import { StateAgeComponent } from './state-age/state-age.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StateYearsComponent } from './state-years/state-years.component';
import { StateAccidentComponent } from './state-accident/state-accident.component';
import { StateDenyComponent } from './state-deny/state-deny.component';
import { FormEditorComponent } from './form-editor/form-editor.component';
import { StateCarComponent } from './state-car/state-car.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbdTypeaheadFocusComponent } from './ngbd-typeahead-focus/ngbd-typeahead-focus.component';
@NgModule({
  imports: [
    BrowserModule, FormsModule, NgbModule,
    AppRoutingModule, HttpModule, RouterModule, BrowserAnimationsModule
  ], declarations: [
    AppComponent,
    StateIntroComponent,
    StateStep1Component,
    StateStep2Component,
    StateStartComponent,
    StateMonthComponent,
    StateAgeComponent,
    StateYearsComponent,
    StateAccidentComponent,
    StateDenyComponent,
    FormEditorComponent,
    StateCarComponent,
    NgbdTypeaheadFocusComponent
  ],

  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
