import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { CMBSDocumentService } from "./cmbs-document-service";
import { environment } from "src/environments/environment";

describe("CMBSDocumentService", () => {
  let service: CMBSDocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CMBSDocumentService],
    });
    service = TestBed.inject(CMBSDocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should initialize URLs correctly in constructor", () => {
    expect(service.cmbsDownLoadUrl).toBe(
      `${environment.common_api_url}/cmbs-document`
    );
  });

  describe("CMBS Document Download", () => {
    it("should download non-text CMBS document", () => {
      const key = "document-key";
      const fileName = "test.pdf";
      const mockArrayBuffer = new ArrayBuffer(8);

      service.downloadCMBSDocument(key, fileName).subscribe((response) => {
        expect(response).toEqual(mockArrayBuffer);
      });

      const req = httpMock.expectOne(
        `${service.cmbsDownLoadUrl}/${key}?fileName=${fileName}`
      );
      expect(req.request.method).toBe("GET");
      expect(req.request.headers.get("Accept")).toBe("application/pdf");
      expect(req.request.responseType).toBe("arraybuffer");

      req.flush(mockArrayBuffer);
    });

    it("should download text CMBS document", () => {
      const key = "document-key";
      const fileName = "test.txt";
      const mockBase64Content = "SGVsbG8gV29ybGQh"; // Base64 for "Hello World!"
      const mockResponse = { fileContent: mockBase64Content };

      service.downloadCMBSDocument(key, fileName).subscribe((response) => {
        // Convert ArrayBuffer to string to check content
        const view = new Uint8Array(response);
        let result = "";
        for (let i = 0; i < view.length; i++) {
          result += String.fromCharCode(view[i]);
        }
        expect(result).toBe("Hello World!");
      });

      const req = httpMock.expectOne(
        `${service.cmbsDownLoadUrl}/${key}?fileName=${fileName}`
      );
      expect(req.request.method).toBe("GET");
      expect(req.request.responseType).toBe("json");

      req.flush(mockResponse);
    });
  });

  describe("Content Type Detection", () => {
    it("should return the correct content type for various extensions", () => {
      // Test common document types
      expect(service.getContentType("pdf")).toBe("application/pdf");
      expect(service.getContentType(".pdf")).toBe("application/pdf");
      expect(service.getContentType("PDF")).toBe("application/pdf");
      expect(service.getContentType("doc")).toBe("application/msword");
      expect(service.getContentType("docx")).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );

      // Test image types
      expect(service.getContentType("jpg")).toBe("image/jpeg");
      expect(service.getContentType("jpeg")).toBe("image/jpeg");
      expect(service.getContentType("png")).toBe("image/png");
      expect(service.getContentType("gif")).toBe("image/gif");

      // Test spreadsheet types
      expect(service.getContentType("xls")).toBe("application/vnd.ms-excel");
      expect(service.getContentType("xlsx")).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      // Test additional types
      expect(service.getContentType("rtf")).toBe("application/rtf");

      // Test with whitespace and periods
      expect(service.getContentType(" pdf ")).toBe("application/pdf");
      expect(service.getContentType(".jpg")).toBe("image/jpeg");

      // Test unknown type
      expect(service.getContentType("unknown")).toBe(
        "application/octet-stream"
      );
    });
  });
});
