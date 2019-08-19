import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { DataService } from './commonservice/data.service';
import {  NavigationUtils } from '../constants/globalfunctions';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class MarketGuard implements CanActivate {
  constructor(
    private _router: Router,
    private _dataService: DataService
  ) { }

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    try {
      if (NavigationUtils.IS_MARKET_ONLINE()) {
        return true
      } else {
        this.navigateAction('not-found');
        return false;
      }
    } catch (error) {
      this.navigateAction('not-found');
      return false;
    }
  }

  navigateAction($url: string) {
    this._router.navigate([$url])
  }
}
