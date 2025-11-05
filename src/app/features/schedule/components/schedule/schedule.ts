import { Component, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleModel } from '../../models/schedule.model';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { ClassService } from '../../../class-management/services/class.service';
import { TeacherService } from '../../../teacher-management/services/teacher.service';
import { CoursesService } from '../../../courses/services/courses.service';
import { ClassModel } from '../../../class-management/models/class.model';
import { TeacherModel } from '../../../teacher-management/models/teacher.model';
import { Course } from '../../../courses/models/courses.model';
import { LayoutService } from '../../../../layout/service/layout.service';
import { fullCalendarViLocale } from '../../../../config/translation-vi';
import { forkJoin } from 'rxjs';
import { TeachingAssignmentService } from '../../../teaching-assignments/services/teaching-assignment.service';
import { ClassTeacherAssignment } from '../../../teaching-assignments/models/teaching-assignment.model';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, DialogModule, InputTextModule, ButtonModule, SelectModule, TextareaModule, ToastModule, DatePickerModule, TooltipModule],
  templateUrl: './schedule.html',
  styleUrls: ['./schedule.scss'],
  providers: [ConfirmationService, MessageService]
})
export class Schedule implements OnInit, AfterViewInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  
  calendarOptions!: CalendarOptions;
  displayDialog = false;
  saving = false;

  schedules: ScheduleModel[] = [];
  selectedEvent: any = null;
  formSchedule!: ScheduleModel;

  // Time picker variables (giống class.html)
  startTimeDate: Date | null = null;
  endTimeDate: Date | null = null;

  // Data for dropdowns
  classes: ClassModel[] = [];
  teachers: TeacherModel[] = [];
  courses: Course[] = [];
  classOptions: { label: string; value: number }[] = [];
  teacherOptions: { label: string; value: number }[] = [];
  classTeacherAssignments: ClassTeacherAssignment[] = [];

  // Filter variables
  selectedLanguage: string | null = null;
  selectedTeacher: number | null = null;
  selectedRoom: string | null = null;
  selectedClass: number | null = null;
  
  // Filter options
  languageOptions: { label: string; value: string }[] = [];
  roomOptions: { label: string; value: string }[] = [];
  
  // All events (before filtering)
  allEvents: any[] = [];

  // Filter bar toggle state
  isFilterBarVisible = false;

  statusOptions = [
    { label: 'Đã Lên Lịch', value: 'Đã Lên Lịch' },
    { label: 'Đã Dạy', value: 'Đã Dạy' },
    { label: 'Đã Hủy', value: 'Đã Hủy' },
    { label: 'Dời Lịch', value: 'Dời Lịch' }
  ];

  dayOptions = [
    { label: 'Chủ Nhật', value: 0 },
    { label: 'Thứ 2', value: 1 },
    { label: 'Thứ 3', value: 2 },
    { label: 'Thứ 4', value: 3 },
    { label: 'Thứ 5', value: 4 },
    { label: 'Thứ 6', value: 5 },
    { label: 'Thứ 7', value: 6 }
  ];

  constructor(
    private scheduleService: ScheduleService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private classService: ClassService,
    private teacherService: TeacherService,
    private coursesService: CoursesService,
    private teachingAssignmentService: TeachingAssignmentService,
    private layoutService: LayoutService
  ) {
    // Listen to layout state changes (sidebar toggle) and resize calendar
    effect(() => {
      const layoutState = this.layoutService.layoutState();
      // Trigger resize when sidebar state changes
      setTimeout(() => {
        this.resizeCalendar();
      }, 300); // Wait for CSS transition to complete
    });
  }

  ngOnInit(): void {
    // Initialize form to avoid undefined bindings before any user interaction
    this.formSchedule = this.createEmptySchedule();
    // Initialize calendar to avoid empty config error
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      locale: fullCalendarViLocale,
      firstDay: 1, // Monday first
      events: [],
      headerToolbar: {
        left: 'prev,next today addScheduleButton',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      customButtons: {
        addScheduleButton: {
          text: 'Thêm lịch học',
          hint: 'Thêm lịch học mới',
          click: () => {
            this.onAddNew();
          }
        }
      },
      buttonText: {
        today: 'Hôm nay',
        month: 'Tháng',
        week: 'Tuần',
        day: 'Ngày',
        list: 'Danh sách'
      },
      allDayText: 'Cả ngày',
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      dateClick: this.onDateClick.bind(this),
      eventClick: this.onEventClick.bind(this)
    };

    // Load all data in parallel
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    // Initial resize after view is initialized
    setTimeout(() => {
      this.resizeCalendar();
    }, 100);
  }

  // Resize calendar to fit container
  private resizeCalendar(): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        calendarApi.updateSize();
      }
    }
  }


  private createEmptySchedule(): ScheduleModel {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return {
      id: 0,
      class_id: 0,
      teacher_id: null,
      day_of_week: 1, // Monday
      start_time: '08:00',
      end_time: '10:00',
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      room_name: '',
      status: 'Đã Lên Lịch',
      note: '',
      created_at: '',
      updated_at: '',
      created_by: 0,
      updated_by: 0,
      is_deleted: 0,
      deleted_by: 0
    };
  }

  loadAllData(): void {
    forkJoin({
      classes: this.classService.getClasses(),
      teachers: this.teacherService.getTeachers(),
      courses: this.coursesService.getCourses(),
      schedules: this.scheduleService.getScheduleTemplates()
    }).subscribe({
      next: (data) => {
        // Load classes
        this.classes = data.classes;
        this.classOptions = data.classes.map(c => ({
          label: `${c.class_name} (${c.class_code})`,
          value: c.id!
        }));
        
        // Load teachers
        this.teachers = data.teachers;
        this.teacherOptions = data.teachers.map(t => ({
          label: t.teacher_name,
          value: t.id!
        }));
        
        // Load courses for language mapping
        this.courses = data.courses;
        
        // Load teacher assignments for all classes, then load schedules
        this.loadAllTeacherAssignmentsAndSchedules(data.schedules);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải dữ liệu'
        });
      }
    });
  }

  loadClasses(): void {
    this.classService.getClasses().subscribe({
      next: (classes) => {
        this.classes = classes;
        this.classOptions = classes.map(c => ({
          label: `${c.class_name} (${c.class_code})`,
          value: c.id!
        }));
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách lớp học'
        });
      }
    });
  }

  loadTeachers(): void {
    this.teacherService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers = teachers;
        this.teacherOptions = teachers.map(t => ({
          label: t.teacher_name,
          value: t.id!
        }));
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách giáo viên'
        });
      }
    });
  }

  loadAllTeacherAssignments(): void {
    if (!this.classes || this.classes.length === 0) {
      this.classTeacherAssignments = [];
      return;
    }

    // Load teacher assignments for all classes
    const classIds = this.classes.map(c => c.id!).filter(id => id !== null && id !== undefined);
    
    if (classIds.length === 0) {
      this.classTeacherAssignments = [];
      return;
    }

    // Create observable array for all class teacher assignments
    const assignmentObservables = classIds.map(classId => 
      this.teachingAssignmentService.getClassTeacherAssignments(classId)
    );

    forkJoin(assignmentObservables).subscribe({
      next: (assignmentsArrays) => {
        // Flatten all assignments into single array
        this.classTeacherAssignments = assignmentsArrays.flat();
      },
      error: (error) => {
        console.error('Error loading teacher assignments:', error);
        this.classTeacherAssignments = [];
      }
    });
  }

  loadAllTeacherAssignmentsAndSchedules(schedulesData: ScheduleModel[]): void {
    if (!this.classes || this.classes.length === 0) {
      this.classTeacherAssignments = [];
      this.loadSchedulesData(schedulesData);
      return;
    }

    // Load teacher assignments for all classes
    const classIds = this.classes.map(c => c.id!).filter(id => id !== null && id !== undefined);
    
    if (classIds.length === 0) {
      this.classTeacherAssignments = [];
      this.loadSchedulesData(schedulesData);
      return;
    }

    // Create observable array for all class teacher assignments
    const assignmentObservables = classIds.map(classId => 
      this.teachingAssignmentService.getClassTeacherAssignments(classId)
    );

    forkJoin(assignmentObservables).subscribe({
      next: (assignmentsArrays) => {
        // Flatten all assignments into single array
        this.classTeacherAssignments = assignmentsArrays.flat();
        // Now load schedules data with teacher assignments available
        this.loadSchedulesData(schedulesData);
      },
      error: (error) => {
        console.error('Error loading teacher assignments:', error);
        this.classTeacherAssignments = [];
        // Still load schedules data even if teacher assignments fail
        this.loadSchedulesData(schedulesData);
      }
    });
  }

  loadSchedulesData(schedulesData: ScheduleModel[]): void {
    this.schedules = schedulesData;

    // If no data, show a message
    if (!schedulesData || schedulesData.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Chưa có lịch học nào trong hệ thống'
      });
      return;
    }

    this.allEvents = [];
    
    schedulesData.forEach((s) => {
      // Parse start_date and end_date from database properly (same as class-schedule)
      let startDateStr: string;
      let endDateStr: string;
      
      // Handle start_date
      if (typeof s.start_date === 'string') {
        if (s.start_date.includes('T') && s.start_date.includes('Z')) {
          // UTC date from database - convert to Vietnam timezone
          const utcDate = new Date(s.start_date);
          utcDate.setHours(utcDate.getHours() + 7); // Add 7 hours for Vietnam timezone
          startDateStr = utcDate.toISOString().split('T')[0];
        } else {
          // Regular YYYY-MM-DD format
          startDateStr = s.start_date.includes('T') ? s.start_date.split('T')[0] : s.start_date;
        }
      } else {
        startDateStr = '';
      }
      
      // Handle end_date
      if (typeof s.end_date === 'string') {
        if (s.end_date.includes('T') && s.end_date.includes('Z')) {
          // UTC date from database - convert to Vietnam timezone
          const utcDate = new Date(s.end_date);
          utcDate.setHours(utcDate.getHours() + 7); // Add 7 hours for Vietnam timezone
          endDateStr = utcDate.toISOString().split('T')[0];
        } else {
          // Regular YYYY-MM-DD format
          endDateStr = s.end_date.includes('T') ? s.end_date.split('T')[0] : s.end_date;
        }
      } else {
        endDateStr = '';
      }
      
      // Parse dates manually to avoid timezone issues (same as class-schedule)
      const startParts = startDateStr.split('-');
      const endParts = endDateStr.split('-');
      
      if (startParts.length !== 3 || endParts.length !== 3) {
        return; // Skip invalid dates
      }
      
      const startDate = new Date(
        parseInt(startParts[0]), 
        parseInt(startParts[1]) - 1, 
        parseInt(startParts[2]),
        12, 0, 0 // Use noon to avoid DST issues
      );
      
      const endDate = new Date(
        parseInt(endParts[0]), 
        parseInt(endParts[1]) - 1, 
        parseInt(endParts[2]),
        12, 0, 0 // Use noon to avoid DST issues
      );
      
      // For schedule templates, we need to generate events for each day in the range
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Only create events for the specified day of week
        if (dayOfWeek === s.day_of_week) {
          // Format date to YYYY-MM-DD
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          const startTime = s.start_time.length > 5 ? s.start_time.substring(0, 5) : s.start_time;
          const endTime = s.end_time.length > 5 ? s.end_time.substring(0, 5) : s.end_time;
          
          // Parse time strings
          const startHour = parseInt(startTime.split(':')[0]);
          const startMinute = parseInt(startTime.split(':')[1]);
          const endHour = parseInt(endTime.split(':')[0]);
          const endMinute = parseInt(endTime.split(':')[1]);
          
          // Create Date objects for start and end times (same as class-schedule)
          const startDateTime = new Date(year, date.getMonth(), date.getDate(), startHour, startMinute);
          const endDateTime = new Date(year, date.getMonth(), date.getDate(), endHour, endMinute);
          
          // Get class name from loaded classes (only class name for better UI)
          const classInfo = this.classes.find(c => c.id === s.class_id);
          // (nếu hiện mã lớp )const className = classInfo ? `${classInfo.class_name} (${classInfo.class_code})` : `Lớp ${s.class_id}`;
          const className = classInfo ? classInfo.class_name : `Lớp ${s.class_id}`;
          
          // Get teacher names using helper method
          const { teachingTeacherName, assistantTeacherName } = this.getTeacherNamesForClass(s.class_id, s.teacher_id);
          
          // Get language from course info using course_id
          let language = '';
          if (classInfo) {
            // First try to get language from class (if already joined)
            if (classInfo.language) {
              language = classInfo.language;
            } else {
              // Fallback: find course by course_id
              const courseInfo = this.courses.find(course => course.id === classInfo.course_id);
              language = courseInfo?.language || '';
            }
          }
          
          // Additional fallback: try to extract language from class name
          if (!language && classInfo?.class_name) {
            const className = classInfo.class_name.toLowerCase();
            if (className.includes('anh') || className.includes('english')) {
              language = 'Tiếng Anh';
            } else if (className.includes('trung') || className.includes('chinese')) {
              language = 'Tiếng Trung';
            } else if (className.includes('hàn') || className.includes('korean')) {
              language = 'Tiếng Hàn';
            }
          }
          const eventColor = this.getEventColor(language);
          
          // Create event title with better formatting showing both teachers
          const title = this.createEventTitle(className, s.room_name, teachingTeacherName, assistantTeacherName);
          
          this.allEvents.push({
            id: String(s.id),
            title: title,
            start: startDateTime,
            end: endDateTime,
            backgroundColor: eventColor,
            borderColor: eventColor,
            textColor: '#ffffff',
            extendedProps: {
              room_name: s.room_name,
              status: s.status,
              note: s.note,
              class_id: s.class_id,
              teacher_id: s.teacher_id,
              day_of_week: s.day_of_week,
              start_date: startDateStr,
              end_date: endDateStr,
              class_name: classInfo?.class_name || '',
              teacher_name: teachingTeacherName || assistantTeacherName || '',
              teaching_teacher_name: teachingTeacherName,
              assistant_teacher_name: assistantTeacherName,
              language: language,
              course_id: classInfo?.course_id || 0,
              course_name: classInfo?.course_name || this.courses.find(course => course.id === classInfo?.course_id)?.course_name || '',
              created_at: s.created_at,
              updated_at: s.updated_at,
              created_by: s.created_by,
              updated_by: s.updated_by,
              is_deleted: s.is_deleted,
              deleted_by: s.deleted_by
            }
          });
        }
      }
    });
    
    // Initialize filter options after loading schedules
    this.initializeFilterOptions();
    
    // Apply filters to events
    this.applyFilters();

    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.getFilteredEvents(),
      eventDisplay: 'block',
      eventColor: '',
      eventDidMount: (info) => {
        const color = info.event.backgroundColor;
        
        if (color) {
          // Apply full background color to event element with !important
          info.el.style.setProperty('background-color', color, 'important');
          info.el.style.setProperty('border-color', color, 'important');
          info.el.style.setProperty('color', '#ffffff', 'important');
          info.el.style.setProperty('border-radius', '6px', 'important');
          info.el.style.setProperty('padding', '6px 8px', 'important');
          info.el.style.setProperty('font-size', '0.8rem', 'important');
          info.el.style.setProperty('min-height', '28px', 'important');
          info.el.style.setProperty('overflow', 'visible', 'important');
          info.el.style.setProperty('white-space', 'normal', 'important');
          info.el.style.setProperty('word-wrap', 'break-word', 'important');
          info.el.style.setProperty('display', 'block', 'important');
          info.el.style.setProperty('width', '100%', 'important');
          info.el.style.setProperty('box-sizing', 'border-box', 'important');
          
          // Apply styling to all child elements
          const childElements = info.el.querySelectorAll('*');
          childElements.forEach((child) => {
            const htmlChild = child as HTMLElement;
            htmlChild.style.setProperty('background-color', 'transparent', 'important');
            htmlChild.style.setProperty('color', '#ffffff', 'important');
            htmlChild.style.setProperty('font-size', '0.8rem', 'important');
            htmlChild.style.setProperty('font-weight', '500', 'important');
            htmlChild.style.setProperty('overflow', 'visible', 'important');
            htmlChild.style.setProperty('white-space', 'normal', 'important');
            htmlChild.style.setProperty('word-wrap', 'break-word', 'important');
            htmlChild.style.setProperty('text-overflow', 'initial', 'important');
          });
          
          // Ensure event title is visible
          const titleElement = info.el.querySelector('.fc-event-title') as HTMLElement;
          if (titleElement) {
            titleElement.style.setProperty('color', '#ffffff', 'important');
            titleElement.style.setProperty('background-color', 'transparent', 'important');
            titleElement.style.setProperty('font-size', '0.8rem', 'important');
            titleElement.style.setProperty('font-weight', '500', 'important');
            titleElement.style.setProperty('padding', '0', 'important');
            titleElement.style.setProperty('margin', '0', 'important');
            titleElement.style.setProperty('line-height', '1.2', 'important');
            titleElement.style.setProperty('overflow', 'visible', 'important');
            titleElement.style.setProperty('white-space', 'normal', 'important');
            titleElement.style.setProperty('word-wrap', 'break-word', 'important');
            titleElement.style.setProperty('text-overflow', 'initial', 'important');
          }
          
        }
      }
    };
  }

  loadSchedules(): void {
    this.scheduleService.getScheduleTemplates().subscribe({
      next: (data) => {
        this.loadAllTeacherAssignmentsAndSchedules(data);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách lịch học'
        });
      }
    });
  }

  onDateClick(arg: any): void {
    this.selectedEvent = null;
    const clickedDate = new Date(arg.dateStr);
    const dayOfWeek = clickedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    this.formSchedule = this.createEmptySchedule();
    this.formSchedule.day_of_week = dayOfWeek;
    this.displayDialog = true;
  }

  // Simple method to get color based on language
  getEventColor(language: string): string {
    switch (language) {
      case 'Tiếng Anh':
        return '#3B82F6'; // xanh dương
      case 'Tiếng Trung':
        return '#F97316'; // cam
      case 'Tiếng Hàn':
        return '#8B5CF6'; // tím
      default:
        return '#22C55E'; // xanh lá mặc định
    }
  }

  onEventClick(arg: EventClickArg): void {
    const ev = arg.event;
    this.selectedEvent = ev;

    // Get schedule data from event
    const scheduleData = ev.extendedProps;
    
    // Use the start_date and end_date from extendedProps (already properly formatted)
    this.formSchedule = {
      id: Number(ev.id),
      class_id: scheduleData['class_id'] || 0,
      teacher_id: scheduleData['teacher_id'] || null,
      day_of_week: scheduleData['day_of_week'] || 1,
      start_time: ev.startStr.slice(11, 16),
      end_time: ev.endStr?.slice(11, 16) || '',
      start_date: scheduleData['start_date'] || '',
      end_date: scheduleData['end_date'] || '',
      room_name: scheduleData['room_name'] || '',
      status: scheduleData['status'] || 'Đã Lên Lịch',
      note: scheduleData['note'] || '',
      created_at: scheduleData['created_at'] || '',
      updated_at: scheduleData['updated_at'] || '',
      created_by: scheduleData['created_by'] || 0,
      updated_by: scheduleData['updated_by'] || 0,
      is_deleted: scheduleData['is_deleted'] || 0,
      deleted_by: scheduleData['deleted_by'] || 0
    };

    // Sync form schedule times to time picker
    this.syncTimesToDatePicker();

    this.displayDialog = true;
  }

  onSave(): void {
    // Sync time picker values to form schedule
    if (this.startTimeDate) {
      const hours = this.startTimeDate.getHours().toString().padStart(2, '0');
      const minutes = this.startTimeDate.getMinutes().toString().padStart(2, '0');
      this.formSchedule.start_time = `${hours}:${minutes}`;
    }
    
    if (this.endTimeDate) {
      const hours = this.endTimeDate.getHours().toString().padStart(2, '0');
      const minutes = this.endTimeDate.getMinutes().toString().padStart(2, '0');
      this.formSchedule.end_time = `${hours}:${minutes}`;
    }

    const f = this.formSchedule;
    if (!f.class_id || f.class_id === 0 || !f.day_of_week || !f.start_time || !f.end_time || !f.start_date || !f.end_date) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng chọn lớp học, thứ trong tuần và nhập đầy đủ thông tin lịch học'
      });
      return;
    }

    const start = new Date(`${f.start_date}T${f.start_time}`);
    const end = new Date(`${f.start_date}T${f.end_time}`);
    if (end < start) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi thời gian',
        detail: 'Giờ kết thúc không được nhỏ hơn giờ bắt đầu'
      });
      return;
    }

    const startDate = new Date(f.start_date);
    const endDate = new Date(f.end_date);
    if (endDate < startDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi ngày tháng',
        detail: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu'
      });
      return;
    }

    this.saving = true;
    const done = () => (this.saving = false);

    // Clean payload - chỉ gửi các field cần thiết cho database
    const payload = {
      class_id: f.class_id,
      teacher_id: f.teacher_id,
      day_of_week: f.day_of_week,
      start_time: f.start_time,
      end_time: f.end_time,
      start_date: f.start_date,
      end_date: f.end_date,
      room_name: f.room_name || null,
      status: f.status,
      note: f.note || null
    };

    if (f.id && f.id > 0) {
      this.scheduleService.updateSchedule(f.id, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật buổi học thành công'
          });
          this.loadSchedules();
          this.displayDialog = false;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật buổi học'
          });
        },
        complete: done
      });
    } else {
      this.scheduleService.addSchedule(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm buổi học thành công'
          });
          this.loadSchedules();
          this.displayDialog = false;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể thêm buổi học'
          });
        },
        complete: done
      });
    }
  }

  onDelete(): void {
    if (!this.formSchedule?.id) return;

    this.confirmationService.confirm({
      message: 'Bạn có chắc muốn xóa buổi học này?',
      header: 'Xác nhận',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.scheduleService.deleteSchedule(this.formSchedule.id!).subscribe(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã xóa buổi học'
          });
          this.loadSchedules();
          this.displayDialog = false;
        });
      }
    });
  }

  // Sync time values from form schedule to date picker
  private syncTimesToDatePicker(): void {
    if (this.formSchedule.start_time) {
      const [hours, minutes] = this.formSchedule.start_time.split(':');
      this.startTimeDate = new Date();
      this.startTimeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      this.startTimeDate = null;
    }

    if (this.formSchedule.end_time) {
      const [hours, minutes] = this.formSchedule.end_time.split(':');
      this.endTimeDate = new Date();
      this.endTimeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      this.endTimeDate = null;
    }
  }

  onCancel(): void {
    this.displayDialog = false;
    this.formSchedule = this.createEmptySchedule();
    this.startTimeDate = null;
    this.endTimeDate = null;
  }

  onAddNew(): void {
    this.selectedEvent = null;
    this.formSchedule = this.createEmptySchedule();
    this.startTimeDate = null;
    this.endTimeDate = null;
    this.displayDialog = true;
  }

  // Helper method to parse date string to local timezone (same as class-schedule)
  private parseDateStringToLocal(dateStr: string): Date {
    // Handle different date formats
    const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    
    // Parse date manually to avoid timezone issues
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      // Create date in local timezone to avoid UTC conversion issues
      return new Date(year, month, day, 12, 0, 0); // Use noon to avoid DST issues
    } else {
      return new Date(cleanDateStr);
    }
  }

  // Initialize filter options
  private initializeFilterOptions(): void {
    // Initialize language options from courses
    const languages = new Set<string>();
    this.courses.forEach(course => {
      if (course.language) {
        languages.add(course.language);
      }
    });
    
    this.languageOptions = Array.from(languages).map(lang => ({
      label: lang,
      value: lang
    }));

    // Initialize room options from schedules
    const rooms = new Set<string>();
    this.schedules.forEach(schedule => {
      if (schedule.room_name && schedule.room_name.trim()) {
        rooms.add(schedule.room_name.trim());
      }
    });
    
    this.roomOptions = Array.from(rooms).map(room => ({
      label: room,
      value: room
    }));
  }

  // Get filtered events based on current filter selections
  private getFilteredEvents(): any[] {
    if (!this.allEvents || this.allEvents.length === 0) {
      return [];
    }

    return this.allEvents.filter(event => {
      const extendedProps = event.extendedProps;
      
      // Filter by language
      if (this.selectedLanguage && extendedProps.language !== this.selectedLanguage) {
        return false;
      }
      
      // Filter by teacher
      if (this.selectedTeacher && extendedProps.teacher_id !== this.selectedTeacher) {
        return false;
      }
      
      // Filter by room
      if (this.selectedRoom && extendedProps.room_name !== this.selectedRoom) {
        return false;
      }
      
      // Filter by class
      if (this.selectedClass && extendedProps.class_id !== this.selectedClass) {
        return false;
      }
      
      return true;
    });
  }

  // Apply filters and update calendar
  private applyFilters(): void {
    const filteredEvents = this.getFilteredEvents();
    
    this.calendarOptions = {
      ...this.calendarOptions,
      events: filteredEvents
    };
  }

  // Filter change handlers
  onLanguageFilterChange(): void {
    this.applyFilters();
  }

  onTeacherFilterChange(): void {
    this.applyFilters();
  }

  onRoomFilterChange(): void {
    this.applyFilters();
  }

  onClassFilterChange(): void {
    this.applyFilters();
  }

  // Reset all filters
  resetFilters(): void {
    this.selectedLanguage = null;
    this.selectedTeacher = null;
    this.selectedRoom = null;
    this.selectedClass = null;
    this.applyFilters();
  }

  // Check if any filter is active
  hasActiveFilters(): boolean {
    return !!(this.selectedLanguage || this.selectedTeacher || this.selectedRoom || this.selectedClass);
  }

  // Toggle filter bar visibility
  toggleFilterBar(): void {
    this.isFilterBarVisible = !this.isFilterBarVisible;
  }

  // Helper method to get teacher names for a class
  private getTeacherNamesForClass(classId: number, fallbackTeacherId?: number | null): { teachingTeacherName: string; assistantTeacherName: string } {
    const classAssignments = this.classTeacherAssignments.filter(assignment => 
      assignment.class_id === classId
    );

    // Get teaching teacher and assistant teacher
    const teachingAssignment = classAssignments.find(a => a.role === 'Giáo viên giảng dạy');
    const assistantAssignment = classAssignments.find(a => a.role === 'Trợ giảng');

    let teachingTeacherName = '';
    let assistantTeacherName = '';

    if (teachingAssignment) {
      const teacher = this.teachers.find(t => t.id === teachingAssignment.teacher_id);
      teachingTeacherName = teacher?.teacher_name || teachingAssignment.teacher_name || '';
    }

    if (assistantAssignment) {
      const teacher = this.teachers.find(t => t.id === assistantAssignment.teacher_id);
      assistantTeacherName = teacher?.teacher_name || assistantAssignment.teacher_name || '';
    }

    // Fallback to schedule's teacher_id if no assignments found
    if (!teachingTeacherName && fallbackTeacherId) {
      const teacherInfo = this.teachers.find(t => t.id === fallbackTeacherId);
      teachingTeacherName = teacherInfo ? teacherInfo.teacher_name : '';
    }

    return { teachingTeacherName, assistantTeacherName };
  }

  // Helper method to create event title
  private createEventTitle(className: string, roomName?: string | null, teachingTeacherName?: string, assistantTeacherName?: string): string {
    let title = className;
    
    if (roomName) {
      title += ` | ${roomName}`;
    }
    
    // Add teacher names (both teaching and assistant if available)
    if (teachingTeacherName && assistantTeacherName) {
      title += ` | ${teachingTeacherName} + ${assistantTeacherName}`;
    } else if (teachingTeacherName) {
      title += ` | ${teachingTeacherName}`;
    } else if (assistantTeacherName) {
      title += ` | ${assistantTeacherName}`;
    }
    
    return title;
  }
}
