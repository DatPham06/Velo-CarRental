# Velo-CarRental

## Demo đăng ký và đăng nhập

Khi mới clone dự án, đặt `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` và `SPRING_DATASOURCE_PASSWORD` theo MySQL của anh trước khi chạy Spring Boot. Trên máy phát triển, cũng có thể đặt ba thuộc tính `spring.datasource.url`, `spring.datasource.username` và `spring.datasource.password` trong tệp YAML `backend/velo/datasource.local` được Git bỏ qua.

Chạy Spring Boot trong `backend/velo`, sau đó chạy frontend từ thư mục gốc:

```powershell
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:5173/account` hoặc chọn **Tài khoản** trên trang chủ. Vite chuyển `POST /api/account/register` và `POST /api/account/login` đến hai endpoint tương ứng dưới `/account` của Spring Boot tại `http://127.0.0.1:8080`. Nếu backend dùng cổng khác, đặt `$env:BACKEND_URL = 'http://127.0.0.1:8081'` trước khi chạy Vite.

Khi phục vụ bản build bằng Nginx, cấu hình fallback về `index.html` cho các trang `/account`, `/rent`, `/payment/{id}`, `/orders`, `/admin/orders` và chuyển tiếp `/api/account/...`, `/api/product/...`, `/api/order/...` đến Spring Boot sau khi bỏ tiền tố `/api`. Giữ frontend và API cùng origin (cùng giao thức, tên máy và cổng trên trình duyệt) để dùng cookie phiên đăng nhập.

## Thuê xe

Chọn một hoặc nhiều xe trên trang chủ, rồi bấm **Thuê xe** để chuyển sang `/rent`. Trang chủ lấy danh sách xe từ `GET /product/getall` và lọc theo tên, hãng xe. Trang xác nhận hiển thị các xe đã chọn và lấy báo giá cho từng xe từ `GET /order/quote?carId=1&startDate=2026-12-01&expireDate=2026-12-03`. Lịch trống được kiểm tra khi lấy báo giá và tạo đơn. Cần có tài khoản và xe trong database để thử luồng này.

Lựa chọn xe và ngày thuê được giữ trong `sessionStorage` cùng các tham số trên URL chuyển trang, để có thể tải lại hoặc đăng nhập rồi tiếp tục. Nút **Thay đổi xe** đưa về trang chủ. Khi tạo đơn thành công, giỏ thuê được xóa. Truy cập `/rent` khi chưa chọn xe sẽ hiển thị liên kết về trang chủ.

Backend tính số ngày từ ngày nhận đến trước ngày trả theo lịch. Giá từng ngày lấy từ `ProductEntity.pricePerDay`. Phí trễ hạn mặc định là **100.000đ cho mỗi ngày trễ trên một đơn**, có thể đổi bằng property `velo.rental.late-fee-per-day` hoặc biến môi trường `VELO_RENTAL_LATE_FEE_PER_DAY`. Mục tính thử phí trễ trên giao diện chỉ đưa ra ước tính khi chọn một ngày trả giả định.

Khi tạo đơn, backend xác định người thuê từ phiên đăng nhập, lấy lại giá xe, tính tổng tiền và đặt trạng thái `PENDING`. Request gửi một lần đến `POST /order/create`, gồm `startDate`, `expireDate`, `orderDetails: [{ car: { id: 1 } }, { car: { id: 2 } }]`. Các xe trong một đơn dùng chung ngày nhận, ngày trả. Nếu lịch khác nhau thì tạo đơn riêng. Bảng phí từng ngày cộng giá thuê của tất cả xe. Backend kiểm tra lịch trùng trong transaction và khóa bản ghi xe để xử lý hai yêu cầu đặt cùng lúc. Nếu một xe trong đơn bị trùng lịch, toàn bộ đơn bị từ chối.

`returnDate` là ngày trả thực tế, để `null` khi mới đặt. Database cần cho phép cột `ReturnDate` của bảng `orders` nhận `NULL`. Sau khi khởi động lại backend, kiểm tra thay đổi schema của Hibernate với `ddl-auto: update` đang dùng trong cấu hình.

## Thanh toán

Bấm **Đặt thuê** ở trang xác nhận để tạo đơn và mở `/payment/{id}`. Khách chọn **Tiền mặt** khi nhận xe hoặc **Chuyển khoản ngân hàng**, rồi bấm **Xác nhận phương thức**. Có thể mở lại trang này từ **Đơn thuê của tôi → Xem thanh toán**.

Trang lấy đơn, phương thức đã lưu và tài khoản thụ hưởng từ `GET /order/{id}/checkout`. Lựa chọn được lưu qua `POST /order/{id}/payment?paymentMethod=CASH` hoặc `BANK_TRANSFER`. Mỗi đơn có tối đa một thanh toán. Trạng thái `PENDING` nghĩa là đang chờ nhận tiền.

Để hiện hướng dẫn chuyển khoản, đặt ba biến môi trường trên backend trước khi chạy Spring Boot. `VELO_PAYMENT_BANK_NAME` là tên ngân hàng, `VELO_PAYMENT_BANK_NUMBER` là số tài khoản (giữ cả số 0 đầu nếu có), `VELO_PAYMENT_BANK_HOLDER` là tên chủ tài khoản. Khi có đủ thông tin, trang hiển thị số tiền thuê theo lịch và nội dung chuyển khoản `VELO-{id}`. Khi thiếu cấu hình, khách vẫn có thể lưu phương thức và xem lại sau.

## Theo dõi và quản lý đơn thuê

Sau khi đăng nhập, chọn **Đơn thuê của tôi** trên trang tài khoản hoặc **Theo dõi đơn thuê** trên trang thanh toán để mở `/orders`. Trang dùng `GET /order/mine`. Tài khoản có role `ADMIN` còn có nút **Quản lý đơn thuê** mở `/admin/orders`, dùng `GET /order/manage`. Hai API hỗ trợ lọc theo `status` và phân trang bằng `page` (bắt đầu từ 0, mỗi trang 10 đơn).

Admin có thể chuyển đơn từ **Chờ xác nhận → Đã xác nhận → Đang thuê → Đã trả xe**. Có thể hủy trước khi giao xe. Nút **Giao xe** mở trong kỳ thuê và backend kiểm tra các xe đã được trả từ đơn trước. Khi nhận lại xe, backend ghi ngày trả thực tế. Mục chi tiết tách tiền thuê theo lịch và phí trễ theo mức đã lưu trên đơn.

Frontend gửi `POST /order/{id}/updatestatus?newStatus=...&expectedStatus=...`. Backend khóa đơn và kiểm tra trạng thái hiện tại để hai admin cùng thao tác có thể thấy xung đột.

Đăng nhập tạo session (phiên đăng nhập trên server). Trình duyệt gửi cookie phiên khi gọi API. `GET /account/me` trả tài khoản hiện tại, `POST /account/logout` kết thúc phiên. Frontend gửi kèm header `X-Velo-Request: 1` cho các POST tài khoản và đơn thuê từ trình duyệt. Đăng ký tạo tài khoản `USER`. Muốn thử trang quản lý, hãy đăng nhập tài khoản đã được cấp role `ADMIN` trong database. Service đăng nhập của bản demo hiện vẫn so sánh mật khẩu dạng văn bản thường.
