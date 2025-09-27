import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/role.guard';
import { Courses } from './courses/components/courses';
import { Class } from './class-management/components/class/class';
import { Schedule } from './schedule/components/schedule/schedule';
import { Students } from './students-management/components/students/students';
import { StudyResults } from './study-results/components/study-results/study-results';
import { Certificates } from './certificates/components/certificates/certificates';
import { Teacher } from './teacher-management/components/teacher/teacher';
import { TeachingAssignments } from './teaching-assignments/components/teaching-assignments/teaching-assignments';
import { Fees } from './fees/components/fees/fees';


export default [   
    // quan ly khoa hoc
    { path: 'courses', data: { breadcrumb: 'Quản lý khóa học', roles: [1] }, canActivate: [roleGuard], component: Courses},
    { path: 'class', data: { breadcrumb: 'Quản lý lớp học', roles: [1] }, canActivate: [roleGuard], component: Class },
    { path: 'schedule', data: { breadcrumb: 'Lịch học', roles: [1,2,3] }, canActivate: [roleGuard], component: Schedule },
    // // quan ly hoc vien
    { path: 'students', data: { breadcrumb: 'Quản lý học viên', roles: [1,2] }, canActivate: [roleGuard], component: Students },
    { path: 'study-results', data: { breadcrumb: 'Kết quả học tập', roles: [1,2,3] }, canActivate: [roleGuard], component: StudyResults },
    { path: 'certificates', data: { breadcrumb: 'Chứng chỉ', roles: [1] }, canActivate: [roleGuard], component: Certificates },
    // // quan ly giang vien
    { path: 'teacher', data: { breadcrumb: 'Quản lý giảng viên', roles: [1] }, canActivate: [roleGuard], component: Teacher },
    { path: 'teaching-assignments', data: { breadcrumb: 'Phân công giảng dạy', roles: [1] }, canActivate: [roleGuard], component: TeachingAssignments },
    // // quan ly tai chinh
    { path: 'fees', data: { breadcrumb: 'Quản lý học phí', roles: [1] }, canActivate: [roleGuard], component: Fees },
    // default route
    { path: '**', redirectTo: '/notfound' },
] as Routes;
