import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBotService } from '../formbot.service';
import { FormBotBaseState } from '../formbot-base-state';

import { MessageModel } from '../message-model';
@Component({
  selector: 'app-state-intro',
  templateUrl: './state-intro.component.html',
  styleUrls: ['./state-intro.component.scss']
})
export class StateIntroComponent extends FormBotBaseState implements OnInit {
  visitReason = [{ reasonId: "step1", text: "Go to step 1" }, { reasonId: "step2", text: "Wire Transfer" }];
  selectedValue: any;
  constructor(private formbotService: FormBotService, private route: ActivatedRoute) {
    super(formbotService, route);
  }
  submitted = false;

  onSubmit() {
    this.submitted = true;
    let msg = new MessageModel();
    msg.originRoute = 'intro';
    msg.intentId = "continue";
    msg.addEntity({ name: 'visitReason', value: this.selectedValue.reasonId });
    msg.raw = ({ action: 'wireAmount', amount: 1211 })

    this.formbotService.submit(msg);
  }

  ngOnInit() {
  }

}
