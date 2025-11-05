import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ClassModel } from '../../models/class.model';
import { ClassService } from '../../services/class.service';
import { vi } from '../../../../config/translation-vi'; 

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
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { FluidModule } from 'primeng/fluid';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { CoursesService } from '../../../courses/services/courses.service';
import { Course } from '../../../courses/models/courses.model';
import { TooltipModule } from 'primeng/tooltip';
import { ScheduleService } from '../../../schedule/services/schedule.service';
import { TeacherService } from '../../../teacher-management/services/teacher.service';
import { TeacherModel } from '../../../teacher-management/models/teacher.model';


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
    MultiSelectModule,
    DatePickerModule,
    FluidModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
    TooltipModule,
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
  
  // Translation
  vi = vi;
  drawerVisible: boolean = false;
  saving: boolean = false;
  loading: boolean = false;
  generatingCode: boolean = false;
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

  // Schedule form properties
  teachers: TeacherModel[] = [];
  teacherOptions: { label: string; value: number }[] = [];
  selectedDays: string[] = [];
  startTimeDate: Date | null = null;
  endTimeDate: Date | null = null;
  dayOptions = [
    { label: 'Thứ 2', value: 'Thứ 2' },
    { label: 'Thứ 3', value: 'Thứ 3' },
    { label: 'Thứ 4', value: 'Thứ 4' },
    { label: 'Thứ 5', value: 'Thứ 5' },
    { label: 'Thứ 6', value: 'Thứ 6' },
    { label: 'Thứ 7', value: 'Thứ 7' },
    { label: 'Chủ nhật', value: 'Chủ nhật' }
  ];

  @ViewChild('dt', { static: false }) dt!: Table;

  constructor(
    private classService: ClassService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private coursesService: CoursesService,
    private router: Router,
    private scheduleService: ScheduleService,
    private teacherService: TeacherService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadTeachers();
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

  private loadTeachers() {
    this.teacherService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers = teachers;
        this.teacherOptions = teachers.map(t => ({
          label: t.teacher_name,
          value: t.id!
        }));
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách giáo viên'
        });
      }
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
      status: 'Mở đăng ký',
      max_students: 25
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
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách lớp học'
        });
      }
    });
  }  

  onCreate() {
    this.selectedClass = null;
    this.formClass = this.createEmptyClass();
    this.resetScheduleForm();
    this.drawerVisible = true;
  }

  onEdit(classItem: ClassModel) {
    this.selectedClass = { ...classItem };
    this.formClass = { ...classItem };
    // Legacy schedule parsing removed since we don't use schedule field anymore
    this.drawerVisible = true;
  }

  resetScheduleForm(): void {
    this.selectedDays = [];
    this.startTimeDate = null;
    this.endTimeDate = null;
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
    if (classItem.id) {
      this.router.navigate(['/features/class/detail', classItem.id]);
    }
  }

  // Schedule handling methods
  getSchedulePreview(): string {
    if (this.selectedDays.length === 0 || !this.startTimeDate || !this.endTimeDate) {
      return '';
    }
    
    const startTime = this.formatTimeFromDate(this.startTimeDate);
    const endTime = this.formatTimeFromDate(this.endTimeDate);
    
    // Hiển thị ngắn gọn khi có nhiều thứ
    let daysText;
    if (this.selectedDays.length <= 3) {
      daysText = this.selectedDays.join(', ');
    } else {
      daysText = `${this.selectedDays.length} thứ đã chọn`;
    }
    
    return `${daysText} | ${startTime} - ${endTime}`;
  }

  updateScheduleField(): void {
    // Legacy method - no longer needed since we use schedule templates
    // This method is kept for backward compatibility with existing form
  }

  formatTimeFromDate(date: Date): string {
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  createDateFromTime(timeString: string): Date | null {
    if (!timeString) return null;
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);
    return today;
  }


  parseExistingSchedule(schedule: string | null): void {
    if (!schedule) {
      this.resetScheduleForm();
      return;
    }

    // Parse schedule like "Thứ 2, Thứ 4, Thứ 6 18:00-20:00"
    const timeMatch = schedule.match(/(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (timeMatch) {
      this.startTimeDate = this.createDateFromTime(timeMatch[1]);
      this.endTimeDate = this.createDateFromTime(timeMatch[2]);
      
      const daysPart = schedule.replace(/\s*\d{2}:\d{2}-\d{2}:\d{2}$/, '');
      this.selectedDays = daysPart.split(',').map(day => day.trim()).filter(day => day);
    }
  }

  onSave() {
    
    if (!this.formClass) {
      return;
    }
  
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

    // Kiểm tra lịch học từ form hiện tại - CHỈ BẮT BUỘC khi tạo mới, không bắt buộc khi chỉnh sửa
    const isEditMode = this.isEditMode();
    if (!isEditMode && (this.selectedDays.length === 0 || !this.startTimeDate || !this.endTimeDate)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng chọn thứ trong tuần và giờ học'
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
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi ngày tháng',
        detail: 'Vui lòng chọn ngày bắt đầu và ngày kết thúc cho lớp học'
      });
      return;
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
        next: (updatedClass: any) => {
          
          // Step 2: Update schedule if schedule data exists - CHỈ CẬP NHẬT NẾU CÓ THÔNG TIN LỊCH HỌC
          // Use selectedClass.id since updatedClass might not have id in response
          const classId = this.selectedClass?.id || updatedClass?.id;
          const startDate = updatedClass?.start_date || this.formClass?.start_date;
          const endDate = updatedClass?.end_date || this.formClass?.end_date;
          
          if (!classId) {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: `Không thể xác định ID lớp học. SelectedClass: ${JSON.stringify(this.selectedClass)}, UpdatedClass: ${JSON.stringify(updatedClass)}`
            });
            this.loadClasses();
            this.drawerVisible = false;
            done();
            return;
          }
          
          // CHỈ CẬP NHẬT LỊCH HỌC NẾU CÓ THÔNG TIN (selectedDays, startTimeDate, endTimeDate)
          const hasScheduleInfo = this.selectedDays.length > 0 && this.startTimeDate && this.endTimeDate;
          
          if (hasScheduleInfo) {
            // Có thông tin lịch học, tiến hành cập nhật
            this.updateClassScheduleTransaction(classId, startDate!, endDate!)
              .subscribe({
                next: (scheduleResult: any) => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Cập nhật lớp học thành công${scheduleResult.classSchedulesCount > 0 ? ` và ${scheduleResult.classSchedulesCount} buổi học` : ''}`
                  });
                  this.loadClasses();
                  this.drawerVisible = false;
                },
                error: (scheduleErr: any) => {
                  // Class updated but schedule failed
                  this.messageService.add({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Lớp học đã được cập nhật nhưng lịch học chưa được cập nhật: ' + (scheduleErr?.error?.message || scheduleErr.message || 'Lỗi không xác định')
                  });
                  this.loadClasses();
                  this.drawerVisible = false;
                },
                complete: done
              });
          } else {
            // Không có thông tin lịch học, chỉ cập nhật thông tin lớp
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Cập nhật lớp học thành công'
            });
            this.loadClasses();
            this.drawerVisible = false;
            done();
          }
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err?.error?.message || 'Không thể cập nhật lớp học'
          });
          done();
        }
      });
  
    // Nếu là thêm mới (create) - New workflow
    } else {
      // Step 1: Create class first
      this.classService.addClass(payload).subscribe({
        next: (createdClass: any) => {
          
          // Step 2: Create schedule templates and generate class schedules
          const classId = createdClass?.data?.data; // ID nằm trong data.data
          const startDate = createdClass?.start_date || this.formClass?.start_date;
          const endDate = createdClass?.end_date || this.formClass?.end_date;
          
          if (!classId) {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: `Không thể xác định ID lớp học mới tạo. Response: ${JSON.stringify(createdClass)}`
            });
            done();
            return;
          }
          
          this.createScheduleTemplatesAndSchedules(classId, startDate!, endDate!)
            .subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Thành công',
                  detail: 'Thêm lớp học và lịch học thành công'
                });
                this.loadClasses();
                this.drawerVisible = false;
              },
              error: (err: any) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: err?.error?.message || 'Không thể tạo lịch học'
                });
              },
              complete: done
            });
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err?.error?.message || 'Không thể thêm lớp học'
          });
          done();
        }
      });
    }
  }
  
  

  private formatDate(dateValue: any): string {
    // Use the new ensureVietnamDate method to handle all cases properly
    return this.ensureVietnamDate(dateValue);
  }

  // Helper method to ensure date is interpreted as Vietnam date
  private ensureVietnamDate(dateValue: any): string {
    if (!dateValue) return '';
    
    // If it's a string in YYYY-MM-DD format, treat it as Vietnam date
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a Date object, treat it as Vietnam date by using local date components
    if (dateValue instanceof Date) {
      // Use the local date components directly (this is what user selected)
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // For other formats, try to parse and convert
    try {
      const parsedDate = new Date(dateValue);
      return this.ensureVietnamDate(parsedDate);
    } catch (error) {
      console.error('Invalid date format:', dateValue);
      return String(dateValue);
    }
  }

  // Helper method to convert any date to Vietnam timezone (UTC+7)
  private convertToVietnamTimezone(date: Date): Date {
    // Get the date in Vietnam timezone
    const vietnamOffset = 7 * 60; // Vietnam is UTC+7 (7 hours = 420 minutes)
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const vietnamTime = new Date(utc + (vietnamOffset * 60000));
    return vietnamTime;
  }

  // Update class schedule transaction (for edit class)
  private updateClassScheduleTransaction(classId: number, startDate: string, endDate: string) {
    // Validate input parameters
    if (!classId || classId <= 0) {
      return new Observable(observer => {
        observer.error(new Error('Invalid class ID'));
        observer.complete();
      });
    }

    if (!startDate || !endDate) {
      return new Observable(observer => {
        observer.error(new Error('Invalid date range'));
        observer.complete();
      });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return new Observable(observer => {
        observer.error(new Error('End date is before start date'));
        observer.complete();
      });
    }

    // Convert selectedDays (string array) to day_of_week (number array) - JavaScript format
    const dayMapping: { [key: string]: number } = {
      'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 
      'Thứ 6': 5, 'Thứ 7': 6, 'Chủ nhật': 0
    };
    
    const dayNumbers = this.selectedDays.map(day => dayMapping[day]).filter(num => num !== undefined);
    const startTime = this.formatTimeFromDate(this.startTimeDate!);
    const endTime = this.formatTimeFromDate(this.endTimeDate!);
    
    return new Observable(observer => {
      // Step 1: Get existing schedules for this class
      this.scheduleService.getSchedules().subscribe({
        next: (allSchedules: any[]) => {
          const existingSchedules = allSchedules.filter(s => s.class_id === classId);
          
          // Step 2: Delete existing class_schedules for this class
          this.scheduleService.getClassSchedulesByClass(classId).subscribe({
            next: (existingClassSchedules: any[]) => {
              let deletedCount = 0;
              let hasDeleteError = false;
              
              if (existingClassSchedules.length === 0) {
                // No existing schedules, proceed to create new ones
                this.createNewSchedules(classId, startDate, endDate, dayNumbers, startTime, endTime, observer);
                return;
              }
              
              existingClassSchedules.forEach(classSchedule => {
                this.scheduleService.deleteSchedule(classSchedule.id).subscribe({
                  next: () => {
                    deletedCount++;
                    if (deletedCount === existingClassSchedules.length && !hasDeleteError) {
                      // All old schedules deleted, now delete schedule templates
                      this.deleteScheduleTemplates(existingSchedules, classId, startDate, endDate, dayNumbers, startTime, endTime, observer);
                    }
                  },
                  error: (error: any) => {
                    hasDeleteError = true;
                    console.error('Error deleting class schedule:', error);
                    observer.error(error);
                  }
                });
              });
            },
            error: (error: any) => {
              console.error('Error getting existing class schedules:', error);
              observer.error(error);
            }
          });
        },
        error: (error: any) => {
          console.error('Error getting existing schedules:', error);
          observer.error(error);
        }
      });
    });
  }

  // Helper method to delete schedule templates
  private deleteScheduleTemplates(existingSchedules: any[], classId: number, startDate: string, endDate: string, dayNumbers: number[], startTime: string, endTime: string, observer: any) {
    let deletedTemplateCount = 0;
    let hasDeleteTemplateError = false;
    
    if (existingSchedules.length === 0) {
      // No existing templates, proceed to create new ones
      this.createNewSchedules(classId, startDate, endDate, dayNumbers, startTime, endTime, observer);
      return;
    }
    
    existingSchedules.forEach(schedule => {
      this.scheduleService.deleteScheduleTemplate(schedule.id).subscribe({
        next: () => {
          deletedTemplateCount++;
          if (deletedTemplateCount === existingSchedules.length && !hasDeleteTemplateError) {
            // All templates deleted, now create new ones
            this.createNewSchedules(classId, startDate, endDate, dayNumbers, startTime, endTime, observer);
          }
        },
        error: (error: any) => {
          hasDeleteTemplateError = true;
          console.error('Error deleting schedule template:', error);
          observer.error(error);
        }
      });
    });
  }

  // Helper method to create new schedules
  private createNewSchedules(classId: number, startDate: string, endDate: string, dayNumbers: number[], startTime: string, endTime: string, observer: any) {
    
    let completedTemplates = 0;
    let templateIds: number[] = [];
    let hasTemplateError = false;

    if (dayNumbers.length === 0) {
      observer.error(new Error('No valid days selected for update'));
      return;
    }

    // Create a template for each selected day (same logic as create mode)
    dayNumbers.forEach((dayOfWeek: number) => {
      const scheduleTemplate = {
        class_id: classId,
        day_of_week: dayOfWeek, // Single day, not array
        start_time: startTime,
        end_time: endTime,
        start_date: startDate,
        end_date: endDate,
        teacher_id: null, // Explicitly set to null
        room_name: this.formClass?.room || null, // Explicitly set to null if empty
        note: 'Lịch học được cập nhật từ form',
        status: 'Đã Lên Lịch',
        created_by: 0,
        updated_by: 0,
        is_deleted: 0,
        deleted_by: 0
      };


      this.scheduleService.addScheduleTemplate(scheduleTemplate).subscribe({
        next: (templateResponse: any) => {
          completedTemplates++;
          templateIds.push(templateResponse.id || templateResponse.data?.data);
          
          if (completedTemplates === dayNumbers.length && !hasTemplateError) {
            // All templates created, now create class schedules
            this.createClassSchedulesFromTemplates(classId, templateIds, startDate, endDate, dayNumbers, startTime, endTime, observer);
          }
        },
        error: (error: any) => {
          hasTemplateError = true;
          console.error('Error creating schedule template:', error);
          observer.error(error);
        }
      });
    });
  }

  // Helper method to create class schedules from templates (used by both create and update)
  private createClassSchedulesFromTemplates(classId: number, templateIds: number[], startDate: string, endDate: string, dayNumbers: number[], startTime: string, endTime: string, observer: any) {
    
    let totalSchedules = 0;
    let completedSchedules = 0;
    let hasError = false;

    // Parse dates manually to avoid timezone issues
    const startDateStr = typeof startDate === 'string' ? startDate : (startDate as Date).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string' ? endDate : (endDate as Date).toISOString().split('T')[0];
    
    const startParts = startDateStr.split('-');
    const endParts = endDateStr.split('-');
    const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));

    // Collect all unique schedules first to avoid duplicates
    const uniqueSchedules: any[] = [];
    const scheduleKeys = new Set<string>();

    // Generate all possible schedules
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay(); // Use JavaScript format directly: 0=Sunday, 1=Monday, ..., 6=Saturday
      
      if (dayNumbers.includes(dayOfWeek)) {
        // Format date as YYYY-MM-DD in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Create unique key to prevent duplicates
        const scheduleKey = `${classId}-${dateStr}-${dayOfWeek}-${startTime}-${endTime}`;
        
        if (!scheduleKeys.has(scheduleKey)) {
          scheduleKeys.add(scheduleKey);
          
          const classSchedule = {
            class_id: classId,
            schedule_id: templateIds[0], // Use first template ID for all schedules
            date: dateStr,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            teacher_id: null,
            room_name: this.formClass?.room || '',
            status: 'Đã Lên Lịch',
            note: ''
          };
          
          uniqueSchedules.push(classSchedule);
        }
      }
    }

    totalSchedules = uniqueSchedules.length;

    // Create schedules one by one
    uniqueSchedules.forEach((classSchedule) => {
      this.scheduleService.addSchedule(classSchedule).subscribe({
        next: () => {
          completedSchedules++;
          if (completedSchedules === totalSchedules && !hasError) {
            observer.next({ 
              message: 'Lịch học đã được tạo thành công',
              templateIds: templateIds,
              classSchedulesCount: totalSchedules
            });
            observer.complete();
          }
        },
        error: (error: any) => {
          hasError = true;
          console.error('Error creating class schedule:', error);
          observer.error(error);
        }
      });
    });

    if (totalSchedules === 0) {
      observer.next({ 
        message: 'Không có buổi học nào được tạo',
        templateIds: templateIds,
        classSchedulesCount: 0
      });
      observer.complete();
    }
  }

  // Create schedule template and class schedules from form data (for new class)
  private createScheduleTemplatesAndSchedules(classId: number, startDate: string, endDate: string) {
    // Validate input parameters
    if (!classId || classId <= 0) {
      return new Observable(observer => {
        observer.error(new Error('Invalid class ID'));
        observer.complete();
      });
    }

    if (!startDate || !endDate) {
      return new Observable(observer => {
        observer.error(new Error('Invalid date range'));
        observer.complete();
      });
    }

    // Validate date range - handle both string and Date inputs
    const startDateStr = typeof startDate === 'string' ? startDate : (startDate as Date).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string' ? endDate : (endDate as Date).toISOString().split('T')[0];
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end < start) {
      return new Observable(observer => {
        observer.error(new Error('End date is before start date'));
        observer.complete();
      });
    }

    // Convert selectedDays (string array) to day_of_week (number array) - JavaScript format
    const dayMapping: { [key: string]: number } = {
      'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 
      'Thứ 6': 5, 'Thứ 7': 6, 'Chủ nhật': 0
    };
    
    const dayNumbers = this.selectedDays.map(day => dayMapping[day]).filter(num => num !== undefined);
    const startTime = this.formatTimeFromDate(this.startTimeDate!);
    const endTime = this.formatTimeFromDate(this.endTimeDate!);
    
    return new Observable(observer => {
      // Step 1: Create schedule templates for each day
      
      let completedTemplates = 0;
      let templateIds: number[] = [];
      let hasTemplateError = false;

      if (dayNumbers.length === 0) {
        observer.error(new Error('No valid days selected'));
        return;
      }

      // Create a template for each selected day
      dayNumbers.forEach((dayOfWeek: number) => {
        const scheduleTemplate = {
          class_id: classId,
          day_of_week: dayOfWeek, // Single day, not array
          start_time: startTime,
          end_time: endTime,
          start_date: startDate,
          end_date: endDate,
          teacher_id: null, // Explicitly set to null
          room_name: this.formClass?.room || null, // Explicitly set to null if empty
          note: 'Lịch học được tạo tự động từ form',
          status: 'Đã Lên Lịch',
          created_by: 0,
          updated_by: 0,
          is_deleted: 0,
          deleted_by: 0
        };


        this.scheduleService.addScheduleTemplate(scheduleTemplate).subscribe({
          next: (templateResponse: any) => {
            completedTemplates++;
            templateIds.push(templateResponse.id || templateResponse.data?.data);
            
            if (completedTemplates === dayNumbers.length && !hasTemplateError) {
              // All templates created, now create class schedules
              this.createClassSchedulesFromTemplates(classId, templateIds, startDate, endDate, dayNumbers, startTime, endTime, observer);
            }
          },
          error: (error: any) => {
            hasTemplateError = true;
            console.error('Error creating schedule template:', error);
            observer.error(error);
          }
        });
      });
    });
  }


  onDrawerHide() {
  this.formClass = null;
  this.drawerVisible = false;
}



  // Get count for specific status
  getStatusCount(status: string): number {
    return this.classes.filter(c => c.status === status).length;
  }

  // Export to Excel
  onExportExcel(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Xuất Excel',
      detail: 'Tính năng xuất Excel đang được phát triển'
    });
  }

  // Refresh data
  onRefresh(): void {
    this.loadClasses();
    this.messageService.add({
      severity: 'info',
      summary: 'Làm mới',
      detail: 'Đang tải lại dữ liệu...'
    });
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
      return;
    }

    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      this.filteredClasses = [...this.searchCache.get(cacheKey)!];
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
  }

  private clearSearchCache() {
    this.searchCache.clear();
  }

  /** Tạo mã lớp học ngẫu nhiên */
  generateClassCode(): string {
    const prefix = 'L';
    const timestamp = Date.now().toString().slice(-6); // Lấy 6 số cuối của timestamp
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 số ngẫu nhiên
    return `${prefix}${timestamp}${randomNum}`;
  }

  /** Tạo mã lớp học mới với loading state */
  generateNewClassCode() {
    if (this.formClass) {
      this.generatingCode = true;
      
      // Simulate loading time for better UX
      setTimeout(() => {
        this.formClass!.class_code = this.generateClassCode();
        this.generatingCode = false;
      }, 200);
    }
  }

  /** Kiểm tra có đang ở chế độ edit không */
  isEditMode(): boolean {
    return !!(this.formClass && this.formClass.id && this.formClass.id > 0);
  }
}
