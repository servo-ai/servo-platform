import { FormBotService } from "./formbot.service";
import { ActivatedRoute } from '@angular/router';
import { MessageModel } from "./message-model";

export class FormBotBaseState {
    protected routeBase: ActivatedRoute;
    protected formbotServiceBase: FormBotService;
    constructor(formbotSerice: FormBotService, route: ActivatedRoute) {
        this.formbotServiceBase = formbotSerice;
        this.routeBase = route;
    }

    onSubmit(intentId: string = "submit") {
        let msg = new MessageModel();
        msg.intentId = intentId;
        msg.originRoute = this.routeBase.routeConfig.path;
        this.formbotServiceBase.submit(msg);
    }
}