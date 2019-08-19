import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { HashStorage, Tea, NavigationUtils } from '../../../constants/globalfunctions';
import { DataService } from '../../../services/commonservice/data.service';
import { AuthService } from '../../../services/authservice/auth.service';
import { PlatformLocation } from '@angular/common';
import { GuestService } from '../../setup/jwt.injectable';

@Component({
  selector: 'app-confirm-logout-dialog',
  templateUrl: './confirm-logout-dialog.component.html',
  styleUrls: ['./confirm-logout-dialog.component.scss']
})
export class ConfirmLogoutDialogComponent implements OnInit {

  isRouting: boolean = false

  constructor(
    private _router: Router,
    private _activeModal: NgbActiveModal,
    private _dataService: DataService,
    private _authService: AuthService,
    private location: PlatformLocation,
    private _jwtService: GuestService
  ) {
    location.onPopState(() => this.closeModal());
  }

  ngOnInit() {
    this.isRouting = false
  }

  closeModal() {
    this._activeModal.close();
    document.getElementsByTagName('html')[0].style.overflowY = 'auto';

  }

  async onConfirmClick() {
    let loginData = JSON.parse(Tea.getItem('loginUser'))
    loginData.IsLogedOut = true
    HashStorage.removeItem('loginUser')
    Tea.setItem('loginUser', JSON.stringify(loginData))
    const logDate = new Date().toLocaleString().replace(/,/g, '')
    console.log(new Date().toLocaleString().replace(/,/g, ''))
    let data = {
      PrimaryEmail: loginData.PrimaryEmail,
      UserLoginID: loginData.UserLoginID,
      // SessionID: HashStorage.getItem('sessionId'),
      LogoutDate: logDate,
      LogoutRemarks: "",
    }
    this._dataService.reloadCurrencyConfig.next(true)

    try {
      await this._authService.userLogOut(data).toPromise()
    } catch (error) {
    }

    try {
      await this._jwtService.sessionRefresh('')
    } catch (error) {
    }

    this.isRouting = true
    this._router.navigate([NavigationUtils.GET_CURRENT_NAV()]).then(() => {
      // this._router.navigate(['home']).then(() => {
      this._dataService.reloadHeader.next(true)
      this.closeModal()
      document.getElementById('preloader2').classList.add('logout');
      this.isRouting = false
    })
  }


}
