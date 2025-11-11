import { useState, useEffect } from 'react';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [conversations] = useState<any[]>([]); // Empty for now, will be populated with real data later

  // Search for users when typing
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef);
        const usersSnapshot = await getDocs(usersQuery);
        
        const users = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((foundUser: any) => {
            // Filter out current user and match search query
            const isNotCurrentUser = foundUser.uid !== user?.uid;
            const matchesSearch = 
              foundUser.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              foundUser.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              foundUser.email?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return isNotCurrentUser && matchesSearch;
          });
        
        setSearchResults(users);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const showSearchResults = searchQuery.trim().length > 0;

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-4xl pt-6 pb-20 md:pb-6 px-4">
          {/* Header with title and new message button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Messages</h1>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <Edit className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Bar - Always Visible */}
          <div className="mb-6 sticky top-0 z-10 bg-background pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search people to message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-12 bg-muted/50 border border-border focus-visible:ring-2 focus-visible:ring-primary rounded-lg text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Searching for "{searchQuery}"...
              </p>
            )}
          </div>

          {/* Search Results or Messages List */}
          {showSearchResults ? (
            // User Search Results
            <div>
              {isSearching ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((foundUser) => (
                    <Link
                      key={foundUser.id}
                      to={`/profile/${foundUser.uid}`}
                      className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={foundUser.profilePicUrl || foundUser.photoURL} />
                        <AvatarFallback>
                          {(foundUser.username || foundUser.displayName)?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {foundUser.username || foundUser.displayName || 'User'}
                          </p>
                          {foundUser.uid && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              ID: {foundUser.uid.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                        {foundUser.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {foundUser.email}
                          </p>
                        )}
                        {foundUser.bio && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {foundUser.bio}
                          </p>
                        )}
                      </div>
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">
                    No users found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          ) : conversations.length === 0 ? (
            // Empty State - No Conversations
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted rounded-full p-6 mb-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Search for people to start a conversation!
              </p>
            </div>
          ) : (
            // Conversations List (future implementation)
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{conversation.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Messages;
