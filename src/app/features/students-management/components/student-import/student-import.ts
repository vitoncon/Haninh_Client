import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { RouterModule } from '@angular/router';
import { StudentImportService, ValidationResult, ImportRow } from '../../services/student-import.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-student-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    FileUploadModule,
    TableModule,
    TagModule,
    ToastModule,
    RouterModule
  ],
  templateUrl: './student-import.html',
  styleUrls: ['./student-import.scss'],
  providers: [MessageService]
})
export class StudentImportComponent {
  importResults: ValidationResult[] = [];
  summary: any = null;
  loading = false;
  uploading = false;

  constructor(
    private importService: StudentImportService,
    private messageService: MessageService
  ) {}

  onUpload(event: any) {
    const file = event.files[0];
    if (file) {
      this.uploading = true;
      this.importService.preview(file).subscribe({
        next: (res: { data: ValidationResult[], summary: any }) => {
          this.importResults = res.data;
          this.summary = res.summary;
          this.uploading = false;
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tải dữ liệu preview' });
        },
        error: (err: any) => {
          this.uploading = false;
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.error?.error || 'Không thể đọc file' });
        }
      });
    }
  }

  onConfirm() {
    const validRows: ImportRow[] = this.importResults.filter(r => r.isValid).map(r => r.row);
    if (validRows.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không có dòng dữ liệu hợp lệ để import' });
      return;
    }

    this.loading = true;
    this.importService.import(validRows).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: res.message });
        this.importResults = [];
        this.summary = null;
      },
      error: (err: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.error?.error || 'Import thất bại' });
      }
    });
  }

  getValidationSeverity(result: ValidationResult): "warn" | "success" | "danger" | "secondary" | "info" | "contrast" | undefined {
    if (result.isDuplicate) return 'warn';
    return result.isValid ? 'success' : 'danger';
  }

  getValidationStatus(result: ValidationResult): string {
    if (result.isDuplicate) return 'Trùng lặp';
    return result.isValid ? 'Hợp lệ' : 'Lỗi';
  }
}
