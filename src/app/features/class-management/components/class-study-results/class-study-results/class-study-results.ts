import { Component, Input, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

// PrimeNG Modules
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import * as XLSX from 'xlsx';

// Services and Models
import { StudyResultService } from '../../../../study-results/services/study-result.service';
import { StudyResultWithDetails, ClassStudyStatistics, ClassExamSummary } from '../../../../study-results/models/study-results.model';
import { ExamSkill } from '../../../../study-results/models/exam-results.model';
import { 
  Exam, 
  ExamWithSkills, 
  ExamResultsBySkills, 
  BulkExamCreation 
} from '../../../../study-results/models/exam-results.model';
import { ClassService } from '../../../services/class.service';
import { ClassStudentService } from '../../../services/class-student.service';
import { ExamManagementService, SkillUpdateData, DEFAULT_SKILL_SCORE, DEFAULT_SKILL_WEIGHT, CACHE_DURATION } from '../../../services/exam-management.service';
import { ExamErrorRecoveryService, OperationSnapshot, RollbackResult } from '../../../services/exam-error-recovery.service';
import { ExamCacheService, StateSnapshot } from '../../../services/exam-cache.service';
import { 
  EXAM_CONSTANTS, 
  SelectedSkill, 
  ExamFormData, 
  BulkExamFormData, 
  ExamOperationResult,
  ValidationResult,
  EXAM_TYPES,
  SKILL_TYPES,
  EXAM_STATUS,
  SKILL_SEVERITY_MAP,
  STATUS_SEVERITY_MAP,
  STATUS_LABEL_MAP,
  ExamType,
  SkillType,
  ExamStatus,
  SeverityType
} from '../../../constants/exam.constants';

@Component({
  selector: 'app-class-study-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RippleModule,
    TagModule,
    DialogModule,
    ToastModule,
    TooltipModule,
    CardModule,
    ConfirmDialogModule,
    DrawerModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    CheckboxModule,
    MessageModule,
    SplitButtonModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [ConfirmationService],
  templateUrl: './class-study-results.html',
  styleUrls: ['./class-study-results.scss']
})
export class ClassStudyResults implements OnInit, OnDestroy, AfterViewInit {
  @Input() classId!: number;
  @Input() className: string = '';

  // Route-based properties
  routeClassId: number | null = null;
  routeClassName: string = '';

  // Core data
  classExams: ExamWithSkills[] = [];
  filteredExams: ExamWithSkills[] = [];
  selectedExams: ExamWithSkills[] = [];
  loading: boolean = false;
  saving: boolean = false;

  // Class students data
  classStudents: any[] = [];
  studentsLoading: boolean = false;

  // Drawer states
  drawerVisible: boolean = false;
  showBulkExamDrawer: boolean = false;
  isEditMode: boolean = false;
  currentExam: ExamWithSkills | null = null;
  
  // Form data
  formExam: ExamWithSkills | null = null;
  
  // Skills selection data
  selectedSkills: SelectedSkill[] = [];

  // Bulk exam form
  bulkExamForm: BulkExamFormData = {
    exam: {
      exam_name: '',
      exam_type: EXAM_TYPES.PERIODIC,
      exam_date: new Date(),
      description: '',
      total_max_score: EXAM_CONSTANTS.MAX_SCORE,
      status: EXAM_STATUS.DRAFT
    },
    skills: [
      { skill_type: SKILL_TYPES.LISTENING, max_score: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE, weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT, order_index: 1 },
      { skill_type: SKILL_TYPES.SPEAKING, max_score: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE, weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT, order_index: 2 },
      { skill_type: SKILL_TYPES.READING, max_score: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE, weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT, order_index: 3 },
      { skill_type: SKILL_TYPES.WRITING, max_score: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE, weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT, order_index: 4 }
    ]
  };

  // Options
  examTypeOptions = [
    { label: EXAM_TYPES.PERIODIC, value: EXAM_TYPES.PERIODIC },
    { label: EXAM_TYPES.MIDTERM, value: EXAM_TYPES.MIDTERM },
    { label: EXAM_TYPES.FINAL, value: EXAM_TYPES.FINAL },
    { label: EXAM_TYPES.LEVEL, value: EXAM_TYPES.LEVEL },
    { label: EXAM_TYPES.CERTIFICATE, value: EXAM_TYPES.CERTIFICATE }
  ];

  examStatusOptions = [
    { label: STATUS_LABEL_MAP[EXAM_STATUS.DRAFT], value: EXAM_STATUS.DRAFT },
    { label: STATUS_LABEL_MAP[EXAM_STATUS.IN_PROGRESS], value: EXAM_STATUS.IN_PROGRESS },
    { label: STATUS_LABEL_MAP[EXAM_STATUS.REVIEW], value: EXAM_STATUS.REVIEW },
    { label: STATUS_LABEL_MAP[EXAM_STATUS.COMPLETED], value: EXAM_STATUS.COMPLETED },
    { label: STATUS_LABEL_MAP[EXAM_STATUS.CANCELLED], value: EXAM_STATUS.CANCELLED }
  ];

  skillTypeOptions = [
    { label: SKILL_TYPES.LISTENING, value: SKILL_TYPES.LISTENING },
    { label: SKILL_TYPES.SPEAKING, value: SKILL_TYPES.SPEAKING },
    { label: SKILL_TYPES.READING, value: SKILL_TYPES.READING },
    { label: SKILL_TYPES.WRITING, value: SKILL_TYPES.WRITING },
    { label: SKILL_TYPES.COMPREHENSIVE, value: SKILL_TYPES.COMPREHENSIVE }
  ];


  // Menu items for split button
  examMenuItems = [
    { label: 'Bài kiểm tra đơn', icon: 'pi pi-plus', command: () => this.onAddExam('single') },
    { label: 'Bài kiểm tra 4 kỹ năng', icon: 'pi pi-plus-circle', command: () => this.onAddExam('bulk') }
  ];

  // Search and filtering
  searchQuery: string = '';
  showClearButton: boolean = false;
  searchSubject$ = new Subject<string>();

  // Table reference
  @ViewChild('dt', { static: false }) dt!: Table;

  // RxJS subjects for better memory management
  private destroy$ = new Subject<void>();

  constructor(
    private studyResultService: StudyResultService,
    private examManagementService: ExamManagementService,
    private examErrorRecoveryService: ExamErrorRecoveryService,
    private examCacheService: ExamCacheService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private classService: ClassService,
    private classStudentService: ClassStudentService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize selectedSkills array
    this.initializeSelectedSkills();
    this.initializeSearchSubscription();
    // Temporarily disable state subscription to avoid assertion errors
    // this.initializeStateSubscription();
  }

  ngOnInit(): void {
    // Check if classId is provided via @Input (used as child component)
    if (this.classId) {
      this.loadClassExams();
      this.loadClassStudents();
      return;
    }

    // If not provided via @Input, try to get from route params (used as route component)
    this.route.params.subscribe(params => {
      this.routeClassId = +params['id'];
      if (this.routeClassId) {
        this.loadClassExams();
        this.loadClassStudents();
        this.loadClassName();
      }
    });
  }

  ngAfterViewInit(): void {
    // Subscribe to router events to detect when navigating back from exam detail
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Force re-render table when returning to this page
        // This fixes the overlapping skill tags issue
        setTimeout(() => {
          if (this.dt) {
            this.dt.reset(); // Reset table to force re-render
            this.cdr.detectChanges(); // Force change detection
          }
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // Get the effective classId (either from @Input or route)
  get effectiveClassId(): number {
    return this.classId || this.routeClassId || 0;
  }

  // Get the effective className (either from @Input or route)
  get effectiveClassName(): string {
    return this.className || this.routeClassName || '';
  }

  // Navigation methods
  onBackToClassDetail(): void {
    const classId = this.effectiveClassId;
    if (classId) {
      // Navigate back to class detail without tab parameter (will reset to default tab)
      this.router.navigate(['/features/class/detail', classId]);
    } else {
      this.router.navigate(['/features/class']);
    }
  }

  // Load class name from route or service
  private loadClassName(): void {
    if (!this.routeClassId) return;
    
    // Load class details to get the actual class name
    this.classService.getClasses().subscribe({
      next: (response: any) => {
        let classData = null;
        if (Array.isArray(response)) {
          classData = response.find((c: any) => c.id === this.routeClassId);
        } else if (response?.data) {
          if (Array.isArray(response.data)) {
            classData = response.data.find((c: any) => c.id === this.routeClassId);
          } else {
            classData = response.data;
          }
        } else if (response?.id === this.routeClassId) {
          classData = response;
        }
        
        if (classData && classData.class_name) {
          this.className = classData.class_name;
        } else {
          this.className = `Lớp ${this.routeClassId}`;
        }
      },
      error: (error) => {
        this.className = `Lớp ${this.routeClassId}`;
      }
    });
  }

  // Initialize search subscription with debounce
  private initializeSearchSubscription(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery = query;
        this.showClearButton = query.length > 0;
        this.onGlobalFilter({ target: { value: query } } as any);
      });
  }

  // Initialize state subscription for reactive updates
  private initializeStateSubscription(): void {
    // Subscribe to cache state changes
    this.examCacheService.getState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: StateSnapshot) => {
        // Only update if data has actually changed
        if (JSON.stringify(this.classExams) !== JSON.stringify(state.exams)) {
          this.classExams = [...state.exams];
        }
        
        if (JSON.stringify(this.classStudents) !== JSON.stringify(state.students)) {
          this.classStudents = [...state.students];
        }
        
        if (this.loading !== state.loading) {
          this.loading = state.loading;
        }
        
        if (state.error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: state.error
          });
        }
      });
  }

  // Global filter for table
  onGlobalFilter(event: any): void {
    if (this.dt) {
      this.dt.filterGlobal(event.target.value, 'contains');
    }
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery = '';
    this.showClearButton = false;
    if (this.dt) {
      this.dt.filterGlobal('', 'contains');
    }
  }

  // Force refresh data
  forceRefresh(): void {
    const classId = this.effectiveClassId;
    if (classId) {
      this.examCacheService.invalidateClassCache(classId);
      this.loadClassExams();
      this.loadClassStudents();
      
      // Reset sorting và filtering về mặc định
      this.resetTableState();
    }
  }

  // Public method để reset table state (có thể gọi từ bên ngoài)
  resetTableToDefault(): void {
    this.resetTableState();
  }

  // Reset table state (sorting, filtering, pagination)
  private resetTableState(): void {
    // Reset search query trước
    this.searchQuery = '';
    this.showClearButton = false;
    
    // Reset table state sau khi data đã load
    setTimeout(() => {
      if (this.dt) {
        // Reset sorting về mặc định (exam_date desc)
        this.dt.sortField = 'exam_date';
        this.dt.sortOrder = -1; // Descending
        
        // Reset filtering
        this.dt.filterGlobal('', 'contains');
        
        // Reset pagination về trang đầu
        this.dt.first = 0;
        
        // Trigger table refresh để apply changes
        this.dt.reset();
      }
    }, 100); // Delay nhỏ để đảm bảo data đã load xong
  }

  // Load class students
  loadClassStudents(): void {
    const classId = this.effectiveClassId;
    if (!classId) {
      this.classStudents = [];
      return;
    }

    // Check cache first
    const cachedStudents = this.examCacheService.getCachedStudents(classId);
    if (cachedStudents) {
      this.classStudents = cachedStudents;
      this.updateExamDataWithStudentCount();
      return;
    }

    this.studentsLoading = true;
    this.classStudentService.getStudentsByClass(classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Process response data
          let students: any[] = [];
          if (Array.isArray(response)) {
            students = response;
          } else if (response && typeof response === 'object' && 'data' in response) {
            const responseData = (response as any).data;
            if (Array.isArray(responseData)) {
              students = responseData;
            } else if (responseData) {
              students = [responseData];
            }
          }
          
          // Filter students for current class - more flexible filtering
          const filteredStudents = students.filter((student: any) => {
            // Check if student belongs to current class
            const belongsToClass = student.class_id === classId || 
                                 student.classId === classId || 
                                 student.class?.id === classId;
            
            // Check if student data exists (either nested or direct)
            const hasStudentData = student.student || 
                                 student.student_id || 
                                 student.full_name || 
                                 student.student_name;
            
            return belongsToClass && hasStudentData;
          });
          
          // Fallback: if no students found, try without strict filtering
          if (filteredStudents.length === 0 && students.length > 0) {
            this.classStudents = students.filter((student: any) => {
              // Just check if it has any student-like data
              return student.student || student.student_id || student.full_name || student.student_name;
            });
          } else {
            this.classStudents = filteredStudents;
          }
          
          // Cache the results
          this.examCacheService.cacheStudents(classId, this.classStudents);
          
          // Update exam data with correct student count
          this.updateExamDataWithStudentCount();
          
          this.studentsLoading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Không thể tải danh sách học viên của lớp'
          });
          this.classStudents = [];
          this.studentsLoading = false;
        }
      });
  }

  loadClassExams(): void {
    const classId = this.effectiveClassId;
    if (!classId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID lớp học'
      });
      return;
    }

    // Check cache first
    const cachedExams = this.examCacheService.getCachedExams(classId);
    if (cachedExams) {
      this.classExams = cachedExams;
      this.filteredExams = [...this.classExams];
      this.updateExamDataWithStudentCount();
      return;
    }

    // Update loading state
    this.loading = true;
    
    // Load exams with skills using new API
    this.studyResultService.getExams({ class_id: classId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exams: ExamWithSkills[]) => {
          // Validate and process exam data
          const processedExams = this.processExamData(exams);
          
          // Cache the results
          this.examCacheService.cacheExams(classId, processedExams);
          
          // Update local data
          this.classExams = processedExams;
          this.filteredExams = [...this.classExams];
          
          // Update exam data with current student count
          this.updateExamDataWithStudentCount();
          
          // Update loading state
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách bài kiểm tra'
          });
        }
      });
  }

  private processExamData(exams: ExamWithSkills[]): ExamWithSkills[] {
    if (!exams || !Array.isArray(exams)) {
      return [];
    }

    return exams.map(exam => {
      // ✅ Filter out soft-deleted skills
      const activeSkills = (exam.exam_skills || []).filter(skill => {
        const isDeleted = skill.is_deleted;
        return !isDeleted || (isDeleted as any) !== 1 && (isDeleted as any) !== '1' && (isDeleted as any) !== true;
      });
      
      const processedExam = {
        ...exam,
        exam_skills: activeSkills,
        average_score: this.validateScore(exam.average_score),
        total_students: this.classStudents.length || exam.total_students || 0,
        exam_date: this.validateDate(exam.exam_date)
      };
      
      return processedExam;
    });
  }

  private validateScore(score: any): number {
    const numScore = typeof score === 'number' ? score : parseFloat(score);
    return !isNaN(numScore) && isFinite(numScore) && numScore >= 0 ? numScore : 0;
  }

  private validateDate(date: any): string {
    if (!date) return new Date().toISOString().split('T')[0];
    
    try {
      // If date is already in YYYY-MM-DD format, return it as is
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        // Check if it's valid by trying to parse it
        const parts = date.split(' ')[0].split('-'); // Handle date with time parts
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          const testDate = new Date(year, month, day);
          // Verify the date is valid and matches the input
          if (testDate.getFullYear() === year && 
              testDate.getMonth() === month && 
              testDate.getDate() === day) {
            return parts[0] + '-' + parts[1] + '-' + parts[2]; // Return original format
          }
        }
      }
      
      // If date is in ISO format with timezone (like "2025-09-30T00:00:00.000Z")
      if (typeof date === 'string' && date.includes('T') && date.includes('Z')) {
        // Extract just the date part without timezone conversion
        const datePart = date.split('T')[0];
        return datePart;
      }
      
      // Otherwise, try to parse as Date object
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return dateObj.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  // Action methods for exam management
  onAddExam(examType: 'single' | 'bulk' = 'single'): void {
    this.isEditMode = false;
    this.currentExam = null;
    
    if (examType === 'bulk') {
      this.resetBulkForm();
      this.showBulkExamDrawer = true;
    } else {
      this.resetForm();
      this.drawerVisible = true;
    }
  }

  onRefresh(): void {
    this.forceRefresh();
  }

  // Check if exam can be viewed in detail
  canViewExamDetail(exam: ExamWithSkills): boolean {
    // Có thể xem detail nếu:
    // 1. Exam có ID
    // 2. Exam có ít nhất 1 skill
    // 3. Exam không bị cancelled
    // 4. User có quyền xem class
    return !!(exam.id && 
              exam.exam_skills && 
              exam.exam_skills.length > 0 && 
              exam.status !== 'cancelled' &&
              this.hasViewPermission());
  }

  // Check if user has permission to view exam details
  private hasViewPermission(): boolean {
    // TODO: Implement actual permission check based on user role
    // For now, all users can view exam details
    return true;
  }

  onViewExamDetail(exam: ExamWithSkills): void {
    // Navigate to exam detail page with 4-skill view
    if (this.effectiveClassId && exam.id) {
      // Invalidate cache for this class to ensure fresh data when returning
      // This prevents data overlap when navigating back to exam detail
      this.examCacheService.invalidateClassCache(this.effectiveClassId);
      
      // Show loading message
      this.messageService.add({
        severity: 'info',
        summary: 'Đang chuyển trang',
        detail: `Đang tải chi tiết bài kiểm tra: ${exam.exam_name}`,
        life: 2000
      });
      
      // Navigate to exam detail
      this.router.navigate([`/features/class/${this.effectiveClassId}/study-result/${exam.id}`]);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xem chi tiết bài kiểm tra. Thiếu thông tin lớp học hoặc bài kiểm tra.'
      });
    }
  }

  async onEditExam(exam: ExamWithSkills): Promise<void> {
    this.isEditMode = true;
    this.currentExam = exam;
    
    // ✅ LOAD DỮ LIỆU VÀ TÍNH ĐIỂM TRƯỚC KHI MỞ DRAWER
    await this.loadExamToForm(exam);
    
    // ✅ MỞ DRAWER SAU KHI ĐÃ TÍNH TOÁN XONG
    this.drawerVisible = true;
  }

  onDeleteExam(exam: ExamWithSkills): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa bài kiểm tra '${exam.exam_name}' không?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      rejectIcon: 'pi pi-times',
      acceptIcon: 'pi pi-check',
      accept: () => {
        this.studyResultService.deleteExam(exam.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xóa bài kiểm tra: ${exam.exam_name}`
              });
              this.loadClassExams();
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể xóa bài kiểm tra'
              });
            }
          });
      },
    });
  }

  // Form methods
  resetForm(): void {
    this.formExam = this.createEmptyExam();
    this.initializeSelectedSkills();
  }

  resetBulkForm(): void {
    this.bulkExamForm = {
      exam: {
        exam_name: '',
        exam_type: EXAM_TYPES.PERIODIC,
        exam_date: new Date(),
        description: '',
        total_max_score: EXAM_CONSTANTS.MAX_SCORE,
        status: EXAM_STATUS.DRAFT
      },
      skills: [
        { skill_type: SKILL_TYPES.LISTENING, max_score: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE, weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT, order_index: 1 },
        { skill_type: SKILL_TYPES.SPEAKING, max_score: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE, weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT, order_index: 2 },
        { skill_type: SKILL_TYPES.READING, max_score: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE, weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT, order_index: 3 },
        { skill_type: SKILL_TYPES.WRITING, max_score: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE, weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT, order_index: 4 }
      ]
    };
  }

  private createEmptyExam(): ExamWithSkills {
    return {
      id: undefined,
      class_id: this.effectiveClassId,
      exam_name: '',
      exam_type: 'Kiểm tra định kỳ',
      exam_date: new Date().toISOString().split('T')[0],
      language: 'Tiếng Anh',
      description: '',
      total_max_score: 100,
      total_students: this.classStudents.length,
      status: 'draft',
      average_score: 0,
      exam_skills: []
    };
  }

  // Skills selection methods
  initializeSelectedSkills(): void {
    this.selectedSkills = this.skillTypeOptions.map((skill, index) => ({
      skillType: skill.value as SkillType,
      selected: false,
      maxScore: EXAM_CONSTANTS.DEFAULT_SKILL_SCORE,
      weight: EXAM_CONSTANTS.DEFAULT_SKILL_WEIGHT,
      orderIndex: index + 1,
      hasStudentScores: false
    }));
  }

  // Check if a skill has student scores
  async checkSkillHasStudentScores(examId: number, skillType: string): Promise<boolean> {
    try {
      return await this.examManagementService.checkSkillHasStudentScores(examId, skillType).toPromise() || false;
    } catch (error) {
      console.error('Error checking skill scores:', error);
      return false;
    }
  }

  // Update skill score status for all skills
  async updateSkillScoreStatus(examId: number): Promise<void> {
    if (!examId) return;

    for (let i = 0; i < this.selectedSkills.length; i++) {
      const skill = this.selectedSkills[i];
      if (skill.selected) {
        skill.hasStudentScores = await this.checkSkillHasStudentScores(examId, skill.skillType);
      }
    }
  }

  onSkillChange(skillType: string, event: any): void {
    const skillIndex = this.selectedSkills.findIndex(s => s.skillType === skillType);
    if (skillIndex !== -1 && this.selectedSkills[skillIndex]) {
      const skill = this.selectedSkills[skillIndex];
      
      // Business rule: If exam is "Completed", disable all editing
      if (this.currentExam?.status === 'completed') {
        this.messageService.add({
          severity: 'warn',
          summary: 'Không thể chỉnh sửa',
          detail: 'Không thể chỉnh sửa bài kiểm tra đã hoàn thành'
        });
        return;
      }

      // Business rule: If trying to uncheck a skill that has student scores, prevent it
      if (!event.checked && skill.hasStudentScores) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Không thể bỏ chọn',
          detail: 'Cannot remove a skill that already has student scores.'
        });
        return;
      }

      // Allow the change
      skill.selected = event.checked;
      this.updateTotalMaxScore();
    }
  }

  updateTotalMaxScore(): void {
    if (!this.selectedSkills || this.selectedSkills.length === 0) {
      if (this.formExam) {
        this.formExam.total_max_score = 0;
      }
      return;
    }
    
    const selectedSkills = this.selectedSkills.filter(skill => skill && skill.selected);
    
    const totalScore = selectedSkills.reduce((sum, skill) => {
      const score = skill.maxScore || 0;
      // ✅ CONVERT STRING TO NUMBER nếu cần
      const numericScore = typeof score === 'string' ? parseFloat(score) : score;
      return sum + (typeof numericScore === 'number' && !isNaN(numericScore) ? numericScore : 0);
    }, 0);
    
    if (this.formExam) {
      this.formExam.total_max_score = totalScore;
    }
    
    // Mark for change detection
    this.cdr.markForCheck();
  }

  getSelectedSkillsCount(): number {
    if (!this.selectedSkills || this.selectedSkills.length === 0) return 0;
    return this.selectedSkills.filter(skill => skill && skill.selected).length;
  }

  getSelectedSkillsForSubmission(): Array<{
    skill_type: 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp';
    max_score: number;
    weight: number;
    order_index: number;
    total_students: number;
  }> {
    if (!this.selectedSkills || this.selectedSkills.length === 0) return [];
    
    return this.selectedSkills
      .filter(skill => skill && skill.selected)
      .map(skill => ({
        skill_type: skill.skillType as 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp',
        max_score: skill.maxScore,
        weight: skill.weight,
        order_index: skill.orderIndex,
        total_students: this.classStudents.length
      }));
  }

  // Helper methods for safe template binding
  getSkillSelected(index: number): boolean {
    return this.selectedSkills && this.selectedSkills[index] ? this.selectedSkills[index].selected : false;
  }

  // Check if a skill can be unchecked (not disabled by business rules)
  canUncheckSkill(index: number): boolean {
    if (!this.selectedSkills || !this.selectedSkills[index]) return false;
    
    const skill = this.selectedSkills[index];
    
    // If exam is completed, no editing allowed
    if (this.currentExam?.status === 'completed') {
      return false;
    }
    
    // If skill has student scores, cannot uncheck
    if (skill.hasStudentScores) {
      return false;
    }
    
    return true;
  }

  // Validate exam status change
  validateStatusChange(newStatus: string): ValidationResult {
    const errors: string[] = [];
    
    if (!this.currentExam) {
      return { isValid: true, errors: [] }; // New exam, no validation needed
    }
    
    const currentStatus = this.currentExam.status;
    
          // Business rules for status transitions
    switch (currentStatus) {
      case 'draft':
        if (newStatus === 'in_progress') {
          // Validate that exam has required data to be in progress
          if (!this.formExam?.exam_name?.trim()) {
            errors.push('Tên bài kiểm tra không được để trống');
          }
          if (!this.formExam?.exam_date) {
            errors.push('Ngày thi không được để trống');
          }
          if (!this.hasSelectedSkills()) {
            errors.push('Phải chọn ít nhất một kỹ năng');
          }
          if ((this.formExam?.total_max_score ?? 0) <= 0) {
            errors.push('Tổng điểm tối đa phải lớn hơn 0');
          }
        }
        break;
        
      case 'in_progress':
        if (newStatus === 'completed' || newStatus === 'review') {
          // Validate that exam can be completed
          if (this.hasStudentScores()) {
            // Check if all students have scores
            // This would need to be implemented based on your business logic
          }
        }
        break;
        
      case 'completed':
      case 'cancelled':
        errors.push('Không thể thay đổi trạng thái của bài kiểm tra đã hoàn thành hoặc hủy bỏ');
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Check if exam has selected skills
  private hasSelectedSkills(): boolean {
    return this.selectedSkills?.some(skill => skill.selected) || false;
  }

  // Check if exam has student scores (placeholder for future implementation)
  private hasStudentScores(): boolean {
    // TODO: Implement check for student scores
    return false;
  }

  // Log status change for audit
  private logStatusChange(examId: number, oldStatus: string, newStatus: string, reason?: string): void {
    const logData = {
      exam_id: examId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: 'current_user', // TODO: Get actual user ID
      changed_at: new Date().toISOString(),
      reason: reason || 'Status changed via UI',
      ip_address: 'client_ip', // TODO: Get actual IP
      user_agent: navigator.userAgent
    };
    
    // TODO: Send to audit service
    // this.auditService.logStatusChange(logData).subscribe();
  }

  // Update exam status with audit logging
  updateExamStatus(newStatus: string, reason?: string): void {
    if (!this.currentExam) return;
    
    const oldStatus = this.currentExam.status;
    
    // Validate status change
    const statusValidation = this.validateStatusChange(newStatus);
    if (!statusValidation.isValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Không thể thay đổi trạng thái',
        detail: statusValidation.errors.join(', ')
      });
      return;
    }
    
    this.saving = true;
    this.examManagementService.updateExamStatus(this.currentExam.id!, newStatus, reason)
      .subscribe({
        next: (response) => {
          // Log the change
          this.logStatusChange(this.currentExam!.id!, oldStatus, newStatus, reason);
          
          // Update local data
          this.currentExam!.status = newStatus as 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled';
          if (this.formExam) {
            this.formExam.status = newStatus as 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled';
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Cập nhật thành công',
            detail: `Trạng thái bài kiểm tra đã được thay đổi từ "${STATUS_LABEL_MAP[oldStatus as ExamStatus]}" thành "${STATUS_LABEL_MAP[newStatus as ExamStatus]}"`
          });
          
          this.saving = false;
        },
        error: (error) => {
          console.error('Error updating exam status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi cập nhật',
            detail: 'Không thể cập nhật trạng thái bài kiểm tra'
          });
          this.saving = false;
        }
      });
  }

  // Handle status change event
  onStatusChange(event: any): void {
    const newStatus = event.value;
    if (!this.currentExam || newStatus === this.currentExam.status) return;
    
    // Show confirmation dialog for important status changes
    if (newStatus === 'in_progress' || newStatus === 'completed' || newStatus === 'cancelled' || newStatus === 'review') {
      this.confirmStatusChange(newStatus);
    } else {
      // Direct update for minor changes
      this.updateExamStatus(newStatus);
    }
  }

  // Confirm status change with user
  private confirmStatusChange(newStatus: string): void {
    if (!this.currentExam) return;
    
    const statusLabel = STATUS_LABEL_MAP[newStatus as ExamStatus];
    const currentStatusLabel = STATUS_LABEL_MAP[this.currentExam.status as ExamStatus];
    
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn thay đổi trạng thái từ "${currentStatusLabel}" thành "${statusLabel}"?`,
      header: 'Xác nhận thay đổi trạng thái',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xác nhận',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text',
      rejectIcon: 'pi pi-times',
      acceptIcon: 'pi pi-check',
      accept: () => {
        this.updateExamStatus(newStatus, `Changed from ${currentStatusLabel} to ${statusLabel}`);
      },
      reject: () => {
        // Revert the form value
        if (this.formExam) {
          this.formExam.status = this.currentExam!.status;
        }
      }
    });
  }

  // Check if exam editing is disabled
  isExamEditingDisabled(): boolean {
    return this.currentExam?.status === 'completed';
  }

  canChangeStatus(): boolean {
    if (!this.hasStatusChangePermission()) return false;
    if (!this.currentExam) return true; // New exam, can set any status
    
    // Business rules for status changes
    const currentStatus = this.currentExam.status;
    
    // Can always change from draft
    if (currentStatus === 'draft') return true;
    
    // Can change from in_progress to review, completed or cancelled
    if (currentStatus === 'in_progress') return true;
    
    // Cannot change from completed or cancelled
    if (currentStatus === 'completed' || currentStatus === 'cancelled') return false;
    
    return true;
  }

  // Check if user has permission to change exam status
  hasStatusChangePermission(): boolean {
    // TODO: Implement actual permission check based on user role
    // For now, return true (all users can change status)
    // In production, this should check user roles/permissions
    
    // Example implementation:
    // const userRole = this.authService.getCurrentUserRole();
    // return ['admin', 'teacher', 'manager'].includes(userRole);
    
    return true;
  }

  // Check if user can publish exam (draft -> active)
  canPublishExam(): boolean {
    if (!this.hasStatusChangePermission()) return false;
    if (!this.currentExam) return true; // New exam
    
    return this.currentExam.status === 'draft' && this.canChangeStatus();
  }

  // Check if user can complete exam (in_progress -> completed)
  canCompleteExam(): boolean {
    if (!this.hasStatusChangePermission()) return false;
    if (!this.currentExam) return false;
    
    return this.currentExam.status === 'in_progress' && this.canChangeStatus();
  }

  // Check if user can cancel exam
  canCancelExam(): boolean {
    if (!this.hasStatusChangePermission()) return false;
    if (!this.currentExam) return true; // New exam
    
    return ['draft', 'in_progress'].includes(this.currentExam.status) && this.canChangeStatus();
  }

  // Get available status options based on current status
  getAvailableStatusOptions(): any[] {
    if (!this.currentExam) return this.examStatusOptions; // New exam, all options available
    
    const currentStatus = this.currentExam.status;
    const availableOptions = [];
    
    switch (currentStatus) {
      case 'draft':
        availableOptions.push(
          { label: STATUS_LABEL_MAP[EXAM_STATUS.DRAFT], value: EXAM_STATUS.DRAFT },
          { label: STATUS_LABEL_MAP[EXAM_STATUS.IN_PROGRESS], value: EXAM_STATUS.IN_PROGRESS },
          { label: STATUS_LABEL_MAP[EXAM_STATUS.CANCELLED], value: EXAM_STATUS.CANCELLED }
        );
        break;
      case 'in_progress':
        availableOptions.push(
          { label: STATUS_LABEL_MAP[EXAM_STATUS.IN_PROGRESS], value: EXAM_STATUS.IN_PROGRESS },
          { label: STATUS_LABEL_MAP[EXAM_STATUS.REVIEW], value: EXAM_STATUS.REVIEW },
          { label: STATUS_LABEL_MAP[EXAM_STATUS.COMPLETED], value: EXAM_STATUS.COMPLETED },
          { label: STATUS_LABEL_MAP[EXAM_STATUS.CANCELLED], value: EXAM_STATUS.CANCELLED }
        );
        break;
      case 'completed':
      case 'cancelled':
        // Cannot change status once completed or cancelled
        availableOptions.push(
          { label: STATUS_LABEL_MAP[currentStatus as ExamStatus], value: currentStatus }
        );
        break;
      default:
        return this.examStatusOptions;
    }
    
    return availableOptions;
  }

  // Get tooltip message for disabled skill checkbox
  getSkillTooltip(index: number): string {
    if (!this.selectedSkills || !this.selectedSkills[index]) return '';
    
    const skill = this.selectedSkills[index];
    
    if (this.currentExam?.status === 'completed') {
      return 'Không thể chỉnh sửa bài kiểm tra đã hoàn thành';
    }
    
    if (skill.hasStudentScores) {
      return 'Cannot remove a skill that already has student scores.';
    }
    
    return '';
  }

  setSkillSelected(index: number, value: boolean): void {
    if (this.selectedSkills && this.selectedSkills[index]) {
      const skill = this.selectedSkills[index];
      
      // Business rule: If exam is "Completed", disable all editing
      if (this.currentExam?.status === 'completed') {
        this.messageService.add({
          severity: 'warn',
          summary: 'Không thể chỉnh sửa',
          detail: 'Không thể chỉnh sửa bài kiểm tra đã hoàn thành'
        });
        return;
      }

      // Business rule: If trying to uncheck a skill that has student scores, prevent it
      if (!value && skill.hasStudentScores) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Không thể bỏ chọn',
          detail: 'Cannot remove a skill that already has student scores.'
        });
        return;
      }

      // Allow the change
      skill.selected = value;
      this.updateTotalMaxScore();
    }
  }

  getSkillMaxScore(index: number): number {
    return this.selectedSkills && this.selectedSkills[index] ? this.selectedSkills[index].maxScore : 0;
  }

  setSkillMaxScore(index: number, value: number): void {
    if (this.selectedSkills && this.selectedSkills[index]) {
      this.selectedSkills[index].maxScore = value;
      this.updateTotalMaxScore();
    }
  }

  async loadExamToForm(exam: ExamWithSkills): Promise<void> {
    this.formExam = { ...exam };
    
    // ✅ KHỞI TẠO TRƯỚC
    this.initializeSelectedSkills();
    
    // ✅ LOAD SKILLS VÀ TÍCH NGAY LẬP TỨC (chỉ load skills active)
    if (exam.exam_skills && exam.exam_skills.length > 0) {
      // Filter out soft-deleted skills
      const activeSkills = exam.exam_skills.filter(skill => !skill.is_deleted);
      
      activeSkills.forEach(examSkill => {
        // Find the index in skillTypeOptions first
        const optionIndex = this.skillTypeOptions.findIndex(option => option.value === examSkill.skill_type);
        
        if (optionIndex !== -1) {
          // ✅ ĐẢM BẢO selectedSkills[optionIndex] TỒN TẠI
          if (!this.selectedSkills[optionIndex]) {
            this.selectedSkills[optionIndex] = {
              skillType: examSkill.skill_type,
              selected: false,
              maxScore: 0,
              weight: 1.0,
              orderIndex: optionIndex + 1,
              hasStudentScores: false
            };
          }
          
          // ✅ CẬP NHẬT VỚI DỮ LIỆU TỪ DATABASE
          this.selectedSkills[optionIndex] = {
            skillType: examSkill.skill_type,
            selected: true, // ✅ TÍCH NGAY
            maxScore: typeof examSkill.max_score === 'string' ? parseFloat(examSkill.max_score) : (examSkill.max_score || 25), // ✅ CONVERT TO NUMBER
            weight: typeof examSkill.weight === 'string' ? parseFloat(examSkill.weight) : (examSkill.weight || 1.0),
            orderIndex: examSkill.order_index || (optionIndex + 1),
            hasStudentScores: false // Will be updated below
          };
        }
      });
    }
    
    // ✅ CHECK STUDENT SCORES FOR EACH SELECTED SKILL
    if (exam.id) {
      await this.updateSkillScoreStatus(exam.id);
    }
    
    // ✅ TÍNH ĐIỂM NGAY SAU KHI LOAD XONG
    this.updateTotalMaxScore();
  }

  onSaveExam(): void {
    if (this.isEditMode) {
      this.updateExam();
    } else {
      this.createExam();
    }
  }

  onSaveBulkExam(): void {
    this.createBulkExam();
  }

  createExam(): void {
    if (!this.formExam) return;

    // Validate form data using service
    const validation = this.examManagementService.validateExamData(
      this.formExam as Exam, 
      this.getSelectedSkillsForSubmission()
    );
    
    if (!validation.isValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi validation',
        detail: validation.errors.join(', ')
      });
      return;
    }

    const examData: Exam = {
      class_id: this.effectiveClassId,
      exam_name: this.formExam.exam_name.trim(),
      exam_type: this.formExam.exam_type as any,
      exam_date: this.formExam.exam_date,
      language: 'Tiếng Anh',
      description: this.formExam.description?.trim() || '',
      total_max_score: this.formExam.total_max_score,
      total_students: this.classStudents.length,
      status: this.formExam.status as any
    };

    const skillsData = this.getSelectedSkillsForSubmission();

    this.saving = true;
    this.examManagementService.createExamWithSkills(examData, skillsData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exam) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã thêm bài kiểm tra mới'
          });
          this.drawerVisible = false;
          this.resetForm();
          this.forceRefresh();
          this.saving = false;
        },
        error: (error) => {
          this.handleCreateExamError(error);
          this.saving = false;
        }
      });
  }

  private validateExamForm(): boolean {
    if (!this.formExam) return false;

    const errors: string[] = [];

    if (!this.formExam.exam_name?.trim()) {
      errors.push('Tên bài kiểm tra không được để trống');
    }

    if (!this.formExam.exam_type) {
      errors.push('Loại kiểm tra không được để trống');
    }

    if (this.formExam.total_max_score <= 0) {
      errors.push('Điểm tối đa phải lớn hơn 0');
    }

    if (errors.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi validation',
        detail: errors.join(', ')
      });
      return false;
    }

    return true;
  }

  private handleCreateExamError(error: any): void {
    let errorMessage = 'Không thể tạo bài kiểm tra';
    
    if (error.status === 400) {
      errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin';
    } else if (error.status === 403) {
      errorMessage = 'Bạn không có quyền tạo bài kiểm tra';
    } else if (error.status === 409) {
      errorMessage = 'Bài kiểm tra với tên này đã tồn tại';
    } else if (error.status === 500) {
      errorMessage = 'Lỗi server, vui lòng thử lại sau';
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: errorMessage
    });
  }

  createBulkExam(): void {
    // Validate bulk exam form
    if (!this.validateBulkExamForm()) {
      return;
    }

    const bulkData: BulkExamCreation = {
      exam: {
        class_id: this.effectiveClassId,
        exam_name: this.bulkExamForm.exam.exam_name.trim(),
        exam_type: this.bulkExamForm.exam.exam_type as any,
        exam_date: this.bulkExamForm.exam.exam_date instanceof Date 
          ? this.bulkExamForm.exam.exam_date.toISOString().split('T')[0]
          : this.bulkExamForm.exam.exam_date,
        language: 'Tiếng Anh',
        description: this.bulkExamForm.exam.description?.trim() || '',
        total_max_score: this.bulkExamForm.exam.total_max_score,
        total_students: this.classStudents.length,
        status: 'draft'
      },
      skills: this.bulkExamForm.skills.map(skill => ({
        skill_type: skill.skill_type as any,
        max_score: skill.max_score,
        weight: skill.weight,
        order_index: skill.order_index,
        total_students: this.classStudents.length
      })),
      results: []
    };

    this.saving = true;
    this.studyResultService.createBulkExam(bulkData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exam) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã tạo bài kiểm tra với 4 kỹ năng'
          });
          this.showBulkExamDrawer = false;
          this.resetBulkForm();
          // ✅ FORCE REFRESH: Clear cache and reload data
          this.forceRefresh();
          this.saving = false;
        },
        error: (error) => {
          this.handleCreateExamError(error);
          this.saving = false;
        }
      });
  }

  private validateBulkExamForm(): boolean {
    const errors: string[] = [];

    // Validate exam basic info
    if (!this.bulkExamForm.exam.exam_name?.trim()) {
      errors.push('Tên bài kiểm tra không được để trống');
    }

    if (!this.bulkExamForm.exam.exam_type) {
      errors.push('Loại kiểm tra không được để trống');
    }

    if (this.bulkExamForm.exam.total_max_score <= 0) {
      errors.push('Điểm tối đa phải lớn hơn 0');
    }

    if (errors.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi validation',
        detail: errors.join(', ')
      });
      return false;
    }

    return true;
  }

  updateExam(): void {
    if (!this.currentExam || !this.formExam) return;
    
    // Validate form data using service
    const validation = this.examManagementService.validateExamData(
      this.formExam as Exam, 
      this.getSelectedSkillsForSubmission()
    );
    
    if (!validation.isValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi validation',
        detail: validation.errors.join(', ')
      });
      return;
    }

    // Validate status change if status is being changed
    if (this.formExam.status !== this.currentExam.status) {
      const statusValidation = this.validateStatusChange(this.formExam.status);
      if (!statusValidation.isValid) {
        this.messageService.add({
          severity: 'error',
          summary: 'Không thể thay đổi trạng thái',
          detail: statusValidation.errors.join(', ')
        });
        return;
      }
    }

    const examData: Exam = {
      id: this.currentExam.id,
      class_id: this.currentExam.class_id,
      exam_name: this.formExam.exam_name.trim(),
      exam_type: this.formExam.exam_type as any,
      exam_date: this.formExam.exam_date,
      language: 'Tiếng Anh',
      description: this.formExam.description?.trim() || '',
      total_max_score: this.formExam.total_max_score,
      total_students: this.currentExam.total_students,
      status: this.formExam.status as any
    };

    const skillsData = this.getSelectedSkillsForSubmission();
    
    this.saving = true;
    
    // Use error recovery service for update with rollback capability
    this.examErrorRecoveryService.updateExamWithRollback(
      this.currentExam.id!, 
      examData, 
      skillsData, 
      this.currentExam
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật bài kiểm tra thành công'
              });
              
              this.drawerVisible = false;
              this.resetForm();
              this.forceRefresh();
          } else {
              this.messageService.add({
              severity: 'warn',
              summary: 'Cảnh báo',
              detail: result.errors?.join(', ') || 'Cập nhật không hoàn toàn thành công'
            });
            this.forceRefresh(); // Still refresh to show current state
          }
              this.saving = false;
        },
        error: (error) => {
          this.handleUpdateError(error);
          this.saving = false;
        }
      });
  }

  private handleUpdateError(error: any): void {
    const errorMessage = this.examErrorRecoveryService.createErrorMessage(error, {
      operation: 'update_exam',
      examId: this.currentExam?.id
    });

    this.messageService.add(errorMessage);

    // Offer rollback option
    this.confirmationService.confirm({
      message: 'Cập nhật thất bại. Bạn có muốn khôi phục lại trạng thái trước đó không?',
      header: 'Khôi phục dữ liệu',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Khôi phục',
      rejectLabel: 'Không',
      accept: () => {
        this.rollbackLastOperation();
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Thông báo',
          detail: 'Đã hủy khôi phục dữ liệu'
        });
      }
    });
  }

  private rollbackLastOperation(): void {
    this.examErrorRecoveryService.rollbackLastOperation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: RollbackResult) => {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã khôi phục dữ liệu thành công'
            });
            this.forceRefresh();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể khôi phục dữ liệu'
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi khôi phục dữ liệu'
          });
        }
      });
  }

  onCancelExam(): void {
    this.drawerVisible = false;
    this.resetForm();
    this.currentExam = null;
  }

  onCancelBulkExam(): void {
    this.showBulkExamDrawer = false;
    this.resetBulkForm();
    this.currentExam = null;
  }

  // Statistics methods
  getAverageScore(): number {
    if (!this.classExams || this.classExams.length === 0) return 0;
    
    const validExams = this.classExams.filter(exam => 
      exam.average_score !== null && 
      exam.average_score !== undefined && 
      !isNaN(exam.average_score) &&
      exam.average_score >= 0
    );
    
    if (validExams.length === 0) return 0;
    
    const total = validExams.reduce((sum, exam) => sum + exam.average_score!, 0);
    return Math.round((total / validExams.length) * 100) / 100;
  }

  getPassRate(): number {
    if (!this.classExams || this.classExams.length === 0) return 0;
    
    let totalPassedStudents = 0;
    let totalStudents = 0;
    
    this.classExams.forEach(exam => {
      const examStudents = exam.total_students || 0;
      const averageScore = exam.average_score || 0;
      
      const examPassRate = averageScore >= 60 ? 1 : Math.max(0, averageScore / 60);
      const passedStudents = examStudents * examPassRate;
      
      totalPassedStudents += passedStudents;
      totalStudents += examStudents;
    });
    
    return totalStudents > 0 ? Math.round((totalPassedStudents / totalStudents) * 10000) / 100 : 0;
  }

  getTotalStudents(): number {
    if (!this.classExams || this.classExams.length === 0) return 0;
    return this.classExams[0]?.total_students || 0;
  }

  getCompletedExams(): number {
    if (!this.classExams || this.classExams.length === 0) return 0;
    
    return this.classExams.filter(exam => {
      if (exam.status === 'completed') return true;
      if (exam.average_score && exam.average_score > 0) return true;
      const today = new Date();
      const examDate = new Date(exam.exam_date);
      return examDate <= today && (exam.total_students || 0) > 0;
    }).length;
  }

  // Utility methods
  formatPercentage(percentage: number | string | null | undefined): string {
    const numPercentage = typeof percentage === 'number' ? percentage : parseFloat(percentage as string);
    if (isNaN(numPercentage)) {
      return '0.0%';
    }
    return `${numPercentage.toFixed(1)}%`;
  }

  formatDate(date: string): string {
    if (!date) return '';
    
    try {
      let dateObj: Date;
      
      if (date.includes('T') && date.includes('Z')) {
        // This is a UTC date from database (like 2024-09-30T00:00:00.000Z)
        // Convert to Vietnam timezone first
        const utcDate = new Date(date);
        const vietnamOffset = 7 * 60; // Vietnam is UTC+7
        const localTime = utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000);
        dateObj = new Date(localTime + (vietnamOffset * 60000));
      } else {
        // Regular date string (YYYY-MM-DD)
        const cleanDateStr = date.includes('T') ? date.split('T')[0] : date;
        const parts = cleanDateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Month is 0-indexed
          const day = parseInt(parts[2]);
          dateObj = new Date(year, month, day, 12, 0, 0); // Use noon to avoid DST issues
        } else {
          console.error('Invalid date format:', date);
          return date;
        }
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return date; // Return original string if invalid
      }
      
      // Format as dd/MM/yyyy
      return dateObj.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('formatDate error:', error, 'input:', date);
      return date; // Return original string if error
    }
  }

  getScoreSeverity(percentage: number | string | null | undefined): string {
    const numPercentage = typeof percentage === 'number' ? percentage : parseFloat(percentage as string);
    if (isNaN(numPercentage)) {
      return 'secondary';
    }
    if (numPercentage >= 90) return 'success';
    if (numPercentage >= 80) return 'info';
    if (numPercentage >= 70) return 'warning';
    if (numPercentage >= 60) return 'help';
    return 'danger';
  }

  getSkillSeverity(skillType: string): SeverityType {
    return SKILL_SEVERITY_MAP[skillType as SkillType] || 'secondary';
  }

  getStatusLabel(status: string): string {
    return STATUS_LABEL_MAP[status as ExamStatus] || 'Không xác định';
  }

  getStatusSeverity(status: string): SeverityType {
    return STATUS_SEVERITY_MAP[status as ExamStatus] || 'secondary';
  }

  getClassStudentsCount(): number {
    return this.classStudents.length;
  }

  getClassStudentsInfo(): string {
    if (this.classStudents.length === 0) {
      return 'Chưa có học viên nào trong lớp';
    }
    
    const maxDisplay = 3;
    const studentNames = this.classStudents
      .slice(0, maxDisplay)
      .map(student => {
        // Try different possible field names
        const name = student.student?.full_name || 
                    student.student?.student_name ||
                    student.full_name || 
                    student.student_name ||
                    student.name ||
                    student.student?.name ||
                    student.first_name + ' ' + student.last_name ||
                    'N/A';
        return name;
      })
      .join(', ');
    
    const moreCount = this.classStudents.length > maxDisplay 
      ? ` và ${this.classStudents.length - maxDisplay} học viên khác`
      : '';
    
    return `${studentNames}${moreCount}`;
  }

  // Update exam data with correct student count
  private updateExamDataWithStudentCount(): void {
    if (this.classExams && this.classExams.length > 0) {
      this.classExams.forEach(exam => {
        exam.total_students = this.classStudents.length;
        
        if (exam.exam_skills && exam.exam_skills.length > 0) {
          exam.exam_skills.forEach(skill => {
            skill.total_students = this.classStudents.length;
          });
        }
      });
    }
  }

  // Export functionality
  exportToExcel(): void {
    if (!this.validateDataForExport()) {
      return;
    }

    try {
      const htmlContent = this.generateHTMLReport();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      const workbook = XLSX.utils.table_to_book(tempDiv.querySelector('table'), {
        sheet: 'Kết quả học tập lớp'
      });

      const worksheet = workbook.Sheets['Kết quả học tập lớp'];
      worksheet['!cols'] = [
        { wch: 8 },  // STT
        { wch: 30 }, // Tên bài kiểm tra
        { wch: 20 }, // Loại kiểm tra
        { wch: 15 }, // Kỹ năng
        { wch: 15 }, // Ngày thi
        { wch: 15 }, // Điểm TB
        { wch: 15 }, // Tỷ lệ đạt
        { wch: 15 }, // Số học viên
        { wch: 15 }  // Đã nộp bài
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ket_qua_hoc_tap_${this.effectiveClassName}_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);

      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã xuất ${this.classExams.length} bài kiểm tra ra file Excel`
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xuất file Excel. Vui lòng thử lại.'
      });
    }
  }

  private validateDataForExport(): boolean {
    if (!this.classExams || this.classExams.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không có dữ liệu để xuất'
      });
      return false;
    }
    return true;
  }

  private generateHTMLReport(): string {
    const now = new Date();
    const currentDate = now.toLocaleDateString('vi-VN');
    const currentTime = now.toLocaleTimeString('vi-VN');

    let html = `
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <tr>
          <td colspan="9" style="text-align: center; font-size: 16px; font-weight: bold; padding: 20px; border: none;">
            BÁO CÁO KẾT QUẢ HỌC TẬP LỚP
          </td>
        </tr>
        <tr>
          <td colspan="9" style="text-align: center; font-size: 14px; font-weight: bold; padding: 10px; border: none;">
            Lớp: ${this.effectiveClassName}
          </td>
        </tr>
        <tr>
          <td colspan="9" style="padding: 10px; border: none;"></td>
        </tr>
        <tr>
          <td colspan="9" style="padding: 5px; border: none; font-size: 11px;">
            Ngày xuất báo cáo: ${currentDate} lúc ${currentTime}
          </td>
        </tr>
        <tr>
          <td colspan="9" style="padding: 5px; border: none; font-size: 11px;">
            Tổng số bài kiểm tra: ${this.classExams.length}
          </td>
        </tr>
        <tr>
          <td colspan="9" style="padding: 5px; border: none; font-size: 11px;">
            Điểm trung bình: ${this.formatPercentage(this.getAverageScore())} | Tỷ lệ đạt: ${this.formatPercentage(this.getPassRate())}
          </td>
        </tr>
        <tr>
          <td colspan="9" style="padding: 10px; border: none;"></td>
        </tr>
        <tr style="background-color: #f8f9fa; font-weight: bold;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">STT</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Tên bài kiểm tra</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Loại kiểm tra</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Kỹ năng</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ngày thi</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Điểm TB</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Tỷ lệ đạt</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Số HV</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Đã nộp</td>
        </tr>
    `;

    // Add exam data
    this.classExams.forEach((exam, index) => {
      const skillsText = exam.exam_skills && exam.exam_skills.length > 0 
        ? exam.exam_skills.map(skill => skill.skill_type).join(', ')
        : 'Chưa có kỹ năng';
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${exam.exam_name || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${exam.exam_type || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${skillsText}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${this.formatDate(exam.exam_date)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${this.formatPercentage(exam.average_score)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${this.formatPercentage(this.getPassRate())}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${exam.total_students || 0}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${exam.total_students || 0}</td>
        </tr>
      `;
    });

    html += `</table>`;
    return html;
  }
}