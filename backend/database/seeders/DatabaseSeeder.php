<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Restaurant;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Shipper;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Review;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create Users
        $customer1 = User::create([
            'name' => 'Nguyễn Văn A',
            'email' => 'customer@test.com',
            'password' => Hash::make('password'),
            'phone' => '0901234567',
            'address' => '123 Đường ABC, Quận 1, TP.HCM',
            'role' => 'CUSTOMER',
        ]);

        $customer2 = User::create([
            'name' => 'Trần Thị B',
            'email' => 'customer2@test.com',
            'password' => Hash::make('password'),
            'phone' => '0907654321',
            'address' => '456 Đường XYZ, Quận 3, TP.HCM',
            'role' => 'CUSTOMER',
        ]);

        $owner1 = User::create([
            'name' => 'Phạm Văn C',
            'email' => 'owner@test.com',
            'password' => Hash::make('password'),
            'phone' => '0912345678',
            'address' => '789 Đường DEF, Quận 5, TP.HCM',
            'role' => 'RESTAURANT_OWNER',
        ]);

        $owner2 = User::create([
            'name' => 'Lê Thị D',
            'email' => 'owner2@test.com',
            'password' => Hash::make('password'),
            'phone' => '0923456789',
            'address' => '321 Đường GHI, Quận 7, TP.HCM',
            'role' => 'RESTAURANT_OWNER',
        ]);

        $shipper1 = User::create([
            'name' => 'Hoàng Văn E',
            'email' => 'shipper@test.com',
            'password' => Hash::make('password'),
            'phone' => '0934567890',
            'address' => '654 Đường JKL, Quận 10, TP.HCM',
            'role' => 'SHIPPER',
        ]);

        $shipper2 = User::create([
            'name' => 'Võ Thị F',
            'email' => 'shipper2@test.com',
            'password' => Hash::make('password'),
            'phone' => '0945678901',
            'address' => '987 Đường MNO, Quận Bình Thạnh, TP.HCM',
            'role' => 'SHIPPER',
        ]);

        // Create Shippers
        Shipper::create([
            'user_id' => $shipper1->id,
            'vehicle_type' => 'Motorbike',
            'vehicle_number' => '59A-12345',
            'is_available' => true,
            'status' => 'AVAILABLE',
            'current_latitude' => 10.762622,
            'current_longitude' => 106.660172,
        ]);

        Shipper::create([
            'user_id' => $shipper2->id,
            'vehicle_type' => 'Bicycle',
            'vehicle_number' => '59B-67890',
            'is_available' => true,
            'status' => 'AVAILABLE',
            'current_latitude' => 10.771639,
            'current_longitude' => 106.698346,
        ]);

        // Create Restaurants
        $restaurant1 = Restaurant::create([
            'owner_id' => $owner1->id,
            'name' => 'Nhà Hàng Phở Việt',
            'description' => 'Phở truyền thống Hà Nội, hương vị đậm đà',
            'address' => '100 Đường Lê Lợi, Quận 1, TP.HCM',
            'latitude' => 10.762622,
            'longitude' => 106.660172,
            'phone' => '0281234567',
            'image_url' => 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500',
            'opening_time' => '06:00',
            'closing_time' => '22:00',
            'rating' => 4.5,
            'is_active' => true,
        ]);

        $restaurant2 = Restaurant::create([
            'owner_id' => $owner1->id,
            'name' => 'Quán Cơm Tấm Sườn',
            'description' => 'Cơm tấm sườn nướng, chả trứng thơm ngon',
            'address' => '200 Đường Nguyễn Huệ, Quận 1, TP.HCM',
            'latitude' => 10.775000,
            'longitude' => 106.702000,
            'phone' => '0282345678',
            'image_url' => 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500',
            'opening_time' => '07:00',
            'closing_time' => '21:00',
            'rating' => 4.2,
            'is_active' => true,
        ]);

        $restaurant3 = Restaurant::create([
            'owner_id' => $owner2->id,
            'name' => 'Bún Bò Huế Ngon',
            'description' => 'Bún bò Huế chuẩn vị xứ Huế',
            'address' => '300 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
            'latitude' => 10.756000,
            'longitude' => 106.676000,
            'phone' => '0283456789',
            'image_url' => 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=500',
            'opening_time' => '06:30',
            'closing_time' => '20:00',
            'rating' => 4.7,
            'is_active' => true,
        ]);

        $restaurant4 = Restaurant::create([
            'owner_id' => $owner2->id,
            'name' => 'Bánh Mì Sài Gòn',
            'description' => 'Bánh mì thịt, pate, trứng đủ loại',
            'address' => '400 Đường Pasteur, Quận 3, TP.HCM',
            'latitude' => 10.783000,
            'longitude' => 106.693000,
            'phone' => '0284567890',
            'image_url' => 'https://images.unsplash.com/photo-1603526388217-5498e6aa8d31?w=500',
            'opening_time' => '05:00',
            'closing_time' => '23:00',
            'rating' => 4.3,
            'is_active' => true,
        ]);

        // Create Menu Categories for Restaurant 1
        $phoCategory = MenuCategory::create([
            'restaurant_id' => $restaurant1->id,
            'name' => 'Phở',
            'description' => 'Các loại phở',
            'sort_order' => 1,
        ]);

        $beverageCategory1 = MenuCategory::create([
            'restaurant_id' => $restaurant1->id,
            'name' => 'Đồ Uống',
            'description' => 'Nước ngọt, trà',
            'sort_order' => 2,
        ]);

        // Create Menu Items for Restaurant 1
        MenuItem::create([
            'restaurant_id' => $restaurant1->id,
            'category_id' => $phoCategory->id,
            'name' => 'Phở Bò Tái',
            'description' => 'Phở bò với thịt tái',
            'price' => 45000,
            'image_url' => 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=300',
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant1->id,
            'category_id' => $phoCategory->id,
            'name' => 'Phở Bò Chín',
            'description' => 'Phở bò với thịt chín',
            'price' => 50000,
            'image_url' => 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300',
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant1->id,
            'category_id' => $phoCategory->id,
            'name' => 'Phở Gà',
            'description' => 'Phở gà thơm ngon',
            'price' => 40000,
            'image_url' => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300',
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant1->id,
            'category_id' => $beverageCategory1->id,
            'name' => 'Trà Đá',
            'description' => 'Trà đá miễn phí',
            'price' => 0,
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant1->id,
            'category_id' => $beverageCategory1->id,
            'name' => 'Coca Cola',
            'description' => 'Coca lon 330ml',
            'price' => 15000,
            'is_available' => true,
        ]);

        // Create Menu Categories for Restaurant 2
        $comTamCategory = MenuCategory::create([
            'restaurant_id' => $restaurant2->id,
            'name' => 'Cơm Tấm',
            'description' => 'Cơm tấm các loại',
            'sort_order' => 1,
        ]);

        // Create Menu Items for Restaurant 2
        MenuItem::create([
            'restaurant_id' => $restaurant2->id,
            'category_id' => $comTamCategory->id,
            'name' => 'Cơm Tấm Sườn Bì Chả',
            'description' => 'Cơm tấm sườn nướng, bì, chả trứng',
            'price' => 35000,
            'image_url' => 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300',
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant2->id,
            'category_id' => $comTamCategory->id,
            'name' => 'Cơm Tấm Sườn Nướng',
            'description' => 'Cơm tấm sườn nướng',
            'price' => 30000,
            'image_url' => 'https://images.unsplash.com/photo-1615361200098-605e66c2d9d1?w=300',
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant2->id,
            'category_id' => $comTamCategory->id,
            'name' => 'Cơm Tấm Gà Nướng',
            'description' => 'Cơm tấm gà nướng',
            'price' => 32000,
            'image_url' => 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300',
            'is_available' => true,
        ]);

        // Create Menu Categories for Restaurant 3
        $bunBoCategory = MenuCategory::create([
            'restaurant_id' => $restaurant3->id,
            'name' => 'Bún Bò Huế',
            'description' => 'Bún bò các loại',
            'sort_order' => 1,
        ]);

        // Create Menu Items for Restaurant 3
        MenuItem::create([
            'restaurant_id' => $restaurant3->id,
            'category_id' => $bunBoCategory->id,
            'name' => 'Bún Bò Huế Đặc Biệt',
            'description' => 'Bún bò Huế với đầy đủ topping',
            'price' => 45000,
            'image_url' => 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=300',
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant3->id,
            'category_id' => $bunBoCategory->id,
            'name' => 'Bún Bò Huế Thường',
            'description' => 'Bún bò Huế thường',
            'price' => 35000,
            'image_url' => 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300',
            'is_available' => true,
        ]);

        // Create Menu Categories for Restaurant 4
        $banhMiCategory = MenuCategory::create([
            'restaurant_id' => $restaurant4->id,
            'name' => 'Bánh Mì',
            'description' => 'Bánh mì các loại',
            'sort_order' => 1,
        ]);

        // Create Menu Items for Restaurant 4
        MenuItem::create([
            'restaurant_id' => $restaurant4->id,
            'category_id' => $banhMiCategory->id,
            'name' => 'Bánh Mì Thịt',
            'description' => 'Bánh mì thịt nguội',
            'price' => 20000,
            'image_url' => 'https://images.unsplash.com/photo-1603526388217-5498e6aa8d31?w=300',
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant4->id,
            'category_id' => $banhMiCategory->id,
            'name' => 'Bánh Mì Pate',
            'description' => 'Bánh mì pate',
            'price' => 15000,
            'image_url' => 'https://images.unsplash.com/photo-1598182198871-d3f4ab4fd181?w=300',
            'is_available' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant4->id,
            'category_id' => $banhMiCategory->id,
            'name' => 'Bánh Mì Trứng',
            'description' => 'Bánh mì trứng ốp la',
            'price' => 18000,
            'image_url' => 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300',
            'is_available' => true,
        ]);

        // Create Orders
        $order1 = Order::create([
            'customer_id' => $customer1->id,
            'restaurant_id' => $restaurant1->id,
            'shipper_id' => $shipper1->id,
            'status' => 'DELIVERED',
            'subtotal' => 95000,
            'delivery_fee' => 20000,
            'total' => 115000,
            'delivery_address' => '123 Đường ABC, Quận 1, TP.HCM',
            'customer_phone' => '0901234567',
            'notes' => 'Giao giờ hành chính',
            'confirmed_at' => now()->subDays(2),
            'delivered_at' => now()->subDays(2)->addHours(1),
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => 1, // Phở Bò Tái
            'quantity' => 1,
            'price' => 45000,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => 2, // Phở Bò Chín
            'quantity' => 1,
            'price' => 50000,
        ]);

        Payment::create([
            'order_id' => $order1->id,
            'payment_method' => 'CASH',
            'amount' => 115000,
            'status' => 'COMPLETED',
            'transaction_id' => 'CASH-' . time(),
        ]);

        Review::create([
            'customer_id' => $customer1->id,
            'restaurant_id' => $restaurant1->id,
            'order_id' => $order1->id,
            'rating' => 5,
            'comment' => 'Phở rất ngon, nước dùng đậm đà!',
        ]);

        // Order 2
        $order2 = Order::create([
            'customer_id' => $customer2->id,
            'restaurant_id' => $restaurant2->id,
            'shipper_id' => $shipper2->id,
            'status' => 'DELIVERED',
            'subtotal' => 65000,
            'delivery_fee' => 20000,
            'total' => 85000,
            'delivery_address' => '456 Đường XYZ, Quận 3, TP.HCM',
            'customer_phone' => '0907654321',
            'confirmed_at' => now()->subDay(),
            'delivered_at' => now()->subDay()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'menu_item_id' => 6, // Cơm Tấm Sườn Bì Chả
            'quantity' => 1,
            'price' => 35000,
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'menu_item_id' => 7, // Cơm Tấm Sườn Nướng
            'quantity' => 1,
            'price' => 30000,
        ]);

        Payment::create([
            'order_id' => $order2->id,
            'payment_method' => 'E_WALLET',
            'amount' => 85000,
            'status' => 'COMPLETED',
            'transaction_id' => 'MOMO-' . time(),
        ]);

        Review::create([
            'customer_id' => $customer2->id,
            'restaurant_id' => $restaurant2->id,
            'order_id' => $order2->id,
            'rating' => 4,
            'comment' => 'Cơm tấm ngon, sườn nướng mềm',
        ]);

        // Order 3 (Pending)
        $order3 = Order::create([
            'customer_id' => $customer1->id,
            'restaurant_id' => $restaurant3->id,
            'status' => 'PENDING',
            'subtotal' => 45000,
            'delivery_fee' => 20000,
            'total' => 65000,
            'delivery_address' => '123 Đường ABC, Quận 1, TP.HCM',
            'customer_phone' => '0901234567',
        ]);

        OrderItem::create([
            'order_id' => $order3->id,
            'menu_item_id' => 9, // Bún Bò Huế Đặc Biệt
            'quantity' => 1,
            'price' => 45000,
        ]);

        Payment::create([
            'order_id' => $order3->id,
            'payment_method' => 'CASH',
            'amount' => 65000,
            'status' => 'PENDING',
        ]);

        echo "Database seeded successfully!\n";
        echo "Login credentials:\n";
        echo "Customer: customer@test.com / password\n";
        echo "Customer 2: customer2@test.com / password\n";
        echo "Restaurant Owner: owner@test.com / password\n";
        echo "Restaurant Owner 2: owner2@test.com / password\n";
        echo "Shipper: shipper@test.com / password\n";
        echo "Shipper 2: shipper2@test.com / password\n";
    }
}
