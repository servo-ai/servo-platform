import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBotService } from '../formbot.service';
import { FormBotBaseState } from '../formbot-base-state';
import { slideInDownAnimation } from '../animations';
import { MessageModel } from "../message-model";

@Component({
  selector: 'app-state-car',
  templateUrl: './state-car.component.html',
  styleUrls: ['./state-car.component.scss'],
  animations: [slideInDownAnimation]
})
export class StateCarComponent extends FormBotBaseState implements OnInit {
  public manufacturer: string;
  public model: string;
  public year: string;
  constructor(private formbotService: FormBotService, private route: ActivatedRoute) {
    super(formbotService, route);
  }

  ngOnInit() {
  }

  onSubmit(intentId: string = "submit") {
    let msg = new MessageModel();
    msg.intentId = intentId;
    msg.addEntity({ name: "manufacturer", value: this.manufacturer });
    msg.addEntity({ name: "model", value: this.model });
    msg.addEntity({ name: "year", value: this.year });
    msg.originRoute = this.routeBase.routeConfig.path;
    this.formbotServiceBase.submit(msg);
  }

}
