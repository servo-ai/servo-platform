import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBotService } from '../formbot.service';
import { FormBotBaseState } from '../formbot-base-state';
import { slideInDownAnimation } from '../animations';

@Component({
  selector: 'app-state-years',
  templateUrl: './state-years.component.html',
  styleUrls: ['./state-years.component.scss'],
  animations: [slideInDownAnimation]
})
export class StateYearsComponent extends FormBotBaseState implements OnInit {
  constructor(private formbotService: FormBotService, private route: ActivatedRoute) {
    super(formbotService, route);
  }

  ngOnInit() {
  }

}
