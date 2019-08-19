import { Component, OnInit, Renderer2, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromWarehousing from '../../search-results/warehousing-search/store'
import * as fromFclShipping from '../../search-results/fcl-search/store'
import * as fromLclAir from '../../search-results/air-search/store'
import * as fromLclShipping from '../../search-results/lcl-search/store'

import { CookieService } from '../../../services/cookies.injectable';
import { Router } from '@angular/router';
import { DataService } from '../../../services/commonservice/data.service';
import { DropDownService } from '../../../services/dropdownservice/dropdown.service';
import { Lightbox } from 'ngx-lightbox';
import { ToastrService } from 'ngx-toastr';
import { CurrencyControl } from '../../../shared/currency/currency.injectable';
import { GeneralService } from '../../../shared/setup/general.injectable';

import { Observable } from 'rxjs';
import { loading, HashStorage, removeDuplicateCurrencies, compareValues, cloneObject } from '../../../constants/globalfunctions';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { WarehouseSearchResult, WareDocumentData } from '../../../interfaces/warehouse.interface';
import { SelectedCurrency } from '../../../shared/currency-dropdown/currency-dropdown.component';
import { CurrencyDetails, ExchangeRate } from '../../../interfaces/currencyDetails';
import { baseExternalAssets } from '../../../constants/base.url';
import { WarehouseEmitModel } from '../../../shared/map-utils/map.component';
import { WarehouseSearchCriteria } from '../../../interfaces/warehousing';
import { currErrMsg } from '../../../shared/constants';
import { HttpErrorResponse } from '@angular/common/http';
import { HashmoveLocation } from '../../../interfaces/searchResult';
import { PaginationInstance } from 'ngx-pagination';
import { SearchCriteria } from '../../../interfaces/searchCriteria';
import { firstBy } from 'thenby';
import * as moment from 'moment'
import { RequestForQuoteComponent } from '../../../shared/dialogues/request-for-quote/request-for-quote.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchResultService } from '../../search-results/fcl-search/fcl-search.service';
import { WarehousingService } from '../../main/warehousing/warehousing.service';
import { JsonResponse } from '../../../interfaces/JsonResponse';
import { BookingSurChargeDetailWarehouse, WarehouseBookingDetails, ViewBooking } from '../../../interfaces/bookingDetails';
import { LeftSidebarComponent } from '../../search-results/fcl-search/left-sidebar/left-sidebar.component';

@Component({
  selector: "app-search-results",
  templateUrl: "./search-results.component.html",
  styleUrls: ["./search-results.component.scss"]
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  @Output() searchResults: EventEmitter<any> = new EventEmitter();
  @Input() showVendorDetails: boolean;
  public ports: any;
  public popupClosed: boolean = false;
  public onSearchPage: boolean = false
  public searchResult: any[];
  public mainsearchResult: any[];
  public currentSelectedCurrency: SelectedCurrency;
  public currencyFlags: CurrencyDetails[];
  public mapView: boolean = false;
  public selectedSortType: string = "Price";
  public selectedSortText: string = "low to high";
  public searchCriteria: any;
  bestSelectedOption: any;

  public _albums: Array<any> = [];

  // FCL VARIABLES
  public recordCount: number;
  public dealCount;
  public pageSize: number = 10;
  public totalElements: number;
  public recommendedDeals: any = [];
  public topRecommendedDeals: any = [];
  public nonRecommendedDeals: any = [];
  public providersData: any[];
  public sortedProvidersData: any[];
  public mainProvidersData: any[] = [];
  public config: PaginationInstance = {
    id: "advanced2",
    itemsPerPage: 10,
    currentPage: 1
  };
  fastestRouteDays: string;
  public searchResultSummary: any = [];
  bestRouteDays: string;
  // FCL VARIABLES

  // AIR VARIABLES
  public currencyCode: string = "AED";
  public currencyList: CurrencyDetails[];
  public totalSearchCount: number = 0;
  public selectedCarrier;
  private viewInitLoad: boolean = true;
  selectedProvider: any;
  // AIR VARIABLES

  public hasResults: boolean = false;
  public showNoResult: boolean = false;
  public showResult: boolean = false;
  public isCarrier: boolean = true;

  public shouldDispatch: boolean = false;
  public providerSearchResult: any[];
  public mainProvidersearchResult: any[];

  public $warehouseSearchResults: Observable<fromWarehousing.WarehousingState>;

  public $fclSearchResults: Observable<fromFclShipping.FclShippingState>;
  public $fclProviderResults: Observable<fromFclShipping.FclForwarderState>;

  public $lclSearchResults: Observable<fromLclShipping.LclShippingState>;

  public $fclAirShippingSearchResults: Observable<fromLclAir.LclAirState>;
  public $fclAirSearchResults: Observable<fromLclAir.FclForwarderState>;
  savedSeaarchCriteria: any;

  public showCard: string = "provider";

  constructor(
    private renderer: Renderer2,
    private _store: Store<any>,
    private _cookieService: CookieService,
    private _router: Router,
    private _dataService: DataService,
    private _dropdownService: DropDownService,
    private _lightbox: Lightbox,
    private _toast: ToastrService,
    private _currencyControl: CurrencyControl,
    private _generalService: GeneralService,
    private _modalServive: NgbModal,
    private _searchService: SearchResultService,
    private _warehousingService: WarehousingService
  ) { }

  ngOnInit() {
    const uiLoader = loading;
    uiLoader(true);
    this.$warehouseSearchResults = this._store.select("warehousing_shippings");
    this.$fclSearchResults = this._store.select("fcl_shippings");
    this.$fclProviderResults = this._store.select("fcl_forwarder");

    this.$lclSearchResults = this._store.select("lcl_shippings");
    this.currencyList = JSON.parse(HashStorage.getItem("currencyList"));
    this.currencyFlags = this.currencyList;
    this.$fclAirShippingSearchResults = this._store.select("lcl_air");
    this.$fclAirSearchResults = this._store.select("lcl_air_forwarder");
    this._dataService.closeBookingModal.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        const modalStatus = localStorage.getItem('modalStatus')
        if (modalStatus) {
          this.popupClosed = true;
          this.onSearchPage = false
          this.searchResults.emit(false)
          return;
        } else {
          this.popupClosed = true;
          this.onSearchPage = true;
          this.searchResults.emit(true)
        }
        // this.vendorProfileAbout();
        // this.scrollTOElement("#shippingVendor", 35, 1500);
        this.searchCriteria = JSON.parse(
          localStorage.getItem("searchCriteria")
        );
        if (this.searchCriteria) {
          this.currenyFlags(false);
          if (this.searchCriteria.searchMode === "warehouse-lcl") {
            this.$warehouseSearchResults
              .pipe(untilDestroyed(this))
              .subscribe(state => {
                const {
                  data,
                  loading,
                  loaded,
                  loadFromApi,
                  isSearchUpdate,
                  isMainResultModified,
                  isViewResultModified
                } = state;
                if (loading) {
                  this.mainsearchResult = []
                }
                uiLoader(false);
                if (data && loaded && loadFromApi) {
                  const { response } = data;
                  this.setWarehouseData(response);
                  uiLoader(false);
                }

                if (
                  isSearchUpdate &&
                  isViewResultModified &&
                  !isMainResultModified
                ) {
                  const { searchResult, mainsearchResult } = data;

                  this.searchResult = searchResult;
                  this.mainsearchResult = mainsearchResult;
                  this.sorter("TotalPrice", "asc", "Price", this.searchCriteria.searchMode, 'provider', null);
                  uiLoader(false);
                }

                if (data && loaded && loadFromApi) {
                  this.setLclData(data.response)
                }

                if (
                  isSearchUpdate &&
                  isMainResultModified &&
                  !isViewResultModified
                ) {

                  const { mainsearchResult, searchResult } = data;
                  this.mainsearchResult = mainsearchResult;
                  this.searchResult = searchResult;
                  uiLoader(false);
                }
                if (
                  state === fromWarehousing.getWarehousingInitalState() &&
                  this._dataService.isWarehouseDispatched === false
                ) {


                  this._dataService.isWarehouseDispatched = false;
                  if (this.searchCriteria) {
                    this._store.dispatch(
                      new fromWarehousing.FetchingWarehousingData(
                        this.searchCriteria
                      )
                    );
                  }
                  return;
                }

                if (
                  data &&
                  data.mainsearchResult &&
                  data.mainsearchResult.length > 0
                ) {
                  this.showResult = true;
                }
                if (
                  data &&
                  data.mainsearchResult &&
                  data.mainsearchResult.length === 0
                ) {
                  this.showResult = false;


                  setTimeout(() => {
                    uiLoader(false);
                  }, 0);
                }
              });
          } else if (this.searchCriteria.searchMode === "air-lcl") {
            uiLoader(true);
            this.selectedProvider = JSON.parse(
              HashStorage.getItem("selectedProvider")
            );
            this.$fclAirShippingSearchResults
              .pipe(untilDestroyed(this))
              .subscribe(state => {
                const {
                  loaded,
                  data,
                  isSearchUpdate,
                  isViewResultModified,
                  loadFromApi,
                  isMainResultModified,
                  loading
                } = state;
                if (loading) {
                  this.mainsearchResult = []
                }
                if (loaded && data && this.viewInitLoad) {
                  const { mainsearchResult } = data;
                  uiLoader(false);
                  this.totalSearchCount = mainsearchResult.length;
                  this.mainsearchResult = mainsearchResult;
                  this.searchResult = mainsearchResult;
                  this.shouldDispatch = true;
                  // this.shippingMode = this.searchCriteria.TransportMode
                  this.currencyCode = this._currencyControl.getCurrencyCode();
                  this.viewInitLoad = false;
                  this.currenyFlags(true);

                  return;
                }

                if (isSearchUpdate && isViewResultModified) {
                  const { searchResult } = data;
                  uiLoader(false);

                  this.searchResult = searchResult;
                  this.totalSearchCount = searchResult.length;
                  this.shouldDispatch = false;
                  this.sorter("TotalPrice", "asc", "Price", this.searchCriteria.searchMode, 'carrier', null);
                  this.currencyCode = this._currencyControl.getCurrencyCode();
                  return;
                }

                if (isSearchUpdate && isMainResultModified) {
                  uiLoader(false);
                  const { mainsearchResult } = data;
                  this.mainsearchResult = mainsearchResult;

                }

                if (loaded && data) {
                  uiLoader(false);

                  const { searchResult, mainsearchResult } = data;
                  this.searchResult = searchResult;
                  this.totalSearchCount = searchResult.length;
                  this.mainsearchResult = mainsearchResult;
                  return;
                }
              });
          } else if (
            this.searchCriteria.searchMode === "sea-lcl" ||
            this.searchCriteria.searchMode === "truck-ftl"
          ) {
            this.$lclSearchResults
              .pipe(untilDestroyed(this))
              .subscribe(state => {
                const {
                  data,
                  loaded,
                  loadFromApi,
                  isSearchUpdate,
                  isMainResultModified,
                  isViewResultModified
                } = state;
                if (loading) {
                  this.mainsearchResult = []
                }
                if (data && loaded && loadFromApi) {
                  this.setLclData(data.response);
                }
                if (
                  isSearchUpdate &&
                  isViewResultModified &&
                  !isMainResultModified
                ) {
                  uiLoader(false);
                  const { searchResult, mainsearchResult } = data;
                  this.searchResult = searchResult;
                  this.mainsearchResult = mainsearchResult;
                  this.sorter("TotalPrice", "asc", "Price", this.searchCriteria.searchMode, 'provider', null);
                }

                if (
                  isSearchUpdate &&
                  isMainResultModified &&
                  !isViewResultModified
                ) {
                  uiLoader(false);

                  const { mainsearchResult, searchResult } = data;
                  this.mainsearchResult = mainsearchResult;
                  this.searchResult = searchResult;
                }

                if (data) {

                  const { mainsearchResult } = data;
                  if (mainsearchResult && mainsearchResult.length > 0) {
                    const { PolName, PodName } = mainsearchResult[0];

                    const hashmoveLoc: HashmoveLocation = {
                      PolName,
                      PodName
                    };

                    this._dataService.setHashmoveLocation(hashmoveLoc);
                  }
                } else {
                  this._dataService.setHashmoveLocation(null);


                }

                if (state === fromLclShipping.getLclInitalShippingState()) {
                  const searchCriteria = JSON.parse(
                    localStorage.getItem("searchCriteria")
                  );

                  // if (searchCriteria) {
                  //   this._store.dispatch(new fromLclShipping.FetchingLCLShippingData(searchCriteria))
                  // }
                  return;
                }
              });
          } else if (this.searchCriteria.searchMode === "sea-fcl") {
            this.$fclSearchResults
              .pipe(untilDestroyed(this))
              .subscribe(state => {
                const {
                  data,
                  loaded,
                  loadFromApi,
                  isSearchUpdate,
                  isMainResultModified,
                  isViewResultModified,
                  loading
                } = state;
                this.config.currentPage = 1;
                if (data && loaded && loadFromApi) {
                  uiLoader(false);

                  const { response, searchResult } = data;
                  this.shouldDispatch = true;
                  this.mainsearchResult = searchResult;
                  this.getCalculateFCLShippingData(response).then(() =>
                    this.setSearchResultScreen(searchResult)
                  );
                  return;
                }

                if (isSearchUpdate && isViewResultModified) {
                  uiLoader(false);

                  const { searchResult, mainsearchResult } = data;
                  this.mainsearchResult = mainsearchResult;
                  this.searchResult = searchResult;
                  this.shouldDispatch = false;
                  this.sorter("TotalPrice", "asc", "Price", this.searchCriteria.searchMode, 'carrier', null);
                  return;
                }

                if (isSearchUpdate && isMainResultModified) {
                  uiLoader(false);

                  const { mainsearchResult, searchResult } = data;
                  this.mainsearchResult = mainsearchResult;
                  this.searchResult = searchResult;
                  return;
                }

                if (data && data.searchResult && data.mainsearchResult) {
                  uiLoader(false);

                  const { mainsearchResult } = data;
                  if (mainsearchResult.length > 0) {
                    if (
                      this._currencyControl.getCurrencyID() !==
                      mainsearchResult[0].CurrencyID
                    ) {
                      this.setSearchResultScreen(mainsearchResult);
                    }
                  }
                }
              });
          }
        }
      }
    });
    this.getPortDetails();
  }

  vendorProfileAbout() {
    const scroller = document.querySelector(".about");
    scroller.classList.add("partnerScroller");
  }

  // AutoMatic Animated scrollBar
  scrollTOElement = (element, offsetParam?, speedParam?) => {
    const elem = document.querySelector(".main-scrollbar .ng-scroll-view-container .ng-scroll-view");
    const toElement = $(element);
    const speed = speedParam * 1 || 3000;
    $(elem).animate({ scrollTop: 589.796875 }, speed);
  };

  // WAREHOUSE SEARCH FUNCTIONS
  selectedCurrency($shouldSetRates: boolean, type?) {
    let currencyId = this._currencyControl.getCurrencyID();
    let seletedCurrency: CurrencyDetails;

    if (
      this._currencyControl.getToCountryID() &&
      this._currencyControl.getToCountryID() > 0
    ) {
      seletedCurrency = this.currencyFlags.find(
        obj =>
          obj.id == currencyId
        //  &&
        // JSON.parse(obj.desc).CountryID ===
        // this._currencyControl.getToCountryID()
      );
    } else {
      seletedCurrency = this.currencyFlags.find(obj => obj.id == currencyId);
    }
    console.log(seletedCurrency)
    let newSelectedCurrency: SelectedCurrency = {
      sortedCountryFlag: seletedCurrency.imageName.toLowerCase(),
      sortedCountryName: seletedCurrency.shortName,
      sortedCurrencyID: seletedCurrency.id,
      sortedCountryId: JSON.parse(seletedCurrency.desc).CountryID
    };
    this.currentSelectedCurrency = newSelectedCurrency;
    this._dataService.forwardCurrencyCode.next(
      this.currentSelectedCurrency.sortedCountryName
    );
    this._currencyControl.setCurrencyID(
      this.currentSelectedCurrency.sortedCurrencyID
    );
    this._currencyControl.setCurrencyCode(
      this.currentSelectedCurrency.sortedCountryName
    );
    HashStorage.setItem(
      "CURR_MASTER",
      JSON.stringify(this._currencyControl.getMasterCurrency())
    );
    if ($shouldSetRates) {
      if (type === "sea-lcl") {
        this.setProviderRates(this._currencyControl.getBaseCurrencyID(), "lcl");
      } else if (type === "sea-fcl") {
        this.setProviderRates(this._currencyControl.getBaseCurrencyID(), "fcl");
      } else if (type === "air-lcl") {
        this.setProviderRates(this._currencyControl.getBaseCurrencyID(), "air");
      } else if (type === "warehouse-lcl") {
        this.setProviderRates(
          this._currencyControl.getBaseCurrencyID(),
          "warehouse"
        );
      } else if (type === "truck-ftl") {
        this.setProviderRates(
          this._currencyControl.getBaseCurrencyID(),
          "lcl"
        );
      }
    }
  }

  currenyFlags($shouldSetRates: boolean) {
    const { currencyFlags } = this;
    if (!currencyFlags || currencyFlags.length === 0) {
      // this._dropdownService.getCurrency().subscribe((res: any) => {
      //   let newCurrencyList = removeDuplicateCurrencies(res)
      //   newCurrencyList.sort(compareValues('title', "asc"));
      //   this.currencyFlags = newCurrencyList
      //   this.currencyList = newCurrencyList;
      //   this.selectedCurrency($shouldSetRates, this.searchCriteria.searchMode)
      // })
      this.selectedCurrency($shouldSetRates, this.searchCriteria.searchMode);
    } else {
      this.selectedCurrency($shouldSetRates, this.searchCriteria.searchMode);
    }
  }

  async setWarehouseData(res) {
    let searchResp: any = res[0];
    if (searchResp.returnId === 1) {
      this._dataService.searchResultFiltered = searchResp.returnObject;
      this.searchResult = searchResp.returnObject;
      this.mainsearchResult = this.searchResult;
      if (searchResp.returnObject && searchResp.returnObject.length > 0) {
        this._dataService.searchResultFiltered.sort((a: any, b: any) => {
          var comparison;
          if (a.IsRecommended > b.IsRecommended) {
            comparison = -1;
          } else if (b.IsRecommended > a.IsRecommended) {
            comparison = 1;
          }
          return comparison;
        });
        let exchangeResp: any = res[1];
        this._currencyControl.setExchangeRateList(exchangeResp.returnObject);
        this._cookieService.deleteCookies();
        this.currenyFlags(true);
      }
    }
  }
  sorter($sortBy: string, $sortOrder: string, $type: string, $mode: string, $modeType: string, $event: any) {
    loading(true);
    this.selectedSortType = $type;
    this.bestSelectedOption = null
    if ($sortOrder === 'desc')
      this.selectedSortText = 'high to low'
    else if ($sortOrder === 'asc')
      this.selectedSortText = 'low to high'
    const _CarrierOrProvider: string = ($modeType.toLowerCase() === 'carrier') ? 'CarrierName' : 'ProviderName';

    let recommendedArr = this.searchResult.filter((element) => element.IsRecommended);
    let notRecommended = this.searchResult.filter((element) => !element.IsRecommended);
    recommendedArr = recommendedArr.sort(compareValues($sortBy, $sortOrder));
    if (recommendedArr && recommendedArr.length > 0) {
      if ($sortBy === 'TotalPrice') {

        if ($sortOrder === 'asc') {
          recommendedArr.sort(
            firstBy(function (v1, v2) { return v1.TotalPrice - v2.TotalPrice; })
              .thenBy("EtaInDays")
              .thenBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })
              .thenBy(`${_CarrierOrProvider}`)
          );

        } else {
          recommendedArr.sort(
            firstBy(function (v1, v2) { return v2.TotalPrice - v1.TotalPrice; })
              .thenBy("EtaInDays")
              .thenBy(`${_CarrierOrProvider}`)
              .thenBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })

          );
        }
      } else if ($sortBy === 'EtaInDays') {
        if ($sortOrder === 'asc') {
          recommendedArr.sort(
            firstBy(function (v1, v2) { return v1.EtaInDays - v2.EtaInDays; })
              .thenBy("TotalPrice")
              .thenBy(`${_CarrierOrProvider}`)
              .thenBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })

          );
        } else {
          recommendedArr.sort(
            firstBy(function (v1, v2) { return v2.EtaInDays - v1.EtaInDays; })
              .thenBy("TotalPrice")
              .thenBy(`${_CarrierOrProvider}`)
              .thenBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })
          );
        }
      } else if ($sortBy === 'PortCutOffUtc') {
        if ($sortOrder === 'asc') {
          recommendedArr.sort(
            firstBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })
              .thenBy("EtaInDays")
              .thenBy("TotalPrice")
              .thenBy(`${_CarrierOrProvider}`)
          );
        } else {
          recommendedArr.sort(
            firstBy(function (v1, v2) { return v2.PortCutOffUtc - v1.PortCutOffUtc; })
              .thenBy("EtaInDays")
              .thenBy("TotalPrice")
              .thenBy(`${_CarrierOrProvider}`)
          );
        }
      }
    }
    if (notRecommended && notRecommended.length > 0) {
      if ($sortBy === 'TotalPrice') {
        if ($sortOrder === 'asc') {
          notRecommended.sort(
            firstBy(function (v1, v2) { return v1.TotalPrice - v2.TotalPrice; })
              .thenBy("EtaInDays")
              .thenBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })
              .thenBy(`${_CarrierOrProvider}`)
          );
        } else {
          notRecommended.sort(
            firstBy(function (v1, v2) { return v2.TotalPrice - v1.TotalPrice; })
              .thenBy("EtaInDays")
              .thenBy(`${_CarrierOrProvider}`)
              .thenBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })
          );
        }
      } else if ($sortBy === 'EtaInDays') {
        if ($sortOrder === 'asc') {
          notRecommended.sort(
            firstBy(function (v1, v2) { return v1.EtaInDays - v2.EtaInDays; })
              .thenBy("TotalPrice")
              .thenBy(`${_CarrierOrProvider}`)
              .thenBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })
          );
        } else {
          notRecommended.sort(
            firstBy(function (v1, v2) { return v2.EtaInDays - v1.EtaInDays; })
              .thenBy("TotalPrice")
              .thenBy(`${_CarrierOrProvider}`)
              .thenBy(function (v1, v2) { return v1.PortCutOffUtc - v2.PortCutOffUtc; })
          );
        }
      } else if ($sortBy === 'PortCutOffUtc') {
        if ($sortOrder === 'asc') {
          notRecommended.sort(
            firstBy(function (v1, v2) { return parseInt(moment(v1.PortCutOffUtc).format('X')) - parseInt(moment(v2.PortCutOffUtc).format('X')) })
              .thenBy("TotalPrice")
              .thenBy(`${_CarrierOrProvider}`)
          );
        } else {
          notRecommended.sort(
            firstBy(function (v1, v2) { return parseInt(moment(v2.PortCutOffUtc).format('X')) - parseInt(moment(v1.PortCutOffUtc).format('X')) })
              .thenBy("TotalPrice")
              .thenBy(`${_CarrierOrProvider}`)
          );
        }
      }
    }
    this.searchResult = recommendedArr.concat(notRecommended);
    if ($event) {
      let count = $event.currentTarget.parentElement.parentElement.parentElement.children;
      for (let i = 0; i < count.length; i++) {
        for (let j = 1; j < count[i].children.length; j++) {
          if (count[i].children[j].children[0].classList.length) {
            count[i].children[j].children[0].classList.remove('active');
            count[i].classList.remove('active');
          }
        }
        $event.currentTarget.parentElement.parentElement.classList.add('active');
        $event.currentTarget.classList.add('active');
      }
    }
    // console.log(this.searchResult)
    loading(false);
  }

  currencyFilter($currency: SelectedCurrency, type) {
    // loading(true);
    this.currentSelectedCurrency = $currency;

    this._currencyControl.setCurrencyID($currency.sortedCurrencyID);
    this._currencyControl.setCurrencyCode($currency.sortedCountryName);
    this._currencyControl.setToCountryID($currency.sortedCountryId);

    this._dataService.forwardCurrencyCode.next($currency.sortedCountryName);

    HashStorage.setItem(
      "CURR_MASTER",
      JSON.stringify(this._currencyControl.getMasterCurrency())
    );
    if (type === "air") {
      this.setProviderRates(this._currencyControl.getBaseCurrencyID(), "air");
    } else if (type === "warehouse") {
      this.setProviderRates(
        this._currencyControl.getBaseCurrencyID(),
        "warehouse"
      );
    } else if (type === "lcl") {
      this.setProviderRates(this._currencyControl.getBaseCurrencyID(), "lcl");
    } else if (type === "fcl") {
      LeftSidebarComponent.isRangeLoaded = true
      this.setProviderRates(this._currencyControl.getBaseCurrencyID(), "fcl");
    }
    loading(false);
  }
  onWarehouseClick($emitEvent: WarehouseEmitModel) {
    if ($emitEvent.type === "share") {
      const searchCriteria = JSON.parse(HashStorage.getItem("searchCriteria"));
      this._generalService.shareLclShippingAction(
        null,
        searchCriteria,
        $emitEvent.searchResult
      );
    }
    if ($emitEvent.type === "proceed") {
      loading(true)
      this.bookNowWarehouse($emitEvent.searchResult)
      // this._dataService.dispatchWarehouseBook({
      //   action: true,
      //   payload: $emitEvent.searchResult
      // });
    }
    if ($emitEvent.type === "gallery") {
      this.onGalleryClick($emitEvent.searchResult);
    }
  }

  async bookNowWarehouse(item: any) {
    const { CustomerID, CustomerType } = this.searchCriteria

    this._searchService.getActualScheduleDetailWithPrice(item.IDList, 'warehouse', 'abc', 'abc', CustomerID, CustomerType).subscribe((resp: JsonResponse) => {
      const { returnId, returnText } = resp
      const actualScheduleResp = JSON.parse(returnText);
      if (returnId > 0) {
        this.searchCriteria.IDList = item.IDList
        this.searchCriteria.SelProvID = item.ProviderID
        this.searchCriteria.SelWHID = item.WHID
        HashStorage.setItem('searchCriteria', JSON.stringify(this.searchCriteria))
        this._warehousingService.getWarehousePriceDetails(this.searchCriteria).subscribe((res) => {
          loading(false)
          const warehosueResp: JsonResponse = res;
          let priceDetails: any[] = JSON.parse(warehosueResp.returnText);

          this._currencyControl.setExchangeRate(item.ExchangeRate)
          HashStorage.setItem('CURR_MASTER', JSON.stringify(this._currencyControl.getMasterCurrency()))
          let response = JSON.parse(warehosueResp.returnText);
          response = this._currencyControl.applyCurrencyRateOnBookingPriceDetails(response)
          const BookingSurChargeDetail = []

          response.forEach((e) => {
            let obj: BookingSurChargeDetailWarehouse = {
              SurchargeType: e.SurchargeType,
              SurchargeID: e.SurchargeID,
              SurchargeCode: e.SurchargeCode,
              SurchargeName: e.SurchargeName,
              Price: e.Price,
              TotalAmount: e.TotalAmount,
              CurrencyID: e.CurrencyID,
              CurrencyCode: e.CurrencyCode,
              BaseCurrPrice: e.BaseCurrPrice,
              BaseCurrencyID: e.BaseCurrencyID,
              BaseCurrencyCode: e.BaseCurrencyCode,
              BaseCurrTotalAmount: e.BaseCurrTotalAmount,
              PriceBasis: e.SurchargeBasis,
              ActualPrice: e.Price,
              ActualTotalAmount: e.Price,
              ExchangeRate: e.ExchangeRate,
              CreatedBy: null
            }
            BookingSurChargeDetail.push(obj);
          });

          const parsedResponse = JSON.parse(returnText)
          const warehouseContainedData = parsedResponse.filter(e => e.ActualScheduleFor === 'WAREHOUSE')
          const copiedParsedResponse = warehouseContainedData[0];
          const WHJsonDataParsed = JSON.parse(warehouseContainedData[0].WHJsonData)
          // const WHTimingsParsed = JSON.parse(warehouseContainedData[0].WHTimings)
          // WHJsonDataParsed.WHTimings = Object.assign(WHTimingsParsed)
          let taxedTotalAmount: number = 0;
          let taxesBaseTotalAmount: number = 0;
          if (WHJsonDataParsed.TaxValue > 0) {
            BookingSurChargeDetail.forEach(e => {
              taxedTotalAmount += (e.TotalAmount * WHJsonDataParsed.TaxValue) / 100
              taxesBaseTotalAmount += (e.BaseCurrTotalAmount * WHJsonDataParsed.TaxValue) / 100
            })
          }
          const taxObj: BookingSurChargeDetailWarehouse = {
            SurchargeType: WHJsonDataParsed.TaxType,
            SurchargeID: WHJsonDataParsed.TaxID,
            SurchargeCode: WHJsonDataParsed.TaxCode,
            SurchargeName: WHJsonDataParsed.TaxName,
            Price: WHJsonDataParsed.TaxValue,
            TotalAmount: taxedTotalAmount,
            CurrencyID: BookingSurChargeDetail[0].CurrencyID,
            CurrencyCode: BookingSurChargeDetail[0].CurrencyCode,
            BaseCurrPrice: WHJsonDataParsed.TaxValue,
            BaseCurrencyID: BookingSurChargeDetail[0].BaseCurrencyID,
            BaseCurrencyCode: BookingSurChargeDetail[0].BaseCurrencyCode,
            BaseCurrTotalAmount: taxesBaseTotalAmount,
            PriceBasis: WHJsonDataParsed.TaxBasis,
            ActualPrice: WHJsonDataParsed.TaxValue,
            ActualTotalAmount: taxedTotalAmount,
            ExchangeRate: BookingSurChargeDetail[0].ExchangeRate,
            CreatedBy: null
          }
          HashStorage.setItem('taxObj', JSON.stringify(taxObj));
          BookingSurChargeDetail.push(taxObj);
          priceDetails = this._currencyControl.applyCurrencyRateOnBookingPriceDetails(priceDetails)
          delete copiedParsedResponse.WHJsonData;
          delete copiedParsedResponse.WHTimings;

          const BookingJsonDetail = WHJsonDataParsed
          const bookingDetails: WarehouseBookingDetails = {
            BookingID: -1,
            CurrencyCode: this._currencyControl.getCurrencyCode(),
            HashMoveBookingNum: null,
            HashMoveTmpBookingNum: null,
            HashMoveBookingDate: null,
            UserID: null,
            BookingSource: null,
            BookingOfficeName: null,
            BookingOfficeAddress: null,
            BookingOfficeContactNum: null,
            BookingOfficeCityID: null,
            BookingStatus: null,
            ContractNum: null,
            ShippingModeID: null,
            ShippingCatID: null,
            ShippingSubCatID: null,
            ProviderID: item.ProviderID,
            ProviderName: item.ProviderName,
            ProviderImage: item.ProviderImage,
            WHID: item.WHID,
            StoredFromUtc: this.searchCriteria.StoreFrom,
            StoredFromLcl: this.searchCriteria.StoreFrom,
            StoredUntilUtc: this.searchCriteria.StoreUntill,
            StoredUntilLcl: this.searchCriteria.StoreUntill,
            ReferenceType: null,
            ReferenceNum: null,
            ProviderRemarks: null,
            IsInsured: false,
            InsuredGoodsPrice: null,
            IsInsuranceProvider: item.IsInsuranceProvider,
            InsuredGoodsCurrencyID: item.CurrencyID,
            IsInsuredGoodsBrandNew: false,
            InsuredGoodsProviderID: item.ProviderID,
            InsuredStatus: 'Insured',
            InsuredGoodsBaseCurrencyID: item.BaseCurrencyID,
            InsuredGoodsBaseCurrPrice: null,
            InsuredGoodsActualPrice: null,
            InsuredGoodsExchangeRate: null,
            IDlist: item.IDList,
            CommodityType: 'FAK',
            DiscountedPrice: null,
            JsonSearchCriteria: JSON.stringify(this.searchCriteria),
            VASSummary: null,
            BookingJsonDetail: JSON.stringify(BookingJsonDetail),
            ActualScheduleDetail: JSON.stringify(copiedParsedResponse),
            ActualSchedulePriceDetail: warehouseContainedData[0].PriceDetailJsonData,
            BookingPriceDetail: priceDetails,
            BookingSurChargeDetail: BookingSurChargeDetail,
            BookingEnquiryDetail: null,
            BookingStatusDetail: null,
            Payment: null,
            CreatedBy: null
          };
          this._dataService.setBookingsData(bookingDetails);
          this._router.navigate(['booking-process']);
        }, error => {
          loading(false)
        })

        let providerInfo
        try {
          providerInfo = JSON.parse(actualScheduleResp[0].ProviderJsonData)
          let warehouseThankyouData: ViewBooking = {
            bookedFrom: this.searchCriteria.StoreFrom,
            bookedUntil: this.searchCriteria.StoreUntill,
            space: (item.AvailableSQFT) ? item.AvailableSQFT : item.WHAreaInSQFT,
            bookedSpace: ((this.searchCriteria.searchBy === 'by_unit' || this.searchCriteria.searchBy === 'by_vol_weight') && (this.searchCriteria.storageType === 'shared' || this.searchCriteria.storageType === 'dedicated')) ? this.searchCriteria.CBM : (this.searchCriteria.searchBy === 'by_area') ? this.searchCriteria.SQFT : this.searchCriteria.PLT,
            ProviderName: item.ProviderName,
            email: (providerInfo && providerInfo.ProviderEmail) ? providerInfo.ProviderEmail : '',
            phone: (providerInfo && providerInfo.ProviderPhone) ? providerInfo.ProviderPhone : '',
            ProviderImage: item.ProviderImage,
            IsBondedWarehouse: item.IsBondedWarehouse,
            IsTempratureControlled: item.IsTempratureControlled,
            IsTransportAvailable: item.IsTransportAvailable,
            WHParsedTiming: item.WHParsedTiming,
            WHParsedMedia: item.WHParsedMedia,
            WHAddress: item.WHAddress,
            WHAreaInSQFT: item.WHAreaInSQFT,
            WHName: item.WHName
          };
          HashStorage.setItem('warehouseSearch', JSON.stringify(warehouseThankyouData))
        } catch (error) { }


      } else {
        loading(false)
      }
    }, (err: HttpErrorResponse) => {
      loading(false)
    })
  }

  mapActionReciever($WHID) {
    this.mapView = true
    this._dataService.setmapWarehouseId($WHID)
  }

  onGalleryClick($searchCard: WarehouseSearchResult) {
    try {
      const docsArray: Array<WareDocumentData> = JSON.parse(
        $searchCard.WHMedia
      );
      const albumArr = [];

      docsArray.forEach(doc => {
        const album = {
          src: baseExternalAssets + "/" + doc.DocumentFile,
          caption: "&nbsp;",
          thumb: baseExternalAssets + "/" + doc.DocumentFile
        };
        albumArr.push(album);
      });
      this.open(albumArr);
    } catch (error) { }
  }
  open(_albums: any): void {
    // open lightbox
    this._lightbox.open(_albums);
  }
  mapViewChange(event) {
    this.mapView = event;
  }
  // WAREHOUSE SEARCH FUNCTIONS

  // FCL PROVIDER FUNCTIONS
  fclInit() { }

  setSearchResultScreen(searchData: any) {
    if (HashStorage) {
      this.searchResult = searchData;
      this.mainsearchResult = this.searchResult;
      this.currenyFlags(true);
      this.savedSeaarchCriteria = JSON.parse(
        HashStorage.getItem("searchCriteria")
      );

      if (this._cookieService.getCookie("ship-page")) {
        let currPage = this._cookieService.getCookie("ship-page");
        this.config.currentPage = parseInt(currPage);
      }
    }
  }

  private async getCalculateFCLShippingData(data: any) {
    HashStorage.removeItem("CURR_MASTER");

    const searchResp: any = data[0];
    if (
      searchResp.returnId === 1 &&
      JSON.parse(searchResp.returnText).length > 0
    ) {
      const jsonString = searchResp.returnText;
      this.searchResult = JSON.parse(jsonString);
      this.searchResult.sort((a: any, b: any) => {
        var comparison;
        if (a.IsRecommended > b.IsRecommended) {
          comparison = -1;
        } else if (b.IsRecommended > a.IsRecommended) {
          comparison = 1;
        }
        return comparison;
      });
      const exchangeResp: any = data[1];
      this._currencyControl.setExchangeRateList(exchangeResp.returnObject);
      let searchResultData: any = this.searchResult;
      searchResultData = this._currencyControl.applyCurrencyRateOnSearchResult(
        this._currencyControl.getCurrencyID(),
        exchangeResp.returnObject,
        searchResultData,
        null
      );
      this.searchResult = searchResultData;
      this.mainsearchResult = searchResultData;
      this._store.dispatch(
        new fromFclShipping.UpdateFCLShippingMainSearchResult(searchResultData)
      );
    } else {
      loading(false);
    }
  }

  async setProvidersData(data) {
    const providerResponse: any = data[0];
    if (providerResponse.returnId > 0) {
      let providersSearchResult = JSON.parse(providerResponse.returnText);
      loading(false);
      const exchangeResp: any = data[1];

      this._currencyControl.setExchangeRateList(exchangeResp.returnObject);
      this.setRates(providersSearchResult);
    } else {
      loading(false);
      this._toast.error(providerResponse.returnText, "Failed");
    }
  }

  setRates(providersSearchResult) {
    let providersSearchData: any = providersSearchResult;
    providersSearchData = this._currencyControl.applyCurrencyRateOnSearchResult(
      this._currencyControl.getCurrencyID(),
      cloneObject(this._currencyControl.getExchangeRateList()),
      null,
      providersSearchData
    );
    this._store.dispatch(
      new fromFclShipping.UpdateFCLForwarderSearchData(providersSearchData)
    );
  }

  // onSearchResultUpdate(data, type?) {
  //   loading(false);
  //   this.providersData = data;
  //   // this.topRecommendedDeals = this.providersData.filter((element) => element.IsRecommended);
  //   this.recommendedDeals = this.providersData.filter(
  //     element => element.IsRecommended
  //   );
  //   this.nonRecommendedDeals = this.providersData.filter(
  //     element => !element.IsRecommended
  //   );

  //   let deal = this.providersData.filter(x => x.DiscountPrice > 0);

  //   this.dealCount = deal.length;
  //   this.recordCount = this.providersData.length;
  //   this.sortedProvidersData = this.recommendedDeals.concat(
  //     this.nonRecommendedDeals
  //   );

  //   this.config.currentPage = 1;
  //   // this.sorter("TotalPrice", "asc", "Price", this.searchCriteria.searchMode, null);
  //   this.setSummary();
  // }

  setSummary() {
    if (this.providersData.length > 0) {
      // Getting Minimum Days with minimum price for best route card on ui (Alpha/Start)
      var x = this.providersData.sort(compareValues("EtaInDays", "asc"))[0];
      let bestEtaS: any[] = this.providersData.filter(
        elem => elem.EtaInDays === x.EtaInDays
      );
      bestEtaS = bestEtaS.sort(compareValues("MinTotalPrice", "asc"));
      this.searchResultSummary.fastestRouteCurrency = x.CurrencyCode;
      this.searchResultSummary.fastestRoutePrice = this._currencyControl.applyRoundByDecimal(
        bestEtaS[0].MinTotalPrice,
        this._currencyControl.getGlobalDecimal()
      );
      this.searchResultSummary.fastestRouteDays = x.EtaInDays;
      //this.fastestRoute = x.EtaInDays;
      if (x.EtaInDays > 1) {
        this.fastestRouteDays = x.EtaInDays.toString() + " Days";
        //this.fastestRoute = x.EtaInDays;
      } else {
        this.fastestRouteDays = x.EtaInDays.toString() + " Day";
        //this.fastestRoute = x.EtaInDays;
      }
      //(Alpha/End)

      // Getting Minimum price with minimum days for best price card on ui (Beta/Start)
      x = this.providersData.sort(compareValues("MinTotalPrice", "asc"))[0];

      let bestPrice: any[] = this.providersData.filter(
        elem => elem.MinTotalPrice === x.MinTotalPrice
      );
      bestPrice = bestPrice.sort(compareValues("EtaInDays", "asc"));

      this.searchResultSummary.bestRouteCurrency = x.CurrencyCode;
      this.searchResultSummary.bestRoutePrice = this._currencyControl.applyRoundByDecimal(
        x.MinTotalPrice,
        this._currencyControl.getGlobalDecimal()
      );
      this.searchResultSummary.bestRouteDays = bestPrice[0].EtaInDays;

      if (bestPrice[0].EtaInDays > 1) {
        this.bestRouteDays = bestPrice[0].EtaInDays.toString() + " Days";
      } else {
        this.bestRouteDays = bestPrice[0].EtaInDays.toString() + " Day";
      }
      // (Beta/End)
    } else {
      this.searchResultSummary.fastestRoutePrice = 0;
      this.searchResultSummary.fastestRouteDays = 0;
      this.searchResultSummary.fastestRouteCurrency = this._currencyControl.getCurrencyCode();
      this.searchResultSummary.bestRoutePrice = 0;
      this.searchResultSummary.bestRouteDays = 0;
      this.searchResultSummary.bestRouteCurrency = this._currencyControl.getCurrencyCode();
    }
  }

  setSummaryCarrier() {
    if (this.searchResult.length > 0) {
      // Getting Minimum Days with minimum price for best route card on ui (Alpha/Start)
      let x = this.searchResult.sort(compareValues("EtaInDays", "asc"))[0];

      let bestEtaS: any[] = this.searchResult.filter(
        elem => elem.EtaInDays === x.EtaInDays
      );

      bestEtaS = bestEtaS.sort(compareValues("TotalPrice", "asc"));

      this.searchResultSummary.fastestRouteCurrency = x.CurrencyCode;
      this.searchResultSummary.fastestRoutePrice = this._currencyControl.applyRoundByDecimal(
        bestEtaS[0].TotalPrice,
        this._currencyControl.getGlobalDecimal()
      );
      this.searchResultSummary.fastestRouteDays = x.EtaInDays;
      //this.fastestRoute = x.EtaInDays;
      if (x.EtaInDays > 1) {
        this.fastestRouteDays = x.EtaInDays.toString() + " Days";
        //this.fastestRoute = x.EtaInDays;
      } else {
        this.fastestRouteDays = x.EtaInDays.toString() + " Day";
        //this.fastestRoute = x.EtaInDays;
      }
      //(Alpha/End)

      // Getting Minimum price with minimum days for best price card on ui (Beta/Start)
      x = this.searchResult.sort(compareValues("TotalPrice", "asc"))[0];

      let bestPrice: any[] = this.searchResult.filter(
        elem => elem.TotalPrice === x.TotalPrice
      );
      bestPrice = bestPrice.sort(compareValues("EtaInDays", "asc"));
      this.searchResultSummary.bestRouteCurrency = x.CurrencyCode;
      this.searchResultSummary.bestRoutePrice = this._currencyControl.applyRoundByDecimal(
        x.TotalPrice,
        this._currencyControl.getGlobalDecimal()
      );
      this.searchResultSummary.bestRouteDays = bestPrice[0].EtaInDays;

      if (bestPrice[0].EtaInDays > 1) {
        this.bestRouteDays = bestPrice[0].EtaInDays.toString() + " Days";
      } else {
        this.bestRouteDays = bestPrice[0].EtaInDays.toString() + " Day";
      }
      // (Beta/End)
    } else {
      this.searchResultSummary.fastestRoutePrice = 0;
      this.searchResultSummary.fastestRouteDays = 0;
      this.searchResultSummary.fastestRouteCurrency = this._currencyControl.getCurrencyCode();
      this.searchResultSummary.bestRoutePrice = 0;
      this.searchResultSummary.bestRouteDays = 0;
      this.searchResultSummary.bestRouteCurrency = this._currencyControl.getCurrencyCode();
    }
  }

  quickSort(sortBy: string) {
    loading(true);
    if (sortBy.toLowerCase() === "MinTotalPrice".toLowerCase()) {
      if (
        this.bestSelectedOption &&
        this.bestSelectedOption.toLowerCase() === "price"
      ) {
        loading(false);
        return;
      }

      this.bestSelectedOption = "price";
      this.providersData = this.providersData.sort(
        compareValues(sortBy, "asc")
      );

      let minPrice: any = this.providersData.reduce((prev, curr) => {
        return prev.MinTotalPrice < curr.MinTotalPrice ? prev : curr;
      });

      let bestPrice: any[] = this.providersData.filter(
        elem => elem.MinTotalPrice === minPrice.MinTotalPrice
      );
      bestPrice = bestPrice.sort(compareValues("EtaInDays", "asc"));
      bestPrice = bestPrice.sort(compareValues("CarrierName", "asc"));

      let OtherPrices: any[] = this.providersData.filter(
        elem => elem.MinTotalPrice !== minPrice.MinTotalPrice
      );
      this.providersData = bestPrice.concat(OtherPrices);
    } else {
      if (
        this.bestSelectedOption &&
        this.bestSelectedOption.toLowerCase() === "days"
      ) {
        loading(false);
        return;
      }

      this.bestSelectedOption = "days";
      this.providersData = this.providersData.sort(
        compareValues(sortBy, "asc")
      );

      let minEta: any = this.providersData.reduce((prev, curr) => {
        return prev.EtaInDays < curr.EtaInDays ? prev : curr;
      });

      let bestEtaS: any[] = this.providersData.filter(
        elem => elem.EtaInDays === minEta.EtaInDays
      );
      bestEtaS = bestEtaS.sort(compareValues("CarrierName", "asc"));
      bestEtaS = bestEtaS.sort(compareValues("MinTotalPrice", "asc"));
      // bestEtaS = bestEtaS.sort(compareValues('CarrierName', 'asc'));

      let OtherEtaS: any[] = this.providersData.filter(
        elem => elem.EtaInDays !== minEta.EtaInDays
      );
      this.providersData = bestEtaS.concat(OtherEtaS);
    }
    // this.resetHide()
    loading(false);
  }
  // FCL  PROVIDERS FUNCTIONS

  // AIR PROVIDER FUNCTIONS
  bestRouteChange($selected) {
    this.bestSelectedOption = $selected;
  }

  recieveBestRouteChange($searchResult: any) {
    this.providerSearchResult = $searchResult;
  }
  // AIR PROVIDER FUNCTIONS

  // LCL FUNCTIONS
  async setLclData(res) {
    HashStorage.removeItem("CURR_MASTER");
    let searchResp: any = res[0];
    if (
      searchResp.returnId === 1 &&
      searchResp.returnObject &&
      searchResp.returnObject.length > 0
    ) {
      this._dataService.searchResultFiltered = searchResp.returnObject;
      this.searchResult = searchResp.returnObject;
      this.mainsearchResult = this.searchResult;
      this._dataService.searchResultFiltered.sort((a: any, b: any) => {
        var comparison;
        if (a.IsRecommended > b.IsRecommended) {
          comparison = -1;
        } else if (b.IsRecommended > a.IsRecommended) {
          comparison = 1;
        }
        return comparison;
      });

      let exchangeResp: any = res[1];
      this._currencyControl.setExchangeRateList(exchangeResp.returnObject);
      this._cookieService.deleteCookies();
      this.currenyFlags(true);
    }
  }
  // LCL FUNCTIONS

  // GLOBAL FUNCTIONS

  setProviderRates(baseCurrencyID: number, type) {
    this._dropdownService.getExchangeRateList(baseCurrencyID).subscribe(
      (res: any) => {
        let exchangeRate: ExchangeRate = res.returnObject;
        this._currencyControl.setExchangeRateList(exchangeRate);
        if (type === "warehouse") {
          if (this.mainsearchResult && this.mainsearchResult.length > 0) {
            let searchResultData: any = this.searchResult;
            try {
              this.x++;
              searchResultData = this._currencyControl.applyCurrencyRateOnSearchResult(
                this._currencyControl.getCurrencyID(),
                exchangeRate,
                null,
                searchResultData
              );
              this.searchResult = searchResultData;

              this._dataService.searchResultFiltered = searchResultData;
              let mainSearchResult: any = this.mainsearchResult;
              mainSearchResult = this._currencyControl.applyCurrencyRateOnSearchResult(
                this._currencyControl.getCurrencyID(),
                exchangeRate,
                null,
                mainSearchResult
              );
              this._store.dispatch(
                new fromWarehousing.UpdateWarehousingViewSearchResult(
                  searchResultData
                )
              );
              this._store.dispatch(
                new fromWarehousing.UpdateWarehousingMainSearchResult(
                  mainSearchResult
                )
              );
              loading(false);
            } catch (err) {
              loading(false);
              const { title, text } = currErrMsg;
              this._toast.error(text, title);
            }
          }
        } else if (type === "fcl") {
          if (this.mainsearchResult && this.mainsearchResult.length > 0) {
            let searchResultData: any = this.searchResult;
            searchResultData = this._currencyControl.applyCurrencyRateOnSearchResult(
              this._currencyControl.getCurrencyID(),
              exchangeRate,
              searchResultData,
              null
            );
            this.searchResult = searchResultData;
            let mainSearchResult: any = this.mainsearchResult;
            mainSearchResult = this._currencyControl.applyCurrencyRateOnSearchResult(
              this._currencyControl.getCurrencyID(),
              exchangeRate,
              mainSearchResult,
              null
            );
            this._store.dispatch(
              new fromFclShipping.UpdateFCLShippingViewSearchResult(
                searchResultData
              )
            );
            this._store.dispatch(
              new fromFclShipping.UpdateFCLShippingMainSearchResult(
                mainSearchResult
              )
            );
          }
        } else if (type === "air") {
          console.log('yolo');
          if (this.mainsearchResult && this.mainsearchResult.length > 0) {
            let searchResultData: any = this.searchResult;
            searchResultData = this._currencyControl.applyCurrencyRateOnSearchResult(
              this._currencyControl.getCurrencyID(),
              exchangeRate,
              null,
              searchResultData
            );
            let mainProvidersData: any = this.mainsearchResult;
            mainProvidersData = this._currencyControl.applyCurrencyRateOnSearchResult(
              this._currencyControl.getCurrencyID(),
              exchangeRate,
              null,
              mainProvidersData
            );
            this._store.dispatch(
              new fromLclAir.UpdateLCLAirViewSearchResult(this.searchResult)
            );
            this._store.dispatch(
              new fromLclAir.UpdateLCLAirMainSearchResult(this.mainsearchResult)
            );
          } else {

          }
        } else if (type === "lcl") {
          if (this.mainsearchResult && this.mainsearchResult.length > 0) {
            let searchResultData: any = this.searchResult;
            let mainSearchResult: any = this.mainsearchResult;
            mainSearchResult = this._currencyControl.applyCurrencyRateOnSearchResult(
              this._currencyControl.getCurrencyID(),
              exchangeRate,
              null,
              mainSearchResult
            );
            this._store.dispatch(
              new fromLclShipping.UpdateLCLShippingViewSearchResult(
                searchResultData
              )
            );
            this._store.dispatch(
              new fromLclShipping.UpdateLCLShippingMainSearchResult(
                mainSearchResult
              )
            );
          }
        }
      },
      (error: HttpErrorResponse) => {
        this._toast.error(error.message, "Failed");
      }
    );
  }
  x = 0;

  getPortDetails() {
    let ports = JSON.parse(HashStorage.getItem("shippingPortDetails"));
    this.ports = ports;
  }
  // GLOBAL FUNCTIONS

  ngOnDestroy() {
    this.$fclSearchResults.subscribe().unsubscribe();
    this.$fclProviderResults.subscribe().unsubscribe();
    this.$warehouseSearchResults.subscribe().unsubscribe();
    this.$lclSearchResults.subscribe().unsubscribe();
    this.$fclAirShippingSearchResults.subscribe().unsubscribe();
    this.$fclAirSearchResults.subscribe().unsubscribe();
    // window.removeEventListener("scroll", this.scrolling, true);
  }

  openQuoteDialog() {
    const modalRef = this._modalServive.open(RequestForQuoteComponent, { size: 'lg', backdrop: 'static', keyboard: false });
    modalRef.componentInstance.data = null
    modalRef.result.then((result: string) => {
    })
  }
}
