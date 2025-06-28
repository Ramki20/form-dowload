import { HttpErrorResponse } from '@angular/common/http';
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
});
