import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassModel } from '../../models/class.model';
import { ClassService } from '../../services/class.service';
import { ClassStudentWithDetails, ClassStudent } from '../../models/class-student.model';
import { ClassStudentService } from '../../services/class-student.service';
import { CoursesService } from '../../../courses/services/courses.service';
import { StudentsModel } from '../../../students-management/models/students.model';
import { StudentService } from '../../../students-management/services/student.service';
import { TeachingAssignmentService } from '../../../teaching-assignments/services/teaching-assignment.service';
import { ClassTeacherAssignment } from '../../../teaching-assignments/models/teaching-assignment.model';
import { TeacherService } from '../../../teacher-management/services/teacher.service';
import { TeacherModel } from '../../../teacher-management/models/teacher.model';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule, Table } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';
import { ClassSchedule } from '../class-schedule/class-schedule';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { PickListModule } from 'primeng/picklist';
import * as XLSX from 'xlsx';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-class-detail',
  templateUrl: 'class-detail.html',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    TableModule,
    DialogModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    CheckboxModule,
    ToggleButtonModule,
    InputTextModule,
    FormsModule,
    ConfirmDialogModule,
    TabsModule,
    AvatarModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
    TooltipModule,
    DrawerModule,
    PickListModule,
  ],
  providers: [ConfirmationService],
  styleUrls: ['./class-detail.scss']
})
export class ClassDetail implements OnInit, OnDestroy {
  @ViewChild('dt') dt!: Table;
  
  classData: ClassModel | null = null;
  loading: boolean = false;
  classId: number | null = null;
  activeTabIndex: number = 0;
  
  // Student management properties
  classStudents: ClassStudentWithDetails[] = [];
  filteredClassStudents: ClassStudentWithDetails[] = [];
  selectedStudents: ClassStudentWithDetails[] = [];
  hasSelectedStudentsFlag: boolean = false;
  studentsLoading: boolean = false;
  displayEnrollDialog: boolean = false;
  enrollDrawerVisible: boolean = false;
  
  // Edit status dialog properties
  displayEditStatusDialog: boolean = false;
  editingStudent: ClassStudentWithDetails | null = null;
  newStatus: string = '';
  completionDate: Date | null = null;
  availableStudents: StudentsModel[] = [];
  selectedStudentIds: number[] = [];
  selectedStudentId: number | null = null;
  classStatistics: any = {
    totalStudents: 0,
    activeStudents: 0,
    completedStudents: 0,
    droppedStudents: 0
  };
  
  // Bulk operations properties
  bulkEnrollMode: boolean = false;
  
  // Search and filter properties
  searchQuery: string = '';
  showClearButton: boolean = false;
  showAdvancedFilters: boolean = false;
  hasActiveFilters: boolean = false;
  
  // RxJS subjects for better memory management
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  
  // Advanced filters properties
  showFilters: boolean = false;
  studentFilters: any = {
    gender: null,
    status: null,
    search: ''
  };
  
  // Filter options
  genderOptions = [
    { label: 'Nam', value: 'Nam' },
    { label: 'Nữ', value: 'Nữ' },
    { label: 'Khác', value: 'Khác' }
  ];
  
  studentStatusOptions = [
    { label: 'Đang học', value: 'Đang học' },
    { label: 'Tạm dừng', value: 'Tạm dừng' },
    { label: 'Hoàn thành', value: 'Hoàn thành' },
    { label: 'Nghỉ học', value: 'Nghỉ học' }
  ];

  // Audit trail properties
  auditTrail: any[] = [];
  auditLoading: boolean = false;
  
  // Tabs configuration
  tabs: { title: string; value: number; content: string }[] = [];

  // Status options for student status updates
  statusOptions = [
    { label: 'Đang học', value: 'Đang học' },
    { label: 'Hoàn thành', value: 'Hoàn thành' },
    { label: 'Nghỉ học', value: 'Nghỉ học' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classService: ClassService,
    private classStudentService: ClassStudentService,
    private studentService: StudentService,
    private coursesService: CoursesService,
    private teachingAssignmentService: TeachingAssignmentService,
    private teacherService: TeacherService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeTabs();
    this.setupSearchSubscription();
    
    // Subscribe to route params and query params
    this.route.params.subscribe(params => {
      this.classId = +params['id'];
      if (this.classId) {
        this.loadClassDetail();
        // Chỉ load class students, statistics sẽ được load trong callback
        this.loadClassStudents();
      }
    });
    
    // Subscribe to query params to handle tab navigation
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['tab']) {
        const tabIndex = +queryParams['tab'];
        if (tabIndex >= 0 && tabIndex < this.tabs.length) {
          this.activeTabIndex = tabIndex;
        }
      } else {
        // Reset to default tab (first tab) when no tab parameter
        this.activeTabIndex = 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscription(): void {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchQuery = searchTerm;
      this.filterClassStudents();
      this.loadClassStatistics();
    });
  }

  private initializeTabs(): void {
    this.tabs = [
      { title: 'Thông tin cơ bản', value: 0, content: 'basic-info' },
      { title: 'Học viên', value: 1, content: 'students' },
      { title: 'Lịch học', value: 2, content: 'schedule' },
      { title: 'Kết quả học tập', value: 3, content: 'results' },
      { title: 'Lịch sử thay đổi', value: 4, content: 'audit-trail' }
    ];
  }

  private loadClassDetail(): void {
    if (!this.classId) return;
    
    this.loading = true;
    
    // Thử load class cụ thể trước
    this.classService.getClasses().subscribe({
      next: (response: any) => {
        let classData = null;
        if (Array.isArray(response)) {
          classData = response.find((c: any) => c.id === this.classId);
        } else if (response?.data) {
          if (Array.isArray(response.data)) {
            classData = response.data.find((c: any) => c.id === this.classId);
          } else {
            classData = response.data;
          }
        } else if (response?.id === this.classId) {
          classData = response;
        }
        
        // Xử lý dữ liệu class thực tế
        if (classData) {
          this.classData = {
            id: classData.id,
            class_code: classData.class_code || `L${classData.id}`,
            class_name: classData.class_name || 'Tên lớp không xác định',
            course_id: classData.course_id,
            start_date: classData.start_date || null,
            end_date: classData.end_date || null,
            room: classData.room || null,
            max_students: classData.max_students || null,
            status: classData.status || 'Mở đăng ký',
            description: classData.description || null,
            learning_outcomes: classData.learning_outcomes || null,
            is_deleted: classData.is_deleted || 0,
            course_name: classData.course_name && classData.course_name.trim() ? classData.course_name : null,
            lecturers: classData.lecturers || []
          };
          
          // Nếu course_name trống nhưng có course_id, thử load course name
          if ((!this.classData?.course_name || !this.classData.course_name.trim()) && this.classData?.course_id) {
            this.loadCourseName(this.classData.course_id);
          }
          
          // Load teacher assignments from class_teachers table
          this.loadTeacherAssignments();
          
          this.loading = false;
        } else {
          // Fallback: load all classes
          this.loadAllClasses();
        }
      },
      error: (error) => {
        // Fallback: load all classes
        this.loadAllClasses();
      }
    });
  }

  private loadAllClasses(): void {
    this.classService.getClasses().subscribe({
      next: (classes: ClassModel[]) => {
        this.classData = classes.find(c => c.id === this.classId) || null;
        if (!this.classData) {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không tìm thấy thông tin lớp học'
          });
          this.router.navigate(['/features/class']);
        } else {
          // Load teacher assignments from class_teachers table
          this.loadTeacherAssignments();
        }
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin lớp học'
        });
        this.loading = false;
        this.router.navigate(['/features/class']);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/features/class']);
  }

  onEdit(): void {
    if (this.classData?.id) {
      this.router.navigate(['/features/class/edit', this.classData.id]);
    }
  }

  // Student management methods
  loadClassStudents(): void {
    if (!this.classId) return;
    
    this.studentsLoading = true;
    this.classStudentService.getStudentsByClass(this.classId).subscribe({
      next: (response) => {
        // Xử lý dữ liệu trả về
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
        
        // Lọc và xử lý dữ liệu học viên thực tế
        this.classStudents = students
          .filter((student: any) => {
            // Chỉ lấy học viên thuộc lớp hiện tại
            return student.class_id === this.classId;
          })
          .map((student: any, index: number): ClassStudentWithDetails => {
            // Kiểm tra xem có dữ liệu student được join không
            const hasStudentData = student.student && student.student.id;
            
            // Xử lý dữ liệu thực tế từ API
            const processedStudent: ClassStudentWithDetails = {
              id: student.id || student.class_student_id || `temp_${index}_${student.student_id}`,
              class_id: student.class_id || this.classId,
              student_id: student.student_id,
              enroll_date: student.enroll_date,
              status: student.status || 'Đang học',
              completion_date: student.completion_date || null,
              note: student.note || null,
              
              // Xử lý dữ liệu student từ join hoặc từ API response
              student: {
                id: student.student?.id || student.student_id,
                student_code: student.student?.student_code || '',
                full_name: student.student?.full_name || '',
                email: student.student?.email || '',
                phone: student.student?.phone || '',
                gender: student.student?.gender || 'Nam',
                status: student.student?.status || 'Đang học'
              },
              
              // Dữ liệu join từ model (nếu có)
              student_name: student.student?.full_name || '',
              student_code: student.student?.student_code || '',
              student_email: student.student?.email || '',
              student_phone: student.student?.phone || '',
              class_name: student.class_name || this.classData?.class_name
            };
            
            return processedStudent;
          });
        
        this.studentsLoading = false;
        
        // Initialize filtered students with all students
        this.filteredClassStudents = [...this.classStudents];
        
        
        // Nếu không có dữ liệu student được join, load thêm thông tin student
        if (this.classStudents.some(cs => !cs.student || !cs.student.full_name || cs.student.full_name === '')) {
          this.loadStudentDetails();
        } else {
          this.loadClassStatistics();
        }
      },
      error: (error) => {
        let errorMessage = 'Không thể tải danh sách học viên';
        
        if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.status === 403) {
          errorMessage = 'Bạn không có quyền truy cập dữ liệu này';
        } else if (error.status === 404) {
          errorMessage = 'Không tìm thấy dữ liệu học viên';
        } else if (error.status === 500) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
        }
        
        // Reset classStudents về mảng rỗng khi có lỗi
        this.classStudents = [];
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: errorMessage
        });
        this.studentsLoading = false;
        
        // Đảm bảo statistics được cập nhật ngay cả khi có lỗi
        this.loadClassStatistics();
      }
    });
  }

  private loadClassStatistics(): void {
    if (!this.classId) return;
    
    // Sử dụng filteredClassStudents nếu có, nếu không thì dùng classStudents
    const studentsToUse = this.filteredClassStudents && this.filteredClassStudents.length > 0 
      ? this.filteredClassStudents 
      : this.classStudents;
    
    // Luôn tính toán statistics từ dữ liệu students thực tế
    // Không sử dụng API fallback để tránh dữ liệu không chính xác
      this.classStatistics = {
      totalStudents: studentsToUse ? studentsToUse.length : 0,
      activeStudents: studentsToUse ? studentsToUse.filter(s => s.status === 'Đang học').length : 0,
      completedStudents: studentsToUse ? studentsToUse.filter(s => s.status === 'Hoàn thành').length : 0,
      droppedStudents: studentsToUse ? studentsToUse.filter(s => s.status === 'Nghỉ học').length : 0
    };
  }

  // Show dialog to enroll new student
  showEnrollDialog(): void {
        this.loadAvailableStudents();
    this.enrollDrawerVisible = true;
    }
    

    

  private loadAvailableStudents(): void {
    const apiFilters: any = {};

    this.studentService.getStudents(apiFilters).subscribe({
      next: (response) => {
        let students: any[] = [];
        if (response?.data) {
          students = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
          students = response;
        }
        
        // Filter out students already enrolled in this class
        const enrolledStudentIds = this.classStudents.map(cs => cs.student_id);
        
        this.availableStudents = students.filter(student => 
          student && student.id && !enrolledStudentIds.includes(student.id)
        );
        
        this.selectedStudentIds = [];
        
        this.cdr.detectChanges();
        
        if (this.availableStudents.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Thông báo',
            detail: 'Không có học viên nào có thể thêm vào lớp này'
          });
        }
      },
      error: (error) => {
        console.error('Error loading available students:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách học viên có sẵn'
        });
        this.loadAllStudents();
      }
    });
  }

  private loadAllStudents(): void {
    this.studentService.getStudents({}).subscribe({
      next: (response) => {
        let students: any[] = [];
        if (response?.data) {
          students = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
          students = response;
        } else if (response && typeof response === 'object') {
          students = [response];
        }
        
        // Filter out students already enrolled in this class
        const enrolledStudentIds = this.classStudents.map(cs => cs.student_id);
        
        this.availableStudents = students.filter((s: any) => {
          const isValid = s && s.id && !enrolledStudentIds.includes(s.id);
          return isValid;
        });
        
        this.selectedStudentIds = [];
      },
      error: (error) => {
        console.error('Error in fallback loading:', error);
        this.availableStudents = [];
        this.selectedStudentIds = [];
      }
    });
  }

  // Enroll selected student
  enrollStudent(): void {
    if (!this.selectedStudentId || !this.classId) return;

    const selectedStudent = this.availableStudents.find(s => s.id === this.selectedStudentId);
    const studentName = selectedStudent ? selectedStudent.full_name : 'học viên';

    const enrollmentData: ClassStudent = {
      class_id: this.classId,
      student_id: this.selectedStudentId,
      enroll_date: new Date().toISOString().split('T')[0],
      status: 'Đang học' as const
    };

    // Show loading notification
    this.messageService.add({
      severity: 'info',
      summary: 'Đang xử lý...',
      detail: `Đang ghi danh ${studentName} vào lớp ${this.classData?.class_name}`
    });

    this.classStudentService.enrollStudent(enrollmentData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Ghi danh thành công',
          detail: `Đã ghi danh ${studentName} vào lớp ${this.classData?.class_name} thành công`
        });
        
        this.enrollDrawerVisible = false;
        this.selectedStudentId = null;
        this.loadClassStudents();
        this.loadClassStatistics();
        
        // Add audit entry
        this.addAuditEntry('enroll', 'Ghi danh học viên', `Đã ghi danh ${studentName} vào lớp`, `Học viên: ${studentName} - Trạng thái: Đang học`);
        
        // Show updated statistics
        setTimeout(() => {
          this.messageService.add({
            severity: 'info',
            summary: 'Thống kê cập nhật',
            detail: `Lớp hiện có ${this.classStatistics.totalStudents + 1} học viên`
          });
        }, 1000);
      },
      error: (error) => {
        console.error('Error enrolling student:', error);
        let errorMessage = 'Không thể ghi danh học viên';
        
        if (error.status === 409) {
          errorMessage = `${studentName} đã có trong lớp này`;
        } else if (error.status === 400) {
          errorMessage = 'Dữ liệu không hợp lệ';
        } else if (error.status === 404) {
          errorMessage = 'Không tìm thấy lớp học hoặc học viên';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Ghi danh thất bại',
          detail: errorMessage
        });
      }
    });
  }

  // Update student status
  updateStudentStatus(classStudent: ClassStudentWithDetails, event: any): void {
    const newStatus = event.value;
    const oldStatus = classStudent.status;
    if (!classStudent.id) return;

    // Prepare update data
    const updateData: any = { status: newStatus };
    
    // Auto-set completion_date when status changes to "Hoàn thành" or "Nghỉ học"
    if ((newStatus === 'Hoàn thành' || newStatus === 'Nghỉ học') && !classStudent.completion_date) {
      updateData.completion_date = new Date().toISOString().split('T')[0];
    }
    
    // Clear completion_date if status changes back to "Đang học"
    if (newStatus === 'Đang học' && classStudent.completion_date) {
      updateData.completion_date = null;
    }

    // Show loading notification
    this.messageService.add({
      severity: 'info',
      summary: 'Đang cập nhật...',
      detail: `Đang thay đổi trạng thái của ${classStudent.student.full_name} từ "${oldStatus}" sang "${newStatus}"`
    });

    this.classStudentService.updateStudentStatus(classStudent.id, newStatus, updateData.completion_date).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cập nhật thành công',
          detail: `Đã thay đổi trạng thái của ${classStudent.student.full_name} từ "${oldStatus}" sang "${newStatus}"`
        });
        
        this.loadClassStudents();
        this.loadClassStatistics();
        
        // Add audit entry
        this.addAuditEntry('status_change', 'Thay đổi trạng thái học viên', `Đã thay đổi trạng thái của ${classStudent.student.full_name}`, `Từ "${oldStatus}" sang "${newStatus}"`);
        
        // Show updated statistics after a delay
        setTimeout(() => {
          const statusCount = this.getStatusCount(newStatus);
          this.messageService.add({
            severity: 'info',
            summary: 'Thống kê cập nhật',
            detail: `Hiện có ${statusCount} học viên với trạng thái "${newStatus}"`
          });
        }, 1000);
      },
      error: (error) => {
        console.error('Error updating student status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Cập nhật thất bại',
          detail: `Không thể thay đổi trạng thái của ${classStudent.student.full_name}`
        });
      }
    });
  }

  private getStatusCount(status: string): number {
    return this.classStudents.filter(cs => cs.status === status).length;
  }

  // Remove student from class
  confirmRemoveStudent(classStudent: ClassStudentWithDetails): void {
    const studentName = classStudent.student?.full_name || 'học viên';
    const className = this.classData?.class_name || 'lớp học';
    
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa học viên "${studentName}" khỏi lớp "${className}"?`,
      header: 'Xác nhận xóa học viên',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.removeStudent(classStudent);
      }
    });
  }

  removeStudent(classStudent: ClassStudentWithDetails): void {
    if (!classStudent.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xác định học viên để xóa'
      });
      return;
    }

    const studentName = classStudent.student?.full_name || 'học viên';
    const className = this.classData?.class_name || 'lớp học';

    // Show loading notification
    this.messageService.add({
      severity: 'info',
      summary: 'Đang xử lý...',
      detail: `Đang xóa học viên "${studentName}" khỏi lớp "${className}"`
    });

    this.classStudentService.removeStudent(classStudent.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Xóa thành công',
          detail: `Đã xóa học viên "${studentName}" khỏi lớp "${className}"`
        });
        
        // Reload data
        this.loadClassStudents();
        this.loadClassStatistics();
        
        // Add audit entry
        this.addAuditEntry('student_removal', 'Xóa học viên khỏi lớp', `Đã xóa học viên "${studentName}"`, `Khỏi lớp "${className}"`);
      },
      error: (error) => {
        console.error('Error removing student:', error);
        
        let errorMessage = 'Không thể xóa học viên khỏi lớp';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi xóa học viên',
          detail: errorMessage
        });
      }
    });
  }

  // Bulk remove students
  confirmBulkRemoveStudents(): void {
    if (!this.hasSelectedStudentsFlag || !this.selectedStudents || this.selectedStudents.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng chọn ít nhất một học viên để xóa'
      });
      return;
    }

    const selectedStudents = this.selectedStudents;

    const studentNames = selectedStudents.map(s => s.student?.full_name).filter(name => name).join(', ');
    const className = this.classData?.class_name || 'lớp học';

    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa ${selectedStudents.length} học viên khỏi lớp "${className}"?<br><br><strong>Học viên:</strong> ${studentNames}`,
      header: 'Xác nhận xóa nhiều học viên',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa tất cả',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.bulkRemoveStudents(selectedStudents);
      }
    });
  }

  bulkRemoveStudents(students: ClassStudentWithDetails[]): void {
    const className = this.classData?.class_name || 'lớp học';
    
    // Show loading notification
    this.messageService.add({
      severity: 'info',
      summary: 'Đang xử lý...',
      detail: `Đang xóa ${students.length} học viên khỏi lớp "${className}"`
    });

    const removePromises = students.map(student => {
      if (student.id) {
        return this.classStudentService.removeStudent(student.id).toPromise();
      }
      return Promise.resolve();
    });

    Promise.allSettled(removePromises).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        this.messageService.add({
          severity: 'success',
          summary: 'Xóa thành công',
          detail: `Đã xóa thành công ${successful} học viên khỏi lớp "${className}"`
        });
        
        // Clear selection
        this.clearSelection();
        this.hasSelectedStudentsFlag = false;
        
        // Reload data
        this.loadClassStudents();
        this.loadClassStatistics();
        
        // Add audit entry
        this.addAuditEntry('bulk_student_removal', 'Xóa nhiều học viên khỏi lớp', `Đã xóa ${successful} học viên`, `Khỏi lớp "${className}"`);
      }

      if (failed > 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Một số lỗi xảy ra',
          detail: `Không thể xóa ${failed} học viên. Vui lòng thử lại.`
        });
      }
    });
  }

  hasSelectedStudents(): boolean {
    return this.selectedStudents && this.selectedStudents.length > 0;
  }

  clearSelection(): void {
    this.selectedStudents = [];
    this.hasSelectedStudentsFlag = false;
  }

  selectAllStudents(): void {
    this.selectedStudents = [...this.classStudents];
    this.hasSelectedStudentsFlag = this.selectedStudents.length > 0;
  }

  onSelectionChange(event: any): void {
    this.selectedStudents = event || [];
    this.hasSelectedStudentsFlag = this.selectedStudents.length > 0;
  }


  viewStudentDetail(studentId: number): void {
    this.router.navigate(['/features/students', studentId]);
  }

  // Bulk operations methods
  onBulkModeToggle(): void {
    if (!this.bulkEnrollMode) {
      // Switching to single mode - clear bulk selection
      this.selectedStudentIds = [];
    } else {
      // Switching to bulk mode - clear single selection
      this.selectedStudentId = null;
    }
  }

  cancelEnrollDialog(): void {
    this.enrollDrawerVisible = false;
    this.selectedStudentId = null;
    this.selectedStudentIds = [];
    this.selectedStudents = [];
    this.hasSelectedStudentsFlag = false;
    this.bulkEnrollMode = false;
  }

  enrollMultipleStudents(): void {
    if (!this.selectedStudentIds || this.selectedStudentIds.length === 0 || !this.classId) return;

    const enrollPromises = this.selectedStudentIds.map(studentId => {
      const enrollmentData: ClassStudent = {
        class_id: this.classId!,
        student_id: studentId,
        enroll_date: new Date().toISOString().split('T')[0],
        status: 'Đang học' as const
      };
      return this.classStudentService.enrollStudent(enrollmentData).toPromise();
    });

    // Show loading message
    this.messageService.add({
      severity: 'info',
      summary: 'Đang xử lý...',
      detail: `Đang ghi danh ${this.selectedStudentIds.length} học viên`
    });

    // Execute all enrollments
    Promise.allSettled(enrollPromises).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: `Đã ghi danh thành công ${successful} học viên`
        });
        
        // Refresh data
        this.loadClassStudents();
        this.loadClassStatistics();
      }

      if (failed > 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: `${failed} học viên không thể ghi danh (có thể đã tồn tại trong lớp)`
        });
      }

      // Close dialog and reset
      this.cancelEnrollDialog();
    }).catch(error => {
      console.error('Error in bulk enrollment:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra khi ghi danh học viên'
      });
    });
  }

  // Advanced filters methods
  applyFilters(): void {
    // Update studentFilters with current search query
    this.studentFilters.search = this.searchQuery;
    
    // Apply client-side filtering to classStudents
    this.filterClassStudents();
    
    // Update statistics based on filtered results
    this.loadClassStatistics();
    
    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: 'Đã áp dụng bộ lọc',
      detail: `Hiển thị ${this.filteredClassStudents.length} học viên theo bộ lọc`
    });
  }

  private filterClassStudents(): void {
    if (!this.classStudents || this.classStudents.length === 0) {
      this.filteredClassStudents = [];
      this.hasActiveFilters = false;
      return;
    }

    let filtered = [...this.classStudents];
    let hasFilters = false;

    // Apply search filter
    if (this.searchQuery && this.searchQuery.trim()) {
      const searchTerms = this.searchQuery.toLowerCase().trim().split(' ');
      filtered = filtered.filter(student => 
        this.advancedSearchInStudent(student, searchTerms)
      );
      hasFilters = true;
    }

    // Apply gender filter
    if (this.studentFilters.gender) {
      filtered = filtered.filter(student => 
        student.student?.gender === this.studentFilters.gender
      );
      hasFilters = true;
    }

    // Apply status filter
    if (this.studentFilters.status) {
      filtered = filtered.filter(student => 
        student.status === this.studentFilters.status
      );
      hasFilters = true;
    }

    // Update the displayed students and filter state
    this.filteredClassStudents = filtered;
    this.hasActiveFilters = hasFilters;
  }

  private advancedSearchInStudent(student: ClassStudentWithDetails, searchTerms: string[]): boolean {
    const searchableFields = [
      student.student?.student_code?.toLowerCase() || '',
      student.student?.full_name?.toLowerCase() || '',
      student.student?.gender?.toLowerCase() || '',
      student.student?.phone?.toLowerCase() || '',
      student.student?.email?.toLowerCase() || '',
      student.status?.toLowerCase() || '',
      student.note?.toLowerCase() || '',
      (student.enroll_date ? new Date(student.enroll_date).toLocaleDateString('vi-VN').toLowerCase() : ''),
      (student.completion_date ? new Date(student.completion_date).toLocaleDateString('vi-VN').toLowerCase() : '')
    ];

    return searchTerms.every(term => 
      searchableFields.some(field => field.includes(term))
    );
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.studentFilters = {
      gender: null,
      status: null,
      search: ''
    };
    
    // Reset filtered students to show all
    this.filteredClassStudents = [...this.classStudents];
    this.hasActiveFilters = false;
    
    // Update statistics
    this.loadClassStatistics();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Đã xóa bộ lọc',
      detail: `Hiển thị tất cả ${this.classStudents.length} học viên có sẵn`
    });
  }

  // Export functionality methods
  exportToExcel(): void {
    if (!this.classStudents.length || !this.classData) {
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
      { wch: 8 },  // STT
      { wch: 15 }, // Mã học viên
      { wch: 25 }, // Họ và tên
      { wch: 30 }, // Email
      { wch: 15 }, // Điện thoại
      { wch: 15 }, // Ngày ghi danh
      { wch: 12 }, // Trạng thái
      { wch: 15 }, // Ngày hoàn thành
      { wch: 25 }  // Ghi chú
    ];

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `danh_sach_hoc_vien_${this.classData.class_code}_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, filename);

    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Đã xuất ${this.classStudents.length} học viên ra file Excel`
    });
  }

  private generateHTMLReport(): string {
    const now = new Date();
    const currentDate = now.toLocaleDateString('vi-VN');
    const currentTime = now.toLocaleTimeString('vi-VN');

    let html = `
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <tr>
          <td colspan="9" style="text-align: center; font-size: 16px; font-weight: bold; padding: 20px; border: none;">
            BÁO CÁO DANH SÁCH HỌC VIÊN
          </td>
        </tr>
        <tr>
          <td colspan="9" style="text-align: center; font-size: 14px; font-weight: bold; padding: 10px; border: none;">
            Lớp: ${this.classData?.class_name || 'N/A'} (${this.classData?.class_code || 'N/A'})
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
            Tổng số học viên: ${this.classStudents.length}
          </td>
        </tr>
    `;

    // Add statistics if available
    if (this.classStatistics) {
      html += `
        <tr>
          <td colspan="9" style="padding: 5px; border: none; font-size: 11px;">
            Đang học: ${this.classStatistics.activeStudents} | Hoàn thành: ${this.classStatistics.completedStudents} | Nghỉ học: ${this.classStatistics.droppedStudents}
          </td>
        </tr>
      `;
    }

    html += `
        <tr>
          <td colspan="9" style="padding: 10px; border: none;"></td>
        </tr>
        <tr style="background-color: #f8f9fa; font-weight: bold;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">STT</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Mã học viên</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Họ và tên</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Email</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Điện thoại</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ngày ghi danh</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Trạng thái</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ngày hoàn thành</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ghi chú</td>
        </tr>
    `;

    // Add student data
    this.classStudents.forEach((student, index) => {
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.student.student_code || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.student.full_name || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.student.email || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.student.phone || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(student.enroll_date).toLocaleDateString('vi-VN')}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${student.status}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${student.completion_date ? new Date(student.completion_date).toLocaleDateString('vi-VN') : ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${student.note || ''}</td>
        </tr>
      `;
    });

    html += `</table>`;
    return html;
  }

  exportStudentsToPDF(): void {
    if (!this.classStudents.length || !this.classData) return;

    // Create HTML content for PDF
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .class-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DANH SÁCH HỌC VIÊN</h1>
            <h2>${this.classData.class_name}</h2>
          </div>
          
          <div class="class-info">
            <p><strong>Mã lớp:</strong> ${this.classData.class_code}</p>
            <p><strong>Trạng thái:</strong> ${this.classData.status}</p>
            <p><strong>Ngày xuất:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã học viên</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Ngày ghi danh</th>
                <th>Trạng thái</th>
                <th>Ngày hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              ${this.classStudents.map((student, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${student.student.student_code}</td>
                  <td>${student.student.full_name}</td>
                  <td>${student.student.email || ''}</td>
                  <td>${student.student.phone || ''}</td>
                  <td>${new Date(student.enroll_date).toLocaleDateString('vi-VN')}</td>
                  <td>${student.status}</td>
                  <td>${student.completion_date ? new Date(student.completion_date).toLocaleDateString('vi-VN') : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Tổng số học viên: ${this.classStudents.length}</p>
            <p>Xuất báo cáo lúc: ${new Date().toLocaleString('vi-VN')}</p>
          </div>
        </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto print
      setTimeout(() => {
        printWindow.print();
      }, 500);

      this.messageService.add({
        severity: 'success',
        summary: 'Xuất PDF thành công',
        detail: `Đã tạo file PDF cho ${this.classStudents.length} học viên`
      });
    }
  }

  // Audit trail methods
  getAuditIcon(action: string): string {
    switch (action) {
      case 'enroll':
        return 'pi pi-user-plus';
      case 'remove':
        return 'pi pi-user-minus';
      case 'status_change':
        return 'pi pi-refresh';
      case 'update':
        return 'pi pi-pencil';
      default:
        return 'pi pi-info-circle';
    }
  }

  private loadAuditTrail(): void {
    if (!this.classId) return;
    
    this.auditLoading = true;
    
    // Simulate loading audit trail data
    // In a real application, this would be an API call
    setTimeout(() => {
      this.auditTrail = [
        {
          id: 1,
          action: 'enroll',
          title: 'Ghi danh học viên',
          description: 'Đã ghi danh học viên Nguyễn Văn A vào lớp',
          details: 'Học viên: Nguyễn Văn A (HV001) - Trạng thái: Đang học',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          user: 'Admin User'
        },
        {
          id: 2,
          action: 'status_change',
          title: 'Thay đổi trạng thái học viên',
          description: 'Đã thay đổi trạng thái của học viên Trần Thị B',
          details: 'Từ "Đang học" sang "Hoàn thành"',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          user: 'Teacher User'
        },
        {
          id: 3,
          action: 'enroll',
          title: 'Ghi danh nhiều học viên',
          description: 'Đã ghi danh 5 học viên vào lớp cùng lúc',
          details: 'Học viên: Lê Văn C, Phạm Thị D, Hoàng Văn E, Ngô Thị F, Vũ Văn G',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          user: 'Admin User'
        },
        {
          id: 4,
          action: 'remove',
          title: 'Xóa học viên khỏi lớp',
          description: 'Đã xóa học viên Đỗ Văn H khỏi lớp',
          details: 'Lý do: Chuyển lớp',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          user: 'Admin User'
        },
        {
          id: 5,
          action: 'update',
          title: 'Cập nhật thông tin lớp',
          description: 'Đã cập nhật thông tin lớp học',
          details: 'Thay đổi: Mô tả lớp học và lịch học',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          user: 'Admin User'
        }
      ];
      this.auditLoading = false;
    }, 1000);
  }

  // Method to add audit entry (called when actions are performed)
  private addAuditEntry(action: string, title: string, description: string, details?: string): void {
    const auditEntry = {
      id: Date.now(),
      action,
      title,
      description,
      details,
      timestamp: new Date(),
      user: 'Current User' // In real app, get from auth service
    };
    
    this.auditTrail.unshift(auditEntry); // Add to beginning of array
    
    // Keep only last 50 entries
    if (this.auditTrail.length > 50) {
      this.auditTrail = this.auditTrail.slice(0, 50);
    }
  }


  // Tab change handler
  onTabChange(event: any): void {
    this.activeTabIndex = event;
    
    // Load data based on tab
    switch (event) {
      case 1: // Học viên tab
        this.loadClassStudents();
        break;
      case 2: // Lịch học tab - navigate to separate route
        this.navigateToSchedule();
        break;
      case 3: // Kết quả học tập tab - navigate to separate route
        this.navigateToStudyResults();
        break;
      case 4: // Lịch sử thay đổi tab
        this.loadAuditTrail();
        break;
      default:
        break;
    }
  }

  // Navigate to schedule page
  navigateToSchedule(): void {
    if (this.classId) {
      this.router.navigate(['/features/class', this.classId, 'schedule']);
    }
  }

  // Navigate to study results page
  navigateToStudyResults(): void {
    if (this.classId) {
      this.router.navigate(['/features/class', this.classId, 'study-results']);
    }
  }

  // Load student details if not joined from API
  private loadStudentDetails(): void {
    const studentIds = this.classStudents.map(cs => cs.student_id);
    
    // Load student details from student service
    this.studentService.getStudents().subscribe({
      next: (studentsResponse) => {
        let students: any[] = [];
        if (Array.isArray(studentsResponse)) {
          students = studentsResponse;
        } else if (studentsResponse?.data) {
          students = Array.isArray(studentsResponse.data) ? studentsResponse.data : [studentsResponse.data];
        }
        
        // Update class students with real student data
        this.classStudents = this.classStudents.map(cs => {
          const studentDetail = students.find(s => s.id === cs.student_id);
          if (studentDetail) {
            cs.student = {
              id: studentDetail.id,
              student_code: studentDetail.student_code || '',
              full_name: studentDetail.full_name || '',
              email: studentDetail.email || '',
              phone: studentDetail.phone || '',
              gender: studentDetail.gender || 'Nam',
              status: studentDetail.status || 'Đang học'
            };
          }
          return cs;
        });
        
        // Update filtered students after loading student details
        this.filteredClassStudents = [...this.classStudents];
        
        this.loadClassStatistics();
      },
      error: (error) => {
        console.error('Error loading student details:', error);
        this.loadClassStatistics();
      }
    });
  }

  // Get last name initial for avatar
  getLastNameInitial(fullName: string): string {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    return names[names.length - 1].charAt(0).toUpperCase();
  }

  // Get status severity for p-tag
  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null {
    switch (status) {
      case 'Đang học':
        return 'success';
      case 'Hoàn thành':
        return 'info';
      case 'Nghỉ học':
        return 'danger';
      default:
        return 'secondary';
    }
  }



  // Force refresh student data
  forceRefreshStudents(): void {
    this.studentsLoading = true;
    this.classStudents = [];
    // Clear selections when refreshing
    this.selectedStudents = [];
    this.hasSelectedStudentsFlag = false;
    this.filteredClassStudents = [];
    
    // Reset filters and search
    this.searchQuery = '';
    this.studentFilters = {
      gender: null,
      status: null,
      search: ''
    };
    this.hasActiveFilters = false;
    
    // Clear any selected students
    this.selectedStudentId = null;
    this.selectedStudentIds = [];
    this.bulkEnrollMode = false;
    
    // Reset table sorting to original state
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
    
    // Load fresh data
    this.loadClassStudents();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Đang làm mới',
      detail: 'Đang tải lại danh sách học viên...'
    });
  }

  // Refresh method for template
  onRefresh(): void {
    // Clear all selections before refresh
    this.clearSelection();
    this.hasSelectedStudentsFlag = false;
    
    // Force refresh students data
    this.forceRefreshStudents();
  }

  // Search and filter methods
  onGlobalFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = (input?.value || '').trim();
    this.searchQuery = value;
    this.searchSubject$.next(value);
  }

  onSearch(event: any): void {
    this.searchQuery = event.target.value;
    
    // Apply filter immediately
    this.filterClassStudents();
    this.loadClassStatistics();
    
    // Also trigger the debounced search
    this.searchSubject$.next(event.target.value);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onClearFilters(): void {
    this.clearFilters();
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  }

  getStudentById(studentId: number): StudentsModel | undefined {
    return this.availableStudents.find(student => student.id === studentId);
  }

  get hasValidCourseName(): boolean {
    return !!(this.classData?.course_name && this.classData.course_name.trim());
  }

  get courseName(): string {
    return this.classData?.course_name || '';
  }

  private loadCourseName(courseId: number): void {
    this.coursesService.getCourses().subscribe({
      next: (response: any) => {
        let courses = [];
        if (response?.data) {
          courses = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
          courses = response;
        }
        
        const course = courses.find((c: any) => c.id === courseId);
        if (course && course.course_name) {
          this.classData!.course_name = course.course_name;
        }
      },
      error: (error: any) => {
        console.error('Error loading course name:', error);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  toggleStudentSelection(studentId: number | undefined): void {
    if (studentId === undefined || studentId === null) {
      return;
    }
    const index = this.selectedStudentIds.indexOf(studentId);
    
    if (index > -1) {
      this.selectedStudentIds.splice(index, 1);
    } else {
      this.selectedStudentIds.push(studentId);
    }
  }

  removeStudentFromSelection(studentId: number | undefined): void {
    if (studentId === undefined || studentId === null) {
      return;
    }
    const index = this.selectedStudentIds.indexOf(studentId);
    if (index > -1) {
      this.selectedStudentIds.splice(index, 1);
    }
  }

  // Edit status dialog methods
  showEditStatusDialog(student: ClassStudentWithDetails): void {
    this.editingStudent = student;
    this.newStatus = student.status;
    // Convert date string to Date object for p-datePicker
    if (student.completion_date) {
      this.completionDate = new Date(student.completion_date);
    } else {
      this.completionDate = null;
    }
    this.displayEditStatusDialog = true;
  }

  onStatusChange(): void {
    // Force change detection
    setTimeout(() => {
      // Status change detected
    }, 100);
  }

  cancelEditStatusDialog(): void {
    this.displayEditStatusDialog = false;
    this.editingStudent = null;
    this.newStatus = '';
    this.completionDate = null;
  }

  confirmUpdateStatus(): void {
    if (!this.editingStudent || !this.newStatus) return;

    const updateData: any = { status: this.newStatus };
    
    // Auto-set completion_date when status changes to "Hoàn thành" or "Nghỉ học"
    if ((this.newStatus === 'Hoàn thành' || this.newStatus === 'Nghỉ học') && !this.editingStudent.completion_date) {
      updateData.completion_date = this.completionDate ? this.completionDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    } else if (this.completionDate) {
      updateData.completion_date = this.completionDate.toISOString().split('T')[0];
    }
    
    // Clear completion_date if status changes back to "Đang học"
    if (this.newStatus === 'Đang học' && this.editingStudent.completion_date) {
      updateData.completion_date = null;
    }

    const oldStatus = this.editingStudent.status;

    // Show loading notification
    this.messageService.add({
      severity: 'info',
      summary: 'Đang cập nhật...',
      detail: `Đang thay đổi trạng thái của ${this.editingStudent.student.full_name} từ "${oldStatus}" sang "${this.newStatus}"`
    });

    this.classStudentService.updateStudentStatus(this.editingStudent.id!, this.newStatus, updateData.completion_date).subscribe({
      next: () => {
        const studentName = this.editingStudent?.student?.full_name || 'học viên';
        
        this.messageService.add({
          severity: 'success',
          summary: 'Cập nhật thành công',
          detail: `Đã thay đổi trạng thái của ${studentName} từ "${oldStatus}" sang "${this.newStatus}"`
        });
        
        this.loadClassStudents();
        this.loadClassStatistics();
        this.cancelEditStatusDialog();
        
        // Add audit entry
        this.addAuditEntry('status_change', 'Thay đổi trạng thái học viên', `Đã thay đổi trạng thái của ${studentName}`, `Từ "${oldStatus}" sang "${this.newStatus}"`);
      },
      error: (error) => {
        console.error('Error updating student status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật trạng thái học viên. Vui lòng thử lại.'
        });
      }
    });
  }

  private loadTeacherAssignments(): void {
    if (!this.classId || !this.classData) return;

    this.teachingAssignmentService.getClassTeacherAssignments(this.classId).subscribe({
      next: (assignments: ClassTeacherAssignment[]) => {
        if (assignments && assignments.length > 0) {
          // Load all teachers to get complete teacher information
          this.teacherService.getTeachers({}).subscribe({
            next: (teachers: TeacherModel[]) => {
              // Map assignments to lecturer format expected by the template
              const lecturers = assignments.map(assignment => {
                const teacher = teachers.find(t => t.id === assignment.teacher_id);
                return {
                  id: assignment.teacher_id,
                  name: teacher?.teacher_name || assignment.teacher_name || 'Không xác định',
                  email: teacher?.email || assignment.teacher_email || '',
                  phone: teacher?.phone || '',
                  role: assignment.role
                };
              });

              // Update classData with lecturers from class_teachers table
              if (this.classData) {
                this.classData.lecturers = lecturers;
                this.cdr.detectChanges();
              }
            },
            error: (error) => {
              // Fallback: use assignment data even without complete teacher info
              const lecturers = assignments.map(assignment => ({
                id: assignment.teacher_id,
                name: assignment.teacher_name || 'Không xác định',
                email: assignment.teacher_email || '',
                phone: '',
                role: assignment.role
              }));

              if (this.classData) {
                this.classData.lecturers = lecturers;
                this.cdr.detectChanges();
              }
            }
          });
        }
      },
      error: (error) => {
        // If error loading assignments, keep existing lecturers or empty array
      }
    });
  }
}

