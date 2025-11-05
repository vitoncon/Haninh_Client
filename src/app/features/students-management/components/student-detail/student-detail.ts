import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentsModel } from '../../models/students.model';
import { StudentService } from '../../services/student.service';
import { StudentCurrentClasses, StudentOverviewStats, ClassStudentForDetail } from '../../models/student-detail.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
// import { InputTextareaModule } from 'primeng/inputtextarea'; // Not available
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { FileUploadModule } from 'primeng/fileupload';
import { ClassService } from '../../../class-management/services/class.service';
import { ClassStudentService } from '../../../class-management/services/class-student.service';
import { CoursesService } from '../../../courses/services/courses.service';

@Component({
  selector: 'app-student-detail',
  templateUrl: 'student-detail.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    CardModule,
    TagModule,
    TableModule,
    AvatarModule,
    TabsModule,
    TooltipModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    DrawerModule,
    FileUploadModule,
  ],
  styleUrls: ['./student-detail.scss']
})
export class StudentDetail implements OnInit {
  studentData: StudentsModel | null = null;
  loading: boolean = false;
  studentId: number | null = null;
  
  // Dữ liệu lớp học
  currentClasses: StudentCurrentClasses[] = [];
  allClasses: StudentCurrentClasses[] = [];
  overviewStats: StudentOverviewStats | null = null;
  
  // Loading states
  loadingClasses: boolean = false;
  
  // Drawer mode
  drawerVisible: boolean = false;
  formStudent: StudentsModel | null = null;
  saving: boolean = false;
  
  // Form options
  genderOptions = [
    { label: 'Nam', value: 'Nam' },
    { label: 'Nữ', value: 'Nữ' },
    { label: 'Khác', value: 'Khác' }
  ];
  
  statusOptions = [
    { label: 'Đang học', value: 'Đang học' },
    { label: 'Tạm nghỉ', value: 'Tạm nghỉ' },
    { label: 'Nghỉ học', value: 'Nghỉ học' },
    { label: 'Hoàn thành', value: 'Hoàn thành' }
  ];

  // Tabs configuration
  tabs: { title: string; value: number; content: string }[] = [];
  activeTab: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private classService: ClassService,
    private classStudentService: ClassStudentService,
    private coursesService: CoursesService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeTabs();
    this.route.params.subscribe(params => {
      this.studentId = +params['id'];
      if (this.studentId) {
        this.loadStudentDetail();
      }
    });
    
  }

  private initializeTabs(): void {
    this.tabs = [
      { title: 'Thông tin cá nhân', value: 0, content: 'personal-info' },
      { title: 'Lớp học', value: 1, content: 'classes' },
      { title: 'Thống kê', value: 2, content: 'statistics' }
    ];
  }

  private loadStudentDetail(): void {
    if (!this.studentId) return;
    
    this.loading = true;
    // Sử dụng getStudents với filter theo ID vì server không có endpoint riêng cho get by ID
    this.studentService.getStudents({ id: this.studentId }).subscribe({
      next: (response: any) => {
        const students = response?.data || response || [];
        // Tìm student theo ID
        this.studentData = Array.isArray(students) 
          ? students.find((s: StudentsModel) => s.id === this.studentId) || null
          : students;
          
        if (!this.studentData) {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không tìm thấy thông tin học viên'
          });
          this.router.navigate(['/features/students']);
        } else {
          // Load thông tin lớp học sau khi có thông tin học viên
          this.loadStudentClasses();
          // Bỏ qua study results và certificates vì API không tồn tại
          this.calculateOverviewStats();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student detail:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin học viên'
        });
        this.loading = false;
        this.router.navigate(['/features/students']);
      }
    });
  }

  onBack(): void {
    window.history.back();
  }

  // Drawer methods
  onEdit(): void {
    if (this.studentData) {
      this.formStudent = { ...this.studentData };
      this.drawerVisible = true;
    }
  }

  onSave(): void {
    if (!this.formStudent || !this.formStudent.id) return;
    
    this.saving = true;
    this.studentService.updateStudent(this.formStudent.id, this.formStudent as StudentsModel).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật thông tin học viên thành công'
        });
        
        // Update local data
        this.studentData = { ...this.formStudent } as StudentsModel;
        this.drawerVisible = false;
        this.formStudent = null;
        this.saving = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật thông tin học viên'
        });
        this.saving = false;
      }
    });
  }

  onDrawerHide(): void {
    this.drawerVisible = false;
    this.formStudent = null;
  }

  onTabChange(event: any): void {
    this.activeTab = event.value;
    
    // Load dữ liệu khi chuyển tab
    switch (event.value) {
      case 1: // Tab Lớp học
        if (this.allClasses.length === 0) {
          this.loadStudentClasses();
        }
        break;
      case 2: // Tab Thống kê
        this.calculateOverviewStats();
        break;
      default:
        break;
    }
  }

  getLastNameInitial(fullName: string | null | undefined): string {
    if (!fullName) return '?';
    const words = fullName.trim().split(' ');
    if (words.length === 0) return '?';
    return words[words.length - 1].charAt(0).toUpperCase();
  }

  getCurrentClassesCount(): number {
    if (!this.allClasses || this.allClasses.length === 0) {
      return 0;
    }
    return this.allClasses.filter(c => c.status === 'Đang học' || c.status === 'Đang diễn ra').length;
  }

  getCompletedClassesCount(): number {
    if (!this.allClasses || this.allClasses.length === 0) {
      return 0;
    }
    return this.allClasses.filter(c => c.status === 'Hoàn thành').length;
  }

  getDroppedClassesCount(): number {
    if (!this.allClasses || this.allClasses.length === 0) {
      return 0;
    }
    return this.allClasses.filter(c => c.status === 'Nghỉ học').length;
  }


  viewClassDetail(classId: number): void {
    if (!classId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không thể xem chi tiết lớp học: ID không hợp lệ'
      });
      return;
    }
    
    this.router.navigate(['/features/class/detail', classId]);
  }


  refreshClasses(): void {
    this.loadStudentClasses();
  }




  navigateToStudyResults(): void {
    // Điều hướng đến module study-results với filter theo student_id
    this.router.navigate(['/features/study-results'], { 
      queryParams: { student_id: this.studentId } 
    });
  }

  navigateToCertificates(): void {
    // Điều hướng đến module certificates với filter theo student_id
    this.router.navigate(['/features/certificates'], { 
      queryParams: { student_id: this.studentId } 
    });
  }


  private loadStudentClasses(): void {
    if (!this.studentId) {
      console.error('No student ID provided');
      return;
    }

    this.loadingClasses = true;
    
    // Sử dụng ClassStudentService.getClassesByStudent() thay vì StudentService
    this.classStudentService.getClassesByStudent(this.studentId).subscribe({
      next: (response: any) => {
        let allStudentClasses = [];
        if (Array.isArray(response)) {
          allStudentClasses = response;
        } else if (response?.data) {
          allStudentClasses = Array.isArray(response.data) ? response.data : [response.data];
        }
        
        // Validate dữ liệu - chỉ lấy records của student hiện tại
        const validStudentClasses = allStudentClasses.filter((item: any) => 
          item.student_id === this.studentId
        );
        
        // Xử lý dữ liệu từ class_student model
        if (validStudentClasses.length > 0) {
          this.processClassStudentData(validStudentClasses);
        } else {
          this.currentClasses = [];
          this.allClasses = [];
          this.loadingClasses = false;
          this.calculateOverviewStats();
        }
      },
      error: (error) => {
        console.error('Error loading class_students data:', error);
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Không thể tải thông tin lớp học của học viên'
        });
        this.loadingClasses = false;
        this.calculateOverviewStats();
      }
    });
  }

  private processClassStudentData(classStudentData: any[]): void {
    
    // Chuyển đổi dữ liệu từ API response sang format StudentCurrentClasses
    // Lưu ý: class_students API chỉ trả về class_id, student_id, enroll_date, status, note
    // KHÔNG có class_name, class_code, course_name, language, teacher_name
    const formattedClasses: StudentCurrentClasses[] = classStudentData.map((item: any) => {
      
      const formattedClass: StudentCurrentClasses = {
        id: item.id || 0,
        class_id: item.class_id,
        class_name: `Lớp ${item.class_id}`, // Tạm thời dùng ID, sẽ load chi tiết từ classes API
        class_code: `L${item.class_id}`,
        course_name: 'Chưa xác định', // Sẽ load từ courses API
        language: 'Chưa biết', // Sẽ load từ courses API
        teacher_name: 'Chưa phân công', // Sẽ load từ teachers API
        enroll_date: item.enroll_date,
        completion_date: item.completion_date,
        status: item.status || 'Đang học',
        note: item.note
      };
      
      return formattedClass;
    });
    
    // Lọc lớp học hiện tại: chỉ lấy những lớp có status = 'Đang học'
    this.currentClasses = formattedClasses.filter((classItem: StudentCurrentClasses) => 
      classItem.status === 'Đang học' || classItem.status === 'Đang diễn ra'
    );
    
    // Tất cả lớp học (bao gồm cả đã hoàn thành và nghỉ học)
    this.allClasses = formattedClasses;
    
    
    this.loadingClasses = false;
    this.calculateOverviewStats();
    
    
    // Load thêm thông tin chi tiết từ các API riêng biệt
    if (classStudentData.length > 0) {
      this.loadClassDetailsFromAPI(classStudentData);
    }
  }



  private loadClassesIndividually(classIds: number[]): void {
    
    const classDataMap = new Map();
    const courseIds = new Set<number>();
    let completedRequests = 0;
    const totalRequests = classIds.length;
    
    if (totalRequests === 0) {
      this.updateClassesWithData(classDataMap, new Map());
      return;
    }
    
    classIds.forEach(classId => {
      this.classService.getClassById(classId).subscribe({
        next: (classData: any) => {
          if (classData && classData.id) {
            classDataMap.set(classData.id, classData);
            
            // Force add course_id nếu có, bất kể type
            if (classData.course_id) {
              const courseId = typeof classData.course_id === 'number' ? classData.course_id : parseInt(classData.course_id);
              if (!isNaN(courseId)) {
                courseIds.add(courseId);
              }
            }
          }
          
          completedRequests++;
          if (completedRequests === totalRequests) {
            // Load courses data nếu có course_id
            if (courseIds.size > 0) {
              this.loadCoursesData(Array.from(courseIds) as number[], classDataMap);
            } else {
              this.updateClassesWithData(classDataMap, new Map());
            }
          }
        },
        error: (error) => {
          completedRequests++;
          
          if (completedRequests === totalRequests) {
            // Load courses data nếu có course_id
            if (courseIds.size > 0) {
              this.loadCoursesData(Array.from(courseIds) as number[], classDataMap);
            } else {
              this.updateClassesWithData(classDataMap, new Map());
            }
          }
        }
      });
    });
  }


  private calculateOverviewStats(): void {
    if (!this.allClasses.length) {
      this.overviewStats = {
        totalClasses: 0,
        currentClasses: 0,
        completedClasses: 0,
        lastClassDate: ''
      };
      return;
    }

    const totalClasses = this.allClasses.length;
    const currentClasses = this.allClasses.filter(c => c.status === 'Đang học').length;
    const completedClasses = this.allClasses.filter(c => c.status === 'Hoàn thành').length;
    
    
    // Lấy ngày học gần nhất từ dữ liệu class_student
    const lastClassDate = this.allClasses.length > 0 
      ? this.allClasses[0].enroll_date 
      : '';

    this.overviewStats = {
      totalClasses,
      currentClasses,
      completedClasses,
      lastClassDate
    };
    
  }

  // Load class details từ nhiều API riêng biệt (client-side approach)
  private loadClassDetailsFromAPI(classStudentData: any[]): void {
    const uniqueClassIds = [...new Set(classStudentData.map(item => item.class_id))];
    
    
    if (uniqueClassIds.length === 0) {
      return;
    }

    // Load classes data từng cái một để đảm bảo không bị miss
    this.loadClassesIndividually(uniqueClassIds);
  }

  // Load courses data
  private loadCoursesData(courseIds: number[], classDataMap: Map<any, any>): void {
    
    const courseDataMap = new Map();
    let completedRequests = 0;
    const totalRequests = courseIds.length;
    
    if (totalRequests === 0) {
      this.loadTeachersData(classDataMap, courseDataMap);
      return;
    }
    
    courseIds.forEach(courseId => {
      this.coursesService.getCoursesByIds([courseId]).subscribe({
        next: (courseData: any) => {
          const coursesArray = Array.isArray(courseData) ? courseData : [courseData];
          coursesArray.forEach((course: any) => {
            if (course && course.id) {
              courseDataMap.set(course.id, course);
            }
          });
          
          completedRequests++;
          if (completedRequests === totalRequests) {
            // Load teachers data
            this.loadTeachersData(classDataMap, courseDataMap);
          }
        },
        error: (error) => {
          completedRequests++;
          
          if (completedRequests === totalRequests) {
            // Load teachers data
            this.loadTeachersData(classDataMap, courseDataMap);
          }
        }
      });
    });
  }

  // Load teachers data
  private loadTeachersData(classDataMap: Map<any, any>, courseDataMap: Map<any, any>): void {
    const classIds = Array.from(classDataMap.keys());
    
    this.studentService.getClassTeachers(classIds).subscribe({
      next: (classTeachersData: any) => {
        const classTeachersArray = Array.isArray(classTeachersData) ? classTeachersData : [];
        
        if (classTeachersArray.length > 0) {
          const teacherAssignmentsMap = new Map();
          const teacherIds = new Set<number>();
          
          classTeachersArray.forEach((ct: any) => {
            if (ct.class_id && ct.teacher_id) {
              // Priority: Giáo viên giảng dạy > Giáo viên chủ nhiệm > Trợ giảng
              if (!teacherAssignmentsMap.has(ct.class_id) || 
                  (ct.role === 'Giáo viên giảng dạy' && teacherAssignmentsMap.get(ct.class_id).role !== 'Giáo viên giảng dạy') ||
                  (ct.role === 'Giáo viên chủ nhiệm' && !teacherAssignmentsMap.get(ct.class_id).role || teacherAssignmentsMap.get(ct.class_id).role === 'Trợ giảng')) {
                teacherAssignmentsMap.set(ct.class_id, ct);
              }
              const teacherId = typeof ct.teacher_id === 'number' ? ct.teacher_id : parseInt(ct.teacher_id);
              if (!isNaN(teacherId)) {
                teacherIds.add(teacherId);
              }
            }
          });
          
          if (teacherIds.size > 0) {
            this.loadTeachersByIds(Array.from(teacherIds), classDataMap, courseDataMap, teacherAssignmentsMap);
          } else {
            this.loadTeacherFromClassSchedules(classIds, classDataMap, courseDataMap, new Map());
          }
        } else {
          this.loadTeacherFromClassSchedules(classIds, classDataMap, courseDataMap, new Map());
        }
      },
      error: (error) => {
        console.error('Error loading class teachers:', error);
        this.loadTeacherFromClassSchedules(classIds, classDataMap, courseDataMap, new Map());
      }
    });
  }


  private loadTeacherFromClassSchedules(classIds: number[], classDataMap: Map<any, any>, courseDataMap: Map<any, any>, teacherAssignmentsMap: Map<any, any>): void {
    if (classIds.length === 0) {
      this.updateClassesWithData(classDataMap, courseDataMap, new Map(), teacherAssignmentsMap);
      return;
    }
    
    this.studentService.getClassSchedules({ class_ids: classIds }).subscribe({
      next: (schedulesData: any) => {
        const schedulesArray = Array.isArray(schedulesData) ? schedulesData : [];
        
        // Group by class_id and get the most recent teacher_id for each class
        const classTeacherMap = new Map<number, number>();
        const teacherIds = new Set<number>();
        
        // Sort schedules by date (most recent first) to get the latest teacher assignment
        const sortedSchedules = [...schedulesArray].sort((a, b) => {
          const dateA = new Date(a.date || a.created_at || 0).getTime();
          const dateB = new Date(b.date || b.created_at || 0).getTime();
          return dateB - dateA; // Most recent first
        });
        
        sortedSchedules.forEach((schedule: any) => {
          if (schedule.class_id && schedule.teacher_id) {
            const teacherId = typeof schedule.teacher_id === 'number' ? schedule.teacher_id : parseInt(schedule.teacher_id);
            if (!isNaN(teacherId)) {
              if (!classTeacherMap.has(schedule.class_id)) {
                classTeacherMap.set(schedule.class_id, teacherId);
                teacherIds.add(teacherId);
              }
            }
          }
        });
        
        if (teacherIds.size > 0) {
          // Update teacherAssignmentsMap with schedule-based data
          classTeacherMap.forEach((teacherId, classId) => {
            teacherAssignmentsMap.set(classId, { class_id: classId, teacher_id: teacherId });
          });
          
          this.loadTeachersByIds(Array.from(teacherIds), classDataMap, courseDataMap, teacherAssignmentsMap);
        } else {
          this.updateClassesWithData(classDataMap, courseDataMap, new Map(), teacherAssignmentsMap);
        }
      },
      error: (error) => {
        console.error('Error fetching class schedules:', error);
        this.updateClassesWithData(classDataMap, courseDataMap, new Map(), teacherAssignmentsMap);
      }
    });
  }

  // Load teachers by IDs
  private loadTeachersByIds(teacherIds: number[], classDataMap: Map<any, any>, 
                           courseDataMap: Map<any, any>, teacherAssignmentsMap: Map<any, any>): void {
    
    const teacherDataMap = new Map();
    let completedRequests = 0;
    const totalRequests = teacherIds.length;
    
    if (totalRequests === 0) {
      this.updateClassesWithData(classDataMap, courseDataMap, teacherDataMap, teacherAssignmentsMap);
      return;
    }
    
    teacherIds.forEach(teacherId => {
      this.studentService.getTeachersByIds([teacherId]).subscribe({
        next: (teacherData: any) => {
          const teachersArray = Array.isArray(teacherData) ? teacherData : 
                               teacherData?.data ? teacherData.data : [];
          teachersArray.forEach((teacher: any) => {
            if (teacher && teacher.id) {
              teacherDataMap.set(teacher.id, teacher);
            }
          });
          
          completedRequests++;
          if (completedRequests === totalRequests) {
            // Cập nhật tất cả dữ liệu
            this.updateClassesWithData(classDataMap, courseDataMap, teacherDataMap, teacherAssignmentsMap);
          }
        },
        error: (error) => {
          completedRequests++;
          
          if (completedRequests === totalRequests) {
            // Cập nhật tất cả dữ liệu
            this.updateClassesWithData(classDataMap, courseDataMap, teacherDataMap, teacherAssignmentsMap);
          }
        }
      });
    });
  }

  // Cập nhật classes với tất cả dữ liệu đã load
  private updateClassesWithData(classDataMap: Map<any, any>, courseDataMap: Map<any, any>, 
                               teacherDataMap: Map<any, any> = new Map(), 
                               teacherAssignmentsMap: Map<any, any> = new Map()): void {
    
    // Cập nhật allClasses với data mới
    this.allClasses = this.allClasses.map(classItem => {
      const classData = classDataMap.get(classItem.class_id);
      
      if (classData) {
        // Lấy course data
        const courseData = courseDataMap.get(classData.course_id);
        
        // Lấy teacher data
        const assignment = teacherAssignmentsMap.get(classItem.class_id);
        const teacherData = assignment ? teacherDataMap.get(assignment.teacher_id) : null;
        const teacherName = teacherData?.teacher_name || teacherData?.name || classItem.teacher_name;
        
        const updatedClass = {
          ...classItem,
          class_name: classData.class_name || classItem.class_name,
          class_code: classData.class_code || classItem.class_code,
          course_name: courseData?.course_name || classData.course_name || classItem.course_name,
          language: courseData?.language || classData.language || classItem.language,
          teacher_name: teacherName
        };
        
        return updatedClass;
      }
      
      // Nếu không tìm thấy class data
      return {
        ...classItem,
        class_name: `Lớp ${classItem.class_id} (Không tìm thấy)`,
        class_code: `L${classItem.class_id}`,
        course_name: 'Lớp không tồn tại',
        language: 'Không xác định',
        teacher_name: 'Không có dữ liệu'
      };
    });
    
    // Cập nhật currentClasses (filter từ allClasses)
    this.currentClasses = this.allClasses.filter(classItem => 
      classItem.status === 'Đang học' || classItem.status === 'Đang diễn ra'
    );
    
    this.calculateOverviewStats();
  }
}

