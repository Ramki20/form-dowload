import {
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import {
  SetAsideRequestCompleteData,
  SetAsideRequestData,
  SetAsideRequestOutcomeData,
} from '../../interfaces/requestData.interface';
import { mockSetAsideRequestCompleteData } from '../../testing/SetAsideRequestCompleteData';
import { HttpRequestService } from '../httpRequest/httpRequest.service';
import { SetAsideRequestService } from './setAsideRequest.service';
import {
  SetAsideRequestCompleteData2,
  SetAsideOutcomeResponse,
  SetAsideRequestData2,
} from '../../interfaces/pre-close.model';
import { from } from 'rxjs';

const SECONDS = 1000;
jest.setTimeout(70 * SECONDS);

let jestRequestData: SetAsideRequestData = {
  rqst_id: 1,
  addm_dt: new Date(),
  dstr_dsgt_cd: 'M123',
  eff_dt: new Date(),
  istl_dt: new Date(),
  istl_set_asd_amt: 125.0,
  istl_paid_amt: 4589.0,
  cre_user_nm: '12485656',
  rqst_stat_cd: 'PENDING',
  set_asd_type_cd: 'DSA',
};

const mockSetAsideRequestCompleteData2: SetAsideRequestCompleteData2 = {
  setAsideRequestData: {
    rqst_id: 1,
    loan_id: 1,
    task_id: 1,
    addm_dt: new Date('2024-01-01'),
    dstr_dsgt_cd: 'M123',
    set_asd_type_cd: 'DSA',
    eff_dt: new Date('2024-01-01'),
    istl_dt: new Date('2025-01-01'),
    istl_set_asd_amt: 125.0,
    istl_paid_amt: 4589.0,
    eauth_id: '12485656',
    flpCustomerId: 1,
    caseNumber: 1,
    fundCode: 1,
    lastCashCreditDate: new Date('2024-01-01'),
    loanAmount: 1,
    loanClosingDate: '2024-01-01',
    loanExpirationDate: new Date('2024-01-01'),
    loanNumber: '1',
    loanRelationshipTypeCode: 'P',
    loanType: 'P',
    loanWriteOffDescription: 'string',
    nextInstallmentAmount: 1,
    totalLoanScheduledAmount: 1,
    totalUnpaidInterestAmount: 1,
    unpaidPrincipalAmount: 1,
    unpaidInterestAmount: 1,
  },
  setAsideRequestOutcomeData: {
    set_asd_request_id: 0,
    fund_cd: 'FC',
    loan_nbr: '123456',
    orgn_loan_dt: new Date('2024-01-01'),
    unpd_prn: 10000,
    unpd_int: 500,
    note_int_rt: 3.5,
    acru_int_amt: 200,
    non_cptl_int_istl_amt: 100,
    dfr_non_cptl_int_istl_amt: 50,
    dfr_int_istl_amt: 50,
    set_asd_int_amt: 0,
    set_asd_prn_amt: 0,
    set_asd_non_cptl_amt: 0,
    set_asd_dfr_non_cptl_amt: 0,
    set_asd_dfr_amt: 0,
    dir_loan_type_cd: 'FO',
    cre_user_nm: '12485656',
  },
};

const mockProcessSetAsideResponse = {
  success: true,
  loanId: 1,
  confirmationNumber: 'CONF123',
};

const mockSaveConfirmationResponse = {
  requestId: 1,
  confirmationNumber: 'CONF123',
  status: 'SUCCESS',
};

const mockSetAsideOutcomeResponse = {
  loan_id: 60,
  setAsideRequest: {
    requestData: mockSetAsideRequestCompleteData2.setAsideRequestData,
    outcomeData: mockSetAsideRequestCompleteData2.setAsideRequestOutcomeData,
  },
};

describe('SetAsideRequestService', () => {
  let service: SetAsideRequestService;
  let httpMock: HttpTestingController;
  let mockRequestData: SetAsideRequestData = jestRequestData;
  let httpRequestService: HttpRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [SetAsideRequestService],
    });
    service = TestBed.inject(SetAsideRequestService);
    httpMock = TestBed.inject(HttpTestingController);
    httpRequestService = TestBed.inject(HttpRequestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveSetAsideRequest', () => {
    var requestData: SetAsideRequestCompleteData = {
      setAsideRequestData: {} as SetAsideRequestData,
      setAsideRequestOutcomeData: {} as SetAsideRequestOutcomeData,
    };
    it('Should call the http.post service', () => {
      let API_URL =
        'https://apps.int.fsa.fpac.usda.gov/fls/api/svcn/setAsideRequest';

      let myObject: SetAsideRequestData = {
        rqst_id: 1,
        addm_dt: new Date(),
        dstr_dsgt_cd: 'M123',
        eff_dt: new Date(),
        istl_dt: new Date(),
        istl_set_asd_amt: 125.0,
        istl_paid_amt: 4589.0,
        cre_user_nm: '12485656',
        rqst_stat_cd: 'PENDING',
        set_asd_type_cd: 'DSA',
      };
      requestData.setAsideRequestData = myObject;
      service.saveSetAsideRequest(requestData);
      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toEqual('POST');
    });

    it('Should print ... in the console', async () => {
      jest.spyOn(httpRequestService, 'post').mockResolvedValue('');
      const logSpy = jest.spyOn(console, 'log');
      let myObject: SetAsideRequestData = {
        rqst_id: 1,
        addm_dt: new Date(),
        dstr_dsgt_cd: 'M123',
        eff_dt: new Date(),
        istl_dt: new Date(),
        istl_set_asd_amt: 125.0,
        istl_paid_amt: 4589.0,
        cre_user_nm: '12485656',
        rqst_stat_cd: 'PENDING',
        set_asd_type_cd: 'DBSA',
      };
      requestData.setAsideRequestData = myObject;
      let myResponse = await service.saveSetAsideRequest(requestData);
      const expectedResponse = {
        setAsideOutcomeResponse: undefined,
        setAsideRequestResponse: '',
      };
      expect(myResponse).toStrictEqual(expectedResponse);
    });

    it('Should through error', async () => {
      jest
        .spyOn(httpRequestService, 'post')
        .mockRejectedValue(
          new HttpErrorResponse({ error: 'Some error message' })
        );
      const logSpy = jest.spyOn(console, 'log');
      let myObject: SetAsideRequestData = {
        rqst_id: 1,
        addm_dt: new Date(),
        dstr_dsgt_cd: 'M123',
        eff_dt: new Date(),
        istl_dt: new Date(),
        istl_set_asd_amt: 125.0,
        istl_paid_amt: 4589.0,
        cre_user_nm: '12485656',
        rqst_stat_cd: 'PENDING',
        set_asd_type_cd: 'DSA',
      };
      requestData.setAsideRequestData = myObject;
      let myResponse = await service.saveSetAsideRequest(requestData);
      expect(myResponse).toBeNull();
    });
  });

  describe('prepareSetAsideRequestOutcomeData', () => {
    it('should exist', () => {
      service.testPrepareSetAsideRequestOutcomeData(
        mockSetAsideRequestCompleteData
      );
    });
  });

  describe('getAllSetAsideData', () => {
    it('getAllSetAsideData()', fakeAsync(() => {
      let httpHandlerSpy = jest
        .spyOn(httpRequestService, 'get')
        .mockReturnValue(
          Promise.resolve({
            setAsideRequestData: [
              {
                rqst_id: 1,
                addm_dt: new Date('1/1/1111'),
              },
            ],
            setAsideRequestOutcomeData: [
              {
                rqst_loan_id: 60,
                fund_cd: 'Test Fund Code',
              },
            ],
          })
        );

      let requestRecordsRetrieved = service.getAllSetAsideData(60);
      let completeDataResponse: SetAsideRequestCompleteData;
      requestRecordsRetrieved.subscribe(
        (result) => (completeDataResponse = result)
      );

      tick();
      expect(httpHandlerSpy).toHaveBeenCalledWith('getAllSetAsideData/60');
      expect(
        completeDataResponse!.setAsideRequestOutcomeData.rqst_loan_id
      ).toEqual(60);
      expect(completeDataResponse!.setAsideRequestData.rqst_id).toEqual(1);
    }));
  });

  describe('getSetAsideOutcome', () => {
    it('should return set aside outcome data on success', fakeAsync(() => {
      const requestId = 60;
      const loanId = 60;

      jest
        .spyOn(httpRequestService, 'get')
        .mockResolvedValue(mockSetAsideOutcomeResponse);

      let result: SetAsideOutcomeResponse | undefined;
      service.getSetAsideOutcome(requestId, loanId).subscribe((response) => {
        result = response;
      });
      tick();

      expect(httpRequestService.get).toHaveBeenCalledWith(
        `getSetAsideOutcome/${requestId}/${loanId}`
      );
      expect(result).toEqual(mockSetAsideOutcomeResponse);
      flush();
    }));

    it('should return fallback response on error', fakeAsync(() => {
      const requestId = 60;
      const loanId = 60;

      jest
        .spyOn(httpRequestService, 'get')
        .mockRejectedValue(new Error('Fetch error'));

      let result: SetAsideOutcomeResponse | undefined;
      service.getSetAsideOutcome(requestId, loanId).subscribe((response) => {
        result = response;
      });
      tick();

      expect(httpRequestService.get).toHaveBeenCalledWith(
        `getSetAsideOutcome/${requestId}/${loanId}`
      );
      expect(result).toEqual({ loan_id: loanId, setAsideRequest: null });
      flush();
    }));
  });

  describe('deleteSetAsideRequest', () => {
    it('should call httpRequestService.post with correct request and return success', fakeAsync(() => {
      const setAsdReqId = 123;
      const mockResponse = { deleted: true };
      jest.spyOn(httpRequestService, 'post').mockResolvedValue(mockResponse);

      let result: any;
      service.deleteSetAsideRequest(setAsdReqId).subscribe((response) => {
        result = response;
      });
      tick();

      expect(httpRequestService.post).toHaveBeenCalledWith(
        'deleteSetAsideRequest',
        {
          set_asd_rqst_id: setAsdReqId,
        }
      );
      expect(result).toEqual({ success: true, response: mockResponse });
      flush();
    }));

    it('should throw error on failure', fakeAsync(() => {
      const setAsdReqId = 123;
      const mockError = new Error('Delete error');
      jest.spyOn(httpRequestService, 'post').mockRejectedValue(mockError);
      const errorSpy = jest.spyOn(console, 'error');

      let error: any;
      service.deleteSetAsideRequest(setAsdReqId).subscribe({
        error: (err) => {
          error = err;
        },
      });
      tick();

      expect(httpRequestService.post).toHaveBeenCalledWith(
        'deleteSetAsideRequest',
        {
          set_asd_rqst_id: setAsdReqId,
        }
      );
      expect(error).toBe(mockError);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error deleting set-aside request:',
        mockError
      );
      flush();
    }));
  });

  describe('processSetAsideForLoan', () => {
    it('should call http.post with correct parameters and return ProcessSetAsideForLoanData', () => {
      const mockRequest = {
        coreCustomerID: 12345,
        loanID: 67890,
        userIdentity: 'testUser',
        disasterDesignationCode: 'DST001',
        effectiveDate: '2024-01-01',
        installmentDate: '2024-02-01',
        installmentSetAsideAmount: 1000.0,
        paymentsAfterInstallmentDateAmount: 500.0,
      };

      const mockResponse = {
        success: true,
        message: 'Set aside processed successfully',
      };

      service
        .processSetAsideForLoan(
          mockRequest.coreCustomerID,
          mockRequest.loanID,
          mockRequest.userIdentity,
          mockRequest.disasterDesignationCode,
          mockRequest.effectiveDate,
          mockRequest.installmentDate,
          mockRequest.installmentSetAsideAmount,
          mockRequest.paymentsAfterInstallmentDateAmount
        )
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(service.processSetAsideForLoanUrl);
      expect(req.request.method).toBe('POST');
      expect(JSON.parse(req.request.body)).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle error in processSetAsideForLoan', () => {
      const errorResponse = {
        status: 500,
        statusText: 'Internal Server Error',
      };

      service
        .processSetAsideForLoan(
          12345,
          67890,
          'testUser',
          'DST001',
          '2024-01-01',
          '2024-02-01',
          1000.0,
          500.0
        )
        .subscribe({
          next: () => fail('Expected an error'),
          error: (error) => {
            expect(error.status).toBe(500);
          },
        });

      const req = httpMock.expectOne(service.processSetAsideForLoanUrl);
      req.flush('Error occurred', errorResponse);
    });
  });

  describe('saveSetAsideConfirmation', () => {
    it('should call http.post with correct parameters and return confirmation response', () => {
      const requestId = 123;
      const confirmationNumber = 'CONF456';
      const eAuthId = 'AUTH789';

      const mockRequest = {
        requestId,
        confirmationNumber,
        eAuthId,
      };

      const mockResponse = {
        success: true,
        confirmationId: 'CONF456',
      };

      service
        .saveSetAsideConfirmation(requestId, confirmationNumber, eAuthId)
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(service.saveSetAsideConfirmationUrl);
      expect(req.request.method).toBe('POST');
      expect(JSON.parse(req.request.body)).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle error in saveSetAsideConfirmation', () => {
      const errorResponse = { status: 400, statusText: 'Bad Request' };

      service.saveSetAsideConfirmation(123, 'CONF456', 'AUTH789').subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(service.saveSetAsideConfirmationUrl);
      req.flush('Invalid request', errorResponse);
    });
  });

  describe('saveSetAsideRequest2', () => {
    it('should save set aside request using new schema and return response', async () => {
      const mockRequestData: SetAsideRequestData2 = {
        rqst_id: 1,
        loan_id: 1,
        task_id: 1,
        addm_dt: new Date('2024-01-01'),
        dstr_dsgt_cd: 'M123',
        set_asd_type_cd: 'DSA',
        eff_dt: new Date('2024-01-01'),
        istl_dt: new Date('2025-01-01'),
        istl_set_asd_amt: 125.0,
        istl_paid_amt: 4589.0,
        eauth_id: '12485656',
        flpCustomerId: 1,
        caseNumber: 1,
        fundCode: 1,
        lastCashCreditDate: new Date('2024-01-01'),
        loanAmount: 1,
        loanClosingDate: '2024-01-01',
        loanExpirationDate: new Date('2024-01-01'),
        loanNumber: '1',
        loanRelationshipTypeCode: 'P',
        loanType: 'P',
        loanWriteOffDescription: 'string',
        nextInstallmentAmount: 1,
        totalLoanScheduledAmount: 1,
        totalUnpaidInterestAmount: 1,
        unpaidPrincipalAmount: 1,
        unpaidInterestAmount: 1,
      };

      const mockResponse = { success: true, requestId: 1 };
      const consoleSpy = jest.spyOn(console, 'log');

      jest.spyOn(httpRequestService, 'post').mockResolvedValue(mockResponse);

      const result = await service.saveSetAsideRequest2(mockRequestData);

      expect(httpRequestService.post).toHaveBeenCalledWith(
        'setAsideRequestParent',
        mockRequestData
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Sending setAsideRequestData: ',
        JSON.stringify(mockRequestData, null, 2)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'SetAsideRequestResponse after saving in DB: ',
        JSON.stringify(mockResponse, null, 2)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle error in saveSetAsideRequest2 and return null', async () => {
      const mockRequestData: SetAsideRequestData2 = {
        rqst_id: 1,
        loan_id: 1,
        task_id: 1,
        addm_dt: new Date('2024-01-01'),
        dstr_dsgt_cd: 'M123',
        set_asd_type_cd: 'DSA',
        eff_dt: new Date('2024-01-01'),
        istl_dt: new Date('2025-01-01'),
        istl_set_asd_amt: 125.0,
        istl_paid_amt: 4589.0,
        eauth_id: '12485656',
        flpCustomerId: 1,
        caseNumber: 1,
        fundCode: 1,
        lastCashCreditDate: new Date('2024-01-01'),
        loanAmount: 1,
        loanClosingDate: '2024-01-01',
        loanExpirationDate: new Date('2024-01-01'),
        loanNumber: '1',
        loanRelationshipTypeCode: 'P',
        loanType: 'P',
        loanWriteOffDescription: 'string',
        nextInstallmentAmount: 1,
        totalLoanScheduledAmount: 1,
        totalUnpaidInterestAmount: 1,
        unpaidPrincipalAmount: 1,
        unpaidInterestAmount: 1,
      };

      const mockError = new Error('Save failed');
      const errorSpy = jest.spyOn(console, 'error');

      jest.spyOn(httpRequestService, 'post').mockRejectedValue(mockError);

      const result = await service.saveSetAsideRequest2(mockRequestData);

      expect(httpRequestService.post).toHaveBeenCalledWith(
        'setAsideRequestParent',
        mockRequestData
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Error saving set-aside request:',
        mockError
      );
      expect(result).toBeNull();
    });
  });

  describe('setAsideTrans', () => {
    it('should call http.post with correct parameters for setAsideTrans', () => {
      const taskId = 123;
      const loanId = 456;
      const confirmationNumber = 'CONF789';
      const eAuthId = 'AUTH123';

      const expectedPayload = {
        taskId,
        loanId,
        confirmationNumber,
        eAuthId,
      };

      const mockResponse = { success: true };

      service
        .setAsideTrans(taskId, loanId, confirmationNumber, eAuthId)
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(service.setAsideTransUrl);
      expect(req.request.method).toBe('POST');
      expect(JSON.parse(req.request.body)).toEqual(expectedPayload);
      req.flush(mockResponse);
    });

    it('should handle error in setAsideTrans', () => {
      const errorResponse = {
        status: 500,
        statusText: 'Internal Server Error',
      };

      service.setAsideTrans(123, 456, 'CONF789', 'AUTH123').subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(service.setAsideTransUrl);
      req.flush('Error occurred', errorResponse);
    });
  });

  describe('setAsideRequestOutcome', () => {
    const mockOutcomeData: SetAsideRequestOutcomeData = {
      fund_cd: 'FC',
      loan_nbr: '123456',
      orgn_loan_dt: new Date('2024-01-01'),
      unpd_prn: 10000,
      unpd_int: 500,
      note_int_rt: 3.5,
      acru_int_amt: 200,
      non_cptl_int_istl_amt: 100,
      dfr_non_cptl_int_istl_amt: 50,
      dfr_int_istl_amt: 50,
      set_asd_int_amt: 0,
      set_asd_prn_amt: 0,
      set_asd_non_cptl_amt: 0,
      set_asd_dfr_non_cptl_amt: 0,
      set_asd_dfr_amt: 0,
      dir_loan_type_cd: 'FO',
      cre_user_nm: '12485656',
    };

    it('should call http.post with useSetAsideSchema=Y when flag is true', () => {
      const mockResponse = { success: true };

      service
        .setAsideRequestOutcome(mockOutcomeData, true)
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(
        `${service.setAsideRequestOutcomeUrl}?useSetAsideSchema=Y`
      );
      expect(req.request.method).toBe('POST');
      
      // When JSON.stringify is called on the Date object, it becomes an ISO string
      const expectedBody = {
        ...mockOutcomeData,
        orgn_loan_dt: mockOutcomeData.orgn_loan_dt.toISOString()
      };
      expect(JSON.parse(req.request.body)).toEqual(expectedBody);
      req.flush(mockResponse);
    });

    it('should call http.post without query parameter when flag is false', () => {
      const mockResponse = { success: true };

      service
        .setAsideRequestOutcome(mockOutcomeData, false)
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(service.setAsideRequestOutcomeUrl);
      expect(req.request.method).toBe('POST');
      
      // When JSON.stringify is called on the Date object, it becomes an ISO string
      const expectedBody = {
        ...mockOutcomeData,
        orgn_loan_dt: mockOutcomeData.orgn_loan_dt.toISOString()
      };
      expect(JSON.parse(req.request.body)).toEqual(expectedBody);
      req.flush(mockResponse);
    });

    it('should handle error in setAsideRequestOutcome', () => {
      const errorResponse = { status: 422, statusText: 'Unprocessable Entity' };

      service.setAsideRequestOutcome(mockOutcomeData, false).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(422);
        },
      });

      const req = httpMock.expectOne(service.setAsideRequestOutcomeUrl);
      req.flush('Validation error', errorResponse);
    });
  });

  describe('fetchFSA2501FormData', () => {
    it('should call httpRequestService.getWithParams with correct parameters', fakeAsync(() => {
      const requestId = '123';
      const fundCode = 456;
      const loanNumber = '789';

      const mockResponse = { formData: 'test data' };

      jest
        .spyOn(httpRequestService, 'getWithParams')
        .mockReturnValue(from(Promise.resolve(mockResponse)));

      service
        .fetchFSA2501FormData(requestId, fundCode, loanNumber)
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      tick();

      expect(httpRequestService.getWithParams).toHaveBeenCalledTimes(1);
      
      // Get the actual call arguments
      const callArgs = (httpRequestService.getWithParams as jest.Mock).mock.calls[0];
      const [route, headers, params] = callArgs;
      
      // Verify the route
      expect(route).toBe('get2501FormDetails');
      
      // Verify headers is an HttpHeaders instance
      expect(headers).toBeInstanceOf(HttpHeaders);
      
      // Verify params is an HttpParams instance and contains correct values
      expect(params).toBeInstanceOf(HttpParams);
      expect(params.get('rqstId')).toBe(requestId);
      expect(params.get('fundCode')).toBe(fundCode.toString());
      expect(params.get('loanNumber')).toBe(loanNumber);
      
      flush();
    }));

    it('should handle error in fetchFSA2501FormData', fakeAsync(() => {
      const requestId = '123';
      const fundCode = 456;
      const loanNumber = '789';

      const mockError = new Error('Fetch error');

      jest
        .spyOn(httpRequestService, 'getWithParams')
        .mockReturnValue(from(Promise.reject(mockError)));

      let error: any;
      service.fetchFSA2501FormData(requestId, fundCode, loanNumber).subscribe({
        next: () => fail('Expected an error'),
        error: (err) => {
          error = err;
        },
      });

      tick();
      expect(error).toBe(mockError);
      flush();
    }));
  });

  // Additional test for edge cases in prepareSetAsideRequestOutcomeData
  describe('prepareSetAsideRequestOutcomeData - Edge Cases', () => {
    it('should handle zero set aside amount', () => {
      const testData: SetAsideRequestCompleteData = {
        setAsideRequestData: {
          ...jestRequestData,
          istl_set_asd_amt: 0,
        },
        setAsideRequestOutcomeData: {
          ...mockSetAsideRequestCompleteData.setAsideRequestOutcomeData,
          non_cptl_int_istl_amt: 100,
          dfr_non_cptl_int_istl_amt: 50,
          dfr_int_istl_amt: 25,
          acru_int_amt: 75,
        },
      };

      const consoleSpy = jest.spyOn(console, 'log');
      service.testPrepareSetAsideRequestOutcomeData(testData);

      expect(testData.setAsideRequestOutcomeData.set_asd_prn_amt).toBe(0);
      expect(testData.setAsideRequestOutcomeData.set_asd_non_cptl_amt).toBe(0);
      expect(testData.setAsideRequestOutcomeData.set_asd_int_amt).toBe(0);
      expect(testData.setAsideRequestOutcomeData.set_asd_dfr_non_cptl_amt).toBe(
        0
      );
      expect(testData.setAsideRequestOutcomeData.set_asd_dfr_amt).toBe(0);
    });

    it('should handle set aside amount with commas in string format', () => {
      const testData: SetAsideRequestCompleteData = {
        setAsideRequestData: {
          ...jestRequestData,
          istl_set_asd_amt: '1,000.50' as any, // Simulating string with commas
        },
        setAsideRequestOutcomeData: {
          ...mockSetAsideRequestCompleteData.setAsideRequestOutcomeData,
          non_cptl_int_istl_amt: 100,
          dfr_non_cptl_int_istl_amt: 50,
          dfr_int_istl_amt: 25,
          acru_int_amt: 75,
        },
      };

      const consoleSpy = jest.spyOn(console, 'log');
      service.testPrepareSetAsideRequestOutcomeData(testData);

      // Should parse the comma-separated string correctly
      expect(consoleSpy).toHaveBeenCalledWith('setAsideAmount: After', 1000.5);
    });

    it('should handle large set aside amount that covers all categories with remainder', () => {
      const testData: SetAsideRequestCompleteData = {
        setAsideRequestData: {
          ...jestRequestData,
          istl_set_asd_amt: 10000,
        },
        setAsideRequestOutcomeData: {
          ...mockSetAsideRequestCompleteData.setAsideRequestOutcomeData,
          non_cptl_int_istl_amt: 100,
          dfr_non_cptl_int_istl_amt: 50,
          dfr_int_istl_amt: 25,
          acru_int_amt: 75,
        },
      };

      service.testPrepareSetAsideRequestOutcomeData(testData);

      expect(testData.setAsideRequestOutcomeData.set_asd_non_cptl_amt).toBe(
        100
      );
      expect(testData.setAsideRequestOutcomeData.set_asd_dfr_non_cptl_amt).toBe(
        50
      );
      expect(testData.setAsideRequestOutcomeData.set_asd_dfr_amt).toBe(25);
      expect(testData.setAsideRequestOutcomeData.set_asd_int_amt).toBe(75);
      expect(testData.setAsideRequestOutcomeData.set_asd_prn_amt).toBe(9750); // 10000 - 250
    });
  });
});