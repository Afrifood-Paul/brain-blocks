import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "react-toastify";

import { apiClient, type AppNotification } from "@/services/api";

type NotificationsBellProps = {
  userId?: string;
};

export default function NotificationsBell({ userId }: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const loadNotifications = useCallback(
    async (force = false) => {
      if (!userId) return;

      try {
        const res = await apiClient.getNotifications(userId, force);
        setNotifications(res.notifications || []);
      } catch {
        setNotifications([]);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (notificationId: string) => {
    try {
      const res = await apiClient.markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId ? res.notification : notification,
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to mark notification as read");
    }
  };

  const updateInvite = async (notification: AppNotification, action: "accept" | "decline") => {
    if (!notification.inviteId) return;

    try {
      if (action === "accept") {
        await apiClient.acceptInvite(notification.inviteId);
      } else {
        await apiClient.declineInvite(notification.inviteId);
      }

      await markRead(notification._id);
      await loadNotifications(true);
      toast.success(action === "accept" ? "Invite accepted" : "Invite declined");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update invite");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full bg-[#111] p-2 text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute -left-14 top-12 z-50 w-80 -translate-x-1/2 rounded border border-slate-200 bg-white p-3 text-slate-950 shadow-xl">
          <h3 className="mb-2 text-sm font-bold">Notifications</h3>
          {notifications.length ? (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification._id} className="rounded bg-slate-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => markRead(notification._id)}
                        className="shrink-0 text-xs font-semibold text-[#0B2177]"
                      >
                        Read
                      </button>
                    )}
                  </div>

                  {notification.invite?.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateInvite(notification, "accept")}
                        className="rounded bg-[#47B312] px-3 py-1 text-xs font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateInvite(notification, "decline")}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded bg-slate-100 p-3 text-sm text-slate-500">No notifications yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
