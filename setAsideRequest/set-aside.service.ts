import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  SetAsideAccrualForLoansInfo,
  DsaOutstandingsModel,
  PayoffAmountForDLResponseModel,
  payoffAmountForDLRequestModel,
} from '../../interfaces/loanInfo.model';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatePipe } from '@angular/common';
import {
  SetAsideAccrualHistoryModel,
  returnedSetAsideHistoryModel,
} from '../../interfaces/setAsideAccrualHistoryModel.interface';

@Injectable({
  providedIn: 'root',
})
export class SetAsideService {
  setAsideInputUrl: string;
  directLoanPayoffAmount: URL;
  resp: PayoffAmountForDLResponseModel;
  dsaOutstanding: DsaOutstandingsModel;
  _updateRequestStatus: URL;
  _saveSetAsideHistory: URL;
  updateRequestApprovalDateUrl: string;
  viewMode = new BehaviorSubject<boolean>(false);
  ccid$ = new BehaviorSubject<number>(null);
  returnedSetAsideAccrualHistoryData$ =
    new BehaviorSubject<returnedSetAsideHistoryModel>(null);
  currFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  pctFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  constructor(private readonly http: HttpClient) {
    this.setAsideInputUrl = `${environment.common_api_url}/set-aside-accrual-for-loan`;
    this.directLoanPayoffAmount = new URL(
      `${environment.common_api_url}/payoff-amount-for-direct-loans/`
    );
    this._updateRequestStatus = new URL(
      `${environment.servicing_url}/updateRequestStatus`
    );
    this._saveSetAsideHistory = new URL(
      `${environment.servicing_url}/createDBSACalcHistory`
    );
    this.updateRequestApprovalDateUrl = `${environment.servicing_url}/updateRequestAprvDate`;
  }

  /**
   *
   * @param loanID the loan id to be used in the api for searching
   * @param statusCode the status code to be be used in the api.  Optional
   * @returns an observable of the loan information from the api
   */
  getDBSAData(loanId: any, ccid: any): Observable<SetAsideAccrualForLoansInfo> {
    //this is results from api call
    return this.http.get<SetAsideAccrualForLoansInfo>(
      `${this.setAsideInputUrl}/${ccid}?loanId=${loanId}`
    ); //this is results from api call
  }
  getDirectLoanInfo(
    payoff: payoffAmountForDLRequestModel,
    cslaId: number
  ): Observable<any> {
    this.directLoanPayoffAmount = new URL(
      this.directLoanPayoffAmount.toString() + cslaId
    );
    let params = new URLSearchParams();

    const payoffAccrualDate: string[] = payoff.accrualDate.split('/');
    params.append(
      'accrualDate',
      payoffAccrualDate[2] +
        '-' +
        payoffAccrualDate[0].toString().padStart(2, '0') +
        '-' +
        payoffAccrualDate[1].toString().padStart(2, '0')
    );
    const loanNumber =
      payoff.loanNumber !== undefined ? payoff.loanNumber.toString() : '0';
    params.append('loanNumber', loanNumber);
    this.directLoanPayoffAmount.search = params.toString();
    return this.http.get<Observable<any>>(
      this.directLoanPayoffAmount.toString()
    );
  }

  /**
   *
   * @param loanData a single loan to be used for calculations
   * @param DBSArate the calculated DBSA interest rate
   * @returns the calculated Total Payoff using DBSA rate
   */
  calcTotalPayoffDBSA(loanData: any, accruedInterest: string): string {
    if (!JSON.parse(JSON.stringify(loanData)).data) {
      console.log('no loan data, returning');
      return '';
    }
    console.log('loan data used for dbsa payoff calc: ', loanData);
    let dsaOutstandingRecord = JSON.parse(JSON.stringify(loanData.data));
    let dsaOutstanding: DsaOutstandingsModel;

    //determine if the dsaoutstandings is an array.
    //if it's not an array, the value is assigned in the let dsaOutstanding =
    //if it is an array, we take the first record and assign it.
    if (
      Array.isArray(dsaOutstandingRecord) &&
      Array.isArray(dsaOutstandingRecord[0]?.dsaOutstandings) &&
      dsaOutstandingRecord[0]?.dsaOutstandings.length > 1
    ) {
      dsaOutstanding = dsaOutstandingRecord[0]?.loanOutstandingSet.dsaOutstandings[0];
    } else {
      dsaOutstanding = dsaOutstandingRecord[0]?.loanOutstandingSet.dsaOutstandings;
    }

    console.log(
      'values used for dbsa total payoff set aside values: ',
      dsaOutstanding
    );

    let accruedInterestNumber =
      accruedInterest != '' ? Number(accruedInterest) : 0;
    console.log('accrued Interest used: ', accruedInterest);
    let tpo: string =
      dsaOutstandingRecord[0].loanOutstandingSet.unpaidPrincipal +
      dsaOutstandingRecord[0].loanOutstandingSet.unpaidPrincipalAdvance +
      dsaOutstandingRecord[0].loanOutstandingSet.accruedInterest +
      dsaOutstandingRecord[0].loanOutstandingSet.accruedInterestAdvance +
      dsaOutstandingRecord[0].loanOutstandingSet.nonCapInterest +
      dsaOutstandingRecord[0].loanOutstandingSet.nonCapDeferredInterest +
      dsaOutstandingRecord[0].loanOutstandingSet.deferredInterest +
      dsaOutstanding?.unpaidPrincipal +
      dsaOutstanding?.installmentInterest +
      accruedInterestNumber +
      dsaOutstanding?.nonCapInterest +
      dsaOutstanding?.nonCapDeferredInterest +
      dsaOutstanding?.deferredInterest;

    console.log('calculated TPO =' + tpo);
    return tpo;
  }

  /**
   *
   * @param loanData a single loan to be used for calculations
   * @returns the calculated Total Payoff using Note rate
   */
  calcTotalPayoffNote(loanData: any): number {
    if (!JSON.parse(JSON.stringify(loanData)).data) {
      console.log('no loan data, returning');
      return 0;
    }

    let dsaOutstandingRecord = JSON.parse(JSON.stringify(loanData)).data;
    let dsaOutstanding: DsaOutstandingsModel;

    //determine if the dsaoutstandings is an array.
    //if it's not an array, the value is assigned in the let dsaOutstanding =
    //if it is an array, we take the first record and assign it.
    if (
      Array.isArray(dsaOutstandingRecord) &&
      Array.isArray(dsaOutstandingRecord[0].dsaOutstandings) &&
      dsaOutstandingRecord[0].loanOutstandingSet.dsaOutstandings.length > 1
    )
    {
        dsaOutstanding = dsaOutstandingRecord[0].loanOutstandingSet.dsaOutstandings[0];
    } else {
          dsaOutstanding = dsaOutstandingRecord[0].loanOutstandingSet.dsaOutstandings;
    }
    console.log('note values used to calc note payoff: ', dsaOutstandingRecord);
    console.log(
      'values used for total payoff set aside values: ',
      dsaOutstanding
    );
    let tpoNote =
      dsaOutstandingRecord[0].loanOutstandingSet.unpaidPrincipal +
      dsaOutstandingRecord[0].loanOutstandingSet.unpaidPrincipalAdvance +
      dsaOutstandingRecord[0].loanOutstandingSet.accruedInterest +
      dsaOutstandingRecord[0].loanOutstandingSet.accruedInterestAdvance +
      dsaOutstandingRecord[0].loanOutstandingSet.nonCapInterest +
      dsaOutstandingRecord[0].loanOutstandingSet.nonCapDeferredInterest +
      dsaOutstandingRecord[0].loanOutstandingSet.deferredInterest +
      dsaOutstanding.unpaidPrincipal +
      dsaOutstanding.accruedInterest +
      dsaOutstanding.nonCapInterest +
      dsaOutstanding.nonCapDeferredInterest +
      dsaOutstanding.deferredInterest;

    console.log('tpoNote Rate ==> ' + tpoNote);

    return tpoNote;
  }

  FormatDate(currDate: Date): string {
    //handles undefined date and returns the current date
    if (currDate === undefined) {
      currDate = new Date();
    }

    const datepipe: DatePipe = new DatePipe('en-US');
    const dteTransformed = datepipe.transform(currDate, 'MM/dd/yyyy');

    return dteTransformed;
  }

  updateRequestStatus(
    rqst_id: string,
    eAuthID: string,
    statusCode: string,
    dataStatusCode: string,
    withdrawalReasonCode?: string,
    reOpenReasonCode?: string,
    statusDate: Date = new Date()
  ): Observable<any> {
    let data = null;

    console.log('Step 2. Updating Request Status. Request Id =>' + rqst_id);
    if (withdrawalReasonCode) {
      data = {
        requestId: rqst_id,
        statusCode: statusCode,
        rqst_stat_dt: statusDate,
        eAuthId: eAuthID,
        dataStatusCode: dataStatusCode,
        rqst_wdrw_rsn_cd: withdrawalReasonCode,
      };
    } else if (reOpenReasonCode) {
      data = {
        requestId: rqst_id,
        statusCode: statusCode,
        rqst_stat_dt: statusDate,
        eAuthId: eAuthID,
        dataStatusCode: dataStatusCode,
        rqst_reopen_rsn_code: reOpenReasonCode,
      };
    } else {
      data = {
        requestId: rqst_id,
        statusCode: statusCode,
        rqst_stat_dt: statusDate,
        eAuthId: eAuthID,
        dataStatusCode: dataStatusCode,
      };
    }

    return this.http.post(this._updateRequestStatus.toString(), data, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  updateRequestApprovalDate(
    rqst_id: number,
    eAuthID: string,
    requestApprovalDate: Date
  ): Observable<any> {
    console.log('Updating Request Approval Date. Request Id =>' + rqst_id);

    let data = {
      requestId: rqst_id,
      aprvDate: requestApprovalDate,
      eAuthId: eAuthID,
    };;

    return this.http.post(this.updateRequestApprovalDateUrl, data, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  saveAccrualHistory(
    setAsideAccrualHistory: SetAsideAccrualHistoryModel
  ): Observable<any> {
    console.log('saving accrual history: ', setAsideAccrualHistory);
    return this.http.post(
      this._saveSetAsideHistory.toString(),
      setAsideAccrualHistory,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  convertStringToCurrOrPct(val: string, dollarOrPct: number): string {
    if (!val) {
      return '';
    }
    console.log('val in: ', val);
    let newVal = '';
    for (let char of val) {
      if ((char >= '0' && char <= '9') || char === '.') {
        newVal += char;
      }
    }
    console.log('parse float nv: ', parseFloat(newVal));
    newVal =
      dollarOrPct === 0
        ? this.currFormatter.format(parseFloat(newVal))
        : this.pctFormatter.format(parseFloat(newVal) / 100);
    console.log('newVal: ', newVal);
    return newVal;
  }


}