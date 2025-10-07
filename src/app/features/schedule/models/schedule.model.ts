export interface ScheduleModel {
  id: number;
  class_id: number;
  lecturer_id?: number | null;
  date: string;
  start_time: string;
  end_time: string;

  // Phòng học thực tế của buổi học
  room?: string | null;

  status: 'Chưa học' | 'Đã học' | 'Dạy bù' | 'Hủy' | 'Nghỉ';
  note?: string | null;

  created_at: string;
  updated_at: string;

  // Optional bổ sung
  class_name?: string;
  class_room_default?: string; // nếu bạn muốn hiển thị luôn phòng gốc
}
