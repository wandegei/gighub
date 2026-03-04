import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Bell, Check, Trash2, Briefcase, CreditCard, Star, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const typeConfig = {
  job: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  payment: { icon: CreditCard, color: 'text-green-400', bg: 'bg-green-400/10' },
  review: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  order: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  system: { icon: Settings, color: 'text-gray-400', bg: 'bg-gray-400/10' }
};

export default function DashboardNotifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    
    const data = await base44.entities.Notification.filter({ user_email: userData.email }, '-created_date');
    setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (notification) => {
    await base44.entities.Notification.update(notification.id, { is_read: true });
    loadData();
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    loadData();
  };

  const deleteNotification = async (id) => {
    await base44.entities.Notification.delete(id);
    loadData();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#2A2D3E] rounded w-48" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[#2A2D3E] rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-500">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="border-[#2A2D3E] text-white hover:bg-[#1A1D2E]">
            <Check className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map(notification => {
            const config = typeConfig[notification.type] || typeConfig.system;
            const Icon = config.icon;
            
            return (
              <div
                key={notification.id}
                className={`card-dark p-4 flex items-start gap-4 ${!notification.is_read ? 'border-l-2 border-l-[#FF6633]' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${notification.is_read ? 'text-gray-400' : 'text-white'}`}>
                        {notification.title}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">{notification.message}</p>
                      <p className="text-gray-600 text-xs mt-2">
                        {format(new Date(notification.created_date), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {notification.link && (
                        <Link to={createPageUrl(notification.link)} onClick={() => markAsRead(notification)}>
                          <Button size="sm" variant="ghost" className="text-[#FF6633] hover:text-[#E55A2B]">
                            View
                          </Button>
                        </Link>
                      )}
                      {!notification.is_read && (
                        <Button size="sm" variant="ghost" onClick={() => markAsRead(notification)} className="text-gray-500 hover:text-white">
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteNotification(notification.id)} className="text-gray-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-dark p-12 text-center">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}