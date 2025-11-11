import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        
        // Show enhanced welcome notification with Sonner (better looking)
        sonnerToast.success('Welcome back! 👋', {
          description: `You're now logged in. Happy scrolling!`,
          duration: 4000,
        });
        
        // Also show traditional toast for consistency
        toast({
          title: '🎉 Welcome Back!',
          description: 'You have successfully logged in to Timepass',
        });
      } else {
        if (!username) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Username is required',
          });
          setLoading(false);
          return;
        }
        await signup(email, password, username);
        
        // Welcome message for new users
        sonnerToast.success('Account Created! 🎊', {
          description: `Welcome to Timepass, ${username}! Start sharing your moments.`,
          duration: 5000,
        });
        
        toast({
          title: '🎉 Welcome to Timepass!',
          description: 'Your account has been created successfully',
        });
      }
      navigate('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">Timepass</CardTitle>
          <CardDescription>
            {isLogin ? 'Login to see photos and videos from your friends' : 'Sign up to see photos and videos from your friends'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
            {!isLogin && (
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
              />
            )}
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
