import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Notify followers when a user logs in
 * This creates login activity notifications for followers
 */
export const notifyFollowersOfLogin = async (userId: string, username: string) => {
  try {
    // Get all followers of the user
    const followsQuery = query(
      collection(db, 'follows'),
      where('followingId', '==', userId)
    );
    
    const followsSnapshot = await getDocs(followsQuery);
    
    // Create notification for each follower
    const notificationPromises = followsSnapshot.docs.map(async (followDoc) => {
      const followData = followDoc.data();
      const followerId = followData.followerId;
      
      // Create a login activity notification
      await addDoc(collection(db, 'loginActivities'), {
        userId: followerId, // Who should see this notification
        actorId: userId, // Who logged in
        actorUsername: username,
        type: 'login',
        timestamp: new Date().toISOString(),
        read: false,
      });
    });
    
    await Promise.all(notificationPromises);
    console.log(`Login notification sent to ${followsSnapshot.size} followers`);
  } catch (error) {
    console.error('Error notifying followers of login:', error);
  }
};

/**
 * Get unread login activity count for a user
 */
export const getUnreadLoginActivityCount = async (userId: string): Promise<number> => {
  try {
    const loginActivitiesQuery = query(
      collection(db, 'loginActivities'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(loginActivitiesQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting login activity count:', error);
    return 0;
  }
};
