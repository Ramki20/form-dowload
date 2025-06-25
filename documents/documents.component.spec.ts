import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialog } from "@angular/material/dialog";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { of, throwError } from "rxjs";

import { DocumentsComponent } from "./documents.component";
import { DocumentRetrievalService } from "../../services/docs/document-retrieval.service";
import { SessionService } from "src/app/services/session/session.service";
import { OlaDocument } from "../../models/ola-document.model";
import { DocumentNames } from "./tableNames";
import { CMBSDocumentService } from "src/app/services/cmbs-document-service/cmbs-document-service";

// Mock data
const mockOlaDocument: OlaDocument = {
  documentName: "Test Doc",
  documentSource: "Applicant",
  documentDate: new Date(),
  documentExtension: ".pdf",
  documentTypeCode: "COE",
  storageAddressText: "12345",
  pdfUrl: "some/url.pdf",
};

const mockDocumentNames: string[] = [
  "Request Form",
  "Loan Purpose and Amount",
  "Debt Verifications",
  "Other",
];

// Mocks for services
class MockMatDialog {
  open = jest.fn();
}

class MockDomSanitizer {
  bypassSecurityTrustResourceUrl = jest.fn(
    (url: string) => url as SafeResourceUrl
  );
}

class MockDocumentRetrievalService {
  blcShtDueLiaSprtDoc = jest.fn().mockReturnValue(of([mockOlaDocument]));
  blcShtOtLiaSprtDoc = jest.fn().mockReturnValue(of([mockOlaDocument]));
  blcShtSprtDoc = jest.fn().mockReturnValue(of([mockOlaDocument]));
  borrSprtDoc = jest.fn().mockReturnValue(of([mockOlaDocument]));
  cashFlowSprtDoc = jest.fn().mockReturnValue(of([mockOlaDocument]));
  loanPrpsSprtDoc = jest.fn().mockReturnValue(of([mockOlaDocument]));
  nfarmIncmSprtDoc = jest.fn().mockReturnValue(of([mockOlaDocument]));
  olaAnsSprtDoc = jest.fn().mockReturnValue(of([mockOlaDocument]));
  olaGenerateFSA2001Form = jest.fn().mockReturnValue(of({}));
  downloadOLAGeneratedDocument = jest
    .fn()
    .mockReturnValue(of(new ArrayBuffer(8)));
}

class MockCMBSDocumentService {
  downloadCMBSDocument = jest.fn().mockReturnValue(of(new ArrayBuffer(8)));
  getContentType = jest.fn().mockReturnValue("application/pdf");
}

class MockSessionService {
  getApplicationIdentifier = jest.fn().mockReturnValue("app123");
  getCoreCustomerIdentifier = jest.fn().mockReturnValue("ccid789");
}

describe("DocumentsComponent", () => {
  let component: DocumentsComponent;
  let fixture: ComponentFixture<DocumentsComponent>;
  let docRetrievalService: DocumentRetrievalService;
  let cmbsDocumentService: CMBSDocumentService;
  let sessionService: SessionService;

  // Spies for window/document objects
  let mockSessionStorageStore: { [key: string]: string };
  let sessionStorageGetItemSpy: jest.SpyInstance;
  let sessionStorageSetItemSpy: jest.SpyInstance;
  let sessionStorageRemoveItemSpy: jest.SpyInstance;
  let sessionStorageClearSpy: jest.SpyInstance;

  let createObjectURLSpy: jest.SpyInstance;
  let alertSpy: jest.SpyInstance;
  let createElementSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance; // Or spy on link.remove()
  let mockLinkElement: {
    href: string;
    download: string;
    click: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentsComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useClass: MockMatDialog },
        { provide: DomSanitizer, useClass: MockDomSanitizer },
        {
          provide: DocumentRetrievalService,
          useClass: MockDocumentRetrievalService,
        },
        {
          provide: CMBSDocumentService,
          useClass: MockCMBSDocumentService,
        },
        { provide: SessionService, useClass: MockSessionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsComponent);
    component = fixture.componentInstance;
    docRetrievalService = TestBed.inject(DocumentRetrievalService);
    cmbsDocumentService = TestBed.inject(CMBSDocumentService);
    sessionService = TestBed.inject(SessionService);

    // Mock sessionStorage
    mockSessionStorageStore = {};
    const mockSessionStorage = {
      getItem: (key: string) => mockSessionStorageStore[key] || null,
      setItem: (key: string, value: string) => {
        mockSessionStorageStore[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete mockSessionStorageStore[key];
      },
      clear: () => {
        mockSessionStorageStore = {};
      },
      // length and key could be added if component uses them
    };
    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
    });
    // Spy on the methods of our mock
    sessionStorageGetItemSpy = jest.spyOn(window.sessionStorage, "getItem");
    sessionStorageSetItemSpy = jest.spyOn(window.sessionStorage, "setItem");
    sessionStorageRemoveItemSpy = jest.spyOn(
      window.sessionStorage,
      "removeItem"
    );
    sessionStorageClearSpy = jest.spyOn(window.sessionStorage, "clear");

    // Mock window.URL.createObjectURL - Corrected
    if (typeof window.URL === "undefined") {
      (window as any).URL = {
        createObjectURL: jest.fn(),
        revokeObjectURL: jest.fn(),
      };
    } else {
      if (typeof window.URL.createObjectURL === "undefined") {
        (window.URL as any).createObjectURL = jest.fn();
      }
      if (typeof (window.URL as any).revokeObjectURL === "undefined") {
        // Good to ensure revoke is also mockable if needed
        (window.URL as any).revokeObjectURL = jest.fn();
      }
    }
    createObjectURLSpy = jest
      .spyOn(window.URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");

    // Mock window.alert
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    // Mock document.createElement and related for link clicking
    mockLinkElement = {
      href: "",
      download: "",
      click: jest.fn(),
      remove: jest.fn(),
    };
    createElementSpy = jest
      .spyOn(document, "createElement")
      .mockReturnValue(mockLinkElement as any);
    appendChildSpy = jest
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    // removeChildSpy could be used if component called document.body.removeChild(link)
    // but the component uses link.remove()

    component.tableNameList = [...mockDocumentNames];
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears call counts etc. for mocks created with jest.fn() or jest.mock()
    // Explicitly restore/clear spies on window/document objects if they were created with spyOn
    sessionStorageGetItemSpy.mockRestore();
    sessionStorageSetItemSpy.mockRestore();
    sessionStorageRemoveItemSpy.mockRestore();
    sessionStorageClearSpy.mockRestore();
    if (createObjectURLSpy) {
      // Conditional restore
      createObjectURLSpy.mockRestore();
    }
    alertSpy.mockRestore();
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    mockLinkElement.click.mockClear(); // Clear spies on the mock element too
    mockLinkElement.remove.mockClear();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should set applicationId and ccid from SessionService and call retrieveAllDocuments", fakeAsync(() => {
      const retrieveAllSpy = jest
        .spyOn(component, "retrieveAllDocuments")
        .mockResolvedValue(undefined);

      component.ngOnInit();
      tick();

      expect(sessionService.getApplicationIdentifier).toHaveBeenCalled();
      expect(component.applicationId).toBe("app123");
      expect(sessionService.getCoreCustomerIdentifier).toHaveBeenCalled();
      expect(component.ccid).toBe("ccid789");
      expect(retrieveAllSpy).toHaveBeenCalled();
    }));
  });

  describe("retrieveAllDocuments", () => {
    it("should fetch all documents and populate finalDocumentList and tables", fakeAsync(() => {
      const mockData = [
        {
          doc_nm: "Service Doc",
          last_chg_dt: new Date(),
          ola_doc_type_cd: "COE",
          file_extn_cd: ".doc",
          strg_adr_txt: "67890",
        },
      ];

      (docRetrievalService.blcShtDueLiaSprtDoc as jest.Mock).mockReturnValue(
        of(mockData)
      );
      (docRetrievalService.blcShtOtLiaSprtDoc as jest.Mock).mockReturnValue(
        of(mockData)
      );
      (docRetrievalService.blcShtSprtDoc as jest.Mock).mockReturnValue(
        of(mockData)
      );
      (docRetrievalService.borrSprtDoc as jest.Mock).mockReturnValue(
        of(mockData)
      );
      (docRetrievalService.cashFlowSprtDoc as jest.Mock).mockReturnValue(
        of(mockData)
      );
      (docRetrievalService.loanPrpsSprtDoc as jest.Mock).mockReturnValue(
        of(mockData)
      );
      (docRetrievalService.nfarmIncmSprtDoc as jest.Mock).mockReturnValue(
        of(mockData)
      );
      (docRetrievalService.olaAnsSprtDoc as jest.Mock).mockReturnValue(
        of(mockData)
      );

      component.applicationId = "app123";

      const populateTablesSpy = jest.spyOn(component, "populateTables");
      const mapSpy = jest.spyOn(component, "mapOlaDocumentToDocument");

      component.retrieveAllDocuments();
      tick();

      expect(docRetrievalService.blcShtDueLiaSprtDoc).toHaveBeenCalledWith(
        "app123"
      );
      expect(docRetrievalService.olaAnsSprtDoc).toHaveBeenCalledWith("app123");
      expect(mapSpy).toHaveBeenCalledTimes(8);
      expect(component.finalDocumentList.length).toBe(8);
      expect(populateTablesSpy).toHaveBeenCalled();
    }));

    it("should handle errors from document retrieval services", fakeAsync(() => {
      (docRetrievalService.blcShtDueLiaSprtDoc as jest.Mock).mockReturnValue(
        throwError(() => new Error("Service Error"))
      );

      component.retrieveAllDocuments();
      tick();

      expect(component.finalDocumentList.length).toBe(0);
    }));
  });

  describe("mapOlaDocumentToDocument", () => {
    it("should map raw data to OlaDocument array", () => {
      const rawData = [
        {
          doc_nm: "Doc1",
          last_chg_dt: new Date("2023-01-01"),
          ola_doc_type_cd: "T1",
          file_extn_cd: ".pdf",
          strg_adr_txt: "abc",
        },
        {
          doc_nm: "Doc2",
          last_chg_dt: new Date("2023-01-02"),
          ola_doc_type_cd: "T2",
          file_extn_cd: ".txt",
          strg_adr_txt: "def",
        },
      ];
      const result = component.mapOlaDocumentToDocument(rawData);
      expect(result.length).toBe(2);
      expect(result[0].documentName).toBe("Doc1");
      expect(result[0].documentSource).toBe("Applicant");
      expect(result[1].documentTypeCode).toBe("T2");
    });

    it("should return an empty array if data[0] is null", () => {
      const result = component.mapOlaDocumentToDocument([null]);
      expect(result).toEqual([]);
    });
    it("should return an empty array if data is null or empty", () => {
      expect(component.mapOlaDocumentToDocument(null)).toEqual([]);
      expect(component.mapOlaDocumentToDocument([])).toEqual([]);
    });
  });

  describe("populateOlaDocUrls", () => {
    it("should populate pdfUrl for each document in finalDocumentList", () => {
      component.finalDocumentList = [
        { ...mockOlaDocument, documentName: "DocA", documentExtension: ".pdf" },
        {
          ...mockOlaDocument,
          documentName: "DocB",
          documentExtension: ".docx",
        },
      ];
      component.populateOlaDocUrls();
      expect(component.finalDocumentList[0].pdfUrl).toBe("/assets/DocA.pdf");
      expect(component.finalDocumentList[1].pdfUrl).toBe("/assets/DocB.docx");
    });
  });

  describe("createOlaDoc", () => {
    it("should create an OlaDocument with a default date if date is null", () => {
      const doc = component.createOlaDoc(
        "TestName",
        "TestSource",
        "TestCode",
        null
      );
      expect(doc.documentName).toBe("TestName");
      expect(doc.documentSource).toBe("TestSource");
      expect(doc.documentTypeCode).toBe("TestCode");
      expect(doc.documentDate).toEqual(new Date("10-23-2024")); // As per logic
      expect(doc.isNew).toBeUndefined();
    });

    it('should create an OlaDocument with null date and isNew=true if date is "empty"', () => {
      const doc = component.createOlaDoc(
        "TestName",
        "TestSource",
        "TestCode",
        "empty"
      );
      expect(doc.documentName).toBe("TestName");
      expect(doc.documentDate).toBeNull();
      expect(doc.isNew).toBe(true);
    });

    it("should create an OlaDocument with the provided date if date is a valid string", () => {
      const testDate = "2023-05-15";
      const doc = component.createOlaDoc(
        "TestName",
        "TestSource",
        "TestCode",
        testDate
      );
      expect(doc.documentName).toBe("TestName");
      expect(doc.documentDate).toEqual(new Date(testDate));
    });
  });

  describe("getMatchingOlaDocTypeCodes", () => {
    it('should return correct codes for "Loan Purpose and Amount"', () => {
      const codes = component.getMatchingOlaDocTypeCodes(
        "Loan Purpose and Amount"
      );
      expect(codes).toEqual(["COE", "REP", "RLD"]);
    });

    it('should return correct codes for "Training, Education, and Experience"', () => {
      const codes = component.getMatchingOlaDocTypeCodes(
        "Training, Education, and Experience"
      );
      expect(codes).toEqual(["COC", "COD", "HDP", "MAT", "OTE", "SMD", "WST"]);
    });

    it('should return correct codes for "Credit Elsewhere"', () => {
      const codes = component.getMatchingOlaDocTypeCodes("Credit Elsewhere");
      expect(codes).toEqual(["CDL"]);
    });

    it('should return correct codes for "Balance Sheet"', () => {
      const codes = component.getMatchingOlaDocTypeCodes("Balance Sheet");
      expect(codes).toEqual(["BAS"]);
    });

    it('should return correct codes for "Debt Verifications"', () => {
      const codes = component.getMatchingOlaDocTypeCodes("Debt Verifications");
      expect(codes).toEqual(["MRB", "ODV"]);
    });

    it('should return correct codes for "Financial Records"', () => {
      const codes = component.getMatchingOlaDocTypeCodes("Financial Records");
      expect(codes).toEqual(["HFL", "ITR", "OFR"]);
    });

    it('should return correct codes for "Production Records"', () => {
      const codes = component.getMatchingOlaDocTypeCodes("Production Records");
      expect(codes).toEqual([
        "ACP",
        "ALI",
        "APH",
        "DHI",
        "FPR",
        "LSB",
        "OPR",
        "REC",
        "WTX",
        "YES",
      ]);
    });

    it('should return correct codes for "Farm Operating Plan"', () => {
      const codes = component.getMatchingOlaDocTypeCodes("Farm Operating Plan");
      expect(codes).toEqual(["PCF"]);
    });

    it('should return correct codes for "Production/Price Contracts"', () => {
      const codes = component.getMatchingOlaDocTypeCodes(
        "Production/Price Contracts"
      );
      expect(codes).toEqual(["CMA", "FPC", "IC", "WPA"]);
    });

    it('should return correct codes for "Non-Farm Income Verifications"', () => {
      const codes = component.getMatchingOlaDocTypeCodes(
        "Non-Farm Income Verifications"
      );
      expect(codes).toEqual([
        "APD",
        "BS",
        "CSP",
        "ES",
        "MIS",
        "ONI",
        "RPS",
        "SSB",
        "VBS",
        "W2",
      ]);
    });

    it('should return all correct codes for "Other"', () => {
      const codes = component.getMatchingOlaDocTypeCodes("Other");
      // For full coverage, we should compare the entire array.
      // This list is taken directly from your component's implementation.
      expect(codes).toEqual([
        "AFP",
        "BBF",
        "BC",
        "BCB",
        "BCS",
        "BCU",
        "BCZ",
        "BEA",
        "BIN",
        "BPV",
        "BSA",
        "BSI",
        "BWM",
        "CER",
        "CHP",
        "CID",
        "CIS",
        "CNN",
        "COS",
        "CSE",
        "ESR",
        "IJO",
        "INA",
        "NMI",
        "PP",
        "PRC",
        "RER",
        "RID",
        "SAI",
        "SSN",
        "USC",
        "USI",
        "USP",
        "UTC",
      ]);
    });

    it("should return an empty array for an unknown table name", () => {
      const codes = component.getMatchingOlaDocTypeCodes(
        "This Table Does Not Exist"
      );
      expect(codes).toEqual([]);
    });

    it("should return an empty array for an empty table name string", () => {
      const codes = component.getMatchingOlaDocTypeCodes("");
      expect(codes).toEqual([]);
    });

    it("should return an empty array for a null table name", () => {
      const codes = component.getMatchingOlaDocTypeCodes(null);
      expect(codes).toEqual([]);
    });

    it("should return an empty array for an undefined table name", () => {
      const codes = component.getMatchingOlaDocTypeCodes(undefined);
      expect(codes).toEqual([]);
    });
  });

  describe("findDocuments", () => {
    beforeEach(() => {
      component.finalDocumentList = [
        {
          ...mockOlaDocument,
          documentName: "DocA",
          documentTypeCode: "COE",
          documentExtension: ".pdf  ",
        }, // Note trailing space
        { ...mockOlaDocument, documentName: "DocB", documentTypeCode: "REP" },
        { ...mockOlaDocument, documentName: "DocC", documentTypeCode: "BAS" },
      ];
    });

    it('should find documents matching table name "Loan Purpose and Amount"', () => {
      const docs = component.findDocuments("Loan Purpose and Amount");
      expect(docs.length).toBe(2);
      expect(docs.some((d) => d.documentTypeCode === "COE")).toBe(true);
      expect(docs.some((d) => d.documentTypeCode === "REP")).toBe(true);
      // Check if trimEnd was conceptually applied (though it doesn't mutate string in JS like that)
      expect(
        docs.find((d) => d.documentName === "DocA").documentExtension
      ).toBe(".pdf  "); // Original value
    });

    it("should return an empty array if no documents match", () => {
      const docs = component.findDocuments("Credit Elsewhere"); // Assuming no CDL docs in finalDocumentList
      expect(docs.length).toBe(0);
    });
  });

  describe("populateTables", () => {
    beforeEach(() => {
      component.applicationId = "app123";
      component.finalDocumentList = [
        {
          ...mockOlaDocument,
          documentName: "DocDebt",
          documentTypeCode: "MRB",
          documentSource: "Applicant",
        },
        {
          ...mockOlaDocument,
          documentName: "DocOther",
          documentTypeCode: "AFP",
          documentSource: "FSA",
        },
      ];
      // Ensure tableNameList is set, e.g., using mockDocumentNames
      component.tableNameList = ["Request Form", "Debt Verifications", "Other"];
      jest.spyOn(component, "populateOlaDocUrls").mockImplementation(() => {}); // Mock to avoid its own logic
      jest.spyOn(component, "findDocuments").mockImplementation((tableName) => {
        if (tableName === "Debt Verifications")
          return [
            {
              ...mockOlaDocument,
              documentName: "DocDebt",
              documentTypeCode: "MRB",
              documentSource: "Applicant",
            },
          ];
        if (tableName === "Other")
          return [
            {
              ...mockOlaDocument,
              documentName: "DocOther",
              documentTypeCode: "AFP",
              documentSource: "FSA",
            },
          ];
        return [];
      });
      jest
        .spyOn(component, "createOlaDoc")
        .mockImplementation((name, source, code) => ({
          ...mockOlaDocument,
          documentName: name,
          documentSource: source,
          documentTypeCode: code,
        }));
    });

    it("should populate tables based on tableNameList", () => {
      component.populateTables();

      expect(component.populateOlaDocUrls).toHaveBeenCalled();
      expect(component.tables.length).toBe(3); // Request Form, Debt Verifications, Other

      const requestFormTable = component.tables.find(
        (t) => t.tableName === "Request Form"
      );
      expect(requestFormTable).toBeDefined();
      expect(requestFormTable.olaDocument.length).toBe(1);
      expect(requestFormTable.olaDocument[0].documentName).toBe(
        "FSA-2001-Application-app123"
      );
      expect(requestFormTable.olaDocument[0].documentSource).toBe(
        "OLA-Generated"
      );

      const debtTable = component.tables.find(
        (t) => t.tableName === "Debt Verifications"
      );
      expect(debtTable).toBeDefined();
      expect(debtTable.olaDocument.length).toBe(1); // From findDocuments mock
      expect(debtTable.olaDocument[0].documentName).toBe("DocDebt");

      const otherTable = component.tables.find((t) => t.tableName === "Other");
      expect(otherTable).toBeDefined();
      expect(otherTable.olaDocument.length).toBe(1); // From findDocuments mock
      expect(otherTable.olaDocument[0].documentName).toBe("DocOther");
    });

    it("should sort documents by documentSource within each table", () => {
      // Reset findDocuments to return unsorted items for a specific table
      (component.findDocuments as jest.Mock).mockImplementation((tableName) => {
        if (tableName === "Other")
          return [
            {
              ...mockOlaDocument,
              documentName: "DocOther1",
              documentSource: "Applicant",
            },
            {
              ...mockOlaDocument,
              documentName: "DocOther2",
              documentSource: "OLA-Generated",
            },
          ];
        return [];
      });
      component.tableNameList = ["Other"]; // Focus on one table for sorting check
      component.populateTables();

      const otherTable = component.tables.find((t) => t.tableName === "Other");
      expect(otherTable.olaDocument.length).toBe(2);
      // 'OLA-Generated' should come before 'Applicant' due to "> b.documentSource ? -1 : 1"
      expect(otherTable.olaDocument[0].documentSource).toBe("OLA-Generated");
      expect(otherTable.olaDocument[1].documentSource).toBe("Applicant");
    });
  });

  describe("onFileSelected", () => {
    let mockTable: any;
    let mockEvent: any;

    beforeEach(() => {
      mockTable = { tableName: "Test Table", olaDocument: [] };
      const mockFile = new File(["dummy content"], "test-file.pdf", {
        type: "application/pdf",
      });
      mockEvent = {
        target: {
          files: [
            mockFile,
            new File(["content"], "another.txt", { type: "text/plain" }),
          ],
          value: "somepath/test-file.pdf", // to be cleared
        },
      };
      jest.spyOn(component, "createOlaDoc").mockReturnValue(mockOlaDocument);
    });

    it("should process selected files, update table, and reset input", () => {
      component.onFileSelected(mockEvent as any, mockTable);

      expect(component.selectedFiles.length).toBe(2);
      expect(component.selectedFiles[0].name).toBe("test-file.pdf");
      expect(component.isUploadBtnDisabled).toBe(false);
      expect((mockEvent.target as HTMLInputElement).value).toBe("");
      expect(component.newDocsPresent).toBe(true);
      expect(component.createOlaDoc).toHaveBeenCalledTimes(2);
      expect(component.createOlaDoc).toHaveBeenCalledWith(
        "test-file.pdf",
        "FSA",
        "ABC",
        "empty"
      );
      expect(component.createOlaDoc).toHaveBeenCalledWith(
        "another.txt",
        "FSA",
        "ABC",
        "empty"
      );
      expect(mockTable.olaDocument.length).toBe(2);
      expect(mockTable.olaDocument[0]).toBe(mockOlaDocument);
    });

    it("should not process if no files are selected", () => {
      mockEvent.target.files = null;
      component.onFileSelected(mockEvent as any, mockTable);
      expect(component.selectedFiles).toBeUndefined(); // Or initial state
      expect(mockTable.olaDocument.length).toBe(0);

      mockEvent.target.files = [];
      component.onFileSelected(mockEvent as any, mockTable);
      expect(component.selectedFiles).toBeUndefined(); // Or initial state
      expect(mockTable.olaDocument.length).toBe(0);
    });
  });

  describe("handleDocumentAction", () => {
    let mockDoc: OlaDocument;
    let mockTableRef: any;
    let generateFileSpy: jest.SpyInstance;

    beforeEach(() => {
      mockDoc = { ...mockOlaDocument, isNew: false };
      mockTableRef = { tableName: "SomeTable" };
      generateFileSpy = jest.spyOn(component, "generateFile");
    });

    it("should set isNew to false if it was true and call generateFile", () => {
      mockDoc.isNew = true;
      component.newDocsPresent = true;
      component.handleDocumentAction(mockDoc, mockTableRef);

      expect(mockDoc.isNew).toBe(false);
      expect(component.newDocsPresent).toBe(false);
      expect(generateFileSpy).toHaveBeenCalledWith(mockDoc, mockTableRef);
    });

    it("should just call generateFile if isNew was false", () => {
      mockDoc.isNew = false;
      component.newDocsPresent = false; // Assume it could be anything
      component.handleDocumentAction(mockDoc, mockTableRef);

      expect(mockDoc.isNew).toBe(false); // Unchanged
      // newDocsPresent should not be changed by this path if it was already false
      expect(component.newDocsPresent).toBe(false);
      expect(generateFileSpy).toHaveBeenCalledWith(mockDoc, mockTableRef);
    });
  });

  describe("isPdf", () => {
    it("should return true if filename starts with .pdf", () => {
      expect(component.isPdf(".pdf")).toBe(true);
      expect(component.isPdf(".pdf-something")).toBe(true);
    });
    it("should return false if filename does not start with .pdf", () => {
      expect(component.isPdf("mydoc.pdf")).toBe(false);
      expect(component.isPdf(".docx")).toBe(false);
      expect(component.isPdf("")).toBe(false);
    });
  });

  // --- Re-add other tests that were omitted for brevity ---
  // (populateOlaDocUrls, createOlaDoc, getMatchingOlaDocTypeCodes, findDocuments, populateTables, onFileSelected, handleDocumentAction)
  // These generally don't need the window/document mocks directly, so their structure remains the same.

  describe("populateOlaDocUrls", () => {
    it("should populate pdfUrl for each document in finalDocumentList", () => {
      component.finalDocumentList = [
        { ...mockOlaDocument, documentName: "DocA", documentExtension: ".pdf" },
        {
          ...mockOlaDocument,
          documentName: "DocB",
          documentExtension: ".docx",
        },
      ];
      component.populateOlaDocUrls();
      expect(component.finalDocumentList[0].pdfUrl).toBe("/assets/DocA.pdf");
      expect(component.finalDocumentList[1].pdfUrl).toBe("/assets/DocB.docx");
    });
  });

  describe("createOlaDoc", () => {
    it("should create an OlaDocument with a default date if date is null", () => {
      const doc = component.createOlaDoc(
        "TestName",
        "TestSource",
        "TestCode",
        null
      );
      expect(doc.documentName).toBe("TestName");
      expect(doc.documentSource).toBe("TestSource");
      expect(doc.documentTypeCode).toBe("TestCode");
      expect(doc.documentDate).toEqual(new Date("10-23-2024")); // As per logic
      expect(doc.isNew).toBeUndefined();
    });

    it('should create an OlaDocument with null date and isNew=true if date is "empty"', () => {
      const doc = component.createOlaDoc(
        "TestName",
        "TestSource",
        "TestCode",
        "empty"
      );
      expect(doc.documentName).toBe("TestName");
      expect(doc.documentDate).toBeNull();
      expect(doc.isNew).toBe(true);
    });

    it("should create an OlaDocument with the provided date if date is a valid string", () => {
      const testDate = "2023-05-15";
      const doc = component.createOlaDoc(
        "TestName",
        "TestSource",
        "TestCode",
        testDate
      );
      expect(doc.documentName).toBe("TestName");
      expect(doc.documentDate).toEqual(new Date(testDate));
    });
  });

  describe("getMatchingOlaDocTypeCodes", () => {
    it('should return correct codes for "Loan Purpose and Amount"', () => {
      const codes = component.getMatchingOlaDocTypeCodes(
        "Loan Purpose and Amount"
      );
      expect(codes).toEqual(["COE", "REP", "RLD"]);
    });
    it('should return correct codes for "Other"', () => {
      const codes = component.getMatchingOlaDocTypeCodes("Other");
      expect(codes).toContain("AFP");
      expect(codes).toContain("UTC");
    });
    it("should return an empty array for an unknown table name", () => {
      const codes = component.getMatchingOlaDocTypeCodes("Unknown Table");
      expect(codes).toEqual([]);
    });
  });

  describe("findDocuments", () => {
    beforeEach(() => {
      component.finalDocumentList = [
        {
          ...mockOlaDocument,
          documentName: "DocA",
          documentTypeCode: "COE",
          documentExtension: ".pdf  ",
        },
        { ...mockOlaDocument, documentName: "DocB", documentTypeCode: "REP" },
        { ...mockOlaDocument, documentName: "DocC", documentTypeCode: "BAS" },
      ];
    });

    it('should find documents matching table name "Loan Purpose and Amount"', () => {
      const docs = component.findDocuments("Loan Purpose and Amount");
      expect(docs.length).toBe(2);
      expect(docs.some((d) => d.documentTypeCode === "COE")).toBe(true);
      expect(docs.some((d) => d.documentTypeCode === "REP")).toBe(true);
      expect(
        docs.find((d) => d.documentName === "DocA").documentExtension
      ).toBe(".pdf  ");
    });

    it("should return an empty array if no documents match", () => {
      const docs = component.findDocuments("Credit Elsewhere");
      expect(docs.length).toBe(0);
    });
  });

  describe("populateTables", () => {
    let populateOlaDocUrlsSpy: jest.SpyInstance;
    let findDocumentsSpy: jest.SpyInstance;
    let createOlaDocSpy: jest.SpyInstance;

    beforeEach(() => {
      component.applicationId = "app123";
      component.finalDocumentList = [
        {
          ...mockOlaDocument,
          documentName: "DocDebt",
          documentTypeCode: "MRB",
          documentSource: "Applicant",
        },
        {
          ...mockOlaDocument,
          documentName: "DocOther",
          documentTypeCode: "AFP",
          documentSource: "FSA",
        },
      ];
      component.tableNameList = ["Request Form", "Debt Verifications", "Other"];
      populateOlaDocUrlsSpy = jest
        .spyOn(component, "populateOlaDocUrls")
        .mockImplementation(() => {});
      findDocumentsSpy = jest
        .spyOn(component, "findDocuments")
        .mockImplementation((tableName) => {
          if (tableName === "Debt Verifications")
            return [
              {
                ...mockOlaDocument,
                documentName: "DocDebt",
                documentTypeCode: "MRB",
                documentSource: "Applicant",
              },
            ];
          if (tableName === "Other")
            return [
              {
                ...mockOlaDocument,
                documentName: "DocOther",
                documentTypeCode: "AFP",
                documentSource: "FSA",
              },
            ];
          return [];
        });
      createOlaDocSpy = jest
        .spyOn(component, "createOlaDoc")
        .mockImplementation((name, source, code) => ({
          ...mockOlaDocument,
          documentName: name,
          documentSource: source,
          documentTypeCode: code,
        }));
    });

    afterEach(() => {
      populateOlaDocUrlsSpy.mockRestore();
      findDocumentsSpy.mockRestore();
      createOlaDocSpy.mockRestore();
    });

    it("should populate tables based on tableNameList", () => {
      component.populateTables();

      expect(component.populateOlaDocUrls).toHaveBeenCalled();
      expect(component.tables.length).toBe(3);

      const requestFormTable = component.tables.find(
        (t) => t.tableName === "Request Form"
      );
      expect(requestFormTable).toBeDefined();
      expect(requestFormTable.olaDocument.length).toBe(1);
      expect(requestFormTable.olaDocument[0].documentName).toBe(
        "FSA-2001-Application-app123"
      );

      const debtTable = component.tables.find(
        (t) => t.tableName === "Debt Verifications"
      );
      expect(debtTable).toBeDefined();
      expect(debtTable.olaDocument[0].documentName).toBe("DocDebt");

      const otherTable = component.tables.find((t) => t.tableName === "Other");
      expect(otherTable).toBeDefined();
      expect(otherTable.olaDocument[0].documentName).toBe("DocOther");
    });

    it("should sort documents by documentSource within each table", () => {
      findDocumentsSpy.mockImplementation((tableName) => {
        if (tableName === "Other")
          return [
            {
              ...mockOlaDocument,
              documentName: "DocOther1",
              documentSource: "Applicant",
            },
            {
              ...mockOlaDocument,
              documentName: "DocOther2",
              documentSource: "OLA-Generated",
            },
          ];
        return [];
      });
      component.tableNameList = ["Other"];
      component.populateTables();

      const otherTable = component.tables.find((t) => t.tableName === "Other");
      expect(otherTable.olaDocument.length).toBe(2);
      expect(otherTable.olaDocument[0].documentSource).toBe("OLA-Generated");
      expect(otherTable.olaDocument[1].documentSource).toBe("Applicant");
    });
  });

  describe("onFileSelected", () => {
    let mockTable: any;
    let mockEvent: any;
    let createOlaDocSpy: jest.SpyInstance;

    beforeEach(() => {
      mockTable = { tableName: "Test Table", olaDocument: [] };
      const mockFile = new File(["dummy content"], "test-file.pdf", {
        type: "application/pdf",
      });
      mockEvent = {
        target: {
          files: [
            mockFile,
            new File(["content"], "another.txt", { type: "text/plain" }),
          ],
          value: "somepath/test-file.pdf",
        },
      };
      createOlaDocSpy = jest
        .spyOn(component, "createOlaDoc")
        .mockReturnValue(mockOlaDocument);
    });

    afterEach(() => {
      createOlaDocSpy.mockRestore();
    });

    it("should process selected files, update table, and reset input", () => {
      component.onFileSelected(mockEvent as any, mockTable);

      expect(component.selectedFiles.length).toBe(2);
      expect(component.selectedFiles[0].name).toBe("test-file.pdf");
      expect(component.isUploadBtnDisabled).toBe(false);
      expect((mockEvent.target as HTMLInputElement).value).toBe("");
      expect(component.newDocsPresent).toBe(true);
      expect(createOlaDocSpy).toHaveBeenCalledTimes(2);
      expect(mockTable.olaDocument.length).toBe(2);
    });

    it("should not process if no files are selected", () => {
      mockEvent.target.files = null;
      component.onFileSelected(mockEvent as any, mockTable);
      expect(component.selectedFiles).toBeUndefined();
      expect(mockTable.olaDocument.length).toBe(0);

      mockEvent.target.files = [];
      component.onFileSelected(mockEvent as any, mockTable);
      expect(component.selectedFiles).toBeUndefined();
      expect(mockTable.olaDocument.length).toBe(0);
    });
  });

  describe("handleDocumentAction", () => {
    let mockDoc: OlaDocument;
    let mockTableRef: any;
    let generateFileSpy: jest.SpyInstance;

    beforeEach(() => {
      mockDoc = { ...mockOlaDocument, isNew: false };
      mockTableRef = { tableName: "SomeTable" };
      generateFileSpy = jest
        .spyOn(component, "generateFile")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      generateFileSpy.mockRestore();
    });

    it("should set isNew to false if it was true and call generateFile", () => {
      mockDoc.isNew = true;
      component.newDocsPresent = true;
      component.handleDocumentAction(mockDoc, mockTableRef);

      expect(mockDoc.isNew).toBe(false);
      expect(component.newDocsPresent).toBe(false);
      expect(generateFileSpy).toHaveBeenCalledWith(mockDoc, mockTableRef);
    });

    it("should just call generateFile if isNew was false", () => {
      mockDoc.isNew = false;
      component.newDocsPresent = false;
      component.handleDocumentAction(mockDoc, mockTableRef);

      expect(mockDoc.isNew).toBe(false);
      expect(component.newDocsPresent).toBe(false);
      expect(generateFileSpy).toHaveBeenCalledWith(mockDoc, mockTableRef);
    });
  });
});
