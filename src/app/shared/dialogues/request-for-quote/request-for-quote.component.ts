import { Component, OnInit, Input, ViewChild, OnDestroy, EventEmitter, AfterViewInit } from '@angular/core';
import { NgbActiveModal, NgbDate, NgbDateStruct, NgbDateParserFormatter, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DropDownService } from '../../../services/dropdownservice/dropdown.service';
import { Observable, of } from 'rxjs';
import { City, WarehouseSearchCriteria } from '../../../interfaces/warehousing';
import * as moment from 'moment'
import { HashStorage, isUserLogin, getLoggedUserData, Tea, loading } from '../../../constants/globalfunctions';
import { JsonResponse } from '../../../interfaces/JsonResponse';
import { HttpErrorResponse } from '@angular/common/http';
import { ShippingService } from '../../../components/main/shipping/shipping.service';
import { LclChip } from '../../../interfaces/shipping.interface';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { IVendorProfile } from '../../../interfaces/warehouse.interface';
import { SearchResultService } from '../../../components/search-results/fcl-search/fcl-search.service';
import { CodeValMst, CodeValMstModel } from '../../../components/user/reports/resports.interface';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ISlimScrollOptions } from "ngx-slimscroll/dist/app/ngx-slimscroll/classes/slimscroll-options.class";
import { SlimScrollEvent } from "ngx-slimscroll";
import { SearchCriteria } from '../../../interfaces/searchCriteria';
import { NgbDateFRParserFormatter } from '../../../constants/ngb-date-parser-formatter';


@Component({
  selector: "app-request-for-quote",
  templateUrl: "./request-for-quote.component.html",
  styleUrls: ["./request-for-quote.component.scss"],
  providers: [{ provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter }]
})
export class RequestForQuoteComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() data: any;

  public city: City = {
    desc: "",
    id: null,
    imageName: "",
    shortName: "",
    title: ""
  };

  submitted: boolean = false;
  neightBourhood: string = "";

  opts: ISlimScrollOptions = {
    position: "right",
    barBackground: "#C9C9C9",
    barOpacity: "0.8",
    barWidth: "5",
    barBorderRadius: "20",
    barMargin: "0",
    gridBackground: "#D9D9D9",
    gridOpacity: "1",
    gridWidth: "2",
    gridBorderRadius: "20",
    gridMargin: "0",
    alwaysVisible: true
  };
  scrollEvents: EventEmitter<SlimScrollEvent>;

  warehousetypes: Array<string> = ["SHARED", "FULL", "DEDICATED"];
  selectedWarehouseType: any = "SHARED";

  isDry: boolean = false;
  isCold: boolean = false;

  activeUnitTabId = "by_pallet";

  minDate: any;
  maxDate: any;

  isCitySearching: boolean = false;
  hasCitySearchFailed: boolean = false;
  hasCitySearchSuccess: boolean = false;

  @ViewChild("d") eventDate: any;
  @ViewChild("calenderField") calenderField: any;
  @ViewChild("elCity") elCity: any;
  optComments: string;

  hoveredDate: NgbDate;
  public fromDate = {
    day: null,
    month: undefined,
    year: undefined
  };
  public toDate = {
    day: undefined,
    month: undefined,
    year: undefined
  };

  public lengthUnits: Array<UnitTypes> = [];
  public weightUnits: Array<UnitTypes> = [];
  public volumeUnits: Array<UnitTypes> = [];
  public areaUnits: Array<UnitTypes> = [];
  public selectedLengthUnit: number;
  public selectedLengthUnitID: number = 2;
  public selectedWeightUnitID: number = 6;
  public selectedVolumeUnitID: number = 9;
  public selectedAreaUnitID: number = 13;
  public warehouseData: LclChip = {
    stackable: false,
    tempControl: false,
    bonded: false,
    quantity: null,
    length: null,
    height: null,
    width: null,
    area: null,
    totalWeight: null,
    totalWeightUnit: this.selectedWeightUnitID,
    lengthUnit: this.selectedLengthUnitID,
    weightUnit: this.selectedWeightUnitID,
    volumeUnit: this.selectedVolumeUnitID,
    areaUnit: this.selectedAreaUnitID
  };
  public subWarehouseTabID: string = "by_pallet";
  public srch_lease_term: Array<CodeValMst> = [];
  public selected_srch_lease_term: CodeValMst = new CodeValMstModel();
  public srch_spce_req: Array<CodeValMst> = [];
  public selected_srch_spce_req: CodeValMst = new CodeValMstModel();
  public currentJustify: string = "justified";
  public isTcsWarehouse: boolean = false;

  constructor(
    private _activeModal: NgbActiveModal,
    private _dropdownservice: DropDownService,
    private _parserFormatter: NgbDateParserFormatter,
    private _shippingService: ShippingService,
    private _modalService: NgbModal,
    private _toastr: ToastrService,
    private _searchResultService: SearchResultService
  ) {
    this.fromDate = null;
    this.toDate = null;
  }

  searchCriteria: WarehouseSearchCriteria = null

  ngOnInit() {
    this.searchCriteria = JSON.parse(HashStorage.getItem('searchCriteria'))
    if (location.href.includes("tcs")) {
      this.isTcsWarehouse = true;
    }
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();

    this.setDate();
    this.getWarehousingUnits();
    this.setMSTLists();
  }

  ngAfterViewInit() {
    this.setPreData()
  }

  setPreData() {



    this.elCity.nativeElement.value = this.searchCriteria.CityName

    switch (this.searchCriteria.storageType.toLowerCase()) {
      case 'full':
        this.selectedWarehouseType = 'FULL'
        break;
      case 'shared':
        this.selectedWarehouseType = 'SHARED'
        break;
      default:
        this.selectedWarehouseType = 'DEDICATED'
        break;
    }

    this.subWarehouseTabID = this.searchCriteria.subWarehouseTabID
    this.city = this.searchCriteria.cityObj

    if (this.selectedWarehouseType === 'FULL') {
      // this.selected_srch_lease_term = this.searchCriteria.minimumLeaseTerm
    } else {
      this.warehouseData = this.searchCriteria.SearchLog
      const parsed: string = this._parserFormatter.format(this.searchCriteria.pickupDate) + " - " + this._parserFormatter.format(this.searchCriteria.deliveryDate);
      this.fromDate = this.searchCriteria.pickupDate
      this.toDate = this.searchCriteria.deliveryDate
      this.calenderField.nativeElement.value = parsed;
    }
  }

  setDate() {
    try {
      let date = new Date();
      this.minDate = {
        month: date.getMonth() + 1,
        day: date.getDate(),
        year: date.getFullYear()
      };
      this.maxDate = {
        year:
          this.minDate.month === 12 && this.minDate.day >= 17
            ? date.getFullYear() + 1
            : date.getFullYear(),
        month:
          moment(date)
            .add(30, "days")
            .month() + 1,
        day: moment(date)
          .add(30, "days")
          .date()
      };
    } catch (error) {
      console.log(error);
    }
  }

  closeModal(payload: any) {
    this._activeModal.close(payload);
  }

  search2 = (text$: Observable<string>) =>
    text$
      .debounceTime(300) //debounce time
      .distinctUntilChanged()
      .do(() => {
        this.isCitySearching = true;
        this.hasCitySearchFailed = false;
        this.hasCitySearchSuccess = false;
      }) // do any action while the user is typing
      .switchMap(term => {
        let some = of([]); //  Initialize the object to return
        if (term && term.length >= 3) {
          //search only if item are more than three
          some = this._dropdownservice
            .getFilteredCity(term)
            .do(res => {
              this.isCitySearching = false;
              this.hasCitySearchSuccess = true;
              return res;
            })
            .catch(() => {
              this.isCitySearching = false;
              this.hasCitySearchFailed = true;
              return [];
            });
        } else {
          this.isCitySearching = false;
          some = of([]);
        }
        return some;
      })
      .do(res => {
        this.isCitySearching = false;
        return res;
      })
      .catch(() => {
        this.isCitySearching = false;
        return of([]);
      }); // final server list

  formatter = (x: {
    title: string;
    desc: string;
    imageName: string;
    shortName: string;
    id: number;
  }) => {
    this.city.shortName = x.shortName;
    this.city.id = x.id;
    this.city.imageName = x.imageName;
    this.city.title = x.title;
    this.city.desc = x.desc;
    return x.title;
  };

  onCitySelect({ target }, city) {
    if (target.value === "") {
      this.city = {};
    }
  }

  onTypeSelect($type: string) {
    if ($type) {
      this.warehouseData.quantity = 0;
      this.warehouseData.area = 0;
      this.selectedWarehouseType = $type;
    }
  }

  onDateSelection(date: NgbDateStruct) {
    let parsed = "";
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && after(date, this.fromDate)) {
      this.toDate = date;
      // this.model = `${this.fromDate.year} - ${this.toDate.year}`;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
    if (this.fromDate) {
      parsed += this._parserFormatter.format(this.fromDate);
    }
    if (this.toDate) {
      parsed += " - " + this._parserFormatter.format(this.toDate);
      this.showbutton();
    }
    console.log(parsed);
    setTimeout(() => {
      this.calenderField.nativeElement.value = parsed;
    }, 100);
  }

  isHovered = date =>
    this.fromDate &&
    !this.toDate &&
    this.hoveredDate &&
    after(date, this.fromDate) &&
    before(date, this.hoveredDate);
  isInside = date => after(date, this.fromDate) && before(date, this.toDate);
  isFrom = date => equals(date, this.fromDate);
  isTo = date => equals(date, this.toDate);

  showbutton() {
    try {
      this.eventDate.toggle();
    } catch (error) { }
  }

  getWarehousingUnits() {
    if (!HashStorage.getItem("units")) {
      this._shippingService.getLCLUnits().subscribe(
        (res: JsonResponse) => {
          this.setWarehousingUnits(res.returnObject);
          HashStorage.setItem("units", JSON.stringify(res.returnObject));
        },
        (err: HttpErrorResponse) => { }
      );
    } else {
      this.setWarehousingUnits(JSON.parse(HashStorage.getItem("units")));
    }
  }

  setWarehousingUnits(unitsResponse) {
    this.lengthUnits = unitsResponse.filter(e => e.UnitTypeNature === "LENGTH");
    this.weightUnits = unitsResponse.filter(e => e.UnitTypeNature === "WEIGHT");
    this.volumeUnits = unitsResponse.filter(e => e.UnitTypeNature === "VOLUME");
    this.areaUnits = unitsResponse.filter(e => e.UnitTypeNature === "AREA");
    this.selectedLengthUnit = parseInt(this.lengthUnits[1].UnitTypeID);
  }

  onUnitChange(event, type) {
    event = parseInt(event);
    if (type === "length") {
      this.warehouseData.lengthUnit = event;
      this.selectedLengthUnitID = event;
    } else if (type === "weight") {
      this.warehouseData.weightUnit = event;
      this.selectedWeightUnitID = event;
    } else if (type === "volume") {
      this.warehouseData.volumeUnit = event;
      this.selectedVolumeUnitID = event;
    } else if (type === "area") {
      this.warehouseData.areaUnit = event;
      this.selectedAreaUnitID = event;
    } else if (type === "totalWeight") {
      this.warehouseData.totalWeightUnit = event;
      this.selectedWeightUnitID = event;
    }
  }

  onSubmit() {

    const hasShareDate: boolean = (this.fromDate && this.fromDate.day) ? true : false
    const hasFullDate: boolean = (this.selected_srch_spce_req.codeValID && this.selected_srch_spce_req.codeValID > 0) ? true : false

    const hasDate = (this.selectedWarehouseType === 'FULL') ? hasFullDate : hasShareDate
    const hasSelectedOption: boolean = (this.isCold || this.isDry) ? true : false


    console.log('asd');

    if (
      !this.city ||
      !this.neightBourhood ||
      !hasDate ||
      !this.selectedWarehouseType ||
      !hasSelectedOption
    ) {
      this._toastr.warning("Some Fields are empty", "Warning");
      return;
    }

    console.log(this.warehouseData);

    const PLT = this.warehouseData.quantity ? this.warehouseData.quantity : 0;

    const AREA = (this.warehouseData.area && this.warehouseData.area > 0) ? this.warehouseData.area : 0;
    const AREA_UNIT = this.warehouseData.areaUnit ? this.areaUnits.filter(unit => unit.UnitTypeID === this.warehouseData.areaUnit)[0].UnitTypeCode : "N/A";

    const WEIGHT = (this.warehouseData.totalWeight && this.warehouseData.totalWeight > 0) ? this.warehouseData.totalWeight : 0;
    const WEIGHT_UNIT = this.warehouseData.totalWeight ? this.weightUnits.filter(unit => unit.UnitTypeID === this.warehouseData.totalWeightUnit)[0].UnitTypeCode : "N/A";

    if (!PLT && !AREA && this.selectedWarehouseType !== 'FULL') {
      this._toastr.warning("Do select either Pallet or Area", "Warning");
      return;
    }
    let userItem = JSON.parse(Tea.getItem("loginUser"));
    if (!userItem || (userItem && userItem.IsLogedOut)) {
      const modalRef = this._modalService.open(LoginDialogComponent, {
        size: "lg",
        centered: true,
        windowClass: "small-modal"
      });
      modalRef.result.then(result => {
        if (result) {
          this._toastr.success("Logged in successfully.", "Success");
        }
      });
      return;
    } else {
      let hasVendor: boolean = false;
      let vendorData: IVendorProfile = null;
      const userData = getLoggedUserData();
      try {
        if (
          HashStorage.getItem("selectedProvider") &&
          JSON.parse(HashStorage.getItem("selectedProvider"))
        ) {
          hasVendor = true;
          vendorData = JSON.parse(HashStorage.getItem("selectedProvider"));
        }
      } catch (error) { }

      const strWeight = (WEIGHT && WEIGHT > 0) ? `| ${WEIGHT} ${WEIGHT_UNIT}` : ''

      const strPallet: string = (PLT && PLT > 0) ? `${PLT} Pallet(s) ${strWeight}` : 'Not Specified';
      const strArea: string = (this.selectedWarehouseType !== 'FULL') ? ((AREA && AREA > 0) ? `${AREA} ${AREA_UNIT} ${strWeight}` : 'Not Specified') : this.selected_srch_spce_req.codeValDesc;
      const strDate: string = (this.selectedWarehouseType !== 'FULL') ? this.fromDate.day + "-" + this.fromDate.month + "-" + this.fromDate.year + " to " + this.toDate.day + "-" + this.toDate.month + "-" + this.toDate.year
        : this.selected_srch_lease_term.codeValDesc;

      const toSend = {
        providerID: hasVendor ? vendorData.ProviderID : -1,
        providerCompanyName: hasVendor ? vendorData.ProviderName : -1,
        providerEmail: hasVendor ? vendorData.ProviderEmail : -1,
        userID: userData.UserID,
        userName: userData.FirstName + " " + userData.LastName,
        userCompanyName: (userData.UserCompanyName) ? userData.UserCompanyName : "N/A",
        userEmail: userData.PrimaryEmail,
        city: this.city.title,
        neighbourhood: this.neightBourhood,
        rentingPeriod: strDate,
        warehouseType: this.selectedWarehouseType,
        pallet: strPallet,
        area: strArea,
        userComments: this.optComments,
        isDry: this.isDry ? "Yes" : "No",
        isCold: this.isCold ? "Yes" : "No"
      };

      loading(true)
      this._searchResultService.sendWarehouseQuote(toSend).subscribe(
        (res: JsonResponse) => {
          loading(false)
          const { returnId, returnText, returnObject } = res;
          if (returnId > 0) {
            this.closeModal(null);
            this._toastr.success("Your request has been submitted", "Success");
            console.log(returnObject);
          } else {
            this._toastr.error(returnText, "Failed");
          }
        },
        error => {
          loading(false)
          this._toastr.error(
            "Error while processing request, please try again later"
          );
        }
      );
    }
  }

  counter(type) {
    if (type === "minus" && this.warehouseData.quantity > 0) {
      this.warehouseData.quantity--;
    } else {
      this.warehouseData.quantity++;
    }
  }

  onCheckChange($event: any, $type: string) {
    if ($type === "isDry") {
      this.isDry = $event;
      this.isCold = false;
    } else {
      this.isCold = $event;
      this.isDry = false;
    }
  }

  tabChangeEvent(event) {
    this.subWarehouseTabID = event.nextId;
    this.clearByUnitData();
    this.clearByAreaData();
    this.clearFullWarehouse();
  }

  clearByUnitData() {
    this.warehouseData.length = null;
    this.warehouseData.width = null;
    this.warehouseData.height = null;
    this.warehouseData.quantity = null;
    this.warehouseData.totalWeight = null;
  }

  clearByAreaData() {
    this.warehouseData.area = null;
    this.warehouseData.totalWeight = null;
    this.warehouseData.volume = null;
  }

  clearFullWarehouse() {
    this.selected_srch_lease_term = new CodeValMstModel();
    this.selected_srch_spce_req = new CodeValMstModel();
  }

  onDropDownEvent($action: string, $payload: CodeValMst) {
    if ($action.toLowerCase() === "srch_lease_term") {
      this.selected_srch_lease_term = $payload;
    }
    if ($action.toLowerCase() === "srch_spce_req") {
      this.selected_srch_spce_req = $payload;
    }
  }

  trackByFn(index: number, item: any) {
    return index;
  }

  async setMSTLists(): Promise<any> {
    const searchCriteria = JSON.parse(HashStorage.getItem("searchCriteria"));

    if (!this.srch_lease_term || this.srch_lease_term.length === 0) {
      this._dropdownservice
        .getMstCodeVal("SRCH_LEASE_TERM")
        .pipe(untilDestroyed(this))
        .subscribe(
          (res: any) => {
            this.srch_lease_term = res;
            try {
              const selectedLease = this.srch_lease_term.filter(
                res => res.codeValID === searchCriteria.leaseCodeId
              )[0];
              if (selectedLease) {
                this.selected_srch_lease_term = selectedLease;
              }
            } catch (error) { }
          },
          (error: HttpErrorResponse) => {
            const { message } = error;
          }
        );
    } else {
      try {
        const selectedLease = this.srch_lease_term.filter(
          res => res.codeValID === searchCriteria.leaseCodeId
        )[0];
        if (selectedLease) {
          this.selected_srch_lease_term = selectedLease;
        }
      } catch (error) { }
    }
    if (this.srch_spce_req || this.srch_spce_req.length === 0) {
      this._dropdownservice
        .getMstCodeVal("SRCH_SPCE_REQ")
        .pipe(untilDestroyed(this))
        .subscribe(
          (res: any) => {
            this.srch_spce_req = res;
            try {
              const selectedSize = this.srch_spce_req.filter(
                res => res.codeValID === searchCriteria.sizeCodeId
              )[0];
              if (selectedSize) {
                this.selected_srch_spce_req = selectedSize;
              }
            } catch (error) { }
          },
          (error: HttpErrorResponse) => {
            const { message } = error;
          }
        );
    } else {
      try {
        const selectedSize = this.srch_spce_req.filter(
          res => res.codeValID === searchCriteria.sizeCodeId
        )[0];
        if (selectedSize) {
          this.selected_srch_spce_req = selectedSize;
        }
      } catch (error) { }
    }
  }
  ngOnDestroy() { }
}

export interface UnitTypes {
  UnitTypeID?: any,
  UnitTypeCode?: string,
  UnitTypeName?: string,
  UnitTypeShortName?: string,
  UnitTypeNature?: string,
  UnitCalculation?: [
    {
      UnitTypeID?: number,
      UnitTypeCode?: string,
      UnitTypeCalc?: number
    }
  ]
}


const equals = (one: NgbDateStruct, two: NgbDateStruct) =>
  one &&
  two &&
  two.year === one.year &&
  two.month === one.month &&
  two.day === one.day;

const before = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two
    ? false
    : one.year === two.year
      ? one.month === two.month
        ? one.day === two.day
          ? false
          : one.day < two.day
        : one.month < two.month
      : one.year < two.year;

const after = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two
    ? false
    : one.year === two.year
      ? one.month === two.month
        ? one.day === two.day
          ? false
          : one.day > two.day
        : one.month > two.month
      : one.year > two.year;
