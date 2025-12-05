import { useState, useEffect } from 'react';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, query, getDocs, where, orderBy, limit, onSnapshot, or, and, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const Messages = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

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
          .map(doc => ({ 
            id: doc.id, 
            uid: doc.id, // Ensure uid is set to document ID
            ...doc.data() 
          }))
          .filter((foundUser: any) => {
            // Filter out current user and match search query
            const userId = foundUser.uid || foundUser.id;
            const isNotCurrentUser = userId !== user?.uid;
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

  // Load conversations with real-time updates
  useEffect(() => {
    if (!user) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', user.uid),
        where('receiverId', '==', user.uid)
      ),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Group messages by conversation partner
      const conversationsMap = new Map();
      
      for (const msg of messagesList) {
        const partnerId = msg.senderId === user.uid ? msg.receiverId : msg.senderId;
        
        if (!conversationsMap.has(partnerId)) {
          // Fetch partner's user data
          try {
            const userDoc = await getDoc(doc(db, 'users', partnerId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            conversationsMap.set(partnerId, {
              id: partnerId,
              partnerId,
              name: userData.username || userData.displayName || 'User',
              profilePic: userData.profilePicUrl || userData.photoURL,
              lastMessage: msg.text,
              timestamp: msg.timestamp,
              unread: msg.senderId !== user.uid && !msg.read,
            });
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      }

      const conversationsArray = Array.from(conversationsMap.values())
        .sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return b.timestamp.toMillis() - a.timestamp.toMillis();
        });
      
      setConversations(conversationsArray);
      setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [user]);

  const showSearchResults = searchQuery.trim().length > 0;

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-4xl pt-6 pb-20 md:pb-6 px-4">
          {/* Header with title */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Messages</h1>
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
                  {searchResults.map((foundUser) => {
                    const chatUserId = foundUser.uid || foundUser.id;
                    return (
                      <Link
                        key={foundUser.id}
                        to={`/messages/${chatUserId}`}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={foundUser.profilePicUrl || foundUser.photoURL} />
                          <AvatarFallback>
                            {(foundUser.username || foundUser.displayName)?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">
                            {foundUser.username || foundUser.displayName || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground/80 mt-0.5 font-mono">
                            ID: {chatUserId}
                          </p>
                          {foundUser.email && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {foundUser.email}
                            </p>
                          )}
                          {foundUser.bio && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {foundUser.bio}
                            </p>
                          )}
                        </div>
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">
                    No users found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          ) : loadingConversations ? (
            // Loading State
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="text-muted-foreground mt-4">Loading conversations...</p>
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
            // Conversations List with Real Data
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-muted-foreground px-2 mb-3">Recent Chats</h2>
              {conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/messages/${conversation.partnerId}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.profilePic} />
                    <AvatarFallback>
                      {conversation.name[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{conversation.name}</p>
                        <p className="text-xs text-muted-foreground/70 font-mono truncate">
                          ID: {conversation.partnerId}
                        </p>
                      </div>
                      {conversation.timestamp && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatDistanceToNow(conversation.timestamp.toDate(), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unread && (
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Messages;
