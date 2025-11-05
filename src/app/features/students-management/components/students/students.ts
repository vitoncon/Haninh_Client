import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { AvatarModule } from 'primeng/avatar';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import * as XLSX from 'xlsx';

import { StudentsModel, StudentFilters, StudentStatistics } from '../../models/students.model';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-students',
  standalone: true,
  templateUrl: './students.html',
  styleUrls: ['./students.scss'],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
    DrawerModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    CardModule,
    FileUploadModule,
    AvatarModule,
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
})
export class Students implements OnInit, OnDestroy {
  students: StudentsModel[] = [];
  filteredStudents: StudentsModel[] = [];
  selectedStudents: StudentsModel[] = [];
  formStudent: StudentsModel | null = null;
  drawerVisible = false;
  saving = false;
  loading = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  showAdvancedFilters: boolean = false;
  statistics: StudentStatistics | null = null;
  statsLoading: boolean = false;
  
  // RxJS subjects for better memory management
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

    // Advanced filters
    filters: StudentFilters = {
      gender: undefined,
      status: undefined,
      enrollment_date_from: undefined,
      enrollment_date_to: undefined,
      age_from: undefined,
      age_to: undefined,
      search: undefined
    };

  // Client-side caching
  private studentsCache: StudentsModel[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Các danh sách dùng cho <p-select>
  genderOptions = [
    { label: 'Nam', value: 'Nam' },
    { label: 'Nữ', value: 'Nữ' },
    { label: 'Khác', value: 'Khác' },
  ];

  statusOptions = [
    { label: 'Đang học', value: 'Đang học' },
    { label: 'Tạm dừng', value: 'Tạm dừng' },
    { label: 'Hoàn thành', value: 'Hoàn thành' },
    { label: 'Nghỉ học', value: 'Nghỉ học' },
  ];

  languageOptions = [
    { label: 'Tiếng Anh', value: 'Tiếng Anh' },
    { label: 'Tiếng Hàn', value: 'Tiếng Hàn' },
    { label: 'Tiếng Trung', value: 'Tiếng Trung' },
  ];

  levelOptions = [
    { label: 'A1 - Beginner', value: 'A1' },
    { label: 'A2 - Elementary', value: 'A2' },
    { label: 'B1 - Intermediate', value: 'B1' },
    { label: 'B2 - Upper Intermediate', value: 'B2' },
    { label: 'C1 - Advanced', value: 'C1' },
    { label: 'C2 - Proficiency', value: 'C2' },
  ];

  @ViewChild('dt', { static: false }) dt!: Table;

  constructor(
    private studentService: StudentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadStudents();
    this.setupSearchSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscription() {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchQuery = searchTerm;
      this.applyFilters();
    });
  }

  loadStatistics() {
    this.statsLoading = true;
    try {
      this.statistics = this.getStudentStatistics();
        this.statsLoading = false;
    } catch (error) {
        this.statsLoading = false;
      this.handleServiceError(error);
      }
  }

  private createEmptyStudent(): StudentsModel {
    // Tạo ngày hiện tại theo local time để tránh timezone offset
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    return {
      id: 0,
      student_code: this.generateStudentCode(),
      full_name: '',
      gender: 'Nam',
      date_of_birth: null,
      email: null,
      phone: null,
      address: null,
      enrollment_date: todayString,
      avatar_url: null,
      status: 'Đang học',
      note: null,
    };
  }

  /** Tự động tạo mã học viên - Logic tương tự generateTeacherCode() */
  private generateStudentCode(): string {
    const timestamp = Date.now().toString().slice(-6); // 6 chữ số cuối của timestamp
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // Số ngẫu nhiên 0-99
    return `HV${timestamp}${random}`; // Format: HV + 6 số timestamp + 2 số ngẫu nhiên
  }

  /** Validate mã học viên có trùng không */
  private validateStudentCode(code: string): boolean {
    return !this.students.some(student => 
      student.student_code === code && 
      (!this.formStudent || student.id !== this.formStudent.id)
    );
  }

  /** Format ngày tháng cho hiển thị (DD/MM/YYYY) - Xử lý timezone đúng */
  private formatDateForDisplay(dateValue: any): string {
    if (!dateValue) return '-';
    
    try {
      let date: Date;
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // Nếu là string ISO format (YYYY-MM-DD), parse trực tiếp
        if (dateValue.includes('-') && dateValue.length === 10) {
          const parts = dateValue.split('-');
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(parts[2], 10);
          date = new Date(year, month, day);
        } else {
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }
      
      // Format theo định dạng Việt Nam
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return dateValue?.toString() || '-';
    }
  }

  /** Format ngày tháng cho database (YYYY-MM-DD) - Xử lý timezone đúng */
  private formatDateForDatabase(dateValue: any): string | null {
    if (!dateValue) return null;
    
    try {
      let date: Date;
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // Xử lý trường hợp string date để tránh timezone offset
        if (dateValue.includes('/')) {
          // Format: dd/mm/yyyy hoặc dd/mm/yy
          const parts = dateValue.split('/');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          let year = parseInt(parts[2], 10);
          
          // Handle 2-digit year
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
          
          date = new Date(year, month, day);
        } else {
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }
      
      // Sử dụng local time để tránh timezone offset
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  }

  /** Tính tuổi từ ngày sinh - Xử lý timezone đúng */
  calculateAge(birthDate: string | null): number | null {
    if (!birthDate) return null;
    
    try {
      let birth: Date;
      
      if (typeof birthDate === 'string') {
        // Xử lý ISO format (YYYY-MM-DD)
        if (birthDate.includes('-') && birthDate.length === 10) {
          const parts = birthDate.split('-');
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          birth = new Date(year, month, day);
        } else {
          birth = new Date(birthDate);
        }
      } else {
        birth = new Date(birthDate);
      }
      
      const today = new Date();
      
      // Sử dụng local time để tính toán
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  }

  /** Kiểm tra ngày tháng hợp lệ */
  private isValidDate(dateValue: any): boolean {
    if (!dateValue) return false;
    
    try {
      let date: Date;
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // Xử lý các format khác nhau
        if (dateValue.includes('/')) {
          const parts = dateValue.split('/');
          if (parts.length !== 3) return false;
          
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
          
          date = new Date(year, month, day);
        } else {
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }
      
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /** So sánh hai ngày */
  private compareDates(date1: string | null, date2: string | null): number {
    if (!date1 || !date2) return 0;
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return d1.getTime() - d2.getTime();
    } catch {
      return 0;
    }
  }

  /** Xử lý lỗi từ service */
  private handleServiceError(error: any): void {
    console.error('Student Management Error:', error);
    
    let errorMessage = 'Đã xảy ra lỗi';
    
    if (error?.status === 401) {
      errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/auth/login')) {
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
    } else if (error?.status === 404) {
      errorMessage = 'Không tìm thấy endpoint';
    } else if (error?.status === 403) {
      errorMessage = 'Bạn không có quyền thực hiện thao tác này';
    } else if (error?.status === 500) {
      errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
    } else if (error?.error) {
      // Try to parse error message from server response
      if (typeof error.error === 'string') {
        try {
          const parsedError = JSON.parse(error.error);
          errorMessage = parsedError.message || parsedError.error || errorMessage;
        } catch {
          // If it's not JSON, use the string as is
          errorMessage = error.error;
        }
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: errorMessage,
      life: 5000
    });
  }

  /** Xử lý lỗi và hiển thị thông báo */
  private showErrorMessage(message: string, title: string = 'Lỗi'): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 4000
    });
  }

  /** Xử lý lỗi và hiển thị thông báo thành công */
  private showSuccessMessage(message: string, title: string = 'Thành công'): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 3000
    });
  }

  /** Xử lý lỗi và hiển thị cảnh báo */
  private showWarningMessage(message: string, title: string = 'Cảnh báo'): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: 4000
    });
  }

  /** Map database fields to model fields */
  private mapDatabaseToModel(dbStudent: any): StudentsModel {
    return {
      id: dbStudent.id,
      student_code: dbStudent.student_code,
      full_name: dbStudent.full_name,
      gender: dbStudent.gender,
      date_of_birth: dbStudent.date_of_birth,
      email: dbStudent.email,
      phone: dbStudent.phone,
      address: dbStudent.address,
      enrollment_date: dbStudent.enrollment_date,
      avatar_url: dbStudent.avatar_url,
      status: dbStudent.status === 'Tốt nghiệp' ? 'Hoàn thành' : dbStudent.status,
      note: dbStudent.note,
      created_at: dbStudent.created_at,
      updated_at: dbStudent.updated_at,
      is_deleted: dbStudent.is_deleted
    };
  }

  /** Xóa cache */
  private clearCache(): void {
    this.studentsCache = null;
    this.cacheTimestamp = 0;
  }

  /** Lấy chữ cái đầu của họ để làm avatar fallback */
  getLastNameInitial(fullName: string | null | undefined): string {
    if (!fullName || fullName.trim() === '') return '?';
    
    const nameParts = fullName.trim().split(' ');
    const lastName = nameParts[nameParts.length - 1];
    
    return lastName.charAt(0).toUpperCase();
  }

  /** Xử lý lỗi upload file */
  onFileUploadError(event: any) {
    console.error('File upload error:', event);
    
    // Custom error message in Vietnamese
    this.showErrorMessage('Kích thước tệp vượt quá giới hạn cho phép. Vui lòng chọn file nhỏ hơn 1MB.', 'Lỗi upload');
    
    // Override error message in DOM
    setTimeout(() => {
      this.overrideFileUploadText();
    }, 100);
  }

  /** Xử lý khi chọn file */
  onFileUploadSelect(event: any) {
    // Check if files are available (even if length shows 0, files might be in the object)
    let selectedFile = null;
    
    // Try multiple ways to get the file
    if (event.files && event.files.length > 0) {
      selectedFile = event.files[0];
    } else if (event.files && event.files.length === 0 && event.currentFiles && event.currentFiles.length > 0) {
      selectedFile = event.currentFiles[0];
    } else if (event.files && event.files.length === 0 && event.originalEvent && event.originalEvent.target && event.originalEvent.target.files && event.originalEvent.target.files.length > 0) {
      selectedFile = event.originalEvent.target.files[0];
    }
    
    if (selectedFile && this.formStudent) {
      // Convert file to base64 URL for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && this.formStudent) {
          this.formStudent.avatar_url = e.target.result as string;
        }
      };
      reader.readAsDataURL(selectedFile);
      
      // Update filename display
      this.updateFilenameDisplay(selectedFile.name);
    }
    
    // Override file upload text after file selection
    setTimeout(() => {
      this.overrideFileUploadText();
    }, 300);
    
    // Add clear button after file selection - thử nhiều lần với delay khác nhau
    setTimeout(() => {
      this.addClearButtonToFilename();
    }, 500);
  }

  /** Xử lý trước khi upload */
  onFileUploadBeforeUpload(event: any) {
    // This event fires when file is selected but before validation
    if (event.files && event.files.length > 0) {
      const file = event.files[0];
      
      // Force update filename display multiple times
      this.updateFilenameDisplay(file.name);
      
      // Override text after a short delay
      setTimeout(() => {
        this.overrideFileUploadText();
      }, 100);
    }
  }

  /** Cập nhật hiển thị tên file */
  private updateFilenameDisplay(fileName: string) {
    // Force update filename in file upload area
    const filenameElements = document.querySelectorAll('.p-fileupload .p-fileupload-filename, .p-fileupload-filename');
    
    filenameElements.forEach((element, index) => {
      // Always update filename elements in file upload
      element.textContent = fileName;
    });
    
    // Also try to find and update any text that shows "Chưa chọn tệp nào" in file upload area
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      const text = element.textContent?.trim();
      if (element.closest('.p-fileupload') && 
          (text === 'Chưa chọn tệp nào' || text === 'No file chosen')) {
        element.textContent = fileName;
      }
    });
  }

  /** Override text trong file upload component */
  private overrideFileUploadText() {
    // Only override "No file chosen" text in file upload components
    const filenameElements = document.querySelectorAll('.p-fileupload .p-fileupload-filename, .p-fileupload-filename');
    filenameElements.forEach(element => {
      const text = element.textContent?.trim();
      // Only replace if it's the default "No file chosen" text AND it's in file upload area
      if (text === 'No file chosen' && element.closest('.p-fileupload')) {
        element.textContent = 'Chưa chọn tệp nào';
      }
    });
    
    // Override error messages only in file upload components
    const errorElements = document.querySelectorAll('.p-fileupload .p-message');
    errorElements.forEach(element => {
      const text = element.textContent?.trim();
      if (text?.includes('Invalid file size') || text?.includes('maximum upload size')) {
        element.textContent = 'Kích thước tệp vượt quá giới hạn cho phép (1MB)';
      }
    });
    
    // Only target file upload components, NOT other parts of the app
    const fileUploadElements = document.querySelectorAll('.p-fileupload *');
    fileUploadElements.forEach(element => {
      const text = element.textContent?.trim();
      if (text === 'No file chosen' && element.closest('.p-fileupload')) {
        element.textContent = 'Chưa chọn tệp nào';
      }
      if (text?.includes('Invalid file size')) {
        element.textContent = element.textContent?.replace(/Invalid file size.*/, 'Kích thước tệp vượt quá giới hạn cho phép (1MB)') || '';
      }
    });
  }

  /** Thêm nút xóa file */
  private addClearButtonToFilename() {
    // Multiple selectors to find filename elements
    const selectors = [
      '.p-fileupload-basic-content span:not(button span):not(.p-button span)', // Chỉ lấy span không phải trong button
      '.p-fileupload-basic-content .ng-star-inserted:not(button)', // Chỉ lấy ng-star-inserted không phải button
      '.p-fileupload .ng-star-inserted:not(button)', 
      '.p-fileupload .p-fileupload-filename',
      '.p-fileupload-filename', 
      '.p-fileupload span:not(button span)',
      '.p-fileupload-content span:not(button span)',
      '.p-fileupload-buttonbar span:not(button span)',
      '.p-fileupload-content div:not(button)',
      '.p-fileupload div:not(button)'
    ];
    
    let filenameElements: NodeListOf<Element> | null = null;
    
    for (const selector of selectors) {
      filenameElements = document.querySelectorAll(selector);
      if (filenameElements && filenameElements.length > 0) {
        break;
      }
    }
    
    if (!filenameElements || filenameElements.length === 0) {
      return;
    }
    
    filenameElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const text = element.textContent?.trim();
      
      // Chỉ thêm nút xóa nếu element chứa tên file (có dấu chấm) và chưa có nút xóa
      if (text && text.includes('.') && !htmlElement.querySelector('.file-clear-btn')) {
        // Tạo nút xóa
        const clearBtn = document.createElement('button');
        clearBtn.className = 'file-clear-btn';
        clearBtn.innerHTML = '×';
        clearBtn.style.cssText = `
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          cursor: pointer;
          margin-left: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        `;
        
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.clearSelectedFile();
        });
        
        // Thêm nút xóa vào element
        htmlElement.appendChild(clearBtn);
        
        // Force layout cho container p-fileupload-basic-content
        const container = document.querySelector('.p-fileupload-basic-content') as HTMLElement;
        if (container) {
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.flexWrap = 'nowrap';
          container.style.gap = '8px';
        }
      }
    });
  }

  /** Xóa file đã chọn */
  clearSelectedFile() {
    // Reset form avatar
    if (this.formStudent) {
      this.formStudent.avatar_url = null;
    }
    
    // Remove all clear buttons
    const buttons = document.querySelectorAll('.p-fileupload button, .p-fileupload .p-button');
    buttons.forEach(button => {
      const clearButtons = button.querySelectorAll('.file-clear-btn');
      clearButtons.forEach(clearBtn => {
        clearBtn.remove();
      });
    });
    
    // Remove clear buttons from filename elements
    const filenameElements = document.querySelectorAll('.p-fileupload .file-clear-btn, .p-fileupload-basic-content .file-clear-btn');
    filenameElements.forEach(clearBtn => {
      clearBtn.remove();
    });
    
    // Reset tất cả filename elements về trạng thái ban đầu
    const allFilenameElements = document.querySelectorAll('.p-fileupload-basic-content span, .p-fileupload .p-fileupload-filename, .p-fileupload-filename');
    allFilenameElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const text = element.textContent?.trim();
      
      // Nếu element chứa tên file (có dấu chấm), reset về "Chưa chọn tệp nào"
      if (text && text.includes('.')) {
        element.textContent = 'Chưa chọn tệp nào';
      }
    });
    
    // Reset container styles
    const container = document.querySelector('.p-fileupload-basic-content') as HTMLElement;
    if (container) {
      container.style.display = '';
      container.style.alignItems = '';
      container.style.flexWrap = '';
      container.style.gap = '';
    }
    
    // Force reset PrimeNG file upload component
    setTimeout(() => {
      this.overrideFileUploadText();
    }, 100);
    
    // Hiển thị thông báo
    this.showSuccessMessage('Đã xóa file đã chọn', 'Thành công');
  }

  /** Kiểm tra cache có hợp lệ không */
  private isCacheValid(): boolean {
    const now = Date.now();
    return this.studentsCache !== null && (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /** Tính toán thống kê từ danh sách học sinh */
  private calculateStudentStatistics(students: StudentsModel[]): StudentStatistics {
    const total_students = students.length;
    const active_students = students.filter(s => s.status === 'Đang học').length;
    const inactive_students = students.filter(s => s.status === 'Tạm dừng').length;
    const graduated_students = students.filter(s => s.status === 'Hoàn thành').length;
    
    // Gender distribution
    const genderCount = students.reduce((acc, student) => {
      acc[student.gender] = (acc[student.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const gender_distribution = Object.entries(genderCount).map(([gender, count]) => ({ gender, count }));
    
    // Status distribution
    const statusCount = students.reduce((acc, student) => {
      acc[student.status] = (acc[student.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const status_distribution = Object.entries(statusCount).map(([status, count]) => ({ status, count }));
    
    // Calculate average age
    const ages = students
      .filter(s => s.date_of_birth)
      .map(s => {
        const age = this.calculateAge(s.date_of_birth || null);
        return age !== null ? age : 0;
      })
      .filter(age => age > 0);
    const average_age = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    return {
      total_students,
      active_students,
      inactive_students,
      graduated_students,
      gender_distribution,
      language_distribution: [], // Not used in current model
      level_distribution: [], // Not used in current model
      status_distribution,
      average_age,
      enrollment_by_month: [] // Not implemented yet
    };
  }

  /** Lấy thống kê học sinh */
  getStudentStatistics(): StudentStatistics {
    if (this.students && this.students.length > 0) {
      return this.calculateStudentStatistics(this.students);
    }
    
    // Return default statistics if no data
    return {
      total_students: 0,
      active_students: 0,
      inactive_students: 0,
      graduated_students: 0,
      gender_distribution: [],
      language_distribution: [],
      level_distribution: [],
      status_distribution: [],
      average_age: 0,
      enrollment_by_month: []
    };
  }

  loadStudents() {
    // Check cache first
    if (this.isCacheValid()) {
      this.students = [...this.studentsCache!];
      this.filteredStudents = [...this.students];
      this.applyFilters();
      this.loadStatistics();
      return;
    }

    this.loading = true;
    this.studentService.getStudents().subscribe({
      next: (response) => {
        const rawStudents = response?.data ?? response;
        if (Array.isArray(rawStudents)) {
          // Map database fields to model fields
          this.students = rawStudents.map((student: any) => this.mapDatabaseToModel(student));
        this.filteredStudents = [...this.students];
        this.applyFilters();
          
          // Update cache
          this.studentsCache = [...this.students];
          this.cacheTimestamp = Date.now();
          
        // Load statistics after students are loaded
        this.loadStatistics();
        } else {
          this.showErrorMessage('Định dạng dữ liệu không hợp lệ');
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.handleServiceError(error);
        this.cdr.detectChanges();
      }
    });
  }

  onCreate() {
    this.formStudent = this.createEmptyStudent();
    this.drawerVisible = true;
    
    // Override file upload text after drawer opens
    setTimeout(() => {
      this.overrideFileUploadText();
    }, 200);
  }

  /** Tạo mã học viên mới */
  generateNewStudentCode() {
    if (this.formStudent) {
      this.formStudent.student_code = this.generateStudentCode();
    }
  }

  /** Kiểm tra có đang ở chế độ edit không */
  isEditMode(): boolean {
    return !!(this.formStudent && this.formStudent.id && this.formStudent.id > 0);
  }

  onEdit(student: StudentsModel) {
    this.formStudent = { ...student };
    this.drawerVisible = true;
    
    // Override file upload text after drawer opens
    setTimeout(() => {
      this.overrideFileUploadText();
    }, 200);
  }

  onDelete(student: StudentsModel) {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa học viên <b>${student.full_name}</b>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        if (!student.id) {
          this.showErrorMessage('Không thể xóa học viên: ID không hợp lệ');
          return;
        }
        this.studentService.deleteStudent(student.id).subscribe({
          next: () => {
            this.clearCache(); // Clear cache after deleting
            this.loadStudents();
            this.showSuccessMessage(`Đã xóa học viên "${student.full_name}"`);
          },
          error: (error) => this.handleServiceError(error),
        });
      },
    });
  }

  onSave() {
    if (!this.formStudent) {
      this.showErrorMessage('Không tìm thấy dữ liệu form');
      return;
    }
    
    // Validation
    const validationErrors = this.validateStudent(this.formStudent);
    
    if (validationErrors.length > 0) {
      this.showWarningMessage(validationErrors.join(', '), 'Thông tin không hợp lệ');
      return;
    }

    this.saving = true;
    const done = () => (this.saving = false);

    // Xử lý ngày tháng trước khi gửi lên server
    const payload: any = {
      student_code: this.formStudent.student_code,
      full_name: this.formStudent.full_name,
      gender: this.formStudent.gender,
      date_of_birth: this.formatDateForDatabase(this.formStudent.date_of_birth || null),
      email: this.formStudent.email,
      phone: this.formStudent.phone,
      address: this.formStudent.address,
      enrollment_date: this.formatDateForDatabase(this.formStudent.enrollment_date || null),
      status: this.formStudent.status === 'Hoàn thành' ? 'Tốt nghiệp' : this.formStudent.status,
      note: this.formStudent.note,
      avatar_url: this.formStudent.avatar_url
    };

    if (this.formStudent && this.formStudent.id) {
      this.studentService
        .updateStudent(this.formStudent.id, { ...payload, id: this.formStudent.id })
        .subscribe({
          next: () => {
            this.clearCache(); // Clear cache after updating
            this.showSuccessMessage('Cập nhật học viên thành công');
            this.loadStudents();
            this.drawerVisible = false;
          },
          error: (error) => {
            this.handleServiceError(error);
          },
          complete: done,
        });
    } else {
      // Ensure payload includes required 'id' property for StudentsModel
      const newStudent: any = {
        ...payload,
        id: 0 // or undefined/null if your backend assigns the id
      };
      this.studentService.addStudent(newStudent).subscribe({
        next: () => {
          this.clearCache(); // Clear cache after adding
          this.showSuccessMessage('Thêm học viên thành công');
          this.loadStudents();
          this.drawerVisible = false;
        },
        error: (error) => {
          this.handleServiceError(error);
        },
        complete: done,
      });
    }
  }


  private validateStudent(student: StudentsModel): string[] {
    const errors: string[] = [];

    // Required fields
    if (!student.student_code?.trim()) {
      errors.push('Mã học viên là bắt buộc');
    } else if (student.student_code.length < 2) {
      errors.push('Mã học viên phải có ít nhất 2 ký tự');
    } else if (!this.isEditMode() && !this.validateStudentCode(student.student_code)) {
      // Chỉ validate trùng lặp khi tạo mới, không validate khi edit
      errors.push('Mã học viên đã tồn tại');
    }

    if (!student.full_name?.trim()) {
      errors.push('Họ tên là bắt buộc');
    } else if (student.full_name.length < 2) {
      errors.push('Họ tên phải có ít nhất 2 ký tự');
    }

    // Date validation
    if (student.date_of_birth && !this.isValidDate(student.date_of_birth)) {
      errors.push('Ngày sinh không hợp lệ');
    } else if (student.date_of_birth) {
      const age = this.calculateAge(student.date_of_birth);
      if (age !== null && (age < 5 || age > 100)) {
        errors.push('Tuổi phải từ 5 đến 100 tuổi');
      }
    }

    if (student.enrollment_date && !this.isValidDate(student.enrollment_date)) {
      errors.push('Ngày nhập học không hợp lệ');
    }

    // Email validation
    if (student.email && student.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(student.email)) {
        errors.push('Email không đúng định dạng');
      }
    }

    // Phone validation
    if (student.phone && student.phone.trim()) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(student.phone.replace(/\s/g, ''))) {
        errors.push('Số điện thoại phải có 10-11 chữ số');
      }
    }

    return errors;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onView(student: StudentsModel) {
    if (student.id) {
      this.router.navigate(['/features/students/detail', student.id]);
    }
  }

  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = (input?.value || '').trim();
    this.searchSubject$.next(value);
  }



  private advancedSearchInStudent(student: StudentsModel, searchTerms: string[]): boolean {
    const searchableFields = [
      student.student_code?.toLowerCase() || '',
      student.full_name?.toLowerCase() || '',
      student.gender?.toLowerCase() || '',
      student.phone?.toLowerCase() || '',
      student.email?.toLowerCase() || '',
      student.address?.toLowerCase() || '',
      student.status?.toLowerCase() || '',
      student.note?.toLowerCase() || '',
      (student.date_of_birth ? student.date_of_birth.toString().toLowerCase() : ''),
      (student.enrollment_date ? student.enrollment_date.toString().toLowerCase() : '')
    ];

    return searchTerms.every(term => 
      this.isTermMatched(term, searchableFields)
    );
  }

  private isTermMatched(term: string, fields: string[]): boolean {
    return fields.some(field => {
      if (field.includes(term)) return true;
      if (this.wordBoundaryMatch(field, term)) return true;
      if (this.numberMatch(field, term)) return true;
      
      return false;
    });
  }

  private wordBoundaryMatch(text: string, term: string): boolean {
    if (term.length < 2) return false;
    
    const words = text.split(/\s+/);
    return words.some(word => {
      if (word === term) return true;
      if (term.length >= 3 && word.startsWith(term)) return true;
      
      return false;
    });
  }

  private numberMatch(text: string, term: string): boolean {
    if (!/^\d+$/.test(term)) return false;
    
    const numbers = text.match(/\d+/g);
    if (!numbers) return false;
    
    return numbers.some(num => num === term || num.includes(term));
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  onTestClick() {
    // Test button clicked
  }

  // New methods for enhanced UI
  onSearch(event: any) {
    this.searchSubject$.next(event.target.value);
  }

  onFilterChange() {
    this.applyFilters();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onClearFilters() {
    this.searchQuery = '';
    this.filters = {
      gender: undefined,
      status: undefined,
      enrollment_date_from: undefined,
      enrollment_date_to: undefined,
      age_from: undefined,
      age_to: undefined,
      search: undefined
    };
    // Don't hide advanced filters panel, just clear the filters
    this.applyFilters();
  }


  private applyFilters() {
    let filtered = [...this.students];

    // Text search
    if (this.searchQuery?.trim()) {
      const searchTerms = this.searchQuery.toLowerCase().trim().split(/\s+/);
      filtered = filtered.filter(student => this.advancedSearchInStudent(student, searchTerms));
    }

    // Gender filter
    if (this.filters.gender) {
      filtered = filtered.filter(student => student.gender === this.filters.gender);
    }

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(student => student.status === this.filters.status);
    }

    // Removed language and level filters as they are managed in class_students table

    // Enrollment date range filter
    if (this.filters.enrollment_date_from || this.filters.enrollment_date_to) {
      filtered = filtered.filter(student => {
        if (!student.enrollment_date) return false;
        const enrollmentDate = new Date(student.enrollment_date);
        
        if (this.filters.enrollment_date_from) {
          const fromDate = new Date(this.filters.enrollment_date_from);
          if (enrollmentDate < fromDate) return false;
        }
        
        if (this.filters.enrollment_date_to) {
          const toDate = new Date(this.filters.enrollment_date_to);
          if (enrollmentDate > toDate) return false;
        }
        
        return true;
      });
    }

    // Age range filter
    if (this.filters.age_from || this.filters.age_to) {
      filtered = filtered.filter(student => {
        if (!student.date_of_birth) return false;
        
        const birthDate = new Date(student.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (this.filters.age_from && age < this.filters.age_from) return false;
        if (this.filters.age_to && age > this.filters.age_to) return false;
        
        return true;
      });
    }

    // Removed school filter as we focus only on language learning

    this.filteredStudents = filtered;
    this.updateClearButtonVisibility();
  }

  private updateClearButtonVisibility() {
    this.showClearButton = !!(this.searchQuery?.trim() || 
      this.filters.gender || 
      this.filters.status || 
      this.filters.enrollment_date_from ||
      this.filters.enrollment_date_to ||
      this.filters.age_from ||
      this.filters.age_to);
  }

  forceRefresh() {
    this.clearCache(); // Clear cache to force fresh data
    
    // Reset all filters and search to initial state
    this.searchQuery = '';
    this.filters = {
      gender: undefined,
      status: undefined,
      enrollment_date_from: undefined,
      enrollment_date_to: undefined,
      age_from: undefined,
      age_to: undefined,
      search: undefined
    };
    this.showAdvancedFilters = false;
    this.showClearButton = false;
    
    // Reset table sorting to default state
    if (this.dt) {
      this.dt.sortField = null;
      this.dt.sortOrder = 1;
      // Clear any active sorting and reset to original order
      setTimeout(() => {
        this.dt.clear();
        // Force table to refresh its display
        this.cdr.detectChanges();
      }, 0);
    }
    
    // Trigger search update to clear any pending search
    this.searchSubject$.next('');
    
    // Reload data
    this.loadStudents(); // loadStudents() already calls loadStatistics()
  }

  exportToExcel(): void {
    if (this.filteredStudents.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không có dữ liệu để xuất'
      });
      return;
    }

    const htmlContent = this.generateHTMLReport();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const workbook = XLSX.utils.table_to_book(tempDiv.querySelector('table'), {
      sheet: 'Danh sách học viên'
    });

    const worksheet = workbook.Sheets['Danh sách học viên'];
    worksheet['!cols'] = [
      { wch: 15 }, // Mã học viên
      { wch: 20 }, // Họ tên
      { wch: 12 }, // Giới tính
      { wch: 15 }, // Ngày sinh
      { wch: 15 }, // Số điện thoại
      { wch: 25 }, // Email
      { wch: 30 }, // Địa chỉ
      { wch: 15 }, // Ngày nhập học
      { wch: 12 }, // Trạng thái
      { wch: 25 }  // Ghi chú
    ];

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `danh_sach_hoc_vien_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, filename);

    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Đã xuất ${this.filteredStudents.length} học viên ra file Excel`
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
            BÁO CÁO DANH SÁCH HỌC VIÊN
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
            Tổng số học viên: ${this.filteredStudents.length}
          </td>
        </tr>
    `;

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
            - Tổng học viên: ${this.statistics.total_students}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Đang học: ${this.statistics.active_students}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Tạm dừng: ${this.statistics.inactive_students}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Hoàn thành: ${this.statistics.graduated_students}
          </td>
        </tr>
      `;
    }

    html += `
        <tr>
          <td colspan="10" style="padding: 10px; border: none;"></td>
        </tr>
        <tr style="background-color: #f5f5f5; font-weight: bold;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Mã HV</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Họ tên</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Giới tính</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ngày sinh</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Số điện thoại</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Email</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Địa chỉ</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ngày nhập học</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Trạng thái</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ghi chú</td>
        </tr>
    `;

    this.filteredStudents.forEach((student, index) => {
      const rowStyle = index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9f9f9;';
      html += `
        <tr style="${rowStyle}">
          <td style="border: 1px solid #ddd; padding: 8px;">${student.student_code || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.full_name || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.gender || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.date_of_birth ? this.formatDateForDisplay(student.date_of_birth) : '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.phone || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.email || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.address || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.enrollment_date ? this.formatDateForDisplay(student.enrollment_date) : '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.status || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.note || '-'}</td>
        </tr>
      `;
    });

    html += `
      </table>
    `;

    return html;
  }


  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    switch (status) {
      case 'Đang học': return 'success';
      case 'Tạm dừng': return 'warn';
      case 'Hoàn thành': return 'info';
      case 'Nghỉ học': return 'danger';
      default: return 'secondary';
    }
  }

  formatDate(dateString: string | null): string {
    return this.formatDateForDisplay(dateString);
  }

  onDrawerHide() {
    this.drawerVisible = false;
    this.formStudent = null;
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.status || this.filters.gender || 
              this.filters.enrollment_date_from || this.filters.enrollment_date_to ||
              this.filters.age_from || this.filters.age_to);
  }
}
