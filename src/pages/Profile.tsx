import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Share2, Edit3, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import EditProfileDialog from '@/components/Profile/EditProfileDialog';
import ShareProfileDialog from '@/components/Profile/ShareProfileDialog';
import FollowListDialog from '@/components/Profile/FollowListDialog';
import PostCard from '@/components/Post/PostCard';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Profile = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isFollowListOpen, setIsFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following'>('followers');

  const isOwnProfile = !userId || userId === user?.uid;

  const openFollowersList = () => {
    setFollowListType('followers');
    setIsFollowListOpen(true);
  };

  const openFollowingList = () => {
    setFollowListType('following');
    setIsFollowListOpen(true);
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const closePostModal = () => {
    setIsPostModalOpen(false);
    setSelectedPost(null);
  };

  useEffect(() => {
    const targetUserId = userId || user?.uid;
    if (!targetUserId) return;

    let unsubscribePosts: (() => void) | undefined;
    let unsubscribeReels: (() => void) | undefined;
    let unsubscribeSaved: (() => void) | undefined;

    const setupData = async () => {
      await fetchProfileData(targetUserId);
      unsubscribePosts = setupPostsListener(targetUserId);
      unsubscribeReels = setupReelsListener(targetUserId);
      if (isOwnProfile) {
        unsubscribeSaved = setupSavedPostsListener(targetUserId);
      }
    };

    setupData();

    return () => {
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeReels) unsubscribeReels();
      if (unsubscribeSaved) unsubscribeSaved();
    };
  }, [user, userId, isOwnProfile]);

  useEffect(() => {
    if (!user) return;

    const targetUserId = userId || user.uid;
    
    // Listen to follow status (only for other profiles)
    if (!isOwnProfile) {
      const checkFollowStatus = async () => {
        const followQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', user.uid),
          where('followingId', '==', targetUserId)
        );
        const followSnapshot = await getDocs(followQuery);
        setIsFollowing(!followSnapshot.empty);
      };
      checkFollowStatus();
    }

    // Listen to followers count (for all profiles including own)
    const followersQuery = query(
      collection(db, 'follows'),
      where('followingId', '==', targetUserId)
    );
    const unsubscribeFollowers = onSnapshot(followersQuery, (snapshot) => {
      setFollowersCount(snapshot.size);
    });

    // Listen to following count (for all profiles including own)
    const followingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', targetUserId)
    );
    const unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
      setFollowingCount(snapshot.size);
    });

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, [user, userId, isOwnProfile]);

  const fetchProfileData = async (targetUserId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      if (userDoc.exists()) {
        setProfileUser({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const setupPostsListener = (targetUserId: string) => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', targetUserId),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const allContent = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Filter posts (images and non-reel content)
        const postsData = allContent.filter((item: any) => 
          item.contentType === 'post' || (!item.contentType && item.mediaType !== 'video')
        );
        setPosts(postsData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching posts:', error);
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up posts listener:', error);
      setLoading(false);
    }
  };

  const setupReelsListener = (targetUserId: string) => {
    try {
      const reelsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', targetUserId),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(reelsQuery, (snapshot) => {
        const allContent = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Filter reels only
        const reelsData = allContent.filter((item: any) => item.contentType === 'reel');
        setReels(reelsData);
      }, (error) => {
        console.error('Error fetching reels:', error);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up reels listener:', error);
    }
  };

  const setupSavedPostsListener = (targetUserId: string) => {
    try {
      const savedQuery = query(
        collection(db, 'saves'),
        where('userId', '==', targetUserId),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(savedQuery, async (snapshot) => {
        const saves = snapshot.docs.map(doc => doc.data());
        if (saves.length > 0) {
          try {
            const savedPostsData: any[] = [];
            for (const save of saves) {
              const postDoc = await getDoc(doc(db, 'posts', save.postId));
              if (postDoc.exists()) {
                savedPostsData.push({
                  id: postDoc.id,
                  ...postDoc.data()
                });
              }
            }
            setSavedPosts(savedPostsData);
          } catch (error) {
            console.error('Error fetching saved posts:', error);
          }
        } else {
          setSavedPosts([]);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up saved posts listener:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || isOwnProfile) return;

    const targetUserId = userId || user.uid;

    try {
      if (isFollowing) {
        // Unfollow
        const followQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', user.uid),
          where('followingId', '==', targetUserId)
        );
        const followSnapshot = await getDocs(followQuery);
        followSnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        setIsFollowing(false);
        toast({ title: 'Unfollowed successfully' });
      } else {
        // Follow
        await addDoc(collection(db, 'follows'), {
          followerId: user.uid,
          followingId: targetUserId,
          timestamp: new Date().toISOString(),
        });
        setIsFollowing(true);
        toast({ title: 'Following successfully' });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({ title: 'Error', description: 'Failed to update follow status', variant: 'destructive' });
    }
  };

  if (!user) return null;

  const displayUser = profileUser || user;

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-4xl pt-6 pb-20 md:pb-6 px-4">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8 mb-8 pb-8 border-b border-border">
            {/* Avatar and Username - Mobile */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Avatar className="h-20 w-20 md:h-32 md:w-32">
                <AvatarImage src={displayUser.photoURL || displayUser.profilePicUrl || ''} />
                <AvatarFallback className="text-2xl md:text-3xl">
                  {(displayUser.displayName || displayUser.username)?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 md:hidden">
                <h1 className="text-xl font-light mb-1">{displayUser.displayName || displayUser.username || 'User'}</h1>
                {displayUser.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{displayUser.bio}</p>
                )}
              </div>
            </div>

            <div className="flex-1 w-full">
              {/* Username and Action Buttons - Desktop */}
              <div className="hidden md:flex items-center gap-4 mb-4">
                <h1 className="text-2xl font-light">{displayUser.displayName || displayUser.username || 'User'}</h1>
                {isOwnProfile ? (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsShareDialogOpen(true)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant={isFollowing ? 'secondary' : 'default'}
                      size="sm"
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsShareDialogOpen(true)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 mb-4">
                <div className="text-center md:text-left">
                  <div className="font-semibold">{posts.length + reels.length}</div>
                  <div className="text-sm text-muted-foreground">posts</div>
                </div>
                <button 
                  onClick={openFollowersList}
                  className="text-center md:text-left hover:opacity-70 transition-opacity cursor-pointer"
                >
                  <div className="font-semibold">{followersCount}</div>
                  <div className="text-sm text-muted-foreground">followers</div>
                </button>
                <button 
                  onClick={openFollowingList}
                  className="text-center md:text-left hover:opacity-70 transition-opacity cursor-pointer"
                >
                  <div className="font-semibold">{followingCount}</div>
                  <div className="text-sm text-muted-foreground">following</div>
                </button>
              </div>

              {/* Action Buttons - Mobile (after stats) */}
              <div className="flex md:hidden gap-2 mb-4">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="secondary"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => setIsShareDialogOpen(true)}
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={isFollowing ? 'secondary' : 'default'}
                      className="flex-1"
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => setIsShareDialogOpen(true)}
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </>
                )}
              </div>

              {/* Bio - Desktop */}
              <div className="hidden md:block">
                {displayUser.bio && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{displayUser.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs and Content Grid */}
          <div>
            {/* Tabs */}
            <div className="border-t border-border mb-4">
              <div className="flex justify-center gap-6 md:gap-8">
                <button 
                  className={`px-3 md:px-4 py-3 border-t-2 text-xs md:text-sm font-semibold transition-colors ${
                    activeTab === 'posts' 
                      ? 'border-foreground text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('posts')}
                >
                  POSTS
                </button>
                <button 
                  className={`px-3 md:px-4 py-3 border-t-2 text-xs md:text-sm font-semibold transition-colors ${
                    activeTab === 'reels' 
                      ? 'border-foreground text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('reels')}
                >
                  REELS
                </button>
                {isOwnProfile && (
                  <button 
                    className={`px-3 md:px-4 py-3 border-t-2 text-xs md:text-sm font-semibold transition-colors ${
                      activeTab === 'saved' 
                        ? 'border-foreground text-foreground' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('saved')}
                  >
                    SAVED
                  </button>
                )}
              </div>
            </div>

            {/* Posts Tab Content */}
            {activeTab === 'posts' && (
              <>
                {loading ? (
                  <div className="text-center py-10">Loading...</div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-2xl font-light mb-2">No Posts Yet</p>
                    <p className="text-muted-foreground">When you share photos, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {posts.map((post) => (
                      <div 
                        key={post.id} 
                        className="aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity relative group"
                        onClick={() => handlePostClick(post)}
                      >
                        {post.mediaType === 'video' ? (
                          <video src={post.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
                        )}
                        {/* Video indicator for posts */}
                        {post.mediaType === 'video' && (
                          <div className="absolute top-2 right-2 text-white">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Reels Tab Content */}
            {activeTab === 'reels' && (
              <>
                {loading ? (
                  <div className="text-center py-10">Loading...</div>
                ) : reels.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-2xl font-light mb-2">No Reels Yet</p>
                    <p className="text-muted-foreground">When you share reels, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {reels.map((reel) => (
                      <div key={reel.id} className="aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity relative group">
                        <video src={reel.mediaUrl} className="w-full h-full object-cover" />
                        {/* Reels indicator */}
                        <div className="absolute top-2 right-2 text-white">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        {/* Views/Likes overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex items-center gap-4 text-white">
                            <div className="flex items-center gap-1">
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                              <span className="font-semibold">{reel.likes || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Saved Tab Content */}
            {activeTab === 'saved' && isOwnProfile && (
              <>
                {loading ? (
                  <div className="text-center py-10">Loading...</div>
                ) : savedPosts.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-2xl font-light mb-2">No Saved Posts</p>
                    <p className="text-muted-foreground">When you save posts, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {savedPosts.map((post) => (
                      <div 
                        key={post.id} 
                        className="aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity relative group"
                        onClick={() => handlePostClick(post)}
                      >
                        {post.mediaType === 'video' ? (
                          <video src={post.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Edit Profile Dialog */}
          <EditProfileDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            user={displayUser}
            onSave={() => {
              const targetUserId = userId || user?.uid;
              if (targetUserId) {
                fetchProfileData(targetUserId);
              }
            }}
          />

          {/* Share Profile Dialog */}
          <ShareProfileDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            user={displayUser}
          />

          {/* Follow List Dialog */}
          <FollowListDialog
            isOpen={isFollowListOpen}
            onClose={() => setIsFollowListOpen(false)}
            userId={userId || user?.uid || ''}
            type={followListType}
          />

          {/* Fullscreen Post Modal */}
          <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
            <DialogContent className="max-w-5xl w-full h-[90vh] p-0 overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                  onClick={closePostModal}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Post Content */}
                {selectedPost && (
                  <div className="w-full h-full overflow-auto">
                    <PostCard post={selectedPost} />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Profile;
