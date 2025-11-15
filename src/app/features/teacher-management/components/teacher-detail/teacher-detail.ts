import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherModel } from '../../models/teacher.model';
import { TeacherService } from '../../services/teacher.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { UserService } from '../../../user-management/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule as PasswordModule } from 'primeng/inputtext';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-teacher-detail',
  templateUrl: 'teacher-detail.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    TagModule,
    CardModule,
    DividerModule,
    AvatarModule,
    ProgressSpinnerModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
    DrawerModule,
    FileUploadModule,
    TooltipModule,
    DialogModule,
    ConfirmDialogModule,
    PasswordModule
  ],
  providers: [MessageService, ConfirmationService],
  styleUrls: ['./teacher-detail.scss']
})
export class TeacherDetail implements OnInit, OnDestroy {
  teacherData: TeacherModel | null = null;
  formTeacher: TeacherModel | null = null;
  loading: boolean = false;
  saving: boolean = false;
  drawerVisible: boolean = false;
  teacherId: number | null = null;
  private destroy$ = new Subject<void>();

  // User account linking
  linkedUser: any = null;
  checkingUser: boolean = false;
  creatingUser: boolean = false;
  showCreateUserDialog: boolean = false;
  newUserPassword: string = '';
  newUserConfirmPassword: string = '';

  // Dropdown options
  genderOptions: any[] = [];
  degreeOptions: any[] = [];
  statusOptions: any[] = [];
  departmentOptions: any[] = [];
  contractTypeOptions: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private messageService: MessageService,
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDropdownData();
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.teacherId = +params['id'];
      if (this.teacherId) {
        this.loadTeacherDetail();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTeacherDetail(): void {
    if (!this.teacherId) return;
    
    this.loading = true;
    this.teacherService.getTeacherById(this.teacherId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (teacher: TeacherModel) => {
        this.teacherData = teacher;
        this.loading = false;
        // Check if teacher has linked user account
        if (teacher.email) {
          this.checkLinkedUser(teacher.email);
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin giảng viên'
        });
        this.loading = false;
        this.router.navigate(['/features/teacher']);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/features/teacher']);
  }

  onEdit(): void {
    if (!this.teacherData) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không có dữ liệu giảng viên để chỉnh sửa'
      });
      return;
    }

    try {
      // Deep copy to avoid reference issues
      this.formTeacher = JSON.parse(JSON.stringify(this.teacherData));
      this.drawerVisible = true;
    } catch (error) {
      console.error('Error copying teacher data for edit:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải dữ liệu giảng viên để chỉnh sửa'
      });
    }
  }

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
      case 'Tiến sĩ':
        return 'danger';
      case 'Thạc sĩ':
        return 'warn';
      case 'Cử nhân':
        return 'info';
      default:
        return 'secondary';
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
      console.error('Error formatting date for server:', error);
      return '';
    }
  }

  formatCurrency(amount: number | null | undefined): string {
    if (!amount) return 'Chưa cập nhật';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  calculateAge(dob: string | null | undefined): number | null {
    if (!dob) return null;
    
    try {
      const today = new Date();
      const birthDate = new Date(dob);
      
      if (isNaN(birthDate.getTime())) {
        return null;
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return null;
    }
  }

  getExperienceLevel(experienceYears: number | null | undefined): string {
    if (!experienceYears) return 'Chưa có kinh nghiệm';
    
    if (experienceYears < 2) return 'Mới bắt đầu';
    if (experienceYears < 5) return 'Có kinh nghiệm';
    if (experienceYears < 10) return 'Kinh nghiệm tốt';
    return 'Kinh nghiệm cao';
  }

  callPhone(phone: string): void {
    window.open(`tel:${phone}`, '_self');
  }

  sendEmail(email: string): void {
    window.open(`mailto:${email}`, '_self');
  }

  // Lấy chữ cái đầu tiên của từ cuối cùng trong tên
  getLastNameInitial(fullName: string | null | undefined): string {
    if (!fullName || fullName.trim() === '') return '?';
    
    const nameParts = fullName.trim().split(' ');
    const lastName = nameParts[nameParts.length - 1];
    
    return lastName.charAt(0).toUpperCase();
  }

  // Lấy avatar URL từ thư mục public/img_avatar
  getAvatarUrl(teacher: any): string | undefined {
    if (!teacher || !teacher.teacher_name) return undefined;
    
    // Lấy chữ cái đầu của tên để quyết định avatar
    const nameInitial = this.getLastNameInitial(teacher.teacher_name);
    const charCode = nameInitial.charCodeAt(0);
    
    // Tính toán số avatar dựa trên mã ASCII (A=1, B=2, ...)
    let avatarNumber = ((charCode - 65) % 15) + 1;
    
    return `/img_avatar/avatar_${avatarNumber}.jpg`;
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

    // Load department options
    this.departmentOptions = [
      { label: 'Tiếng Anh', value: 'Tiếng Anh' },
      { label: 'Tiếng Trung', value: 'Tiếng Trung' },
      { label: 'Tiếng Hàn', value: 'Tiếng Hàn' },
      { label: 'Giáo viên chủ nhiệm', value: 'Giáo viên chủ nhiệm' },
      { label: 'Trợ giảng', value: 'Trợ giảng' },
      { label: 'Giáo viên bán thời gian', value: 'Giáo viên bán thời gian' },
      { label: 'Giáo viên toàn thời gian', value: 'Giáo viên toàn thời gian' }
    ];
  }

  onSave(): void {
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
    const cleanedTeacher = this.cleanTeacherData(this.formTeacher);
    
    // Format dates before sending to server
    if (cleanedTeacher.dob) {
      cleanedTeacher.dob = this.formatDate(cleanedTeacher.dob);
    }
    if (cleanedTeacher.hire_date) {
      cleanedTeacher.hire_date = this.formatDate(cleanedTeacher.hire_date);
    }

    this.teacherService.updateTeacher(this.formTeacher.id!, cleanedTeacher).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật giảng viên thành công',
        });
        
        // Reload data after successful operation
        this.loadTeacherDetail();
        this.drawerVisible = false;
        this.saving = false;
      },
      error: (error) => {
        console.error('Save teacher error:', error);
        
        let errorMessage = 'Không thể cập nhật giảng viên';
        
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

  onDrawerHide(): void {
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

  /**
   * Kiểm tra xem teacher đã có user account chưa (bằng email)
   */
  checkLinkedUser(teacherEmail: string): void {
    if (!teacherEmail || !this.isValidEmail(teacherEmail)) {
      this.linkedUser = null;
      return;
    }

    this.checkingUser = true;
    this.userService.getUsers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        const users = response?.data || response || [];
        // Tìm user có email trùng với teacher email
        const user = Array.isArray(users) 
          ? users.find((u: any) => u.email && u.email.toLowerCase() === teacherEmail.toLowerCase())
          : null;
        
        this.linkedUser = user || null;
        this.checkingUser = false;
      },
      error: (error) => {
        console.error('Error checking linked user:', error);
        this.linkedUser = null;
        this.checkingUser = false;
      }
    });
  }

  /**
   * Mở dialog tạo user account cho teacher
   */
  openCreateUserDialog(): void {
    if (!this.teacherData || !this.teacherData.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Giáo viên chưa có email. Vui lòng cập nhật email trước.'
      });
      return;
    }

    if (this.linkedUser) {
      this.messageService.add({
        severity: 'info',
        summary: 'Thông tin',
        detail: 'Giáo viên đã có tài khoản user liên kết.'
      });
      return;
    }

    this.newUserPassword = '';
    this.newUserConfirmPassword = '';
    this.showCreateUserDialog = true;
  }

  /**
   * Tạo user account cho teacher
   */
  createUserAccount(): void {
    if (!this.teacherData || !this.teacherData.email) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không có email để tạo tài khoản'
      });
      return;
    }

    // Validate password
    if (!this.newUserPassword || this.newUserPassword.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập mật khẩu'
      });
      return;
    }

    if (this.newUserPassword.length < 6) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
      return;
    }

    if (this.newUserPassword !== this.newUserConfirmPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Mật khẩu xác nhận không khớp'
      });
      return;
    }

    this.creatingUser = true;

    // Tạo user với email của teacher và role = 2 (Giáo viên)
    // Sử dụng API register để tạo user với password (API này tự động hash password)
    const registerData = {
      email: this.teacherData.email,
      password: this.newUserPassword
    };

    // Gọi API register để tạo user
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    this.http.post<any>('http://localhost:10093/api/auth/register', registerData, { headers }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        // Sau khi register thành công, cần lấy user_id từ email để gán role
        // Tìm user vừa tạo bằng email
        this.userService.getUsers().pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (usersResponse: any) => {
            const users = usersResponse?.data || usersResponse || [];
            const newUser = Array.isArray(users) 
              ? users.find((u: any) => u.email && u.email.toLowerCase() === this.teacherData!.email!.toLowerCase())
              : null;
            
            if (newUser && newUser.id) {
              // Gán role 2 (Giáo viên) cho user
              this.userService.assignRole(newUser.id, 2).pipe(
                takeUntil(this.destroy$)
              ).subscribe({
                next: () => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Đã tạo tài khoản user cho giáo viên thành công. Email: ' + this.teacherData!.email + '. Vui lòng ghi nhớ mật khẩu đã nhập.'
                  });
                  this.showCreateUserDialog = false;
                  this.creatingUser = false;
                  this.newUserPassword = '';
                  this.newUserConfirmPassword = '';
                  // Kiểm tra lại user đã được tạo
                  setTimeout(() => {
                    this.checkLinkedUser(this.teacherData!.email!);
                  }, 1000);
                },
                error: (error) => {
                  console.error('Error assigning role:', error);
                  this.messageService.add({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Đã tạo user nhưng không thể gán role. Vui lòng gán role thủ công trong quản lý tài khoản.'
                  });
                  this.showCreateUserDialog = false;
                  this.creatingUser = false;
                  this.newUserPassword = '';
                  this.newUserConfirmPassword = '';
                  setTimeout(() => {
                    this.checkLinkedUser(this.teacherData!.email!);
                  }, 1000);
                }
              });
            } else {
              this.messageService.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Đã tạo user nhưng không tìm thấy để gán role. Vui lòng gán role thủ công.'
              });
              this.showCreateUserDialog = false;
              this.creatingUser = false;
              this.newUserPassword = '';
              this.newUserConfirmPassword = '';
              setTimeout(() => {
                this.checkLinkedUser(this.teacherData!.email!);
              }, 1000);
            }
          },
          error: (error) => {
            console.error('Error finding new user:', error);
            this.messageService.add({
              severity: 'warn',
              summary: 'Cảnh báo',
              detail: 'Đã tạo user nhưng không thể tìm thấy để gán role. Vui lòng gán role thủ công.'
            });
            this.showCreateUserDialog = false;
            this.creatingUser = false;
            this.newUserPassword = '';
            this.newUserConfirmPassword = '';
          }
        });
      },
      error: (error: any) => {
        console.error('Error creating user:', error);
        let errorMessage = 'Không thể tạo tài khoản user';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.status === 409) {
          errorMessage = 'Email đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.';
        } else if (error.status === 400) {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: errorMessage
        });
        this.creatingUser = false;
      }
    });
  }

  /**
   * Điều hướng đến trang quản lý user
   */
  goToUserManagement(): void {
    if (this.linkedUser && this.linkedUser.id) {
      this.router.navigate(['/features/users']);
    }
  }

  /**
   * Kiểm tra xem teacher đã có user account chưa
   */
  hasLinkedUser(): boolean {
    return !!this.linkedUser;
  }
}
