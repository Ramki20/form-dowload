import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  flush,
} from '@angular/core/testing';
import { of, throwError, timer } from 'rxjs';
import { mapTo, switchMap } from 'rxjs/operators';
import { PreClosingSummaryCardComponent } from './pre-closing-summary-card.component';
import { PreClosingRequestDataService } from '../../services/pre-closing-request-data/pre-closing-request-data.service';
import {
  PreClosingLoanData,
  SetAsideFormData,
  SetAsideRequestData2,
} from '../../interfaces/pre-close.model';
import { DirectLoan } from '../../interfaces/loanData.interface';

class MockPreClosingRequestDataService {
  preClosingData$ = of<PreClosingLoanData[]>([]);
  eligibleLoans$ = of<DirectLoan[]>([]);
  setAsideFormData$ = of<
    { loanId: number | string; formData: SetAsideFormData }[]
  >([]);
  deleteSetAside(loanId: number) {
    return of({ success: true });
  }
}

describe('PreClosingSummaryCardComponent', () => {
  let component: PreClosingSummaryCardComponent;
  let fixture: ComponentFixture<PreClosingSummaryCardComponent>;
  let mockPreClosingService: MockPreClosingRequestDataService;

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

  const mockPreClosingLoanData: PreClosingLoanData = {
    loan: mockDirectLoan,
    setAsideInput: null,
    setAsideRequest: mockSetAsideRequest,
    setAsideOutcome: null,
  };

  beforeEach(async () => {
    mockPreClosingService = new MockPreClosingRequestDataService();

    await TestBed.configureTestingModule({
      declarations: [PreClosingSummaryCardComponent],
      providers: [
        {
          provide: PreClosingRequestDataService,
          useValue: mockPreClosingService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreClosingSummaryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize tableData$', () => {
    expect(component.tableData$).toBeDefined();
  });

  describe('ngOnInit', () => {
    it('should set tableData$ with empty loans when no set-aside requests exist', fakeAsync(() => {
      const noRequestLoanData: PreClosingLoanData = {
        ...mockPreClosingLoanData,
        setAsideRequest: null,
      };
      mockPreClosingService.preClosingData$ = of([noRequestLoanData]);
      mockPreClosingService.eligibleLoans$ = of([mockDirectLoan]);
      mockPreClosingService.setAsideFormData$ = of([]);

      component.ngOnInit();
      tick();

      component.tableData$.subscribe((data) => {
        expect(data.isLoading).toBe(false);
        expect(data.loans.length).toBe(0);
      });

      flush();
    }));

    it('should set tableData$ with loading state when no loans exist', fakeAsync(() => {
      mockPreClosingService.preClosingData$ = of([]);
      mockPreClosingService.eligibleLoans$ = of([]);
      mockPreClosingService.setAsideFormData$ = of([]);

      component.ngOnInit();
      tick();

      component.tableData$.subscribe((data) => {
        expect(data.isLoading).toBe(true);
        expect(data.loans.length).toBe(0);
      });

      flush();
    }));
  });

  describe('deleteSelection', () => {
    it('should call deleteSetAside, add/remove loanId from deletingIds on success', fakeAsync(() => {
      const deleteSpy = jest
        .spyOn(mockPreClosingService, 'deleteSetAside')
        .mockImplementation(() => timer(10).pipe(mapTo({ success: true })));

      component.deleteSelection(1);

      expect(component.deletingIds.has(1)).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith(1);

      tick(200);
      expect(component.deletingIds.has(1)).toBe(false);
      flush();
    }));

    it('should call deleteSetAside, add/remove loanId from deletingIds on error', fakeAsync(() => {
      const deleteSpy = jest
        .spyOn(mockPreClosingService, 'deleteSetAside')
        .mockImplementation(() =>
          timer(10).pipe(
            switchMap(() => throwError(new Error('Delete failed')))
          )
        );

      component.deleteSelection(1);

      expect(component.deletingIds.has(1)).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith(1);
      tick(200);
      expect(component.deletingIds.has(1)).toBe(false);
      flush();
    }));
  });

  describe('formatMoneyString', () => {
    it('should format positive number as USD currency', () => {
      const result = component.formatMoneyString(1234.56);
      expect(result).toBe('$1,234.56');
    });

    it('should format zero as USD currency', () => {
      const result = component.formatMoneyString(0);
      expect(result).toBe('$0.00');
    });

    it('should format negative number as USD currency', () => {
      const result = component.formatMoneyString(-1234.56);
      expect(result).toBe('-$1,234.56');
    });
  });
});
