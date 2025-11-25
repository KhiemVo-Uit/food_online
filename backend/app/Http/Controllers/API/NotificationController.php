<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all notifications for current user
     */
    public function index(Request $request)
    {
        $notifications = $this->notificationService->getAllForUser(
            $request->user()->id
        );

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $notifications->where('is_read', false)->count(),
        ]);
    }

    /**
     * Get unread notifications
     */
    public function unread(Request $request)
    {
        $notifications = $this->notificationService->getUnreadForUser(
            $request->user()->id
        );

        return response()->json([
            'notifications' => $notifications,
            'count' => $notifications->count(),
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $this->notificationService->markAsRead($id, $request->user()->id);

        return response()->json([
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $count = $this->notificationService->markAllAsRead($request->user()->id);

        return response()->json([
            'message' => 'All notifications marked as read',
            'count' => $count,
        ]);
    }
}
