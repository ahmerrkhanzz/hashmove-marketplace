import { Injectable } from "@angular/core";
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { getDefaultCountryCode, HashStorage, Tea, isUserLogin, loading, encryptStringAES, AESModel, decryptStringAES, NavigationUtils } from "../../constants/globalfunctions";
import { AuthService, JWTObj } from "../../services/authservice/auth.service";
import { getJwtToken } from "../../constants/auth";
import * as moment from 'moment';
import { AppComponent } from "../../app.component";
import { setBaseApi, setBaseExternal } from "../../constants/base.url";
import { Router } from "@angular/router";
import { DataService } from "../../services/commonservice/data.service";


@Injectable()
export class GuestService {

  private token: string = ''
  private refreshToken: string = ''
  private rightObj: string = ''
  private origin: string = ''
  private countryCode = getDefaultCountryCode()
  guestObject = {
    password: 'h@shMove123',
    loginUserID: 'support@hashmove.com',
    CountryCode: (this.countryCode) ? this.countryCode : 'DEFAULT AE',
    LoginIpAddress: "0.0.0.0",
    LoginDate: moment(Date.now()).format(),
    LoginRemarks: ""
  }

  constructor(
    private _authService: AuthService,
    private _http: HttpClient,
    private _dataService: DataService
  ) { }


  public getToken() { return this.token }
  public getLclRefreshToken() { return this.refreshToken }

  public setToken($token) { this.token = $token }
  public setRefreshToken($refreshToken) { this.refreshToken = $refreshToken }
  public setRightObj($rightObj) { this.rightObj = $rightObj }
  public setOrigin($origin) { this.origin = $origin }


  getJwtToken() {
    let token
    if (HashStorage.getItem('token')) {
      token = HashStorage.getItem('token')
    } else {
      token = this.getToken()
    }
    return token
  }

  saveJwtToken($token) {
    this.setToken($token)
    setTimeout(() => {
      HashStorage.setItem('token', $token);
    }, 0);
  }

  saveRefreshToken($refreshToken) {
    this.setRefreshToken($refreshToken)
    setTimeout(() => {
      HashStorage.setItem('refreshToken', $refreshToken);
    }, 0);
  }

  saveJwtRightsObj($obj) {
    this.setRightObj($obj)
    setTimeout(() => {
      HashStorage.setItem('objectRights', $obj);
    }, 0);
  }

  saveJwtOrigin($obj) {
    this.setOrigin($obj)
    setTimeout(() => {
      HashStorage.setItem('jwtOrigin', $obj);
    }, 0);
  }

  getRefreshToken() {
    let refreshToken
    if (HashStorage.getItem('refreshToken')) {
      refreshToken = HashStorage.getItem('refreshToken')
    } else {
      refreshToken = this.getLclRefreshToken()
    }
    return refreshToken
  }

  removeTokens() {
    HashStorage.removeItem('token')
    HashStorage.removeItem('refreshToken')
    this.setToken(null)
    this.setRefreshToken(null)
  }


  async load(d3) {
    // AppComponent.clearStorage()
    const _config: AppApiConfig = await this._http.get('assets/app.settings.json').toPromise() as any
    const { MAIN_API_BASE_URL, MAIN_API_BASE_EXTERNAL_URL, ISLOCK_SCREEN } = _config
    HashStorage.setItem('showLockScreen', JSON.stringify(ISLOCK_SCREEN))
    setBaseApi(MAIN_API_BASE_URL);
    setBaseExternal(MAIN_API_BASE_EXTERNAL_URL)

    try {
      const _marketConfig = await this._authService.getMarketConfig().toPromise() as any
      const { returnId, returnObject } = _marketConfig
      if (returnId > 0) {
        NavigationUtils.SET_MARKET_CONFIG(returnObject.isMarketPlaceReleased)
      }
    } catch (error) {
    }
    try {
      const urls: Array<string> = location.pathname.split('/');
      // NavigationUtils.GET_CURRENT_NAV()
      if ((urls.includes('home') || (!urls[1] || urls.length === 0)) && NavigationUtils.IS_MARKET_ONLINE()) {
        NavigationUtils.SET_CURRENT_NAV('home')
      } else if (NavigationUtils.GET_CURRENT_NAV() && NavigationUtils.GET_CURRENT_NAV().toLowerCase().includes('partner')) {
        if (urls.includes('partner')) {
          NavigationUtils.SET_CURRENT_NAV(urls[1] + '/' + urls[2])
        }
      } else {
        if (urls.length > 1 && urls[1]) {
          const url = urls[1]
          if (url.includes('partner') && !NavigationUtils.IS_MARKET_ONLINE()) {
            NavigationUtils.SET_CURRENT_NAV(urls[1] + '/' + urls[2])
          } else if (url.includes('home') && NavigationUtils.IS_MARKET_ONLINE()) {
            NavigationUtils.SET_CURRENT_NAV('home')
          } else if (NavigationUtils.IS_MARKET_ONLINE()) {
            NavigationUtils.SET_CURRENT_NAV('home')
          } else {
            NavigationUtils.SET_CURRENT_NAV('not-found')
          }
        } else {
          NavigationUtils.SET_CURRENT_NAV('not-found')
        }
      }
    } catch (error) {
    }

    if (!getJwtToken() || !isUserLogin()) {
      this.countryCode = getDefaultCountryCode()
      const { guestObject } = this
      guestObject.CountryCode = this.countryCode
      const encObjectL: AESModel = encryptStringAES({ d1: moment(Date.now()).format().substring(0, 16), d2: JSON.stringify(guestObject), d3: (d3) ? d3 : '' })

      return new Promise((resolve, reject) => {
        this._authService.guestLoginService(encObjectL).toPromise().then((response: AESModel) => {

          const decryptedData = decryptStringAES(response)
          const { token, refreshToken, reqOrigin } = JSON.parse(decryptedData);
          this.token = token;
          this.refreshToken = refreshToken;
          this.origin = reqOrigin;
          setTimeout(() => {
            this.saveJwtToken(token);
            this.saveRefreshToken(refreshToken);
            this.saveJwtOrigin(reqOrigin)
          }, 0);
          resolve();
        }).catch((err) => {
          resolve();
        })
      })
    }
  }


  generateToken() {

  }

  async sessionRefresh(d3) {
    return new Promise(async (resolve, reject) => {
      try {
        this._dataService.setDashboardData(null)
      } catch (error) {
      }
      // this._authService.logoutAction()
      this.removeTokens();
      this.countryCode = getDefaultCountryCode();
      const { guestObject } = this;
      guestObject.CountryCode = this.countryCode;
      const encObjectL: AESModel = encryptStringAES({ d1: moment(Date.now()).format().substring(0, 16), d2: JSON.stringify(guestObject), d3: (d3) ? d3 : '' })
      try {
        const response: AESModel = await this._authService.guestLoginService(encObjectL).toPromise() as any
        const decryptedData = decryptStringAES(response)
        const { token, refreshToken, objectRights, reqOrigin } = JSON.parse(decryptedData);
        this.token = token;
        this.refreshToken = refreshToken;
        this.rightObj = objectRights;
        this.origin = reqOrigin;
        setTimeout(() => {
          this.saveJwtToken(token);
          this.saveRefreshToken(refreshToken);
          this.saveJwtRightsObj(objectRights)
          this.saveJwtOrigin(reqOrigin)
          loading(false)
          resolve()
        }, 0);
      } catch (error) {
        loading(false)
        resolve()
      }
    })

  }

  setJWTByApi(response: JWTObj) {
    const { token, refreshToken } = response;
    this.token = token;
    this.refreshToken = refreshToken;
    this.saveJwtToken(token);
    this.saveRefreshToken(refreshToken);
  }
}

export interface AppApiConfig {
  MAIN_API_BASE_URL: string
  MAIN_API_BASE_EXTERNAL_URL: string,
  ISLOCK_SCREEN: boolean
}
