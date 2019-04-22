import { Component, OnInit } from '@angular/core';
import { FormBotService } from '../formbot.service';
import { MessageModel } from '../message-model';

@Component({
  selector: 'app-state-step2',
  templateUrl: './state-step2.component.html',
  styleUrls: ['./state-step2.component.scss']
})
export class StateStep2Component implements OnInit {
  balance: string;
  wireAmount: string;
  constructor(private formbotService: FormBotService) {
    this.balance = JSON.stringify(formbotService.payload.balance);
  }

  ngOnInit() {
  }

  submitted = false;

  onSubmit() {
    this.submitted = true;
    let msg = new MessageModel();
    msg.originRoute = 'step2';
    msg.addEntity({ name: 'wireAmount', value: this.balance });
    msg.raw = ({ action: 'wireAmount', amount: this.balance })
    this.formbotService.submit(msg);
  }

}
