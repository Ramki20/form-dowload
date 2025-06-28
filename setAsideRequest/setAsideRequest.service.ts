import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, from, map, Observable } from 'rxjs';
import {
  ProcessSetAsideForLoanData,
  ProcessSetAsideForLoanRequest,
  SaveSetAsideConfirmationRequest,
  SaveSetAsideConfirmationRequestResponse,
} from 'src/app/models/set-aside-processing-model';
import { environment } from 'src/environments/environment';
import {
  SetAsideRequestCompleteData,
  SetAsideRequestOutcomeData,
  SetAsideRequestData,
} from '../../interfaces/requestData.interface';
import { HttpRequestService } from '../httpRequest/httpRequest.service';
import {
  SetAsideOutcomeResponse,
  SetAsideRequestCompleteData2,
  SetAsideRequestData2,
  SetAsideRequestOutcomeData2,
} from '../../interfaces/pre-close.model';

@Injectable({ providedIn: 'root' })
export class SetAsideRequestService {
  processSetAsideForLoanUrl: string;
  saveSetAsideConfirmationUrl: string;
  setAsideTransUrl: string;
  setAsideRequestOutcomeUrl: string;

  constructor(
    private httpRequestService: HttpRequestService,
    private http: HttpClient
  ) {
    this.processSetAsideForLoanUrl = `${environment.servicing_url}/processSetAsideForLoan`;
    this.saveSetAsideConfirmationUrl = `${environment.servicing_url}/saveSetAsideConfirmation`;
    this.setAsideTransUrl = `${environment.common_api_url}/setAsideTrans`;
    this.setAsideRequestOutcomeUrl = `${environment.servicing_url}/setAsideRequestOutcome`
  }

  /**
   * create a new set Aside request record to the backend server.
   *
   * @param {SetAsideRequestData} requestData - The data to be saved for the service request.
   * @returns {Promise<any>} - A Promise that resolves to the server's response or null on error.
   */
  async saveSetAsideRequest(requestData: SetAsideRequestCompleteData) {
    console.log(
      'SetAsideRequestData before saving in DB ************',
      requestData
    );
    const route = 'setAsideRequest';
    const routeOtcm = 'setAsideRequestOutcome';
    let setAsideRequestResponse: any;
    let setAsideOutcomeResponse: any;
    try {
      setAsideRequestResponse = await this.httpRequestService.post(
        route,
        requestData.setAsideRequestData
      );
      console.log(
        'SetAsideRequestResponse after saving in DB ************',
        setAsideRequestResponse
      );
    } catch (error) {
      console.error('Error saving SetAsideRequestData in service:', error);
      return null;
    }

    try {
      requestData.setAsideRequestOutcomeData.rqst_loan_id =
        setAsideRequestResponse.setAsideRequestData.rqst_loan_id;

      this.prepareSetAsideRequestOutcomeData(requestData);

      console.log(
        'setAsideRequestOutComeResponse Before saving in DB ************',
        requestData.setAsideRequestOutcomeData
      );
      // call to lambda
      setAsideOutcomeResponse = await this.httpRequestService.post(
        routeOtcm,
        requestData.setAsideRequestOutcomeData
      );
      console.log(
        'setAsideRequestOutComeResponse after saving in DB ************',
        setAsideOutcomeResponse
      );
    } catch (error) {
      console.error(
        'Error saving setAsideRequestOutComeResponse in service:',
        error
      );
    }
    let combinedSetAsideResponse = {
      setAsideRequestResponse: setAsideRequestResponse,
      setAsideOutcomeResponse: setAsideOutcomeResponse,
    };
    return combinedSetAsideResponse;
  }

  prepareSetAsideRequestOutcomeData(
    requestData: SetAsideRequestCompleteData
  ) {
    let setAsideAmount = requestData.setAsideRequestData.istl_set_asd_amt;
    console.log('setAsideAmount: before', setAsideAmount);
    setAsideAmount = parseFloat(setAsideAmount.toString().replace(/,/g, ''));
    console.log('setAsideAmount: After', setAsideAmount);

    let installmentSetAsideAmount = setAsideAmount;
    let nonCapitalizedInterestInstallment =
      requestData.setAsideRequestOutcomeData.non_cptl_int_istl_amt;
    let deferredNonCapitalizedInterestInstallment =
      requestData.setAsideRequestOutcomeData.dfr_non_cptl_int_istl_amt;
    let deferredInterestInstallment =
      requestData.setAsideRequestOutcomeData.dfr_int_istl_amt;
    let accruedInterestAmount =
      requestData.setAsideRequestOutcomeData.acru_int_amt;

    // Output values
    let nonCapitalizedInterestAmount: number = 0;
    let deferredNonCapitalizedInterestAmount: number = 0;
    let deferredInterestAmount: number = 0;
    let setAsideInterestAmount: number = 0;

    let setAsidePrincipalAmount: number = 0;

    let remainingAmount = setAsideAmount;
    console.log('installmentSetAsideAmount: 1', installmentSetAsideAmount);
    console.log('remainingAmount: 1', remainingAmount);

    // Step 1: Non-Capitalized Interest Amount
    nonCapitalizedInterestAmount = Math.min(
      remainingAmount,
      nonCapitalizedInterestInstallment
    );
    remainingAmount -= nonCapitalizedInterestAmount;

    console.log('remainingAmount: 2', remainingAmount);
    console.log(
      'nonCapitalizedInterestAmount: 1',
      nonCapitalizedInterestAmount
    );

    // Step 2: Deferred Non-Capitalized Interest Amount
    if (remainingAmount >= deferredNonCapitalizedInterestInstallment) {
      deferredNonCapitalizedInterestAmount =
        deferredNonCapitalizedInterestInstallment;
    } else if (remainingAmount <= 0) {
      deferredNonCapitalizedInterestAmount = 0;
    } else {
      deferredNonCapitalizedInterestAmount = remainingAmount;
    }
    remainingAmount -= deferredNonCapitalizedInterestAmount;

    console.log('remainingAmount: 3', remainingAmount);
    console.log(
      'deferredNonCapitalizedInterestAmount: 1',
      deferredNonCapitalizedInterestAmount
    );

    // Step 3: Deferred Interest Amount
    if (remainingAmount >= deferredInterestInstallment) {
      deferredInterestAmount = deferredInterestInstallment;
    } else if (remainingAmount <= 0) {
      deferredInterestAmount = 0;
    } else {
      deferredInterestAmount = remainingAmount;
    }
    remainingAmount -= deferredInterestAmount;

    console.log('remainingAmount: 4', remainingAmount);
    console.log('deferredInterestAmount: 1', deferredInterestAmount);

    // Step 4: Set-Aside Interest Amount
    if (remainingAmount >= accruedInterestAmount) {
      setAsideInterestAmount = accruedInterestAmount;
    } else if (remainingAmount <= 0) {
      setAsideInterestAmount = 0;
    } else {
      setAsideInterestAmount = remainingAmount;
    }
    remainingAmount -= setAsideInterestAmount;

    console.log('remainingAmount: 5', remainingAmount);
    console.log('setAsideInterestAmount: 1', setAsideInterestAmount);

    // Step 5: Set-Aside Principal Amount
    if (
      installmentSetAsideAmount <=
      nonCapitalizedInterestInstallment +
        deferredNonCapitalizedInterestInstallment +
        deferredInterestInstallment +
        accruedInterestAmount
    ) {
      setAsidePrincipalAmount = 0;
    } else {
      setAsidePrincipalAmount = remainingAmount;
    }

    console.log('installmentSetAsideAmount: 2', installmentSetAsideAmount);
    console.log('remainingAmount: 6', remainingAmount);
    console.log('setAsidePrincipalAmount: 1', setAsidePrincipalAmount);

    console.log('setAsidePrincipalAmount: ', setAsidePrincipalAmount);
    console.log(
      'deferredNonCapitalizedInterestAmount: ',
      deferredNonCapitalizedInterestAmount
    );
    console.log('setAsideInterestAmount: ', setAsideInterestAmount);
    console.log('nonCapitalizedInterestAmount: ', nonCapitalizedInterestAmount);
    console.log('deferredInterestAmount: ', deferredInterestAmount);

    requestData.setAsideRequestOutcomeData.set_asd_prn_amt =
      setAsidePrincipalAmount;
    requestData.setAsideRequestOutcomeData.set_asd_non_cptl_amt =
      nonCapitalizedInterestAmount;
    requestData.setAsideRequestOutcomeData.set_asd_int_amt =
      setAsideInterestAmount;
    requestData.setAsideRequestOutcomeData.set_asd_dfr_non_cptl_amt =
      deferredNonCapitalizedInterestAmount;
    requestData.setAsideRequestOutcomeData.set_asd_dfr_amt =
      deferredInterestAmount;
  }

  /**
   * CSGWS processSetAsideForLoan call
   * @param coreCustomerIdentifier User's/Customer's CCID
   * @returns CSGWS processSetAsideForLoanResponse
   */
  public processSetAsideForLoan(
    coreCustomerID: number,
    loanID: number,
    userIdentity: string,
    disasterDesignationCode: string,
    effectiveDate: string,
    installmentDate: string,
    installmentSetAsideAmount: number,
    paymentsAfterInstallmentDateAmount: number
  ): Observable<ProcessSetAsideForLoanData> {
    const request: ProcessSetAsideForLoanRequest = {
      coreCustomerID,
      loanID,
      userIdentity,
      disasterDesignationCode,
      effectiveDate,
      installmentDate,
      installmentSetAsideAmount,
      paymentsAfterInstallmentDateAmount,
    };

    const body = JSON.stringify(request);
    return this.http.post<ProcessSetAsideForLoanData>(
      this.processSetAsideForLoanUrl,
      body
    );
  }

  /**
   * save a new set Aside confirmation record to the backend server.
   *
   * @param requestId The Set Aside request's ID
   * @returns {Promise<any>} - A Promise that resolves to the server's response or null on error.
   */
  public saveSetAsideConfirmation(
    requestId: number,
    confirmationNumber: string,
    eAuthId: string
  ): Observable<any> {
    const request: SaveSetAsideConfirmationRequest = {
      requestId,
      confirmationNumber,
      eAuthId,
    };

    const body = JSON.stringify(request);
    return this.http.post<SaveSetAsideConfirmationRequestResponse>(
      this.saveSetAsideConfirmationUrl,
      body
    );
  }

  /**
   * Accessor function to enable testing of prepareSetAsideRequestOutcomeData in test files.
   * @param requestData
   */
  public testPrepareSetAsideRequestOutcomeData(
    requestData: SetAsideRequestCompleteData
  ) {
    this.prepareSetAsideRequestOutcomeData(requestData);
  }

  /**
   * Retrieves the set_asd_rqst data and set_asd_rqst_otcm data associated with the passed in Request Loan ID.
   *
   * Calls the getAllSetAsideData Lambda function.
   *
   * @returns {Observable<SetAsideRequestCompleteData>} An observable of the Set Aside Loan Complete Data object.
   */
  getAllSetAsideData(
    requestLoanId: number
  ): Observable<SetAsideRequestCompleteData> {
    const route = 'getAllSetAsideData/' + requestLoanId;
    return from(
      this.httpRequestService.get<SetAsideRequestCompleteData>(route)
    ).pipe(
      map((response) => {
        const completeDataResponse: SetAsideRequestCompleteData = {
          setAsideRequestData: response.setAsideRequestData[0],
          setAsideRequestOutcomeData: response.setAsideRequestOutcomeData[0],
        };
        return completeDataResponse;
      })
    );
  }

  /**
   * Create a new set aside request record to the backend server using set_asd schema.
   *
   * @param {SetAsideRequestCompleteData2} requestData - The data to be saved for the service request.
   * @returns {Promise<any>} - A Promise that resolves to the server's response or null on error.
   */
  async saveSetAsideRequest2(requestData: SetAsideRequestData2): Promise<any> {
    const route = 'setAsideRequestParent';
    try {
      console.log(
        'Sending setAsideRequestData: ',
        JSON.stringify(requestData, null, 2)
      );
      const response = await this.httpRequestService.post(route, requestData);
      console.log(
        'SetAsideRequestResponse after saving in DB: ',
        JSON.stringify(response, null, 2)
      );
      return response;
    } catch (error) {
      console.error('Error saving set-aside request:', error);
      return null;
    }
  }

  /**
   * Retrieves the set_asd_rqst data and set_asd_rqst_otcm data associated with the passed in Request Loan ID.
   *
   * Calls the getSetAsideOutcome Lambda function.
   *
   * @returns {Observable<SetAsideRequestCompleteData>} An observable of the Set Aside Loan Complete Data object.
   */
  getSetAsideOutcome(requestId: number, loanId: number): Observable<SetAsideOutcomeResponse> {
    const route = `getSetAsideOutcome/${requestId}/${loanId}`;
    return from(
      this.httpRequestService
        .get<SetAsideOutcomeResponse>(route)
        .then((response) => response)
        .catch((error) => {
          console.error(
            `Failed to fetch set-aside outcome for request ${requestId} and loan ${loanId}:`,
            error
          );
          return { loan_id: loanId, setAsideRequest: null };
        })
    );
  }

  deleteSetAsideRequest(setAsdReqId: number): Observable<any> {
    const route = 'deleteSetAsideRequest';
    const payload = { set_asd_rqst_id: setAsdReqId };
    return from(
      this.httpRequestService
        .post(route, payload)
        .then((response) => {
          console.log('Delete response:', JSON.stringify(response, null, 2));
          return { success: true, response };
        })
        .catch((error) => {
          console.error('Error deleting set-aside request:', error);
          throw error;
        })
    );
  }

  setAsideTrans(taskId: number, loanId: number, confirmationNumber: string, eAuthId: string): Observable<any> {
    const payload = { taskId: taskId, loanId: loanId, confirmationNumber: confirmationNumber, eAuthId: eAuthId };
    const body = JSON.stringify(payload);

    return this.http.post<any>(
      this.setAsideTransUrl,
      body
    );
  }

  setAsideRequestOutcome(data: SetAsideRequestOutcomeData, useSetAsideSchema: boolean): Observable<any> {
    const body = JSON.stringify(data);
    if(useSetAsideSchema) {
      return this.http.post<any>(
        this.setAsideRequestOutcomeUrl+"?useSetAsideSchema=Y",
        body
      );
    }
    return this.http.post<any>(
      this.setAsideRequestOutcomeUrl,
      body
    );
  }

  fetchFSA2501FormData(requestId: string, fundCode:number, loanNumber: string): Observable<any> {

      const route = 'get2501FormDetails';

      let params = new HttpParams();
      params = params.append('rqstId', requestId);
      params = params.append('fundCode', fundCode);
      params = params.append('loanNumber', loanNumber);
      const headers = new HttpHeaders({});

      return this.httpRequestService.getWithParams(route, headers, params);

  }

}
