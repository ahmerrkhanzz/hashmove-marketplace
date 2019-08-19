import { Component, OnInit, Renderer2, OnDestroy } from '@angular/core';
import { DataService } from '../../services/commonservice/data.service';
import { HashStorage, getProviderImage, ImageSource, ImageRequiredSize, getImagePath, loading, NavigationUtils } from '../../constants/globalfunctions';
import { ShippingArray } from '../../interfaces/shipping.interface';
import { PagesService } from '../pages.service';
import { HttpErrorResponse } from '@angular/common/http';
import { VendorProfileService } from './vendor-profile.service'
import { ActivatedRoute, Router } from '@angular/router';
import { ShippingService } from '../main/shipping/shipping.service';
import { ToastrService } from 'ngx-toastr';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingDialogueComponent } from './booking-dialogue/booking-dialogue.component';
import { UpdatePasswordComponent } from '../../shared/dialogues/update-password/update-password.component';
import { JsonResponse } from '../../interfaces/JsonResponse';
import { CurrencyControl } from '../../shared/currency/currency.injectable';

@Component({
  selector: "app-vendor-profile",
  templateUrl: "./vendor-profile.component.html",
  styleUrls: ["./vendor-profile.component.scss"]
})
export class VendorProfileComponent implements OnInit, OnDestroy {
  public showSearchComponent: boolean = false;
  public mainImages;
  public subImages;
  public subSubImages;
  public containers;
  public providerResponse: IVendorProfile;
  public providerReviews: any;
  public responseObj: any = {};
  public searchCriteria: any;
  public showVendorDetails: boolean = true;
  public themeWrapper = document.querySelector('body');
  constructor(
    private renderer: Renderer2,
    private _router: Router,
    private _dataService: DataService,
    private _pagesService: PagesService,
    private _vendorService: VendorProfileService,
    private _shippingService: ShippingService,
    private route: ActivatedRoute,
    private _toast: ToastrService,
    private _modalService: NgbModal,
    private _currencyControl: CurrencyControl
  ) {
    this.route.params.pipe(untilDestroyed(this)).subscribe(params => {
      // let param = parseInt(params.id);
      HashStorage.setItem('partnerId', params.id)
      this.getProviderInfo(params.id);
      // this.getProviderReviews(param)
    });
  }

  ngOnInit() {
    this._dataService.switchBranding.next('partner')
    this.renderer.addClass(document.body, "bg-grey");
    this.renderer.removeClass(document.body, "bg-white");
    this.renderer.removeClass(document.body, "bg-lock-grey");
    // this.checkScroll()

    this.getPortDetails();
    this._dataService.closeBookingModal
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this._dataService.reloadSearchHeader.next(true)
      });

    this._dataService.providerNavigation.subscribe((res) => {
      if (res) {
        this.showVendorDetails = true;
      }
    })
  }
  getShippingDetails() {
    if (HashStorage) {
      this.searchCriteria = JSON.parse(HashStorage.getItem("searchCriteria"));
      this._pagesService
        .getShippingData()
        .pipe(untilDestroyed(this))
        .subscribe(
          (res: any) => {
            this.setShippingCriteria(res);
          },
          (err: HttpErrorResponse) => { }
        );
    }
  }
  getPortDetails() {
    loading(true);
    this._shippingService
      .getPortsData()
      .pipe(untilDestroyed(this))
      .subscribe(
        (res: any) => {
          loading(false);
          HashStorage.setItem("shippingPortDetails", JSON.stringify(res));
        },
        (err: HttpErrorResponse) => { }
      );
  }

  setShippingCriteria(res) {
    let result = JSON.parse(res.returnText);
    console.log(result)
    if (res.returnId === 1) {
      try {
        result.forEach(shipping => {
          shipping.isEnabled = true;
        });
      } catch (error) { }
      HashStorage.setItem('shippingCategories', JSON.stringify(result));
      try {
        this.setImages(result)
      } catch (error) {
      }
    }
  }

  async setImages(shipArray: ShippingArray[]) {
    let newMain = [];
    let newSubImages = [];
    let newSubSubImages = [];
    let newContainers = [];

    shipArray.forEach(ship => {
      newMain.push(ship.ShippingModeImage);
    });
    shipArray.forEach(ship => {
      if (ship.ShippingCriteriaCat && ship.ShippingCriteriaCat.length > 0) {
        ship.ShippingCriteriaCat.forEach(sub => {
          if (sub.ShippingCatImage) {
            newSubImages.push(sub.ShippingCatImage);
          } else {
            newSubImages.push("GeneralCargo.png");
          }
        });
      }
    });
    shipArray.forEach(ship => {
      if (ship.ShippingCriteriaCat && ship.ShippingCriteriaCat.length > 0) {
        ship.ShippingCriteriaCat.forEach(sub => {
          if (
            sub.ShippingCriteriaSubCat &&
            sub.ShippingCriteriaSubCat.length > 0
          ) {
            sub.ShippingCriteriaSubCat.forEach(subSub => {
              if (subSub.ShippingSubCatImage) {
                newSubSubImages.push(subSub.ShippingSubCatImage);
              } else {
                newSubSubImages.push("GeneralCargo.png");
              }
            });
          }
        });
      }
    });

    shipArray.forEach(ship => {
      if (ship.ShippingCriteriaCat && ship.ShippingCriteriaCat.length > 0) {
        ship.ShippingCriteriaCat.forEach(sub => {
          if (
            sub.ShippingCriteriaSubCat &&
            sub.ShippingCriteriaSubCat.length > 0
          ) {
            sub.ShippingCriteriaSubCat.forEach(subSub => {
              if (subSub.Containers && subSub.Containers.length > 0) {
                subSub.Containers.forEach(container => {
                  newContainers.push(container.ContainerSpecImage);
                });
              }
            });
          }
        });
      }
    });
    this.mainImages = newMain;
    this.subImages = newSubImages;
    this.subSubImages = newSubSubImages;
    this.containers = newContainers;
  }

  getProviderInfo(id) {
    this._vendorService.getProviderDetails(id).pipe(untilDestroyed(this)).subscribe((res: JsonResponse) => {
      if (res.returnId > 0) {
        NavigationUtils.SET_CURRENT_NAV(`partner/${id}`)
        this.responseObj = res;
        this.providerResponse = this.responseObj.returnObject
        if (res.returnText && JSON.parse(res.returnText)) {
          this._dataService.isNVOCCActive.next(true)
          this.setNVOCC(res)
        } else {
          // if (HashStorage.getItem('customerSettings')) {
          //   HashStorage.removeItem('customerSettings')
          // }
          this._dataService.isNVOCCActive.next(false)
          this.getShippingDetails();
        }

        this.getProviderReviews(this.providerResponse.ProviderID)
        HashStorage.setItem('selectedProvider', JSON.stringify(this.providerResponse));
        this._dataService.providerImage.next(this.providerResponse.ProviderImage)
      } else {
        NavigationUtils.SET_CURRENT_NAV('not-found')
        this._router.navigate(['not-found'])
        this._toast.info(res.returnText, 'Info')
      }
    }, err => {
    })
  }

  setNVOCC(res: JsonResponse) {
    const customerSettings: CustomerSettings = JSON.parse(res.returnText)
    this._pagesService.getCustomerShippingData(customerSettings.customerID, 'PROVIDER').subscribe((res: any) => {
      this.setShippingCriteria(res);
    })
    HashStorage.setItem('customerSettings', res.returnText)
    this.globalOverride(customerSettings)
  }


  getProviderReviews(id) {
    this._vendorService
      .getProviderReviews(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        res => {
          this.responseObj = res;
          this.providerReviews = this.responseObj.returnObject;
        },
        (err: HttpErrorResponse) => {
          const { message } = err;
        }
      );
  }

  /**
   *
   * Event Emitter for checking search result
   * @param {boolean} event
   * @memberof VendorProfileComponent
   */
  getSearchResults(event) {
    this.showVendorDetails = !event;
  }


  /**
   *
   * Event Emitter for Modify Search on Vendor Profile
   * @param {boolean} event
   * @memberof VendorProfileComponent
   */
  isModify(event) {
    const modalReference = this._modalService.open(BookingDialogueComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'booking-modal',
      backdrop: 'static',
      keyboard: false
    });
    this.searchCriteria = JSON.parse(HashStorage.getItem("searchCriteria"));
    modalReference.componentInstance.type = (this.searchCriteria.searchMode === 'warehouse-lcl' ? 'warehouse' : 'shipping')
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }


  /**
   * Open Forgot Password Dialogue from Email
   *
   * @memberof VendorProfileComponent
   */
  updatePasswordModal() {
    this._modalService.open(UpdatePasswordComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'small-modal',
      backdrop: 'static',
      keyboard: false
    });
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  ngAfterViewInit() {
    if (this.route.snapshot.queryParams.code) {
      this.updatePasswordModal();
    }
  }

  globalOverride(stylesheet) {
    if (stylesheet.customerPrimaryColor) {
      this.themeWrapper.style.setProperty('--customerPrimaryColor', stylesheet.customerPrimaryColor);
    }
    if (stylesheet.customerSecondaryColor) {
      this.themeWrapper.style.setProperty('--customerSecondaryColor', stylesheet.customerSecondaryColor);
    }
    if (stylesheet.customerForeColorPrimary) {
      this.themeWrapper.style.setProperty('--customerForeColorPrimary', stylesheet.customerForeColorPrimary);
    }
    if (stylesheet.customerForeColorSecondary) {
      this.themeWrapper.style.setProperty('--customerForeColorSecondary', stylesheet.customerForeColorSecondary);
    }
    if (stylesheet.customerFooterColor) {
      this.themeWrapper.style.setProperty('--customerFooterColor', stylesheet.customerFooterColor);
    }
    if (stylesheet.customerFooterTextColor) {
      this.themeWrapper.style.setProperty('--customerFooterTextColor', stylesheet.customerFooterTextColor);
    }
  }

  ngOnDestroy() {
    try {
      HashStorage.removeItem("partnerURL");
    } catch (error) { }
  }
}


export interface CustomerSettings {
  customerID: number;
  customerCode: string;
  customerType: string;
  customerPrimaryColor: string;
  customerSecondaryColor: string;
  customerPrimaryGradientColor: string;
  customerSecondarGradientColor: string;
  customerForeColorPrimary: string;
  customerForeColorSecondary: string;
  customerFooterColor: string;
  customerFooterTextColor: string;
  cutomerBannerTabsOverlay: string;
  customerPrimaryBGImage: string;
  customerSecondaryBGImage: string;
  customerPrimaryLogo: string;
  customerSecondaryLogo: string;
  customerPortalTitle: string;
  isSeaPortRequired: boolean;
  isSeaCityRequired: boolean;
  isSeaDoorRequired: boolean;
  isAirPortRequired: boolean;
  isAirCityRequired: boolean;
  isAirDoorRequired: boolean;
  isGroundPortRequired: boolean;
  isGroundCityRequired: boolean;
  isGroundDoorRequired: boolean;
  isBookShipmentRequired: boolean;
  isBookWarehouseRequired: boolean;
  isTrackShipmentRequired: boolean;
  isPartnerWithUsRequired: boolean;
}

export interface IVendorProfile {
  ProviderID?: number;
  ProviderName?: string;
  ProviderPhone?: string;
  ProviderRating?: any;
  ProviderVerified?: any;
  ProviderImage?: string;
  ProviderEmail?: string;
  ProviderAddress?: string;
  ProviderAddressLine2?: any;
  ProviderWebAdd?: string;
  ProviderBusinessStartDate?: any;
  FaxNo?: any;
  POBox?: string;
  City?: any;
  About?: string;
  ProfileID?: string;
  TotalBooking?: number;
  TotalReviews?: number;
  ProviderGallery?: string;
  AwdCrtfGallery?: string;
  CoBusinessLogic?: string;
  LogisticServices?: ILogisticService[];
  Affiliations?: any;
  CurrencyID?: number;
  CurrencyCode?: string;
}
export interface ILogisticService {
  LogServName: string;
  ImageName: string;
}
