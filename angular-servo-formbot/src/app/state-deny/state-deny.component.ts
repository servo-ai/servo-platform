import { Component, OnInit } from '@angular/core';
import { slideInDownAnimation } from '../animations';
import { FormBotService } from '../formbot.service';
import { FormBotBaseState } from '../formbot-base-state';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-state-deny',
  templateUrl: './state-deny.component.html',
  styleUrls: ['./state-deny.component.scss'],
  animations: [slideInDownAnimation]
})
export class StateDenyComponent extends FormBotBaseState implements OnInit {
  constructor(private formbotService: FormBotService, private route: ActivatedRoute) {
    super(formbotService, route);
  }

  ngOnInit() {
  }

}
