import { useAuth } from '@/features/auth';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SessionWarningModalProps {
  timeRemaining: number;
  onDismiss: () => void;
}

export function SessionWarningModal({ timeRemaining, onDismiss }: SessionWarningModalProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const secondsRemaining = Math.ceil(timeRemaining / 1000);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Session Expiring</h3>
            <p className="text-sm text-slate-500">Due to inactivity</p>
          </div>
        </div>

        <p className="text-slate-700 mb-6">
          You'll be logged out in <span className="font-bold text-amber-600">{minutes}:{seconds.toString().padStart(2, '0')}</span> 
          due to inactivity. Click "Stay Logged In" to continue your session.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 py-2.5 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out Now
          </button>
          
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 px-4 bg-[#1E3A5F] text-white rounded-lg font-medium hover:bg-[#152942] transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
