import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { notifyFollowersOfLogin } from '@/lib/loginNotifications';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with username
      await updateProfile(user, {
        displayName: username,
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: username,
        email: email,
        profilePicUrl: '',
        bio: '',
        followers: [],
        following: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isOnline: true,
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login timestamp and online status
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString(),
        isOnline: true,
      });
      
      // Get user data and notify followers of login (async, don't wait)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Don't await this - let it run in background
        notifyFollowersOfLogin(user.uid, userData.username || user.displayName || 'User');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      // Update online status before logging out
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnline: false,
        });
      }
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
