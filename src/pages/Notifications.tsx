import { useEffect, useState } from 'react';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit, getDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, LogIn, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'login';
  userId: string;
  postId?: string;
  timestamp: string;
  userName?: string;
  userPhoto?: string;
  commentText?: string;
  postImage?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [userCache, setUserCache] = useState<Map<string, any>>(new Map());
  const [postCache, setPostCache] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (!user) return;

    let unsubscribeLikes: (() => void) | undefined;
    let unsubscribeComments: (() => void) | undefined;
    let unsubscribeFollows: (() => void) | undefined;
    let unsubscribeLoginActivities: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        // Pre-fetch user's posts for faster lookup
        const userPostsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', user.uid)
        );
        const userPostsSnapshot = await getDocs(userPostsQuery);
        const userPostIds = new Set(userPostsSnapshot.docs.map(doc => doc.id));

        // Listen to login activities
        const loginActivitiesQuery = query(
          collection(db, 'loginActivities'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        
        unsubscribeLoginActivities = onSnapshot(loginActivitiesQuery, async (snapshot) => {
          const loginNotifications: Notification[] = [];
          const userIds = new Set<string>();
          
          snapshot.docs.forEach(loginDoc => {
            const loginData = loginDoc.data();
            userIds.add(loginData.actorId);
          });

          // Batch fetch all users at once
          await Promise.all(
            Array.from(userIds).map(async (userId) => {
              if (!userCache.has(userId)) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  setUserCache(prev => new Map(prev).set(userId, userDoc.data()));
                }
              }
            })
          );
          
          snapshot.docs.forEach(loginDoc => {
            const loginData = loginDoc.data();
            const userData = userCache.get(loginData.actorId) || {};
            
            loginNotifications.push({
              id: loginDoc.id,
              type: 'login',
              userId: loginData.actorId,
              timestamp: loginData.timestamp,
              userName: loginData.actorUsername || userData.username || userData.displayName || 'Someone',
              userPhoto: userData.profilePicUrl || userData.photoURL
            });
          });
          
          updateNotifications(loginNotifications, 'logins');
        });

        // Listen to likes on user's posts
        const likesQuery = query(
          collection(db, 'likes'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        unsubscribeLikes = onSnapshot(likesQuery, async (snapshot) => {
          const relevantLikes = snapshot.docs.filter(
            doc => userPostIds.has(doc.data().postId) && doc.data().userId !== user.uid
          );

          const userIds = new Set<string>();
          const postIds = new Set<string>();
          
          relevantLikes.forEach(likeDoc => {
            const likeData = likeDoc.data();
            userIds.add(likeData.userId);
            postIds.add(likeData.postId);
          });

          // Batch fetch all users and posts
          await Promise.all([
            ...Array.from(userIds).map(async (userId) => {
              if (!userCache.has(userId)) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  setUserCache(prev => new Map(prev).set(userId, userDoc.data()));
                }
              }
            }),
            ...Array.from(postIds).map(async (postId) => {
              if (!postCache.has(postId)) {
                const postDoc = await getDoc(doc(db, 'posts', postId));
                if (postDoc.exists()) {
                  setPostCache(prev => new Map(prev).set(postId, postDoc.data()));
                }
              }
            })
          ]);

          const likeNotifications: Notification[] = relevantLikes.map(likeDoc => {
            const likeData = likeDoc.data();
            const userData = userCache.get(likeData.userId) || {};
            const postData = postCache.get(likeData.postId) || {};
            
            return {
              id: likeDoc.id,
              type: 'like',
              userId: likeData.userId,
              postId: likeData.postId,
              timestamp: likeData.timestamp,
              userName: userData.username || userData.displayName || 'Someone',
              userPhoto: userData.profilePicUrl || userData.photoURL,
              postImage: postData.mediaUrl
            };
          });
          
          updateNotifications(likeNotifications, 'likes');
        });

        // Listen to comments on user's posts
        const commentsQuery = query(
          collection(db, 'comments'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        unsubscribeComments = onSnapshot(commentsQuery, async (snapshot) => {
          const relevantComments = snapshot.docs.filter(
            doc => userPostIds.has(doc.data().postId) && doc.data().userId !== user.uid
          );

          const userIds = new Set<string>();
          const postIds = new Set<string>();
          
          relevantComments.forEach(commentDoc => {
            const commentData = commentDoc.data();
            userIds.add(commentData.userId);
            postIds.add(commentData.postId);
          });

          // Batch fetch all users and posts
          await Promise.all([
            ...Array.from(userIds).map(async (userId) => {
              if (!userCache.has(userId)) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  setUserCache(prev => new Map(prev).set(userId, userDoc.data()));
                }
              }
            }),
            ...Array.from(postIds).map(async (postId) => {
              if (!postCache.has(postId)) {
                const postDoc = await getDoc(doc(db, 'posts', postId));
                if (postDoc.exists()) {
                  setPostCache(prev => new Map(prev).set(postId, postDoc.data()));
                }
              }
            })
          ]);

          const commentNotifications: Notification[] = relevantComments.map(commentDoc => {
            const commentData = commentDoc.data();
            const userData = userCache.get(commentData.userId) || {};
            const postData = postCache.get(commentData.postId) || {};
            
            return {
              id: commentDoc.id,
              type: 'comment',
              userId: commentData.userId,
              postId: commentData.postId,
              timestamp: commentData.timestamp,
              userName: userData.username || userData.displayName || 'Someone',
              userPhoto: userData.profilePicUrl || userData.photoURL,
              commentText: commentData.text,
              postImage: postData.mediaUrl
            };
          });
          
          updateNotifications(commentNotifications, 'comments');
        });

        // Listen to new followers
        const followsQuery = query(
          collection(db, 'follows'),
          where('followingId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        unsubscribeFollows = onSnapshot(followsQuery, async (snapshot) => {
          const userIds = new Set<string>();
          
          snapshot.docs.forEach(followDoc => {
            const followData = followDoc.data();
            userIds.add(followData.followerId);
          });

          // Batch fetch all users
          await Promise.all(
            Array.from(userIds).map(async (userId) => {
              if (!userCache.has(userId)) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  setUserCache(prev => new Map(prev).set(userId, userDoc.data()));
                }
              }
            })
          );

          const followNotifications: Notification[] = snapshot.docs.map(followDoc => {
            const followData = followDoc.data();
            const userData = userCache.get(followData.followerId) || {};
            
            return {
              id: followDoc.id,
              type: 'follow',
              userId: followData.followerId,
              timestamp: followData.timestamp,
              userName: userData.username || userData.displayName || 'Someone',
              userPhoto: userData.profilePicUrl || userData.photoURL
            };
          });
          
          updateNotifications(followNotifications, 'follows');
        });

        setLoading(false);
      } catch (error) {
        console.error('Error setting up notification listeners:', error);
        setLoading(false);
      }
    };

    const updateNotifications = (newNotifs: Notification[], type: string) => {
      setNotifications(prev => {
        const filtered = prev.filter(n => {
          if (type === 'likes') return n.type !== 'like';
          if (type === 'comments') return n.type !== 'comment';
          if (type === 'follows') return n.type !== 'follow';
          if (type === 'logins') return n.type !== 'login';
          return true;
        });
        
        const combined = [...filtered, ...newNotifs];
        return combined.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    };

    setupListeners();

    return () => {
      if (unsubscribeLikes) unsubscribeLikes();
      if (unsubscribeComments) unsubscribeComments();
      if (unsubscribeFollows) unsubscribeFollows();
      if (unsubscribeLoginActivities) unsubscribeLoginActivities();
    };
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 fill-red-500 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'login':
        return <LogIn className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    return notification.userId;
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups: { [key: string]: Notification[] } = {
      today: [],
      yesterday: [],
      earlier: []
    };
    
    notifications.forEach(notification => {
      const notifDate = new Date(notification.timestamp);
      notifDate.setHours(0, 0, 0, 0);
      
      if (notifDate.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });
    
    return groups;
  };

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter(n => !dismissedNotifications.has(n.id));
  const groupedNotifications = groupNotificationsByDate(visibleNotifications);

  const handleDismissNotification = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedNotifications(prev => new Set(prev).add(notificationId));
  };

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-2xl pt-6 pb-20 md:pb-6 px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold">Notifications</h1>
            {!loading && visibleNotifications.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {visibleNotifications.length} notification{visibleNotifications.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="text-muted-foreground mt-4">Loading notifications...</p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-muted rounded-full p-6 inline-block mb-4">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                When someone likes, comments on your posts, or follows you, you'll see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Today's Notifications */}
              {groupedNotifications.today.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Today</h2>
                  <div className="space-y-1 bg-card rounded-lg border">
                    {groupedNotifications.today.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`relative group ${
                          index !== groupedNotifications.today.length - 1 ? 'border-b' : ''
                        }`}
                      >
                        <Link
                          to={`/profile/${notification.userId}`}
                          className="flex items-center gap-3 p-3 md:p-4 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-12 w-12 md:h-14 md:w-14 ring-2 ring-background">
                            <AvatarImage src={notification.userPhoto} />
                            <AvatarFallback className="text-lg">
                              {notification.userName?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-semibold">
                              {notification.userName}
                            </p>
                            <p className="text-xs text-muted-foreground/80 font-mono mt-1">
                              ID: {getNotificationText(notification)}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                            {notification.postImage && (
                              <img
                                src={notification.postImage}
                                alt="Post"
                                className="w-12 h-12 md:w-14 md:h-14 object-cover rounded border-2 border-background"
                              />
                            )}
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                          onClick={(e) => handleDismissNotification(notification.id, e)}
                          title="Dismiss notification"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yesterday's Notifications */}
              {groupedNotifications.yesterday.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Yesterday</h2>
                  <div className="space-y-1 bg-card rounded-lg border">
                    {groupedNotifications.yesterday.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`relative group ${
                          index !== groupedNotifications.yesterday.length - 1 ? 'border-b' : ''
                        }`}
                      >
                        <Link
                          to={`/profile/${notification.userId}`}
                          className="flex items-center gap-3 p-3 md:p-4 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-12 w-12 md:h-14 md:w-14 ring-2 ring-background">
                            <AvatarImage src={notification.userPhoto} />
                            <AvatarFallback className="text-lg">
                              {notification.userName?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-semibold">
                              {notification.userName}
                            </p>
                            <p className="text-xs text-muted-foreground/80 font-mono mt-1">
                              ID: {getNotificationText(notification)}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                            {notification.postImage && (
                              <img
                                src={notification.postImage}
                                alt="Post"
                                className="w-12 h-12 md:w-14 md:h-14 object-cover rounded border-2 border-background"
                              />
                            )}
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                          onClick={(e) => handleDismissNotification(notification.id, e)}
                          title="Dismiss notification"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Earlier Notifications */}
              {groupedNotifications.earlier.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Earlier</h2>
                  <div className="space-y-1 bg-card rounded-lg border">
                    {groupedNotifications.earlier.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`relative group ${
                          index !== groupedNotifications.earlier.length - 1 ? 'border-b' : ''
                        }`}
                      >
                        <Link
                          to={`/profile/${notification.userId}`}
                          className="flex items-center gap-3 p-3 md:p-4 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-12 w-12 md:h-14 md:w-14 ring-2 ring-background">
                            <AvatarImage src={notification.userPhoto} />
                            <AvatarFallback className="text-lg">
                              {notification.userName?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-semibold">
                              {notification.userName}
                            </p>
                            <p className="text-xs text-muted-foreground/80 font-mono mt-1">
                              ID: {getNotificationText(notification)}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                            {notification.postImage && (
                              <img
                                src={notification.postImage}
                                alt="Post"
                                className="w-12 h-12 md:w-14 md:h-14 object-cover rounded border-2 border-background"
                              />
                            )}
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                          onClick={(e) => handleDismissNotification(notification.id, e)}
                          title="Dismiss notification"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Notifications;
