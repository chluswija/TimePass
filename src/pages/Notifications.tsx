import { useEffect, useState } from 'react';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
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

  useEffect(() => {
    if (!user) return;

    const notificationsData: Notification[] = [];
    let unsubscribeLikes: (() => void) | undefined;
    let unsubscribeComments: (() => void) | undefined;
    let unsubscribeFollows: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        // Listen to likes on user's posts
        const likesQuery = query(
          collection(db, 'likes'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        unsubscribeLikes = onSnapshot(likesQuery, async (snapshot) => {
          const likeNotifications: Notification[] = [];
          
          for (const likeDoc of snapshot.docs) {
            const likeData = likeDoc.data();
            
            // Check if this like is on current user's post
            const postDoc = await getDoc(doc(db, 'posts', likeData.postId));
            if (postDoc.exists() && postDoc.data().authorId === user.uid && likeData.userId !== user.uid) {
              const userDoc = await getDoc(doc(db, 'users', likeData.userId));
              const userData = userDoc.exists() ? userDoc.data() : {};
              
              likeNotifications.push({
                id: likeDoc.id,
                type: 'like',
                userId: likeData.userId,
                postId: likeData.postId,
                timestamp: likeData.timestamp,
                userName: userData.username || userData.displayName || 'Someone',
                userPhoto: userData.profilePicUrl || userData.photoURL,
                postImage: postDoc.data().mediaUrl
              });
            }
          }
          
          updateNotifications(likeNotifications, 'likes');
        });

        // Listen to comments on user's posts
        const commentsQuery = query(
          collection(db, 'comments'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        unsubscribeComments = onSnapshot(commentsQuery, async (snapshot) => {
          const commentNotifications: Notification[] = [];
          
          for (const commentDoc of snapshot.docs) {
            const commentData = commentDoc.data();
            
            // Check if this comment is on current user's post
            const postDoc = await getDoc(doc(db, 'posts', commentData.postId));
            if (postDoc.exists() && postDoc.data().authorId === user.uid && commentData.userId !== user.uid) {
              const userDoc = await getDoc(doc(db, 'users', commentData.userId));
              const userData = userDoc.exists() ? userDoc.data() : {};
              
              commentNotifications.push({
                id: commentDoc.id,
                type: 'comment',
                userId: commentData.userId,
                postId: commentData.postId,
                timestamp: commentData.timestamp,
                userName: userData.username || userData.displayName || 'Someone',
                userPhoto: userData.profilePicUrl || userData.photoURL,
                commentText: commentData.text,
                postImage: postDoc.data().mediaUrl
              });
            }
          }
          
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
          const followNotifications: Notification[] = [];
          
          for (const followDoc of snapshot.docs) {
            const followData = followDoc.data();
            const userDoc = await getDoc(doc(db, 'users', followData.followerId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            followNotifications.push({
              id: followDoc.id,
              type: 'follow',
              userId: followData.followerId,
              timestamp: followData.timestamp,
              userName: userData.username || userData.displayName || 'Someone',
              userPhoto: userData.profilePicUrl || userData.photoURL
            });
          }
          
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
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return `commented: ${notification.commentText}`;
      case 'follow':
        return 'started following you';
      default:
        return '';
    }
  };

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-2xl pt-6 pb-20 md:pb-6 px-4">
          <h1 className="text-2xl font-semibold mb-6">Notifications</h1>
          
          {loading ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                No notifications yet. When someone likes, comments on your posts, or follows you, you'll see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={
                    notification.type === 'follow'
                      ? `/profile/${notification.userId}`
                      : `/profile/${notification.userId}`
                  }
                  className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.userPhoto} />
                    <AvatarFallback>
                      {notification.userName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{notification.userName}</span>{' '}
                      <span className="text-muted-foreground">
                        {getNotificationText(notification)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    {notification.postImage && (
                      <img
                        src={notification.postImage}
                        alt="Post"
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Notifications;
