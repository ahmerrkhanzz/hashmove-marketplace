import { Component, OnInit } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { DataService } from '../../../services/commonservice/data.service';
import { Router } from '@angular/router';
import { SearchCriteria } from '../../../interfaces/searchCriteria';
import { HashStorage, NavigationUtils } from '../../../constants/globalfunctions';



@Component({
  selector: 'app-confirm-modify-search',
  templateUrl: './confirm-modify-search.component.html',
  styleUrls: ['./confirm-modify-search.component.scss']
})
export class ConfirmModifySearchComponent implements OnInit {

  private searchCriteria: SearchCriteria

  constructor(
    private _dataService: DataService,
    private _router: Router,
    private _activeModal: NgbActiveModal,
    private location: PlatformLocation
  ) {
    location.onPopState(() => this.closeModal(true));
  }

  ngOnInit() {
    this.searchCriteria = JSON.parse(HashStorage.getItem('searchCriteria'))
  }
  closeModal(event) {
    this._activeModal.close(event);
    document.getElementsByTagName('html')[0].style.overflowY = 'auto';
  }
  onConfirmClick(event) {
    event.stopPropagation();

    const { searchMode } = this.searchCriteria
    let modeFrom: string = 'ship'

    if (searchMode === 'warehouse-lcl') {
      modeFrom = 'warehouse'
    }

    this._dataService.modifySearch({ isMod: true, from: modeFrom });
    this._router.navigate([NavigationUtils.GET_CURRENT_NAV()]).then(() => {
      this.closeModal(true);
    })
  }
}
