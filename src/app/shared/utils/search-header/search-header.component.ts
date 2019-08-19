import { Component, OnInit, Input, ChangeDetectionStrategy, OnDestroy, Output, EventEmitter } from '@angular/core';
import { DataService } from '../../../services/commonservice/data.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CancelBookingDialogComponent } from '../../dialogues/cancel-booking-dialog/confirm-booking-dialog.component';
import { ConfirmModifySearchComponent } from '../../dialogues/confirm-modify-search/confirm-modify-search.component';
import { LoginDialogComponent } from '../../dialogues/login-dialog/login-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { BookingService } from '../../../components/booking-process/booking.service'
import { HashStorage, Tea, createSaveObject, loading } from '../../../constants/globalfunctions';
import { BookingDetails, SaveBookingObject } from '../../../interfaces/bookingDetails';
import { DropDownService } from '../../../services/dropdownservice/dropdown.service';
import { ConfirmSavePaymentComponent } from '../../dialogues/confirm-save-payment/confirm-save-payment.component';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { HashmoveLocation } from '../../../interfaces/searchResult';
import { CurrencyControl } from '../../currency/currency.injectable';
import { CookieService } from '../../../services/cookies.injectable';

@Component({
  selector: 'app-search-header',
  templateUrl: './search-header.component.html',
  styleUrls: ['./search-header.component.scss'],
  providers: [BookingService, DropDownService]
})
export class SearchHeaderComponent implements OnInit, OnDestroy {
  public searchCriteria: any;
  public PickupDate: any;
  public DeliveryDate: any;
  public pickupCountry: string;
  public deliverCountry: string;
  public containersQty: number = 0;
  public orderSummary: BookingDetails
  public BookingContainerTypeDetail = [];
  userItem: any;
  public saveBookingObj: SaveBookingObject;
  public hashmoveLocation: HashmoveLocation = null

  @Input() name: string;
  @Input() buttons: boolean;
  @Input() strActiveTabId: string;
  @Input() page?: string;
  @Output() openModal?= new EventEmitter<any>();
  public taxData: any;
  public total: any;
  public subTotal: any;
  public currNav: string
  public partner: string;

  constructor(private _dataService: DataService,
    private _bookingService: BookingService,
    private _toast: ToastrService,
    private _router: Router,
    private _modalService: NgbModal,
    private _dropDownService: DropDownService,
    private _currencyControl: CurrencyControl,
    private _cookieService: CookieService
  ) {
  }

  ngOnInit() {
    if (!HashStorage) {
      this._router.navigate(['enable-cookies']);
      return
    }
    if (HashStorage) {
      this.getSearchCriteria();
      this.orderSummary = this._dataService.getBookingData()
      this.currNav = HashStorage.getItem('cur_nav')
      if (this.currNav.includes('partner')) {
        this.page = 'vendor'
      }
      if (this.currNav.includes('emkayline')) {
        this.partner = 'emkay'
      }
    }
    this._dataService.currentBokkingDataData.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.orderSummary = res;
      }
    });
    this._dataService.reloadSearchHeader.pipe(untilDestroyed(this)).subscribe(state => {
      if (state) {
        try {
          this.getSearchCriteria();
        } catch (error) { }
      }
    })

    this._dataService.reloadSearchHeader.pipe(untilDestroyed(this)).subscribe(state => {
      if (state) {
        try {
          this.getSearchCriteria();
        } catch (error) { }
      }
    })

    this._dataService.dsHashmoveLocation.pipe(untilDestroyed(this)).subscribe(state => {
      if (state) {
        this.hashmoveLocation = state
      } else {
        this.hashmoveLocation = null
      }
    })

    window.addEventListener('scroll', this.scroll, true); //third parameter
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.scroll, true);
    HashStorage.removeItem('hasSettings')
  }

  scroll = ($event): void => {
    const scroller = document.querySelector('.results-header');
    scroller.classList.remove('scrolled');
    if ($event.target.scrollTop > 70 && $event.target.childElementCount > 1) {
      scroller.classList.add('scrolled');
    }
  };


  getSearchCriteria() {
    if (HashStorage.getItem("searchCriteria")) {
      this.containersQty = 0
      let jsonString = HashStorage.getItem("searchCriteria");
      this.searchCriteria = JSON.parse(jsonString);
      if (this.searchCriteria.searchMode !== 'warehouse-lcl') {
        if (this.searchCriteria.containerLoad === 'FCL' || this.searchCriteria.containerLoad === 'FTL') {
          this.searchCriteria.SearchCriteriaContainerDetail.forEach(obj => {
            if (obj.contRequestedQty) {
              this.containersQty += Number(obj.contRequestedQty)
            } else {
              this.containersQty += Number(obj.BookingContTypeQty)
            }
          })
        } else {
          this.searchCriteria.SearchCriteriaContainerDetail.forEach(obj => {
            if (obj.contRequestedCBM) {
              this.containersQty += Number(obj.contRequestedCBM)
            } else {
              this.containersQty += Number(obj.BookingContTypeQty)
            }
          })
          this.containersQty = Math.ceil(this.containersQty)
        }

        // this.pickupCountry = this.searchCriteria.pickupPortCode.split(' ').shift().toLowerCase();
        // this.deliverCountry = this.searchCriteria.deliveryPortCode.split(' ').shift().toLowerCase();

        if (this.searchCriteria.pickupPortCode === 'GROUND') {
          this.pickupCountry = this.searchCriteria.SearchCriteriaPickupGroundDetail.AddressComponents.ShortName_L1.toLowerCase()
        } else {
          this.pickupCountry = this.searchCriteria.pickupPortCode.split(' ').shift().toLowerCase();
        }

        if (this.searchCriteria.deliveryPortCode === 'GROUND') {
          this.deliverCountry = this.searchCriteria.SearchCriteriaDropGroundDetail.AddressComponents.ShortName_L1.toLowerCase()
        } else {
          this.deliverCountry = this.searchCriteria.deliveryPortCode.split(' ').shift().toLowerCase();
        }
        this.PickupDate = new Date(this.searchCriteria.pickupDate);
        if (this.searchCriteria.searchMode === 'air-lcl') {
          this.DeliveryDate = new Date(this.searchCriteria.pickupDateTo);
        } else {
          this.DeliveryDate = null;
        }
      } else if (this.searchCriteria.searchMode === 'warehouse-lcl') {
        this.PickupDate = new Date(this.searchCriteria.StoreFrom);
        this.DeliveryDate = new Date(this.searchCriteria.StoreUntill);
      }

    }
  }


  modify(type) {
    const modalRef = this._modalService.open(ConfirmModifySearchComponent, {
      size: 'sm',
      centered: true,
      windowClass: 'small-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.then((result) => {
      if (type === 'vendor') {
        this.openModal.emit(true)
      }
    });


    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  onCancelClicked() {
    this._dataService.cancelBookingMsg = {
      messageTitle: 'Cancel Booking',
      messageContent: 'Are you sure you want to cancel your Booking?',
      openedFrom: 'booking-process',
      buttonTitle: 'Yes I would like to Cancel this booking',
      data: ''
    }

    this._modalService.open(CancelBookingDialogComponent, {
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

  saveBooking() {
    this._dataService.saveButtonTrigger.next(true)
    if (this.strActiveTabId && this.strActiveTabId === 'tab-billing') {
      const modalRef = this._modalService.open(ConfirmSavePaymentComponent, { size: 'lg', centered: true, windowClass: 'small-modal' });
      modalRef.result.then((result) => {
        if (result === 'confirm') {
          this.saveBookingAction()
        }
      });
      return
    }
    this.saveBookingAction()
  }
  saveBookingAction() {
    let validated = true;
    const quality = this.orderSummary.BookingPriceDetail.filter(element => element.SurchargeType === 'VASV' && element.SurchargeCode === 'QLTY');
    const tracking = this.orderSummary.BookingPriceDetail.filter(element => element.SurchargeType === 'VASV' && element.SurchargeCode === 'QLTY');

    if (quality.length || tracking.length) {
      if (!this.orderSummary.JsonParametersOfSensor) {
        validated = false;
      }
    } else {
      validated = true;
    }
    if (!validated) {
      return false;
    }
    if (HashStorage) {
      this.userItem = JSON.parse(Tea.getItem('loginUser'));
      if (this.orderSummary.IsInsured) {
        if (this.orderSummary.InsuredStatus.toLowerCase() === 'enquiry' && this.searchCriteria.searchMode != 'warehouse-lcl') {
          if (this.orderSummary.BookingID === -1) {
            if (!this.orderSummary.InsuredGoodsPrice || this.orderSummary.InsuredGoodsPrice < 0) {
              this._toast.error('Please enter a valid invoice value of your goods.', 'Error');
              return;
            }
            if (!this.orderSummary.BookingEnquiryDetail || this.orderSummary.BookingEnquiryDetail.length === 0) {
              this._toast.error('Please select an insurance provider to send an enquiry to, or decline insurance.', 'Error');
              return;
            }
          } else if (this.orderSummary.BookingID > -1) {
            if (!this.orderSummary.InsuredGoodsPrice || this.orderSummary.InsuredGoodsPrice < 0) {
              this._toast.error('Please enter a valid invoice value of your goods.', 'Error');
              return;
            }
            if (!this.orderSummary.BookingEnquiryDetail || this.orderSummary.BookingEnquiryDetail.length === 0) {
              this._toast.error('Please select an insurance provider to send an enquiry to, or decline insurance.', 'Error');
              return;
            }
          }
        }
      }

      if (this.strActiveTabId !== 'tab-tracking' && this.orderSummary.IsInsured && this.orderSummary.InsuredGoodsPrice < 0) {
        this._toast.error('Invalid goods amount', 'Error');
        return;
      }
      if (this.strActiveTabId !== 'tab-tracking' && this.orderSummary.IsInsured && !this.orderSummary.InsuredGoodsPrice) {
        this._toast.error('Please provide value of your goods', 'Error');
        return;
      }


      // if (this.orderSummary.IsInsured && this.orderSummary.InsuredStatus === 'Enquiry' && this.orderSummary.InsuredGoodsPrice > 0 && this.orderSummary.BookingEnquiryDetail === null) {
      //   this._toast.error('Please select provider', 'Error');
      //   return;
      // }

      if (!(this.orderSummary.BookingID || this.orderSummary.BookingID === -1) && this.searchCriteria.searchMode === 'warehouse-lcl') {
        this.setTaxData()
      }


      this.orderSummary.BookingPriceDetail.forEach((e) => {
        if (e.SurchargeType === 'VASV' && !(e.SurchargeCode === 'INSR' || e.SurchargeCode === 'TRCK' || e.SurchargeCode === 'QLTY')) {
          let index = this.orderSummary.BookingPriceDetail.indexOf(e);
          this.orderSummary.BookingPriceDetail.splice(index, 1)
        }
      });

      if (this.userItem && !this.userItem.IsLogedOut) {
        loading(true);
        if (!this.userItem.IsVerified) {
          loading(false);
          this._toast.warning('You need to verify your email address before making a booking.', 'Info');
          return;
        }
        this._cookieService.deleteCookies()
        this.saveBookingObj = createSaveObject(this.userItem, this.orderSummary, 'Draft');
        this._dropDownService.getExchangeRateList(this._currencyControl.getBaseCurrencyID()).subscribe((res: any) => {
          this._currencyControl.setExchangeRateList(res.returnObject)
          let newSaveObject = this._currencyControl.getSaveObjectByLatestRates(this.saveBookingObj, res.returnObject)
          this.saveBookingObj = newSaveObject
          if (this.searchCriteria.searchMode !== 'warehouse-lcl') {
            this._bookingService.saveBooking(newSaveObject).subscribe((res: any) => {
              if (res.returnId > 0) {
                localStorage.removeItem('searchCriteria');
                // localStorage.removeItem('searchResult');
                localStorage.removeItem('selectedCarrier');
                localStorage.removeItem('providerSearchCriteria');
                // localStorage.removeItem('bookingInfo');
                HashStorage.removeItem('CURR_MASTER');
                this._router.navigate(['/user/dashboard']);
                // this._toast.success('Your booking is saved successfully', 'Success');
                this._toast.info('Rates may have been updated since the booking was last saved.', 'Info');
                loading(false);

              } else {
                loading(false);
                this._toast.error('An unexpected error occurred while saving your booking, Please try again later.', 'Failed')
              }
              // HashStorage.removeItem('selectedDeal');
            }, (err) => {
              loading(false);
              this._toast.error('An unexpected error occurred while saving your booking, Please try again later.', 'Failed')
            })
          } else if (this.searchCriteria.searchMode === 'warehouse-lcl') {
            this._bookingService.saveWarehouseBooking(newSaveObject).subscribe((res: any) => {
              if (res.returnId > 0) {
                localStorage.removeItem('searchCriteria');
                // localStorage.removeItem('searchResult');
                localStorage.removeItem('selectedCarrier');
                localStorage.removeItem('providerSearchCriteria');
                // localStorage.removeItem('bookingInfo');
                HashStorage.removeItem('CURR_MASTER');
                this._router.navigate(['/user/dashboard']);
                // this._toast.success('Your booking is saved successfully', 'Success');
                this._toast.info('Rates may have been updated since the booking was last saved.', 'Info');
                loading(false);

              } else {
                loading(false);
                this._toast.error('An unexpected error occurred while saving your booking, Please try again later.', 'Failed')
              }
              // HashStorage.removeItem('selectedDeal');
            }, (err) => {
              loading(false);
              this._toast.error('An unexpected error occurred while saving your booking, Please try again later.', 'Failed')
            })
          }
        })
      } else {
        const modalRef = this._modalService.open(LoginDialogComponent, { size: 'lg', centered: true, windowClass: 'small-modal' });
        modalRef.result.then((result) => {
          if (result) {
            this._toast.success('Logged in successfully.', 'Success');
          }
        });
      }

    }
  }


  setTaxData() {
    const taxData = this._dataService.getTaxData()
    const surChargeLenght = this.orderSummary.BookingSurChargeDetail.length
    for (let index = 0; index < surChargeLenght; index++) {
      const charge = this.orderSummary.BookingSurChargeDetail[index];
      if (charge.SurchargeType === 'TAX') {
        this.orderSummary.BookingSurChargeDetail[index] = taxData
      }
    }
  }
}




