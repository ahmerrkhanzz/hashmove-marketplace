import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { loading, HashStorage } from '../constants/globalfunctions';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PagesComponent implements OnInit {
  public isCookeStored = true;
  public shippingObj: any;
  public containerObj: any;
  public homeFooter: Boolean = false;
  constructor(
     private router : Router,
    ) { }

  ngOnInit() {
    this.getCookie();
    this.homeFooter = (!this.router || !this.router.url || this.router.url=="/home" || this.router.url === "/home?mode=shipping" || this.router.url === "/home?mode=warehouse" || this.router.url === "/home?mode=air" || this.router.url === "/home?mode=truck") ? true : false;
    this.router.events
    .subscribe((event:NavigationEnd) => {
    // let toolMenu = document.getElementsByClassName('cd-dropdown2');
    // let knowledgeMenu = document.getElementsByClassName('cd-dropdown');
    // if(toolMenu[0].classList.contains('dropdown-is-active')){
    //   toolMenu[0].classList.remove('dropdown-is-active');
    //   if(toolMenu[0].previousElementSibling.children[0].classList.contains('fa-times')){
    //     toolMenu[0].previousElementSibling.children[0].classList.remove('fa-times');
    //     toolMenu[0].previousElementSibling.children[0].classList.add('fa-angle-down');
    //   }
    // }
    // if(knowledgeMenu[0].classList.contains('dropdown-is-active')){
    //   knowledgeMenu[0].classList.remove('dropdown-is-active');
    //   if(knowledgeMenu[0].previousElementSibling.children[0].classList.contains('fa-times')){
    //     knowledgeMenu[0].previousElementSibling.children[0].classList.remove('fa-times');
    //     knowledgeMenu[0].previousElementSibling.children[0].classList.add('fa-angle-down');
    //   }
    // }
    this.homeFooter=(event.url === "/home" || event.url === "/home?mode=shipping" || event.url === "/home?mode=warehouse" || event.url === "/home?mode=air" || event.url === "/home?truck") ? true : false;
    });
  }
  getCookie() {
    setTimeout(function () {
      const cookieInner = document.querySelector(".cookie-law-info-bar");
      const cookieMain = document.querySelector("app-cookie-bar");
      if (localStorage.getItem('cookiesPopup')) {
        this.isCookeStored = false;
        cookieMain.classList.add("hidePopup");
        cookieInner.classList.add("hidePopup");
      } else {
        console.log('cookies not generat')
      }
    },)
  }

  ngAfterViewInit() {
    loading(false);
  }

  

}
