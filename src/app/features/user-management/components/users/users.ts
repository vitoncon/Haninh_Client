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
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { AvatarModule } from 'primeng/avatar';
import { PasswordModule } from 'primeng/password';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import * as XLSX from 'xlsx';

import { UserModel, UserFilters, UserStatistics, RoleModel } from '../../models/users.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
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
    DrawerModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    CardModule,
    FileUploadModule,
    AvatarModule,
    PasswordModule,
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
})
export class Users implements OnInit, OnDestroy {
  users: UserModel[] = [];
  filteredUsers: UserModel[] = [];
  selectedUsers: UserModel[] = [];
  formUser: UserModel | null = null;
  drawerVisible = false;
  saving = false;
  loading = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  showAdvancedFilters: boolean = false;
  statistics: UserStatistics | null = null;
  statsLoading: boolean = false;
  roles: RoleModel[] = [];
  
  // RxJS subjects for better memory management
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Advanced filters
  filters: UserFilters = {
    role_id: undefined,
    verifyEmail: undefined,
    status: undefined,
    search: undefined
  };

  // Client-side caching
  private usersCache: UserModel[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Options for selects
  roleOptions: Array<{ label: string; value: number }> = [];
  
  statusOptions = [
    { label: 'Hoạt động', value: 'Hoạt động' },
    { label: 'Không hoạt động', value: 'Không hoạt động' },
    { label: 'Tạm khóa', value: 'Tạm khóa' },
  ];
  
  verifyEmailOptions = [
    { label: 'Đã xác thực', value: 1 },
    { label: 'Chưa xác thực', value: 0 },
  ];

  @ViewChild('dt', { static: false }) dt!: Table;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRoles();
    this.loadUsers();
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

  loadRoles() {
    this.userService.getRoles().subscribe({
      next: (response) => {
        const rawRoles = response?.data ?? response;
        if (Array.isArray(rawRoles)) {
          this.roles = rawRoles;
          this.roleOptions = rawRoles.map(role => ({
            label: this.getRoleLabel(role.name),
            value: role.id
          }));
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        // Set default roles if API fails
        this.roleOptions = [
          { label: 'Admin', value: 1 },
          { label: 'Học viên', value: 2 },
          { label: 'Giảng viên', value: 3 },
        ];
      }
    });
  }

  /** Map raw role name to display label */
  getRoleLabel(roleName: string | null | undefined): string {
    if (!roleName) return 'Chưa phân quyền';
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return 'Admin';
    if (name.includes('teacher') || name.includes('giảng') || name.includes('giang')) return 'Giáo viên';
    if (name.includes('student') || name.includes('học') || name.includes('hoc')) return 'Học viên';
    // Fallback: capitalize first letter of each word
    return roleName.replace(/(^|\s)\S/g, t => t.toUpperCase());
  }

  /** Map user role name to PrimeNG tag severity (color) */
  getUserRoleSeverity(roleName: string | null | undefined): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    if (!roleName) return 'secondary';
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return 'info';        // admin -> blue/info
    if (name.includes('teacher') || name.includes('giảng') || name.includes('giang')) return 'success'; // teacher -> green
    if (name.includes('student') || name.includes('học') || name.includes('hoc')) return 'warn'; // student -> orange/warn
    // fallback
    return 'secondary';
  }

  loadStatistics() {
    this.statsLoading = true;
    try {
      this.statistics = this.getUserStatistics();
      this.statsLoading = false;
    } catch (error) {
      this.statsLoading = false;
      this.handleServiceError(error);
    }
  }

  private createEmptyUser(): UserModel {
    return {
      id: 0,
      name: '',
      email: '',
      password: '',
      avatar: null,
      avatarUrl: null,
      verifyEmail: 0,
      role_id: undefined,
      role_name: undefined,
      status: 'Hoạt động',
    };
  }

  /** Map database fields to model fields */
  private mapDatabaseToModel(dbUser: any): UserModel {
    // Xử lý avatar URL
    let avatarUrl = null;
    if (dbUser.avatar) {
      if (dbUser.avatar.startsWith('http')) {
        avatarUrl = dbUser.avatar;
      } else {
        avatarUrl = dbUser.avatar.startsWith('/img_avatar')
          ? dbUser.avatar
          : `/img_avatar/${dbUser.avatar}`;
      }
    } else {
      avatarUrl = '/img_avatar/avatar_default.jpg';
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      avatar: dbUser.avatar,
      avatarUrl: avatarUrl,
      verifyEmail: dbUser.verifyEmail || 0,
      role_id: dbUser.role_id,
      role_name: dbUser.role_name,
      status: dbUser.status || 'Hoạt động',
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
      is_deleted: dbUser.is_deleted
    };
  }

  /** Xử lý lỗi từ service */
  private handleServiceError(error: any): void {
    console.error('User Management Error:', error);
    
    let errorMessage = 'Đã xảy ra lỗi';
    
    if (error?.status === 401) {
      errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
    } else if (error?.status === 404) {
      errorMessage = 'Không tìm thấy endpoint';
    } else if (error?.status === 403) {
      errorMessage = 'Bạn không có quyền thực hiện thao tác này';
    } else if (error?.status === 500) {
      errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
    } else if (error?.error) {
      if (typeof error.error === 'string') {
        try {
          const parsedError = JSON.parse(error.error);
          errorMessage = parsedError.message || parsedError.error || errorMessage;
        } catch {
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

  private showErrorMessage(message: string, title: string = 'Lỗi'): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 4000
    });
  }

  private showSuccessMessage(message: string, title: string = 'Thành công'): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 3000
    });
  }

  private showWarningMessage(message: string, title: string = 'Cảnh báo'): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: 4000
    });
  }

  /** Xóa cache */
  private clearCache(): void {
    this.usersCache = null;
    this.cacheTimestamp = 0;
  }

  /** Lấy chữ cái đầu của tên để làm avatar fallback */
  getNameInitial(name: string | null | undefined): string {
    if (!name || name.trim() === '') return '?';
    const nameParts = name.trim().split(' ');
    const lastName = nameParts[nameParts.length - 1];
    return lastName.charAt(0).toUpperCase();
  }

  /** Avatar styling helpers: return a light background and readable text color */
  getAvatarBackground(user: UserModel | null | undefined): string {
    if (!user) return '#f3f4f6'; // light gray fallback

    const role = (user.role_name || '').toLowerCase();
    if (role.includes('admin')) return '#e6f2ff'; // very light blue
    if (role.includes('học viên') || role.includes('hoc vien')) return '#eef9f2'; // very light green
    if (role.includes('giảng viên') || role.includes('giang vien')) return '#fff6e6'; // very light orange

    // Deterministic pastel by id when role not present
    const id = user.id ?? 0;
    const hue = (id * 37) % 360; // pseudo-random hue
    return `hsl(${hue} 85% 94%)`;
  }

  getAvatarTextColor(bg: string): string {
    // Use a dark text color for all light backgrounds to ensure contrast
    return '#1f2937'; // slate-800
  }

  /** Returns an object suitable for binding to `[style]` or `[ngStyle]` on the avatar */
  getAvatarStyle(user: UserModel | null | undefined): { [key: string]: string } {
    const bg = this.getAvatarBackground(user);
    const color = this.getAvatarTextColor(bg);
    return {
      'background-color': bg,
      color: color,
      'font-weight': '600'
    };
  }

  /** Tính toán thống kê từ danh sách users */
  private calculateUserStatistics(users: UserModel[]): UserStatistics {
    const total_users = users.length;
    const active_users = users.filter(u => u.status === 'Hoạt động').length;
    const verified_users = users.filter(u => u.verifyEmail === 1).length;
    const unverified_users = users.filter(u => u.verifyEmail === 0).length;
    
    // Role distribution
    const roleCount = users.reduce((acc, user) => {
      const roleName = user.role_name || 'Chưa phân quyền';
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const role_distribution = Object.entries(roleCount).map(([role_name, count]) => ({ role_name, count }));
    
    return {
      total_users,
      active_users,
      verified_users,
      unverified_users,
      role_distribution
    };
  }

  /** Lấy thống kê users */
  getUserStatistics(): UserStatistics {
    if (this.users && this.users.length > 0) {
      return this.calculateUserStatistics(this.users);
    }
    
    return {
      total_users: 0,
      active_users: 0,
      verified_users: 0,
      unverified_users: 0,
      role_distribution: []
    };
  }

  /** Kiểm tra cache có hợp lệ không */
  private isCacheValid(): boolean {
    const now = Date.now();
    return this.usersCache !== null && (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  loadUsers() {
    // Check cache first
    if (this.isCacheValid()) {
      this.users = [...this.usersCache!];
      this.filteredUsers = [...this.users];
      this.applyFilters();
      this.loadStatistics();
      return;
    }

    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (response) => {
        const rawUsers = response?.data ?? response;
        if (Array.isArray(rawUsers)) {
          // Map database fields to model fields
          this.users = rawUsers.map((user: any) => this.mapDatabaseToModel(user));
          this.filteredUsers = [...this.users];
          this.applyFilters();
          
          // Update cache
          this.usersCache = [...this.users];
          this.cacheTimestamp = Date.now();
          
          // Load statistics after users are loaded
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
    this.formUser = this.createEmptyUser();
    this.drawerVisible = true;
  }

  /** Kiểm tra có đang ở chế độ edit không */
  isEditMode(): boolean {
    return !!(this.formUser && this.formUser.id && this.formUser.id > 0);
  }

  onEdit(user: UserModel) {
    this.formUser = { ...user };
    // Không copy password khi edit
    this.formUser.password = undefined;
    
    // Ensure roles are loaded for the select dropdown
    if (!this.roles || this.roles.length === 0) {
      this.loadRoles();
    }
    
    // If formUser doesn't have role_id, try to resolve it from role_name
    if (!this.formUser.role_id && user.role_name) {
      const matchingRole = this.roles.find(r => r.name === user.role_name);
      if (matchingRole) {
        this.formUser.role_id = matchingRole.id;
      }
    }
    
    this.drawerVisible = true;
  }

  onDelete(user: UserModel) {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa tài khoản <b>${user.name}</b>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        if (!user.id) {
          this.showErrorMessage('Không thể xóa tài khoản: ID không hợp lệ');
          return;
        }
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.clearCache();
            this.loadUsers();
            this.showSuccessMessage(`Đã xóa tài khoản "${user.name}"`);
          },
          error: (error) => this.handleServiceError(error),
        });
      },
    });
  }

  onSave() {
    if (!this.formUser) {
      this.showErrorMessage('Không tìm thấy dữ liệu form');
      return;
    }
    
    // Validation
    const validationErrors = this.validateUser(this.formUser);
    
    if (validationErrors.length > 0) {
      this.showWarningMessage(validationErrors.join(', '), 'Thông tin không hợp lệ');
      return;
    }

    this.saving = true;
    const done = () => (this.saving = false);

    // Xử lý payload
    const payload: any = {
      name: this.formUser.name,
      email: this.formUser.email,
      avatar: this.formUser.avatar,
      verifyEmail: this.formUser.verifyEmail || 0,
      status: this.formUser.status || 'Hoạt động',
    };

    // Chỉ gửi password khi tạo mới hoặc khi có thay đổi
    if (!this.isEditMode() && this.formUser.password) {
      payload.password = this.formUser.password;
    }

    if (this.formUser && this.formUser.id) {
      this.userService
        .updateUser(this.formUser.id, { ...payload, id: this.formUser.id })
        .subscribe({
          next: () => {
            // Nếu có role_id, cập nhật role trong user_roles table
            // Only call assignRole if a role was explicitly selected
            if (this.formUser?.role_id && this.formUser.id) {
              this.userService.assignRole(this.formUser.id, this.formUser.role_id).subscribe({
                next: () => {
                  this.clearCache();
                  this.showSuccessMessage('Cập nhật tài khoản thành công');
                  this.loadUsers();
                  this.drawerVisible = false;
                  done();
                },
                error: (error) => {
                  // Nếu lỗi assign role, vẫn hiển thị thành công vì user đã được update
                  console.warn('Warning: Could not update role:', error);
                  this.clearCache();
                  this.showSuccessMessage('Cập nhật tài khoản thành công');
                  this.loadUsers();
                  this.drawerVisible = false;
                  done();
                }
              });
            } else {
              // No role to assign, just refresh
              this.clearCache();
              this.showSuccessMessage('Cập nhật tài khoản thành công');
              this.loadUsers();
              this.drawerVisible = false;
              done();
            }
          },
          error: (error) => {
            this.handleServiceError(error);
            done();
          },
        });
    } else {
      this.userService.addUser(payload).subscribe({
        next: (response) => {
          const userId = response?.data?.id || response?.id;
          // Gán role nếu có (tạo record trong user_roles table)
          if (userId && this.formUser?.role_id) {
            this.userService.assignRole(userId, this.formUser.role_id).subscribe({
              next: () => {
                this.clearCache();
                this.showSuccessMessage('Thêm tài khoản thành công');
                this.loadUsers();
                this.drawerVisible = false;
                done();
              },
              error: (error) => {
                // Nếu lỗi assign role, vẫn hiển thị thành công vì user đã được tạo
                console.warn('Warning: Could not assign role:', error);
                this.clearCache();
                this.showSuccessMessage('Thêm tài khoản thành công');
                this.loadUsers();
                this.drawerVisible = false;
                done();
              }
            });
          } else {
            this.clearCache();
            this.showSuccessMessage('Thêm tài khoản thành công');
            this.loadUsers();
            this.drawerVisible = false;
            done();
          }
        },
        error: (error) => {
          this.handleServiceError(error);
          done();
        },
      });
    }
  }

  private validateUser(user: UserModel): string[] {
    const errors: string[] = [];

    if (!user.name?.trim()) {
      errors.push('Tên là bắt buộc');
    } else if (user.name.length < 2) {
      errors.push('Tên phải có ít nhất 2 ký tự');
    }

    if (!user.email?.trim()) {
      errors.push('Email là bắt buộc');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        errors.push('Email không đúng định dạng');
      }
    }

    // Password validation chỉ khi tạo mới
    if (!this.isEditMode() && !user.password?.trim()) {
      errors.push('Mật khẩu là bắt buộc');
    } else if (!this.isEditMode() && user.password && user.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Role is required
    if (!user.role_id) {
      errors.push('Vai trò là bắt buộc');
    }

    return errors;
  }

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
      role_id: undefined,
      verifyEmail: undefined,
      status: undefined,
      search: undefined
    };
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.users];

    // Text search
    if (this.searchQuery?.trim()) {
      const searchTerm = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.role_name?.toLowerCase().includes(searchTerm)
      );
    }

    // Role filter
    if (this.filters.role_id) {
      filtered = filtered.filter(user => user.role_id === this.filters.role_id);
    }

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(user => user.status === this.filters.status);
    }

    // VerifyEmail filter
    if (this.filters.verifyEmail !== undefined) {
      filtered = filtered.filter(user => user.verifyEmail === this.filters.verifyEmail);
    }

    this.filteredUsers = filtered;
    this.updateClearButtonVisibility();
  }

  private updateClearButtonVisibility() {
    this.showClearButton = !!(this.searchQuery?.trim() || 
      this.filters.role_id || 
      this.filters.status ||
      this.filters.verifyEmail !== undefined);
  }

  forceRefresh() {
    this.clearCache();
    this.searchQuery = '';
    this.filters = {
      role_id: undefined,
      verifyEmail: undefined,
      status: undefined,
      search: undefined
    };
    this.showAdvancedFilters = false;
    this.showClearButton = false;
    
    if (this.dt) {
      this.dt.sortField = null;
      this.dt.sortOrder = 1;
      setTimeout(() => {
        this.dt.clear();
        this.cdr.detectChanges();
      }, 0);
    }
    
    this.searchSubject$.next('');
    this.loadUsers();
  }

  exportToExcel(): void {
    if (this.filteredUsers.length === 0) {
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
      sheet: 'Danh sách tài khoản'
    });

    const worksheet = workbook.Sheets['Danh sách tài khoản'];
    worksheet['!cols'] = [
      { wch: 20 }, // Tên
      { wch: 30 }, // Email
      { wch: 15 }, // Vai trò
      { wch: 15 }, // Xác thực
      { wch: 20 }, // Ngày tạo
    ];

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `danh_sach_tai_khoan_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, filename);

    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Đã xuất ${this.filteredUsers.length} tài khoản ra file Excel`
    });
  }

  private generateHTMLReport(): string {
    const now = new Date();
    const currentDate = now.toLocaleDateString('vi-VN');
    const currentTime = now.toLocaleTimeString('vi-VN');

    let html = `
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <tr>
          <td colspan="5" style="text-align: center; font-size: 16px; font-weight: bold; padding: 20px; border: none;">
            BÁO CÁO DANH SÁCH TÀI KHOẢN
          </td>
        </tr>
        <tr>
          <td colspan="5" style="text-align: center; font-size: 14px; font-weight: bold; padding: 10px; border: none;">
            Học viện Hà Ninh
          </td>
        </tr>
        <tr>
          <td colspan="5" style="padding: 10px; border: none;"></td>
        </tr>
        <tr>
          <td colspan="5" style="padding: 5px; border: none; font-size: 11px;">
            Ngày xuất báo cáo: ${currentDate} lúc ${currentTime}
          </td>
        </tr>
        <tr>
          <td colspan="5" style="padding: 5px; border: none; font-size: 11px;">
            Tổng số tài khoản: ${this.filteredUsers.length}
          </td>
        </tr>
    `;

    if (this.statistics) {
      html += `
        <tr>
          <td colspan="5" style="padding: 10px; border: none;"></td>
        </tr>
        <tr>
          <td colspan="5" style="padding: 5px; border: none; font-size: 12px; font-weight: bold;">
            THỐNG KÊ TỔNG QUAN:
          </td>
        </tr>
        <tr>
          <td colspan="5" style="padding: 5px; border: none; font-size: 11px;">
            - Tổng tài khoản: ${this.statistics.total_users}
          </td>
        </tr>
        <tr>
          <td colspan="5" style="padding: 5px; border: none; font-size: 11px;">
            - Đã xác thực: ${this.statistics.verified_users}
          </td>
        </tr>
        <tr>
          <td colspan="5" style="padding: 5px; border: none; font-size: 11px;">
            - Chưa xác thực: ${this.statistics.unverified_users}
          </td>
        </tr>
      `;
    }

    html += `
        <tr>
          <td colspan="5" style="padding: 10px; border: none;"></td>
        </tr>
        <tr style="background-color: #f5f5f5; font-weight: bold;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Tên</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Email</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Vai trò</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Xác thực</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ngày tạo</td>
        </tr>
    `;

    this.filteredUsers.forEach((user, index) => {
      const rowStyle = index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9f9f9;';
      const verifyStatus = user.verifyEmail === 1 ? 'Đã xác thực' : 'Chưa xác thực';
      const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-';
      html += `
        <tr style="${rowStyle}">
          <td style="border: 1px solid #ddd; padding: 8px;">${user.name || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${user.email || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${user.role_name || 'Chưa phân quyền'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${verifyStatus}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${createdDate}</td>
        </tr>
      `;
    });

    html += `
      </table>
    `;

    return html;
  }

  getVerifyEmailSeverity(verifyEmail: number): "success" | "warn" | null {
    return verifyEmail === 1 ? 'success' : 'warn';
  }

  getVerifyEmailLabel(verifyEmail: number): string {
    return verifyEmail === 1 ? 'Đã xác thực' : 'Chưa xác thực';
  }

  onDrawerHide() {
    this.drawerVisible = false;
    this.formUser = null;
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.role_id || this.filters.status || this.filters.verifyEmail !== undefined);
  }

  /** Map user status to tag severity (color) */
  getUserStatusSeverity(status: string | null | undefined): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    if (!status) return 'secondary';
    
    // Exact match for the three status values
    if (status === 'Hoạt động') return 'success';      // green
    if (status === 'Tạm khóa') return 'danger';        // red
    if (status === 'Không hoạt động') return 'warn';   // orange
    
    // Fallback with contains check
    const name = status.toLowerCase();
    if (name.includes('hoạt động') || name.includes('active')) return 'success';
    if (name.includes('khóa') || name.includes('suspend')) return 'danger';
    if (name.includes('không')) return 'warn';
    
    return 'secondary';
  }

  /** Xử lý khi chọn file avatar */
  onFileUploadSelect(event: any) {
    let selectedFile = null;
    
    if (event.files && event.files.length > 0) {
      selectedFile = event.files[0];
    } else if (event.files && event.files.length === 0 && event.currentFiles && event.currentFiles.length > 0) {
      selectedFile = event.currentFiles[0];
    } else if (event.files && event.files.length === 0 && event.originalEvent && event.originalEvent.target && event.originalEvent.target.files && event.originalEvent.target.files.length > 0) {
      selectedFile = event.originalEvent.target.files[0];
    }
    
    if (selectedFile && this.formUser) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && this.formUser) {
          this.formUser.avatarUrl = e.target.result as string;
          // Lưu base64 hoặc upload lên server
          // Tạm thời lưu base64, sau này có thể upload lên server
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  onFileUploadError(event: any) {
    console.error('File upload error:', event);
    this.showErrorMessage('Kích thước tệp vượt quá giới hạn cho phép. Vui lòng chọn file nhỏ hơn 1MB.', 'Lỗi upload');
  }
}

