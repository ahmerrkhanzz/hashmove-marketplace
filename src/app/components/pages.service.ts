import { Injectable } from "@angular/core";
import { baseApi } from "../constants/base.url";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class PagesService {
  constructor(private http: HttpClient) {}

  /**
   * get all shipping data
   */
  getShippingData() {
    let url: string = "shippingModeCatMapping/GetShippingCriteria";
    return this.http.get(baseApi + url);
  }

  // getShippingData(customerID: number, customerType: string) {
  //   const _config = this.http.get("../../assets/data/shipping-categories.json"); // @todo remove mock call
  //   return _config;
  // }

  /**
   * get all containers data
   */
  getContainersData() {
    let url: string = "ContainerSpec/GetContainerSpecList";
    return this.http.get(baseApi + url);
  }

  /**
   * get all ports data
   */
  // getPortsData($portType?: string) {
  //   // let url: string = "ports/GetDropDownDetail/0";
  //   let portType = $portType
  //   if (!portType) {
  //     portType = 'SEA'
  //   }
  //   let url: string = `ports/GetPortsByType/${0}/${portType}`;
  //   return this.http.get(baseApi + url);
  // }
  getCustomerShippingData(customerID: number, customerType: string) {
    let url: string = `shippingModeCatMapping/GetCustomerShippingCriteria/${customerID}/${customerType}`;
    return this.http.get(baseApi + url);
  }
}
