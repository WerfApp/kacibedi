import { useState, useEffect } from 'react';
import { X, Instagram, Mail, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<'email' | 'instagram'>('email');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFollowed, setHasFollowed] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('lattice-authenticated');
    if (isAuthenticated === 'true') {
      setIsVisible(false);
      onAuthenticated();
    }
  }, [onAuthenticated]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Submit email to server
      const response = await fetch('/api/auth/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          authMethod: 'email'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Store authentication state
        localStorage.setItem('lattice-authenticated', 'true');
        localStorage.setItem('lattice-auth-method', 'email');
        localStorage.setItem('lattice-user-email', email);
        
        setIsVisible(false);
        onAuthenticated();
      } else {
        console.error('Email submission failed:', result.error);
        // Still allow access even if server fails, for better UX
        localStorage.setItem('lattice-authenticated', 'true');
        localStorage.setItem('lattice-auth-method', 'email');
        localStorage.setItem('lattice-user-email', email);
        
        setIsVisible(false);
        onAuthenticated();
      }
    } catch (error) {
      console.error('Email submission error:', error);
      // Still allow access even if server fails, for better UX
      localStorage.setItem('lattice-authenticated', 'true');
      localStorage.setItem('lattice-auth-method', 'email');
      localStorage.setItem('lattice-user-email', email);
      
      setIsVisible(false);
      onAuthenticated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstagramFollow = () => {
    // Open Instagram in new tab
    window.open('https://instagram.com/Kaciibedi', '_blank');
    setHasFollowed(true);
  };

  const handleInstagramConfirm = async () => {
    try {
      // Save Instagram authentication to server (without email)
      await fetch('/api/auth/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `instagram_follower_${Date.now()}@lattice.app`, // Anonymous placeholder
          authMethod: 'instagram'
        }),
      });
    } catch (error) {
      console.error('Instagram auth tracking error:', error);
      // Continue regardless of server response
    }
    
    // Store authentication state
    localStorage.setItem('lattice-authenticated', 'true');
    localStorage.setItem('lattice-auth-method', 'instagram');
    
    setIsVisible(false);
    onAuthenticated();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-600/50 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 text-center bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 text-slate-800 dark:text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Mapa</h2>
          <p className="text-slate-600 dark:text-slate-300">Mind maps but make it 3D</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">A free app made by Kaci Bedi</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-300 dark:border-slate-600/50">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'email'
                ? 'text-slate-800 dark:text-white border-b-2 border-slate-600 dark:border-slate-400 bg-slate-100 dark:bg-slate-800/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Email Access
          </button>
          <button
            onClick={() => setActiveTab('instagram')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'instagram'
                ? 'text-slate-800 dark:text-white border-b-2 border-slate-600 dark:border-slate-400 bg-slate-100 dark:bg-slate-800/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Instagram className="w-4 h-4 inline mr-2" />
            Follow on Instagram
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white"
                disabled={isSubmitting || !email.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Get Access'}
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                We'll only use your email to provide access. No spam, ever.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <Instagram className="w-12 h-12 mx-auto text-slate-600 dark:text-slate-400 mb-3" />
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Follow <span className="font-semibold text-slate-800 dark:text-white">@Kaciibedi</span> on Instagram to get access to Mapa
                </p>
                {!hasFollowed ? (
                  <Button 
                    onClick={handleInstagramFollow}
                    className="w-full bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white mb-4"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Follow @Kaciibedi
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-slate-700 dark:text-slate-300 text-sm">
                      ✓ Instagram opened in new tab
                    </div>
                    <Button 
                      onClick={handleInstagramConfirm}
                      className="w-full bg-slate-600 hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 text-white"
                    >
                      I've Followed - Continue
                    </Button>
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  After following, click "I've Followed" to access the app
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800/50 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mapa - Mind maps but make it 3D
          </p>
        </div>
      </div>
    </div>
  );
}