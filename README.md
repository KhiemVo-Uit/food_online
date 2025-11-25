# Food Online

Nền tảng đặt đồ ăn trực tuyến với Backend Laravel và Frontend React + Bootstrap

## 📁 Cấu trúc dự án

```
Food Online/
├── backend/          # Laravel API
└── frontend/         # React + Bootstrap
```

## 🚀 Cài đặt Backend (Laravel)

### 1. Di chuyển vào thư mục backend

```bash
cd backend
```

### 2. Cài đặt dependencies

```bash
composer install
```

### 3. Cấu hình môi trường

```bash
copy .env.example .env
php artisan key:generate
```

### 4. Cấu hình database trong `.env`

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=food_online
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 5. Tạo database

```sql
CREATE DATABASE food_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. Chạy migrations

```bash
php artisan migrate
```

### 7. Khởi động server

```bash
php artisan serve
```

Backend sẽ chạy tại: `http://localhost:8000`

## 🎨 Cài đặt Frontend (React)

### 1. Di chuyển vào thư mục frontend

```bash
cd frontend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

```bash
copy .env.example .env
```

### 4. Khởi động development server

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 📚 Công nghệ sử dụng

### Backend

- Laravel 10
- MySQL
- Laravel Sanctum (Authentication)
- RESTful API

### Frontend

- React 18
- React Router DOM
- Bootstrap 5 + React Bootstrap
- Axios
- Formik + Yup
- React Toastify

## 🔑 API Endpoints

### Authentication

- `POST /api/register` - Đăng ký
- `POST /api/login` - Đăng nhập
- `POST /api/logout` - Đăng xuất
- `GET /api/me` - Lấy thông tin user

### Restaurants

- `GET /api/restaurants` - Danh sách nhà hàng
- `GET /api/restaurants/{id}` - Chi tiết nhà hàng
- `POST /api/restaurants` - Tạo nhà hàng (protected)
- `PUT /api/restaurants/{id}` - Cập nhật (protected)
- `DELETE /api/restaurants/{id}` - Xóa (protected)

### Orders

- `GET /api/orders` - Danh sách đơn hàng (protected)
- `POST /api/orders` - Tạo đơn hàng (protected)
- `GET /api/orders/{id}` - Chi tiết đơn hàng (protected)
- `PUT /api/orders/{id}/status` - Cập nhật trạng thái (protected)
- `POST /api/orders/{id}/cancel` - Hủy đơn hàng (protected)

### Reviews

- `GET /api/reviews` - Danh sách đánh giá
- `POST /api/reviews` - Tạo đánh giá (protected)
- `DELETE /api/reviews/{id}` - Xóa đánh giá (protected)

## 👥 User Roles

- **CUSTOMER** - Khách hàng: Đặt món, đánh giá
- **RESTAURANT_OWNER** - Chủ nhà hàng: Quản lý nhà hàng, menu
- **SHIPPER** - Người giao hàng: Nhận và giao đơn
- **ADMIN** - Quản trị viên: Toàn quyền hệ thống

## 📝 License

MIT License

## 👨‍💻 Developer

Built with ❤️ using Laravel & React
