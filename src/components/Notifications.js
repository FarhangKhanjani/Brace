import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { IoMdNotifications } from 'react-icons/io';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) return;
                
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                    
                if (error) throw error;
                
                setNotifications(data || []);
                setUnreadCount(data.filter(n => !n.read).length);
                
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchNotifications();
        
        // Set up real-time subscription with correct auth
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;
            
            const subscription = supabase
                .channel('notifications_channel')
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    setNotifications(prev => [payload.new, ...prev.slice(0, 9)]);
                    setUnreadCount(prev => prev + 1);
                })
                .subscribe();
            
            return subscription;
        };
        
        let subscription;
        setupSubscription().then(sub => {
            subscription = sub;
        });
        
        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);
    
    const handleMarkAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);
                
            if (error) throw error;
            
            setNotifications(notifications.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            ));
            
            setUnreadCount(prev => Math.max(0, prev - 1));
            
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };
    
    const handleMarkAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;
            
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);
                
            if (error) throw error;
            
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };
    
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    };
    
    return (
        <div className="notifications-component">
            <button 
                className={`notifications-icon ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <IoMdNotifications />
                {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount}</span>
                )}
            </button>
            
            {showDropdown && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                className="mark-all-read"
                                onClick={handleMarkAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="notifications-list">
                        {loading ? (
                            <div className="loading-message">Loading notifications...</div>
                        ) : notifications.length === 0 ? (
                            <div className="empty-message">No notifications yet</div>
                        ) : (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id}
                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                    onClick={() => handleMarkAsRead(notification.id)}
                                >
                                    <div className="notification-header">
                                        <h4>{notification.title}</h4>
                                        <span className="timestamp">{formatTime(notification.created_at)}</span>
                                    </div>
                                    <p className="notification-message">{notification.message}</p>
                                    {notification.order_details && (
                                        <div className={`order-result ${parseFloat(notification.order_details.profit_loss) >= 0 ? 'profit' : 'loss'}`}>
                                            {parseFloat(notification.order_details.profit_loss) >= 0 ? '+' : ''}
                                            {notification.order_details.profit_loss}%
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="notifications-footer">
                        <button onClick={() => setShowDropdown(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications; 