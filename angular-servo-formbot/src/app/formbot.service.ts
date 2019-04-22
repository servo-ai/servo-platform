import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { MessageModel } from './message-model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormBotService {
  _userId: string;
  url: string;
  payload: any;
  constructor(private http: Http, private router: Router) {
    this._userId = "user-" + Math.random() * 1000;
    this.url = "http://3.122.124.201:3000/entry/formbot/anonymous/formbot-demo";
  }

  get userId() {
    return this._userId;
  }

  set userId(val) {
    this._userId = val;
  }

  submit(message: MessageModel) {

    message.userId = this.userId;
    message.addEntity({ name: 'intentId', value: message.intentId });
    this.http.post(this.url, message).subscribe(
      (resp) => {
        console.log("POST call successful value returned in body",
          resp);
        let response1 = JSON.parse(resp["_body"]);

        // this would be probably a misunderstood post. check OUTGOING payload since the server didnt understand it
        if (response1.text) {
          alert(response1.text);
        } else {
          //this.subject.next(response1.payload)
          let responseObj = this.payload = JSON.parse(response1.payload);
          let gotoRoute = responseObj.route.startsWith('/') ? responseObj.route : "/" + responseObj.route;
          this.router.navigateByUrl(gotoRoute).then(() => {
            console.log('route changed');
          });
        }

      },
      response => {
        console.log("POST call in error", response);
      },
      () => {
        console.log("The POST observable is now completed.");
      });
  }

  // onResponse() {
  //   return new Promise((resolve) => {
  //     this.subject.subscribe((payload) => {
  //       resolve(payload);
  //     })
  //   });
  // }
}

