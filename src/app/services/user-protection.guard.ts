import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Tea, HashStorage } from '../constants/globalfunctions';

@Injectable()
export class UserProtectionGuard implements CanActivate {
  public showLockScreen: boolean = false
  constructor(public _router: Router) {
    this.showLockScreen = JSON.parse(HashStorage.getItem('showLockScreen'))
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (localStorage.length) {
      var protectorUser = JSON.parse(Tea.getItem('protectorUserlogIn'));
      if (protectorUser) {
        return true;
      }
      else if (!protectorUser && this.showLockScreen) {
        if (location.search.indexOf('login') > -1 || location.search.indexOf('code') > -1) {
          return true;
        }
        else {
          if (location.href.includes('partner') || location.href.includes('admin')) {
            localStorage.setItem('partnerURL', location.href)
          }
          this._router.navigate(['lock-screen']);
          return false;
        }
      }
      else {
        return true;
      }

    }
    //  || environment.alphaLive || environment.betaLive
    else if (!protectorUser && this.showLockScreen) {
      if (location.search.indexOf('login') > -1 || location.search.indexOf('code') > -1) {
        return true;
      }
      else {
        if (location.href.includes('partner') || location.href.includes('admin')) {
          localStorage.setItem('partnerURL', location.href)
        }
        this._router.navigate(['lock-screen']);
        return false;
      }
    }
    else {
      return true;
    }
  }
}
