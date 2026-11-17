# Velo-CarRental

## Demo đăng ký và đăng nhập

Chạy Spring Boot trong `backend/velo` với MySQL đã cấu hình. Sau đó chạy frontend từ thư mục gốc:

```powershell
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:5173/account` hoặc chọn **Tài khoản** trên trang chủ. Vite chuyển `POST /api/account/register` và `POST /api/account/login` đến hai endpoint tương ứng dưới `/account` của Spring Boot tại `http://127.0.0.1:8080`. Nếu backend dùng cổng khác, đặt `$env:BACKEND_URL = 'http://127.0.0.1:8081'` trước khi chạy Vite.

Khi phục vụ bản build bằng Nginx, cấu hình fallback về `index.html` cho đường dẫn trang `/account` và chuyển tiếp hai API `/api/account/...` đến đường dẫn `/account/...` của Spring Boot.
