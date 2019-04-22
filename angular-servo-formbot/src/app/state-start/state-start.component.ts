import { Component, OnInit, HostBinding, HostListener } from '@angular/core';
import { FormBotService } from '../formbot.service';
import { MessageModel } from '../message-model';
import { FormBotBaseState } from '../formbot-base-state';
import { ActivatedRoute } from '@angular/router';
import { slideInDownAnimation } from '../animations';
@Component({
  selector: 'app-state-start',
  templateUrl: './state-start.component.html',
  styleUrls: ['./state-start.component.scss'],
  animations: [slideInDownAnimation]
})
export class StateStartComponent extends FormBotBaseState implements OnInit {
  constructor(private formbotService: FormBotService, private route: ActivatedRoute) {
    super(formbotService, route);
  }
  submitted = false;

  onSubmit() {
    this.submitted = true;
    let msg = new MessageModel();
    msg.intentId = 'start';
    msg.originRoute = 'start';
    this.formbotService.submit(msg);
  }
  ngOnInit() {
  }

}
