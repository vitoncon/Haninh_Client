import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
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

import { TeacherModel } from '../../models/teacher.model';
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
  ],
  providers: [MessageService, ConfirmationService],
})
export class Teacher implements OnInit {
  teachers: TeacherModel[] = [];
  filteredTeachers: TeacherModel[] = [];
  selectedTeacher: TeacherModel | null = null;
  formTeacher: TeacherModel | null = null;
  drawerVisible = false;
  drawerDetailVisible = false;
  saving = false;
  loading = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  private searchTimer: any = null;
  private searchCache: Map<string, TeacherModel[]> = new Map();
  private readonly CACHE_SIZE_LIMIT = 50;

    // Các danh sách dùng cho <p-select>
  genderOptions = [
    { label: 'Nam', value: 'Nam' },
    { label: 'Nữ', value: 'Nữ' },
    { label: 'Khác', value: 'Khác' },
  ];

  degreeOptions = [
    { label: 'Cử nhân', value: 'Cử nhân' },
    { label: 'Thạc sĩ', value: 'Thạc sĩ' },
    { label: 'Tiến sĩ', value: 'Tiến sĩ' },
    { label: 'Khác', value: 'Khác' },
  ];

  statusOptions = [
    { label: 'Đang dạy', value: 'Đang dạy' },
    { label: 'Tạm nghỉ', value: 'Tạm nghỉ' },
    { label: 'Đã nghỉ', value: 'Đã nghỉ' },
  ];


  @ViewChild('dt', { static: false }) dt!: Table;

  constructor(
    private teacherService: TeacherService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTeachers();
  }

  private createEmptyTeacher(): TeacherModel {
    return {
      id: 0,
      teacher_code: '',
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
    };
  }

  loadTeachers() {
    this.loading = true;
    this.teacherService.getTeachers().subscribe({
      next: (data) => {
        this.teachers = data;
        this.filteredTeachers = [...this.teachers];
        this.clearSearchCache();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
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

  onCreate() {
    this.selectedTeacher = null;
    this.formTeacher = this.createEmptyTeacher();
    this.drawerVisible = true;
  }

  onEdit(teacher: TeacherModel) {
    this.selectedTeacher = { ...teacher };
    this.formTeacher = { ...teacher };
    this.drawerVisible = true;
  }

  onDelete(teacher: TeacherModel) {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa giảng viên <b>${teacher.teacher_name}</b>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.teacherService.deleteTeacher(teacher.id).subscribe({
          next: () => {
            this.loadTeachers();
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã xóa giảng viên "${teacher.teacher_name}"`,
            });
          },
          error: () =>
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể xóa giảng viên',
            }),
        });
      },
    });
  }

  onSave() {
    if (!this.formTeacher) return;
    if (!this.formTeacher.teacher_code || !this.formTeacher.teacher_name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập mã và tên giảng viên',
      });
      return;
    }

    this.saving = true;
    const done = () => (this.saving = false);

    if (this.selectedTeacher && this.selectedTeacher.id) {
      this.teacherService
        .updateTeacher(this.selectedTeacher.id, this.formTeacher)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Cập nhật giảng viên thành công',
            });
            this.loadTeachers();
            this.drawerVisible = false;
          },
          error: () =>
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể cập nhật giảng viên',
            }),
          complete: done,
        });
    } else {
      this.teacherService.addTeacher(this.formTeacher).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm giảng viên thành công',
          });
          this.loadTeachers();
          this.drawerVisible = false;
        },
        error: () =>
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể thêm giảng viên',
          }),
        complete: done,
      });
    }
  }

  onDrawerHide() {
    this.formTeacher = null;
    this.selectedTeacher = null;
    this.drawerVisible = false;
  }

  onView(teacher: TeacherModel) {
    this.selectedTeacher = { ...teacher };
    this.drawerDetailVisible = true;
  }

  onClearFilters() {
    this.clearSearch();
  }

  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = (input?.value || '').trim();
    
    this.searchQuery = value || '';
    this.showClearButton = (value || '').length > 0;
    
    if (this.searchTimer) clearTimeout(this.searchTimer);
    
    const debounceTime = value.length > 3 ? 300 : 500;
    
    this.searchTimer = setTimeout(() => {
      this.filterTeachers(value);
    }, debounceTime);
  }

  private filterTeachers(query: string) {
    if (!query || query.trim() === '') {
      this.filteredTeachers = [...this.teachers];
      this.cdr.detectChanges();
      return;
    }

    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      this.filteredTeachers = [...this.searchCache.get(cacheKey)!];
      this.cdr.detectChanges();
      return;
    }

    const searchTerms = this.parseSearchQuery(query);
    const results = this.teachers.filter(teacher => 
      this.advancedSearchInTeacher(teacher, searchTerms)
    );

    this.cacheSearchResults(cacheKey, results);
    this.filteredTeachers = [...results];
    
    if (this.dt) {
      this.dt.clear();
    }
    
    this.cdr.detectChanges();
  }

  private cacheSearchResults(key: string, results: TeacherModel[]) {
    if (this.searchCache.size >= this.CACHE_SIZE_LIMIT) {
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey) {
        this.searchCache.delete(firstKey);
      }
    }
    
    this.searchCache.set(key, results);
  }

  private parseSearchQuery(query: string): string[] {
    return query.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
  }

  private advancedSearchInTeacher(teacher: TeacherModel, searchTerms: string[]): boolean {
    const searchableFields = [
      teacher.teacher_code?.toLowerCase() || '',
      teacher.teacher_name?.toLowerCase() || '',
      teacher.gender?.toLowerCase() || '',
      teacher.phone?.toLowerCase() || '',
      teacher.email?.toLowerCase() || '',
      teacher.address?.toLowerCase() || '',
      teacher.department?.toLowerCase() || '',
      teacher.specialization?.toLowerCase() || '',
      teacher.degree?.toLowerCase() || '',
      teacher.status?.toLowerCase() || '',
      teacher.note?.toLowerCase() || '',
      teacher.experience_years?.toString() || '',
      teacher.dob?.toString() || ''
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
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  
    this.filteredTeachers = [...this.teachers];
    this.searchQuery = '';
    this.showClearButton = false;
  
    if (this.dt) {
      this.dt.clear();
    }
    
    this.cdr.detectChanges();
  }

  private clearSearchCache() {
    this.searchCache.clear();
  }
}
