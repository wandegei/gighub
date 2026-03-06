import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { supabase } from "../../lib/supabaseClient";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (userEmail) {
      loadNotifications();
    }
  }, [userEmail]);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_date", { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (notification) => {
    if (!notification.is_read) {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notification.id);

        if (error) throw error;

        loadNotifications();
      } catch (error) {
        console.error("Error updating notification:", error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.is_read)
        .map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);

      if (error) throw error;

      loadNotifications();
    } catch (error) {
      console.error("Error marking all notifications read:", error);
    }
  };

  const typeColors = {
    job: "bg-blue-500",
    payment: "bg-green-500",
    review: "bg-yellow-500",
    order: "bg-purple-500",
    system: "bg-gray-500",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-[#1A1D2E] transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF6633] text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 bg-[#1A1D2E] border-[#2A2D3E]"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2A2D3E]">
          <h3 className="text-white font-semibold">Notifications</h3>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[#FF6633] text-sm hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-[#FF6633] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  markAsRead(notification);

                  if (notification.link) {
                    window.location.href = createPageUrl(notification.link);
                  }

                  setOpen(false);
                }}
                className={`p-4 border-b border-[#2A2D3E] cursor-pointer hover:bg-[#0F1117] transition-colors ${
                  !notification.is_read ? "bg-[#FF6633]/5" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      typeColors[notification.type] || typeColors.system
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        notification.is_read
                          ? "text-gray-400"
                          : "text-white font-medium"
                      }`}
                    >
                      {notification.title}
                    </p>

                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                      {notification.message}
                    </p>

                    <p className="text-gray-600 text-xs mt-1">
                      {format(
                        new Date(notification.created_date),
                        "MMM d, h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No notifications</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[#2A2D3E]">
          <Link
            to={createPageUrl("DashboardNotifications")}
            onClick={() => setOpen(false)}
          >
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
            >
              View All Notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}