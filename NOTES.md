# Ghi chú tiến độ (30/10/2026)

## Đã xong
- Giao diện: layout, trang chủ, thực đơn, liên hệ
- Supabase: bảng branches, tables, reservations, site_settings, promotions, testimonials, events, menu
- Đăng nhập admin hoạt động (ADMIN_EMAILS)
- Trang /admin/noi-dung có các tab Thông tin chung, Trang chủ, SEO, Ưu đãi, Đánh giá

## Lỗi đang dở
- Lưu "Thông tin chung" bị chặn: openingHours báo "Vui lòng nhập ngày."
  Nguyên nhân: dữ liệu site_settings dùng khóa `days`, code dùng `day`.
  Cách sửa: chạy SQL cập nhật openingHours (khóa `day`) hoặc điền lại ô ngày trong form, và để agent thêm normalizeSettings().
- Bảng testimonials: kiểm tra tên cột (author/content/rating hay name/quote/stars) cho khớp saveTestimonial.
- Form chưa hiện rõ lỗi khi lưu thất bại.

## Việc tiếp theo
1. Sửa lỗi lưu nội dung ở trên
2. Trang quản lý thực đơn (/admin/thuc-don)
3. Dashboard số liệu
4. Giai đoạn E: logic giờ trống, giữ chỗ, trang /dat-ban

## Việc cần làm trên máy mới
- Cài Node.js LTS, Git, VS Code
- git clone, npm install
- Tạo .env.local (4 biến: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, ADMIN_EMAILS)