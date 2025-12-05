import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDoc,
  doc,
  or,
  and,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
  read?: boolean;
}

const Chat = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch other user's profile
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setOtherUser({ id: userDoc.id, ...userDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [userId]);

  // Listen to messages
  useEffect(() => {
    if (!user || !userId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      or(
        and(
          where('senderId', '==', user.uid),
          where('receiverId', '==', userId)
        ),
        and(
          where('senderId', '==', userId),
          where('receiverId', '==', user.uid)
        )
      ),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData);
      setLoading(false);

      // Mark received messages as read
      const unreadMessages = snapshot.docs.filter(
        doc => doc.data().receiverId === user.uid && !doc.data().read
      );
      
      for (const msgDoc of unreadMessages) {
        try {
          await updateDoc(doc(db, 'messages', msgDoc.id), { read: true });
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [user, userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userId) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: userId,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat Header */}
        <div className="sticky top-16 z-10 border-b bg-background">
          <div className="container mx-auto max-w-4xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/messages')}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {otherUser && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser.profilePicUrl || otherUser.photoURL} />
                    <AvatarFallback>
                      {(otherUser.username || otherUser.displayName)?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-semibold">
                      {otherUser.username || otherUser.displayName || 'User'}
                    </h2>
                    <p className="text-xs text-muted-foreground/70 font-mono">
                      ID: {userId}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            {loading ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Send a message to start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {messages.map((message, index) => {
                  const isMyMessage = message.senderId === user?.uid;
                  const showDateSeparator = index === 0 || 
                    (message.timestamp && messages[index - 1]?.timestamp && 
                     format(message.timestamp.toDate(), 'yyyy-MM-dd') !== 
                     format(messages[index - 1].timestamp.toDate(), 'yyyy-MM-dd'));
                  
                  return (
                    <div key={message.id}>
                      {showDateSeparator && message.timestamp && (
                        <div className="flex justify-center my-4">
                          <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                            {format(message.timestamp.toDate(), 'MMMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                            isMyMessage
                              ? 'bg-[#005c4b] text-white rounded-tr-none'
                              : 'bg-muted rounded-tl-none'
                          }`}
                        >
                          <p className="text-[15px] break-words leading-relaxed">{message.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {message.timestamp && (
                              <span
                                className={`text-[11px] ${
                                  isMyMessage
                                    ? 'text-white/70'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {format(message.timestamp.toDate(), 'HH:mm')}
                              </span>
                            )}
                            {isMyMessage && (
                              <span className="ml-1">
                                {message.read ? (
                                  <CheckCheck className="h-4 w-4 text-blue-400" />
                                ) : (
                                  <Check className="h-4 w-4 text-white/70" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 border-t bg-background pb-20 md:pb-6">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 rounded-full"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim()}
                className="rounded-full h-10 w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </SidebarNavigation>
  );
};

export default Chat;
