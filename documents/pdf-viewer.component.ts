import { Component, Inject, OnInit, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentRetrievalService } from '../../services/docs/document-retrieval.service';


@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ data.fileName }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <iframe [src]="safePdfUrl" width="100%" height="500px"></iframe>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="downloadPdf()" *ngIf="data.canDownload">Download</button>
        <button mat-button mat-dialog-close>Close</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 100%;
      max-height: 100%;
    }
    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `]
})
export class PdfViewerComponent implements OnInit {
  safePdfUrl: SafeResourceUrl;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      pdfUrl: string,
      fileName: string,
      storageAddressText: string,
      canDownload: boolean
    },
    private dialogRef: MatDialogRef<PdfViewerComponent>,
    private sanitizer: DomSanitizer,
    private documentRetrievalService: DocumentRetrievalService
  ) {}


  ngOnInit() {

  }

  downloadPdf() {
    this.documentRetrievalService.downloadForm(this.data.storageAddressText).subscribe({
      next: (response: any) => {
        const blob = new Blob([response.body], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.data.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
      }
    });
  }
}
