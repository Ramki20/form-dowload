import { TestBed } from "@angular/core/testing";
import { SetAsideService } from "./set-aside.service";
import { HttpTestingController } from "@angular/common/http/testing";
import { DsaOutstandingsModel } from "../../interfaces/loanInfo.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";

describe("SetAsideService", () => {
    let service: SetAsideService;
    let httpTestingController: HttpTestingController;

    const mockData = {
      "data": [
        {
            "accrualDate": "2025-03-14",
            "cslaID": 298469,
            "loanNumbers": 33,
            "loanOutstandingSet": {
                "accruedInterest": 875,
                "accruedInterestAdvance": 87,
                "dailyInterestAccrual": 564,
                "dailyInterestAccrualAdv": 650,
                "deferredInterest": 54,
                "nonCapDeferredInterest": 58,
                "nonCapInterest": 874,
                "unpaidPrincipal":32,
                "unpaidPrincipalAdvance": 54,
                "dateOfLoan": "2016-06-06T00:00:00-05:00",
                "deferralStatus": 0,
                "dsaOutstandings": {
                    "accruedInterest": 654,
                    "accruedInterestAdvance": 541,
                    "dailyInterestAccrual": 54,
                    "dailyInterestAccrualAdv": 4,
                    "deferredInterest": 58,
                    "nonCapDeferredInterest": 230,
                    "nonCapInterest": 98,
                    "unpaidPrincipal": 521,
                    "unpaidPrincipalAdvance": 875,
                    "advanceBalanceInterest": 0,
                    "installmentDueDate": "2017-04-01T00:00:00-05:00",
                    "installmentInterest": 576.49
                },
                "fbpLoanSchedulePaymentAmount": 0,
                "fundCode": 4430,
                "interestRate": 2.125,
                "lastPaymentDate": "2019-12-31T00:00:00-06:00",
                "loanAmount": 0,
                "loanNumber": 33,
                "nextInstallmentDue": 0,
                "totalAccruedInterest": 0,
                "totalDailyInterestAccrual": 1.7271,
                "totalInterest": 3972.93,
                "totalOtherInterest": 0,
                "totalPayoff": 33638.42,
                "totalUnpaidPrincipal": 29665.49,
                "undisbursedAmount": 0
            }
        }
    ]
    }
    beforeEach(() => {
        TestBed.configureTestingModule({
             imports: [],
            providers: [SetAsideService],
        });
        service = TestBed.inject(SetAsideService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach( () => {
        httpTestingController.verify();
        jest.clearAllMocks();
     }
    );

    test("should be created", () => {
        expect(service).toBeTruthy();
    });

    test("verify Total Payoff with DBSA rate works", () => {
      const data = JSON.parse(JSON.stringify(mockData)).data;
      expect(service.calcTotalPayoffDBSA(mockData, '5')).toBe(3522.49);
    });

    it('Verify Total Payoff with Note rate works', () => {
        expect(service.calcTotalPayoffNote(mockData)).toEqual(3595);
    });

    it('Makes the correct API call when updateRequestStatus is called', () => {
      const testDate = new Date('12/31/1999');
      const withdrawal = {
        requestId: '1',
        statusCode: 'WD',
        dataStatusCode: 'A',
        eAuthId: 'USER',
        rqst_wdrw_rsn_cd: 'CRD',
        rqst_stat_dt: testDate,
      };

      const regular = {
        requestId: '1',
        statusCode: 'IS',
        dataStatusCode: 'A',
        eAuthId: 'USER',
        rqst_stat_dt: testDate,
      };

      const updateRequestStatus = new URL(`${environment.servicing_url}/updateRequestStatus`);
      service.updateRequestStatus('1', 'USER', 'WD', 'A', 'CRD', undefined, testDate).subscribe({
        next: (response) => {

        },
      });
      const withdrawalRequest = httpTestingController.expectOne(updateRequestStatus.toString())
      expect(withdrawalRequest.request.body).toEqual(withdrawal)

      service.updateRequestStatus('1', 'USER', 'IS', 'A', undefined, undefined, testDate).subscribe({
        next: (response) => {

        },
      });
      const regularRequest = httpTestingController.expectOne(updateRequestStatus.toString())
      expect(regularRequest.request.body).toEqual(regular)
    })

    it('Makes the correct API call when updateRequestStatus is called with reopen payload', () => {
      const testDate = new Date('12/31/1999');
      const reopen = {
        requestId: '1',
        statusCode: 'PA',
        dataStatusCode: 'A',
        eAuthId: 'USER',
        rqst_reopen_rsn_code: 'SEA',
        rqst_stat_dt: testDate,
      };

      const updateRequestStatus = new URL(`${environment.servicing_url}/updateRequestStatus`);
      service.updateRequestStatus('1', 'USER', 'PA', 'A', '', 'SEA', testDate).subscribe({
        next: (response) => {

        },
      });
      const reopenRequest = httpTestingController.expectOne(updateRequestStatus.toString());
      expect(reopenRequest.request.body).toEqual(reopen);
    })

    it('Makes the correct API call when updateRequestApprovalDate is called', () => {
      const data = {
        requestId: 1,
        aprvDate: new Date('5/29/2025'),
        eAuthId: 'USER',
      };

      const updateRequestApprovalDate = `${environment.servicing_url}/updateRequestAprvDate`;
      service.updateRequestApprovalDate(1, 'USER', new Date('5/29/2025')).subscribe({
        next: (response) => {

        },
      });
      const approvalDateRequest = httpTestingController.expectOne(updateRequestApprovalDate)
      expect(approvalDateRequest.request.body).toEqual(data)
    })
});
