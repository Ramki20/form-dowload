import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../../../src/environments/environment";
import { LoggerService } from "../logger/logger.service";

@Injectable({ providedIn: "root" })
export class CMBSDocumentService {
  private logger = this.loggerService.forComponent(CMBSDocumentService);
  cmbsDownLoadUrl = `${environment.common_api_url}/cmbs-document`;

  constructor(private http: HttpClient, private loggerService: LoggerService) {}

  downloadCMBSDocument(key: string, fileName: string): Observable<ArrayBuffer> {
    // Set up headers based on file type
    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    this.logger.debug("fileExtension:", fileExtension);

    // Check if this is a text file
    const isTextFile = fileExtension.trim() === "txt";
    this.logger.debug("isTextFile:", isTextFile);

    // For text files, we'll handle the response differently
    if (isTextFile) {
      // For text files, we're expecting a JSON response
      return this.http
        .get(`${this.cmbsDownLoadUrl}/${key}?fileName=${fileName}`, {
          responseType: "json" as "json",
        })
        .pipe(
          map((response: any) => {
            // Convert the base64 encoded content back to binary
            const binaryString = window.atob(response.fileContent);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
          })
        );
    } else {
      const contentType = this.getContentType(fileExtension);
      // Set Accept header to match expected content type
      const headers = new HttpHeaders().set("Accept", contentType);

      // Request the file as arraybuffer
      return this.http.get(
        `${this.cmbsDownLoadUrl}/${key}?fileName=${fileName}`,
        {
          headers,
          responseType: "arraybuffer",
        }
      );
    }
  }

  getContentType(extension: string): string {
    const contentTypes = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      rtf: "application/rtf",
      gif: "image/gif",
      zip: "application/zip",
    };

    const ext = extension.toLowerCase().trim().replace(".", "");
    return contentTypes[ext] || "application/octet-stream";
  }

  /**
   * Handle the file download process
   */
  handleDownload(
    data: ArrayBuffer,
    documentName: string,
    documentExtension: string
  ): void {
    // Determine content type based on file extension
    const contentType = this.getContentType(documentExtension);
    // Create a blob with the correct content type
    const blob = new Blob([data], { type: contentType });
    // Create a blob URL and trigger download - use window.document to avoid conflicts
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = this.combineFilenameAndExtension(
      documentName,
      documentExtension
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  combineFilenameAndExtension(filename, extension) {
    // Trim whitespace from both filename and extension
    const cleanFilename = filename.trim();
    const cleanExtension = extension.trim();

    // Check if the extension already has a period at the beginning.
    if (cleanExtension.startsWith(".")) {
      // If it does, just concatenate filename and extension.
      return cleanFilename + cleanExtension;
    } else {
      // If not, add a period between filename and extension before concatenating.
      return cleanFilename + "." + cleanExtension;
    }
  }

  /**
   * Handle download errors
   */
  handleDownloadError(error: any, documentType: string): void {
    console.error(`Error downloading ${documentType} document:`, error);
    alert(
      `Failed to download the ${documentType} document. Please try again later.`
    );
  }
}
