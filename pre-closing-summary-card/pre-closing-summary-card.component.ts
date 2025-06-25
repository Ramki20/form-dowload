import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { Observable, combineLatest } from "rxjs";
import { finalize, map, startWith } from "rxjs/operators";
import { PreClosingRequestDataService } from "../../services/pre-closing-request-data/pre-closing-request-data.service";
import {
  PreClosingLoanData,
  SetAsideFormData,
} from "../../interfaces/pre-close.model";
import { environment } from "src/environments/environment";
import { SetAsideRequestService } from "../../services/setAsideRequest/setAsideRequest.service";
import { CMBSDocumentService } from "src/app/services/cmbs-document-service/cmbs-document-service";

@Component({
  selector: "app-pre-closing-summary-card",
  standalone: false,
  templateUrl: "./pre-closing-summary-card.component.html",
  styleUrls: ["./pre-closing-summary-card.component.scss"],
})
export class PreClosingSummaryCardComponent implements OnInit {
  tableData$!: Observable<{
    loans: {
      loanData: PreClosingLoanData;
      formData: SetAsideFormData | null;
    }[];
    isLoading: boolean;
  }>;
  deletingIds: Set<number> = new Set();
  @Output() loansProcessedLength = new EventEmitter<number>();

  constructor(
    private preClosingRequestDataService: PreClosingRequestDataService,
    private setAsideRequestService: SetAsideRequestService,
    private cmbsDocumentService: CMBSDocumentService
  ) {}

  ngOnInit() {
    this.tableData$ = combineLatest([
      this.preClosingRequestDataService.preClosingData$.pipe(startWith([])),
      this.preClosingRequestDataService.eligibleLoans$.pipe(startWith([])),
      this.preClosingRequestDataService.setAsideFormData$.pipe(startWith([])),
    ]).pipe(
      map(([loans, eligibleLoans, formData]) => {
        const loanItems = loans
          .filter((loanData) => loanData.setAsideRequest != null)
          .map((loanData) => ({
            loanData,
            formData:
              formData.find((f) => f.loanId === loanData.loan.id)?.formData ||
              null,
          }));
        this.loansProcessedLength.emit(loanItems.length);
        return {
          loans: loanItems,
          isLoading: eligibleLoans.length === 0 && loans.length === 0,
        };
      })
    );

    this.tableData$.subscribe({
      next: (data) => {
        if (!environment.production) {
          console.log("Summary Cards Data:", JSON.stringify(data, null, 2));
        }
      },
      error: (err) => console.error("Error loading summary cards:", err),
    });
  }

  showFSA2501Form(loanData: PreClosingLoanData) {
    console.log("showFSA2501Form loanData:", loanData);
    const requestID = localStorage.getItem("requestID");

    this.setAsideRequestService
      .fetchFSA2501FormData(
        requestID,
        loanData.loan.fundCode,
        loanData.loan.loanNumber
      )
      .subscribe({
        next: (response) => {
          // Handle successful response
          console.log("fetchFSA2501FormData response:", response);

          console.log(
            "showFSA2501Form storageAddrText:",
            response.data[0].documentDetails.storageAddressTxt
          );
          console.log(
            "showFSA2501Form documentName:",
            response.data[0].documentDetails.documentName
          );
          console.log(
            "showFSA2501Form fileExtensionCd:",
            response.data[0].documentDetails.fileExtensionCd
          );

          // Download CMBS document using flp-common-api lambda function
          this.cmbsDocumentService
            .downloadCMBSDocument(
              response.data[0].documentDetails.storageAddressTxt,
              response.data[0].documentDetails.documentName +
                "." +
                response.data[0].documentDetails.fileExtensionCd
            )
            .subscribe({
              next: (data: ArrayBuffer) =>
                this.cmbsDocumentService.handleDownload(
                  data,
                  response.data[0].documentDetails.documentName,
                  response.data[0].documentDetails.fileExtensionCd
                ),
              error: (error) =>
                this.cmbsDocumentService.handleDownloadError(error, "CMBS"),
            });
        },
        error: (error) => {
          console.error("showFSA2501Form failed:", error);
        },
      });
  }

  deleteSelection(loanId: number) {
    this.deletingIds.add(loanId);
    this.preClosingRequestDataService.deleteSetAside(loanId).subscribe({
      next: () => {
        if (!environment.production) {
          console.log("Delete successful for loanId:", loanId);
        }
        this.deletingIds.delete(loanId);
      },
      error: (error) => {
        console.error("Delete failed:", error);
        this.deletingIds.delete(loanId);
      },
    });
  }

  formatMoneyString(amount: number): string {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }
}
