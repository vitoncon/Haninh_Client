# Exam Detail Component - API Integration

Component "Chi tiết bài kiểm tra" cho admin tổng quản lý điểm số và trạng thái bài kiểm tra với API thật.

## ✅ Đã tích hợp API thật

### 1. API Endpoints được sử dụng

- **GET** `/api/study-results` - Lấy thông tin bài kiểm tra và điểm số học viên (generic endpoint)
- **POST** `/api/study-results` - Tạo/cập nhật điểm số học viên (bulk operation)
- **Note**: Server sử dụng generic endpoints `/api/{router}` thay vì specific endpoints

### 2. Data Flow

#### Load Exam Detail
```typescript
loadExamDetail() {
  this.studyResultService.getStudyResultsWithDetails({ 
    class_id: this.classId!,
    search: this.examId.toString() // Search by exam ID
  }).subscribe({
    next: (results) => {
      if (results && results.length > 0) {
        // Get exam info from first result - REAL DATA ONLY
        const firstResult = results[0];
        this.examDetail = {
          id: this.examId!,
          exam_name: firstResult.exam_name || 'Bài kiểm tra',
          exam_type: firstResult.exam_type || 'Kiểm tra định kỳ',
          // ... other fields from REAL data
        };
      } else {
        // NO FALLBACK DATA - Show error instead
        this.examDetail = null;
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Không tìm thấy dữ liệu bài kiểm tra'
        });
      }
    }
  });
}
```

#### Load Student Scores
```typescript
loadStudentScores() {
  // Step 1: Get all students in the class
  this.classStudentService.getStudentsByClass(this.classId).subscribe({
    next: (classStudents) => {
      // Step 2: Extract student IDs
      const studentIds = classStudents.map((cs: any) => cs.student_id);
      
      // Step 3: Get detailed student information
      this.studentService.getStudents({}).subscribe({
        next: (studentsResponse: any) => {
          // Step 4: Filter students that are in this class
          const classStudentsDetails = students.filter(student => 
            studentIds.includes(student.id)
          );
          
          // Step 5: Get exam results for this exam (if any)
          this.studyResultService.getStudyResultsWithDetails({ 
            class_id: this.classId!,
            search: this.examId?.toString() || ''
          }).subscribe({
            next: (examResults) => {
              // Step 6: Combine class students with their exam results
              this.studentScores = classStudentsDetails.map((student: any) => {
                const examResult = examResultsMap.get(student.id);
                return {
                  student_id: student.id,
                  student_code: student.student_code || '',
                  full_name: student.full_name || '',
                  email: student.email || '',
                  score: examResult?.score || 0,
                  percentage: examResult?.percentage || 0,
                  teacher_comment: examResult?.teacher_comment || '',
                  student_feedback: examResult?.student_feedback || ''
                };
              });
            }
          });
        }
      });
    }
  });
}
```

#### Save Scores
```typescript
onSave() {
  const updatedResults = this.studentScores.map(student => ({
    student_id: student.student_id,
    class_id: this.classId!,
    exam_type: this.examDetail?.exam_type,
    exam_name: this.examDetail?.exam_name,
    // ... StudyResult format
  }));

  this.studyResultService.bulkCreateStudyResults(this.classId!, updatedResults)
    .subscribe({
      next: (response) => {
        // Update local data and UI
      }
    });
}
```

### 3. Data Structure

Component sử dụng dữ liệu từ nhiều nguồn:

- **Class Students**: Lấy từ bảng `class_students` để có danh sách đầy đủ học viên của lớp
- **Student Details**: Lấy từ bảng `students` để có thông tin chi tiết (tên, email, mã học viên)
- **Exam Info**: Lấy từ các trường `exam_name`, `exam_type`, `exam_date`, `language`, `skill_type`, `max_score`
- **Student Scores**: Lấy từ bảng `study_results` với các trường `student_id`, `score`, `percentage`, `teacher_comment`, `student_feedback`
- **Status**: Hiện tại sử dụng local status vì `study_results` không có trường status

**Ưu điểm**: 
- Hiển thị tất cả học viên của lớp với thông tin đầy đủ
- Kết hợp dữ liệu từ nhiều bảng để có view hoàn chỉnh
- Xử lý trường hợp học viên chưa có điểm số
- **Chỉ sử dụng dữ liệu thật, không có dữ liệu mẫu fallback**

### 4. Status Management

Component quản lý status locally:

| Component Status | Mô tả | Hành vi |
|------------------|-------|---------|
| `draft` | Bài mới tạo | Cho phép chỉnh sửa |
| `in_progress` | Đang nhập điểm | Cho phép chỉnh sửa |
| `review` | Chờ duyệt | Admin có thể duyệt |
| `published` | Đã công bố | Readonly, admin có thể mở khóa |

### 5. Error Handling

Tất cả API calls đều có error handling:

```typescript
.subscribe({
  next: (data) => {
    // Success handling
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Operation completed successfully'
    });
  },
  error: (error) => {
    // Error handling
    console.error('API Error:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Operation failed: ' + (error.message || 'Unknown error')
    });
  }
});
```

### 6. Loading States

Component hiển thị loading state trong khi gọi API:

```typescript
this.loading = true;
// API call
this.loading = false; // In success/error handlers
```

### 7. Data Validation

- Kiểm tra `examId` trước khi gọi API
- Validate dữ liệu trước khi gửi lên server
- Handle null/undefined values từ API response

## 🔧 Cấu hình API

### Base URL
```typescript
private apiUrl = 'http://localhost:10093/api';
```

### Authentication
```typescript
private getAuthHeaders(): { headers: HttpHeaders } {
  const token = localStorage.getItem('accessToken') || '';
  return {
    headers: new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    })
  };
}
```

## 📝 Cần cải thiện

1. **Exam Status Field**: Cần thêm trường `status` vào bảng `study_results` để quản lý trạng thái thật
2. **Approval Tracking**: Cần thêm các trường `approved_by`, `approved_at` vào database
3. **Real-time Updates**: Có thể thêm WebSocket để cập nhật real-time
4. **Caching**: Thêm cache cho dữ liệu để tăng performance
5. **Pagination**: Thêm pagination cho danh sách học viên lớn
6. **Exam ID Mapping**: Cần map đúng exam ID từ URL parameter

## 🚀 Sử dụng

Component đã sẵn sàng sử dụng với API thật. Chỉ cần đảm bảo:

1. Server API đang chạy trên `http://localhost:10093`
2. User đã đăng nhập và có token trong localStorage
3. Database có dữ liệu bài kiểm tra và điểm số

## 🔍 Debug

Để debug API calls, kiểm tra:

1. Network tab trong DevTools
2. Console logs trong component
3. Server logs
4. Database data
