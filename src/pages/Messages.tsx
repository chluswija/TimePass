import { useState } from 'react';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Messages = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations] = useState<any[]>([]); // Empty for now, will be populated with real data later

  const filteredConversations = conversations.filter((conv) =>
    conv?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-4xl pt-6 pb-20 md:pb-6 px-4">
          {/* Header with title and new message button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Messages</h1>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Edit className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Messages List */}
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted rounded-full p-6 mb-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Start a conversation with your friends and stay connected!
              </p>
              <Button variant="default" className="gap-2">
                <Edit className="h-4 w-4" />
                New Message
              </Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                No conversations found matching "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                >
                  {/* Conversation UI will be implemented here */}
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
