import { useState, useEffect } from 'react';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Heart, MessageCircle } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);

  // Load posts for grid display
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const postsQuery = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          limit(30)
        );
        const postsSnapshot = await getDocs(postsQuery);
        
        const postsData = postsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          // Filter out stories, only show posts and reels
          .filter((post: any) => post.contentType !== 'story');
        
        setPosts(postsData);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };

    loadPosts();
  }, []);

  useEffect(() => {
    const searchContent = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Search for users only
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef);
        const usersSnapshot = await getDocs(usersQuery);
        
        const users = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((user: any) => 
            user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        
        setSearchResults(users);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchContent, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-4xl pt-6 pb-20 md:pb-6 px-4">
          <div className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results or Posts Grid */}
          {searchQuery ? (
            isLoading ? (
              <div className="text-center py-10">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.uid}`}
                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profilePicUrl} />
                      <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{user.username}</p>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )
          ) : (
            // Posts Grid (Instagram-style Explore)
            <div>
              {postsLoading ? (
                <div className="text-center py-10">Loading posts...</div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 md:gap-2">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/profile/${post.authorId}`}
                      className="aspect-square relative group overflow-hidden bg-muted"
                    >
                      {post.mediaType === 'video' ? (
                        <video
                          src={post.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.caption || 'Post'}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Video indicator */}
                      {post.mediaType === 'video' && (
                        <div className="absolute top-2 right-2 text-white">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      )}
                      
                      {/* Hover overlay with stats */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-white">
                          <Heart className="w-6 h-6 fill-white" />
                          <span className="font-semibold">{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <MessageCircle className="w-6 h-6 fill-white" />
                          <span className="font-semibold">{post.comments || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">No posts yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Posts and reels will appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Search;
