import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../components/user/user-service';
import { HashStorage, changeCase } from '../../../constants/globalfunctions';
import { BookingDetails } from '../../../interfaces/bookingDetails';
import { Router, ActivatedRoute } from "@angular/router";
import { PlatformLocation } from '@angular/common';
import { DataService } from '../../../services/commonservice/data.service';
import { SearchCriteria } from '../../../interfaces/searchCriteria';
import { CurrencyControl } from '../../currency/currency.injectable';
import { DropDownService } from '../../../services/dropdownservice/dropdown.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ExchangeRate } from '../../../interfaces/currencyDetails';

@Component({
  selector: 'app-confirm-booking-dialog',
  templateUrl: './confirm-booking-dialog.component.html',
  styleUrls: ['./confirm-booking-dialog.component.scss']
})
export class ConfirmBookingDialogComponent implements OnInit {

  isRouting: boolean;
  @Input() bookingId: number;
  @Input() bookingType: string;
  public themeWrapper = document.querySelector('body');
  constructor(
    private _activeModal: NgbActiveModal,
    private _userService: UserService,
    private _router: Router,
    private location: PlatformLocation,
    private _dataService: DataService,
    private _currencyControl: CurrencyControl,
    private _dropDownService: DropDownService
  ) {
    location.onPopState(() => this.closeModal());
  }

  ngOnInit() {
  }
  onConfirmClick() {
    this.isRouting = true;
    this._userService.continueBooking(this.bookingId).subscribe((res: any) => {
      if (res.returnId > 0) {
        this._dropDownService.getExchangeRateList(this._currencyControl.getBaseCurrencyID()).subscribe((res2: any) => {

          try {
            let bookingInfo: BookingDetails = JSON.parse(res.returnText);
            this._currencyControl.setCurrencyCode(bookingInfo.CurrencyCode)
            this._currencyControl.setCurrencyID(bookingInfo.CurrencyID)

            this._currencyControl.setExchangeRateList(res2.returnObject)

            let exchnageRate = res2.returnObject.rates.filter(rate => rate.currencyID === this._currencyControl.getCurrencyID())[0]
            this._currencyControl.setExchangeRate(exchnageRate.rate)
            if (!HashStorage.getItem('CURR_MASTER')) {
              HashStorage.setItem('CURR_MASTER', JSON.stringify(this._currencyControl.getMasterCurrency()))
            }
            let masterCurrency = JSON.parse(HashStorage.getItem('CURR_MASTER'))
            this._currencyControl.setMasterCurrency(masterCurrency)

            this.isRouting = false;
            HashStorage.removeItem('selectedCarrier')

            HashStorage.setItem('CURR_MASTER', JSON.stringify(this._currencyControl.getMasterCurrency()))
            const oldSearchCriteria: SearchCriteria = JSON.parse(bookingInfo.JsonSearchCriteria)
            let searchCriteria = oldSearchCriteria
            searchCriteria.criteriaFrom = 'booking'
            HashStorage.setItem("searchCriteria", JSON.stringify(searchCriteria));
            this._dataService.providerImage.next(bookingInfo.ProviderImage)
            localStorage.setItem('partnerId', bookingInfo.ProfileID)
            // HashStorage.setItem("bookingInfo", JSON.stringify(bookingInfo));
            bookingInfo.isConinueBooking = true
            bookingInfo.BookingType = (this.bookingType.toLowerCase() === 'specialrequest') ? 'specialrequest' : 'normal'
            if (bookingInfo.JsonCustomerSettting) {
              HashStorage.setItem('hasSettings', JSON.stringify(1))
              const parsedSettings = changeCase(JSON.parse(bookingInfo.JsonCustomerSettting), 'camel')
              HashStorage.setItem('customerSettings', JSON.stringify(parsedSettings))
              this.globalOverride(parsedSettings)
            } else {
              const customerSettings = {
                customerCode: 'hashmove',
                customerFooterColor: '#1a1c27',
                customerFooterTextColor: '#97a5b1',
                customerForeColorPrimary: '#fff',
                customerForeColorSecondary: '#000',
                customerID: 0,
                customerPortalTitle: 'Digital Logistisc Portal',
                customerPrimaryBGImage: '../assets/images/bg-img.jpg',
                customerPrimaryColor: '#fff',
                customerPrimaryGradientColor: '#3fbefc',
                customerPrimaryLogo: '../assets/images/hm-symbol-w.svg',
                customerSecondarGradientColor: '#37b7f9',
                customerSecondaryBGImage: '../assets/images/bg-img.jpg',
                customerSecondaryColor: '#02bdb6',
                customerSecondaryLogo: '../assets/images/hm-symbol.svg',
                customerType: 'USER',
                cutomerBannerTabsOverlay: '#000',
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
                portalName: 'MARKETPLACE'
              }
              HashStorage.setItem('hasSettings', JSON.stringify(0))
              HashStorage.setItem('customerSettings', JSON.stringify(customerSettings))
              this.globalOverride(customerSettings)
            }
            this._dataService.setBookingsData(bookingInfo);
            try {
              HashStorage.removeItem('selectedCarrier');
              this._router.navigate(["booking-process"]);
            } catch (error) {
            }
          } catch (error) {
          }
          this.closeModal();
        }, (error: HttpErrorResponse) => {

          this.closeModal();
        })

      } else {
        this.isRouting = false;
      }
    }, error => {
      this.closeModal();
    });
  }


  /**
   * Global Override Colors
   *
   * @param {*} stylesheet
   * @memberof ConfirmBookingDialogComponent
   */
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

  closeModal() {
    if (this.isRouting) {
      return
    }
    this._activeModal.close();
    document.getElementsByTagName('html')[0].style.overflowY = 'auto';
  }

  // setOldSearchCriteria() {
  //    let searchCriteria: any = {
  //         SearchCriteriaContainerDetail: generateContDetails(
  //           bookingInfo,
  //           FillingMode.BookingDetails_To_OrderSummary
  //         ),
  //         shippingSubCatID: bookingInfo.ShippingSubCatID,
  //         shippingModeID: bookingInfo.ShippingModeID,
  //         shippingCatID: bookingInfo.ShippingCatID,
  //         containerLoad: bookingInfo.ContainerLoad,
  //         pickupPortCode: bookingInfo.PolCode,
  //         deliveryPortCode: bookingInfo.PodCode,
  //         pickupDate: bookingInfo.EtdUtc,
  //         bookingCategoryID: 0,
  //         deliveryPortID: bookingInfo.PodID,
  //         deliveryPortName: bookingInfo.PodName,
  //         pickupFlexibleDays: 3,
  //         pickupPortID: bookingInfo.PolID,
  //         pickupPortName: bookingInfo.PolName,
  //         InsuredGoodsPrice: bookingInfo.InsuredGoodsPrice,
  //         InsuredGoodsCurrencyID: bookingInfo.InsuredGoodsCurrencyID,
  //         InsuredGoodsCurrencyCode: bookingInfo.InsuredGoodsCurrencyCode,
  //         InsuredGoodsProviderID: bookingInfo.InsuredGoodsProviderID,
  //         SearchCriteriaTransportationDetail: [
  //           {
  //             modeOfTransportID: bookingInfo.ShippingModeID,
  //             modeOfTransportCode: bookingInfo.ShippingModeCode,
  //             modeOfTransportDesc: bookingInfo.ShippingModeName
  //           }
  //         ]
  //       }; // let searchCriteria: any = {
  //         SearchCriteriaContainerDetail: generateContDetails(
  //           bookingInfo,
  //           FillingMode.BookingDetails_To_OrderSummary
  //         ),
  //         shippingSubCatID: bookingInfo.ShippingSubCatID,
  //         shippingModeID: bookingInfo.ShippingModeID,
  //         shippingCatID: bookingInfo.ShippingCatID,
  //         containerLoad: bookingInfo.ContainerLoad,
  //         pickupPortCode: bookingInfo.PolCode,
  //         deliveryPortCode: bookingInfo.PodCode,
  //         pickupDate: bookingInfo.EtdUtc,
  //         bookingCategoryID: 0,
  //         deliveryPortID: bookingInfo.PodID,
  //         deliveryPortName: bookingInfo.PodName,
  //         pickupFlexibleDays: 3,
  //         pickupPortID: bookingInfo.PolID,
  //         pickupPortName: bookingInfo.PolName,
  //         InsuredGoodsPrice: bookingInfo.InsuredGoodsPrice,
  //         InsuredGoodsCurrencyID: bookingInfo.InsuredGoodsCurrencyID,
  //         InsuredGoodsCurrencyCode: bookingInfo.InsuredGoodsCurrencyCode,
  //         InsuredGoodsProviderID: bookingInfo.InsuredGoodsProviderID,
  //         SearchCriteriaTransportationDetail: [
  //           {
  //             modeOfTransportID: bookingInfo.ShippingModeID,
  //             modeOfTransportCode: bookingInfo.ShippingModeCode,
  //             modeOfTransportDesc: bookingInfo.ShippingModeName
  //           }
  //         ]
  //       };
  // }
}
