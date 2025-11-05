import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { TeachingAssignmentService } from '../../services/teaching-assignment.service';
import { TeacherService } from '../../../teacher-management/services/teacher.service';
import { ClassService } from '../../../class-management/services/class.service';
import { CoursesService } from '../../../courses/services/courses.service';
import { Course } from '../../../courses/models/courses.model';
import { TeachingAssignment, TeachingAssignmentWithDetails, ClassPermission, ClassTeacherAssignment } from '../../models/teaching-assignment.model';
import * as XLSX from 'xlsx';
import { TeacherModel } from '../../../teacher-management/models/teacher.model';
import { ClassModel } from '../../../class-management/models/class.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, firstValueFrom } from 'rxjs';
import { timer } from 'rxjs';

@Component({
  selector: 'app-teaching-assignments',
  templateUrl: './teaching-assignments.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    DialogModule,
    DrawerModule,
    CheckboxModule,
    AvatarModule,
    TabsModule
  ],
  providers: [ConfirmationService],
  styleUrls: ['./teaching-assignments.scss']
})
export class TeachingAssignments implements OnInit, OnDestroy {
  // Main data
  classes: ClassModel[] = [];
  filteredClasses: ClassModel[] = [];
  classTeacherAssignments: ClassTeacherAssignment[] = [];
  
  // Form data
  formAssignment: ClassTeacherAssignment | null = null;
  assignmentDialogVisible: boolean = false;
  isEditMode: boolean = false;
  saving: boolean = false;
  loading: boolean = false;
  
  // Search and filter
  searchQuery: string = '';
  teacherSearchQuery: string = '';
  selectedStatusFilter: string = '';
  
  // New filter options for sidebar
  showIncompleteAssignments: boolean = false;
  showCompleteAssignments: boolean = false;

  // New layout data
  filteredTeachers: TeacherModel[] = [];
  selectedTeacher: TeacherModel | null = null;

  // Tab management
  activeTabIndex: string = "0";

  // Filters for new interface
  selectedSemester: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';
  
  // Filter visibility toggle
  filtersVisible: boolean = false;

  // Teacher schedule tab
  selectedTeacherForSchedule: number | null = null;
  teacherSchedule: ClassTeacherAssignment[] = [];
  
  // Schedule-specific filters
  scheduleSearchQuery: string = '';
  scheduleRoleFilter: string = '';
  scheduleStatusFilter: string = '';

  // Filter options
  semesterOptions: any[] = [];
  departmentOptions: any[] = [];
  assignmentStatusOptions: any[] = [];

  // Dropdown options
  availableTeachers: TeacherModel[] = [];
  availableClasses: ClassModel[] = [];
  availableCourses: Course[] = [];
  roleOptions: any[] = [];
  statusOptions: any[] = [];
  
  // RxJS subjects
  private destroy$ = new Subject<void>();
  
  // Auto-save properties
  private autoSaveSubject$ = new Subject<{classId: number, role: string, teacherId: number | null, existingAssignmentId?: number}>();
  private savingStates = new Map<string, boolean>(); // Track saving state per class-role
  
  // Track changes for save all functionality
  private originalAssignments: ClassTeacherAssignment[] = [];

  constructor(
    private teachingAssignmentService: TeachingAssignmentService,
    private teacherService: TeacherService,
    private classService: ClassService,
    private coursesService: CoursesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadDropdownData();
    this.initializeOptions();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading = true;
    
    // Load classes, courses and their teacher assignments
    Promise.all([
      firstValueFrom(this.classService.getClasses()),
      firstValueFrom(this.teacherService.getTeachers({})),
      firstValueFrom(this.coursesService.getCourses())
    ]).then(([classes, teachers, courses]) => {
      this.classes = classes || [];
      this.availableClasses = classes || [];
      this.availableTeachers = teachers || [];
      this.availableCourses = courses || [];
      this.filteredTeachers = [...(teachers || [])];
      
      // Map course names to classes
      this.mapCourseNamesToClasses();
      
      // Update filter options from loaded data
      this.updateDepartmentOptionsFromTeachers();
      this.updateSemesterOptionsFromClasses();
      
      // Load teacher assignments for all classes
      this.loadAllClassTeacherAssignments();
    }).catch(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
        detail: 'Không thể tải dữ liệu'
          });
          this.loading = false;
    });
  }

  private mapCourseNamesToClasses(): void {
    if (!this.availableCourses || this.availableCourses.length === 0) {
      return;
    }

    // Create a map of course_id to course_name for quick lookup
    const courseMap = new Map<number, string>();
    this.availableCourses.forEach(course => {
      if (course.id) {
        courseMap.set(course.id, course.course_name);
      }
    });

    // Map course_name to classes
    this.classes.forEach(classItem => {
      if (classItem.course_id && courseMap.has(classItem.course_id)) {
        classItem.course_name = courseMap.get(classItem.course_id);
      }
    });

    // Also update availableClasses
    this.availableClasses.forEach(classItem => {
      if (classItem.course_id && courseMap.has(classItem.course_id)) {
        classItem.course_name = courseMap.get(classItem.course_id);
      }
    });
  }

  private loadAllClassTeacherAssignments(): void {
    if (this.classes.length === 0) {
      this.filteredClasses = [];
      this.loading = false;
      return;
    }

    // Filter classes that have valid IDs
    const classesWithIds = this.classes.filter(classItem => classItem.id);
    if (classesWithIds.length === 0) {
      this.filteredClasses = [...this.classes];
      this.loading = false;
      return;
    }

    const loadPromises = classesWithIds.map(classItem => 
      firstValueFrom(this.teachingAssignmentService.getClassTeacherAssignments(classItem.id!))
    );

    Promise.all(loadPromises).then(results => {
      this.classTeacherAssignments = [];
      results.forEach((assignments, index) => {
        const classItem = classesWithIds[index];
        if (assignments && classItem) {
          assignments.forEach(assignment => {
            this.classTeacherAssignments.push({
              ...assignment,
              class_name: classItem.class_name,
              teacher_name: this.getTeacherName(assignment.teacher_id)
            });
          });
        }
      });
      this.filteredClasses = [...this.classes];
      // Store original assignments for change detection
      this.originalAssignments = JSON.parse(JSON.stringify(this.classTeacherAssignments));
      this.loading = false;
    }).catch(error => {
      this.filteredClasses = [...this.classes];
      this.loading = false;
    });
  }

  private getTeacherName(teacherId: number): string {
    const teacher = this.availableTeachers.find(t => t.id === teacherId);
    return teacher ? teacher.teacher_name : '';
  }

  private loadDropdownData(): void {
    // Load department options from available teachers
    this.updateDepartmentOptionsFromTeachers();
  }

  private updateDepartmentOptionsFromTeachers(): void {
    if (!this.availableTeachers || this.availableTeachers.length === 0) {
      return;
    }

    // Get unique departments from teachers
    const uniqueDepartments = [...new Set(
      this.availableTeachers
        .map(teacher => teacher.department)
        .filter(dept => dept && dept.trim() !== '')
    )];

    // Create options with proper labels
    this.departmentOptions = uniqueDepartments.map(dept => ({
      label: dept,
      value: dept
    }));
  }

  private updateSemesterOptionsFromClasses(): void {
    if (!this.classes || this.classes.length === 0) {
      return;
    }

    // Extract unique semester periods from classes start_date
    const semesterMap = new Map<string, { label: string; value: string; minDate?: string; maxDate?: string }>();

    this.classes.forEach(classItem => {
      if (classItem.start_date) {
        const startDate = new Date(classItem.start_date);
        const year = startDate.getFullYear();
        const month = startDate.getMonth() + 1; // JavaScript months are 0-based
        
        // Determine semester based on month
        let semesterNumber: number;
        let semesterLabel: string;
        
        if (month >= 1 && month <= 6) {
          semesterNumber = 1;
          semesterLabel = `Học kỳ 1 - ${year}`;
        } else {
          semesterNumber = 2;
          semesterLabel = `Học kỳ 2 - ${year}`;
        }

        const semesterKey = `semester_${semesterNumber}_${year}`;
        
        if (!semesterMap.has(semesterKey)) {
          semesterMap.set(semesterKey, {
            label: semesterLabel,
            value: semesterKey,
            minDate: classItem.start_date
          });
        } else {
          // Update min/max dates for better filtering
          const existing = semesterMap.get(semesterKey)!;
          if (classItem.start_date && (!existing.minDate || classItem.start_date < existing.minDate)) {
            existing.minDate = classItem.start_date;
          }
          if (classItem.end_date && (!existing.maxDate || classItem.end_date > existing.maxDate)) {
            existing.maxDate = classItem.end_date;
          }
        }
      }
    });

    // Convert map to sorted array (newest first)
    this.semesterOptions = Array.from(semesterMap.values())
      .sort((a, b) => b.value.localeCompare(a.value));
  }

  private initializeOptions(): void {
    this.roleOptions = this.teachingAssignmentService.getRoleOptions();
    this.statusOptions = this.teachingAssignmentService.getClassTeacherStatusOptions();
    
    // Initialize filter options - semester options will be loaded from classes data
    this.semesterOptions = [];

    // Department options will be loaded dynamically from teachers data
    this.departmentOptions = [];

    this.assignmentStatusOptions = [
      { label: 'Tất cả', value: '' },
      { label: 'Chưa phân công', value: 'unassigned' },
      { label: 'Đã phân công đầy đủ', value: 'complete' },
      { label: 'Phân công thiếu', value: 'incomplete' }
    ];
  }

  // Search and filter methods
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.filterClasses();
    this.cdr.detectChanges(); // Trigger change detection for hasActiveFilters()
  }

  onFilterChange(): void {
    this.filterClasses();
    this.cdr.detectChanges(); // Trigger change detection for hasActiveFilters()
  }

  onClearFilters(): void {
    // Reset all filter values
    this.selectedSemester = '';
    this.selectedDepartment = '';
    this.selectedStatus = '';
    this.searchQuery = '';
    
    // Trigger filter update
    this.filterClasses();
    this.cdr.detectChanges(); // Trigger change detection for hasActiveFilters()
    
    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: 'Đã xóa bộ lọc',
      detail: 'Tất cả bộ lọc đã được xóa bỏ',
      life: 2000
    });
  }

  toggleFiltersVisibility(): void {
    this.filtersVisible = !this.filtersVisible;
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedSemester?.trim() || 
      this.selectedDepartment?.trim() || 
      this.selectedStatus?.trim() || 
      this.searchQuery?.trim()
    );
  }

  private filterClasses(): void {
    let filtered = [...this.classes];

    // Search filter - tìm kiếm theo tên lớp, mã lớp, tên khóa học
    if (this.searchQuery.trim()) {
      const searchTerm = this.searchQuery.toLowerCase();
      filtered = filtered.filter(classItem => 
        classItem.class_name.toLowerCase().includes(searchTerm) ||
        classItem.class_code?.toLowerCase().includes(searchTerm) ||
        classItem.course_name?.toLowerCase().includes(searchTerm) ||
        // Tìm kiếm theo tên giáo viên được phân công
        this.hasTeacherWithName(classItem.id, searchTerm)
      );
    }

    // Semester filter - lọc theo học kỳ dựa trên start_date của lớp
    if (this.selectedSemester) {
      filtered = filtered.filter(classItem => 
        this.isClassInSemester(classItem, this.selectedSemester)
      );
    }

    // Department filter - lọc theo department của giáo viên được phân công
    if (this.selectedDepartment) {
      filtered = filtered.filter(classItem => 
        this.hasTeacherWithDepartment(classItem.id, this.selectedDepartment)
      );
    }

    // Status filter - lọc theo trạng thái phân công
    if (this.selectedStatus) {
      switch (this.selectedStatus) {
        case 'complete':
          // Đã phân công đầy đủ
          filtered = filtered.filter(classItem => this.isClassComplete(classItem.id));
          break;
        case 'incomplete':
          // Phân công thiếu (có một số giáo viên nhưng chưa đầy đủ)
          filtered = filtered.filter(classItem => {
            const hasAnyTeacher = this.hasAnyTeacherForClass(classItem.id);
            const isComplete = this.isClassComplete(classItem.id);
            return hasAnyTeacher && !isComplete;
          });
          break;
        case 'unassigned':
          // Chưa phân công (không có giáo viên nào)
          filtered = filtered.filter(classItem => !this.hasAnyTeacherForClass(classItem.id));
          break;
        default:
          // Show all classes
          break;
      }
    }

    // Legacy filters for backward compatibility
    if (this.showIncompleteAssignments && !this.showCompleteAssignments) {
      filtered = filtered.filter(classItem => !this.isClassComplete(classItem.id));
    } else if (this.showCompleteAssignments && !this.showIncompleteAssignments) {
      filtered = filtered.filter(classItem => this.isClassComplete(classItem.id));
    }

    this.filteredClasses = filtered;
  }

  // Helper methods for sidebar stats and filtering
  isClassComplete(classId: number | undefined): boolean {
    if (!classId) return false;
    
    const hasClassTeacher = !!this.getTeacherByRole(classId, 'Giáo viên chủ nhiệm');
    const hasMainTeacher = !!this.getTeacherByRole(classId, 'Giáo viên giảng dạy');
    const hasAssistant = !!this.getTeacherByRole(classId, 'Trợ giảng');
    
    return hasClassTeacher && hasMainTeacher && hasAssistant;
  }

  getIncompleteClassesCount(): number {
    return this.classes.filter(classItem => !this.isClassComplete(classItem.id)).length;
  }

  getCompleteClassesCount(): number {
    return this.classes.filter(classItem => this.isClassComplete(classItem.id)).length;
  }

  // Helper methods for filtering
  private hasTeacherWithName(classId: number | undefined, searchTerm: string): boolean {
    if (!classId) return false;
    
    const assignments = this.classTeacherAssignments.filter(assignment => assignment.class_id === classId);
    return assignments.some(assignment => {
      const teacher = this.availableTeachers.find(t => t.id === assignment.teacher_id);
      return teacher?.teacher_name?.toLowerCase().includes(searchTerm) || false;
    });
  }

  private hasTeacherWithDepartment(classId: number | undefined, department: string): boolean {
    if (!classId || !department) return false;
    
    const assignments = this.classTeacherAssignments.filter(
      assignment => assignment.class_id === classId && assignment.status === 'Đang dạy'
    );
    
    return assignments.some(assignment => {
      const teacher = this.availableTeachers.find(t => t.id === assignment.teacher_id);
      return teacher?.department === department;
    });
  }

  private hasAnyTeacherForClass(classId: number | undefined): boolean {
    if (!classId) return false;
    
    return this.classTeacherAssignments.some(
      assignment => assignment.class_id === classId && assignment.status === 'Đang dạy'
    );
  }

  private isClassInSemester(classItem: ClassModel, selectedSemester: string): boolean {
    if (!classItem.start_date || !selectedSemester) return false;

    const startDate = new Date(classItem.start_date);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1; // JavaScript months are 0-based
    
    // Determine semester based on month
    let semesterNumber: number;
    if (month >= 1 && month <= 6) {
      semesterNumber = 1;
    } else {
      semesterNumber = 2;
    }

    const classSemesterKey = `semester_${semesterNumber}_${year}`;
    return classSemesterKey === selectedSemester;
  }

  hasChanges(): boolean {
    // Check if there are unsaved changes by comparing current assignments with original
    if (!this.originalAssignments.length || !this.classTeacherAssignments.length) {
    return false;
    }
    
    const currentData = JSON.stringify(this.classTeacherAssignments.map(a => ({
      id: a.id,
      class_id: a.class_id,
      teacher_id: a.teacher_id,
      role: a.role,
      status: a.status,
      assign_date: a.assign_date
    })));
    
    const originalData = JSON.stringify(this.originalAssignments.map(a => ({
      id: a.id,
      class_id: a.class_id,
      teacher_id: a.teacher_id,
      role: a.role,
      status: a.status,
      assign_date: a.assign_date
    })));
    
    return currentData !== originalData;
  }

  onSaveAllAssignments(): void {
    if (!this.hasChanges()) {
      this.messageService.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Không có thay đổi nào để lưu'
      });
      return;
    }

    this.saving = true;
    
    // Get all unsaved assignments and save them
    const assignmentsToSave = this.classTeacherAssignments.filter(assignment => {
      // Check if this assignment has changes
      const original = this.originalAssignments.find(orig => orig.id === assignment.id);
      if (!original) return true; // New assignment
      
      return original.teacher_id !== assignment.teacher_id ||
             original.role !== assignment.role ||
             original.status !== assignment.status ||
             original.assign_date !== assignment.assign_date;
    });

    if (assignmentsToSave.length === 0) {
      this.saving = false;
      this.messageService.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Không có thay đổi nào để lưu'
      });
      return;
    }

    // Save assignments one by one to handle duplicates properly
    const savePromises = assignmentsToSave.map(async (assignment) => {
      // Clean assignment data - remove UI-only fields before sending to server
      const cleanAssignment = this.cleanAssignmentForApi(assignment);
      
      if (this.isValidId(assignment.id)) {
        // Update existing assignment
        return await firstValueFrom(this.teachingAssignmentService.updateClassTeacherAssignment(assignment.id, cleanAssignment));
      } else {
        // Check for duplicate before creating new assignment
        const duplicateAssignment = this.checkForDuplicateAssignment(assignment.class_id, assignment.teacher_id, assignment.role);
        if (duplicateAssignment && this.isValidId(duplicateAssignment.id)) {
          // Update existing assignment instead of creating new one
          const updateData = { ...duplicateAssignment, role: assignment.role };
          const cleanUpdateData = this.cleanAssignmentForApi(updateData as ClassTeacherAssignment);
          return await firstValueFrom(this.teachingAssignmentService.updateClassTeacherAssignment(duplicateAssignment.id, cleanUpdateData));
        } else {
          // Create new assignment - with fallback for duplicate errors
          try {
            return await firstValueFrom(this.teachingAssignmentService.createClassTeacherAssignment(cleanAssignment));
          } catch (createError: any) {
            // Handle duplicate error during creation
            if (this.isDuplicateError(createError)) {
              // Find existing assignment from database and update it
              try {
                const existingAssignments = await firstValueFrom(
                  this.teachingAssignmentService.getClassTeacherAssignments(assignment.class_id)
                );
                const existingAssignment = existingAssignments.find(a => a.teacher_id === assignment.teacher_id);
                
                if (existingAssignment && this.isValidId(existingAssignment.id)) {
                  const updateData = {
                    ...existingAssignment,
                    role: assignment.role,
                    assign_date: assignment.assign_date || new Date().toISOString().split('T')[0],
                    status: assignment.status || 'Đang dạy'
                  };
                  const cleanUpdateData = this.cleanAssignmentForApi(updateData as ClassTeacherAssignment);
                  return await firstValueFrom(this.teachingAssignmentService.updateClassTeacherAssignment(existingAssignment.id, cleanUpdateData));
                }
              } catch (fallbackError) {
                // Fallback failed, re-throw original error
              }
            }
            throw createError; // Re-throw original error
          }
        }
      }
    });

    Promise.all(savePromises).then(() => {
      // Update original assignments after successful save
      this.originalAssignments = JSON.parse(JSON.stringify(this.classTeacherAssignments));
      this.saving = false;
      
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
        detail: `Đã lưu ${assignmentsToSave.length} phân công giáo viên`
      });
      
      // Reload data to ensure consistency
      this.loadData();
    }).catch(error => {
      this.saving = false;
      
      // Check for specific duplicate error
      let errorMessage = 'Có lỗi xảy ra khi lưu phân công. Vui lòng thử lại.';
      if (this.isDuplicateError(error)) {
        errorMessage = 'Không thể gán cùng một giáo viên vào nhiều vai trò trong một lớp học. Vui lòng kiểm tra lại phân công.';
      }
      
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: errorMessage
      });
    });
  }

  private cleanAssignmentForApi(assignment: ClassTeacherAssignment): ClassTeacherAssignment {
    // Remove UI-only fields that shouldn't be sent to the API
    const { teacher_name, teacher_email, class_name, class_code, course_name, ...cleanAssignment } = assignment;
    return cleanAssignment as ClassTeacherAssignment;
  }

  private checkForDuplicateAssignment(classId: number, teacherId: number, currentRole: string): ClassTeacherAssignment | null {
    // Check if teacher already has any assignment in this class (database constraint is on class_id + teacher_id, not role)
    const existingAssignment = this.classTeacherAssignments.find(assignment => 
      assignment.class_id === classId && 
      assignment.teacher_id === teacherId
    );
    return existingAssignment || null;
  }

  private isValidId(id: any): id is number {
    return typeof id === 'number' && !isNaN(id) && id > 0;
  }

  private isDuplicateError(error: any): boolean {
    return error && typeof error === 'object' && 'error' in error &&
           error.error?.error && 
           error.error.error.includes('Duplicate entry') && 
           error.error.error.includes('unique_class_teacher');
  }

  onCancelChanges(): void {
    // Implement logic to cancel/rollback changes
    this.loadData();
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: 'Đã hủy các thay đổi'
    });
  }

  // Helper methods for template
  getTeacherByRole(classId: number | undefined, role: string): ClassTeacherAssignment | undefined {
    if (!classId) {
      return undefined;
    }
    return this.classTeacherAssignments.find(assignment => 
      assignment.class_id === classId && assignment.role === role && assignment.status === 'Đang dạy'
    );
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-default';
    switch (status) {
      case 'Đang dạy': return 'status-active';
      case 'Hoàn thành': return 'status-completed';
      case 'Nghỉ dạy': return 'status-inactive';
      default: return 'status-default';
    }
  }

  getAvailableTeachersForClass(): TeacherModel[] {
    // Return teachers that are not already assigned to this class in any role
    if (!this.formAssignment?.class_id) {
      return this.availableTeachers.filter(teacher => teacher.id);
    }

    const assignedTeacherIds = this.classTeacherAssignments
      .filter(assignment => assignment.class_id === this.formAssignment!.class_id && assignment.status === 'Đang dạy')
      .map(assignment => assignment.teacher_id);

    if (this.isEditMode) {
      // In edit mode, allow the current teacher
      const excludedIds = assignedTeacherIds.filter(id => id !== this.formAssignment!.teacher_id);
      return this.availableTeachers.filter(teacher => teacher.id && !excludedIds.includes(teacher.id));
    }

    return this.availableTeachers.filter(teacher => teacher.id && !assignedTeacherIds.includes(teacher.id));
  }

  // CRUD operations
  onCreateAssignment(): void {
    this.isEditMode = false;
    this.formAssignment = this.createEmptyAssignment();
    this.assignmentDialogVisible = true;
  }

  onAddTeacherToClass(classItem: ClassModel, role?: string): void {
    if (!classItem.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không có ID lớp học hợp lệ'
      });
      return;
    }
    
    this.isEditMode = false;
    this.formAssignment = this.createEmptyAssignment();
    this.formAssignment.class_id = classItem.id;
    if (role) {
      this.formAssignment.role = role as any;
    }
    this.assignmentDialogVisible = true;
  }

  onEditAssignment(assignment: ClassTeacherAssignment, classItem: ClassModel): void {
    this.isEditMode = true;
    this.formAssignment = { ...assignment };
    this.assignmentDialogVisible = true;
  }

  onDeleteAssignment(assignment: ClassTeacherAssignment): void {
    if (!this.isValidId(assignment.id)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa phân công: ID không hợp lệ'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa phân công của ${assignment.teacher_name}?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      accept: () => {
        this.deleteAssignment(assignment.id!);
      }
    });
  }

  private deleteAssignment(id: number): void {
    this.teachingAssignmentService.deleteClassTeacherAssignment(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa phân công thành công'
          });
          this.loadData();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa phân công'
          });
        }
      });
  }

  onSaveAssignment(): void {
    if (!this.formAssignment) return;

    if (!this.validateAssignmentForm()) {
      return;
    }

    this.saving = true;
    const cleanFormAssignment = this.cleanAssignmentForApi(this.formAssignment);
    
    // Validate ID before updating
    if (this.isEditMode && !this.isValidId(this.formAssignment.id)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'ID phân công không hợp lệ. Vui lòng thử lại.'
      });
      this.saving = false;
      return;
    }
    
    const operation = this.isEditMode 
      ? this.teachingAssignmentService.updateClassTeacherAssignment(this.formAssignment.id!, cleanFormAssignment)
      : this.teachingAssignmentService.createClassTeacherAssignment(cleanFormAssignment);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: this.isEditMode ? 'Cập nhật phân công thành công' : 'Tạo phân công thành công'
        });
        this.assignmentDialogVisible = false;
        this.loadData();
        this.saving = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: this.isEditMode ? 'Không thể cập nhật phân công' : 'Không thể tạo phân công'
        });
        this.saving = false;
      }
    });
  }

  private validateAssignmentForm(): boolean {
    if (!this.formAssignment) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng điền đầy đủ thông tin'
      });
      return false;
    }

    if (!this.formAssignment.class_id || this.formAssignment.class_id <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng chọn lớp học'
      });
      return false;
    }

    if (!this.formAssignment.teacher_id || this.formAssignment.teacher_id <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng chọn giáo viên'
      });
      return false;
    }

    if (!this.formAssignment.role || this.formAssignment.role.trim() === '') {
        this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng chọn vai trò'
        });
        return false;
      }

    // Check if role is already taken
    const existingAssignment = this.classTeacherAssignments.find(
      assignment => 
        assignment.class_id === this.formAssignment!.class_id && 
        assignment.role === this.formAssignment!.role &&
        assignment.status === 'Đang dạy' &&
        (!this.isEditMode || assignment.id !== this.formAssignment!.id)
    );

    if (existingAssignment) {
        this.messageService.add({
        severity: 'warn',
        summary: 'Lỗi',
        detail: `Vai trò "${this.formAssignment.role}" đã được phân công cho giáo viên khác`
        });
        return false;
    }

    return true;
  }

  onCancelAssignment(): void {
    this.assignmentDialogVisible = false;
    this.formAssignment = null;
  }

  private createEmptyAssignment(): ClassTeacherAssignment {
    return {
      class_id: 0,
      teacher_id: 0,
      role: 'Trợ giảng',
      assign_date: new Date().toISOString().split('T')[0],
      status: 'Đang dạy'
    };
  }

  // New methods for bulk assignment interface
  onTeacherSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.teacherSearchQuery = target.value;
    this.filterTeachers();
  }

  filterTeachers(): void {
    if (!this.teacherSearchQuery) {
      this.filteredTeachers = [...this.availableTeachers];
    } else {
      this.filteredTeachers = this.availableTeachers.filter(teacher =>
        teacher.teacher_name?.toLowerCase().includes(this.teacherSearchQuery.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(this.teacherSearchQuery.toLowerCase())
      );
    }
  }

  selectTeacher(teacher: TeacherModel): void {
    this.selectedTeacher = teacher;
  }

  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    // Lấy chữ cái đầu của từ cuối cùng (tên)
    const lastName = words[words.length - 1];
    return lastName ? lastName.charAt(0).toUpperCase() : '';
  }

  // Helper methods for teacher display - consistent with teacher management
  getLastNameInitial(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    const lastName = words[words.length - 1];
    return lastName ? lastName.charAt(0).toUpperCase() : '';
  }

  getTeacherDisplayInfo(teacher: TeacherModel): string {
    if (!teacher) return '';
    const parts = [];
    if (teacher.teacher_code) parts.push(`Mã: ${teacher.teacher_code}`);
    if (teacher.department) parts.push(`Khoa: ${teacher.department}`);
    if (teacher.experience_years) parts.push(`KN: ${teacher.experience_years} năm`);
    return parts.join(' • ');
  }

  getTeacherStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null {
    switch (status) {
      case 'Đang dạy':
        return 'success';
      case 'Tạm nghỉ':
        return 'warn';
      case 'Đã nghỉ':
        return 'danger';
      default:
        return null;
    }
  }

  getTeacherDegreeSeverity(degree: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null {
    switch (degree) {
      case 'Tiến sĩ':
        return 'success';
      case 'Thạc sĩ':
        return 'info';
      case 'Cử nhân':
        return 'warn';
      default:
        return null;
    }
  }

  getTeacherTooltip(teacher: TeacherModel): string {
    if (!teacher) return '';
    const lines = [];
    lines.push(`Tên: ${teacher.teacher_name}`);
    if (teacher.teacher_code) lines.push(`Mã GV: ${teacher.teacher_code}`);
    if (teacher.department) lines.push(`Khoa: ${teacher.department}`);
    if (teacher.specialization) lines.push(`Chuyên môn: ${teacher.specialization}`);
    if (teacher.degree) lines.push(`Học vị: ${teacher.degree}`);
    if (teacher.experience_years) lines.push(`Kinh nghiệm: ${teacher.experience_years} năm`);
    if (teacher.email) lines.push(`Email: ${teacher.email}`);
    lines.push(`Trạng thái: ${teacher.status}`);
    return lines.join('\n');
  }

  getTeacherTooltipData(teacher: TeacherModel): any {
    if (!teacher) return null;
    return {
      name: teacher.teacher_name,
      code: teacher.teacher_code,
      department: teacher.department,
      specialization: teacher.specialization,
      degree: teacher.degree,
      experience: teacher.experience_years,
      email: teacher.email,
      status: teacher.status
    };
  }

  getSelectedClassInfo(): ClassModel | null {
    if (!this.formAssignment?.class_id) {
      return null;
    }
    return this.availableClasses.find(c => c.id === this.formAssignment!.class_id) || null;
  }

  getSelectedClassCourseInfo(): string {
    const selectedClass = this.getSelectedClassInfo();
    if (!selectedClass) {
      return '';
    }
    
    // If class already has course_name, return it
    if (selectedClass.course_name) {
      return selectedClass.course_name;
    }
    
    // Fallback: find course_name from availableCourses using course_id
    if (selectedClass.course_id) {
      const course = this.availableCourses.find(c => c.id === selectedClass.course_id);
      if (course) {
        return course.course_name;
      }
    }
    
    return 'Chưa có thông tin khóa học';
  }

  onClassSelectionChange(classId: number): void {
    if (!this.formAssignment) return;
    
    // Update the form assignment with the new class ID
    this.formAssignment.class_id = classId;
    
    // Trigger change detection to update the course info display
    this.cdr.detectChanges();
  }

  getAssignmentByRole(classId: number | undefined, role: string): ClassTeacherAssignment | undefined {
    if (!classId) return undefined;
    return this.classTeacherAssignments.find(assignment => 
      assignment.class_id === classId && assignment.role === role
    );
  }

  onAssignmentChange(classId: number | undefined, role: string, teacherId: number | null): void {
    if (!classId) return;
    
    // Get assignment info before updating local data (for deletion case)
    const existingAssignment = this.getAssignmentByRole(classId, role);
    
    // Update local data immediately for responsive UI
    this.updateLocalAssignment(classId, role, teacherId);
    
    // Trigger auto-save with debounce
    this.autoSaveSubject$.next({ classId, role, teacherId, existingAssignmentId: existingAssignment?.id });
    
    this.cdr.detectChanges();
  }

  private updateLocalAssignment(classId: number, role: string, teacherId: number | null): void {
    const existingAssignment = this.getAssignmentByRole(classId, role);
    
    if (teacherId === null || teacherId === undefined) {
      // Clear assignment
      if (existingAssignment) {
        const index = this.classTeacherAssignments.indexOf(existingAssignment);
        if (index > -1) {
          this.classTeacherAssignments.splice(index, 1);
        }
      }
    } else {
      if (existingAssignment) {
        // Update existing assignment
        existingAssignment.teacher_id = teacherId;
        if (!existingAssignment.assign_date) {
          existingAssignment.assign_date = new Date().toISOString().split('T')[0];
        }
        if (!existingAssignment.status) {
          existingAssignment.status = 'Đang dạy';
        }
      } else {
        // Check if teacher already has an assignment in this class before creating new one
        const duplicateAssignment = this.checkForDuplicateAssignment(classId, teacherId, role);
        if (duplicateAssignment) {
          // Update existing assignment role instead of creating new one
          duplicateAssignment.role = role as any;
          duplicateAssignment.teacher_id = teacherId;
          if (!duplicateAssignment.assign_date) {
            duplicateAssignment.assign_date = new Date().toISOString().split('T')[0];
          }
          if (!duplicateAssignment.status) {
            duplicateAssignment.status = 'Đang dạy';
          }
        } else {
          // Create new assignment only if no existing assignment found
        const teacher = this.availableTeachers.find(t => t.id === teacherId);
        const newAssignment: ClassTeacherAssignment = {
          class_id: classId,
          teacher_id: teacherId,
          role: role as any,
          assign_date: new Date().toISOString().split('T')[0],
          status: 'Đang dạy',
          teacher_name: teacher?.teacher_name,
          class_name: this.classes.find(c => c.id === classId)?.class_name
        };
        this.classTeacherAssignments.push(newAssignment);
        }
      }
    }
  }

  onStatusChange(classId: number | undefined, role: string, status: string): void {
    if (!classId) return;
    
    const assignment = this.getAssignmentByRole(classId, role);
    if (assignment) {
      assignment.status = status as any;
    }
  }

  // New methods for Canvas/Moodle style interface

  getAssignmentStatusColor(classId: number | undefined, role: string): string {
    const assignment = this.getAssignmentByRole(classId, role);
    if (!assignment?.teacher_id) {
      return '#f3f4f6'; // Light gray for unassigned
    }
    
    if (assignment.status === 'Đang dạy') {
      return '#d1fae5'; // Light green
    } else if (assignment.status === 'Hoàn thành') {
      return '#dbeafe'; // Light blue
    } else if (assignment.status === 'Nghỉ dạy') {
      return '#fee2e2'; // Light red
    }
    
    return '#f3f4f6';
  }

  onExportExcel(): void {
    if (this.filteredClasses.length === 0) {
    this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không có dữ liệu để xuất'
      });
      return;
    }

    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Generate report data with header and statistics
      const reportData = this.generateFullReportData();
      
      // Create worksheet from the full report data
      const worksheet = XLSX.utils.aoa_to_sheet(reportData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // Mã lớp
        { wch: 35 }, // Tên lớp
        { wch: 25 }, // Khóa học
        { wch: 25 }, // Giáo viên chính
        { wch: 25 }, // Trợ giảng
        { wch: 20 }, // Học kỳ
        { wch: 15 }, // Trạng thái lớp
        { wch: 15 }, // Ngày bắt đầu
        { wch: 15 }  // Ngày kết thúc
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo phân công giảng dạy');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `bao_cao_phan_cong_giang_day_${timestamp}.xlsx`;
      
      // Download file
      XLSX.writeFile(workbook, filename);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã xuất báo cáo ${this.filteredClasses.length} lớp học ra file Excel`
      });
      
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra khi xuất Excel. Vui lòng thử lại.'
      });
    }
  }

  private prepareExportData(): any[] {
    return this.filteredClasses.map(classItem => {
      const mainTeacherAssignment = this.getAssignmentByRole(classItem.id, 'Giáo viên giảng dạy');
      const assistantAssignment = this.getAssignmentByRole(classItem.id, 'Trợ giảng');
      
      // Get semester information
      const semester = this.getSemesterFromDate(classItem.start_date);
      
      return {
        'Mã lớp': classItem.class_code || '',
        'Tên lớp': classItem.class_name || '',
        'Khóa học': classItem.course_name || '',
        'Giáo viên chính': mainTeacherAssignment?.teacher_name || '',
        'Trợ giảng': assistantAssignment?.teacher_name || '',
        'Học kỳ': semester || '',
        'Trạng thái lớp': classItem.status || '',
        'Ngày bắt đầu': classItem.start_date ? new Date(classItem.start_date).toLocaleDateString('vi-VN') : '',
        'Ngày kết thúc': classItem.end_date ? new Date(classItem.end_date).toLocaleDateString('vi-VN') : ''
      };
    });
  }

  private getSemesterFromDate(startDate: string | null | undefined): string {
    if (!startDate) return '';
    
    const date = new Date(startDate);
    const month = date.getMonth() + 1; // 0-based month
    const year = date.getFullYear();
    
    if (month >= 1 && month <= 5) {
      return `HK2-${year - 1}-${year}`;
    } else if (month >= 6 && month <= 8) {
      return `Hè-${year}`;
    } else {
      return `HK1-${year}-${year + 1}`;
    }
  }

  private generateFullReportData(): any[][] {
    const now = new Date();
    const currentDate = now.toLocaleDateString('vi-VN');
    const currentTime = now.toLocaleTimeString('vi-VN');
    
    // Calculate statistics
    const totalClasses = this.filteredClasses.length;
    const assignedClasses = this.filteredClasses.filter(classItem => {
      const mainTeacher = this.getAssignmentByRole(classItem.id, 'Giáo viên giảng dạy');
      const assistant = this.getAssignmentByRole(classItem.id, 'Trợ giảng');
      return mainTeacher?.teacher_id || assistant?.teacher_id;
    }).length;
    const unassignedClasses = totalClasses - assignedClasses;
    
    // Count by status
    const statusCount = this.filteredClasses.reduce((acc, classItem) => {
      const status = classItem.status || 'Chưa xác định';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Build report data
    const reportData: any[][] = [];
    
    // Header section
    reportData.push(['BÁO CÁO PHÂN CÔNG GIẢNG DẠY']);
    reportData.push([]); // Empty row
    
    // Statistics section
    reportData.push([`Tổng số lớp học: ${totalClasses}`]);
    reportData.push([`Đã phân công: ${assignedClasses} | Chưa phân công: ${unassignedClasses}`]);
    
    // Status breakdown
    const statusLine = Object.entries(statusCount)
      .map(([status, count]) => `${status}: ${count}`)
      .join(' | ');
    if (statusLine) {
      reportData.push([statusLine]);
    }
    
    reportData.push([`Ngày xuất báo cáo: ${currentDate} lúc ${currentTime}`]);
    reportData.push([]); // Empty row
    
    // Column headers
    const headers = [
      'Mã lớp',
      'Tên lớp', 
      'Khóa học',
      'Giáo viên chính',
      'Trợ giảng',
      'Học kỳ',
      'Trạng thái lớp',
      'Ngày bắt đầu',
      'Ngày kết thúc'
    ];
    reportData.push(headers);
    
    // Data rows
    const dataRows = this.prepareExportData();
    dataRows.forEach(row => {
      reportData.push([
        row['Mã lớp'],
        row['Tên lớp'],
        row['Khóa học'],
        row['Giáo viên chính'],
        row['Trợ giảng'],
        row['Học kỳ'],
        row['Trạng thái lớp'],
        row['Ngày bắt đầu'],
        row['Ngày kết thúc']
      ]);
    });
    
    return reportData;
  }

  onAutoSuggest(): void {
    if (!this.availableTeachers.length || !this.filteredClasses.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không có dữ liệu giáo viên hoặc lớp học để gợi ý'
      });
      return;
    }

    let suggestedCount = 0;
    
    // Auto-suggest logic based on teacher availability and class requirements
    this.filteredClasses.forEach(classItem => {
      if (!classItem.id) return;
      
      const mainTeacherAssignment = this.getAssignmentByRole(classItem.id, 'Giáo viên giảng dạy');
      const assistantAssignment = this.getAssignmentByRole(classItem.id, 'Trợ giảng');
      
      // Suggest main teacher if not assigned
      if (!mainTeacherAssignment?.teacher_id) {
        const suggestedTeacher = this.findBestTeacherForClass(classItem, this.availableTeachers);
        if (suggestedTeacher && suggestedTeacher.id) {
          this.updateLocalAssignment(classItem.id, 'Giáo viên giảng dạy', suggestedTeacher.id);
          suggestedCount++;
        }
      }
      
      // Suggest assistant teacher if not assigned
      if (!assistantAssignment?.teacher_id) {
        const suggestedAssistant = this.findBestTeacherForClass(classItem, this.availableTeachers, 'Trợ giảng');
        if (suggestedAssistant && suggestedAssistant.id) {
          this.updateLocalAssignment(classItem.id, 'Trợ giảng', suggestedAssistant.id);
          suggestedCount++;
        }
      }
    });

    if (suggestedCount > 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã gợi ý ${suggestedCount} phân công giáo viên. Bạn có thể xem lại và lưu thay đổi.`
      });
      
      // Trigger change detection
      this.cdr.detectChanges();
    } else {
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
        detail: 'Tất cả lớp học đã được phân công giáo viên. Không có gợi ý nào.'
      });
    }
  }

  private findBestTeacherForClass(classItem: ClassModel, teachers: TeacherModel[], role: string = 'Giáo viên giảng dạy'): TeacherModel | null {
    if (!classItem.id || !teachers.length) return null;

    // Filter available teachers (not already assigned to this class)
    const availableTeachers = teachers.filter(teacher => {
      const existingAssignment = this.getAssignmentByRole(classItem.id!, role);
      return existingAssignment?.teacher_id !== teacher.id && teacher.id;
    });

    if (!availableTeachers.length) return null;

    // Get course information
    const courseName = classItem.course_name?.toLowerCase() || '';
    
    // Priority scoring algorithm
    const scoredTeachers = availableTeachers.map(teacher => {
      let score = 0;
      
      // Prefer teachers with relevant specialization
      if (teacher.specialization) {
        const specialization = teacher.specialization.toLowerCase();
        if (courseName.includes('anh') && specialization.includes('anh')) score += 10;
        if (courseName.includes('hàn') && specialization.includes('hàn')) score += 10;
        if (courseName.includes('trung') && specialization.includes('trung')) score += 10;
      }
      
      // Prefer teachers with matching department
      if (role === 'Giáo viên giảng dạy' && teacher.department === 'Giảng dạy') score += 5;
      if (role === 'Trợ giảng' && teacher.department === 'Trợ giảng') score += 5;
      
      // Prefer active teachers
      if (teacher.status === 'Đang dạy') score += 3;
      
      // Prefer less busy teachers (fewer current assignments)
      const currentAssignments = this.classTeacherAssignments.filter(a => 
        a.teacher_id === teacher.id && a.status === 'Đang dạy'
      ).length;
      score += Math.max(0, 5 - currentAssignments);
      
      return { teacher, score };
    });

    // Sort by score (descending) and return the best teacher
    scoredTeachers.sort((a, b) => b.score - a.score);
    return scoredTeachers[0]?.teacher || availableTeachers[0];
  }

  onTeacherSelectionChange(teacherId: number): void {
    this.selectedTeacherForSchedule = teacherId;
    // Reset schedule-specific filters when teacher changes
    this.scheduleSearchQuery = '';
    this.scheduleRoleFilter = '';
    this.scheduleStatusFilter = '';
    this.loadTeacherSchedule(teacherId);
  }

  private loadTeacherSchedule(teacherId: number): void {
    this.teacherSchedule = this.classTeacherAssignments.filter(assignment => 
      assignment.teacher_id === teacherId
    ).map(assignment => {
      // Add class information to assignments
      const classInfo = this.classes.find(c => c.id === assignment.class_id);
      return {
        ...assignment,
        class_code: classInfo?.class_code,
        course_name: classInfo?.course_name
      };
    });
  }

  getSelectedTeacherName(): string {
    if (!this.selectedTeacherForSchedule) return '';
    const teacher = this.availableTeachers.find(t => t.id === this.selectedTeacherForSchedule);
    return teacher?.teacher_name || '';
  }

  getSelectedTeacherInfo(): TeacherModel | null {
    if (!this.selectedTeacherForSchedule) return null;
    return this.availableTeachers.find(t => t.id === this.selectedTeacherForSchedule) || null;
  }

  getRoleSeverity(role: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null {
    switch (role) {
      case 'Giáo viên chủ nhiệm':
        return 'success';
      case 'Giáo viên giảng dạy':
        return 'info';
      case 'Trợ giảng':
        return 'warn';
      default:
        return null;
    }
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null {
    switch (status) {
      case 'Đang dạy':
        return 'success';
      case 'Hoàn thành':
        return 'info';
      case 'Nghỉ dạy':
        return 'danger';
      default:
        return null;
    }
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.value;
    
    // Clear schedule-specific filters when switching away from teacher tab
    if (event.value !== '1') {
      this.scheduleSearchQuery = '';
      this.scheduleRoleFilter = '';
      this.scheduleStatusFilter = '';
    }
  }

  // Methods for class assignment status
  getClassAssignmentStatus(classId: number | undefined): 'complete' | 'incomplete' | 'empty' {
    if (!classId) return 'empty';
    
    const roles = ['Giáo viên chủ nhiệm', 'Giáo viên giảng dạy', 'Trợ giảng'];
    const assignedRoles = roles.filter(role => {
      const assignment = this.getAssignmentByRole(classId, role);
      return assignment && assignment.teacher_id;
    });
    
    if (assignedRoles.length === 3) {
      return 'complete'; // Đủ cả 3 vai trò
    } else if (assignedRoles.length > 0) {
      return 'incomplete'; // Thiếu ít nhất 1 vai trò
    } else {
      return 'empty'; // Trống hoàn toàn
    }
  }

  getClassAssignmentStatusClass(classId: number | undefined): string {
    const status = this.getClassAssignmentStatus(classId);
    switch (status) {
      case 'complete':
        return 'status-complete';
      case 'incomplete':
        return 'status-incomplete';
      case 'empty':
        return 'status-empty';
      default:
        return '';
    }
  }

  getClassAssignmentStatusIcon(classId: number | undefined): string {
    const status = this.getClassAssignmentStatus(classId);
    switch (status) {
      case 'complete':
        return 'pi pi-check-circle status-icon-complete';
      case 'incomplete':
        return 'pi pi-exclamation-triangle status-icon-incomplete';
      case 'empty':
        return 'pi pi-times-circle status-icon-empty';
      default:
        return '';
    }
  }

  getClassAssignmentStatusText(classId: number | undefined): string {
    const status = this.getClassAssignmentStatus(classId);
    switch (status) {
      case 'complete':
        return 'Đã phân công';
      case 'incomplete':
        return 'Thiếu';
      case 'empty':
        return 'Trống';
      default:
        return '';
    }
  }

  getStatusTooltip(classId: number | undefined): string {
    const status = this.getClassAssignmentStatus(classId);
    const roles = ['Giáo viên chủ nhiệm', 'Giáo viên giảng dạy', 'Trợ giảng'];
    
    switch (status) {
      case 'complete':
        return '✅ Đã phân công đầy đủ cả 3 vai trò:\n• Giáo viên chủ nhiệm\n• Giáo viên giảng dạy\n• Trợ giảng';
      case 'incomplete':
        const assignedRoles = roles.filter(role => {
          const assignment = this.getAssignmentByRole(classId, role);
          return assignment && assignment.teacher_id;
        });
        const missingRoles = roles.filter(role => !assignedRoles.includes(role));
        return `⚠️ Thiếu phân công cho:\n${missingRoles.map(role => `• ${role}`).join('\n')}`;
      case 'empty':
        return '⛔ Chưa phân công giáo viên nào cho lớp học này';
      default:
        return 'Không xác định được trạng thái phân công';
    }
  }

  // Auto-save setup and methods
  private setupAutoSave(): void {
    this.autoSaveSubject$
      .pipe(
        debounceTime(1000), // 1 second delay
        distinctUntilChanged((prev, curr) => 
          prev.classId === curr.classId && 
          prev.role === curr.role && 
          prev.teacherId === curr.teacherId &&
          prev.existingAssignmentId === curr.existingAssignmentId
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.saveSingleAssignment(data.classId, data.role, data.teacherId, data.existingAssignmentId);
      });
  }

  private async saveSingleAssignment(classId: number, role: string, teacherId: number | null, existingAssignmentId?: number): Promise<void> {
    const saveKey = `${classId}-${role}`;
    
    // Set saving state
    this.savingStates.set(saveKey, true);
    this.cdr.detectChanges();

    try {
      const assignment = this.getAssignmentByRole(classId, role);
      
      let operationMessage = '';
      let isDeletion = false;
      
      if (teacherId === null || teacherId === undefined) {
        // Delete assignment if exists in database
        // Use existingAssignmentId if available (from before local update)
        let assignmentIdToDelete = existingAssignmentId || assignment?.id;
        
        // Fallback: If we still don't have an ID but there should be one in DB,
        // try to find it from all assignments that might exist
        if (!assignmentIdToDelete) {
          const possibleAssignment = this.classTeacherAssignments.find(a => 
            a.class_id === classId && a.role === role
          );
          assignmentIdToDelete = possibleAssignment?.id;
        }
        
        if (assignmentIdToDelete && this.isValidId(assignmentIdToDelete)) {
          try {
            await firstValueFrom(this.teachingAssignmentService.deleteClassTeacherAssignment(assignmentIdToDelete));
            operationMessage = `Đã xóa phân công ${role.toLowerCase()}`;
            isDeletion = true;
          } catch (error) {
            operationMessage = `Lỗi khi xóa phân công ${role.toLowerCase()} từ database. Vui lòng kiểm tra quyền truy cập.`;
            isDeletion = false;
          }
        } else {
          // Last resort: try to get current assignments from DB and find the one to delete
          try {
            const currentAssignments = await firstValueFrom(
              this.teachingAssignmentService.getClassTeacherAssignments(classId)
            );
            const assignmentToDelete = currentAssignments.find(a => a.role === role);
            if (assignmentToDelete && this.isValidId(assignmentToDelete.id)) {
              try {
                await firstValueFrom(this.teachingAssignmentService.deleteClassTeacherAssignment(assignmentToDelete.id));
                operationMessage = `Đã xóa phân công ${role.toLowerCase()}`;
                isDeletion = true;
              } catch (deleteError) {
                operationMessage = `Lỗi khi xóa phân công ${role.toLowerCase()} từ database. Vui lòng kiểm tra quyền truy cập.`;
                isDeletion = false;
              }
            } else {
              operationMessage = `Đã xóa phân công ${role.toLowerCase()}`;
              isDeletion = true;
            }
          } catch (error) {
            operationMessage = `Lỗi khi tìm kiếm phân công để xóa: ${error}`;
            isDeletion = false;
          }
        }
      } else {
        if (assignment && this.isValidId(assignment.id)) {
          // Update existing assignment with valid ID
          const updateData = {
            ...assignment,
            teacher_id: teacherId,
            assign_date: assignment.assign_date || new Date().toISOString().split('T')[0],
            status: assignment.status || 'Đang dạy'
          };
          const cleanUpdateData = this.cleanAssignmentForApi(updateData as ClassTeacherAssignment);
          await firstValueFrom(this.teachingAssignmentService.updateClassTeacherAssignment(assignment.id, cleanUpdateData));
          operationMessage = `Đã cập nhật phân công ${role.toLowerCase()}`;
        } else if (assignment && !this.isValidId(assignment.id)) {
          // Assignment exists locally but has invalid ID, create new one and update local reference
          const newAssignment = {
            class_id: classId,
            teacher_id: teacherId,
            role: role,
            assign_date: new Date().toISOString().split('T')[0],
            status: 'Đang dạy'
          } as ClassTeacherAssignment;
          
          const cleanNewAssignment = this.cleanAssignmentForApi(newAssignment);
          const created = await firstValueFrom(this.teachingAssignmentService.createClassTeacherAssignment(cleanNewAssignment));
          
          if (created && this.isValidId(created.id)) {
            // Update local assignment with new ID from server
            assignment.id = created.id;
            assignment.teacher_id = teacherId;
            assignment.assign_date = new Date().toISOString().split('T')[0];
            assignment.status = 'Đang dạy';
          }
          operationMessage = `Đã tạo phân công ${role.toLowerCase()}`;
        } else {
          // Check for duplicate assignment before creating new one
          const duplicateAssignment = this.checkForDuplicateAssignment(classId, teacherId, role);
          if (duplicateAssignment && this.isValidId(duplicateAssignment.id)) {
            // Update the existing assignment to change role instead of creating new
            const updateData = {
              ...duplicateAssignment,
              role: role,
              assign_date: new Date().toISOString().split('T')[0],
              status: 'Đang dạy'
            };
            const cleanUpdateData = this.cleanAssignmentForApi(updateData as ClassTeacherAssignment);
            await firstValueFrom(this.teachingAssignmentService.updateClassTeacherAssignment(duplicateAssignment.id, cleanUpdateData));
            
            // Update local assignment
            duplicateAssignment.role = role as any;
            duplicateAssignment.assign_date = new Date().toISOString().split('T')[0];
            duplicateAssignment.status = 'Đang dạy';
            
            operationMessage = `Đã cập nhật vai trò thành ${role.toLowerCase()}`;
          } else {
            // Create new assignment - with fallback for duplicate errors
          const teacher = this.availableTeachers.find(t => t.id === teacherId);
          const newAssignment = {
            class_id: classId,
            teacher_id: teacherId,
            role: role,
            assign_date: new Date().toISOString().split('T')[0],
            status: 'Đang dạy'
          } as ClassTeacherAssignment;
          
            const cleanNewAssignment = this.cleanAssignmentForApi(newAssignment);
            
            try {
              const created = await firstValueFrom(this.teachingAssignmentService.createClassTeacherAssignment(cleanNewAssignment));
          if (created) {
            // Update local assignment with server response
            const localAssignment = this.classTeacherAssignments.find(a => 
              a.class_id === classId && a.role === role
            );
                if (localAssignment && this.isValidId(created.id)) {
              localAssignment.id = created.id;
            }
          }
          operationMessage = `Đã tạo phân công ${role.toLowerCase()}`;
            } catch (createError: any) {
              // Handle duplicate error during creation - try to find and update existing assignment
              if (this.isDuplicateError(createError)) {
                // Find existing assignment from database and update it
                try {
                  const existingAssignments = await firstValueFrom(
                    this.teachingAssignmentService.getClassTeacherAssignments(classId)
                  );
                  const existingAssignment = existingAssignments.find(a => a.teacher_id === teacherId);
                  
                  if (existingAssignment && this.isValidId(existingAssignment.id)) {
                    const updateData = {
                      ...existingAssignment,
                      role: role,
                      assign_date: new Date().toISOString().split('T')[0],
                      status: 'Đang dạy'
                    };
                    const cleanUpdateData = this.cleanAssignmentForApi(updateData as ClassTeacherAssignment);
                    await firstValueFrom(this.teachingAssignmentService.updateClassTeacherAssignment(existingAssignment.id, cleanUpdateData));
                    
                    // Update local assignment
                    const localAssignment = this.classTeacherAssignments.find(a => 
                      a.class_id === classId && a.teacher_id === teacherId
                    );
                    if (localAssignment) {
                      localAssignment.role = role as any;
                      localAssignment.id = existingAssignment.id;
                    }
                    operationMessage = `Đã cập nhật vai trò thành ${role.toLowerCase()}`;
                  } else {
                    throw createError; // Re-throw if can't handle
                  }
                } catch (fallbackError) {
                  throw createError; // Re-throw original error if fallback fails
                }
              } else {
                throw createError; // Re-throw if not a duplicate error
              }
            }
          }
        }
      }

      // Show success message only if there was an operation
      if (operationMessage) {
        this.messageService.add({
          severity: 'success',
          summary: isDeletion ? 'Đã xóa phân công' : 'Tự động lưu',
          detail: operationMessage,
          life: 2000
        });
      }

    } catch (error) {
      const isDeletion = teacherId === null || teacherId === undefined;
      
      // Check for specific duplicate error
      let errorMessage = isDeletion ? 'Không thể xóa phân công. Vui lòng thử lại.' : 'Không thể lưu thay đổi. Vui lòng thử lại.';
      if (!isDeletion && this.isDuplicateError(error)) {
        errorMessage = 'Không thể gán cùng một giáo viên vào nhiều vai trò trong một lớp học.';
      }
      
      this.messageService.add({
        severity: 'error',
        summary: isDeletion ? 'Lỗi xóa phân công' : 'Lỗi tự động lưu',
        detail: errorMessage,
        life: 3000
      });
    } finally {
      // Clear saving state
      this.savingStates.set(saveKey, false);
      this.cdr.detectChanges();
    }
  }

  isSaving(classId: number | undefined, role: string): boolean {
    if (!classId) return false;
    const saveKey = `${classId}-${role}`;
    return this.savingStates.get(saveKey) || false;
  }

  // New methods for teacher schedule tab improvements

  /**
   * Get filtered teachers for schedule selection based on global filters
   */
  getFilteredTeachersForSchedule(): TeacherModel[] {
    let filtered = [...this.availableTeachers];

    // Apply global department filter
    if (this.selectedDepartment?.trim()) {
      filtered = filtered.filter(teacher => teacher.department === this.selectedDepartment);
    }

    return filtered;
  }

  /**
   * Get filtered teacher schedule based on local and global filters
   */
  getFilteredTeacherSchedule(): ClassTeacherAssignment[] {
    if (!this.selectedTeacherForSchedule || this.teacherSchedule.length === 0) {
      return [];
    }

    let filtered = [...this.teacherSchedule];

    // Apply local search filter
    if (this.scheduleSearchQuery.trim()) {
      const searchTerm = this.scheduleSearchQuery.toLowerCase();
      filtered = filtered.filter(assignment => 
        assignment.class_name?.toLowerCase().includes(searchTerm) ||
        assignment.class_code?.toLowerCase().includes(searchTerm) ||
        assignment.course_name?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply local role filter
    if (this.scheduleRoleFilter?.trim()) {
      filtered = filtered.filter(assignment => assignment.role === this.scheduleRoleFilter);
    }

    // Apply local status filter
    if (this.scheduleStatusFilter?.trim()) {
      filtered = filtered.filter(assignment => assignment.status === this.scheduleStatusFilter);
    }

    // Apply global semester filter
    if (this.selectedSemester?.trim()) {
      filtered = filtered.filter(assignment => {
        const classItem = this.classes.find(c => c.id === assignment.class_id);
        return classItem ? this.isClassInSemester(classItem, this.selectedSemester) : false;
      });
    }

    return filtered;
  }

  /**
   * Check if there are active schedule-specific filters
   */
  hasScheduleFilters(): boolean {
    return !!(
      this.scheduleSearchQuery?.trim() ||
      this.scheduleRoleFilter?.trim() ||
      this.scheduleStatusFilter?.trim()
    );
  }

  /**
   * Handle schedule search change
   */
  onScheduleSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.scheduleSearchQuery = target.value;
    this.cdr.detectChanges();
  }

  /**
   * Handle schedule filter change
   */
  onScheduleFilterChange(): void {
    this.cdr.detectChanges();
  }

  /**
   * Edit teacher assignment from schedule table
   */
  onEditTeacherAssignment(assignment: ClassTeacherAssignment): void {
    if (!assignment.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể chỉnh sửa phân công không hợp lệ'
      });
      return;
    }

    // Find the class for this assignment
    const classItem = this.classes.find(c => c.id === assignment.class_id);
    if (!classItem) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy thông tin lớp học'
      });
      return;
    }

    this.onEditAssignment(assignment, classItem);
  }

  /**
   * Delete teacher assignment from schedule table
   */
  onDeleteTeacherAssignment(assignment: ClassTeacherAssignment): void {
    if (!this.isValidId(assignment.id)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa phân công: ID không hợp lệ'
      });
      return;
    }

    const teacherName = this.availableTeachers.find(t => t.id === assignment.teacher_id)?.teacher_name || 'Giáo viên';
    const classInfo = this.classes.find(c => c.id === assignment.class_id);
    const className = classInfo?.class_name || 'Lớp học';

    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa phân công của ${teacherName} cho lớp ${className}?`,
      header: 'Xác nhận xóa phân công',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      accept: () => {
        this.deleteAssignment(assignment.id!);
      }
    });
  }

}