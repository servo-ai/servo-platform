import { animate, style, transition, trigger, query, state, animateChild, group } from '@angular/animations';
// Component transition animations
export const slideInDownAnimation =

    trigger('routeAnimations', [
        /*   state('*',
               style({
                   opacity: 1,
                   left: '0px',
                   position: 'relative'
               })
           ),
           transition(':enter', [// void==>*
               style({
                   opacity: 0.5,
                   left: "-700px", position: 'relative'
               }),
               animate('0.2s ease-in')
           ]),
           transition(':leave', [
               animate('0.5s ease-out', style({
                   opacity: 0.5,
                   left: "700px", position: 'relative'
               }))
           ])*/

        transition('* <=> *', [
            style({ position: 'relative' }),
            query(':leave', [
                style({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%'
                })
            ]),
            query(':enter', [
                style({
                    position: 'absolute',
                    top: '50%',
                    left: '1%',
                    right: '1%',
                    transform: 'translateY(500px)'
                })
            ]),
            query(':enter', [

                animate('600ms ease-out', style({ transform: 'translateY(0)' }))
            ]),
            query(':leave', animateChild()),
            group([
                query(':leave', [
                    animate('600ms ease-out', style({ transform: 'translateY(-100%)' }))
                ])
                ,
                query(':enter', [
                    style({ transform: 'translateY(100%)' }),
                    animate('600ms ease-out', style({ transform: 'translateY(0)' }))
                ])
            ]),
            query(':enter', animateChild()),
        ])
    ]);