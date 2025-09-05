import { Injectable } from '@angular/core';
import { Course } from '@features/courses/models/courses.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  constructor() {}

  // Trả về dữ liệu demo (Promise)
 getCoursesMini(): Promise<Course[]> {
  const demoData: Course[] = [
    { id: 'C001', name: 'Lập trình Web với Angular', category: 'Công nghệ thông tin', duration: '10 tuần', students: 45 },
    // { id: 'C002', name: 'Phân tích dữ liệu với Python', category: 'Khoa học dữ liệu', duration: '8 tuần', students: 60 },
    // { id: 'C003', name: 'Thiết kế UI/UX cơ bản', category: 'Thiết kế', duration: '6 tuần', students: 30 },
    // { id: 'C004', name: 'Quản trị dự án Agile/Scrum', category: 'Quản lý', duration: '4 tuần', students: 25 },
    // { id: 'C005', name: 'Trí tuệ nhân tạo cơ bản', category: 'AI/Machine Learning', duration: '12 tuần', students: 40 },
    // { id: 'C001', name: 'Lập trình Web với Angular', category: 'Công nghệ thông tin', duration: '10 tuần', students: 45 },
    // { id: 'C002', name: 'Phân tích dữ liệu với Python', category: 'Khoa học dữ liệu', duration: '8 tuần', students: 60 },
    // { id: 'C003', name: 'Thiết kế UI/UX cơ bản', category: 'Thiết kế', duration: '6 tuần', students: 30 },
    // { id: 'C004', name: 'Quản trị dự án Agile/Scrum', category: 'Quản lý', duration: '4 tuần', students: 25 },
    // { id: 'C005', name: 'Trí tuệ nhân tạo cơ bản', category: 'AI/Machine Learning', duration: '12 tuần', students: 40 },
    // { id: 'C001', name: 'Lập trình Web với Angular', category: 'Công nghệ thông tin', duration: '10 tuần', students: 45 },
    // { id: 'C002', name: 'Phân tích dữ liệu với Python', category: 'Khoa học dữ liệu', duration: '8 tuần', students: 60 },
    // { id: 'C003', name: 'Thiết kế UI/UX cơ bản', category: 'Thiết kế', duration: '6 tuần', students: 30 },
    // { id: 'C004', name: 'Quản trị dự án Agile/Scrum', category: 'Quản lý', duration: '4 tuần', students: 25 },
    // { id: 'C005', name: 'Trí tuệ nhân tạo cơ bản', category: 'AI/Machine Learning', duration: '12 tuần', students: 40 },
    // { id: 'C001', name: 'Lập trình Web với Angular', category: 'Công nghệ thông tin', duration: '10 tuần', students: 45 },
    // { id: 'C002', name: 'Phân tích dữ liệu với Python', category: 'Khoa học dữ liệu', duration: '8 tuần', students: 60 },
    // { id: 'C003', name: 'Thiết kế UI/UX cơ bản', category: 'Thiết kế', duration: '6 tuần', students: 30 },
    { id: 'C004', name: 'Quản trị dự án Agile/Scrum', category: 'Quản lý', duration: '4 tuần', students: 25 },
    { id: 'C005', name: 'Trí tuệ nhân tạo cơ bản', category: 'AI/Machine Learning', duration: '12 tuần', students: 40 },
  ];

  return Promise.resolve(demoData);
}
}