import { Component, OnInit, ViewEncapsulation, AfterViewInit, Input } from '@angular/core';
import { MainService } from '../../../components/main/main.service';
import { BookingService } from '../../../components/booking-process/booking.service';
import { IHelpSupport } from '../../../interfaces/order-summary';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-footer',
  templateUrl: './search-footer.component.html',
  styleUrls: ['./search-footer.component.scss'],
  providers: [MainService],
  encapsulation: ViewEncapsulation.None
})
export class SearchFooterComponent implements OnInit {
  public count: number;
  public _helpSupport: IHelpSupport
  public footerDetails: any;
  public isPartner: boolean = false
  constructor(
    private _mainService: MainService,
    private _bookingService: BookingService,
    private _router : Router
  ) { }

  ngOnInit() {
    this.getprovidersCount();

    this._bookingService.getHelpSupport(true).subscribe((res: any) => {
      if (res.returnId > 0) {
        this._helpSupport = JSON.parse(res.returnText)
        this.footerDetails = JSON.parse(res.returnText)
      }
    })

    if (this._router.url.includes('partner')) {
      this.isPartner = true
    }
  }

  // getDemoSupport(){
  //   let todos = Todo[]
  //   todos = [
  //     {
  //       demoId: 'get groceries',
  //       demoName: 'eggs, milk, etc.',
  //       demoUrl: 'http:hashmove.com'
  //     }
  //   ];
  //     return todos;
  // }


  getprovidersCount() {
    this._mainService.getProvidersCount().subscribe((res: any) => {
      this.count = res;
    }, (err: any) => {
    })
  }

  // getFooterLinks() {
  //   this._bookingService.getHelpSupport(true).subscribe((res: any) => {
  //     this.footerDetails = JSON.parse(res.returnText)
  //   }, (err: any) => {
  //     console.log(err)
  //   })
  // }
}
