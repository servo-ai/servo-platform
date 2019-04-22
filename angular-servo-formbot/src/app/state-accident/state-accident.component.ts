import { Component, OnInit } from '@angular/core';
import { FormBotService } from '../formbot.service';
import { FormBotBaseState } from '../formbot-base-state';
import { ActivatedRoute } from '@angular/router';
import { slideInDownAnimation } from '../animations';

@Component({
  selector: 'app-state-accident',
  templateUrl: './state-accident.component.html',
  styleUrls: ['./state-accident.component.scss'],
  animations: [slideInDownAnimation]
})
export class StateAccidentComponent extends FormBotBaseState implements OnInit {
  constructor(private formbotService: FormBotService, private route: ActivatedRoute) {
    super(formbotService, route);
  }
  ngOnInit() {
  }

}
