import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
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
import { CardModule } from 'primeng/card';
import { ClassService } from '../../class-management/services/class.service';
import { ClassModel } from '../../class-management/models/class.model';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { CourseFilters, CourseStatistics } from '../models/courses.model';

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
    CardModule,
  ],
  providers: [ConfirmationService],
  styleUrls: ['./courses.scss']
})
export class Courses implements OnInit, OnDestroy {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  displayDialog: boolean = false; 
  drawerVisible: boolean = false;
  selectedCourse: Course | null = null;
  formCourse: Course | null = null;
  classesForCourse: any[] = [];
  newCourse: Course = this.createEmptyCourse();
  saving: boolean = false;
  loading: boolean = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  statistics: CourseStatistics | null = null;
  statsLoading: boolean = false;
  
  @ViewChild('dt', { static: false }) dt!: Table;
  
  // RxJS subjects for better memory management
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private searchCache: Map<string, Course[]> = new Map();

  constructor(
    private coursesService: CoursesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private classService: ClassService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeSearchSubscription();
    this.loadCourses();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearSearchCache();
  }

  private initializeSearchSubscription(): void {
    this.searchSubject$
      .pipe(
        debounceTime(this.SEARCH_DEBOUNCE_TIME),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => this.filterCourses(query));
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
      status: 'Đang hoạt động',
      
      // New fields
      prerequisites: '',
      learning_objectives: '',
      category: '',
      tags: []
    };
  }

  // Constants for better maintainability
  private readonly SEARCH_DEBOUNCE_TIME = 300;
  private readonly CACHE_SIZE_LIMIT = 50;
  private readonly DEFAULT_PAGE_SIZE = 5;

  loadCourses(): void {
    this.loading = true;
    this.coursesService.getCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.courses = this.processCoursesData(data);
          this.filteredCourses = [...this.courses];
          this.clearSearchCache();
          this.loading = false;
          // Reload statistics after loading courses
          this.loadStatistics();
        },
        error: (error) => {
          this.handleLoadCoursesError(error);
        }
      });
  }

  loadStatistics(): void {
    this.statsLoading = true;
    this.coursesService.getCourseStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
          this.statsLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          this.statsLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private processCoursesData(data: Course[]): Course[] {
    return data.map(course => ({
      ...course,
      tuition_fee: Number(course.tuition_fee) || null
    }));
  }

  private handleLoadCoursesError(error: any): void {
    console.error('Error loading courses:', error);
    this.loading = false;
    const errorMessage = error?.error?.message || 'Không thể tải danh sách khóa học';
    
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: errorMessage
    });
    
    this.cdr.detectChanges();
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

  onDelete(courseItem: Course): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa khóa học <b>${courseItem.course_name}</b> không?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.deleteCourse(courseItem);
      }
    });
  }

  private deleteCourse(courseItem: Course): void {
    if (!courseItem.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa khóa học này'
      });
      return;
    }

    this.coursesService.deleteCourse(courseItem.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xóa khóa học "${courseItem.course_name}" thành công`
          });
          this.loadCourses();
        },
        error: (error) => {
          this.handleDeleteError(error, courseItem.course_name);
        }
      });
  }

  private handleDeleteError(error: any, courseName: string): void {
    console.error('Error deleting course:', error);
    const errorMessage = error?.error?.message || 'Không thể xóa khóa học';
    
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: `${errorMessage}: "${courseName}"`
    });
  }  
  
  onView(course: Course) {
    if (course.id) {
      this.router.navigate(['/features/courses/detail', course.id]);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không thể xem chi tiết khóa học này'
      });
    }
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

  onSave(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    
    if (this.selectedCourse && this.selectedCourse.id) {
      this.updateCourse();
    } else {
      this.addCourse();
    }
  }

  private validateForm(): boolean {
    if (!this.formCourse) {
      this.showValidationError('Vui lòng điền đầy đủ thông tin khóa học');
      return false;
    }

    const errors: string[] = [];
    
    if (!this.formCourse.course_code?.trim()) {
      errors.push('Mã khóa học');
    }
    
    if (!this.formCourse.course_name?.trim()) {
      errors.push('Tên khóa học');
    }

    if (errors.length > 0) {
      this.showValidationError(`Vui lòng nhập: ${errors.join(', ')}`);
      return false;
    }

    return true;
  }

  private showValidationError(message: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Thiếu thông tin',
      detail: message
    });
  }

  private updateCourse(): void {
    if (!this.selectedCourse?.id || !this.formCourse) {
      return;
    }

    this.coursesService.updateCourse(this.selectedCourse.id, this.formCourse)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleSaveSuccess('Cập nhật khóa học thành công');
        },
        error: (error) => {
          this.handleSaveError(error, 'Không thể cập nhật khóa học');
        }
      });
  }

  private addCourse(): void {
    if (!this.formCourse) {
      return;
    }

    this.coursesService.addCourse(this.formCourse)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleSaveSuccess('Thêm khóa học thành công');
        },
        error: (error) => {
          this.handleSaveError(error, 'Không thể thêm khóa học');
        }
      });
  }

  private handleSaveSuccess(message: string): void {
    this.saving = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: message
    });
    this.loadCourses();
    this.drawerVisible = false;
  }

  private handleSaveError(error: any, defaultMessage: string): void {
    this.saving = false;
    console.error('Save error:', error);
    
    const errorMessage = error?.error?.message || defaultMessage;
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: errorMessage
    });
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

  onGlobalFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = (input?.value || '').trim();

    this.searchQuery = value;
    this.showClearButton = value.length > 0;
    
    this.searchSubject$.next(value);
  }


  forceRefresh(): void {
    this.loadCourses();
  }

  formatCurrency(value: number): string {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }

  private filterCourses(query: string): void {
    if (!query || query.trim() === '') {
      this.filteredCourses = [...this.courses];
      return;
    }

    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      this.filteredCourses = [...this.searchCache.get(cacheKey)!];
      return;
    }

    const searchTerms = this.parseSearchQuery(query);
    const results = this.courses.filter(course => 
      this.advancedSearchInCourse(course, searchTerms)
    );
    
    this.cacheSearchResults(cacheKey, results);
    this.filteredCourses = [...results];
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
    // Cache searchable fields for better performance
    const searchableText = [
      course.course_code,
      course.course_name,
      course.language,
      course.level,
      course.description,
      course.status
    ].filter(Boolean).join(' ').toLowerCase();

    const searchableNumbers = [
      course.tuition_fee,
      course.duration_weeks,
      course.total_hours
    ].filter(num => num !== null && num !== undefined).map(num => num!.toString());

    return searchTerms.every(term => 
      searchableText.includes(term.toLowerCase()) ||
      searchableNumbers.some(num => num.includes(term))
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

  clearSearch(): void {
    this.searchQuery = '';
    this.showClearButton = false;
    this.filteredCourses = [...this.courses];
  }

  private clearSearchCache() {
    this.searchCache.clear(); 
  }
}
