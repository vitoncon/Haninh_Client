import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CertificateService } from '../../services/certificate.service';
import { Certificate, StudentCertificate, StudentCertificateWithDetails, CertificateStatistics } from '../../models/certificates.model';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Table } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.html',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    DrawerModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    CardModule,
    CheckboxModule
  ],
  providers: [ConfirmationService],
  styleUrls: ['./certificates.scss']
})
export class Certificates implements OnInit, OnDestroy {
  certificates: StudentCertificateWithDetails[] = [];
  filteredCertificates: StudentCertificateWithDetails[] = [];
  selectedCertificates: StudentCertificateWithDetails[] = [];
  formCertificate: StudentCertificate | null = null;
  drawerVisible: boolean = false;
  isEditMode: boolean = false;
  saving: boolean = false;
  loading: boolean = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  statistics: CertificateStatistics | null = null;
  
  // Expiry date search options
  expirySearchOptions: any[] = [];
  selectedExpiryFilter: string = '';
  customDateRange: { from: Date | null, to: Date | null } = { from: null, to: null };
  
  @ViewChild('dt', { static: false }) dt!: Table;
  
  // RxJS subjects for better memory management
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Dropdown options
  availableStudents: any[] = [];
  availableClasses: any[] = [];
  availableCertificateTypes: any[] = [];
  certificateStatusOptions: any[] = [];

  // Certificate type details for current form
  currentCertificateTypeDetails: any = null;

  constructor(
    private certificateService: CertificateService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeSearchSubscription();
    this.loadData();
    this.loadDropdownData();
    this.initializeOptions();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchSubscription(): void {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (query: string) => {
        this.performSearch(query);
      }
    });
  }

  private performSearch(query: string): void {
    let filteredData = [...this.certificates];
    
    // Apply text search filter
    const trimmedQuery = query.trim();
    if (trimmedQuery.length > 0) {
      filteredData = filteredData.filter(certificate => {
        const searchTerm = trimmedQuery.toLowerCase();
        
        return (
          certificate.student_name?.toLowerCase().includes(searchTerm) ||
          certificate.student_code?.toLowerCase().includes(searchTerm) ||
          certificate.certificate_name?.toLowerCase().includes(searchTerm) ||
          certificate.certificate_code?.toLowerCase().includes(searchTerm) ||
          certificate.certificate_number?.toLowerCase().includes(searchTerm) ||
          certificate.status?.toLowerCase().includes(searchTerm) ||
          certificate.class_name?.toLowerCase().includes(searchTerm) ||
          certificate.note?.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Apply expiry date filter
    if (this.selectedExpiryFilter) {
      filteredData = this.applyExpiryFilter(filteredData);
    }
    
    this.filteredCertificates = filteredData;
    this.cdr.detectChanges();
  }

  private applyExpiryFilter(certificates: StudentCertificateWithDetails[]): StudentCertificateWithDetails[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    switch (this.selectedExpiryFilter) {
      case 'expired':
        return certificates.filter(cert => 
          cert.expiry_date && new Date(cert.expiry_date) < today
        );
        
      case 'expiring_30':
        return certificates.filter(cert => 
          cert.expiry_date && 
          new Date(cert.expiry_date) >= today && 
          new Date(cert.expiry_date) <= thirtyDaysFromNow
        );
        
      case 'expiring_7':
        return certificates.filter(cert => 
          cert.expiry_date && 
          new Date(cert.expiry_date) >= today && 
          new Date(cert.expiry_date) <= sevenDaysFromNow
        );
        
      case 'valid_long':
        return certificates.filter(cert => 
          cert.expiry_date && new Date(cert.expiry_date) > thirtyDaysFromNow
        );
        
      case 'permanent':
        return certificates.filter(cert => !cert.expiry_date);
        
      case 'custom_range':
        return this.applyCustomDateRangeFilter(certificates);
        
      default:
        return certificates;
    }
  }

  private applyCustomDateRangeFilter(certificates: StudentCertificateWithDetails[]): StudentCertificateWithDetails[] {
    if (!this.customDateRange.from || !this.customDateRange.to) {
      return certificates;
    }
    
    const fromDate = new Date(this.customDateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    
    const toDate = new Date(this.customDateRange.to);
    toDate.setHours(23, 59, 59, 999);
    
    return certificates.filter(cert => 
      cert.expiry_date && 
      new Date(cert.expiry_date) >= fromDate && 
      new Date(cert.expiry_date) <= toDate
    );
  }

  private loadData(): void {
    this.loading = true;
    
    this.certificateService.getStudentCertificates().subscribe({
      next: (data) => {
        this.certificates = data;
        
        // Apply current search filter if any
        if (this.searchQuery && this.searchQuery.trim().length > 0) {
          this.performSearch(this.searchQuery);
        } else {
          this.filteredCertificates = [...data];
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách chứng chỉ'
        });
        this.loading = false;
      }
    });
  }

  private loadDropdownData(): void {
    // Load students
    this.certificateService.getStudents().subscribe({
      next: (data) => {
        this.availableStudents = data.map(student => ({
          label: `${student.student_code} - ${student.full_name}`,
          value: student.id
        }));
      },
      error: (error) => {
        console.error('Failed to load students:', error);
        this.availableStudents = [];
      }
    });

    // Load classes
    this.certificateService.getClasses().subscribe({
      next: (data) => {
        this.availableClasses = data.map(cls => ({
          label: `${cls.class_code} - ${cls.class_name}`,
          value: cls.id
        }));
      },
      error: (error) => {
        console.error('Failed to load classes:', error);
        this.availableClasses = [];
      }
    });

    // Load certificate types
    this.certificateService.getCertificates().subscribe({
      next: (data) => {
        this.availableCertificateTypes = data.map(cert => ({
          label: `${cert.certificate_code} - ${cert.certificate_name}`,
          value: cert.id
        }));
      },
      error: (error) => {
        console.error('Failed to load certificate types:', error);
        this.availableCertificateTypes = [];
      }
    });
  }

  private initializeOptions(): void {
    this.certificateStatusOptions = this.certificateService.getCertificateStatusOptions();
    this.initializeExpirySearchOptions();
  }

  private initializeExpirySearchOptions(): void {
    this.expirySearchOptions = [
      { label: 'Tất cả chứng chỉ', value: '' },
      { label: 'Đã hết hạn', value: 'expired' },
      { label: 'Sắp hết hạn (30 ngày)', value: 'expiring_30' },
      { label: 'Sắp hết hạn (7 ngày)', value: 'expiring_7' },
      { label: 'Còn hiệu lực (>30 ngày)', value: 'valid_long' },
      { label: 'Chứng chỉ vĩnh viễn', value: 'permanent' },
      { label: 'Khoảng thời gian tùy chỉnh', value: 'custom_range' }
    ];
  }

  private loadStatistics(): void {
    this.certificateService.getCertificateStatistics().subscribe({
      next: (data) => {
        this.statistics = data;
      },
      error: (error) => {
        // Statistics loading failed - silently handle
      }
    });
  }

  onSearch(event: any): void {
    const query = event.target.value || '';
    this.searchQuery = query;
    this.showClearButton = query.length > 0;
    
    // Trigger search with debounce
    this.searchSubject$.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.showClearButton = false;
    
    // Reset filtered certificates to show all
    this.filteredCertificates = [...this.certificates];
    this.cdr.detectChanges();
    
    // Also trigger search subject to ensure consistency
    this.searchSubject$.next('');
  }

  onExpiryFilterChange(): void {
    // Apply current search query with new expiry filter
    this.performSearch(this.searchQuery);
  }

  onCustomDateRangeChange(): void {
    // Apply custom date range filter
    if (this.selectedExpiryFilter === 'custom_range') {
      this.performSearch(this.searchQuery);
    }
  }

  clearExpiryFilter(): void {
    this.selectedExpiryFilter = '';
    this.customDateRange = { from: null, to: null };
    this.performSearch(this.searchQuery);
  }

  openNew(): void {
    this.resetFormData();
    this.formCertificate = this.createEmptyCertificate();
    this.drawerVisible = true;
    this.cdr.detectChanges();
  }

  editCertificate(certificate: StudentCertificateWithDetails): void {
    this.resetFormData();
    this.formCertificate = { ...certificate };
    this.isEditMode = true;
    this.drawerVisible = true;
    
    if (certificate.certificate_id) {
      this.onCertificateTypeChange(certificate.certificate_id);
    }
    
    this.cdr.detectChanges();
  }

  deleteCertificate(certificate: StudentCertificateWithDetails): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa chứng chỉ "${certificate.certificate_name}" của học viên "${certificate.student_name}"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        if (certificate.id) {
          this.certificateService.deleteStudentCertificate(certificate.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đã xóa chứng chỉ thành công'
              });
              this.loadData();
              this.loadStatistics();
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể xóa chứng chỉ'
              });
            }
          });
        }
      }
    });
  }

  saveCertificate(): void {
    if (!this.formCertificate) {
      return;
    }

    // Validate certificate
    const validationErrors = this.validateCertificate(this.formCertificate);
    if (validationErrors.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Lỗi validation',
        detail: validationErrors.join(', ')
      });
      return;
    }

    // Set class_id to null if 0 (optional field)
    if (this.formCertificate.class_id === 0) {
      this.formCertificate.class_id = undefined;
    }

    // Handle expiry date for permanent certificates
    if (this.currentCertificateTypeDetails?.isPermanent) {
      this.formCertificate.expiry_date = undefined;
    }

    this.saving = true;
    const operation = this.isEditMode 
      ? this.certificateService.updateStudentCertificate(this.formCertificate.id!, this.formCertificate)
      : this.certificateService.addStudentCertificate(this.formCertificate);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: this.isEditMode ? 'Đã cập nhật chứng chỉ thành công' : 'Đã thêm chứng chỉ thành công'
        });
        
        // Reset form to initial state
        this.resetFormToInitialState();
        
        // Force reload data to show updated information
        this.forceRefresh();
        this.saving = false;
      },
      error: (error) => {
        let errorMessage = this.isEditMode ? 'Không thể cập nhật chứng chỉ' : 'Không thể thêm chứng chỉ';
        
        if (error.error?.message) {
          errorMessage += ': ' + error.error.message;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        } else if (error.status) {
          errorMessage += ` (Status: ${error.status})`;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: errorMessage
        });
        this.saving = false;
      }
    });
  }

  cancelEdit(): void {
    this.resetFormToInitialState();
  }

  /**
   * Reset form data only (without closing drawer)
   */
  private resetFormData(): void {
    this.formCertificate = null;
    this.isEditMode = false;
    this.currentCertificateTypeDetails = null;
    this.saving = false;
  }

  /**
   * Reset form to initial state - clears all form data and closes drawer
   */
  private resetFormToInitialState(): void {
    this.resetFormData();
    this.drawerVisible = false;
    this.cdr.detectChanges();
  }

  private createEmptyCertificate(): StudentCertificate {
    return {
      student_id: 0, // Sẽ được set khi user chọn student
      certificate_id: 0, // Sẽ được set khi user chọn certificate type
      class_id: 0, // Optional, có thể để 0 hoặc null
      issued_date: new Date().toISOString().split('T')[0],
      certificate_number: this.certificateService.generateCertificateNumber(),
      status: 'Đang chờ',
      note: '',
      issued_by: '',
      signature: '',
      certificate_file_path: ''
    };
  }

  // Handle certificate type selection change
  onCertificateTypeChange(certificateTypeId: number): void {
    if (!certificateTypeId || certificateTypeId === 0) {
      this.currentCertificateTypeDetails = null;
      return;
    }

    this.certificateService.getCertificateTypeDetails(certificateTypeId).subscribe({
      next: (details) => {
        this.currentCertificateTypeDetails = details;
        
        // Handle expiry date based on certificate type
        if (this.formCertificate) {
          if (details.isPermanent) {
            // For permanent certificates, clear expiry date
            this.formCertificate.expiry_date = undefined;
            this.messageService.add({
              severity: 'info',
              summary: 'Thông tin',
              detail: 'Chứng chỉ vĩnh viễn - ngày hết hạn đã được xóa',
              life: 3000
            });
          } else {
            // For non-permanent certificates, auto-calculate expiry date if issued date exists
            if (this.formCertificate.issued_date) {
              this.calculateExpiryDate();
            }
          }
        }
        
        // Show criteria information
        if (details.criteria) {
          this.messageService.add({
            severity: 'info',
            summary: 'Thông tin chứng chỉ',
            detail: details.criteria,
            life: 5000
          });
        }
      },
      error: (error) => {
        this.currentCertificateTypeDetails = null;
      }
    });
  }

  // Auto-calculate expiry date based on certificate type
  private calculateExpiryDate(): void {
    if (!this.formCertificate?.certificate_id || !this.formCertificate?.issued_date) {
      return;
    }

    this.certificateService.calculateExpiryDate(
      this.formCertificate.issued_date, 
      this.formCertificate.certificate_id
    ).subscribe({
      next: (expiryDate) => {
        if (expiryDate && this.formCertificate) {
          this.formCertificate.expiry_date = expiryDate;
        }
      },
      error: (error) => {
        // Silently handle error - expiry date calculation is optional
      }
    });
  }

  // Handle issued date change
  onIssuedDateChange(): void {
    if (this.formCertificate?.certificate_id && this.formCertificate?.issued_date) {
      this.calculateExpiryDate();
    }
  }

  // Validation methods
  private validateCertificate(certificate: StudentCertificate): string[] {
    const errors: string[] = [];

    if (!certificate.student_id || certificate.student_id === 0) {
      errors.push('Vui lòng chọn học viên');
    }

    if (!certificate.certificate_id || certificate.certificate_id === 0) {
      errors.push('Vui lòng chọn loại chứng chỉ');
    }

    if (!certificate.certificate_number || certificate.certificate_number.trim() === '') {
      errors.push('Vui lòng nhập số chứng chỉ');
    }

    if (!certificate.issued_date) {
      errors.push('Vui lòng chọn ngày cấp');
    }

    if (!certificate.status) {
      errors.push('Vui lòng chọn trạng thái');
    }

    // Validate certificate number format
    if (certificate.certificate_number && !/^[A-Z0-9-]+$/.test(certificate.certificate_number)) {
      errors.push('Số chứng chỉ chỉ được chứa chữ cái in hoa, số và dấu gạch ngang');
    }

    // Validate dates
    if (certificate.issued_date && certificate.expiry_date) {
      const issuedDate = new Date(certificate.issued_date);
      const expiryDate = new Date(certificate.expiry_date);
      
      if (expiryDate <= issuedDate) {
        errors.push('Ngày hết hạn phải sau ngày cấp');
      }
    }

    // Advanced validation based on certificate type
    if (this.currentCertificateTypeDetails) {
      // Check if certificate type is active
      if (this.currentCertificateTypeDetails.status !== 'Hoạt động') {
        errors.push('Loại chứng chỉ này không còn hoạt động');
      }

      // Validate permanent certificate
      if (this.currentCertificateTypeDetails.isPermanent && certificate.expiry_date) {
        errors.push('Chứng chỉ vĩnh viễn không được có ngày hết hạn');
      }

      // Validate non-permanent certificate must have expiry date
      if (!this.currentCertificateTypeDetails.isPermanent && !certificate.expiry_date) {
        errors.push('Chứng chỉ có thời hạn phải có ngày hết hạn');
      }
    }

    return errors;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null | undefined {
    switch (status) {
      case 'Đã cấp':
        return 'success';
      case 'Đã hết hạn':
        return 'danger';
      case 'Đã thu hồi':
        return 'warn';
      case 'Đang chờ':
        return 'info';
      default:
        return 'secondary';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  // Helper method to convert number to boolean for display
  isPermanentToString(value: number): string {
    return value === 1 ? 'Vĩnh viễn' : 'Có thời hạn';
  }


  // Check if certificate is expired
  isCertificateExpired(expiryDate: string): boolean {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  }

  // Get days until expiry
  getDaysUntilExpiry(expiryDate: string): number {
    if (!expiryDate) return -1;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }


  // Force refresh data
  public forceRefresh(): void {
    // Reset search state
    this.searchQuery = '';
    this.showClearButton = false;
    this.selectedExpiryFilter = '';
    this.customDateRange = { from: null, to: null };
    
    // Reload data
    this.loadData();
    this.loadStatistics();
  }

  // Export certificates to Excel with beautiful formatting
  exportToCSV(): void {
    if (this.filteredCertificates.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không có dữ liệu để xuất'
      });
      return;
    }

    // Create HTML table with beautiful formatting
    const htmlContent = this.generateHTMLReport();
    
    // Create a temporary div to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Convert HTML table to Excel using xlsx
    const workbook = XLSX.utils.table_to_book(tempDiv.querySelector('table'), {
      sheet: 'Danh sách chứng chỉ'
    });

    // Set column widths
    const worksheet = workbook.Sheets['Danh sách chứng chỉ'];
    worksheet['!cols'] = [
      { wch: 15 }, // Học viên
      { wch: 12 }, // Mã học viên
      { wch: 20 }, // Chứng chỉ
      { wch: 15 }, // Mã chứng chỉ
      { wch: 15 }, // Số chứng chỉ
      { wch: 12 }, // Ngày cấp
      { wch: 12 }, // Ngày hết hạn
      { wch: 12 }, // Trạng thái
      { wch: 20 }, // Lớp học
      { wch: 25 }  // Ghi chú
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `danh_sach_chung_chi_${timestamp}.xlsx`;
    
    // Write and download file
    XLSX.writeFile(workbook, filename);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Đã xuất ${this.filteredCertificates.length} chứng chỉ ra file Excel`
    });
  }

  private generateHTMLReport(): string {
    const now = new Date();
    const currentDate = now.toLocaleDateString('vi-VN');
    const currentTime = now.toLocaleTimeString('vi-VN');

    let html = `
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <tr>
          <td colspan="10" style="text-align: center; font-size: 16px; font-weight: bold; padding: 20px; border: none;">
            BÁO CÁO DANH SÁCH CHỨNG CHỈ
          </td>
        </tr>
        <tr>
          <td colspan="10" style="text-align: center; font-size: 14px; font-weight: bold; padding: 10px; border: none;">
            Học viện Hà Ninh
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 10px; border: none;"></td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            Ngày xuất báo cáo: ${currentDate} lúc ${currentTime}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            Tổng số chứng chỉ: ${this.filteredCertificates.length}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            Tổng số chứng chỉ trong hệ thống: ${this.certificates.length}
          </td>
        </tr>
    `;

    // Add filter information if any filters are applied
    if (this.searchQuery.trim() || this.selectedExpiryFilter) {
      html += `
        <tr>
          <td colspan="10" style="padding: 10px; border: none;"></td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 12px; font-weight: bold;">
            ĐIỀU KIỆN LỌC:
          </td>
        </tr>
      `;
      
      if (this.searchQuery.trim()) {
        html += `
          <tr>
            <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
              - Từ khóa tìm kiếm: "${this.searchQuery.trim()}"
            </td>
          </tr>
        `;
      }
      
      if (this.selectedExpiryFilter) {
        const filterLabel = this.expirySearchOptions.find(opt => opt.value === this.selectedExpiryFilter)?.label || this.selectedExpiryFilter;
        html += `
          <tr>
            <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
              - Lọc theo thời hạn: ${filterLabel}
            </td>
          </tr>
        `;
        
        if (this.selectedExpiryFilter === 'custom_range' && this.customDateRange.from && this.customDateRange.to) {
          html += `
            <tr>
              <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
                - Khoảng thời gian: ${this.formatDate(this.customDateRange.from.toISOString())} đến ${this.formatDate(this.customDateRange.to.toISOString())}
              </td>
            </tr>
          `;
        }
      }
    }

    // Add statistics if available
    if (this.statistics) {
      html += `
        <tr>
          <td colspan="10" style="padding: 10px; border: none;"></td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 12px; font-weight: bold;">
            THỐNG KÊ TỔNG QUAN:
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Tổng chứng chỉ: ${this.statistics.total_certificates}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Đã cấp: ${this.statistics.issued_certificates}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Hết hạn: ${this.statistics.expired_certificates}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Chờ cấp: ${this.statistics.pending_certificates}
          </td>
        </tr>
      `;
    }

    // Add spacing before table
    html += `
      <tr>
        <td colspan="10" style="padding: 20px; border: none;"></td>
      </tr>
    `;

    // Add table headers
    html += `
      <tr style="background-color: #f0f0f0;">
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Học viên</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Mã học viên</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Chứng chỉ</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Mã chứng chỉ</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Số chứng chỉ</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Ngày cấp</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Ngày hết hạn</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Trạng thái</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Lớp học</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Ghi chú</td>
      </tr>
    `;

    // Add data rows
    this.filteredCertificates.forEach(cert => {
      html += `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${cert.student_name || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${cert.student_code || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${cert.certificate_name || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${cert.certificate_code || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${cert.certificate_number || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${this.formatDate(cert.issued_date || '') || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${this.formatDate(cert.expiry_date || '') || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${cert.status || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${cert.class_name || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${cert.note || ''}</td>
        </tr>
      `;
    });

    html += '</table>';
    return html;
  }

}
