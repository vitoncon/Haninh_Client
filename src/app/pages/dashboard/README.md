# Dashboard Module - Hà Ninh Academy

## Tổng Quan

Module Dashboard cung cấp giao diện tổng quan toàn diện cho hệ thống quản lý Hà Ninh Academy. Dashboard hiển thị các thống kê, biểu đồ trực quan và bảng dữ liệu từ tất cả các module trong hệ thống.

## Tính Năng

### 1. Thống Kê Tổng Quan (Stats Widget)
- **Tổng Học Viên**: Hiển thị tổng số học viên và số học viên mới đăng ký trong tháng
- **Doanh Thu**: Tổng doanh thu từ học phí và tỷ lệ tham gia
- **Lớp Học Đang Diễn Ra**: Số lượng lớp học hiện tại đang hoạt động
- **Tổng Khóa Học**: Tổng số khóa học trong hệ thống

### 2. Biểu Đồ Doanh Thu (Revenue Stream Widget)
- Biểu đồ đường thể hiện doanh thu theo tháng
- Hiển thị 6 tháng gần nhất
- Định dạng tiền tệ VNĐ

### 3. Phân Bố Lớp Học (Class Distribution Widget)
- Biểu đồ doughnut hiển thị phân bố lớp học theo từng khóa học
- Màu sắc phân biệt cho từng khóa

### 4. Tình Trạng Thanh Toán (Payment Status Widget)
- Biểu đồ pie thể hiện tình trạng thanh toán (Đã thanh toán, Chưa thanh toán, Quá hạn)
- Hiển thị tỷ lệ phần trăm

### 5. Học Viên Mới Đăng Ký (Recent Students Widget)
- Bảng danh sách học viên mới đăng ký
- Hiển thị: Mã HV, Họ tên, Email, Trạng thái
- Pagination 5 bản ghi mỗi trang

### 6. Top Khóa Học Theo Doanh Thu (Best Selling Widget)
- Danh sách các khóa học có doanh thu cao nhất
- Hiển thị progress bar thể hiện tỷ lệ
- Định dạng tiền VNĐ

### 7. Thông Báo Hệ Thống (Notifications Widget)
- Thông tin về lớp học sắp khai giảng
- Thống kê hoạt động gần đây
- Số học viên mới đăng ký
- Số lớp học đang hoạt động

## Cấu Trúc Module

```
dashboard/
├── components/
│   ├── statswidget.ts              # Thống kê tổng quan
│   ├── recentsaleswidget.ts       # Học viên mới đăng ký
│   ├── bestsellingwidget.ts       # Top khóa học
│   ├── revenuestreamwidget.ts      # Biểu đồ doanh thu
│   ├── classdistributionwidget.ts # Phân bố lớp học
│   ├── paymentstatuswidget.ts     # Tình trạng thanh toán
│   └── notificationswidget.ts      # Thông báo hệ thống
├── services/
│   └── dashboard.service.ts       # Service tổng hợp dữ liệu
└── dashboard.ts                    # Component chính
```

## Dashboard Service

Service `DashboardService` tích hợp dữ liệu từ các module:

### Methods Chính

1. **getDashboardStatistics()**: Lấy thống kê tổng quan
2. **getRecentStudents()**: Lấy danh sách học viên mới
3. **getClassDistributionByCourse()**: Phân bố lớp học theo khóa
4. **getRevenueChartData()**: Dữ liệu biểu đồ doanh thu
5. **getPaymentStatusDistribution()**: Phân bố tình trạng thanh toán
6. **getTopCoursesByRevenue()**: Top khóa học theo doanh thu
7. **getUpcomingClasses()**: Lớp học sắp khai giảng

## Tích Hợp Với Hệ Thống

Dashboard tự động lấy dữ liệu từ:

- **students-management**: Danh sách học viên
- **class-management**: Thông tin lớp học
- **courses**: Thông tin khóa học
- **fees**: Dữ liệu học phí và thanh toán
- **teacher-management**: Thông tin giảng viên
- **teaching-assignments**: Phân công giảng dạy

## Sử Dụng

Dashboard được hiển thị tự động khi người dùng đăng nhập thành công và truy cập trang chủ.

## Responsive Design

Dashboard được thiết kế responsive với:
- Desktop (XL): 12 cột grid
- Tablet (XL): 6 cột grid
- Mobile: 12 cột stack

## Cập Nhật Dữ Liệu

Dữ liệu được cập nhật real-time từ API backend:
- Mỗi lần component load
- Mỗi lần người dùng refresh trang
- Không có auto-refresh (để tiết kiệm bandwidth)

