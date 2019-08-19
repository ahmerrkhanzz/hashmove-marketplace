import { Injectable, } from '@angular/core';
import { Router, CanActivate, NavigationStart } from '@angular/router';
import { Tea, NavigationUtils } from '../constants/globalfunctions';
import { PreviousRouteService } from './commonservice/previous-route.service';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private _router: Router) { 
        
    }

    canActivate(): boolean {
        let userToken = Tea.getItem('loginUser');
        if (!userToken) {
            this._router.navigate([NavigationUtils.GET_CURRENT_NAV()]);
            return false;
        } else {
            let userData = JSON.parse(userToken)
            if (userData.IsLogedOut) {
                this._router.navigate([NavigationUtils.GET_CURRENT_NAV()]);
                return false;
            } else {
                return true
            }
        }
    }
}