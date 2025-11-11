import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import StoryPreview from '@/components/Story/StoryPreview';
import PostCard from '@/components/Post/PostCard';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';

const Feed = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    let unsubscribeStories: (() => void) | null = null;
    let unsubscribePosts: (() => void) | null = null;

    const setupListeners = async () => {
      try {
        // Fetch user profile data
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        }
        // Real-time listener for stories (only story-type videos)
        const storiesQuery = query(
          collection(db, 'posts'),
          where('contentType', '==', 'story'),
          orderBy('timestamp', 'desc'),
          limit(12)
        );
        unsubscribeStories = onSnapshot(storiesQuery, (snapshot) => {
          const storiesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setStories(storiesData);
        });

        // Real-time listener for posts and reels (exclude stories)
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
          const postsData = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            // Filter out stories on client side to avoid index issues
            .filter((post: any) => post.contentType !== 'story');
          setPosts(postsData);
        });

        setLoading(false);
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeStories) unsubscribeStories();
      if (unsubscribePosts) unsubscribePosts();
    };
  }, [user]);

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-2xl pt-6 pb-20 md:pb-6">
          {/* Stories Section */}
          {!loading && (stories.length > 0 || user) && (
            <div className="mb-8">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth">
                {/* Your Story */}
                {user && (
                  <div className="flex-shrink-0 snap-start">
                    <StoryPreview
                      story={{
                        id: 'your-story',
                        authorId: user.uid,
                        author: {
                          username: 'Your Story',
                          profilePic: userProfile?.profilePicUrl || user.photoURL || '',
                        },
                        mediaUrl: '',
                        timestamp: new Date().toISOString(),
                      }}
                      isOwnStory={true}
                      userName={user.displayName || userProfile?.username || 'User'}
                    />
                  </div>
                )}

                {/* Other Stories */}
                {stories.map(story => (
                  <div key={story.id} className="flex-shrink-0 snap-start">
                    <StoryPreview story={story} isOwnStory={false} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {!loading && (stories.length > 0 || user) && posts.length > 0 && (
            <div className="my-8 border-t border-border" />
          )}

          {/* Posts Section */}
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-semibold mb-3">Welcome to Timepass!</h2>
                <p className="text-muted-foreground mb-6">
                  Create stories, share reels, and connect with friends.
                </p>
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    📹 Click "Your Story" to create a story
                  </p>
                  <p className="text-sm text-muted-foreground">
                    🎬 Visit the Reels section to watch videos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ➕ Use the Create button to share content
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Feed;
