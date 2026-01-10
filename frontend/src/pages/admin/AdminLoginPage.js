import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AUTH_URL = 'https://auth.emergentagent.com';
const REDIRECT_URL = `${window.location.origin}/admin/dashboard`;

export default function AdminLoginPage({ onAuth }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for session_id in URL fragment
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      handleSessionId(hash);
    }
  }, []);

  const handleSessionId = async (hash) => {
    try {
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) return;

      // Call backend to process session
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Clean URL
        window.history.replaceState({}, document.title, '/admin/dashboard');
        
        // Refresh auth state
        onAuth();
        
        // Navigate to dashboard
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleLogin = () => {
    const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(REDIRECT_URL)}`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen luxury-gradient flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 elegant-card">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 gold-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{fontFamily: 'Playfair Display'}} data-testid="admin-login-title">
            Admin Login
          </h1>
          <p className="text-gray-600">Sign in to manage your store</p>
        </div>

        <Button
          onClick={handleLogin}
          className="luxury-button w-full"
          data-testid="google-login-button"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}