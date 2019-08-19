import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener
} from "@angular/core";
import { Location } from "@angular/common";
import { DataService } from "../../services/commonservice/data.service";
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import {
  HashStorage,
  loading,
  preloadImages
} from "../../constants/globalfunctions";
import { UpdatePasswordComponent } from "../../shared/dialogues/update-password/update-password.component";
import { LoginDialogComponent } from "../../shared/dialogues/login-dialog/login-dialog.component";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { PagesService } from "../pages.service";
import { HttpErrorResponse } from "@angular/common/http";
import { ShippingService } from "./shipping/shipping.service";
import { ShippingArray } from "../../interfaces/shipping.interface";

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"]
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {
  public shipping: boolean = false;
  public wareHousing: boolean = false;
  public track: boolean = false;
  public partner: boolean = false;
  public searchCriteria: any;
  public menuPanel: boolean = true;
  public subMenuItem1: any;
  public subMenuItem2: any;

  constructor(
    private renderer: Renderer2,
    private dataService: DataService,
    private _router: Router,
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private _location: Location,
    private _pagesService: PagesService,
    private _shippingService: ShippingService,
    private route: ActivatedRoute
  ) {}

  @ViewChild("shipTab") shipTab: ElementRef;
  @ViewChild("warehouseTab") warehouseTab: ElementRef;
  @ViewChild("trackShipTab") trackShipTab: ElementRef;
  @ViewChild("partnerTab") partnerTab: ElementRef;

  ngOnInit() {
    HashStorage.removeItem("tempSearchCriteria");
    this.dataService.switchBranding.next("marketplace");
    this.getShippingDetails();
    this.getPortDetails();
    this.renderer.addClass(document.body, "bg-white");
    this.renderer.removeClass(document.body, "bg-grey");
    this.renderer.removeClass(document.body, "bg-lock-grey");
    this.dataService.criteria.subscribe(state => {
      const { isMod, from } = state;
      if (from === "ship" && isMod) {
        this.shipping = !this.shipping;
      }

      if (from === "warehouse" && isMod) {
        this.wareHousing = !this.wareHousing;
      }
    });

    this._router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        HashStorage.removeItem("tempSearchCriteria");
      });

    const externalLink = this.route.snapshot.queryParamMap.get("mode");
    if (externalLink) {
      if (
        externalLink === "shipping" ||
        externalLink === "air" ||
        externalLink === "truck"
      ) {
        this.dataService.tabCallFromDashboard = "shipTab";
      } else if (externalLink === "warehouse") {
        this.dataService.tabCallFromDashboard = "warehouseTab";
      }
      this.dataService.isTabCallTrue = true;
    }
  }

  /**
   * get all shipping data
   */
  getShippingDetails() {
    if (HashStorage) {
      this._pagesService.getShippingData().subscribe(
        (res: any) => {
          this.setShippingCriteria(res);
        },
        (err: HttpErrorResponse) => {}
      );
    }
  }

  menuItem1() {
    this.subMenuItem1 = !this.subMenuItem1;
  }
  menuItem2() {
    this.subMenuItem2 = !this.subMenuItem2;
  }
  setShippingCriteria(res) {
    let result = JSON.parse(res.returnText);
    if (res.returnId === 1) {
      try {
        result.forEach(shipping => {
          shipping.isEnabled = true;
        });
      } catch (error) {}
      HashStorage.setItem("shippingCategories", JSON.stringify(result));
      try {
        this.setImages(result);
      } catch (error) {}
    }
  }

  public mainImages;
  public subImages;
  public subSubImages;
  public containers;

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
  getPortDetails() {
    if (HashStorage.getItem("shippingPortDetails")) {
      return;
    }
    loading(true);
    this._shippingService.getPortsData().subscribe(
      (res: any) => {
        loading(false);
        HashStorage.setItem("shippingPortDetails", JSON.stringify(res));
      },
      (err: HttpErrorResponse) => {
        loading(false);
      }
    );
  }

  CloseBoxes(event) {
    if (event.target.classList.contains("dropdown-item")) {
      event.stopPropagation();
    } else {
      let i;
      let count = event.currentTarget.parentElement.children;
      for (i = 0; i < count.length; i++) {
        if (count[i].classList.length > 1) {
          count[i].classList.remove("active");
        }
      }
      this.shipping = false;
      this.wareHousing = false;
      this.partner = false;
      this.track = false;
    }
  }

  /* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
  openNav() {
    const getBody = document.querySelector("body");
    this.menuPanel = !this.menuPanel;
    getBody.classList.toggle("mainBody");
  }

  /* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
  closeNav() {
    const getBody = document.querySelector("body");
    this.menuPanel = !this.menuPanel;
    getBody.classList.remove("mainBody");
  }
  tabOpen(tab, event) {
    if (HashStorage) {
      let i;
      let count;
      try {
        count = event.currentTarget.parentElement.children;
        for (i = 0; i < count.length; i++) {
          if (count[i].classList.length > 1) {
            count[i].classList.remove("active");
          }
        }
      } catch (error) {}
      if (tab == "shipping") {
        if (this.shipping == false) {
          this.dataService.modifySearch({ isMod: false, from: "ship" });
        }
        this.shipping = !this.shipping;
        this.wareHousing = false;
        this.partner = false;
        this.track = false;
        this.shipping
          ? event.currentTarget.classList.add("active")
          : event.currentTarget.classList.remove("active");
        this.dataService.isNVOCCActive.next(false);
        if (HashStorage.getItem("customerSettings")) {
          HashStorage.removeItem("customerSettings");
        }
      } else if (tab == "warehousing") {
        this.wareHousing = !this.wareHousing;
        this.shipping = false;
        this.track = false;
        this.partner = false;
        this.wareHousing
          ? this.warehouseTab.nativeElement.classList.add("active")
          : this.warehouseTab.nativeElement.classList.remove("active");
      } else if (tab == "track") {
        this.track = !this.track;
        this.shipping = false;
        this.wareHousing = false;
        this.partner = false;
        this.track
          ? event.currentTarget.classList.add("active")
          : event.currentTarget.classList.remove("active");
      } else if (tab == "partner") {
        this.partner = !this.partner;
        this.shipping = false;
        this.wareHousing = false;
        this.track = false;
        this.partner
          ? event.currentTarget.classList.add("active")
          : event.currentTarget.classList.remove("active");
      }
    } else {
      if (!HashStorage) {
        this._router.navigate(["enable-cookies"]);
        return;
      }
    }
  }

  ngAfterViewInit() {
    if (this.dataService.isTabCallTrue) {
      setTimeout(() => {
        let tabName = this.dataService.tabCallFromDashboard;
        this.shipping = false;
        switch (tabName) {
          case "shipTab":
            this.shipTab.nativeElement.click();
            break;
          case "warehouseTab":
            this.warehouseTab.nativeElement.click();
            break;
          case "trackShipTab":
            this.trackShipTab.nativeElement.click();
            break;
          case "partnerTab":
            this.partnerTab.nativeElement.click();
            break;
          default:
            break;
        }
        this.dataService.isTabCallTrue = false;
      }, 500);
    }
    if (this.activatedRoute.snapshot.queryParams.code) {
      this.updatePasswordModal();
    }
    if (this.activatedRoute.snapshot.queryParams.login) {
      this.loginModal();
    }
  }

  updatePasswordModal() {
    this.modalService.open(UpdatePasswordComponent, {
      size: "lg",
      centered: true,
      windowClass: "small-modal",
      backdrop: "static",
      keyboard: false
    });
    setTimeout(() => {
      if (
        document
          .getElementsByTagName("body")[0]
          .classList.contains("modal-open")
      ) {
        document.getElementsByTagName("html")[0].style.overflowY = "hidden";
      }
    }, 0);
  }

  loginModal() {
    this._location.replaceState("home");
    HashStorage.removeItem("loginUser");
    this.dataService.reloadHeader.next(true);
    this.modalService.open(LoginDialogComponent, {
      size: "lg",
      centered: true,
      windowClass: "small-modal",
      backdrop: "static",
      keyboard: false
    });
    setTimeout(() => {
      if (
        document
          .getElementsByTagName("body")[0]
          .classList.contains("modal-open")
      ) {
        document.getElementsByTagName("html")[0].style.overflowY = "hidden";
      }
    }, 0);
  }

  // @HostListener('window:keyup.shift.w', ['$event'])
  // keyEvent(event: KeyboardEvent) {
  //   console.log(event);
  //   this.tabOpen('warehousing', null)
  // }
  ngOnDestroy() {
    HashStorage.removeItem("tempSearchCriteria");
  }
}
