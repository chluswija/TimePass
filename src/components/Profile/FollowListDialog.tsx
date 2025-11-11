import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface FollowListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

interface UserData {
  uid: string;
  username: string;
  profilePicUrl?: string;
  bio?: string;
}

const FollowListDialog = ({ isOpen, onClose, userId, type }: FollowListDialogProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen || !userId) return;
      
      setLoading(true);
      try {
        // Query the follows collection
        const followsQuery = type === 'followers'
          ? query(collection(db, 'follows'), where('followingId', '==', userId))
          : query(collection(db, 'follows'), where('followerId', '==', userId));
        
        const followsSnapshot = await getDocs(followsQuery);
        
        // Get user details for each follow
        const userPromises = followsSnapshot.docs.map(async (followDoc) => {
          const followData = followDoc.data();
          const targetUserId = type === 'followers' ? followData.followerId : followData.followingId;
          
          const userDoc = await getDoc(doc(db, 'users', targetUserId));
          if (userDoc.exists()) {
            return {
              uid: targetUserId,
              ...userDoc.data()
            } as UserData;
          }
          return null;
        });
        
        const usersData = await Promise.all(userPromises);
        setUsers(usersData.filter(u => u !== null) as UserData[]);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {type === 'followers' 
                  ? 'No followers yet' 
                  : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((userData) => (
                <Link
                  key={userData.uid}
                  to={`/profile/${userData.uid}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={userData.profilePicUrl} />
                    <AvatarFallback>
                      {userData.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {userData.username || 'User'}
                    </p>
                    {userData.bio && (
                      <p className="text-sm text-muted-foreground truncate">
                        {userData.bio}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowListDialog;
