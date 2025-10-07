import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleModel } from '../../models/schedule.model';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, DialogModule, InputTextModule, ButtonModule,ToastModule],
  templateUrl: './schedule.html',
  styleUrls: ['./schedule.scss'],
  providers: [ConfirmationService, MessageService]
})
export class Schedule implements OnInit {
  calendarOptions!: CalendarOptions;
  displayDialog = false;
  saving = false;

  schedules: ScheduleModel[] = [];
  selectedEvent: any = null;
  formSchedule!: ScheduleModel;

  constructor(
    private scheduleService: ScheduleService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Initialize form to avoid undefined bindings before any user interaction
    this.formSchedule = this.createEmptySchedule(new Date().toISOString().slice(0, 10));
    // Initialize calendar to avoid empty config error
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
      eventClick: this.onEventClick.bind(this)
    };

    this.loadSchedules();
  }

  private createEmptySchedule(dateStr: string): ScheduleModel {
    return {
      id: 0,
      class_id: 0,
      lecturer_id: null,
      date: dateStr,
      start_time: '08:00',
      end_time: '10:00',
      room: '',
      status: 'Chưa học',
      note: '',
      class_name: '',
      class_room_default: '',
      created_at: '',
      updated_at: ''
    };
  }

  loadSchedules(): void {
    this.scheduleService.getSchedules().subscribe((data) => {
      this.schedules = data;

      this.calendarOptions = {
        ...this.calendarOptions,
        events: data.map((s) => {
          const start = `${s.date}T${s.start_time}`;
          const end = `${s.date}T${s.end_time}`;
          return {
            id: String(s.id),
            title: s.class_name || s.room || 'Buổi học',
            start,
            end,
            extendedProps: {
              room: s.room,
              status: s.status,
              note: s.note,
              class_id: s.class_id,
              class_name: s.class_name
            }
          };
        })
      };
    });
  }

  onDateClick(arg: any): void {
    this.selectedEvent = null;
    this.formSchedule = this.createEmptySchedule(arg.dateStr);
    this.displayDialog = true;
  }

  onEventClick(arg: EventClickArg): void {
    const ev = arg.event;
    this.selectedEvent = ev;

    this.formSchedule = {
      id: Number(ev.id),
      class_id: ev.extendedProps['class_id'] || 0,
      lecturer_id: null,
      date: ev.startStr.slice(0, 10),
      start_time: ev.startStr.slice(11, 16),
      end_time: ev.endStr?.slice(11, 16) || '',
      room: ev.extendedProps['room'] || '',
      status: ev.extendedProps['status'] || 'Chưa học',
      note: ev.extendedProps['note'] || '',
      class_name: ev.extendedProps['class_name'] || '',
      class_room_default: '',
      created_at: '',
      updated_at: ''
    };

    this.displayDialog = true;
  }

  onSave(): void {
    const f = this.formSchedule;
    if (!f.class_id || !f.date || !f.start_time || !f.end_time) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập đầy đủ thông tin buổi học'
      });
      return;
    }

    const start = new Date(`${f.date}T${f.start_time}`);
    const end = new Date(`${f.date}T${f.end_time}`);
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

    const payload: ScheduleModel = { ...f };

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

  onCancel(): void {
    this.displayDialog = false;
    this.formSchedule = this.createEmptySchedule(new Date().toISOString().slice(0, 10));
  }
}
