import { Component, HostBinding } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { slideInDownAnimation } from './animations';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [slideInDownAnimation]
})
export class AppComponent {
  constructor(private router: Router) {
    this.router.navigateByUrl('/start');
  }
  title = 'formbot';
  prepareRoute(outlet: RouterOutlet) {
    console.log(outlet && outlet.isActivated && outlet.activatedRoute.routeConfig.path);
    return outlet && outlet.isActivated && outlet.activatedRoute.routeConfig.path;
  }
}
