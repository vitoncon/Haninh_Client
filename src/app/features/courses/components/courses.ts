import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-certificates',
  standalone: true,
  templateUrl: './certificates.html',
  styleUrls: ['./certificates.scss'],
  imports: [
    CommonModule,
    FormsModule,

    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    ToastModule,
    ConfirmDialogModule,
    DrawerModule,
    MultiSelectModule
  ]
})
export class CertificatesComponent implements OnInit {

  // ===== STATE =====
  loading = false;
  saving = false;

  searchQuery = '';
  drawerVisible = false;
  isEditMode = false;

  // ===== DATA =====
  certificates: any[] = [];
  filteredCertificates: any[] = [];

  statistics: any = null;

  // ===== FORM / FILTER =====
  formCertificate: any = null;

  selectedClassFilter: any = null;
  selectedExpiryFilter: any = null;

  customDateRange = {
    from: null,
    to: null
  };

  // ===== SELECT OPTIONS (mock) =====
  availableClasses = [
    { label: 'English Giao Tiếp K01', value: 1 },
    { label: 'TOPIK I K02', value: 2 },
    { label: 'HSK 2 K01', value: 3 }
  ];

  availableCertificateTypes = [
    { label: 'Chứng chỉ Tiếng Anh', value: 1 },
    { label: 'Chứng chỉ Tiếng Hàn', value: 2 },
    { label: 'Chứng chỉ Tiếng Trung', value: 3 }
  ];

  availableStudentsInClass = [
    { label: 'Nguyễn Văn An', value: 1 },
    { label: 'Trần Thị Mai', value: 2 },
    { label: 'Lê Minh Hoàng', value: 3 }
  ];

  certificateStatusOptions = [
    { label: 'Đã cấp', value: 'Đã cấp' },
    { label: 'Chờ cấp', value: 'Chờ cấp' }
  ];

  expirySearchOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Đã hết hạn', value: 'expired' },
    { label: 'Còn hạn', value: 'valid' },
    { label: 'Tùy chọn', value: 'custom_range' }
  ];

  selectedClassId: number | null = null;
  selectedStudentIds: number[] = [];

  currentCertificateTypeDetails: any = null;

  vi = {
    selectedItems: 'học viên'
  };

  // ===== INIT =====
  ngOnInit(): void {
    this.certificates = [
      {
        id: 1,
        student_id: 1,
        student_name: 'Nguyễn Văn An',
        student_code: 'HV001',
        class_id: 1,
        class_name: 'English Giao Tiếp K01',
        certificate_id: 1,
        certificate_name: 'Chứng chỉ Tiếng Anh Giao Tiếp',
        certificate_code: 'ENG-COM',
        certificate_number: 'ENG-2024-001',
        issued_date: '2024-06-01',
        expiry_date: '2025-06-01',
        is_permanent: 0,
        status: 'Đã cấp'
      },
      {
        id: 2,
        student_id: 2,
        student_name: 'Trần Thị Mai',
        student_code: 'HV002',
        class_id: 2,
        class_name: 'TOPIK I K02',
        certificate_id: 2,
        certificate_name: 'Chứng chỉ Tiếng Hàn TOPIK I',
        certificate_code: 'KOR-TOPIK1',
        certificate_number: 'KOR-2024-015',
        issued_date: '2024-07-15',
        expiry_date: null,
        is_permanent: 1,
        status: 'Đã cấp'
      },
      {
        id: 3,
        student_id: 3,
        student_name: 'Lê Minh Hoàng',
        student_code: 'HV003',
        class_id: 3,
        class_name: 'HSK 2 K01',
        certificate_id: 3,
        certificate_name: 'Chứng chỉ Tiếng Trung HSK 2',
        certificate_code: 'CHI-HSK2',
        certificate_number: 'CHI-2024-021',
        issued_date: '2024-08-01',
        expiry_date: '2024-12-01',
        is_permanent: 0,
        status: 'Chờ cấp'
      }
    ];

    this.filteredCertificates = [...this.certificates];

    this.statistics = {
      total_certificates: this.certificates.length,
      issued_certificates: this.certificates.filter(c => c.status === 'Đã cấp').length,
      expired_certificates: this.certificates.filter(
        c => c.expiry_date && new Date(c.expiry_date) < new Date()
      ).length,
      pending_certificates: this.certificates.filter(c => c.status === 'Chờ cấp').length
    };
  }

  // ===== TABLE / SEARCH =====
  onSearch(event: any) {
    const value = event.target.value.toLowerCase();
    this.filteredCertificates = this.certificates.filter(c =>
      c.student_name.toLowerCase().includes(value) ||
      c.certificate_name.toLowerCase().includes(value) ||
      c.certificate_number.toLowerCase().includes(value)
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredCertificates = [...this.certificates];
  }

  // ===== HELPERS =====
  formatDate(date: string) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  isCertificateExpired(date: string) {
    return new Date(date) < new Date();
  }

  getDaysUntilExpiry(date: string) {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getStatusSeverity(status: string) {
    switch (status) {
      case 'Đã cấp': return 'success';
      case 'Chờ cấp': return 'warning';
      default: return 'info';
    }
  }

  isPermanentToString(value: number) {
    return value === 1 ? 'Vĩnh viễn' : 'Có thời hạn';
  }

  // ===== ACTIONS =====
  openNew() {
    this.isEditMode = false;
    this.formCertificate = {
      issued_date: new Date(),
      status: 'Chờ cấp'
    };
    this.drawerVisible = true;
  }

  editCertificate(cert: any) {
    this.isEditMode = true;
    this.formCertificate = { ...cert };
    this.drawerVisible = true;
  }

  deleteCertificate(_: any) {}

  cancelEdit() {
    this.drawerVisible = false;
    this.formCertificate = null;
  }

  saveCertificate() {
    this.drawerVisible = false;
  }

  forceRefresh() {}
  exportToCSV() {}

  onClassFilterChange() {}
  onExpiryFilterChange() {}
  clearExpiryFilter() {}

  onClassSelectionChange(_: any) {}
  onStudentSelectionChange(_: any) {}
  onCertificateTypeChange(_: any) {}
  onIssuedDateChange() {}

  canSave() {
    return true;
  }

  getSaveButtonLabel() {
    return this.isEditMode ? 'Cập nhật' : 'Lưu';
  }

  getCertificateNumberDisplay() {
    return this.formCertificate?.certificate_number || '';
  }
}
