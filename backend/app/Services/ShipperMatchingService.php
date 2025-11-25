<?php

namespace App\Services;

use App\Models\Shipper;
use App\Models\Order;

class ShipperMatchingService
{
    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    public function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Earth radius in kilometers

        $latDiff = deg2rad($lat2 - $lat1);
        $lonDiff = deg2rad($lon2 - $lon1);

        $a = sin($latDiff / 2) * sin($latDiff / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDiff / 2) * sin($lonDiff / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Find the nearest available shipper to the restaurant
     */
    public function findNearestShipper($restaurantLatitude, $restaurantLongitude, $maxDistance = 10)
    {
        // Get all available shippers (only check status, not is_available)
        $availableShippers = Shipper::where('status', 'AVAILABLE')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        if ($availableShippers->isEmpty()) {
            return null;
        }

        $nearestShipper = null;
        $shortestDistance = PHP_FLOAT_MAX;

        foreach ($availableShippers as $shipper) {
            $distance = $this->calculateDistance(
                $restaurantLatitude,
                $restaurantLongitude,
                $shipper->latitude,
                $shipper->longitude
            );

            // Check if this shipper is closer and within max distance
            if ($distance < $shortestDistance && $distance <= $maxDistance) {
                $shortestDistance = $distance;
                $nearestShipper = $shipper;
            }
        }

        return $nearestShipper;
    }

    /**
     * Assign shipper to order
     */
    public function assignShipperToOrder(Order $order, $restaurantLatitude, $restaurantLongitude)
    {
        $shipper = $this->findNearestShipper($restaurantLatitude, $restaurantLongitude);

        if ($shipper) {
            // Assign shipper to order
            $order->shipper_id = $shipper->id;
            $order->save();

            // Update shipper status to BUSY
            $shipper->status = 'BUSY';
            $shipper->is_available = false;
            $shipper->save();

            return [
                'success' => true,
                'shipper' => $shipper,
                'message' => 'Đã tìm thấy shipper gần nhất',
            ];
        }

        return [
            'success' => false,
            'shipper' => null,
            'message' => 'Không tìm thấy shipper rảnh trong khu vực',
        ];
    }

    /**
     * Release shipper after order completion
     */
    public function releaseShipper(Shipper $shipper)
    {
        $shipper->status = 'AVAILABLE';
        $shipper->is_available = true;
        $shipper->save();
    }
}
