# Velo-CarRental

## Demo đăng ký và đăng nhập

Khi mới clone dự án, đặt `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` và `SPRING_DATASOURCE_PASSWORD` theo MySQL của anh trước khi chạy Spring Boot. Trên máy phát triển, cũng có thể đặt ba thuộc tính `spring.datasource.url`, `spring.datasource.username` và `spring.datasource.password` trong tệp YAML `backend/velo/datasource.local` được Git bỏ qua.

Chạy Spring Boot trong `backend/velo`, sau đó chạy frontend từ thư mục gốc:

```powershell
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:5173/account` hoặc chọn **Tài khoản** trên trang chủ. Vite chuyển `POST /api/account/register` và `POST /api/account/login` đến hai endpoint tương ứng dưới `/account` của Spring Boot tại `http://127.0.0.1:8080`. Nếu backend dùng cổng khác, đặt `$env:BACKEND_URL = 'http://127.0.0.1:8081'` trước khi chạy Vite.

Để thêm hai tài khoản test vào MySQL, mở và chạy toàn bộ file `backend/velo/sql/demo-accounts.sql` trong DBeaver hoặc công cụ SQL đang dùng, sau khi backend đã tạo bảng `account`. File chọn database `velo` và bỏ qua email đã tồn tại, giữ nguyên mật khẩu và role của tài khoản cũ.

| Role | Email đăng nhập | Mật khẩu demo |
| --- | --- | --- |
| `USER` | `user.demo@velo.test` | `User@123456` |
| `ADMIN` | `admin.demo@velo.test` | `Admin@123456` |

Khi phục vụ bản build bằng Nginx, cấu hình fallback về `index.html` cho các trang `/account`, `/rent`, `/payment/{id}`, `/orders`, `/admin/orders`, `/admin/cars`, `/admin/accounts` và chuyển tiếp `/api/account/...`, `/api/product/...`, `/api/order/...` đến Spring Boot sau khi bỏ tiền tố `/api`. Giữ frontend và API cùng origin (cùng giao thức, tên máy và cổng trên trình duyệt) để dùng cookie phiên đăng nhập.

## Thuê xe

File `backend/velo/sql/demo-cars.sql` thêm 5 xe mẫu vào database `velo`, mỗi hãng một xe: Toyota, Honda, Mazda, Hyundai và Kia. Giá là dữ liệu demo, trạng thái ban đầu là `AVAILABLE`. Chạy lại file sẽ bỏ qua xe trùng hãng và tên, giữ nguyên dữ liệu cũ. Toyota, Mazda và Kia dùng ảnh có sẵn trong project; Honda và Hyundai để `img = NULL` và giao diện hiển thị biểu tượng chưa có ảnh.

Chọn một hoặc nhiều xe trên trang chủ, rồi bấm **Thuê xe** để chuyển sang `/rent`. Trang chủ lấy danh sách xe từ `GET /product/getall` và lọc theo tên, hãng xe. Trang xác nhận hiển thị các xe đã chọn và lấy báo giá cho từng xe từ `GET /order/quote?carId=1&startDate=2026-12-01&expireDate=2026-12-03`. Lịch trống được kiểm tra khi lấy báo giá và tạo đơn. Cần có tài khoản và xe trong database để thử luồng này.

Lựa chọn xe và ngày thuê được giữ trong `sessionStorage` cùng các tham số trên URL chuyển trang, để có thể tải lại hoặc đăng nhập rồi tiếp tục. Nút **Thay đổi xe** đưa về trang chủ. Khi tạo đơn thành công, giỏ thuê được xóa. Truy cập `/rent` khi chưa chọn xe sẽ hiển thị liên kết về trang chủ.

Backend tính số ngày từ ngày nhận đến trước ngày trả theo lịch. Giá từng ngày lấy từ `ProductEntity.pricePerDay`. Phí trễ hạn mặc định là **100.000đ cho mỗi ngày trễ trên một đơn**, có thể đổi bằng property `velo.rental.late-fee-per-day` hoặc biến môi trường `VELO_RENTAL_LATE_FEE_PER_DAY`. Mục tính thử phí trễ trên giao diện chỉ đưa ra ước tính khi chọn một ngày trả giả định.

Khi tạo đơn, backend xác định người thuê từ phiên đăng nhập, lấy lại giá xe, tính tổng tiền và đặt trạng thái `PENDING`. Request gửi một lần đến `POST /order/create`, gồm `startDate`, `expireDate`, `orderDetails: [{ car: { id: 1 } }, { car: { id: 2 } }]`. Các xe trong một đơn dùng chung ngày nhận, ngày trả. Nếu lịch khác nhau thì tạo đơn riêng. Bảng phí từng ngày cộng giá thuê của tất cả xe. Backend kiểm tra lịch trùng trong transaction và khóa bản ghi xe để xử lý hai yêu cầu đặt cùng lúc. Nếu một xe trong đơn bị trùng lịch, toàn bộ đơn bị từ chối.

`returnDate` là ngày trả thực tế, để `null` khi mới đặt. Cột `orders.return_date` trong MySQL cần cho phép `NULL`. Nếu đặt thuê báo lỗi `Field 'return_date' doesn't have a default value`, chạy file `backend/velo/sql/fix-order-return-date.sql` để cập nhật cột, giữ nguyên kiểu `datetime(6)` và dữ liệu hiện có. Cấu hình `ddl-auto: validate` chỉ kiểm tra schema và không sửa ràng buộc cũ này; sau khi chạy SQL có thể đặt thuê lại mà không cần khởi động lại backend.

## Thanh toán

Bấm **Đặt thuê** ở trang xác nhận để tạo đơn và mở `/payment/{id}`. Khách chọn **Tiền mặt** khi nhận xe hoặc **Chuyển khoản ngân hàng**, rồi bấm **Xác nhận phương thức**. Có thể mở lại trang này từ **Đơn thuê của tôi → Xem thanh toán**.

Trang lấy đơn, phương thức đã lưu và tài khoản thụ hưởng từ `GET /order/{id}/checkout`. Lựa chọn được lưu qua `POST /order/{id}/payment?paymentMethod=CASH` hoặc `BANK_TRANSFER`. Mỗi đơn có tối đa một thanh toán. Trạng thái `PENDING` nghĩa là đang chờ nhận tiền.

Để hiện hướng dẫn chuyển khoản, đặt ba biến môi trường trên backend trước khi chạy Spring Boot. `VELO_PAYMENT_BANK_NAME` là tên ngân hàng, `VELO_PAYMENT_BANK_NUMBER` là số tài khoản (giữ cả số 0 đầu nếu có), `VELO_PAYMENT_BANK_HOLDER` là tên chủ tài khoản. Khi có đủ thông tin, trang hiển thị số tiền thuê theo lịch và nội dung chuyển khoản `VELO-{id}`. Khi thiếu cấu hình, khách vẫn có thể lưu phương thức và xem lại sau.

## Theo dõi và quản lý đơn thuê

Với tài khoản `USER`, chọn **Lịch sử đơn thuê** trên trang tài khoản hoặc **Theo dõi đơn thuê** trên trang thanh toán để mở `/orders`. Trang dùng `GET /order/mine`. Tài khoản `ADMIN` có nút **Quản lý đơn thuê** mở `/admin/orders`, dùng `GET /order/manage`. Hai API hỗ trợ lọc theo `status` và phân trang bằng `page` (bắt đầu từ 0, mỗi trang 10 đơn).

Admin có thể chuyển đơn từ **Chờ xác nhận → Đã xác nhận → Đang thuê → Đã trả xe**. Có thể hủy trước khi giao xe. Nút **Giao xe** mở trong kỳ thuê và backend kiểm tra các xe đã được trả từ đơn trước. Khi nhận lại xe, backend ghi ngày trả thực tế. Mục chi tiết tách tiền thuê theo lịch và phí trễ theo mức đã lưu trên đơn.

Frontend gửi `POST /order/{id}/updatestatus?newStatus=...&expectedStatus=...`. Backend khóa đơn và kiểm tra trạng thái hiện tại để hai admin cùng thao tác có thể thấy xung đột.

Đăng nhập tạo session (phiên đăng nhập trên server). Trình duyệt gửi cookie phiên khi gọi API. `GET /account/me` trả tài khoản hiện tại, `POST /account/logout` kết thúc phiên. Frontend gửi kèm header `X-Velo-Request: 1` cho các POST tài khoản, đơn thuê và quản lý xe từ trình duyệt. Đăng ký tạo tài khoản `USER`. Muốn thử trang quản lý, hãy đăng nhập tài khoản đã được cấp role `ADMIN` trong database. Service đăng nhập của bản demo hiện vẫn so sánh mật khẩu dạng văn bản thường.

## Quản lý xe và tài khoản

Trang tài khoản admin có ba mục **Quản lý đơn thuê**, **Quản lý xe** và **Quản lý tài khoản**. Mục lịch sử thuê và thuê xe dành cho tài khoản `USER`.

`/admin/cars` hỗ trợ tìm xe, thêm, sửa tên xe, hãng, giá thuê mỗi ngày, đường dẫn ảnh và xóa xe chưa có đơn thuê. Các API `POST /product/create`, `POST /product/{id}/update`, `POST /product/{id}/delete` yêu cầu phiên admin. Xe đã được dùng trong đơn thuê không thể xóa và trả HTTP `409` để giữ lịch sử; giá đã lưu trên đơn không đổi khi sửa giá xe.

`/admin/accounts` hiển thị họ tên, email, số điện thoại, vai trò và trạng thái, hỗ trợ tìm kiếm và cấm/bỏ cấm tài khoản `USER`. API `POST /account/{id}/ban?banned=true` cấm tài khoản, `banned=false` bỏ cấm. Tài khoản bị cấm nhận HTTP `403` khi đăng nhập; phiên đã mở bị chặn ở yêu cầu cần đăng nhập tiếp theo. Không thể cấm tài khoản admin. API không trả mật khẩu và không nhận `role` hoặc `banned` từ form đăng ký.

Khởi động lại backend sau khi cập nhật code. Khi dùng `ddl-auto: update`, backend tự thêm cột `account.banned` với giá trị mặc định `false` cho tài khoản hiện có. Nếu chạy với `ddl-auto: validate`, cần thêm cột `banned BOOLEAN NOT NULL DEFAULT FALSE` vào bảng `account` trước khi khởi động.

File `scripts/smoke-admin.mjs` kiểm tra quyền admin, CRUD xe, giữ lịch sử thuê, cấm/bỏ cấm và chặn phiên cũ. Chỉ chạy với backend dùng database test riêng đã có hai tài khoản demo, bằng biến môi trường `VELO_TEST_BASE_URL` và lệnh `node scripts/smoke-admin.mjs`.
