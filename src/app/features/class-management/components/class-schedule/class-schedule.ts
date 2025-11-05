import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { ScheduleService } from '../../../schedule/services/schedule.service';
import { ClassScheduleModel } from '../../../schedule/models/class-schedule.model'; 
import { TeacherService } from '../../../teacher-management/services/teacher.service';
import { TeacherModel } from '../../../teacher-management/models/teacher.model';
import { TeachingAssignmentService } from '../../../teaching-assignments/services/teaching-assignment.service';
import { ClassTeacherAssignment } from '../../../teaching-assignments/models/teaching-assignment.model';
import { ClassService } from '../../services/class.service';

@Component({
  selector: 'app-class-schedule',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    FullCalendarModule, 
    DrawerModule, 
    InputTextModule, 
    ButtonModule, 
    SelectModule, 
    TextareaModule, 
    ToastModule,
    TableModule,
    TagModule,
    TooltipModule,
    DatePickerModule
  ],
  templateUrl: './class-schedule.html',
  styleUrls: ['./class-schedule.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ClassSchedule implements OnInit, OnChanges {
  @Input() classId!: number;
  @Input() className: string = '';
  @ViewChild('dt') dt: any;

  // Route-based properties
  routeClassId: number | null = null;
  routeClassName: string = '';

  // Calendar configurations
  calendarOptions!: CalendarOptions;
  weeklyCalendarOptions!: CalendarOptions;
  monthlyCalendarOptions!: CalendarOptions;
  
  // Dialog and form
  displayDrawer = false;
  saving = false;
  formSchedule!: ClassScheduleModel;
  startTimeDate: Date | null = null;
  endTimeDate: Date | null = null;

  // Data
  schedules: ClassScheduleModel[] = [];
  filteredSchedules: ClassScheduleModel[] = [];
  selectedEvent: any = null;
  selectedDate: Date = new Date();

  // Search and Filter
  searchQuery: string = '';
  selectedStatus: string | null = null;
  selectedRoom: string | null = null;
  roomOptions: string[] = [];

  // Calendar navigation
  currentWeekStart: Date = this.getMondayOfCurrentWeek();
  currentMonthStart: Date = new Date();
  maxDate: Date = new Date();
  calendarKey: number = 0; // Key to force FullCalendar re-render
  minDate: Date = new Date();
  
  // Track if showing all schedules (default state)
  isShowingAll: boolean = true;

  // Teachers
  teachers: TeacherModel[] = [];
  teacherOptions: { label: string; value: number }[] = [];
  classTeacherAssignments: ClassTeacherAssignment[] = [];

  // Tab management
  activeTab: 'hybrid' | 'weekly' | 'monthly' = 'hybrid';
  
  switchTab(tab: 'hybrid' | 'weekly' | 'monthly'): void {
    this.activeTab = tab;
    
    // Reset weekly calendar to current week when switching to weekly tab
    if (tab === 'weekly') {
      this.currentWeekStart = this.getMondayOfCurrentWeek();
      this.updateWeeklyCalendar();
    }
  }
  statusOptions = [
    { label: 'Đã Lên Lịch', value: 'Đã Lên Lịch' },
    { label: 'Đã Dạy', value: 'Đã Dạy' },
    { label: 'Đã Hủy', value: 'Đã Hủy' },
    { label: 'Dời Lịch', value: 'Dời Lịch' }
  ];

  constructor(
    private scheduleService: ScheduleService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private teacherService: TeacherService,
    private teachingAssignmentService: TeachingAssignmentService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private classService: ClassService
  ) {}

  ngOnInit(): void {
    this.formSchedule = this.createEmptySchedule(new Date().toISOString().slice(0, 10));
    this.initializeCalendar();
    this.initializeWeeklyCalendar();
    this.initializeMonthlyCalendar();
    this.initializeCalendarDates();
    
    // Check if classId is provided via @Input (used as child component)
    if (this.classId) {
      this.loadAllClassSchedules();
      return;
    }

    // If not provided via @Input, try to get from route params (used as route component)
    this.route.params.subscribe(params => {
      this.routeClassId = +params['id'];
      if (this.routeClassId) {
        this.loadAllClassSchedules();
        this.loadClassName();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset data when classId changes
    if (changes['classId'] && !changes['classId'].firstChange) {
      this.resetData();
      this.loadAllClassSchedules();
    }
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
        console.error('Error loading class name:', error);
        this.className = `Lớp ${this.routeClassId}`;
      }
    });
  }

  private resetData(): void {
    // Clear all data
    this.schedules = [];
    this.filteredSchedules = [];
    this.selectedEvent = null;
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedRoom = null;
    this.roomOptions = [];
    this.classTeacherAssignments = [];
    
    // Don't reset selectedDate - keep it for consistency
    
    // Reset calendar events
    this.updateCalendarEvents([]);
    
    // Reset weekly calendar
    this.goToCurrentWeek();
  }

  private initializeCalendar(): void {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      events: [],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      dateClick: this.onDateClick.bind(this),
      eventClick: this.onEventClick.bind(this),
      height: 'auto',
      aspectRatio: 1.8,
      locale: 'vi', // Vietnamese locale
      firstDay: 1, // Monday first (JavaScript format: 0=Sunday, 1=Monday, ..., 6=Saturday)
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      allDaySlot: false,
      nowIndicator: true,
      editable: false,
      selectable: true
    };
  }

  private initializeWeeklyCalendar(): void {
    this.weeklyCalendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      events: [],
      headerToolbar: false, // We'll use custom controls
      dateClick: this.onDateClick.bind(this),
      eventClick: this.onEventClick.bind(this),
      height: 'auto',
      aspectRatio: 1.8,
      locale: 'vi',
      firstDay: 1, // Monday first (JavaScript format: 0=Sunday, 1=Monday, ..., 6=Saturday)
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      allDaySlot: false,
      nowIndicator: true,
      editable: false,
      selectable: true
    };
  }

  private initializeMonthlyCalendar(): void {
    this.monthlyCalendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      events: [],
      headerToolbar: false, // We'll use custom controls
      dateClick: this.onDateClick.bind(this),
      eventClick: this.onEventClick.bind(this),
      height: 'auto',
      aspectRatio: 1.35,
      locale: 'vi',
      firstDay: 1, // Monday first (JavaScript format: 0=Sunday, 1=Monday, ..., 6=Saturday)
      nowIndicator: true,
      editable: false,
      selectable: true,
      dayMaxEvents: 3, // Limit events per day for better readability
      moreLinkClick: 'popover' // Show popover for more events
    };
  }

  private initializeCalendarDates(): void {
    const today = new Date();
    // Don't set selectedDate automatically - let user choose or show all schedules
    // this.selectedDate = new Date(today);
    
    // Set min/max dates (1 year range)
    this.minDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    this.maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    
    // Initialize current week
    this.goToCurrentWeek();
  }

  private createEmptySchedule(dateStr: string): ClassScheduleModel {
    return {
      id: 0,
      class_id: this.classId,
      schedule_id: null,
      date: dateStr,
      day_of_week: this.parseDateStringToLocal(dateStr).getDay(), // Use JS format directly (0=Sunday, 6=Saturday)
      start_time: '08:00',
      end_time: '10:00',
      teacher_id: null,
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

  loadTeachers(): void {
    this.teacherService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers = teachers;
        this.teacherOptions = teachers.map(t => ({
          label: t.teacher_name,
          value: t.id!
        }));
      },
      error: (error: any) => {
        console.error('Error loading teachers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách giáo viên'
        });
      }
    });
  }

  loadClassTeacherAssignments(): void {
    if (!this.classId) {
      this.classTeacherAssignments = [];
      return;
    }

    this.teachingAssignmentService.getClassTeacherAssignments(this.classId).subscribe({
      next: (assignments: ClassTeacherAssignment[]) => {
        this.classTeacherAssignments = assignments || [];
      },
      error: (error: any) => {
        console.error('Error loading class teacher assignments:', error);
        this.classTeacherAssignments = [];
      }
    });
  }

  private updateCalendarEvents(schedules: ClassScheduleModel[]): void {
    if (!schedules || schedules.length === 0) {
      // No schedules - clear all calendars
      this.calendarOptions = {
        ...this.calendarOptions,
        events: []
      };
      
      this.weeklyCalendarOptions = {
        ...this.weeklyCalendarOptions,
        events: []
      };
      
      this.monthlyCalendarOptions = {
        ...this.monthlyCalendarOptions,
        events: []
      };
      return;
    }

    // Additional validation: ensure all schedules belong to current classId
    const validSchedules = schedules.filter(s => s.class_id === this.classId);

    if (validSchedules.length === 0) {
      this.calendarOptions = {
        ...this.calendarOptions,
        events: []
      };
      
      this.weeklyCalendarOptions = {
        ...this.weeklyCalendarOptions,
        events: []
      };
      
      this.monthlyCalendarOptions = {
        ...this.monthlyCalendarOptions,
        events: []
      };
      return;
    }

    // Filter out schedules where day_of_week doesn't match the actual day
    const correctedSchedules = validSchedules.filter((s) => {
      if (typeof s.date === 'string' && s.date.includes('T') && s.date.includes('Z')) {
        const utcDate = new Date(s.date);
        utcDate.setHours(utcDate.getHours() + 7); // Add 7 hours for Vietnam timezone
        const dateStr = utcDate.toISOString().split('T')[0];
        const parts = dateStr.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const testDate = new Date(year, month, day);
        const actualDayOfWeek = testDate.getDay();
        
        // Only include schedules where day_of_week matches actual day
        return actualDayOfWeek === s.day_of_week;
      }
      return true; // Include non-UTC dates
    });

    const events = correctedSchedules.map((s) => {
      // Format date and time properly - handle UTC conversion correctly
      let dateStr: string;
      if (typeof s.date === 'string') {
        if (s.date.includes('T') && s.date.includes('Z')) {
          // This is a UTC date from database (like 2025-10-02T17:00:00.000Z)
          // Simple approach: Add 7 hours to get Vietnam time, then extract date
          const utcDate = new Date(s.date);
          utcDate.setHours(utcDate.getHours() + 7); // Add 7 hours for Vietnam timezone
          dateStr = utcDate.toISOString().split('T')[0];
          
        } else {
          // Regular date string (YYYY-MM-DD)
          dateStr = s.date.includes('T') ? s.date.split('T')[0] : s.date;
        }
      } else if (s.date && typeof s.date === 'object' && 'toISOString' in s.date) {
        dateStr = (s.date as Date).toISOString().split('T')[0];
      } else {
        dateStr = '';
      }
      
      
      // Ensure time format is HH:MM
      const startTime = s.start_time && s.start_time.length >= 5 ? s.start_time.substring(0, 5) : '08:00';
      const endTime = s.end_time && s.end_time.length >= 5 ? s.end_time.substring(0, 5) : '10:00';
      
      // Validate date string
      if (!dateStr || dateStr.length !== 10) {
        return null;
      }
      
      // Parse date to local Date object to avoid timezone issues
      const parts = dateStr.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      
      // Create local date objects for start and end times
      const startDate = new Date(year, month, day, parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));
      const endDate = new Date(year, month, day, parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));
      return {
        id: String(s.id),
        title: ` - ${endTime} | ${s.teacher_name || 'Chưa phân giáo viên'} | ${s.room_name || 'Chưa có phòng'}`,
        start: startDate,
        end: endDate,
        extendedProps: {
          room_name: s.room_name,
          status: s.status,
          note: s.note,
          class_id: s.class_id,
          teacher_id: s.teacher_id,
          teacher_name: s.teacher_name
        }
      };
    }).filter(event => event !== null); // Remove null events
  
    // Force refresh all calendars by creating completely new options objects
    setTimeout(() => {
      this.calendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        events: events,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        dateClick: this.onDateClick.bind(this),
        eventClick: this.onEventClick.bind(this),
        height: 'auto',
        aspectRatio: 1.8,
        locale: 'vi',
        firstDay: 1,
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        allDaySlot: false,
        nowIndicator: true,
        editable: false,
        selectable: true
      };
      
      this.weeklyCalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        events: events,
        headerToolbar: false,
        dateClick: this.onDateClick.bind(this),
        eventClick: this.onEventClick.bind(this),
        height: 'auto',
        aspectRatio: 1.8,
        locale: 'vi',
        firstDay: 1,
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        allDaySlot: false,
        nowIndicator: true,
        editable: false,
        selectable: true,
        initialDate: this.currentWeekStart
      };
      
      this.monthlyCalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        events: events,
        headerToolbar: false,
        dateClick: this.onDateClick.bind(this),
        eventClick: this.onEventClick.bind(this),
        height: 'auto',
        aspectRatio: 1.35,
        locale: 'vi',
        firstDay: 1,
        nowIndicator: true,
        editable: false,
        selectable: true,
        dayMaxEvents: 3,
        moreLinkClick: 'popover'
      };
    }, 100);
    
  }

  // Load ALL class schedules (including deleted ones)
  loadAllClassSchedules(): void {
    const classId = this.effectiveClassId;
    if (!classId) {
      this.resetData();
      return;
    }

    const currentClassId = classId;

    // Load schedules, teacher assignments, and teachers in parallel
    forkJoin([
      this.scheduleService.getAllClassSchedulesByClass(classId),
      this.teachingAssignmentService.getClassTeacherAssignments(classId),
      this.teacherService.getTeachers()
    ]).subscribe({
      next: ([scheduleData, teacherAssignments, teachers]) => {
        if (this.effectiveClassId !== currentClassId) {
          return;
        }
        
        // Update teacher assignments and teachers
        this.classTeacherAssignments = teacherAssignments || [];
        this.teachers = teachers || [];
        this.teacherOptions = this.teachers.map(t => ({
          label: t.teacher_name,
          value: t.id!
        }));
        
        // Validate and filter data
        if (!scheduleData || !Array.isArray(scheduleData)) {
          this.filteredSchedules = [];
          this.roomOptions = [];
          this.updateCalendarEvents([]);
          return;
        }

        // Filter out invalid schedules and ensure they belong to current classId
        const validSchedules = scheduleData.filter(schedule => {
          if (!schedule || !schedule.id || !schedule.class_id) {
            return false;
          }

          if (schedule.class_id !== currentClassId) {
            return false;
          }

          if (!schedule.date) {
            return false;
          }

          return true;
        });

        // Remove duplicates based on id
        const uniqueSchedules = validSchedules.filter((schedule, index, self) => 
          index === self.findIndex(s => s.id === schedule.id)
        );

        // Update schedules array
        this.schedules = uniqueSchedules;

        // Update room options
        this.roomOptions = [...new Set(uniqueSchedules.map(s => s.room_name).filter((room): room is string => room != null && room.trim() !== ''))];

        // Join teacher data (now with both schedules and teacher assignments loaded)
        this.joinTeacherData(uniqueSchedules);
        
        // Set default state to show all schedules
        this.isShowingAll = true;
        
        // Apply current filters to get filtered schedules
        this.applyFilters();
        
        // Update calendar events with valid schedules (after joining teacher data)
        this.updateCalendarEvents(uniqueSchedules);
        
        // Update weekly and monthly calendars with new data
        this.updateWeeklyCalendar();
        this.updateMonthlyCalendar();
      },
      error: (error) => {
        console.error('Error loading schedules, teacher assignments, or teachers:', error);
        this.classTeacherAssignments = [];
        this.teachers = [];
        this.teacherOptions = [];
        this.resetData();
      }
    });
  }

  loadClassSchedules(): void {
    if (!this.classId) {
      this.resetData();
      return;
    }

    // Store current classId to prevent race conditions
    const currentClassId = this.classId;

    this.scheduleService.getClassSchedulesByClass(this.classId).subscribe({
      next: (data: ClassScheduleModel[]) => {
        // Check if classId has changed during API call
        if (this.classId !== currentClassId) {
          return;
        }
        
        // Validate and filter data
        if (!data || !Array.isArray(data)) {
          this.schedules = [];
          this.filteredSchedules = [];
          this.roomOptions = [];
          this.updateCalendarEvents([]);
          return;
        }

        if (data.length === 0) {
          this.schedules = [];
          this.filteredSchedules = [];
          this.roomOptions = [];
          this.updateCalendarEvents([]);
          return;
        }

        // Filter out invalid schedules and ensure they belong to current classId
        const validSchedules = data.filter(schedule => {
          // Check if schedule has valid data
          if (!schedule || !schedule.id || !schedule.class_id) {
            return false;
          }

          // CRITICAL: Ensure schedule belongs to current classId
          if (schedule.class_id !== currentClassId) {
            return false;
          }

          // Check if date is valid
          if (!schedule.date) {
            return false;
          }

          // Check if times are valid
          if (!schedule.start_time || !schedule.end_time) {
            return false;
          }

          return true;
        });

        // Remove duplicates based on unique combination of fields
        const uniqueSchedules = this.removeDuplicateSchedules(validSchedules);
        
        this.schedules = uniqueSchedules;
        
        // Extract unique room options for filter
        this.roomOptions = [...new Set(uniqueSchedules.map(s => s.room_name).filter((room): room is string => room != null && room.trim() !== ''))];

        // Join teacher data
        this.joinTeacherData(uniqueSchedules);
        
        // Set default state to show all schedules
        this.isShowingAll = true;
        
        // Apply current filters to get filtered schedules
        this.applyFilters();
        
        // Update calendar events with valid schedules (after joining teacher data)
        this.updateCalendarEvents(uniqueSchedules);
        
        // Update weekly and monthly calendars with new data
        this.updateWeeklyCalendar();
        this.updateMonthlyCalendar();
      },
      error: (error: any) => {
        // Check if classId has changed during API call
        if (this.classId !== currentClassId) {
          return;
        }
        
        // Reset data on error
        this.resetData();
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải lịch học của lớp'
        });
      }
    });
  }

  onDateClick(arg: any): void {
    this.selectedEvent = null;
    // Convert date to YYYY-MM-DD format for HTML input
    const dateStr = arg.dateStr.split('T')[0];
    this.formSchedule = this.createEmptySchedule(dateStr);
    // Initialize time pickers with default values
    this.initializeTimePickers();
    this.displayDrawer = true;
  }

  onEventClick(arg: EventClickArg): void {
    const ev = arg.event;
    this.selectedEvent = ev;

    // Ensure date is in YYYY-MM-DD format
    const dateStr = ev.startStr.split('T')[0];

    this.formSchedule = {
      id: Number(ev.id),
      class_id: this.classId,
      schedule_id: null,
      date: dateStr,
      day_of_week: this.parseDateStringToLocal(dateStr).getDay(),
      teacher_id: ev.extendedProps['teacher_id'] || null,
      start_time: ev.startStr.slice(11, 16),
      end_time: ev.endStr?.slice(11, 16) || '',
      room_name: ev.extendedProps['room_name'] || '',
      status: ev.extendedProps['status'] || 'Đã Lên Lịch',
      note: ev.extendedProps['note'] || '',
      created_at: '',
      updated_at: '',
      created_by: 0,
      updated_by: 0,
      is_deleted: 0,
      deleted_by: 0
    };

    // Initialize time pickers with correct values
    this.initializeTimePickers();
    this.displayDrawer = true;
  }

  onSave(): void {
    // Convert time picker values back to time strings
    if (this.startTimeDate) {
      this.formSchedule.start_time = this.dateToTimeString(this.startTimeDate);
    }
    if (this.endTimeDate) {
      this.formSchedule.end_time = this.dateToTimeString(this.endTimeDate);
    }

    const f = this.formSchedule;
    if (!this.classId || this.classId === 0 || !f.date || !f.start_time || !f.end_time) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập đầy đủ thông tin buổi học'
      });
      return;
    }

    // Ensure date is in string format for date constructor
    const dateStr = this.formatDateForServer(f.date);
    const start = new Date(`${dateStr}T${f.start_time}`);
    const end = new Date(`${dateStr}T${f.end_time}`);
    if (end < start) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi thời gian',
        detail: 'Giờ kết thúc không được nhỏ hơn giờ bắt đầu'
      });
      return;
    }

    this.saving = true;
    const done = () => (this.saving = false);

    // Clean payload - chỉ gửi các field cần thiết cho database
    const payload = {
      class_id: this.classId,
      schedule_id: f.schedule_id,
      date: this.formatDateForServer(f.date), // Fix timezone issue
      day_of_week: this.jsDayToBackend(this.parseDateStringToLocal(f.date).getDay()),
      teacher_id: f.teacher_id,
      start_time: f.start_time,
      end_time: f.end_time,
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
          this.loadAllClassSchedules();
          this.displayDrawer = false;
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
          this.loadAllClassSchedules();
          this.displayDrawer = false;
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

  onDeleteFromDialog(): void {
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
        this.scheduleService.deleteSchedule(this.formSchedule.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã xóa buổi học'
            });
            this.loadAllClassSchedules();
            this.displayDrawer = false;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể xóa buổi học'
            });
          }
        });
      }
    });
  }

  onCancel(): void {
    this.displayDrawer = false;
    this.formSchedule = this.createEmptySchedule(new Date().toISOString().slice(0, 10));
  }

  private initializeTimePickers(): void {
    // Convert time strings to Date objects for time pickers
    this.startTimeDate = this.formSchedule.start_time ? this.timeStringToDate(this.formSchedule.start_time) : null;
    this.endTimeDate = this.formSchedule.end_time ? this.timeStringToDate(this.formSchedule.end_time) : null;
  }

  private timeStringToDate(timeStr: string): Date {
    const today = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);
    return today;
  }

  private dateToTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:MM format
  }

  // ===== HYBRID VIEW METHODS =====

  // Mini Calendar Methods
  onDateSelect(date: Date): void {
    this.selectedDate = new Date(date);
    this.isShowingAll = false; // User is filtering by date
    this.applyFilters(); // Use unified filter logic
  }

  goToToday(): void {
    const today = new Date();
    this.selectedDate = new Date(today);
    this.isShowingAll = false; // User is filtering by today's date
    this.applyFilters(); // Use unified filter logic
  }

  showAllSchedules(): void {
    this.isShowingAll = true; // Set state to "show all"
    this.applyFilters(); // Use unified filter logic
    // Don't reset selectedDate - keep it for date picker display
  }

  // Enhanced search and filter methods
  onSearch(event: any): void {
    this.searchQuery = event.target.value;
    this.applyFilters();
  }

  onStatusFilterChange(status: string | null): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onRoomFilterChange(room: string | null): void {
    this.selectedRoom = room;
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedRoom = null;
    this.isShowingAll = true; // Show all schedules
    this.applyFilters(); // Apply the cleared filters
  }

  clearDateFilter(): void {
    this.selectedDate = new Date(); // Reset to today but don't filter
    this.isShowingAll = true; // Set state to "show all"
    this.applyFilters(); // Apply the cleared date filter
  }

  private joinTeacherData(schedules: ClassScheduleModel[]): void {
    // Join teacher data with schedules from class_teachers table
    schedules.forEach(schedule => {
      // First try to get teacher from schedule's teacher_id
      if (schedule.teacher_id) {
        const teacher = this.teachers.find(t => t.id === schedule.teacher_id);
        if (teacher) {
          schedule.teacher_name = teacher.teacher_name;
          return;
        }
      }

      // If no teacher_id in schedule or teacher not found, 
      // get teacher from class_teachers assignments (like in class-detail)
      // Priority: Giáo viên giảng dạy > Giáo viên chủ nhiệm > Trợ giảng
      const classAssignments = this.classTeacherAssignments.filter(assignment => {
        // Lấy tất cả assignments của class này, không filter theo status
        // vì có thể có status khác nhau hoặc null
        return assignment.class_id === schedule.class_id;
      });

      let selectedAssignment = classAssignments.find(a => a.role === 'Giáo viên giảng dạy') ||
                              classAssignments.find(a => a.role === 'Giáo viên chủ nhiệm') ||
                              classAssignments.find(a => a.role === 'Trợ giảng') ||
                              classAssignments[0]; // fallback to first assignment

      if (selectedAssignment) {
        // Try to get teacher name from teachers array first
        const teacher = this.teachers.find(t => t.id === selectedAssignment.teacher_id);
        
        if (teacher) {
          schedule.teacher_name = teacher.teacher_name;
        } else if (selectedAssignment.teacher_name) {
          // Fallback to teacher_name from assignment
          schedule.teacher_name = selectedAssignment.teacher_name;
        } else {
          schedule.teacher_name = 'Giáo viên không xác định';
        }
      } else {
        schedule.teacher_name = '-';
      }
    });
  }

  private removeDuplicateSchedules(schedules: ClassScheduleModel[]): ClassScheduleModel[] {
    const seen = new Set<string>();
    const unique: ClassScheduleModel[] = [];

    for (const schedule of schedules) {
      // Create a unique key based on important fields
      const key = `${schedule.class_id}-${schedule.date}-${schedule.start_time}-${schedule.end_time}-${schedule.teacher_id}-${schedule.room_name}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(schedule);
      }
    }

    return unique;
  }

  private applyFilters(): void {
    // Always start with ALL schedules from database
    let filtered = [...this.schedules];

    // Apply date filter first (if not showing all)
    if (!this.isShowingAll && this.selectedDate) {
      filtered = this.filterByDate(filtered, this.selectedDate);
    }

    // Apply search filter
    if (this.searchQuery && this.searchQuery.trim()) {
      filtered = this.filterBySearch(filtered, this.searchQuery);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(schedule => schedule.status === this.selectedStatus);
    }

    // Apply room filter
    if (this.selectedRoom) {
      filtered = filtered.filter(schedule => schedule.room_name === this.selectedRoom);
    }

    this.filteredSchedules = filtered;
  }

  private filterByDate(schedules: ClassScheduleModel[], date: Date): ClassScheduleModel[] {
    // Create date string in local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return schedules.filter(schedule => {
      // Handle different date formats and convert to local date
      let scheduleDateStr: string;
      
      if (schedule.date.includes('T') && schedule.date.includes('Z')) {
        // This is a UTC date from database (like 2025-10-16T17:00:00.000Z)
        // Convert to Vietnam timezone first
        const utcDate = new Date(schedule.date);
        const vietnamOffset = 7 * 60; // Vietnam is UTC+7
        const localTime = utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000);
        const vietnamDate = new Date(localTime + (vietnamOffset * 60000));
        
        // Format as YYYY-MM-DD
        const year = vietnamDate.getFullYear();
        const month = String(vietnamDate.getMonth() + 1).padStart(2, '0');
        const day = String(vietnamDate.getDate()).padStart(2, '0');
        scheduleDateStr = `${year}-${month}-${day}`;
      } else if (schedule.date.includes('T')) {
        // Regular ISO date without Z
        scheduleDateStr = schedule.date.split('T')[0];
      } else {
        // Already in YYYY-MM-DD format
        scheduleDateStr = schedule.date;
      }
      
      return scheduleDateStr === dateStr;
    });
  }

  private filterBySearch(schedules: ClassScheduleModel[], query: string): ClassScheduleModel[] {
    const searchQuery = query.toLowerCase().trim();
    
    return schedules.filter(schedule => {
      try {
        const dateStr = this.formatDate(schedule.date).toLowerCase();
        const teacherName = (schedule.teacher_name || '').toLowerCase();
        const roomName = (schedule.room_name || '').toLowerCase();
        const status = (schedule.status || '').toLowerCase();
        const timeRange = `${schedule.start_time || ''}-${schedule.end_time || ''}`.toLowerCase();
        const note = (schedule.note || '').toLowerCase();
        
        return dateStr.includes(searchQuery) ||
               teacherName.includes(searchQuery) ||
               roomName.includes(searchQuery) ||
               status.includes(searchQuery) ||
               timeRange.includes(searchQuery) ||
               note.includes(searchQuery);
      } catch (error) {
        return false;
      }
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery?.trim() || this.selectedStatus || this.selectedRoom || (!this.isShowingAll && this.selectedDate));
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchQuery?.trim()) count++;
    if (this.selectedStatus) count++;
    if (this.selectedRoom) count++;
    if (!this.isShowingAll && this.selectedDate) count++;
    return count;
  }

  getCurrentFilterInfo(): string {
    if (this.isShowingAll) {
      return 'Hiển thị tất cả lịch học';
    } else {
      const dateStr = this.selectedDate.toLocaleDateString('vi-VN');
      return `Lọc theo ngày: ${dateStr}`;
    }
  }

  isToday(date: Date): boolean {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }


  // Table Methods
  onAddNew(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.formSchedule = this.createEmptySchedule(today);
    this.initializeTimePickers();
    this.displayDrawer = true;
  }


  onEdit(schedule: ClassScheduleModel): void {
    this.formSchedule = { ...schedule };
    this.initializeTimePickers();
    this.displayDrawer = true;
  }

  onDelete(schedule: ClassScheduleModel): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa buổi học ngày ${this.formatDate(schedule.date)}?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteSchedule(schedule);
      }
    });
  }

  private deleteSchedule(schedule: ClassScheduleModel): void {
    this.scheduleService.deleteSchedule(schedule.id!).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã xóa buổi học'
        });
        this.loadAllClassSchedules();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xóa buổi học'
        });
      }
    });
  }

  // Formatting Methods
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      let date: Date;
      
      if (dateStr.includes('T') && dateStr.includes('Z')) {
        // This is a UTC date from database (like 2025-10-27T17:00:00.000Z)
        // Convert to Vietnam timezone first
        const utcDate = new Date(dateStr);
        const vietnamOffset = 7 * 60; // Vietnam is UTC+7
        const localTime = utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000);
        date = new Date(localTime + (vietnamOffset * 60000));
        
      } else {
        // Regular date string (YYYY-MM-DD)
        const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = cleanDateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Month is 0-indexed
          const day = parseInt(parts[2]);
          date = new Date(year, month, day, 12, 0, 0); // Use noon to avoid DST issues
          
        } else {
          console.error('Invalid date format:', dateStr);
          return dateStr;
        }
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr; // Return original string if invalid
      }
      
      const formatted = date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh' // Force Vietnam timezone
      });
      
      return formatted;
    } catch (error) {
      console.error('formatDate error:', error, 'input:', dateStr);
      return dateStr; // Return original string if error
    }
  }

  getDayName(dayOfWeek: number): string {
    // JavaScript format: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[dayOfWeek] || '';
  }


  // Helper method to parse date string to local date (avoiding timezone issues)
  private parseDateStringToLocal(dateInput: string | Date | null | undefined): Date {
    // Handle Date object directly
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    if (!dateInput) {
      return new Date();
    }
    
    // Handle string input
    const dateStr = String(dateInput);
    const cleanDateStr = typeof dateStr === 'string' && dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    
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

  // Helper method to validate day_of_week (JavaScript format: 0-6)
  private validateDayOfWeek(dayOfWeek: number): boolean {
    const isValid = dayOfWeek >= 0 && dayOfWeek <= 6;
    return isValid;
  }

  // Helper method to convert JS format to backend format if needed
  private jsDayToBackend(jsDayOfWeek: number): number {
    // Use JavaScript format directly: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
    return jsDayOfWeek; // 0=CN, 1=Thứ 2, 2=Thứ 3, 3=Thứ 4, 4=Thứ 5, 5=Thứ 6, 6=Thứ 7
  }

  // Helper method to format date for server to avoid timezone issues
  private formatDateForServer(dateInput: string | Date | null | undefined): string {
    // Ensure we send the date in YYYY-MM-DD format without timezone conversion
    // This prevents server from misinterpreting the date due to timezone differences
    
    if (!dateInput) return '';
    
    let dateStr: string;
    
    // Handle Date object
    if (dateInput instanceof Date) {
      // Convert Date to YYYY-MM-DD string using local timezone
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else {
      // Handle string input
      dateStr = String(dateInput);
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // If it contains time info, extract just the date part
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    
    // Validate the date string
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.error('Invalid date format:', dateInput);
      return ''; // Return empty string if invalid
    }
    
    return dateStr;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    switch (status) {
      case 'Đã Lên Lịch': return 'info';
      case 'Đã Dạy': return 'success';
      case 'Đã Hủy': return 'danger';
      case 'Dời Lịch': return 'warn';
      default: return 'info';
    }
  }

  // Weekly Calendar Methods
  onPreviousWeek(): void {
    this.previousWeek();
  }

  onNextWeek(): void {
    this.nextWeek();
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.updateWeeklyCalendar();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.updateWeeklyCalendar();
  }

  goToCurrentWeek(): void {
    this.currentWeekStart = this.getMondayOfCurrentWeek();
    this.updateWeeklyCalendar();
  }

  private _cachedWeekRange: string = '';
  private _lastWeekStart: Date | null = null;

  getCurrentWeekRange(): string {
    // Only recalculate if currentWeekStart has changed
    if (!this._lastWeekStart || this._lastWeekStart.getTime() !== this.currentWeekStart.getTime()) {
      const start = new Date(this.currentWeekStart);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      this._cachedWeekRange = `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
      this._lastWeekStart = new Date(this.currentWeekStart);
    }
    
    return this._cachedWeekRange;
  }

  private getMondayOfCurrentWeek(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Calculate Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return monday;
  }

  // Monthly Calendar Navigation
  previousMonth(): void {
    this.currentMonthStart.setMonth(this.currentMonthStart.getMonth() - 1);
    this.updateMonthlyCalendar();
  }

  nextMonth(): void {
    this.currentMonthStart.setMonth(this.currentMonthStart.getMonth() + 1);
    this.updateMonthlyCalendar();
  }

  goToCurrentMonth(): void {
    this.currentMonthStart = new Date();
    this.updateMonthlyCalendar();
  }

  getCurrentMonthRange(): string {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return `${monthNames[this.currentMonthStart.getMonth()]} ${this.currentMonthStart.getFullYear()}`;
  }

  private updateWeeklyCalendar(): void {
    // Get events for the current week
    const weekStart = new Date(this.currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    
    
    
    
    const weekEvents = this.schedules
      .filter(schedule => {
        try {
          // Use same UTC conversion logic as updateCalendarEvents
          let scheduleDateStr: string;
          if (typeof schedule.date === 'string') {
            if (schedule.date.includes('T') && schedule.date.includes('Z')) {
              // This is a UTC date from database (like 2025-10-02T17:00:00.000Z)
              // Simple approach: Add 7 hours to get Vietnam time, then extract date
              const utcDate = new Date(schedule.date);
              utcDate.setHours(utcDate.getHours() + 7); // Add 7 hours for Vietnam timezone
              scheduleDateStr = utcDate.toISOString().split('T')[0];
            } else {
              // Regular date string (YYYY-MM-DD)
              scheduleDateStr = schedule.date.includes('T') ? schedule.date.split('T')[0] : schedule.date;
            }
          } else {
            scheduleDateStr = '';
          }
          
          // Parse date manually to avoid timezone issues
          const parts = scheduleDateStr.split('-');
          let scheduleDate: Date;
          if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            scheduleDate = new Date(year, month, day);
          } else {
            scheduleDate = new Date(scheduleDateStr);
          }
          
          // Compare only dates, not times
          const scheduleDateOnly = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate());
          const weekStartOnly = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
          const weekEndOnly = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
          
          const isInWeek = scheduleDateOnly >= weekStartOnly && scheduleDateOnly <= weekEndOnly;
          
          
          return isInWeek;
        } catch (error) {
          return false;
        }
      })
      .map((s) => {
        // Format date and time properly - handle UTC conversion correctly
        let dateStr: string;
        if (typeof s.date === 'string') {
          if (s.date.includes('T') && s.date.includes('Z')) {
            // This is a UTC date from database (like 2025-10-02T17:00:00.000Z)
            // Simple approach: Add 7 hours to get Vietnam time, then extract date
            const utcDate = new Date(s.date);
            utcDate.setHours(utcDate.getHours() + 7); // Add 7 hours for Vietnam timezone
            dateStr = utcDate.toISOString().split('T')[0];
          } else {
            // Regular date string (YYYY-MM-DD)
            dateStr = s.date.includes('T') ? s.date.split('T')[0] : s.date;
          }
        } else {
          dateStr = '';
        }
        
        const startTime = s.start_time && s.start_time.length >= 5 ? s.start_time.substring(0, 5) : '08:00';
        const endTime = s.end_time && s.end_time.length >= 5 ? s.end_time.substring(0, 5) : '10:00';
        
        if (!dateStr || dateStr.length !== 10) {
          return null;
        }
        
        // Parse date to local Date object to avoid timezone issues
        const parts = dateStr.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        
      // Create local date objects for start and end times
      const startDate = new Date(year, month, day, parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));
      const endDate = new Date(year, month, day, parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));
      
      
      return {
        id: String(s.id),
        title: `| ${s.teacher_name || 'Chưa phân giáo viên'} | ${s.room_name || 'Chưa có phòng'}`,
        start: startDate,
        end: endDate,
          extendedProps: {
            room_name: s.room_name,
            status: s.status,
            note: s.note,
            class_id: s.class_id,
            teacher_id: s.teacher_id,
            teacher_name: s.teacher_name
          }
        };
      })
      .filter(event => event !== null);

    
    // Force refresh FullCalendar by creating completely new options object
    this.weeklyCalendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      events: weekEvents,
      headerToolbar: false,
      dateClick: this.onDateClick.bind(this),
      eventClick: this.onEventClick.bind(this),
      height: 'auto',
      aspectRatio: 1.8,
      locale: 'vi',
      firstDay: 1,
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      allDaySlot: false,
      nowIndicator: true,
      editable: false,
      selectable: true,
      initialDate: this.currentWeekStart
    };
    
    
    // Force FullCalendar re-render by temporarily hiding and showing
    this.calendarKey = -1; // Hide calendar
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.calendarKey = 1; // Show calendar with new options
      this.cdr.detectChanges();
    }, 50);
  }

  private updateMonthlyCalendar(): void {
    // Get current month range
    const currentMonth = this.currentMonthStart.getMonth();
    const currentYear = this.currentMonthStart.getFullYear();
    
    const monthlyEvents = this.schedules
      .filter(schedule => {
        // Use same UTC conversion logic as updateCalendarEvents
        let scheduleDateStr: string;
        if (typeof schedule.date === 'string') {
          if (schedule.date.includes('T') && schedule.date.includes('Z')) {
            // This is a UTC date from database (like 2025-10-02T17:00:00.000Z)
            // Simple approach: Add 7 hours to get Vietnam time, then extract date
            const utcDate = new Date(schedule.date);
            utcDate.setHours(utcDate.getHours() + 7); // Add 7 hours for Vietnam timezone
            scheduleDateStr = utcDate.toISOString().split('T')[0];
          } else {
            // Regular date string (YYYY-MM-DD)
            scheduleDateStr = schedule.date.includes('T') ? schedule.date.split('T')[0] : schedule.date;
          }
        } else {
          scheduleDateStr = '';
        }
        
        // Parse date manually to avoid timezone issues
        const parts = scheduleDateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Month is 0-indexed
          const day = parseInt(parts[2]);
          
          // Check if this schedule is in the current month
          const isInCurrentMonth = year === currentYear && month === currentMonth;
          
          return isInCurrentMonth;
        }
        return false;
      })
      .map((s) => {
        // Format date and time properly - handle UTC conversion correctly
        let dateStr: string;
        if (typeof s.date === 'string') {
          if (s.date.includes('T') && s.date.includes('Z')) {
            // This is a UTC date from database (like 2025-10-02T17:00:00.000Z)
            // Simple approach: Add 7 hours to get Vietnam time, then extract date
            const utcDate = new Date(s.date);
            utcDate.setHours(utcDate.getHours() + 7); // Add 7 hours for Vietnam timezone
            dateStr = utcDate.toISOString().split('T')[0];
          } else {
            // Regular date string (YYYY-MM-DD)
            dateStr = s.date.includes('T') ? s.date.split('T')[0] : s.date;
          }
        } else {
          dateStr = '';
        }
        
        const startTime = s.start_time && s.start_time.length >= 5 ? s.start_time.substring(0, 5) : '08:00';
        const endTime = s.end_time && s.end_time.length >= 5 ? s.end_time.substring(0, 5) : '10:00';
        
        if (!dateStr || dateStr.length !== 10) {
          return null;
        }
        
        // Parse date to local Date object to avoid timezone issues
        const parts = dateStr.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        
        // Create local date objects for start and end times
        const startDate = new Date(year, month, day, parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));
        const endDate = new Date(year, month, day, parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));
        return {
          id: String(s.id),
          title: ` - ${endTime} | ${s.teacher_name || 'Chưa phân giáo viên'} | ${s.room_name || 'Chưa có phòng'}`,
          start: startDate,
          end: endDate,
          extendedProps: {
            room_name: s.room_name,
            status: s.status,
            note: s.note,
            class_id: s.class_id,
            teacher_id: s.teacher_id,
            teacher_name: s.teacher_name
          }
        };
      })
      .filter(event => event !== null);

    this.monthlyCalendarOptions = {
      ...this.monthlyCalendarOptions,
      events: monthlyEvents,
      initialDate: this.currentMonthStart
    };
    
    // Force FullCalendar re-render by temporarily hiding and showing
    this.calendarKey = -1; // Hide calendar
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.calendarKey = 1; // Show calendar with new options
      this.cdr.detectChanges();
    }, 50);
  }
}
