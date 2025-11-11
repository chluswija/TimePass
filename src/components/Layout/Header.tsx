import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from './BackButton';
import { MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  // Check if the current route matches
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!user) return;

    let unsubscribeLikes: (() => void) | undefined;
    let unsubscribeComments: (() => void) | undefined;
    let unsubscribeFollows: (() => void) | undefined;

    const setupNotificationListeners = async () => {
      let count = 0;

      // Listen to likes on user's posts
      const likesQuery = query(
        collection(db, 'likes'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      unsubscribeLikes = onSnapshot(likesQuery, async (snapshot) => {
        let likeCount = 0;
        
        for (const likeDoc of snapshot.docs) {
          const likeData = likeDoc.data();
          const postDoc = await getDoc(doc(db, 'posts', likeData.postId));
          if (postDoc.exists() && postDoc.data().authorId === user.uid && likeData.userId !== user.uid) {
            likeCount++;
          }
        }
        
        updateCount('likes', likeCount);
      });

      // Listen to comments on user's posts
      const commentsQuery = query(
        collection(db, 'comments'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      unsubscribeComments = onSnapshot(commentsQuery, async (snapshot) => {
        let commentCount = 0;
        
        for (const commentDoc of snapshot.docs) {
          const commentData = commentDoc.data();
          const postDoc = await getDoc(doc(db, 'posts', commentData.postId));
          if (postDoc.exists() && postDoc.data().authorId === user.uid && commentData.userId !== user.uid) {
            commentCount++;
          }
        }
        
        updateCount('comments', commentCount);
      });

      // Listen to new followers
      const followsQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      unsubscribeFollows = onSnapshot(followsQuery, (snapshot) => {
        updateCount('follows', snapshot.size);
      });
    };

    const counts: { [key: string]: number } = {
      likes: 0,
      comments: 0,
      follows: 0
    };

    const updateCount = (type: string, value: number) => {
      counts[type] = value;
      const total = counts.likes + counts.comments + counts.follows;
      setNotificationCount(total);
    };

    setupNotificationListeners();

    return () => {
      if (unsubscribeLikes) unsubscribeLikes();
      if (unsubscribeComments) unsubscribeComments();
      if (unsubscribeFollows) unsubscribeFollows();
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BackButton />
            <Link to="/" className="text-2xl font-bold">
              Timepass
            </Link>
          </div>

          {/* Mobile-only Messages and Notifications icons */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/notifications" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 transition-colors',
                  isActive('/notifications')
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:bg-muted'
                )}
                title="Notifications"
                aria-label="Notifications"
              >
                <Heart className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/messages" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 transition-colors',
                  isActive('/messages')
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:bg-muted'
                )}
                title="Messages"
                aria-label="Messages"
              >
                <MessageCircle className="h-5 w-5" />
                {messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {messageCount > 9 ? '9+' : messageCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
