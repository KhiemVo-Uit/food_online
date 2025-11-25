<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Shipper;
use Illuminate\Http\Request;

class ShipperController extends Controller
{
    /**
     * Update shipper location
     */
    public function updateLocation(Request $request)
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $shipper = Shipper::where('user_id', $request->user()->id)->firstOrFail();
        
        $shipper->update([
            'current_latitude' => $validated['latitude'],
            'current_longitude' => $validated['longitude'],
        ]);

        return response()->json([
            'message' => 'Location updated successfully',
            'shipper' => $shipper,
        ]);
    }

    /**
     * Update shipper status
     */
    public function updateStatus(Request $request)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:OFFLINE,AVAILABLE,BUSY'],
        ]);

        $shipper = Shipper::where('user_id', $request->user()->id)->firstOrFail();
        
        $shipper->update([
            'status' => $validated['status'],
            'is_available' => $validated['status'] === 'AVAILABLE',
        ]);

        return response()->json([
            'message' => 'Status updated successfully',
            'shipper' => $shipper,
        ]);
    }

    /**
     * Get shipper profile
     */
    public function getProfile(Request $request)
    {
        $shipper = Shipper::with('user')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json($shipper);
    }
}
