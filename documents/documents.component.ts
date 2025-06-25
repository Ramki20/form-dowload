import { Component, OnInit, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { DocumentRetrievalService } from "../../services/docs/document-retrieval.service";
import { OlaDocument } from "../../models/ola-document.model";
import { Observable, sample } from "rxjs";
import { resources } from "src/app/services/resources/resources";
import { SessionService } from "src/app/services/session/session.service";
import { DocumentNames } from "./tableNames";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { CMBSDocumentService } from "src/app/services/cmbs-document-service/cmbs-document-service";

interface DocumentsTable {
  tableName: string;
  olaDocument: OlaDocument[];
}

@Component({
  standalone: false,
  selector: "app-documents",
  templateUrl: "./documents.component.html",
  styleUrls: ["./documents.component.css"],
})
export class DocumentsComponent implements OnInit {
  resources = resources;
  finalDocumentList: OlaDocument[] = [];
  sampleDoc: OlaDocument = {
    documentName: "Sample Document",
    documentSource: "Applicant",
    documentDate: new Date("2024-10-24"),
    documentExtension: ".pdf",
    documentTypeCode: "COE",
    storageAddressText: "610416",
    pdfUrl: "",
  };

  static readonly REQUEST_FORM: "Request Form";
  static readonly LOAN_PURPOSE: "Loan Purpose and Amount";
  static readonly TRAINING_EDUCATION_EXPERIENCE: "Training, Education, and Experience";
  static readonly CERTIFICATION_ELIGIBILITY: "Certification and Eligibility";
  static readonly CREDIT_ELSEWHERE: "Credit Elsewhere";
  static readonly BALANCE_SHEET: "Balance Sheet";
  static readonly DEBT_VERIFICATIONS: "Debt Verifications";
  static readonly FINANCIAL_RECORDS: "Financial Records";
  static readonly PRODUCTION_RECORDS: "Production Records";
  static readonly FARM_OPERATING_PLAN: "Farm Operating Plan";
  static readonly PRODUCTION_PRICE_CONTRACTS: "Production/Price Contracts";
  static readonly NON_FARM_INCOME: "Non-Farm Income Verifications";
  static readonly OTHER: "Other";

  tableNameList: String[] = DocumentNames;
  @Input()
  id: string;
  url: SafeResourceUrl;
  tables: DocumentsTable[] = [];
  selectedFiles: File[];
  isUploadBtnDisabled: boolean;
  newDocsPresent: any;
  applicationId: any;
  ccid: string;

  constructor(
    private dialog: MatDialog,
    public sanitize: DomSanitizer,
    private readonly documentRetrievalService: DocumentRetrievalService,
    private readonly cmbsDocumentService: CMBSDocumentService,
    private readonly sessionService: SessionService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    this.applicationId = this.sessionService.getApplicationIdentifier();
    // this.downloadGeneratedDocument();
    this.ccid = this.sessionService.getCoreCustomerIdentifier();
    await this.retrieveAllDocuments();
  }
  async downloadGeneratedDocument() {
    this.documentRetrievalService
      .olaGenerateFSA2001Form("9719", "7509756")
      .subscribe((data) => {
        console.log(data);
      });
  }
  async retrieveAllDocuments() {
    this.documentRetrievalService
      .blcShtDueLiaSprtDoc(this.applicationId)
      .subscribe(
        (data) => {
          this.mapOlaDocumentToDocument(data).forEach((element) => {
            this.finalDocumentList.push(element);
          });

          this.documentRetrievalService
            .blcShtOtLiaSprtDoc(this.applicationId)
            .subscribe(
              (data) => {
                this.mapOlaDocumentToDocument(data).forEach((element) => {
                  this.finalDocumentList.push(element);
                });

                this.documentRetrievalService
                  .blcShtSprtDoc(this.applicationId)
                  .subscribe(
                    (data) => {
                      this.mapOlaDocumentToDocument(data).forEach((element) => {
                        this.finalDocumentList.push(element);
                      });

                      this.documentRetrievalService
                        .borrSprtDoc(this.applicationId)
                        .subscribe(
                          (data) => {
                            this.mapOlaDocumentToDocument(data).forEach(
                              (element) => {
                                this.finalDocumentList.push(element);
                              }
                            );

                            this.documentRetrievalService
                              .cashFlowSprtDoc(this.applicationId)
                              .subscribe(
                                (data) => {
                                  this.mapOlaDocumentToDocument(data).forEach(
                                    (element) => {
                                      this.finalDocumentList.push(element);
                                    }
                                  );

                                  this.documentRetrievalService
                                    .loanPrpsSprtDoc(this.applicationId)
                                    .subscribe(
                                      (data) => {
                                        this.mapOlaDocumentToDocument(
                                          data
                                        ).forEach((element) => {
                                          this.finalDocumentList.push(element);
                                        });

                                        this.documentRetrievalService
                                          .nfarmIncmSprtDoc(this.applicationId)
                                          .subscribe((data) => {
                                            this.mapOlaDocumentToDocument(
                                              data
                                            ).forEach((element) => {
                                              this.finalDocumentList.push(
                                                element
                                              );
                                            });
                                            this.documentRetrievalService
                                              .olaAnsSprtDoc(this.applicationId)
                                              .subscribe((data) => {
                                                this.mapOlaDocumentToDocument(
                                                  data
                                                ).forEach((element) => {
                                                  this.finalDocumentList.push(
                                                    element
                                                  );
                                                });
                                                this.populateTables();
                                              });
                                          });
                                      },
                                      (error) => {
                                        console.error(
                                          "Error fetching documents:",
                                          error
                                        );
                                        return;
                                      }
                                    );
                                },
                                (error) => {
                                  console.error(
                                    "Error fetching documents:",
                                    error
                                  );
                                  return;
                                }
                              );
                          },
                          (error) => {
                            console.error("Error fetching documents:", error);
                            return;
                          }
                        );
                    },
                    (error) => {
                      console.error("Error fetching documents:", error);
                      return;
                    }
                  );
              },
              (error) => {
                console.error("Error fetching documents:", error);
                return;
              }
            );
        },
        (error) => {
          console.error("Error fetching documents:", error);
          return;
        }
      );
  }
  onFileSelected(event: Event, table: DocumentsTable) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      this.isUploadBtnDisabled = false;
      input.value = "";
      this.newDocsPresent = true;
      console.log(this.selectedFiles);
      this.selectedFiles.forEach((file) => {
        table.olaDocument.push(
          this.createOlaDoc(file.name, "FSA", "ABC", "empty")
        );
      });
    }
  }
  async populateTables() {
    this.populateOlaDocUrls();
    this.tableNameList.forEach((element) => {
      switch (element) {
        case "Request Form":
          let reqdocs = [];
          reqdocs.push(
            this.createOlaDoc(
              "FSA-2001-Application-" + this.applicationId,
              "OLA-Generated",
              "ABC"
            )
          );
          this.tables.push({
            tableName: "Request Form",
            olaDocument: reqdocs,
          });
          break;
        case "Loan Purpose and Amount":
          let LPADocs = this.findDocuments("Loan Purpose and Amount");
          LPADocs.push(
            this.createOlaDoc(
              "Loan-Purpose-And-Amount-" + this.applicationId,
              "OLA-Generated",
              "COE"
            )
          );
          this.tables.push({
            tableName: "Loan Purpose and Amount",
            olaDocument: LPADocs,
          });
          break;
        case "Debt Verifications":
          this.tables.push({
            tableName: "Debt Verifications",
            olaDocument: this.findDocuments("Debt Verifications"),
          });
          break;
        case "Training, Education, and Experience":
          let teeDocs: OlaDocument[] = this.findDocuments(
            "Training, Education, and Experience"
          );
          teeDocs.push(
            this.createOlaDoc(
              "Training Education and Experience Explanations-" +
                this.applicationId,
              "OLA-Generated",
              "COC"
            )
          );

          this.tables.push({
            tableName: "Training, Education, and Experience",
            olaDocument: teeDocs,
          });
          break;
        case "Certification and Eligibility":
          let certdocs: OlaDocument[] = this.findDocuments(
            "Certification and Eligibility"
          );
          certdocs.push(
            this.createOlaDoc(
              "Certification & Eligibility-" + this.applicationId,
              "OLA-Generated",
              "ABC"
            )
          );
          this.tables.push({
            tableName: "Certification and Eligibility",
            olaDocument: certdocs,
          });
          break;
        case "Credit Elsewhere":
          this.tables.push({
            tableName: "Credit Elsewhere",
            olaDocument: this.findDocuments("Credit Elsewhere"),
          });
          break;
        case "Balance Sheet":
          let balanceDocs: OlaDocument[] = this.findDocuments("Balance Sheet");
          balanceDocs.push(
            this.createOlaDoc(
              "Balance-Sheet-" + this.applicationId,
              "OLA-Generated",
              "BAS"
            )
          );
          this.tables.push({
            tableName: "Balance Sheet",
            olaDocument: balanceDocs,
          });
          break;
        case "Financial Records":
          this.tables.push({
            tableName: "Financial Records",
            olaDocument: this.findDocuments("Financial Records"),
          });
          break;
        case "Production Records":
          this.tables.push({
            tableName: "Production Records",
            olaDocument: this.findDocuments("Production Records"),
          });
          break;
        case "Farm Operating Plan":
          let farmDocs: OlaDocument[] = this.findDocuments(
            "Farm Operating Plan"
          );
          farmDocs.push(
            this.createOlaDoc(
              "Farm Operating Plan-" + this.applicationId,
              "OLA-Generated",
              "PCF"
            )
          );

          this.tables.push({
            tableName: "Farm Operating Plan",
            olaDocument: farmDocs,
          });
          break;
        case "Production/Price Contracts":
          this.tables.push({
            tableName: "Production/Price Contracts",
            olaDocument: this.findDocuments("Production/Price Contracts"),
          });
          break;
        case "Non-Farm Income Verifications":
          this.tables.push({
            tableName: "Non-Farm Income Verifications",
            olaDocument: this.findDocuments("Non-Farm Income Verifications"),
          });
          break;
        case "Other":
          let citDocs: OlaDocument[] = this.findDocuments("Other");
          // citDocs.push(this.createOlaDoc('CitizenshipDoc', 'Applicant', 'PCF'))

          this.tables.push({
            tableName: "Other",
            olaDocument: citDocs,
          });
          break;
        default:
          break;
      }
    });
    this.tables.forEach((element) => {
      element.olaDocument.sort((a, b) =>
        a.documentSource > b.documentSource ? -1 : 1
      );
    });

    console.log(this.tables);
  }
  mapOlaDocumentToDocument(data: any): any {
    let doclist: OlaDocument[] = [];
    doclist = [];
    if (!data || data.length === 0) {
      return doclist;
    }
    if (data.length === 1 && data[0] == null) {
      return doclist;
    }

    data.forEach((element) => {
      if (element == null) return;

      let docelement = {} as OlaDocument;
      docelement.documentName = element.doc_nm;
      docelement.documentDate = element.last_chg_dt;
      docelement.documentTypeCode = element.ola_doc_type_cd;
      docelement.documentExtension = element.file_extn_cd;
      docelement.storageAddressText = element.strg_adr_txt;
      docelement.documentSource = "Applicant";
      doclist.push(docelement);
    });
    return doclist;
  }

  // getDisplayDate(doc: Document): Date {
  //   if (doc.isApplicantUploaded && doc.initialSubmissionDate) {
  //     return doc.initialSubmissionDate;
  //   }
  //   return doc.dateReceived;
  // }g

  //previewFile(doc: OlaDocument) {

  //  this.dialog.open(PdfViewerComponent, {

  //    data: { pdfUrl: doc.pdfUrl, fileName: doc.documentName, storageAddressText: doc.storageAddressText,
  //      canDownload: true },
  //    width: '80%',
  //    height: '80%',
  //  });
  //}

  populateOlaDocUrls() {
    this.finalDocumentList.forEach((element) => {
      let docUrl =
        "/assets/" + element.documentName + element.documentExtension;
      element.pdfUrl = docUrl;
    });
  }
  findDocuments(tableName: any) {
    let tempDocList: OlaDocument[] = [];
    let codeList = this.getMatchingOlaDocTypeCodes(tableName);

    this.finalDocumentList.forEach((finalDocumentElement) => {
      codeList.forEach((codeListElement) => {
        if (finalDocumentElement.documentTypeCode == codeListElement) {
          tempDocList.push(finalDocumentElement);
        }
      });
    });
    tempDocList.forEach((doc) => {
      console.log(doc.documentExtension);
      doc.documentExtension.trimEnd();
      console.log(doc);
    });
    return tempDocList;
  }
  createOlaDoc(name: any, source: any, code: any, date?: any) {
    if (date == null) {
      let OlaDoc: OlaDocument = {
        documentName: name,
        documentDate: new Date("10-23-2024"),
        documentSource: source,
        documentTypeCode: code,
        documentExtension: ".pdf",
        storageAddressText: "610104",
        pdfUrl: "/assets/" + name,
      };
      return OlaDoc;
    } else {
      if (date == "empty") {
        let OlaDoc: OlaDocument = {
          documentName: name,
          documentDate: null,
          documentSource: source,
          documentTypeCode: code,
          documentExtension: ".pdf",
          storageAddressText: "610104",
          pdfUrl: "/assets/" + name,
          isNew: true,
        };
        return OlaDoc;
      } else {
        let OlaDoc: OlaDocument = {
          documentName: name,
          documentDate: new Date(date),
          documentSource: source,
          documentTypeCode: code,
          documentExtension: ".pdf",
          storageAddressText: "610104",
          pdfUrl: "/assets/" + name,
        };
        return OlaDoc;
      }
    }
  }

  getMatchingOlaDocTypeCodes(tableName: any) {
    let codeList: string[] = [];
    if (tableName == "Loan Purpose and Amount") {
      codeList.push("COE");
      codeList.push("REP");
      codeList.push("RLD");
    } else if (tableName == "Training, Education, and Experience") {
      codeList.push("COC");
      codeList.push("COD");
      codeList.push("HDP");
      codeList.push("MAT");
      codeList.push("OTE");
      codeList.push("SMD");
      codeList.push("WST");
    } else if (tableName == "Credit Elsewhere") {
      codeList.push("CDL");
    } else if (tableName == "Balance Sheet") {
      codeList.push("BAS");
    } else if (tableName == "Debt Verifications") {
      codeList.push("MRB");
      codeList.push("ODV");
    } else if (tableName == "Financial Records") {
      codeList.push("HFL");
      codeList.push("ITR");
      codeList.push("OFR");
    } else if (tableName == "Production Records") {
      codeList.push("ACP");
      codeList.push("ALI");
      codeList.push("APH");
      codeList.push("DHI");
      codeList.push("FPR");
      codeList.push("LSB");
      codeList.push("OPR");
      codeList.push("REC");
      codeList.push("WTX");
      codeList.push("YES");
    } else if (tableName == "Farm Operating Plan") {
      codeList.push("PCF");
    } else if (tableName == "Production/Price Contracts") {
      codeList.push("CMA");
      codeList.push("FPC");
      codeList.push("IC");
      codeList.push("WPA");
    } else if (tableName == "Non-Farm Income Verifications") {
      codeList.push("APD");
      codeList.push("BS");
      codeList.push("CSP");
      codeList.push("ES");
      codeList.push("MIS");
      codeList.push("ONI");
      codeList.push("RPS");
      codeList.push("SSB");
      codeList.push("VBS");
      codeList.push("W2");
    } else if (tableName == "Other") {
      codeList.push("AFP");
      codeList.push("BBF");
      codeList.push("BC");
      codeList.push("BCB");
      codeList.push("BCS");
      codeList.push("BCU");
      codeList.push("BCZ");
      codeList.push("BEA");
      codeList.push("BIN");
      codeList.push("BPV");
      codeList.push("BSA");
      codeList.push("BSI");
      codeList.push("BWM");
      codeList.push("CER");
      codeList.push("CHP");
      codeList.push("CID");
      codeList.push("CIS");
      codeList.push("CNN");
      codeList.push("COS");
      codeList.push("CSE");
      codeList.push("ESR");
      codeList.push("IJO");
      codeList.push("INA");
      codeList.push("NMI");
      codeList.push("PP");
      codeList.push("PRC");
      codeList.push("RER");
      codeList.push("RID");
      codeList.push("SAI");
      codeList.push("SSN");
      codeList.push("USC");
      codeList.push("USI");
      codeList.push("USP");
      codeList.push("UTC");
    }
    return codeList;
  }
  createSampleDoc(tableName: any) {
    let codeList = this.getMatchingOlaDocTypeCodes(tableName);

    let tempDoc: OlaDocument = {
      documentName: "Sample Document",
      documentSource: "Applicant",
      documentDate: new Date("2024-10-24"),
      documentExtension: ".pdf",
      documentTypeCode: codeList[0],
      storageAddressText: "610416",
      pdfUrl: "",
    };
    return tempDoc;
  }

  handleDocumentAction(doc: OlaDocument, table: any) {
    if (doc.isNew) {
      doc.isNew = false;
      this.newDocsPresent = false;
    }
    this.generateFile(doc, table);
  }

  generateFile(doc: OlaDocument, table: any) {
    const currentFSA2001StorageAddressIdentifier = sessionStorage.getItem(
      "currentFSA2001StorageAddressIdentifier"
    );
    console.log(
      "currentFSA2001StorageAddressIdentifier:",
      currentFSA2001StorageAddressIdentifier
    );
    console.log("doc:::", doc);
    console.log("table:::", table);

    let storageAddrText = null;
    if (doc.documentSource !== "OLA-Generated") {
      // Applicant upload from OLA
      storageAddrText = doc.storageAddressText;
    } else if (
      doc.documentSource === "OLA-Generated" &&
      table.tableName === "Request Form" &&
      currentFSA2001StorageAddressIdentifier
    ) {
      // Special case - OLA-Generated and uploaded to CMBS at the time of submission
      storageAddrText = currentFSA2001StorageAddressIdentifier;
    } else {
      // OLA Generated document download
      this.documentRetrievalService
        .downloadOLAGeneratedDocument(doc, table, this.ccid, this.applicationId)
        .subscribe({
          next: (data: ArrayBuffer) =>
            this.cmbsDocumentService.handleDownload(
              data,
              doc.documentName,
              doc.documentExtension
            ),
          error: (error) =>
            this.cmbsDocumentService.handleDownloadError(
              error,
              "OLA generated"
            ),
        });
      return;
    }

    // Download CMBS document using flp-common-api lambda function

    console.log("handleDocumentAction storageAddrText:", storageAddrText);
    console.log("handleDocumentAction documentName:", doc.documentName);
    console.log(
      "handleDocumentAction documentExtension:",
      doc.documentExtension
    );

    this.cmbsDocumentService
      .downloadCMBSDocument(
        storageAddrText,
        doc.documentName + doc.documentExtension
      )
      .subscribe({
        next: (data: ArrayBuffer) =>
          this.cmbsDocumentService.handleDownload(
            data,
            doc.documentName,
            doc.documentExtension
          ),
        error: (error) =>
          this.cmbsDocumentService.handleDownloadError(error, "CMBS"),
      });
  }

  isPdf(fileName: string): boolean {
    if (fileName.startsWith(".pdf")) {
      return true;
    } else {
      return false;
    }
  }
}
