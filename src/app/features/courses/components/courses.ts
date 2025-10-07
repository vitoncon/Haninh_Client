import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CoursesService } from '../services/courses.service';
import { Course } from '../models/courses.model';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Table } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ClassService } from '../../class-management/services/class.service';
import { ClassModel } from '../../class-management/models/class.model';

@Component({
  selector: 'app-courses',
  templateUrl: 'courses.html',
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
    InputNumberModule,
    DialogModule,
    DrawerModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
  ],
  providers: [ConfirmationService],
  styleUrls: ['./courses.scss']
})
export class Courses implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  displayDialog: boolean = false; 
  drawerVisible: boolean = false;
  drawerDetailVisible: boolean = false;
  selectedCourse: Course | null = null;
  formCourse: Course | null = null;
  classesForCourse: any[] = [];
  newCourse: Course = {
    id: undefined,
    course_code: '',
    course_name: '',
    description: '',
    language: 'Tiếng Anh',
    level: 'Sơ cấp',
    duration_weeks: null,
    total_hours: null,
    tuition_fee: null,
    status: 'Đang hoạt động'
  };
  saving: boolean = false;
  loading: boolean = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  @ViewChild('dt', { static: false }) dt!: Table;
  private searchTimer: any = null;
  private searchCache: Map<string, Course[]> = new Map();
  private readonly CACHE_SIZE_LIMIT = 50;

  constructor(
    private coursesService: CoursesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private classService: ClassService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  private createEmptyCourse(): Course {
    return {
      id: undefined,
      course_code: '',
      course_name: '',
      description: '',
      language: 'Tiếng Anh',
      level: 'Sơ cấp',
      duration_weeks: null,
      total_hours: null,
      tuition_fee: null,
      status: 'Đang hoạt động'
    };
  }

  loadCourses() {
    this.loading = true;
    this.coursesService.getCourses().subscribe({
      next: (data) => {
        this.courses = data.map(course => ({
          ...course,
          tuition_fee: Number(course.tuition_fee)
        }));
        this.filteredCourses = [...this.courses];
        this.clearSearchCache();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách khóa học'
        });
        this.cdr.detectChanges();
      }
    });
  }
  onCreate() {
    this.selectedCourse = null;
    this.formCourse = this.createEmptyCourse();
    this.drawerVisible = true;
  }

  onDrawerHide() {
    this.formCourse = null;
    this.selectedCourse = null;
    this.displayDialog = false;
    this.drawerVisible = false;
  }

  onEdit(course: Course) {
    this.selectedCourse = { ...course };
    this.formCourse = { ...course };
    this.drawerVisible = true;  
  }

  onDelete(courseItem: Course) {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa khóa học <b>${courseItem.course_name}</b> không?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.coursesService.deleteCourse(courseItem.id!).subscribe(() => {
          this.loadCourses();
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xóa khóa học "${courseItem.course_name}" thành công`
          });
        });
      }
    });
  }  
  
  onView(course: Course) {
    this.selectedCourse = { ...course };
    this.drawerDetailVisible = true; 
    this.loadClassesForCourse(course.id as number);
  }

  private loadClassesForCourse(courseId: number) {
    if (!courseId) {
      this.classesForCourse = [];
      return;
    }
    this.classService.getClasses().subscribe({
      next: (all: ClassModel[]) => {
        this.classesForCourse = (all || []).filter(c => Number(c.course_id) === Number(courseId));
      },
      error: () => {
        this.classesForCourse = [];
      }
    });
  }

  onSave() {
    if (!this.formCourse) return;
    if (!this.formCourse.course_code || !this.formCourse.course_name) {
      this.messageService.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập Mã KH và Tên khóa học' });
      return;
    }

    this.saving = true;
    const done = () => { this.saving = false; };

    if (this.selectedCourse && this.selectedCourse.id) {
      this.coursesService.updateCourse(this.selectedCourse.id, this.formCourse).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật khóa học thành công' });
          this.loadCourses();
          this.drawerVisible = false; 
        },
        error: (err) => {
          console.error("Update error:", err);
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err?.error?.message || 'Không thể cập nhật khóa học' });
        },
        complete: done
      });
    } else {
      this.coursesService.addCourse(this.formCourse).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Thêm khóa học thành công' });
          this.loadCourses();
          this.drawerVisible = false; 
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err?.error?.message || 'Không thể thêm khóa học' });
        },
        complete: done
      });
    }
  }

  onClearFilters() {
    this.clearSearch();
  }

  resetForm() {
    this.newCourse = {
      id: undefined,
      course_code: '',
      course_name: '',
      description: '',
      language: 'Tiếng Anh',
      level: 'Sơ cấp',
      duration_weeks: null,
      total_hours: null,
      tuition_fee: null,
      status: 'Đang hoạt động'
    };
  }

  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = (input?.value || '').trim();

    this.searchQuery = value || '';
    this.showClearButton = (value || '').length > 0;
    
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const debounceTime = value.length > 3 ? 300 : 500;
    
    this.searchTimer = setTimeout(() => {
      this.filterCourses(value);
    }, debounceTime);
  }

  private filterCourses(query: string) {
    if (!query || query.trim() === '') {
      this.filteredCourses = [...this.courses];
      this.cdr.detectChanges();
      return;
    }
    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      this.filteredCourses = [...this.searchCache.get(cacheKey)!];
      this.cdr.detectChanges();
      return;
    }
    const searchTerms = this.parseSearchQuery(query);
    const results = this.courses.filter(course => 
      this.advancedSearchInCourse(course, searchTerms)
    );
    this.cacheSearchResults(cacheKey, results);
    this.filteredCourses = [...results];
    if (this.dt) {
      this.dt.clear();
    }
    
    this.cdr.detectChanges();
  }

  private cacheSearchResults(key: string, results: Course[]) {
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

  private advancedSearchInCourse(course: Course, searchTerms: string[]): boolean {
    const searchableFields = [
      course.course_code?.toLowerCase() || '',
      course.course_name?.toLowerCase() || '',
      course.language?.toLowerCase() || '',
      course.level?.toLowerCase() || '',
      course.description?.toLowerCase() || '',
      course.status?.toLowerCase() || '',
      course.tuition_fee?.toString() || '',
      course.duration_weeks?.toString() || '',
      course.total_hours?.toString() || ''
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
  
    this.filteredCourses = [...this.courses];
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
