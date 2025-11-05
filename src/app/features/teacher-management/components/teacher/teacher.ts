import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { AvatarModule } from 'primeng/avatar';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import * as XLSX from 'xlsx';

import { TeacherModel, TeacherFilters, TeacherStatistics } from '../../models/teacher.model';
import { TeacherService } from '../../services/teacher.service';


@Component({
  selector: 'app-teacher',
  standalone: true,
  templateUrl: './teacher.html',
  styleUrls: ['./teacher.scss'],
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
    ProgressSpinnerModule,
    CardModule,
    CheckboxModule,
    FileUploadModule,
    AvatarModule
  ],
  providers: [MessageService, ConfirmationService],
})
export class Teacher implements OnInit, OnDestroy {
  teachers: TeacherModel[] = [];
  filteredTeachers: TeacherModel[] = [];
  selectedTeachers: TeacherModel[] = [];
  formTeacher: TeacherModel | null = null;
  drawerVisible = false;
  saving = false;
  loading = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  showAdvancedFilters: boolean = false;
  statistics: TeacherStatistics | null = null;
  statsLoading: boolean = false;
  
  // RxJS subjects for better memory management
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Advanced filters
  filters: TeacherFilters = {
    department: undefined,
    status: undefined,
    degree: undefined,
    minExperience: undefined,
    maxExperience: undefined,
    contractType: undefined,
    hireDateFrom: undefined,
    hireDateTo: undefined,
    search: undefined
  };

  // Dropdown options - will be populated from service
  genderOptions: any[] = [];
  degreeOptions: any[] = [];
  statusOptions: any[] = [];
  departmentOptions: any[] = [];
  contractTypeOptions: any[] = [];
  languageOptions: any[] = [];
  specializationOptions: any[] = [];


  @ViewChild('dt', { static: false }) dt!: Table;

  constructor(
    private teacherService: TeacherService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeSearchSubscription();
    this.loadTeachers();
    this.loadDropdownData();
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

  private loadDropdownData(): void {
    // Load gender options
    this.genderOptions = [
      { label: 'Nam', value: 'Nam' },
      { label: 'Nữ', value: 'Nữ' }
    ];

    // Load degree options
    this.degreeOptions = [
      { label: 'Cử nhân', value: 'Cử nhân' },
      { label: 'Thạc sĩ', value: 'Thạc sĩ' },
      { label: 'Tiến sĩ', value: 'Tiến sĩ' },
      { label: 'Giáo sư', value: 'Giáo sư' },
      { label: 'Khác', value: 'Khác' }
    ];

    // Load status options
    this.statusOptions = [
      { label: 'Đang dạy', value: 'Đang dạy' },
      { label: 'Tạm nghỉ', value: 'Tạm nghỉ' },
      { label: 'Đã nghỉ', value: 'Đã nghỉ' }
    ];

    // Load contract type options
    this.contractTypeOptions = [
      { label: 'Hợp đồng dài hạn', value: 'Hợp đồng dài hạn' },
      { label: 'Hợp đồng ngắn hạn', value: 'Hợp đồng ngắn hạn' },
      { label: 'Thời vụ', value: 'Thời vụ' },
      { label: 'Cộng tác viên', value: 'Cộng tác viên' }
    ];

    // Load language options - phù hợp với trung tâm ngoại ngữ
    this.languageOptions = [
      { label: 'Tiếng Anh', value: 'Tiếng Anh' },
      { label: 'Tiếng Trung', value: 'Tiếng Trung' },
      { label: 'Tiếng Hàn', value: 'Tiếng Hàn' }
    ];

    // Load department options - phù hợp với trung tâm ngoại ngữ
    this.departmentOptions = [
      // Các bộ môn ngôn ngữ
      { label: 'Tiếng Anh', value: 'Tiếng Anh' },
      { label: 'Tiếng Trung', value: 'Tiếng Trung' },
      { label: 'Tiếng Hàn', value: 'Tiếng Hàn' },
      // Các vị trí đặc biệt
      { label: 'Giáo viên chủ nhiệm', value: 'Giáo viên chủ nhiệm' },
      { label: 'Trợ giảng', value: 'Trợ giảng' },
      { label: 'Giáo viên bán thời gian', value: 'Giáo viên bán thời gian' },
      { label: 'Giáo viên toàn thời gian', value: 'Giáo viên toàn thời gian' }
    ];

    // Load specialization options - để trống vì không cần thiết cho trung tâm ngoại ngữ
    this.specializationOptions = [];
  }

  private loadStatistics(): void {
    this.statsLoading = true;
    this.teacherService.getTeacherStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.statsLoading = false;
      },
      error: (error) => {
        console.error('Failed to load statistics:', error);
        this.statsLoading = false;
      }
    });
  }

  private createEmptyTeacher(): TeacherModel {
    return {
      teacher_code: this.teacherService.generateTeacherCode(),
      teacher_name: '',
      gender: 'Nam',
      dob: null,
      phone: null,
      email: null,
      address: null,
      department: null,
      specialization: null,
      experience_years: undefined,
      degree: 'Cử nhân',
      status: 'Đang dạy',
      note: null,
      // Các trường mới - sẽ có sau khi chạy migration
      avatar_url: null,
      salary: null,
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: null,
      teaching_hours_per_week: null,
      languages: null,
      certifications: null
    };
  }

  loadTeachers(applyFilters: boolean = true) {
    this.loading = true;
    // Load all teachers without filters for client-side filtering
    this.teacherService.getTeachers({}).subscribe({
      next: (data) => {
        this.teachers = Array.isArray(data) ? data : [];
        // Apply current filters to the loaded data only if requested
        if (applyFilters) {
          this.performSearch(this.searchQuery);
        } else {
          this.filteredTeachers = [...this.teachers];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách giảng viên',
        });
        this.cdr.detectChanges();
      }
    });
  }

  // Method for complete refresh - reset all filters and reload data
  forceRefresh(): void {
    // Reset all search and filter states
    this.searchQuery = '';
    this.showClearButton = false;
    this.showAdvancedFilters = false;
    
    // Reset all filters to initial state
    this.filters = {
      department: undefined,
      status: undefined,
      degree: undefined,
      minExperience: undefined,
      maxExperience: undefined,
      contractType: undefined,
      hireDateFrom: undefined,
      hireDateTo: undefined,
      search: undefined
    };

    // Reload data from server without applying any filters
    this.loadTeachers(false);
    
    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã làm mới danh sách giảng viên'
    });
  }

  onCreate() {
    try {
      this.formTeacher = this.createEmptyTeacher();
      this.drawerVisible = true;
      
      // Override file upload text after drawer opens
      setTimeout(() => {
        this.overrideFileUploadText();
      }, 200);
    } catch (error) {
      console.error('Error creating new teacher form:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tạo form thêm giảng viên mới'
      });
    }
  }

  onEdit(teacher: TeacherModel) {
    if (!teacher) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không có dữ liệu giảng viên để chỉnh sửa'
      });
      return;
    }

    try {
      // Deep copy to avoid reference issues
      this.formTeacher = JSON.parse(JSON.stringify(teacher));
      this.drawerVisible = true;
      
      // Override file upload text after drawer opens
      setTimeout(() => {
        this.overrideFileUploadText();
      }, 200);
    } catch (error) {
      console.error('Error copying teacher data for edit:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải dữ liệu giảng viên để chỉnh sửa'
      });
    }
  }

  onDelete(teacher: TeacherModel) {
    if (!teacher.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa giảng viên: ID không hợp lệ'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa giảng viên <b>${teacher.teacher_name}</b>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.teacherService.deleteTeacher(teacher.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã xóa giảng viên "${teacher.teacher_name}"`,
            });
            
            // Reload data after successful deletion
            this.loadTeachers();
            this.loadStatistics();
          },
          error: (error) => {
            console.error('Delete teacher error:', error);
            
            let errorMessage = 'Không thể xóa giảng viên';
            
            if (error.error?.message) {
              errorMessage += ': ' + error.error.message;
            } else if (error.error?.error) {
              errorMessage += ': ' + error.error.error;
            } else if (error.message) {
              errorMessage += ': ' + error.message;
            }
            
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: errorMessage,
            });
          },
        });
      },
    });
  }

  onSave() {
    if (!this.formTeacher) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không có dữ liệu giảng viên để lưu'
      });
      return;
    }

    // Validate teacher data
    const validationErrors = this.validateTeacher(this.formTeacher);
    if (validationErrors.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Lỗi validation',
        detail: validationErrors.join(', ')
      });
      return;
    }

    this.saving = true;
    const isEditMode = this.formTeacher.id && this.formTeacher.id > 0;

    // Clean and prepare data before sending
    const cleanedTeacher = this.cleanTeacherData(this.formTeacher);
    
    // Format dates before sending to server
    if (cleanedTeacher.dob) {
      cleanedTeacher.dob = this.formatDate(cleanedTeacher.dob);
    }
    if (cleanedTeacher.hire_date) {
      cleanedTeacher.hire_date = this.formatDate(cleanedTeacher.hire_date);
    }

    const operation = isEditMode
      ? this.teacherService.updateTeacher(this.formTeacher.id!, cleanedTeacher)
      : this.teacherService.addTeacher(cleanedTeacher);

    operation.subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: isEditMode ? 'Cập nhật giảng viên thành công' : 'Thêm giảng viên thành công',
        });
        
        // Reload data after successful operation
        this.loadTeachers();
        this.loadStatistics();
        this.drawerVisible = false;
        this.saving = false;
      },
      error: (error) => {
        console.error('Save teacher error:', error);
        
        let errorMessage = isEditMode ? 'Không thể cập nhật giảng viên' : 'Không thể thêm giảng viên';
        
        if (error.error?.message) {
          errorMessage += ': ' + error.error.message;
        } else if (error.error?.error) {
          errorMessage += ': ' + error.error.error;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: errorMessage,
        });
        this.saving = false;
      }
    });
  }

  private validateTeacher(teacher: TeacherModel): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (!teacher.teacher_code || teacher.teacher_code.trim() === '') {
      errors.push('Vui lòng nhập mã giảng viên');
    } else if (teacher.teacher_code.trim().length < 2) {
      errors.push('Mã giảng viên phải có ít nhất 2 ký tự');
    }

    if (!teacher.teacher_name || teacher.teacher_name.trim() === '') {
      errors.push('Vui lòng nhập tên giảng viên');
    } else if (teacher.teacher_name.trim().length < 2) {
      errors.push('Tên giảng viên phải có ít nhất 2 ký tự');
    }

    // Email validation
    if (teacher.email && teacher.email.trim() !== '') {
      if (!this.isValidEmail(teacher.email.trim())) {
        errors.push('Email không hợp lệ');
      }
    }

    // Phone validation
    if (teacher.phone && teacher.phone.trim() !== '') {
      if (!this.isValidPhone(teacher.phone.trim())) {
        errors.push('Số điện thoại phải có 10-11 chữ số');
      }
    }

    // Numeric fields validation
    if (teacher.experience_years !== undefined && teacher.experience_years !== null) {
      if (teacher.experience_years < 0) {
        errors.push('Số năm kinh nghiệm không được âm');
      } else if (teacher.experience_years > 50) {
        errors.push('Số năm kinh nghiệm không được quá 50 năm');
      }
    }

    if (teacher.salary !== undefined && teacher.salary !== null) {
      if (teacher.salary < 0) {
        errors.push('Lương không được âm');
      } else if (teacher.salary > 1000000000) { // 1 billion VND
        errors.push('Lương không được quá 1 tỷ VND');
      }
    }

    if (teacher.teaching_hours_per_week !== undefined && teacher.teaching_hours_per_week !== null) {
      if (teacher.teaching_hours_per_week < 0) {
        errors.push('Số giờ dạy/tuần không được âm');
      } else if (teacher.teaching_hours_per_week > 60) {
        errors.push('Số giờ dạy/tuần không được quá 60 giờ');
      }
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private cleanTeacherData(teacher: TeacherModel): TeacherModel {
    // Create a copy to avoid modifying the original
    const cleaned = { ...teacher };
    
    // Clean string fields - trim whitespace and handle empty strings
    if (cleaned.teacher_code) cleaned.teacher_code = cleaned.teacher_code.trim();
    if (cleaned.teacher_name) cleaned.teacher_name = cleaned.teacher_name.trim();
    if (cleaned.email) cleaned.email = cleaned.email.trim();
    if (cleaned.phone) cleaned.phone = cleaned.phone.trim();
    if (cleaned.address) cleaned.address = cleaned.address.trim();
    if (cleaned.department) cleaned.department = cleaned.department.trim();
    if (cleaned.specialization) cleaned.specialization = cleaned.specialization.trim();
    if (cleaned.languages) cleaned.languages = cleaned.languages.trim();
    if (cleaned.certifications) cleaned.certifications = cleaned.certifications.trim();
    if (cleaned.note) cleaned.note = cleaned.note.trim();
    
    // Convert empty strings to null for optional fields
    if (cleaned.email === '') cleaned.email = null;
    if (cleaned.phone === '') cleaned.phone = null;
    if (cleaned.address === '') cleaned.address = null;
    if (cleaned.department === '') cleaned.department = null;
    if (cleaned.specialization === '') cleaned.specialization = null;
    if (cleaned.languages === '') cleaned.languages = null;
    if (cleaned.certifications === '') cleaned.certifications = null;
    if (cleaned.note === '') cleaned.note = null;
    
    // Ensure numeric fields are properly handled
    if (cleaned.experience_years === undefined || cleaned.experience_years === null) {
      cleaned.experience_years = undefined;
    }
    if (cleaned.salary === undefined || cleaned.salary === null) {
      cleaned.salary = null;
    }
    if (cleaned.teaching_hours_per_week === undefined || cleaned.teaching_hours_per_week === null) {
      cleaned.teaching_hours_per_week = null;
    }
    
    return cleaned;
  }

  onDrawerHide() {
    this.formTeacher = null;
    this.drawerVisible = false;
  }

  // Check if we're in edit mode
  isEditMode(): boolean {
    return !!(this.formTeacher && this.formTeacher.id);
  }

  // Generate new teacher code
  generateNewCode(): void {
    if (this.formTeacher) {
      this.formTeacher.teacher_code = this.teacherService.generateTeacherCode();
    }
  }

  onFileUploadError(event: any) {
    console.error('File upload error:', event);
    
    // Custom error message in Vietnamese
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi upload',
      detail: 'Kích thước tệp vượt quá giới hạn cho phép. Vui lòng chọn file nhỏ hơn 1MB.'
    });
    
    // Override error message in DOM
    setTimeout(() => {
      this.overrideFileUploadText();
    }, 100);
  }

  onFileUploadSelect(event: any) {
    // Check if files are available (even if length shows 0, files might be in the object)
    let selectedFile = null;
    
    // Try multiple ways to get the file
    if (event.files && event.files.length > 0) {
      selectedFile = event.files[0];
    } else if (event.files && event.files[0]) {
      selectedFile = event.files[0];
    } else if (event.originalEvent && event.originalEvent.target && event.originalEvent.target.files) {
      selectedFile = event.originalEvent.target.files[0];
    }
    
    if (selectedFile) {
      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã chọn file: ${selectedFile.name}`
      });
      
      // Force update filename display multiple times
      this.updateFileNameDisplay(selectedFile.name);
      
      // Try multiple times with different delays
      setTimeout(() => {
        this.updateFileNameDisplay(selectedFile.name);
      }, 50);
      
      setTimeout(() => {
        this.updateFileNameDisplay(selectedFile.name);
      }, 100);
      
      setTimeout(() => {
        this.updateFileNameDisplay(selectedFile.name);
      }, 200);
    }
    
    // Override text after file selection
    setTimeout(() => {
      this.overrideFileUploadText();
    }, 300);
    
    // Add clear button after file selection - thử nhiều lần với delay khác nhau
    setTimeout(() => {
      this.addClearButtonToFilename();
    }, 400);
    
    setTimeout(() => {
      this.addClearButtonToFilename();
    }, 800);
    
    setTimeout(() => {
      this.addClearButtonToFilename();
    }, 1200);
  }


  onFileUploadBeforeUpload(event: any) {
    // This event fires when file is selected but before validation
    if (event.files && event.files.length > 0) {
      const file = event.files[0];
      
      // Force update filename display multiple times
      this.updateFileNameDisplay(file.name);
      
      // Try multiple times with different delays
      setTimeout(() => {
        this.updateFileNameDisplay(file.name);
      }, 50);
      
      setTimeout(() => {
        this.updateFileNameDisplay(file.name);
      }, 100);
      
      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã chọn file: ${file.name}`
      });
    }
  }

  private updateFileNameDisplay(fileName: string) {
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

  private addClearButtonToFilename() {
    
    // Thử nhiều selector khác nhau để tìm element chứa tên file
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
      if (filenameElements.length > 0) break;
    }
    
    if (!filenameElements || filenameElements.length === 0) {
      return;
    }
    
    filenameElements.forEach((element, index) => {
      const text = element.textContent?.trim();
      
      // Kiểm tra nếu element chứa tên file thực tế và chưa có nút xóa
      // Loại trừ button và chỉ lấy element chứa tên file
      if (text && 
          text !== 'Chưa chọn tệp nào' && 
          text !== 'No file chosen' && 
          text !== 'Chọn hình' &&
          !text.includes('×') && 
          !element.querySelector('.file-clear-btn') &&
          !element.closest('button') &&
          element.tagName !== 'BUTTON' &&
          text.includes('.')) { // Chỉ lấy element có extension file
        
        // Tạo nút X đơn giản
        const clearBtn = document.createElement('span');
        clearBtn.className = 'file-clear-btn';
        clearBtn.innerHTML = ' ×';
        clearBtn.style.cssText = `
          color: #ef4444 !important;
          cursor: pointer !important;
          font-weight: bold !important;
          margin-left: 8px !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          transition: background-color 0.2s !important;
          display: inline !important;
          font-size: 14px !important;
          vertical-align: baseline !important;
          line-height: 1 !important;
          white-space: nowrap !important;
        `;
        
        clearBtn.addEventListener('mouseenter', () => {
          clearBtn.style.backgroundColor = '#fee2e2';
        });
        
        clearBtn.addEventListener('mouseleave', () => {
          clearBtn.style.backgroundColor = 'transparent';
        });
        
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clearSelectedFile();
        });
        
        // Force inline layout cho element chứa tên file
        const htmlElement = element as HTMLElement;
        htmlElement.style.display = 'inline-flex';
        htmlElement.style.whiteSpace = 'nowrap';
        htmlElement.style.alignItems = 'center';
        
        // Force layout cho container p-fileupload-basic-content
        const container = document.querySelector('.p-fileupload-basic-content') as HTMLElement;
        if (container) {
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.flexWrap = 'nowrap';
          container.style.gap = '8px';
        }
        
        // Thêm nút X vào element chứa tên file
        element.appendChild(clearBtn);
        
        // Đảm bảo không có nút X nào trong button
        this.removeClearButtonFromButtons();
      }
    });
  }

  private removeClearButtonFromButtons() {
    // Tìm và xóa tất cả nút X trong button
    const buttons = document.querySelectorAll('.p-fileupload button, .p-fileupload .p-button');
    buttons.forEach(button => {
      const clearButtons = button.querySelectorAll('.file-clear-btn');
      clearButtons.forEach(clearBtn => {
        clearBtn.remove();
      });
    });
  }

  clearSelectedFile() {
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Xóa tất cả nút X khỏi filename elements
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
      if (text && text.includes('.') && !text.includes('×')) {
        htmlElement.textContent = 'Chưa chọn tệp nào';
        htmlElement.style.display = '';
        htmlElement.style.whiteSpace = '';
        htmlElement.style.alignItems = '';
      }
    });
    
    // Reset container layout
    const container = document.querySelector('.p-fileupload-basic-content') as HTMLElement;
    if (container) {
      container.style.display = '';
      container.style.alignItems = '';
      container.style.flexWrap = '';
      container.style.gap = '';
    }
    
    // Tận dụng method updateFileNameDisplay để reset hiển thị
    this.updateFileNameDisplay('Chưa chọn tệp nào');
    
    // Force reset PrimeNG file upload component
    setTimeout(() => {
      this.overrideFileUploadText();
    }, 100);
    
    // Hiển thị thông báo
    this.messageService.add({
      severity: 'info',
      summary: 'Đã xóa',
      detail: 'Đã xóa file đã chọn'
    });
  }

  onView(teacher: TeacherModel) {
    if (teacher.id) {
      this.router.navigate(['/features/teacher/detail', teacher.id]);
    }
  }

  // New methods for enhanced functionality
  onSearch(event: any): void {
    const query = event.target.value || '';
    this.searchQuery = query;
    this.showClearButton = query.length > 0;
    
    // Trigger search with debounce
    this.searchSubject$.next(query);
  }

  private performSearch(query: string): void {
    let filteredData = [...this.teachers];
    
    // Apply text search filter
    const trimmedQuery = query.trim();
    if (trimmedQuery.length > 0) {
      filteredData = filteredData.filter(teacher => {
        const searchTerm = trimmedQuery.toLowerCase();
        
        return (
          teacher.teacher_code?.toLowerCase().includes(searchTerm) ||
          teacher.teacher_name?.toLowerCase().includes(searchTerm) ||
          teacher.email?.toLowerCase().includes(searchTerm) ||
          teacher.degree?.toLowerCase().includes(searchTerm) ||
          teacher.status?.toLowerCase().includes(searchTerm) ||
          teacher.phone?.toLowerCase().includes(searchTerm) ||
          teacher.address?.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Apply other filters
    filteredData = this.applyFilters(filteredData);
    
    this.filteredTeachers = filteredData;
    this.cdr.detectChanges();
  }

  private applyFilters(teachers: TeacherModel[]): TeacherModel[] {
    let filteredData = [...teachers];

    // Apply department filter
    if (this.filters.department) {
      filteredData = filteredData.filter(teacher => 
        teacher.department === this.filters.department
      );
    }

    // Apply status filter
    if (this.filters.status) {
      filteredData = filteredData.filter(teacher => 
        teacher.status === this.filters.status
      );
    }

    // Apply degree filter
    if (this.filters.degree) {
      filteredData = filteredData.filter(teacher => 
        teacher.degree === this.filters.degree
      );
    }

    // Apply contract type filter
    if (this.filters.contractType) {
      filteredData = filteredData.filter(teacher => 
        teacher.contract_type === this.filters.contractType
      );
    }

    // Apply experience range filter
    if (this.filters.minExperience !== undefined && this.filters.minExperience !== null) {
      filteredData = filteredData.filter(teacher => {
        const teacherExperience = teacher.experience_years || 0;
        return teacherExperience >= this.filters.minExperience!;
      });
    }

    if (this.filters.maxExperience !== undefined && this.filters.maxExperience !== null) {
      filteredData = filteredData.filter(teacher => {
        const teacherExperience = teacher.experience_years || 0;
        return teacherExperience <= this.filters.maxExperience!;
      });
    }


    // Apply hire date range filter
    if (this.filters.hireDateFrom) {
      filteredData = filteredData.filter(teacher => {
        if (!teacher.hire_date) return false;
        try {
          const teacherHireDate = new Date(teacher.hire_date);
          const filterFromDate = new Date(this.filters.hireDateFrom!);
          
          // Set time to start of day for accurate comparison
          teacherHireDate.setHours(0, 0, 0, 0);
          filterFromDate.setHours(0, 0, 0, 0);
          
          return teacherHireDate >= filterFromDate;
        } catch (error) {
          console.warn('Invalid date format for teacher hire date:', teacher.hire_date);
          return false;
        }
      });
    }

    if (this.filters.hireDateTo) {
      filteredData = filteredData.filter(teacher => {
        if (!teacher.hire_date) return false;
        try {
          const teacherHireDate = new Date(teacher.hire_date);
          const filterToDate = new Date(this.filters.hireDateTo!);
          
          // Set time to end of day for accurate comparison
          teacherHireDate.setHours(0, 0, 0, 0);
          filterToDate.setHours(23, 59, 59, 999);
          
          return teacherHireDate <= filterToDate;
        } catch (error) {
          console.warn('Invalid date format for teacher hire date:', teacher.hire_date);
          return false;
        }
      });
    }

    return filteredData;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.showClearButton = false;
    this.filters.search = undefined;
    this.performSearch('');
  }

  private validateExperienceRange(): void {
    // Ensure min and max experience are valid numbers
    if (this.filters.minExperience !== undefined && this.filters.minExperience !== null) {
      if (this.filters.minExperience < 0) {
        this.filters.minExperience = 0;
      }
      if (this.filters.minExperience > 50) {
        this.filters.minExperience = 50;
      }
    }

    if (this.filters.maxExperience !== undefined && this.filters.maxExperience !== null) {
      if (this.filters.maxExperience < 0) {
        this.filters.maxExperience = 0;
      }
      if (this.filters.maxExperience > 50) {
        this.filters.maxExperience = 50;
      }
    }

    // Ensure min is not greater than max
    if (this.filters.minExperience !== undefined && this.filters.minExperience !== null &&
        this.filters.maxExperience !== undefined && this.filters.maxExperience !== null) {
      if (this.filters.minExperience > this.filters.maxExperience) {
        // Show warning message
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Số năm kinh nghiệm tối thiểu không thể lớn hơn tối đa. Đã tự động điều chỉnh.'
        });
        
        // Swap values
        const temp = this.filters.minExperience;
        this.filters.minExperience = this.filters.maxExperience;
        this.filters.maxExperience = temp;
      }
    }
  }

  private validateHireDateRange(): void {
    // Ensure hire date range is valid
    if (this.filters.hireDateFrom && this.filters.hireDateTo) {
      try {
        const fromDate = new Date(this.filters.hireDateFrom);
        const toDate = new Date(this.filters.hireDateTo);
        
        if (fromDate > toDate) {
          // Show warning message
          this.messageService.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc. Đã tự động điều chỉnh.'
          });
          
          // Swap dates
          const temp = this.filters.hireDateFrom;
          this.filters.hireDateFrom = this.filters.hireDateTo;
          this.filters.hireDateTo = temp;
        }
      } catch (error) {
        console.warn('Invalid date range:', error);
      }
    }
  }

  onFilterChange(): void {
    // Validate filters before applying
    this.validateExperienceRange();
    this.validateHireDateRange();
    
    // Apply filters to current data without reloading from server
    let filteredData = [...this.teachers];
    
    // Apply text search first
    if (this.searchQuery && this.searchQuery.trim()) {
      filteredData = filteredData.filter(teacher => {
        const searchTerm = this.searchQuery.trim().toLowerCase();
        return (
          (teacher.teacher_code || '').toLowerCase().includes(searchTerm) ||
          (teacher.teacher_name || '').toLowerCase().includes(searchTerm) ||
          (teacher.email || '').toLowerCase().includes(searchTerm) ||
          (teacher.department || '').toLowerCase().includes(searchTerm) ||
          (teacher.specialization || '').toLowerCase().includes(searchTerm) ||
          (teacher.degree || '').toLowerCase().includes(searchTerm) ||
          (teacher.status || '').toLowerCase().includes(searchTerm) ||
          (teacher.phone || '').toLowerCase().includes(searchTerm) ||
          (teacher.address || '').toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Apply other filters
    filteredData = this.applyFilters(filteredData);
    
    this.filteredTeachers = filteredData;
    this.cdr.detectChanges();
  }

  clearAdvancedFilters(): void {
    this.filters = {
      department: undefined,
      status: undefined,
      degree: undefined,
      minExperience: undefined,
      maxExperience: undefined,
      contractType: undefined,
      hireDateFrom: undefined,
      hireDateTo: undefined,
      search: this.filters.search
    };
    this.onFilterChange();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onClearFilters(): void {
    this.clearSearch();
    this.clearAdvancedFilters();
  }

  // Export functionality
  exportToExcel(): void {
    if (this.filteredTeachers.length === 0) {
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
      sheet: 'Danh sách giảng viên'
    });

    const worksheet = workbook.Sheets['Danh sách giảng viên'];
    worksheet['!cols'] = [
      { wch: 15 }, // Mã GV
      { wch: 20 }, // Họ tên
      { wch: 15 }, // Khoa
      { wch: 20 }, // Chuyên môn
      { wch: 15 }, // Bằng cấp
      { wch: 12 }, // Kinh nghiệm
      { wch: 12 }, // Trạng thái
      { wch: 15 }, // Loại hợp đồng
      { wch: 12 }, // Số giờ/tuần
      { wch: 20 }  // Ngôn ngữ
    ];

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `danh_sach_giang_vien_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Đã xuất ${this.filteredTeachers.length} giảng viên ra file Excel`
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
            BÁO CÁO DANH SÁCH GIẢNG VIÊN
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
            Tổng số giảng viên: ${this.filteredTeachers.length}
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
            - Tổng giảng viên: ${this.statistics.total_teachers}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Đang dạy: ${this.statistics.active_teachers}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Tạm nghỉ: ${this.statistics.on_leave_teachers}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Đã nghỉ: ${this.statistics.inactive_teachers}
          </td>
        </tr>
        <tr>
          <td colspan="10" style="padding: 5px; border: none; font-size: 11px;">
            - Kinh nghiệm trung bình: ${this.statistics.average_experience} năm
          </td>
        </tr>
      `;
    }

    // Add table headers
    html += `
      <tr style="background-color: #f0f0f0;">
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Mã GV</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Họ tên</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Khoa</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Chuyên môn</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Bằng cấp</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Kinh nghiệm</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Trạng thái</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Loại hợp đồng</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Số giờ/tuần</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">Ngôn ngữ</td>
      </tr>
    `;

    // Add data rows
    this.filteredTeachers.forEach(teacher => {
      html += `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.teacher_code || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.teacher_name || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.department || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.specialization || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.degree || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.experience_years || 0} năm</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.status || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.contract_type || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.teaching_hours_per_week || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${teacher.languages || ''}</td>
        </tr>
      `;
    });

    html += '</table>';
    return html;
  }

  // Helper methods
  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'Đang dạy':
        return 'success';
      case 'Tạm nghỉ':
        return 'warn';
      case 'Đã nghỉ':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getDegreeSeverity(degree: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (degree) {
      case 'Giáo sư':
        return 'info';     
      case 'Tiến sĩ':
        return 'warn';       
      case 'Thạc sĩ':
        return 'success';    
      case 'Cử nhân':
        return 'success';  
      case 'Khác':
        return 'secondary';       
      default:
        return 'contrast';  
    }
  }


  // Format date for server (YYYY-MM-DD format) - same as class module
  private formatDate(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (error) {
      return '';
    }
  }

  // Lấy chữ cái đầu tiên của từ cuối cùng trong tên
  getLastNameInitial(fullName: string | null | undefined): string {
    if (!fullName || fullName.trim() === '') return '?';
    
    const nameParts = fullName.trim().split(' ');
    const lastName = nameParts[nameParts.length - 1];
    
    return lastName.charAt(0).toUpperCase();
  }

  formatCurrency(amount: number | null | undefined): string {
    if (!amount) return 'Chưa cập nhật';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

}
