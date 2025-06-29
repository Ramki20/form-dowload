import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { PreClosingRequestDataService } from './pre-closing-request-data.service';
import { UserLoanDataService } from '../userLoanData/userLoanData.service';
import { LoanInfoService } from '../loanInfo/loanInfo.service';
import { SetAsideRequestService } from '../setAsideRequest/setAsideRequest.service';
import { UserService } from 'src/app/services/login/user.service';
import { SessionService } from 'src/app/services/session/session.service';
import { LoggerService } from 'src/app/services/logger/logger.service';
import { CustomerInfoService } from 'projects/underwriting/src/app/services/customerInfo/customer-info.service';
import { RequestService } from '../request/request.service';
import {
  SetAsideFormData,
  SetAsideInput,
  SetAsideOutcomeResponse,
  SetAsideRequestData2,
} from '../../interfaces/pre-close.model';
import {
  DirectLoan,
  DirectLoanData,
} from '../../interfaces/loanData.interface';
import { CustomerProfileService } from '../customerProfile/customer-profile.service';

const mockDirectLoan: DirectLoan = {
  id: 1,
  fundCode: 123,
  loanNumber: '123456',
  loanRelationshipTypeCode: 'PR',
  loanClosingDate: '2024-01-01',
  unpaidPrincipalAmount: 10000,
  totalUnpaidInterestAmount: 500,
  totalLoanScheduledAmount: 0,
  loanAmount: 20000,
  loanType: 'FO',
  nextInstallmentAmount: 1000,
  loanExpirationDate: new Date(2030, 0, 1),
  lastCashCreditDate: new Date(2024, 0, 1),
  newLoanNumber: 0,
  debtSettlementDescription: '',
  loanWriteOffDescription: '',
  unpaidInterestAmount: 500,
};

const mockSetAsideInput: SetAsideInput = {
  disasterCode: 'M1234',
  setAsideAmount: 5000,
  paymentAmountAfterInstallment: 100,
  installmentDates: ['01/01/2025'],
  setAsideType: 'DSA',
  nextInstallmentDueDate: '2025-01-01',
  loanMaturityDate: '2027-01-01',
  loanTotalInterestAmount: 500,
};

const mockSetAsideRequest: SetAsideRequestData2 = {
  rqst_id: 123,
  loan_id: 1,
  task_id: 1,
  addm_dt: new Date(2024, 0, 1),
  dstr_dsgt_cd: 'M1234',
  eff_dt: new Date(2024, 0, 1),
  istl_dt: new Date(2025, 0, 1),
  istl_set_asd_amt: 5000,
  istl_paid_amt: 100,
  eauth_id: 'user123',
  set_asd_type_cd: 'DSA',
  set_asd_rqst_id: 456,
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

const mockFormData: SetAsideFormData = {
  setAsideType: 'DSA',
  disasterCode: 'M1234',
  approvalDate: '2024-01-01',
  installmentDate: '01/01/2025',
  setAsideAmount: 5000,
  paymentAfterInstallment: 100,
};

describe('PreClosingRequestDataService', () => {
  let service: PreClosingRequestDataService;
  let userLoanDataService: jest.Mocked<Partial<UserLoanDataService>>;
  let loanInfoService: jest.Mocked<Partial<LoanInfoService>>;
  let setAsideRequestService: jest.Mocked<Partial<SetAsideRequestService>>;
  let userService: jest.Mocked<Partial<UserService>>;
  let sessionService: jest.Mocked<Partial<SessionService>>;
  let loggerService: jest.Mocked<Partial<LoggerService>>;
  let customerInfoService: jest.Mocked<Partial<CustomerInfoService>>;
  let requestService: jest.Mocked<Partial<RequestService>>;
  let customerProfileService: jest.Mocked<Partial<CustomerProfileService>>;

  beforeEach(() => {
    userLoanDataService = {
      getDirectLoanInfo: jest
        .fn()
        .mockReturnValue(of<DirectLoanData>({ data: [] })),
      setRequestID: jest.fn(),
      getRequestID: jest.fn().mockReturnValue(123),
    };

    loanInfoService = {
      getSetAsideInputForLoan: jest.fn().mockReturnValue(of({ data: {} })),
    };

    setAsideRequestService = {
      getSetAsideOutcome: jest.fn().mockReturnValue(
        of<SetAsideOutcomeResponse>({
          loan_id: expect.any(Number),
          setAsideRequest: { requestData: null, outcomeData: null },
        })
      ),
      saveSetAsideRequest2: jest
        .fn()
        .mockResolvedValue({ setAsideRequestData: expect.any(Object) }),
      deleteSetAsideRequest: jest.fn().mockReturnValue(of({ success: true })),
    };

    userService = {
      getUserInfoFromSession: jest.fn().mockReturnValue({ eAuthID: 'user123' }),
    };

    sessionService = {
      getCoreCustomerIdentifier: jest.fn().mockReturnValue(null),
      setCoreCustomerIdentifier: jest.fn(),
      setFlpCustomerId: jest.fn(),
      getFlpCustomerId: jest.fn(),
    };

    loggerService = {
      forComponent: jest.fn().mockReturnThis(),
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    customerInfoService = {
      getFlpCustomerInfo: jest.fn().mockReturnValue(
        of({
          data: {
            SCIMSCustomer: { flpCustID: 456 },
            NumberOfCustomersReturned: 1,
          },
        })
      ),
    };

    requestService = {
      getRequestRecords: jest
        .fn()
        .mockReturnValue(
          of([
            {
              requestId: 123,
              requestStatus: 'InProgress',
              typeName: 'Set-Aside',
            },
          ])
        ),
      clearRequest: jest.fn(),
    };

    customerProfileService = {
      getCustomerDetails: jest.fn().mockReturnValue(of([{ caseNumber: 123 }])),
    };

    TestBed.configureTestingModule({
      providers: [
        PreClosingRequestDataService,
        { provide: UserLoanDataService, useValue: userLoanDataService },
        { provide: LoanInfoService, useValue: loanInfoService },
        { provide: SetAsideRequestService, useValue: setAsideRequestService },
        { provide: UserService, useValue: userService },
        { provide: SessionService, useValue: sessionService },
        { provide: LoggerService, useValue: loggerService },
        { provide: CustomerInfoService, useValue: customerInfoService },
        { provide: RequestService, useValue: requestService },
        { provide: CustomerProfileService, useValue: customerProfileService },
      ],
    });

    service = TestBed.inject(PreClosingRequestDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('selectLoan', () => {
    it('should update selectedLoan$ with valid loan', (done) => {
      service.selectLoan(mockDirectLoan);

      service.selectedLoan$.subscribe((loan) => {
        if (loan) {
          expect(loan).toEqual(mockDirectLoan);
          done();
        }
      });
    });

    it('should not select loan with existing set-aside request', (done) => {
      service['updateSubject'](service['setAsideRequestsSubject'], 1, {
        setAsideRequest: mockSetAsideRequest,
      });

      service.selectLoan(mockDirectLoan);

      service.selectedLoan$.subscribe((loan) => {
        expect(loan).toBeNull();
        done();
      });
    });

    it('should allow reselecting the current loan despite set-aside request', (done) => {
      service.selectLoan(mockDirectLoan);
      service['updateSubject'](service['setAsideRequestsSubject'], 1, {
        setAsideRequest: mockSetAsideRequest,
      });

      service.selectLoan(mockDirectLoan);

      service.selectedLoan$.subscribe((loan) => {
        if (loan) {
          expect(loan).toEqual(mockDirectLoan);
          done();
        }
      });
    });
  });

  describe('clearSelectedLoan', () => {
    it('should clear selected loan and form data', (done) => {
      service.selectLoan(mockDirectLoan);
      service.updateSetAsideFormData(1, mockFormData);
      service.clearSelectedLoan();

      service.selectedLoan$.subscribe((loan) => {
        expect(loan).toBeNull();
        service.setAsideFormData$.subscribe((formData) => {
          expect(formData).toEqual([]);
          done();
        });
      });
    });
  });

  describe('updateSetAsideFormData', () => {
    it('should update setAsideFormData$', (done) => {
      service.updateSetAsideFormData(1, mockFormData);

      service.setAsideFormData$.subscribe((formData) => {
        expect(formData).toEqual([{ loanId: 1, formData: mockFormData }]);
        done();
      });
    });
  });

  describe('fetchEligibleLoans', () => {
    it('should fetch and filter eligible loans with inputs, requests, and outcomes', fakeAsync(() => {
      const mockLoans: DirectLoan[] = [
        { ...mockDirectLoan, id: 1, loanRelationshipTypeCode: 'PR' },
        { ...mockDirectLoan, id: 2, loanRelationshipTypeCode: 'OTHER' },
      ];
      jest
        .spyOn(userLoanDataService, 'getDirectLoanInfo')
        .mockReturnValue(of({ data: mockLoans }));
      jest.spyOn(loanInfoService, 'getSetAsideInputForLoan').mockReturnValue(
        of({
          data: {
            originalLoanClosedDate: '2023-01-01',
            nextInstallmentDueDate: '2025-01-01',
            loanMaturityDate: '2027-01-01',
            disasterCode: 'M1234',
            setAsideAmount: 5000,
            paymentAmountAfterInstallment: 100,
            installmentDates: ['01/01/2025'],
            setAsideType: 'DSA',
            loanTotalInterestAmount: 500,
          },
        })
      );
      jest.spyOn(setAsideRequestService, 'getSetAsideOutcome').mockReturnValue(
        of({
          loan_id: 1,
          setAsideRequest: {
            requestData: mockSetAsideRequest,
            outcomeData: null,
          },
        })
      );

      service.fetchEligibleLoans('123');
      tick();

      service.eligibleLoans$.subscribe((loans) => {
        expect(loans.length).toBe(1);
        expect(loans[0].id).toBe(1);
        expect(loans[0].loanRelationshipTypeCode).toBe('PR');
      });

      service.setAsideInputs$.subscribe((inputs) => {
        expect(inputs).toContainEqual({
          loanId: 1,
          setAsideInput: expect.objectContaining({ disasterCode: 'M1234' }),
        });
      });

      service.setAsideRequests$.subscribe((requests) => {
        expect(requests).toContainEqual({
          loanId: 1,
          setAsideRequest: expect.objectContaining({ set_asd_type_cd: 'DSA' }),
        });
      });

      flush();
    }));

    it('should handle empty loan list', fakeAsync(() => {
      jest
        .spyOn(userLoanDataService, 'getDirectLoanInfo')
        .mockReturnValue(of({ data: [] }));

      service.fetchEligibleLoans('123');
      tick();

      service.eligibleLoans$.subscribe((loans) => {
        expect(loans).toEqual([]);
      });

      service.setAsideInputs$.subscribe((inputs) => {
        expect(inputs).toEqual([]);
      });

      service.setAsideRequests$.subscribe((requests) => {
        expect(requests).toEqual([]);
      });

      flush();
    }));
  });

  describe('fetchSetAsideInput', () => {
    it('should fetch and store set-aside input', fakeAsync(() => {
      jest.spyOn(loanInfoService, 'getSetAsideInputForLoan').mockReturnValue(
        of({
          data: {
            disasterCode: 'M1234',
            setAsideAmount: 5000,
            paymentAmountAfterInstallment: 100,
            installmentDates: ['01/01/2025'],
            setAsideType: 'DSA',
            nextInstallmentDueDate: '2025-01-01',
            loanMaturityDate: '2027-01-01',
            loanTotalInterestAmount: 500,
          },
        })
      );

      service['fetchSetAsideInput'](1);
      tick();

      service.setAsideInputs$.subscribe((inputs) => {
        expect(inputs).toContainEqual({
          loanId: 1,
          setAsideInput: expect.objectContaining({ disasterCode: 'M1234' }),
        });
      });

      flush();
    }));
  });

  describe('fetchSetAsideOutcome', () => {
    it('should fetch and store set-aside outcome', fakeAsync(() => {
      jest.spyOn(setAsideRequestService, 'getSetAsideOutcome').mockReturnValue(
        of({
          loan_id: 1,
          setAsideRequest: {
            requestData: mockSetAsideRequest,
            outcomeData: null,
          },
        })
      );

      service['fetchSetAsideOutcome'](1);
      tick();

      service.setAsideRequests$.subscribe((requests) => {
        expect(requests).toContainEqual({
          loanId: 1,
          setAsideRequest: expect.objectContaining({ set_asd_type_cd: 'DSA' }),
        });
      });

      service.setAsideOutcomes$.subscribe((outcomes) => {
        expect(outcomes).toContainEqual({
          loanId: 1,
          setAsideOutcome: null,
        });
      });

      flush();
    }));

    it('should handle error in fetching outcome', fakeAsync(() => {
      jest
        .spyOn(setAsideRequestService, 'getSetAsideOutcome')
        .mockReturnValue(throwError(() => new Error('Fetch failed')));

      service['fetchSetAsideOutcome'](1);
      tick();

      service.setAsideRequests$.subscribe((requests) => {
        expect(requests).toContainEqual({
          loanId: 1,
          setAsideRequest: null,
        });
      });

      service.setAsideOutcomes$.subscribe((outcomes) => {
        expect(outcomes).toContainEqual({
          loanId: 1,
          setAsideOutcome: null,
        });
      });

      flush();
    }));
  });

  describe('saveSetAsideInfo', () => {
    it('should throw error if no loan selected', async () => {
      await expect(service.saveSetAsideInfo(mockFormData)).rejects.toThrow(
        'No loan selected'
      );
    });

    describe('with selected loan', () => {
      beforeEach(() => {
        service.selectLoan(mockDirectLoan);
        service['requestIdSubject'].next(123);
        jest
          .spyOn(setAsideRequestService, 'saveSetAsideRequest2')
          .mockResolvedValue({
            setAsideRequestData: mockSetAsideRequest,
          });
      });

      it('should save set-aside info and clear selected loan on success', fakeAsync(() => {
        const updateSubjectSpy = jest.spyOn(service as any, 'updateSubject');

        let formDataValues: any[] = [];
        let requestsValues: any[] = [];
        let selectedLoanValues: any[] = [];

        service.setAsideFormData$.subscribe((formData) => {
          formDataValues.push(formData);
        });
        service.setAsideRequests$.subscribe((requests) => {
          requestsValues.push(requests);
        });
        service.selectedLoan$.subscribe((loan) => {
          selectedLoanValues.push(loan);
        });

        service.saveSetAsideInfo(mockFormData).then((response) => {
          expect(
            setAsideRequestService.saveSetAsideRequest2
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              rqst_id: 123,
              loan_id: 1,
              set_asd_type_cd: 'DSA',
            })
          );
          expect(response).toEqual({
            setAsideRequestData: mockSetAsideRequest,
          });
          expect(formDataValues).toContainEqual([
            { loanId: 1, formData: mockFormData },
          ]);
          expect(requestsValues).toContainEqual([
            { loanId: 1, setAsideRequest: mockSetAsideRequest },
          ]);
          expect(formDataValues).toContainEqual([]);
          expect(selectedLoanValues).toContainEqual(null);
        });
        tick(100);
        flush();
      }));

      it('should throw error if requestId is invalid', async () => {
        service['requestIdSubject'].next(NaN);

        await expect(service.saveSetAsideInfo(mockFormData)).rejects.toThrow(
          'No valid request ID available'
        );
      });

      it('should throw error if server response is invalid', async () => {
        jest
          .spyOn(setAsideRequestService, 'saveSetAsideRequest2')
          .mockResolvedValue(null);

        await expect(service.saveSetAsideInfo(mockFormData)).rejects.toThrow(
          'Failed to save set-aside request: Invalid or no response from server'
        );
      });
    });
  });

  describe('deleteSetAside', () => {
    it('should delete set-aside data, clear state, and deselect loan', fakeAsync(() => {
      service['eligibleLoansSubject'].next([mockDirectLoan]);
      service['updateSubject'](service['setAsideRequestsSubject'], 1, {
        setAsideRequest: mockSetAsideRequest,
      });
      service['updateSubject'](service['setAsideFormDataSubject'], 1, {
        formData: mockFormData,
      });
      service.selectLoan(mockDirectLoan);

      jest
        .spyOn(setAsideRequestService, 'deleteSetAsideRequest')
        .mockReturnValue(of({ success: true }));

      service.deleteSetAside(1).subscribe((result) => {
        expect(result).toEqual({ success: true, response: { success: true } });
        service.setAsideRequests$.subscribe((requests) => {
          expect(requests).toEqual([]);
          service.setAsideFormData$.subscribe((formData) => {
            expect(formData).toEqual([]);
            service.selectedLoan$.subscribe((loan) => {
              expect(loan).toBeNull();
            });
          });
        });
      });

      tick(100);
      flush();
    }));

    it('should return failure if no set-aside request exists', (done) => {
      service.deleteSetAside(1).subscribe((result) => {
        expect(result).toEqual({
          success: false,
          message: 'No set-aside request to delete',
        });
        done();
      });
    });
  });

  describe('formatDate', () => {
    it('should format date as MM/DD/YYYY', () => {
      const date = new Date(2025, 5, 3);
      const result = service['formatDate'](date);
      expect(result).toBe('06/03/2025');
    });
  });

  describe('getEarlierDate', () => {
    it('should return earlier date', () => {
      const addendumDate = new Date(2024, 0, 1);
      const installmentDate = new Date(2024, 1, 1);
      const result = service['getEarlierDate'](addendumDate, installmentDate);
      expect(result).toEqual(addendumDate);

      const result2 = service['getEarlierDate'](installmentDate, addendumDate);
      expect(result2).toEqual(addendumDate);
    });
  });

  describe('selectedSetAsideData$', () => {
    it('should combine selected loan, inputs, and form data', (done) => {
      service.selectLoan(mockDirectLoan);
      service['updateSubject'](service['setAsideInputsSubject'], 1, {
        setAsideInput: mockSetAsideInput,
      });
      service.updateSetAsideFormData(1, mockFormData);

      service.selectedSetAsideData$.subscribe((data) => {
        expect(data).toEqual({
          loan: mockDirectLoan,
          setAsideInput: expect.objectContaining({ disasterCode: 'M1234' }),
          formData: mockFormData,
        });
        done();
      });
    });

    it('should return null input and form data when no loan selected', (done) => {
      service.selectedSetAsideData$.subscribe((data) => {
        expect(data).toEqual({
          loan: null,
          setAsideInput: null,
          formData: null,
        });
        done();
      });
    });
  });

  describe('fetchRequestId', () => {
    it('should set requestId to value if one is found', (done) => {
      jest.spyOn(userLoanDataService, 'getRequestID');

      service.requestId$.subscribe((requestId) => {
        expect(requestId).toBe(123);
        done();
      });
    });
  });

  describe('updateSubject', () => {
    it('should update existing loanId entry', (done) => {
      const subject = new BehaviorSubject<
        { loanId: number; formData: SetAsideFormData }[]
      >([{ loanId: 1, formData: mockFormData }]);
      const newFormData: SetAsideFormData = {
        ...mockFormData,
        setAsideAmount: 6000,
      };

      service['updateSubject'](subject, 1, { formData: newFormData });

      subject.subscribe((data) => {
        expect(data).toEqual([{ loanId: 1, formData: newFormData }]);
        done();
      });
    });
  });

  describe('preClosingData$', () => {
    it('should handle empty inputs correctly', (done) => {
      service['eligibleLoansSubject'].next([mockDirectLoan]);
      service['setAsideInputsSubject'].next([]);
      service['setAsideRequestsSubject'].next([]);
      service['setAsideOutcomesSubject'].next([]);
      service['requestIdSubject'].next(123);

      service.preClosingData$.subscribe((data) => {
        expect(data).toEqual([
          {
            loan: mockDirectLoan,
            setAsideInput: null,
            setAsideRequest: null,
            setAsideOutcome: null,
            requestId: 123,
          },
        ]);
        done();
      });
    });
  });

  describe('constructor subscriptions', () => {
    it('should not fetch set-aside input if it already exists', (done) => {
      const fetchSpy = jest.spyOn(service as any, 'fetchSetAsideInput');
      service['setAsideInputsSubject'].next([
        { loanId: 1, setAsideInput: mockSetAsideInput },
      ]);

      service.selectLoan(mockDirectLoan);

      service.selectedLoan$.subscribe(() => {
        expect(fetchSpy).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('createSetAsideRequestData', () => {
    it('should handle string inputs for amounts', async () => {
      const stringFormData: SetAsideFormData = {
        ...mockFormData,
        setAsideAmount: 5000,
        paymentAfterInstallment: 100,
      };
      let customer = [];
      service['requestIdSubject'].next(123);
      const requestData = await service['createSetAsideRequestData'](
        stringFormData,
        mockDirectLoan,
        customer
      );

      expect(requestData).toEqual(
        expect.objectContaining({
          istl_set_asd_amt: 5000,
          istl_paid_amt: 100,
        })
      );
    });

    it('should throw error for invalid numeric values', async () => {
      const invalidFormData: SetAsideFormData = {
        ...mockFormData,
        setAsideAmount: null,
      };
      let customer = [];
      service['requestIdSubject'].next(123);

      await expect(
        service['createSetAsideRequestData'](
          invalidFormData,
          mockDirectLoan,
          customer
        )
      ).rejects.toThrow(
        'Invalid numeric values for set-aside amount or payment after installment'
      );
    });
  });
});
