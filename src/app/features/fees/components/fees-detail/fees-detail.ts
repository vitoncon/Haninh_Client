import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TabsModule } from 'primeng/tabs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ClassModel } from '../../../class-management/models/class.model';
import { ClassStudentWithDetails } from '../../../class-management/models/class-student.model';
import { ClassService } from '../../../class-management/services/class.service';
import { ClassStudentService } from '../../../class-management/services/class-student.service';
import { StudentService } from '../../../students-management/services/student.service';
import { FeeService } from '../../services/fee.service';
import { FeeWithDetails, FeeStatistics, Fee } from '../../models/fees.model';
import { StudentsModel } from '../../../students-management/models/students.model';
import { CoursesService } from '../../../courses/services/courses.service';
import { Course } from '../../../courses/models/courses.model';

interface ClassInfo {
  id: number;
  name: string;
  course: string;
  tuition: number;
  start_date: string;
  teacher: string;
}

interface StudentPayment {
  id: number; // This will be the fee ID for consistency with existing logic
  fee_id?: number; // Explicit fee ID
  student_id?: number; // Student ID for filtering
  name: string;
  amount: number | string; // Support both number and string from API
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  payment_status: string | null; // Allow null to match database schema
  notes?: string;
}

interface ClassFeeDetailsResponse {
  class: ClassInfo;
  students: StudentPayment[];
}

@Component({
  selector: 'app-fees-detail',
  templateUrl: './fees-detail.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    TableModule,
    CardModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TabsModule,
    ProgressSpinnerModule,
    AvatarModule,
    ToolbarModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    ConfirmDialogModule,
    CheckboxModule,
  ],
  providers: [ConfirmationService],
  styleUrls: ['./fees-detail.scss']
})
export class FeesDetail implements OnInit, OnDestroy {
  classData: ClassModel | null = null;
  classInfo: ClassInfo | null = null;
  classStudents: ClassStudentWithDetails[] = [];
  studentsData: Map<number, StudentsModel> = new Map(); // Cache student data by student_id
  classFees: FeeWithDetails[] = [];
  filteredFees: FeeWithDetails[] = [];
  students: StudentPayment[] = [];
  filteredStudents: StudentPayment[] = [];
  // Combined data for table display
  tableData: (StudentPayment | FeeWithDetails)[] = [];
  statistics: FeeStatistics | null = null;
  loading: boolean = false;
  classId: number | null = null;
  searchQuery: string = '';
  
  // Dialog properties
  editDialogVisible: boolean = false;
  confirmPaymentDialogVisible: boolean = false;
  viewPaymentDialogVisible: boolean = false;
  selectedStudent: StudentPayment | null = null;
  editForm: any = {};
  confirmForm: any = {};
  
  // Reminder dialog properties
  reminderDialogVisible: boolean = false;
  selectedReminderStudents: StudentPayment[] | null = null;
  reminderMessage: string = '';
  processedReminderMessage: string = '';
  selectedTemplate: any = null;
  sendViaEmail: boolean = true;
  sendViaSMS: boolean = false;
  sendingReminder: boolean = false;
  messageTemplates: any[] = [];
  
  // Summary calculations
  totalTuition: number = 0;
  collected: number = 0;
  debt: number = 0;
  
  // Payment options
  paymentMethods: any[] = [];
  paymentStatusOptions: any[] = [];
  
  // Pagination
  first: number = 0;
  rows: number = 10;
  
  // Filter properties
  selectedStatusFilter: string = '';
  hasActiveFilters: boolean = false;
  
  // Filter options
  statusOptions: any[] = [];
  
  // Filtered data for display
  filteredTableData: (StudentPayment | FeeWithDetails)[] = [];
  
  // Courses data for tuition fee calculation
  courses: Course[] = [];
  
  // Header tuition fee property
  headerTuitionFeeValue: number = 0;
  
  // Table template
  currentPageReportTemplate: string = 'Hiển thị {first} đến {last} trong tổng số {totalRecords} học viên';
  
  // Dialog styles
  editDialogStyle = { width: '500px' };
  reminderDialogStyle = { width: '600px' };
  
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classService: ClassService,
    private classStudentService: ClassStudentService,
    private studentService: StudentService,
    private feeService: FeeService,
    private coursesService: CoursesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize summary values to prevent NaN display
    this.totalTuition = 0;
    this.collected = 0;
    this.debt = 0;
    
    this.initializePaymentOptions();
    this.initializeStatusOptions();
    this.initializeMessageTemplates();
    this.loadCourses();
    
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.classId = +params['id'];
        if (this.classId) {
          this.loadClassFeeDetails();
        }
      });
    this.setupSearchDebounce();
  }

  private initializePaymentOptions(): void {
    this.paymentMethods = this.feeService.getPaymentMethods();
    this.paymentStatusOptions = this.feeService.getPaymentStatusOptions();
  }

  private initializeStatusOptions(): void {
    this.statusOptions = [
      { label: 'Tất cả', value: '' },
      { label: 'Đã thanh toán', value: 'Đã thanh toán' },
      { label: 'Chưa đóng', value: 'Chưa đóng' },
      { label: 'Quá hạn', value: 'Quá hạn' },
      { label: 'Hoàn thành', value: 'Hoàn thành' },
      { label: 'Đã hủy', value: 'Đã hủy' }
    ];
  }

  private initializeMessageTemplates(): void {
    this.messageTemplates = [
      {
        name: 'Nhắc nhở đơn giản',
        content: `Xin chào {student_name},<br><br>
        Chúng tôi nhắc nhở bạn về khoản học phí của khóa học {class_name} với số tiền {amount} đến hạn ngày {due_date}.<br><br>
        Vui lòng thanh toán đúng hạn để không ảnh hưởng đến việc học tập.<br><br>
        Trân trọng,<br>
        HaNinh Academy`
      },
      {
        name: 'Nhắc nhở thân thiện',
        content: `Chào {student_name} thân mến,<br><br>
        Hy vọng bạn đang học tập tốt tại khóa {class_name}. Chúng tôi muốn nhắc nhở bạn về khoản học phí {amount} sẽ đến hạn vào {due_date}.<br><br>
        Nếu có bất kỳ thắc mắc nào, đừng ngần ngại liên hệ với chúng tôi.<br><br>
        Cảm ơn bạn,<br>
        HaNinh Academy`
      },
      {
        name: 'Nhắc nhở khẩn cấp',
        content: `{student_name} thân mến,<br><br>
        Khoản học phí {amount} của lớp {class_name} đã quá hạn từ ngày {due_date}.<br><br>
        Để đảm bảo việc học tập không bị gián đoạn, bạn vui lòng thanh toán sớm nhất có thể.<br><br>
        Trân trọng,<br>
        HaNinh Academy`
      }
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchQuery = searchTerm;
        this.hasActiveFilters = this.selectedStatusFilter !== '' || this.searchQuery.trim() !== '';
        this.applyFilters();
      });
  }

  private loadClassFeeDetails(): void {
    if (!this.classId) return;
    
    this.loading = true;
    
    // Load class data and students first to ensure we have the right class
    this.loadClassData();
    this.loadClassStudents();
    
    // Use getFeesByClass as the main method since getClassFeeDetails endpoint doesn't exist
    this.feeService.getFeesByClass(this.classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fees: FeeWithDetails[]) => {
          // Process fees data (transform and apply filtering)
          this.processFeesData(fees);
          
          this.loadClassStatistics();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading class fees:', error);
          
          // Fallback to getFeesWithDetails with class_id filter
          this.feeService.getFeesWithDetails({ class_id: this.classId || undefined })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (fees: FeeWithDetails[]) => {
                // Process fees data (transform and apply filtering)
                this.processFeesData(fees);
                
                this.loadClassStatistics();
                this.loading = false;
              },
              error: (fallbackError) => {
                console.error('Error loading class fees (fallback):', fallbackError);
                
                // Even if we can't load fees, ensure all class students are shown
                if (this.classStudents.length > 0) {
                  this.buildStudentsListFromClassStudents([]);
                  this.filteredStudents = [...this.students];
                  this.calculateSummary();
                  this.updateTableData();
                }
                
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: 'Không thể tải thông tin học phí của lớp'
                });
                this.loading = false;
              }
            });
        }
      });
  }

  private refreshDataFromDatabase(): void {
    if (!this.classId) return;
    
    // Show loading indicator briefly
    this.loading = true;
    
    // Refresh only fees data from database, keep other data
    this.feeService.getFeesByClass(this.classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fees: FeeWithDetails[]) => {
          // Process fees data (transform and apply filtering)
          this.processFeesData(fees);
          
          this.loadClassStatistics();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error refreshing fees data:', error);
          
          // Fallback to getFeesWithDetails
          this.feeService.getFeesWithDetails({ class_id: this.classId || undefined })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (fees: FeeWithDetails[]) => {
                this.processFeesData(fees);
                this.loadClassStatistics();
                this.loading = false;
              },
              error: (fallbackError) => {
                console.error('Error refreshing fees data (fallback):', fallbackError);
                this.loading = false;
                // Show error message
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Lưu ý',
                  detail: 'Đã lưu thành công nhưng không thể làm mới dữ liệu'
                });
              }
            });
        }
      });
  }

  private calculateSummary(): void {
    // Safely handle cases where students array is null/undefined/empty
    const studentsArray = this.students || [];
    
    // Calculate total tuition with proper validation using getStudentAmount
    this.totalTuition = studentsArray.reduce((sum, student) => {
      if (!student || typeof student !== 'object') return sum;
      
      const amount = this.getStudentAmount(student);
      
      if (typeof amount === 'number' && !isNaN(amount) && isFinite(amount)) {
        return sum + amount;
      }
      return sum;
    }, 0);
    
    // Calculate collected amount - sử dụng hàm getPaymentStatus để đảm bảo tính nhất quán
    this.collected = studentsArray
      .filter(student => {
        if (!student || typeof student !== 'object') return false;
        // Sử dụng hàm getPaymentStatus để đảm bảo logic nhất quán
        const status = this.getPaymentStatus(student);
        return status === 'Đã thanh toán';
      })
      .reduce((sum, student) => {
        if (!student || typeof student !== 'object') return sum;
        
        const amount = this.getStudentAmount(student);
        if (typeof amount === 'number' && !isNaN(amount) && isFinite(amount)) {
          return sum + amount;
        }
        return sum;
      }, 0);
    
    // Calculate debt - ensure no NaN result and logical consistency
    const totalTuitionNum = typeof this.totalTuition === 'number' && !isNaN(this.totalTuition) ? this.totalTuition : 0;
    let collectedNum = typeof this.collected === 'number' && !isNaN(this.collected) ? this.collected : 0;
    
    // Bảo vệ: collected không được lớn hơn totalTuition
    if (collectedNum > totalTuitionNum && totalTuitionNum > 0) {
      collectedNum = totalTuitionNum;
      this.collected = collectedNum;
    }
    
    this.debt = totalTuitionNum - collectedNum;
    
    // Ensure all values are numbers and not NaN
    this.totalTuition = isNaN(this.totalTuition) ? 0 : this.totalTuition;
    this.collected = isNaN(this.collected) ? 0 : this.collected;
    this.debt = isNaN(this.debt) ? 0 : this.debt;
    
    this.updateTableData();
  }

  private updateTableData(): void {
    // Ensure filteredStudents is properly set up
    if (!this.filteredStudents && this.students) {
      this.filteredStudents = [...this.students];
    }
    
    // Use new students data if available, otherwise fallback to legacy fees data
    let newTableData: (StudentPayment | FeeWithDetails)[] = [];
    if (this.filteredStudents && this.filteredStudents.length > 0) {
      newTableData = [...this.filteredStudents];
    } else if (this.filteredFees && this.filteredFees.length > 0) {
      newTableData = [...this.filteredFees];
    }
    
    // Force new reference để Angular detect changes
    this.tableData = [...newTableData]; // Create completely new array reference
    
    this.applyFilters();
    
    // Force change detection để đảm bảo UI được update
    this.cdr.detectChanges();
    
    // Additional refresh để đảm bảo template được update
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  private loadClassData(): void {
    if (!this.classId) return;
    
    this.classService.getClassById(this.classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classData) => {
          this.classData = classData;
          
          // After loading class data, rebuild students list if we have fees data
          if (this.classFees.length > 0) {
            this.buildStudentsListFromClassStudents(this.classFees);
            this.filteredStudents = [...this.students];
            this.calculateSummary();
            this.updateTableData();
          }
          
          // Update header tuition fee
          this.updateHeaderTuitionFee();
        },
        error: (error) => {
          console.error('Error loading class data:', error);
        }
      });
  }

  private loadCourses(): void {
    this.coursesService.getCourses().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (courses) => {
        this.courses = courses;
        
        // After loading courses, rebuild students list if we have class and fees data
        if (this.classFees.length > 0 && this.classData) {
          this.buildStudentsListFromClassStudents(this.classFees);
          this.filteredStudents = [...this.students];
          this.calculateSummary();
          this.updateTableData();
        }
        
        // Force update tất cả student amounts từ course data
        this.updateAllStudentAmounts();
        
        // Force update để đảm bảo UI được refresh
        this.calculateSummary();
        this.updateTableData();
        
        // Update header tuition fee
        this.updateHeaderTuitionFee();
        
        // Double-check: Force update header sau một chút delay
        setTimeout(() => {
          this.updateHeaderTuitionFee();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
      }
    });
  }

  // Get course tuition fee for display (similar to fees component)
  getCourseTuitionFee(classData: ClassModel | null): number | null {
    if (!classData?.course_id) {
      return null;
    }
    
    const courseData = this.courses.find(course => course.id === classData.course_id);
    
    return courseData?.tuition_fee || null;
  }

  // Method để update header tuition fee property
  updateHeaderTuitionFee(): void {
    const tuitionFee = this.getCourseTuitionFee(this.classData);
    this.headerTuitionFeeValue = tuitionFee || 0;
    this.cdr.detectChanges();
  }

  // Method để lấy tuition fee cho header - đảm bảo trả về number
  getCourseTuitionFeeForHeader(): number {
    return this.headerTuitionFeeValue;
  }

  // Method đơn giản để lấy tuition fee cho header - sử dụng logic từ bảng
  getHeaderTuitionFee(): number {
    return this.getCourseTuitionFeeForHeader();
  }

  // Getter đơn giản để lấy tuition fee từ student đầu tiên (như bảng)
  get headerTuitionFee(): number {
    if (this.students && this.students.length > 0) {
      return this.getStudentAmount(this.students[0]);
    }
    return 0;
  }

  /**
   * Update tất cả student amounts từ course tuition fee
   */
  private updateAllStudentAmounts(): void {
    if (!this.students || this.students.length === 0) {
      return;
    }

    const tuitionFee = this.getCourseTuitionFee(this.classData);

    if (tuitionFee && tuitionFee > 0) {
      this.students.forEach((student, index) => {
        if (!this.hasValidAmount(student.amount)) {
          student.amount = tuitionFee;
        }
      });

      // Update filtered students as well
      if (this.filteredStudents && this.filteredStudents.length > 0) {
        this.filteredStudents.forEach((student, index) => {
          if (!this.hasValidAmount(student.amount)) {
            student.amount = tuitionFee;
          }
        });
      }
      
      // Force tạo reference mới cho arrays để Angular detect changes
      this.students = [...this.students];
      if (this.filteredStudents) {
        this.filteredStudents = [...this.filteredStudents];
      }
      
      // Update header tuition fee
      this.updateHeaderTuitionFee();
      
      // Rebuild table data để đảm bảo template được refresh
      setTimeout(() => {
        this.updateTableData();
        this.updateHeaderTuitionFee();
      }, 0);
    }
  }

  // Calculate due date: 3 days before class start date
  private calculateDueDate(classData: ClassModel | null): string {
    if (!classData?.start_date) return '';
    
    try {
      const startDate = new Date(classData.start_date);
      // Subtract 3 days (3 * 24 * 60 * 60 * 1000 milliseconds)
      const dueDate = new Date(startDate.getTime() - (3 * 24 * 60 * 60 * 1000));
      
      // Format as YYYY-MM-DD
      return dueDate.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  private loadClassStudents(): void {
    if (!this.classId) return;
    
    this.classStudentService.getStudentsByClass(this.classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (students) => {
          this.classStudents = students;
          
          // Check if we need to load student details from StudentService
          // Similar to how class-detail component does it
          if (this.classStudents.some(cs => !cs.student || !cs.student.full_name || cs.student.full_name === '')) {
            this.loadStudentDetails();
          } else {
            // Even if classStudents have data, re-process fees to ensure all students are included
            if (this.classFees.length > 0) {
              this.processFeesData(this.classFees);
            } else {
              // No fees loaded yet, but we have classStudents - build list from classStudents
              this.buildStudentsListFromClassStudents([]);
              this.filteredStudents = [...this.students];
              this.calculateSummary();
              this.updateTableData();
            }
          }
          
          // Trigger filtering if we already have students data
          if (this.students.length > 0) {
            this.filterStudentsByClass();
            this.calculateSummary();
            this.updateTableData();
          }
        },
        error: (error) => {
          console.error('Error loading class students:', error);
        }
      });
  }

  private filterStudentsByClass(): void {
    if (!this.classId) return;
    
    // Always wait for classStudents data to ensure proper filtering
    if (!this.classStudents.length) {
      return;
    }
    
    // Get list of student IDs that belong to this class (including all statuses: Đang học, Nghỉ học, Hoàn thành)
    const classStudentIds = this.classStudents.map(cs => cs.student_id);
    
    // Store original students count
    const originalCount = this.students.length;
    
    // ALWAYS filter students to only include those who are enrolled in this class
    // This ensures we don't show students from fees who are not actually in the class
    this.students = this.students.filter(student => {
      // Use student_id for exact matching (most reliable)
      if (student.student_id && classStudentIds.includes(student.student_id)) {
        return true;
      }
      
      // Fallback: check by name if we have class students data
      if (student.name) {
        const studentInClass = this.classStudents.find(cs => 
          cs.student?.full_name === student.name || 
          cs.student_name === student.name
        );
        if (studentInClass) {
          return true;
        }
      }
      
      // If no match found, exclude this student
      return false;
    });
    
    this.filteredStudents = [...this.students];
  }

  private transformFeesToStudentPayments(fees: FeeWithDetails[]): StudentPayment[] {
    return fees.map(fee => {
      // Try to get student name from multiple sources in priority order
      let studentName = fee.student_name;
      
      // Priority 1: Use cached student data from StudentService (most reliable)
      if ((!studentName || studentName.trim() === '') && fee.student_id && this.studentsData.has(fee.student_id)) {
        const studentData = this.studentsData.get(fee.student_id);
        if (studentData && studentData.full_name && studentData.full_name.trim() !== '') {
          studentName = studentData.full_name;
        }
      }
      
      // Priority 2: Use data from classStudents (from ClassStudentService)
      if ((!studentName || studentName.trim() === '') && fee.student_id && this.classStudents.length > 0) {
        const classStudent = this.classStudents.find(cs => cs.student_id === fee.student_id);
        if (classStudent) {
          const foundName = classStudent.student?.full_name || classStudent.student_name;
          if (foundName && foundName.trim() !== '') {
            studentName = foundName;
          }
        }
      }
      
      // Priority 3: Use original fee.student_name if available
      if ((!studentName || studentName.trim() === '') && fee.student_name && fee.student_name.trim() !== '') {
        studentName = fee.student_name;
      }
      
      // Fallback to 'Học viên' + ID if still no name
      if (!studentName || studentName.trim() === '') {
        studentName = fee.student_id ? `Học viên ${fee.student_id}` : 'Học viên không xác định';
      }
      
      return {
        id: fee.id || 0, // Fee ID for backward compatibility
        fee_id: fee.id || 0, // Explicit fee ID
        student_id: fee.student_id || 0, // Student ID for filtering
        name: studentName,
        amount: fee.amount || 0,
        due_date: fee.due_date || this.calculateDueDate(this.classData),
        paid_date: fee.paid_date || null,
        payment_method: fee.payment_method || null,
        payment_status: fee.payment_status || 'Chưa thanh toán',
        notes: fee.notes
      };
    });
  }

  private processFeesData(fees: FeeWithDetails[]): void {
    // Store fees data first
    this.classFees = fees;
    this.filteredFees = [...fees];
    
    // If we have classStudents data, we should build the students list based on classStudents
    // rather than just fees data to ensure we show ALL students in the class
    if (this.classStudents.length > 0) {
      this.buildStudentsListFromClassStudents(fees);
    } else {
      // Fallback: transform fees to student payments if no classStudents data
      this.students = this.transformFeesToStudentPayments(fees);
      this.ensureAllClassStudentsAreIncluded();
    }
    
    this.filteredStudents = [...this.students];
    
    // Apply filtering to ensure only students from this class are shown (this should be redundant now)
    this.filterStudentsByClass();
    
    // Update all student amounts từ course data
    this.updateAllStudentAmounts();
    
    this.calculateSummary();
    this.updateTableData();
  }

  private buildStudentsListFromClassStudents(fees: FeeWithDetails[]): void {
    // Start with empty students array
    this.students = [];
    
    // For each student in the class, create or find their fee entry
    this.classStudents.forEach(classStudent => {
      // Look for existing fee data for this student
      const existingFee = fees.find(fee => fee.student_id === classStudent.student_id);
      
      let studentPayment: StudentPayment;
      
      if (existingFee) {
        // Transform existing fee data
        const transformedFees = this.transformFeesToStudentPayments([existingFee]);
        studentPayment = transformedFees[0];
      } else {
        // Create default fee entry for student with no fee record
        studentPayment = {
          id: 0, // No fee ID yet
          fee_id: 0,
          student_id: classStudent.student_id,
          name: classStudent.student?.full_name || classStudent.student_name || `Học viên ${classStudent.student_id}`,
          amount: 0, // Default amount
          due_date: '', // Will be set based on class info if available
          paid_date: null,
          payment_method: null,
          payment_status: 'Chưa thanh toán',
          notes: ''
        };

        // Try to get student name from cached data if not available
        if (this.studentsData.has(classStudent.student_id)) {
          const studentData = this.studentsData.get(classStudent.student_id);
          if (studentData?.full_name) {
            studentPayment.name = studentData.full_name;
          }
        }
      }
      
      // Gán số tiền từ course tuition fee cho học viên (nếu chưa có)
      if (!this.hasValidAmount(studentPayment.amount)) {
        const tuitionFee = this.getCourseTuitionFee(this.classData);
        if (tuitionFee && tuitionFee > 0) {
          studentPayment.amount = tuitionFee;
        }
      }
      
      // Set due date: 3 days before class start date (if not already set)
      if (!studentPayment.due_date || studentPayment.due_date === '') {
        studentPayment.due_date = this.calculateDueDate(this.classData);
      }
      
      this.students.push(studentPayment);
    });
  }

  private ensureAllClassStudentsAreIncluded(): void {
    if (!this.classStudents.length) {
      return;
    }

    this.classStudents.forEach(classStudent => {
      // Check if this student already has a fee entry
      const existingStudentPayment = this.students.find(student => 
        student.student_id === classStudent.student_id
      );

      if (!existingStudentPayment) {
        // Create a default fee entry for this student
        const studentPayment: StudentPayment = {
          id: 0, // No fee ID yet
          fee_id: 0,
          student_id: classStudent.student_id,
          name: classStudent.student?.full_name || classStudent.student_name || `Học viên ${classStudent.student_id}`,
          amount: 0, // Default amount - will be updated if class has tuition info
          due_date: '', // Will be set based on class info if available
          paid_date: null,
          payment_method: null,
          payment_status: 'Chưa thanh toán',
          notes: ''
        };

        // Try to get student name from cached data if not available
        if (this.studentsData.has(classStudent.student_id)) {
          const studentData = this.studentsData.get(classStudent.student_id);
          if (studentData?.full_name) {
            studentPayment.name = studentData.full_name;
          }
        }

        // Gán số tiền mặc định từ course tuition fee
        const tuitionFee = this.getCourseTuitionFee(this.classData);
        if (tuitionFee && tuitionFee > 0) {
          studentPayment.amount = tuitionFee;
        }

        // Set due date: 3 days before class start date
        studentPayment.due_date = this.calculateDueDate(this.classData);

        this.students.push(studentPayment);
      }
    });
    
    // Update all student amounts after building the list
    this.updateAllStudentAmounts();
  }

  // Load student details from StudentService - similar to class-detail component
  private loadStudentDetails(): void {
    const studentIds = this.classStudents.map(cs => cs.student_id);
    
    // Load student details from student service
    this.studentService.getStudents({})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (studentsResponse) => {
          let students: StudentsModel[] = [];
          
          if (Array.isArray(studentsResponse)) {
            students = studentsResponse;
          } else if (studentsResponse?.data) {
            students = Array.isArray(studentsResponse.data) ? studentsResponse.data : [studentsResponse.data];
          }
          
          // Cache student data
          students.forEach(student => {
            if (student.id) {
              this.studentsData.set(student.id, student);
            }
          });
          
          // Update class students with real student data
          this.classStudents = this.classStudents.map(cs => {
            const studentDetail = students.find(s => s.id === cs.student_id);
            if (studentDetail) {
              // Map student status to compatible type
              let mappedStatus: 'Đang học' | 'Tạm dừng' | 'Tốt nghiệp' | 'Nghỉ học';
              switch (studentDetail.status) {
                case 'Hoàn thành':
                  mappedStatus = 'Tốt nghiệp';
                  break;
                case 'Tạm dừng':
                  mappedStatus = 'Tạm dừng';
                  break;
                case 'Nghỉ học':
                  mappedStatus = 'Nghỉ học';
                  break;
                default:
                  mappedStatus = 'Đang học';
              }
              
              cs.student = {
                id: studentDetail.id!,
                student_code: studentDetail.student_code || '',
                full_name: studentDetail.full_name || '',
                email: studentDetail.email || '',
                phone: studentDetail.phone || '',
                gender: studentDetail.gender || 'Nam',
                status: mappedStatus
              };
            }
            return cs;
          });
          
          // Re-transform fees data now that we have proper student data from StudentService
          if (this.classFees.length > 0) {
            this.buildStudentsListFromClassStudents(this.classFees);
          } else {
            // Even if no fees data, ensure all class students are included
            this.buildStudentsListFromClassStudents([]);
          }
          
          this.filteredStudents = [...this.students];
          this.calculateSummary();
          this.updateTableData();
        },
        error: (error) => {
          console.error('Error loading student details:', error);
          
          // Continue with existing data even if StudentService fails
          if (this.classFees.length > 0) {
            this.processFeesData(this.classFees);
          }
        }
      });
  }

  private loadClassFees(): void {
    if (!this.classId) return;

    const filters = { class_id: this.classId || undefined };
    this.feeService.getFeesWithDetails(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fees) => {
          this.classFees = fees;
          this.filteredFees = [...fees];
          this.updateTableData();
          this.loadClassStatistics();
          
          // Force UI refresh để đảm bảo template hiển thị đúng
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        },
        error: (error) => {
          console.error('Error loading class fees:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách học phí'
          });
        }
      });
  }

  private loadClassStatistics(): void {
    if (!this.classId) return;

    this.feeService.getClassFeeStatistics(this.classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          // Fallback: calculate basic statistics from classFees
          this.calculateBasicStatistics();
        }
      });
  }

  private calculateBasicStatistics(): void {
    if (!this.classFees.length) return;

    const total = this.classFees.reduce((sum, fee) => sum + fee.amount, 0);
    
    // Sử dụng logic mới để phân loại trạng thái - đảm bảo tính nhất quán với getPaymentStatus
    const paid = this.classFees
      .filter(fee => {
        const status = this.getPaymentStatus(fee);
        return status === 'Đã thanh toán';
      })
      .reduce((sum, fee) => sum + fee.amount, 0);
      
    const unpaid = this.classFees
      .filter(fee => {
        const status = this.getPaymentStatus(fee);
        return status === 'Chưa đóng' || status === 'Chưa thanh toán' || status === 'Quá hạn';
      })
      .reduce((sum, fee) => sum + fee.amount, 0);

    this.statistics = {
      total_amount: total,
      paid_amount: paid,
      unpaid_amount: unpaid,
      total_students: this.classFees.map(f => f.student_id).filter((v, i, a) => a.indexOf(v) === i).length,
      paid_students: this.classFees.filter(f => {
        const status = this.getPaymentStatus(f);
        return status === 'Đã thanh toán';
      }).map(f => f.student_id).filter((v, i, a) => a.indexOf(v) === i).length,
      unpaid_students: this.classFees.filter(f => {
        const status = this.getPaymentStatus(f);
        return status === 'Chưa đóng' || status === 'Chưa thanh toán' || status === 'Quá hạn';
      })
        .map(f => f.student_id).filter((v, i, a) => a.indexOf(v) === i).length
    };
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject$.next(target.value);
  }

  onGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject$.next(target.value);
  }

  onFilterChange(): void {
    this.hasActiveFilters = this.selectedStatusFilter !== '' || this.searchQuery.trim() !== '';
    this.applyFilters();
  }

  onClearFilters(): void {
    this.selectedStatusFilter = '';
    this.hasActiveFilters = false;
    this.searchQuery = '';
    this.applyFilters();
  }

  clearStatusFilter(): void {
    this.selectedStatusFilter = '';
    this.onFilterChange();
  }

  private applyFilters(): void {
    this.filterTableData();
  }

  private filterTableData(): void {
    let filtered = [...this.tableData];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const name = this.getStudentName(item).toLowerCase();
        return name.includes(query);
      });
    }

    // Apply status filter
    if (this.selectedStatusFilter) {
      filtered = filtered.filter(item => {
        const status = this.getPaymentStatus(item);
        return status === this.selectedStatusFilter;
      });
    }

    this.filteredTableData = filtered;
  }

  getPaymentStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'Đã thanh toán': return 'success';
      case 'Chưa đóng': return 'warn';
      case 'Chưa thanh toán': return 'warn'; // Keep for backward compatibility
      case 'Quá hạn': return 'danger';
      case 'Hoàn thành': return 'success';
      case 'Đã hủy': return 'secondary';
      default: return 'secondary';
    }
  }

  formatCurrency(amount: number): string {
    // Handle NaN, null, undefined, or non-numeric values
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      amount = 0;
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  // Type guard to check if item is StudentPayment
  private isStudentPayment(item: StudentPayment | FeeWithDetails): item is StudentPayment {
    return 'name' in item;
  }

  onConfirmPayment(item: StudentPayment | FeeWithDetails): void {
    // Convert both types to a common format for confirmation
    if (this.isStudentPayment(item)) {
      this.selectedStudent = { ...item };
    } else {
      // Convert FeeWithDetails to StudentPayment format for confirmation
      this.selectedStudent = {
        id: item.id!,
        name: item.student_name || 'N/A',
        amount: item.amount,
        due_date: item.due_date,
        paid_date: item.paid_date || null,
        payment_method: item.payment_method || null,
        payment_status: item.payment_status || 'Chưa thanh toán',
        notes: item.notes || ''
      };
    }
    
    // Initialize confirm form - payment_method is required, paid_date defaults to today
    this.confirmForm = {
      payment_method: '', // Required field
      paid_date: new Date(), // Default to today
      notes: ''
    };
    
    this.confirmPaymentDialogVisible = true;
  }

  onViewPaymentDetails(item: StudentPayment | FeeWithDetails): void {
    // Convert both types to a common format for view
    if (this.isStudentPayment(item)) {
      this.selectedStudent = { ...item };
    } else {
      // Convert FeeWithDetails to StudentPayment format for view
      this.selectedStudent = {
        id: item.id!,
        name: item.student_name || 'N/A',
        amount: item.amount,
        due_date: item.due_date,
        paid_date: item.paid_date || null,
        payment_method: item.payment_method || null,
        payment_status: item.payment_status || 'Chưa thanh toán',
        notes: item.notes || ''
      };
    }
    
    this.viewPaymentDialogVisible = true;
  }

  onViewReceipt(item: StudentPayment | FeeWithDetails): void {
    if (!this.isStudentPayment(item)) {
      return;
    }
    
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: 'Chức năng xem hóa đơn đang được phát triển'
    });
  }

  onDeletePayment(item: StudentPayment | FeeWithDetails): void {
    if (!this.isStudentPayment(item)) {
      return;
    }
    
    const student = item;
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa thông tin thanh toán của ${student.name}?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      accept: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Thông báo',
          detail: 'Chức năng xóa đang được phát triển'
        });
      }
    });
  }

  onSaveEdit(): void {
    if (!this.selectedStudent) return;

    const updateData = {
      paid_date: this.editForm.paid_date ? this.editForm.paid_date.toISOString().split('T')[0] : null,
      payment_method: this.editForm.payment_method,
      payment_status: this.editForm.payment_status,
      notes: this.editForm.notes || ''
    };

    // Use PUT instead of PATCH as requested
    this.feeService.updateFee(this.selectedStudent.id, updateData as Fee)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local data for both new and legacy structures
          const studentIndex = this.students.findIndex(s => s.id === this.selectedStudent!.id);
          if (studentIndex !== -1) {
            this.students[studentIndex] = {
              ...this.students[studentIndex],
              ...updateData
            };
            this.filteredStudents = [...this.students];
          }

          // Also update legacy data if needed
          const feeIndex = this.classFees.findIndex(f => f.id === this.selectedStudent!.id);
          if (feeIndex !== -1) {
            this.classFees[feeIndex] = {
              ...this.classFees[feeIndex],
              ...updateData
            };
            this.filteredFees = [...this.classFees];
          }

          this.calculateSummary();
          this.updateTableData();

          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật thông tin thanh toán thành công'
          });
          this.editDialogVisible = false;
          this.selectedStudent = null;
          this.editForm = {};
        },
        error: (error) => {
          console.error('Error updating payment:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật thông tin thanh toán'
          });
        }
      });
  }

  onCancelEdit(): void {
    this.editDialogVisible = false;
    this.selectedStudent = null;
    this.editForm = {};
  }

  onSaveConfirmPayment(): void {
    if (!this.selectedStudent || !this.isConfirmPaymentFormValid()) return;

    const updateData = {
      paid_date: this.confirmForm.paid_date ? this.confirmForm.paid_date.toISOString().split('T')[0] : null,
      payment_method: this.confirmForm.payment_method,
      payment_status: 'Đã thanh toán' as const, // Always set to paid when confirming
      notes: this.confirmForm.notes || ''
    };

    // Check if we need to create a new fee record first (id = 0 or null)
    if (!this.selectedStudent.id || this.selectedStudent.id === 0) {
      this.createNewFeeRecordAndConfirm(updateData);
    } else {
      // Update existing fee record
      this.updateExistingFeeRecord(updateData);
    }
  }

  private createNewFeeRecordAndConfirm(updateData: any): void {
    if (!this.selectedStudent || !this.selectedStudent.student_id || 
        !this.classData || !this.classData.id || !this.classData.course_id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Thiếu thông tin để tạo bản ghi học phí'
      });
      return;
    }

    // Create new fee record first
    const newFeeData: Fee = {
      student_id: this.selectedStudent.student_id!,
      class_id: this.classData.id!,
      course_id: this.classData.course_id!,
      amount: typeof this.selectedStudent.amount === 'string' ? parseFloat(this.selectedStudent.amount) : this.selectedStudent.amount,
      payment_type: 'Học phí',
      payment_method: updateData.payment_method,
      payment_status: updateData.payment_status,
      due_date: this.selectedStudent.due_date || this.calculateDueDate(this.classData),
      paid_date: updateData.paid_date,
      receipt_number: updateData.receipt_number,
      transaction_id: updateData.transaction_id,
      notes: updateData.notes
    };

    this.feeService.addFee(newFeeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdFee) => {
          // Save student name before clearing selectedStudent
          const studentName = this.selectedStudent?.name || 'học viên';
          
          // Close dialog first
          this.confirmPaymentDialogVisible = false;
          this.selectedStudent = null;
          this.confirmForm = {};
          
          // Show success message
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã tạo và xác nhận thanh toán cho ${studentName}`
          });
          
          // Refresh data from database to show updated information
          this.refreshDataFromDatabase();
        },
        error: (error) => {
          console.error('Error creating fee record:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tạo bản ghi học phí mới'
          });
        }
      });
  }

  private updateExistingFeeRecord(updateData: any): void {
    // Use PUT API to confirm payment for existing fee
    this.feeService.updateFee(this.selectedStudent!.id, updateData as Fee)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Save student name before clearing selectedStudent
          const studentName = this.selectedStudent?.name || 'học viên';
          
          // Close dialog first
          this.confirmPaymentDialogVisible = false;
          this.selectedStudent = null;
          this.confirmForm = {};
          
          // Show success message
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xác nhận thanh toán cho ${studentName}`
          });
          
          // Refresh data from database to show updated information
          this.refreshDataFromDatabase();
        },
        error: (error) => {
          console.error('Error confirming payment:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xác nhận thanh toán'
          });
        }
      });
  }


  onCancelConfirmPayment(): void {
    this.confirmPaymentDialogVisible = false;
    this.selectedStudent = null;
    this.confirmForm = {};
  }

  onCancelViewPayment(): void {
    this.viewPaymentDialogVisible = false;
    this.selectedStudent = null;
  }

  isConfirmPaymentFormValid(): boolean {
    return !!(this.confirmForm.payment_method && this.confirmForm.paid_date);
  }

  // Helper method to determine if we should show new student payment structure
  get isUsingNewData(): boolean {
    return this.students.length > 0;
  }

  /**
   * Kiểm tra xem số tiền có hợp lệ hay không
   * Handle cả number và string numbers
   */
  private hasValidAmount(amount: number | string): boolean {
    if (amount === null || amount === undefined || amount === '') {
      return false;
    }
    
    // Convert to number nếu là string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return typeof numAmount === 'number' && numAmount > 0 && !isNaN(numAmount) && isFinite(numAmount);
  }

  // Helper method to safely get student name from union type
  getStudentName(item: StudentPayment | FeeWithDetails): string {
    return 'name' in item ? item.name : (item.student_name || 'N/A');
  }

  // Helper method to convert amount to number for formatting
  getAmountAsNumber(amount: number | string): number {
    if (amount === null || amount === undefined || amount === '') {
      return 0;
    }
    return typeof amount === 'string' ? parseFloat(amount) : amount;
  }

  /**
   * Lấy số tiền học viên - sử dụng cách đơn giản như fees component
   * Ưu tiên: student amount -> course tuition fee -> 0
   */
  getStudentAmount(item: StudentPayment | FeeWithDetails): number {
    // Nếu có số tiền hợp lệ từ database, sử dụng nó
    if (this.hasValidAmount(item.amount)) {
      // Convert to number nếu là string để đảm bảo type consistency
      const numAmount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
      return numAmount;
    }
    
    // Nếu không có, lấy từ course tuition fee (như fees component)
    const tuitionFee = this.getCourseTuitionFee(this.classData);
    
    if (tuitionFee && tuitionFee > 0) {
      
      // QUAN TRỌNG: Cập nhật trực tiếp vào object để Angular change detection hoạt động
      if ('amount' in item) {
        item.amount = tuitionFee;
      }
      
      // Force change detection ngay sau khi update object property
      this.cdr.detectChanges();
      
      return tuitionFee;
    }
    
    // Mặc định: 0
    return 0;
  }

  // Helper method to safely get payment status from union type
  getPaymentStatus(item: StudentPayment | FeeWithDetails): string {
    // Nếu đã thanh toán, hiển thị "Đã thanh toán"
    if (item.payment_status === 'Đã thanh toán' || item.paid_date) {
      return 'Đã thanh toán';
    }
    
    // Kiểm tra quá hạn trước khi hiển thị trạng thái khác
    const daysOverdue = this.getDaysOverdue(item);
    
    // Nếu có người chưa nộp mà quá hạn thì ghi "Quá hạn"
    if (daysOverdue > 0) {
      return 'Quá hạn';
    }
    
    // Nếu chưa đến hạn đóng mà chưa đóng thì ghi "Chưa đóng"
    // Thay vì "Chưa thanh toán"
    return 'Chưa đóng';
  }

  // Helper method to safely get payment method from union type
  getPaymentMethod(item: StudentPayment | FeeWithDetails): string | null {
    return 'payment_method' in item ? item.payment_method : null;
  }

  // Helper method to safely get paid date from union type
  getPaidDate(item: StudentPayment | FeeWithDetails): string | null {
    return item.paid_date || null;
  }

  // Helper method to safely get due date from union type
  getDueDate(item: StudentPayment | FeeWithDetails): string {
    let dueDate = '';
    
    if ('due_date' in item) {
      if (this.isStudentPayment(item)) {
        dueDate = item.due_date;
      } else {
        dueDate = (item as FeeWithDetails).due_date;
      }
    }
    
    // If due_date is empty, calculate from class start date
    if (!dueDate || dueDate === '') {
      dueDate = this.calculateDueDate(this.classData);
    }
    
    return dueDate;
  }

  get classCode(): string {
    if (this.classData?.class_code) {
      return this.classData.class_code;
    }
    if (this.classInfo?.id) {
      return `L${this.classInfo.id}`;
    }
    return 'N/A';
  }

  // Helper methods for template
  getCourseName(classData: ClassModel | null): string {
    if (!classData?.course_id) return '';
    const courseData = this.courses.find(course => course.id === classData.course_id);
    return courseData?.course_name || '';
  }

  getTotalStudents(): number {
    return this.students?.length || 0;
  }

  getCollectionPercentage(): number {
    // Handle NaN and edge cases
    const totalAmount = this.getTotalTuitionAmount();
    const collectedAmount = this.getCollectedAmount();
    
    if (!totalAmount || totalAmount === 0 || isNaN(totalAmount)) return 0;
    if (isNaN(collectedAmount) || collectedAmount < 0) return 0;
    
    const percentage = (collectedAmount / totalAmount) * 100;
    return isNaN(percentage) ? 0 : Math.round(percentage);
  }

  // Helper để lấy tổng học phí an toàn
  getTotalTuitionAmount(): number {
    return this.totalTuition || this.statistics?.total_amount || 0;
  }

  // Helper để lấy số tiền đã thu an toàn
  getCollectedAmount(): number {
    // Ưu tiên sử dụng collected đã được tính toán lại, fallback về statistics
    return this.collected !== undefined ? this.collected : (this.statistics?.paid_amount || 0);
  }

  // Helper để lấy số tiền chưa thu an toàn
  getUnpaidAmount(): number {
    // Ưu tiên sử dụng debt đã được tính toán lại, fallback về statistics
    return this.debt !== undefined ? this.debt : (this.statistics?.unpaid_amount || 0);
  }


  getOverdueAmount(): number {
    // Ưu tiên sử dụng classFees data nếu có, fallback về students
    let dataSource = this.classFees && this.classFees.length > 0 ? this.classFees : this.students;
    
    if (!dataSource || !Array.isArray(dataSource)) return 0;
    
    // Tính từ classFees nếu có (chính xác hơn)
    let overdueAmount = 0;
    
    if (this.classFees && this.classFees.length > 0) {
      // Sử dụng classFees data
      overdueAmount = this.classFees.filter(fee => {
        if (!fee || typeof fee !== 'object') return false;
        
        // Đã thanh toán thì không quá hạn
        if (fee.paid_date || fee.payment_status === 'Đã thanh toán') {
          return false;
        }

        // Kiểm tra trạng thái "Quá hạn" từ database
        if (fee.payment_status === 'Quá hạn') {
          return true;
        }

        // Kiểm tra quá hạn dựa trên due_date - LOGIC CHÍNH
        if (fee.due_date) {
          const daysOverdue = this.getDaysOverdue(fee);
          return daysOverdue > 0;
        }

        return false;
      }).reduce((sum, fee) => {
        if (!fee || typeof fee !== 'object') return sum;
        const amount = fee.amount || 0;
        if (typeof amount === 'number' && !isNaN(amount) && isFinite(amount)) {
          return sum + amount;
        }
        return sum;
      }, 0);
    } else {
      // Fallback: Sử dụng students data
      overdueAmount = this.students.filter(student => {
        if (!student || typeof student !== 'object') return false;
        
        // Đã thanh toán thì không quá hạn
        if (student.paid_date || student.payment_status === 'Đã thanh toán') {
          return false;
        }

        // Kiểm tra trạng thái "Quá hạn" từ database
        if (student.payment_status === 'Quá hạn') {
          return true;
        }

        // Kiểm tra quá hạn dựa trên due_date - LOGIC CHÍNH
        if (student.due_date) {
          const daysOverdue = this.getDaysOverdue(student);
          return daysOverdue > 0;
        }

        return false;
      }).reduce((sum, student) => {
        if (!student || typeof student !== 'object') return sum;
        const amount = this.getStudentAmount(student);
        if (typeof amount === 'number' && !isNaN(amount) && isFinite(amount)) {
          return sum + amount;
        }
        return sum;
      }, 0);
    }
    
    return isNaN(overdueAmount) ? 0 : overdueAmount;
  }

  getOverdueCount(): number {
    return this.students?.filter(student => {
      if (!student || typeof student !== 'object') return false;
      
      // Đã thanh toán thì không quá hạn
      if (student.paid_date || student.payment_status === 'Đã thanh toán') {
        return false;
      }

      // Kiểm tra trạng thái "Quá hạn" từ database
      if (student.payment_status === 'Quá hạn') {
        return true;
      }

      // Kiểm tra quá hạn dựa trên due_date - LOGIC CHÍNH
      if (student.due_date) {
        const daysOverdue = this.getDaysOverdue(student);
        return daysOverdue > 0;
      }

      return false;
    }).length || 0;
  }

  // Hàm để đếm số học viên "Chưa đóng" (chưa đến hạn)
  getUnpaidCount(): number {
    return this.students?.filter(student => {
      const status = this.getPaymentStatus(student);
      return status === 'Chưa đóng' || status === 'Chưa thanh toán';
    }).length || 0;
  }

  // Hàm để đếm số học viên "Quá hạn"
  getOverdueCountOnly(): number {
    return this.students?.filter(student => {
      const status = this.getPaymentStatus(student);
      return status === 'Quá hạn';
    }).length || 0;
  }

  // Hàm để đếm tổng số học viên chưa thanh toán (cả "Chưa đóng" và "Quá hạn")
  getTotalUnpaidCount(): number {
    return this.students?.filter(student => {
      const status = this.getPaymentStatus(student);
      return status === 'Chưa đóng' || status === 'Chưa thanh toán' || status === 'Quá hạn';
    }).length || 0;
  }

  getDaysOverdue(item: StudentPayment | FeeWithDetails): number {
    if ('paid_date' in item && item.paid_date) return 0; // Already paid
    
    const dueDateStr = this.getDueDate(item);
    if (!dueDateStr) return 0;
    
    // Parse date safely - handle DD/MM/YYYY format
    let dueDate: Date;
    try {
      // Try to parse DD/MM/YYYY format first
      if (dueDateStr.includes('/')) {
        const parts = dueDateStr.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY format
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
          const year = parseInt(parts[2], 10);
          
          // Validate the parsed values
          if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 0 || month > 11) {
            console.error('Invalid date parts:', { day, month: month + 1, year, originalString: dueDateStr });
            return 0;
          }
          
          dueDate = new Date(year, month, day);
        } else {
          dueDate = new Date(dueDateStr);
        }
      } else {
        dueDate = new Date(dueDateStr);
      }
    } catch (error) {
      console.error('Error parsing due date:', dueDateStr, error);
      return 0;
    }
    
    // Check if date is valid
    if (isNaN(dueDate.getTime())) {
      console.error('Invalid due date:', dueDateStr);
      return 0;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Logic đã đúng: diffDays < 0 = chưa đến hạn, diffDays > 0 = quá hạn
    
    // CHỈ trả về số dương khi hôm nay > ngày hạn nộp (thực sự quá hạn)
    // Nếu diffDays < 0 có nghĩa là chưa đến hạn
    // Nếu diffDays = 0 có nghĩa là hôm nay là ngày hạn nộp
    // Nếu diffDays > 0 có nghĩa là đã quá hạn
    return diffDays > 0 ? diffDays : 0;
  }

  getDaysUntilDue(item: StudentPayment | FeeWithDetails): number {
    if ('paid_date' in item && item.paid_date) return 0; // Already paid
    
    const dueDateStr = this.getDueDate(item);
    if (!dueDateStr) return 0;
    
    // Parse date safely - handle DD/MM/YYYY format (same as getDaysOverdue)
    let dueDate: Date;
    try {
      if (dueDateStr.includes('/')) {
        const parts = dueDateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
          const year = parseInt(parts[2], 10);
          
          if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 0 || month > 11) {
            return 0;
          }
          
          dueDate = new Date(year, month, day);
        } else {
          dueDate = new Date(dueDateStr);
        }
      } else {
        dueDate = new Date(dueDateStr);
      }
    } catch (error) {
      return 0;
    }
    
    if (isNaN(dueDate.getTime())) {
      return 0;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Trả về số dương khi chưa đến hạn, 0 khi hôm nay là ngày hạn nộp
    return diffDays >= 0 ? diffDays : 0;
  }

  // Kiểm tra xem hôm nay có phải là ngày hạn nộp không
  isDueToday(item: StudentPayment | FeeWithDetails): boolean {
    if ('paid_date' in item && item.paid_date) return false; // Already paid
    
    const dueDateStr = this.getDueDate(item);
    if (!dueDateStr) return false;
    
    // Parse date safely - handle DD/MM/YYYY format (same as getDaysOverdue)
    let dueDate: Date;
    try {
      if (dueDateStr.includes('/')) {
        const parts = dueDateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
          const year = parseInt(parts[2], 10);
          
          if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 0 || month > 11) {
            return false;
          }
          
          dueDate = new Date(year, month, day);
        } else {
          dueDate = new Date(dueDateStr);
        }
      } else {
        dueDate = new Date(dueDateStr);
      }
    } catch (error) {
      return false;
    }
    
    if (isNaN(dueDate.getTime())) {
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate.getTime() === today.getTime();
  }

  onExportStudents(): void {
    if (!this.students || this.students.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không có dữ liệu để xuất'
      });
      return;
    }

    // Create CSV content
    const headers = ['STT', 'Tên học viên', 'Số tiền', 'Hạn nộp', 'Ngày thanh toán', 'Trạng thái'];
    const csvContent = [
      headers.join(','),
      ...this.students.map((student, index) => [
        index + 1,
        `"${student.name}"`,
        student.amount,
        student.due_date,
        student.paid_date || '',
        `"${student.payment_status}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_hoc_phi_${this.classCode}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã xuất danh sách học viên'
    });
  }

  onSendReminders(): void {
    const unpaidStudents = this.students?.filter(student => {
      const status = this.getPaymentStatus(student);
      return status !== 'Đã thanh toán';
    }) || [];

    if (unpaidStudents.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Tất cả học viên đã thanh toán rồi'
      });
      return;
    }

    // Open reminder dialog for all unpaid students
    this.selectedReminderStudents = unpaidStudents;
    this.reminderMessage = this.messageTemplates[0]?.content || '';
    this.selectedTemplate = this.messageTemplates[0];
    this.reminderDialogVisible = true;
    // Update processed message preview
    this.updateProcessedMessage();
  }

  onSendReminderToStudent(item: StudentPayment | FeeWithDetails): void {
    // Convert FeeWithDetails to StudentPayment if needed
    let studentPayment: StudentPayment;
    if (this.isStudentPayment(item)) {
      studentPayment = item;
    } else {
      // Convert FeeWithDetails to StudentPayment format
      const fee = item as FeeWithDetails;
      studentPayment = {
        id: fee.id || 0,
        fee_id: fee.id,
        student_id: fee.student_id,
        name: fee.student_name || 'Học viên không xác định',
        amount: fee.amount || 0,
        due_date: fee.due_date || '',
        paid_date: fee.paid_date || null,
        payment_method: fee.payment_method,
        payment_status: fee.payment_status || 'Chưa thanh toán',
        notes: fee.notes || ''
      };
    }

    // Open reminder dialog for single student
    this.selectedReminderStudents = [studentPayment];
    this.reminderMessage = this.messageTemplates[0]?.content || '';
    this.selectedTemplate = this.messageTemplates[0];
    this.reminderDialogVisible = true;
    // Update processed message preview
    this.updateProcessedMessage();
  }

  onRefresh(): void {
    this.loading = true;
    // Reload all data
    this.loadClassFeeDetails();
    setTimeout(() => {
      this.loading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã làm mới dữ liệu'
      });
    }, 1000);
  }

  // Reminder Dialog Methods
  onTemplateChange(): void {
    if (this.selectedTemplate) {
      this.reminderMessage = this.selectedTemplate.content;
    }
    this.updateProcessedMessage();
  }

  onReminderMessageChange(): void {
    this.updateProcessedMessage();
  }

  updateProcessedMessage(): void {
    if (this.selectedReminderStudents && this.selectedReminderStudents.length > 0) {
      // Use first student for preview (since all should have same class info)
      const previewStudent = this.selectedReminderStudents[0];
      this.processedReminderMessage = this.processMessageTemplate(previewStudent);
    }
  }

  getReminderTotalAmount(): number {
    if (!this.selectedReminderStudents) return 0;
    return this.selectedReminderStudents.reduce((total, student) => {
      const amount = typeof student.amount === 'string' ? parseFloat(student.amount) : (student.amount || 0);
      return total + amount;
    }, 0);
  }

  isReminderFormValid(): boolean {
    return this.reminderMessage.trim().length > 0 && 
           (this.sendViaEmail || this.sendViaSMS) &&
           (this.selectedReminderStudents?.length || 0) > 0;
  }

  onCancelReminder(): void {
    this.reminderDialogVisible = false;
    this.selectedReminderStudents = null;
    this.reminderMessage = '';
    this.processedReminderMessage = '';
    this.selectedTemplate = null;
    this.sendViaEmail = true;
    this.sendViaSMS = false;
  }

  onSendReminder(): void {
    if (!this.isReminderFormValid() || !this.selectedReminderStudents) return;

    this.sendingReminder = true;

    // Process each student
    this.selectedReminderStudents.forEach(student => {
      const processedMessage = this.processMessageTemplate(student);
      this.sendReminderToStudent(student, processedMessage);
    });

    // Close dialog and show success message
    setTimeout(() => {
      this.sendingReminder = false;
      this.onCancelReminder();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã gửi nhắc nhở cho ${this.selectedReminderStudents?.length || 0} học viên`
      });
    }, 2000);
  }

  private processMessageTemplate(student: StudentPayment): string {
    let message = this.reminderMessage || '';
    
    // Replace placeholders with actual data
    message = message.replace(/\{student_name\}/g, student.name || 'Học viên');
    const amount = typeof student.amount === 'string' ? parseFloat(student.amount) : (student.amount || 0);
    message = message.replace(/\{amount\}/g, this.formatCurrency(amount));
    message = message.replace(/\{due_date\}/g, this.formatDate(this.getDueDate(student)));
    message = message.replace(/\{class_name\}/g, this.classData?.class_name || this.classInfo?.name || 'Lớp học');
    
    // Ensure proper HTML formatting - clean up any malformed tags but keep <br> tags
    message = message.replace(/<br\s*\/?>/gi, '<br>'); // Normalize br tags
    
    return message;
  }

  private sendReminderToStudent(student: StudentPayment, message: string): void {
    // TODO: Integrate with actual email/SMS service
    // Here you would typically:
    // 1. Get student email/phone from studentData
    // 2. Call email/SMS service API
    // 3. Log the reminder in database
    
    // For now, we'll simulate the API call
    if (this.sendViaEmail && student.student_id) {
      const studentData = this.studentsData.get(student.student_id);
      if (studentData?.email) {
        // Call email service API here - integrate with NodeMailService on server
        // Example: this.emailService.sendReminderEmail(studentData.email, message);
      }
    }
  }

  onBack(): void {
    this.router.navigate(['/features/fees']);
  }

  /**
   * Public method để force refresh số tiền từ course
   * Có thể gọi từ template hoặc external
   */
  public refreshTuitionAmounts(): void {
    // Update all student amounts from course data
    this.updateAllStudentAmounts();
    
    // Trigger UI update
    this.calculateSummary();
    this.updateTableData();
    this.cdr.detectChanges();
  }

  // Force refresh UI để đảm bảo logic mới được áp dụng
  public forceRefreshUI(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.updateTableData();
      this.cdr.detectChanges();
    }, 0);
  }
}

