import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  AfterViewInit
} from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DropDownService } from "./services/dropdownservice/dropdown.service";
import {
  setDefaultCountryCode,
  HashStorage,
  Tea,
  decryptStringAES,
  encryptStringAES,
  AESModel,
  removeDuplicateCurrencies,
  compareValues,
  NavigationUtils
} from "./constants/globalfunctions";
import { HttpErrorResponse } from "@angular/common/http";
import { Router, NavigationEnd } from "@angular/router";
import { NgScrollbar } from "ngx-scrollbar";
import { CurrencyDetails, Rate } from "./interfaces/currencyDetails";
import { DataService } from "./services/commonservice/data.service";
import "../assets/scss/_loader.css";
import { VERSION } from "../environments/version";
import { AuthService, JWTObj } from "./services/authservice/auth.service";
import { CurrencyControl } from "./shared/currency/currency.injectable";
import { SetupService } from "./shared/setup/setup.injectable";
import * as moment from "moment";
import browser from "browser-detect";
import { CookieService } from "./services/cookies.injectable";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(NgScrollbar) scrollRef: NgScrollbar;
  static SCROLL_REF_MAIN: any;
  public static version = VERSION;
  public currencyList = [];
  public themeWrapper = document.querySelector("body");
  public customerSettings: any;

  constructor(
    private _toast: ToastrService,
    private _router: Router,
    private _dropDownService: DropDownService,
    private _dataService: DataService,
    private _authService: AuthService,
    private _currencyControl: CurrencyControl,
    private _setup: SetupService, // private _guestLogin: GuestService
    private _cookieService:CookieService
  ) {}

  async ngOnInit() {
    // this.defaultUser()
    // this.check()
    // this.aesDebug()
    // if (!NavigationUtils.GET_CURRENT_NAV()) {
    //   NavigationUtils.SET_CURRENT_NAV(this._router.url)
    // }
    this.browserDetection();
    let userData = JSON.parse(Tea.getItem("loginUser"));

    if ((userData && userData.IsLogedOut) || !userData) {
      document.getElementById("preloader2").classList.add("logout");
    }
    localStorage.removeItem("protectorUserlogIn");
    HashStorage.removeItem("tempSearchCriteria");

    // if (result.name === "firefox") {
    // } else {
    //   browserClass.classList.remove("Firefox");
    // }
    this.clearStorage()
    this.setCustomerSettings();

    try {
      const res = await this._dropDownService.getBaseCurrency().toPromise();
      this.setbaseCurrency(res);
    } catch (error) { }

    try {
      await this.setCurrencyList();
    } catch (error) { }

    this._dataService.reloadCurrencyConfig.subscribe(res => {
      if (res) {
        this.setCurrencyConfig();
      }
    });

    try {
      this.setCurrencyConfig();
    } catch (error) { }

    this._router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        if (this.scrollRef) {
          this.scrollRef.scrollYTo(0, 20);
        }
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      AppComponent.SCROLL_REF_MAIN = this.scrollRef;
    }, 0);
  }


  browserDetection() {
    let result = browser();
    console.log(result);
    let browserClass = document.querySelector("body");

    if (result.name === "firefox") {
      browserClass.classList.add("Firefox");
    } else if (result.name === "chrome") {
      browserClass.classList.add("Chrome");
    } else if (result.name === "safari") {
      browserClass.classList.add("safari");
    } else {
      // do something
    }
  }

  setCurrencyConfig() {
    this._dropDownService.getBrowserLocation().subscribe(
      (res: any) => {
        if (res) {
          setDefaultCountryCode(res.countryCode);
          localStorage.setItem("country", res.country);
        } else {
          localStorage.setItem("country", 'Pakistan');
        }
        this._setup.setBaseCurrencyConfig();
      },
      (error: HttpErrorResponse) => {
        localStorage.setItem("country", 'Pakistan');
        this._setup.setBaseCurrencyConfig();
      }
    );
  }

  setbaseCurrency(res) {
    if (res) {
      this._currencyControl.setBaseCurrencyID(parseInt(res.CurrencyID));
      this._currencyControl.setBaseCurrencyCode(res.CurrencyCode);
    } else {
    }
  }

  async setCurrencyList() {
    try {
      const res: any = await this._dropDownService.getCurrency().toPromise();
      let currencyList = res;
      currencyList = removeDuplicateCurrencies(currencyList);
      currencyList.sort(compareValues("title", "asc"));
      this.currencyList = currencyList;
      // HashStorage.setItem('currencyList', JSON.stringify(this.currencyList))
      CurrencyControl.SET_CURR_LOCAL(currencyList);
    } catch (error) {
      console.warn(error);
    }
  }

  ngOnDestroy() { }

  async aesDebug() {
    const guestObject = {
      password: "123456",
      loginUserID: "skashan@texpo.com",
      CountryCode: " PK",
      LoginIpAddress: "0.0.0.0",
      LoginDate: moment(Date.now()).format(),
      LoginRemarks: "asdasdas asdasd 12312312 ^^*( 123123 @@@"
    };

    const currDateTime = moment(Date.now())
      .format()
      .substring(0, 16);
    const toSend: AESModel = {
      d1: currDateTime,
      d2: JSON.stringify(guestObject),
      d3: ''
    };
    const encObject = encryptStringAES(toSend);
    this._authService.aesCheck(encObject).subscribe(
      async (resp: AESModel) => {
        const decrypted = await decryptStringAES(resp);
      },
      (error: HttpErrorResponse) => { }
    );
  }

  clearStorage() {
    let currVersion = AppComponent.version.version;
    let oldVersion = HashStorage.getItem("version");
    if (!oldVersion || oldVersion !== currVersion) {
      localStorage.clear();
      HashStorage.setItem("version", AppComponent.version.version);
      this._cookieService.deleteCookies()
    }
  }

  public setCustomerSettings() {
    const customerSettings = {
      customerCode: "hashmove",
      customerFooterColor: "#1a1c27",
      customerFooterTextColor: "#97a5b1",
      customerForeColorPrimary: "#fff",
      customerForeColorSecondary: "#000",
      customerID: 0,
      customerPortalTitle: "Digital Logistisc Portal",
      customerPrimaryBGImage: "../assets/images/bg-img.jpg",
      customerPrimaryColor: "#fff",
      customerPrimaryGradientColor: "#3fbefc",
      customerPrimaryLogo: "../assets/images/hm-symbol-w.svg",
      customerSecondarGradientColor: "#37b7f9",
      customerSecondaryBGImage: "../assets/images/bg-img.jpg",
      customerSecondaryColor: "#02bdb6",
      customerSecondaryLogo: "../assets/images/hm-symbol.svg",
      customerType: "USER",
      cutomerBannerTabsOverlay: "#000",
      isAirCityRequired: true,
      isAirDoorRequired: true,
      isAirPortRequired: true,
      isBookShipmentRequired: true,
      isBookWarehouseRequired: true,
      isGroundCityRequired: true,
      isGroundDoorRequired: true,
      isGroundPortRequired: true,
      isPartnerWithUsRequired: true,
      isSeaCityRequired: true,
      isSeaDoorRequired: true,
      isSeaPortRequired: true,
      isTrackShipmentRequired: true,
      portalName: "MARKETPLACE"
    };
    HashStorage.setItem("customerSettings", JSON.stringify(customerSettings));
    this.globalOverride(customerSettings);
  }

  globalOverride(stylesheet) {
    if (stylesheet.customerPrimaryColor) {
      this.themeWrapper.style.setProperty(
        "--customerPrimaryColor",
        stylesheet.customerPrimaryColor
      );
    }
    if (stylesheet.customerSecondaryColor) {
      this.themeWrapper.style.setProperty(
        "--customerSecondaryColor",
        stylesheet.customerSecondaryColor
      );
    }
    if (stylesheet.customerForeColorPrimary) {
      this.themeWrapper.style.setProperty(
        "--customerForeColorPrimary",
        stylesheet.customerForeColorPrimary
      );
    }
    if (stylesheet.customerForeColorSecondary) {
      this.themeWrapper.style.setProperty(
        "--customerForeColorSecondary",
        stylesheet.customerForeColorSecondary
      );
    }
    if (stylesheet.customerFooterColor) {
      this.themeWrapper.style.setProperty(
        "--customerFooterColor",
        stylesheet.customerFooterColor
      );
    }
    if (stylesheet.customerFooterTextColor) {
      this.themeWrapper.style.setProperty(
        "--customerFooterTextColor",
        stylesheet.customerFooterTextColor
      );
    }
  }
}
