import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import * as fclForwarderActions from "../actions/forwarders.actions";
import { Observable } from "rxjs";
import { Action } from "@ngrx/store";
import { SearchResultService } from "../../fcl-search.service";
import { flatMap, map, catchError, mergeMap } from "rxjs/operators";
import { of } from "rxjs/observable/of";
import { DropDownService } from "../../../../../services/dropdownservice/dropdown.service";
import { CurrencyControl } from "../../../../../shared/currency/currency.injectable";

@Injectable()
export class FclForwarderEffects {
    constructor(
        private $actions: Actions,
        private _searchService: SearchResultService,
        private _dropDownService: DropDownService,
        private _currencyControl: CurrencyControl
    ) { }

    @Effect()
    $fetchFClForwarders: Observable<Action> = this.$actions.pipe(
        ofType(fclForwarderActions.FETCHING_FCL_FORWARDER_DATA),
        mergeMap((action: any) => {
            return (
                Observable.forkJoin([
                    this._searchService.getProvidersSearchResult(action.payload),
                    this._dropDownService.getExchangeRateList(
                        this._currencyControl.getBaseCurrencyID()
                    )
                ]).pipe(
                    // If successful, dispatch success action with result
                    map(
                        (data: any) => {
                            const { returnId } = data[0]
                            if (returnId > 0) {
                                return new fclForwarderActions.FetchingFCLForwarderDataSuccess(data)
                            } else {
                                return new fclForwarderActions.FetchingFCLForwarderDataFail(
                                    null,
                                    "Network Error Occured"
                                )
                            }
                        }
                    ),
                    // If request fails, dispatch failed action
                    catchError(() =>
                        of(
                            new fclForwarderActions.FetchingFCLForwarderDataFail(
                                null,
                                "Network Error Occured"
                            )
                        )
                    )
                )
            )
        })
    );
}
