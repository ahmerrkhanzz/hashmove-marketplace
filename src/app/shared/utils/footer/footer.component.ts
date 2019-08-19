import { Component, OnInit, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { FooterService } from './footer.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { EMAIL_REGEX, getDefaultCountryCode, getImagePath, ImageSource, ImageRequiredSize } from '../../../constants/globalfunctions'
import { NguCarouselConfig, NguCarousel } from '@ngu/carousel';
import { BookingService } from '../../../components/booking-process/booking.service';
import { IHelpSupport } from '../../../interfaces/order-summary';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  providers: [FooterService, ToastrService],
  encapsulation: ViewEncapsulation.None
})
export class FooterComponent implements OnInit, AfterViewInit {
  public carouselOne: NguCarouselConfig;
  public email: string;
  public countryCode: string;
  public associations = [];
  public socialLinks: any = [];
  public footerDetails: any;
  public footerData: any = [
    {
      section: 'Company',
      links: [
        {
          name: 'About HashMove',
          url: null
        },
        {
          name: 'Blog & Media',
          url: null
        },
        {
          name: 'Careers',
          url: null
        },
        {
          name: 'Terms',
          url: 'https://www.hashmove.com/terms-of-use.html'
        },
        {
          name: 'Contact Us',
          url: null
        },
        {
          name: 'Legal',
          url: null
        }
      ],
    },
    {
      section: 'Top Countries',
      links: [
        {
          name: 'UAE',
          url: null
        },
        {
          name: 'Saudi Arabia',
          url: null
        },
        {
          name: 'United States',
          url: null
        },
        {
          name: 'China',
          url: null
        },
        {
          name: 'Spain',
          url: null
        },
        {
          name: 'Netherlands',
          url: null
        }
      ]
    },
    {
      section: 'Import & Export',
      links: [
        {
          name: 'Import from UAE',
          url: null
        },
        {
          name: 'Import from Saudi Arabia',
          url: null
        },
        {
          name: 'Import from China',
          url: null
        },
        {
          name: 'Export from UAE',
          url: null
        },
        {
          name: 'Export from Saudi Arabia',
          url: null
        },
        {
          name: 'Export from China',
          url: null
        },
      ]
    },
  ];

  public footerData2: any = [
    {
      section: 'Services',
      links: [
        {
          name: 'Air Freight',
          url: null
        },
        {
          name: 'Ocean Freight',
          url: null
        },
        {
          name: 'Land Transport',
          url: null
        },
        {
          name: 'Warehousing',
          url: null
        },
      ]
    },
    {
      section: 'Resources & Tools',
      links: [
        {
          name: 'Load Calculator',
          url: null
        },
        {
          name: 'Knowledge Base',
          url: null
        },
        {
          name: 'Glossary',
          url: null
        },
        {
          name: 'Help & Support Center',
          url: null
        },
        {
          name: 'Media & Press Kit',
          url: null
        },
        {
          name: 'Data Analytics',
          url: null
        }
      ]
    },
    {
      section: 'Information',
      links: [
        {
          name: 'Terms & Conditions of Use',
          url: 'https://www.hashmove.com/terms-of-use.html'
        },
        {
          name: 'User Privacy Policy',
          url: 'https://www.hashmove.com/privacy-policy.html'
        },
        {
          name: 'Data Acquisition Policy',
          url: null
        }
      ]
    }
  ];

  public doorToDoor: any = [
    {
      name: 'UAE',
      url: null
    },
    {
      name: 'Saudi Arabia',
      url: null
    },
    {
      name: 'United States',
      url: null
    },
    {
      name: 'China',
      url: null
    },
    {
      name: 'Spain',
      url: null
    },
    {
      name: 'Netherlands',
      url: null
    }
  ]
  public doorToDoor_2: any = [
    {
      name: 'Oman',
      url: null
    },
    {
      name: 'Bahrain',
      url: null
    },
    {
      name: 'Qatar',
      url: null
    },
    {
      name: 'Kuwait',
      url: null
    },
    {
      name: 'Egypt',
      url: null
    },
    {
      name: 'Jordan',
      url: null
    }
  ]

  public notifyText: string = 'Notify me'
  public _helpSupport: IHelpSupport
  public isPartner: boolean = false;

  constructor(
    private _footer: FooterService,
    private _toast: ToastrService,
    private _http: HttpClient,
    private _bookingService: BookingService
  ) { }

  ngOnInit() {
    this.getUserLocation();
    this.getAssociations();
    this.getSocialLinks();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setAccordianTransitions()
    }, 1000);
  }

  setAccordianTransitions() {
    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function () {
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
          panel.style.maxHeight = null;
        } else {
          for (let j = 0; j < acc.length; j++) {

            acc[j].classList.remove("active")
            var nextelem: any = acc[j].nextElementSibling;
            nextelem.style.maxHeight = null
          }
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
        this.classList.toggle("active");

      });
    }
  }

  notify() {
    var emailRegexp: RegExp = EMAIL_REGEX
    if (this.email && !emailRegexp.test(this.email)) {
      this._toast.error('Invalid email entered.', 'Error');
      this.setNotifyText('Error')
      return false;
    }

    if (!this.email || this.email === undefined) {
      this.setNotifyText('Error')
      return false;
    }

    let params = {
      "NotifyMeEmail": this.email,
      "CountryCode": this.countryCode
    }

    this._footer.notifyMe(params).subscribe((res: any) => {
      if (res.returnId === -1) {
        this._toast.error(res.returnText, 'Error');
        this.setNotifyText('Error')
      } else {
        this._toast.success(res.returnText, 'Success');
        this.email = '';
        this.setNotifyText('Success')
      }
    }, (err: any) => {
      if (err.error) {
        this._toast.error(err.error.NotifyMeEmail[0], 'Error');
        this._toast.error(err.error.NotifyMeEmail[1], 'Error');
        this.setNotifyText('Error')
      }
    })
  }

  setNotifyText(text: string) {
    this.notifyText = text
    setTimeout(() => {
      this.notifyText = 'Notify me'
    }, 1500);
  }

  getAssociations() {
    this._footer.getAssociations().subscribe((res: any) => {
      if (res.returnId === -1) {
        this._toast.error(res.returnText, 'Error');
      } else {
        this.associations = res;
        this.associations.forEach(association => {
          association.displayImage = getImagePath(ImageSource.FROM_SERVER, association.imageName, ImageRequiredSize._48x48)
        })
      }
    }, (err: any) => {
      this._toast.error(err.returnText, 'Error');
    })
  }

  getSocialLinks() {
    this._footer.getSocialLinks().subscribe((res: any) => {
      if (res.returnId === -1) {
        this._toast.error(res.returnText, 'Error');
      } else {
        this.socialLinks = res;
        this.socialLinks.forEach(element => {
          if (element.codeValShortDesc === 'YouTube')
            element.codeValShortDesc = 'Youtube'
        });
      }
    }, (err: any) => {
      this._toast.error(err.returnText, 'Error');
    })
  }

  getUserLocation() {
    // this._http.get('https://api.teletext.io/api/v1/geo-ip').subscribe((res: any) => {
    this.countryCode = getDefaultCountryCode();
    // });
  }
}

export function emailValidator(control: FormControl): { [key: string]: any } {
  var emailRegexp: RegExp = EMAIL_REGEX
  if (control.value && !emailRegexp.test(control.value)) {
    return { invalidEmail: true };
  }
}
