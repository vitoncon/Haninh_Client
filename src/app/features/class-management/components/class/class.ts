import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ClassModel } from '../../models/class.model';
import { ClassService } from '../../services/class.service';

import { CommonModule } from '@angular/common';
import { TableModule, Table } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CoursesService } from '../../../courses/services/courses.service';
import { Course } from '../../../courses/models/courses.model';


@Component({
  selector: 'app-class',
  templateUrl: 'class.html',
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
    DialogModule,
    DrawerModule,
    ConfirmDialogModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [ConfirmationService],
  styleUrls: ['./class.scss']
})
export class Class implements OnInit {
  classes: ClassModel[] = [];
  filteredClasses: ClassModel[] = [];
  selectedClass: ClassModel | null = null;
  formClass: ClassModel | null = null;
  displayDialog: boolean = false;
  drawerVisible: boolean = false;
  drawerDetailVisible: boolean = false;
  saving: boolean = false;
  loading: boolean = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  private searchTimer: any = null;
  private searchCache: Map<string, ClassModel[]> = new Map();
  private readonly CACHE_SIZE_LIMIT = 50;
    statusOptions = [
    { label: 'Mở đăng ký', value: 'Mở đăng ký' },
    { label: 'Đang diễn ra', value: 'Đang diễn ra' },
    { label: 'Hoàn thành', value: 'Hoàn thành' },
    { label: 'Đã hủy', value: 'Đã hủy' }
  ];

  courseOptions: { label: string; value: number }[] = [];
  courseNameById: Record<number, string> = {};

  @ViewChild('dt', { static: false }) dt!: Table;

  constructor(
    private classService: ClassService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private coursesService: CoursesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }
  
  private loadCourses() {
    this.coursesService.getCourses().subscribe((data: Course[]) => {
      const list = data || [];
      this.courseOptions = list.map((c) => ({
        label: c.course_name,
        value: Number(c.id)
      }));
      this.courseNameById = list.reduce<Record<number, string>>((acc, c) => {
        const idNum = Number(c.id);
        if (!Number.isNaN(idNum)) acc[idNum] = c.course_name;
        return acc;
      }, {});
      this.loadClasses();
    });
  }  

  private createEmptyClass(): ClassModel {
    return {
      id: undefined,
      class_code: '',
      class_name: '',
      course_id: 0,
      description: '',
      learning_outcomes: '',
      start_date: null,
      end_date: null,
      status: 'Mở đăng ký'
    };
  }

  loadClasses() {
    this.loading = true;
    this.classService.getClasses().subscribe({
      next: (data: ClassModel[]) => {
        this.classes = data.map((cls) => ({
          ...cls,
          course_name: this.courseNameById[cls.course_id] || '-', 
        }));
        this.filteredClasses = [...this.classes];
        this.clearSearchCache();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách lớp học'
        });
        this.cdr.detectChanges();
      }
    });
  }  

  onCreate() {
    this.selectedClass = null;
    this.formClass = this.createEmptyClass();
    this.drawerVisible = true;
  }

  onEdit(classItem: ClassModel) {
    this.selectedClass = { ...classItem };
    this.formClass = { ...classItem };
    this.drawerVisible = true;
  }

  onDelete(classItem: ClassModel) {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa lớp học <b>${classItem.class_name}</b> không?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.classService.deleteClass(classItem.id!).subscribe(() => {
          this.loadClasses();
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xóa lớp học "${classItem.class_name}" thành công`
          });
        });
      }
    });
  }
  

  onView(classItem: ClassModel) {
    this.selectedClass = { ...classItem };
    this.drawerDetailVisible = true;
  }

  onSave() {
    if (!this.formClass) return;
  
    // Kiểm tra thông tin bắt buộc
    if (!this.formClass.class_code || !this.formClass.class_name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập Mã lớp và Tên lớp học'
      });
      return;
    }
  
    if (!this.formClass.course_id || this.formClass.course_id <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng chọn Khóa học'
      });
      return;
    }
  
    // Kiểm tra ngày bắt đầu và kết thúc
    if (this.formClass.start_date && this.formClass.end_date) {
      const start = new Date(this.formClass.start_date);
      const end = new Date(this.formClass.end_date);
      if (end < start) {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi ngày tháng',
          detail: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu'
        });
        return;
      }
    }
  
    this.saving = true;
    const done = () => (this.saving = false);
  
    // Loại bỏ các trường chỉ để hiển thị, không gửi lên backend
    const { course_name, lecturers, ...cleanForm } = this.formClass!;
    const payload: ClassModel = {
      ...cleanForm,
      start_date: this.formClass.start_date ? this.formatDate(this.formClass.start_date) : null,
      end_date: this.formClass.end_date ? this.formatDate(this.formClass.end_date) : null,
    } as ClassModel;
  
    // Nếu đang chỉnh sửa (update)
    if (this.selectedClass && this.selectedClass.id) {
      this.classService.updateClass(this.selectedClass.id, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật lớp học thành công'
          });
          this.loadClasses();
          this.drawerVisible = false;
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err?.error?.message || 'Không thể cập nhật lớp học'
          });
        },
        complete: done
      });
  
    // Nếu là thêm mới (create)
    } else {
      this.classService.addClass(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm lớp học thành công'
          });
          this.loadClasses();
          this.drawerVisible = false;
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err?.error?.message || 'Không thể thêm lớp học'
          });
        },
        complete: done
      });
    }
  }
  
  

  private formatDate(dateValue: any): string {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onDrawerHide() {
  this.formClass = null;
  this.drawerVisible = false;
}


  onClearFilters() {
    this.clearSearch();
  }

  resetForm() {
    this.formClass = this.createEmptyClass();
  }

  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = (input?.value || '').trim();
    
    this.searchQuery = value || '';
    this.showClearButton = (value || '').length > 0;
    
    if (this.searchTimer) clearTimeout(this.searchTimer);
    
    const debounceTime = value.length > 3 ? 300 : 500;
    
    this.searchTimer = setTimeout(() => {
      this.filterClasses(value);
    }, debounceTime);
  }

  private filterClasses(query: string) {
    if (!query || query.trim() === '') {
      this.filteredClasses = [...this.classes];
      this.cdr.detectChanges();
      return;
    }

    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      this.filteredClasses = [...this.searchCache.get(cacheKey)!];
      this.cdr.detectChanges();
      return;
    }

    const searchTerms = this.parseSearchQuery(query);
    const results = this.classes.filter(classItem => 
      this.advancedSearchInClass(classItem, searchTerms)
    );

    this.cacheSearchResults(cacheKey, results);
    this.filteredClasses = [...results];
    
    if (this.dt) {
      this.dt.clear();
    }
    
    this.cdr.detectChanges();
  }

  private cacheSearchResults(key: string, results: ClassModel[]) {
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

  private advancedSearchInClass(classItem: ClassModel, searchTerms: string[]): boolean {
    const searchableFields = [
      classItem.class_code?.toLowerCase() || '',
      classItem.class_name?.toLowerCase() || '',
      classItem.course_name?.toLowerCase() || '',
      classItem.description?.toLowerCase() || '',
      classItem.learning_outcomes?.toLowerCase() || '',
      classItem.status?.toLowerCase() || '',
      classItem.start_date?.toString() || '',
      classItem.end_date?.toString() || ''
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
  
    this.filteredClasses = [...this.classes];
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
