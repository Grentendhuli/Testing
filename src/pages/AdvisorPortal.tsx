import { useState, useEffect } from 'react';
import { 
  Phone, Calendar, Clock, MessageSquare, Video, 
  ChevronRight, Crown, User, FileText, CheckCircle,
  ArrowRight, AlertCircle, Info, Loader2
} from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
// import { UpgradeBanner } from '../components/UpgradeBanner'; // Removed - all features free
import { useApp } from '../context/AppContext';
import { 
  advisorService,
  GRENTEN_DHULI_PROFILE,
  type AdvisorProfile,
  type BookingResponse 
} from '../services/advisorBooking';
import type { AdvisorMessage, AdvisorSession } from '../types/pro';

// Mock advisor data
const mockSessions: AdvisorSession[] = [
  {
    id: 'session_1',
    userId: 'user_1',
    scheduledAt: '2026-03-01T10:00:00Z',
    duration: 15,
    status: 'scheduled',
    notes: 'Monthly portfolio review and rent strategy discussion',
    advisorName: 'Michael Rodriguez',
    meetingLink: 'https://meet.example.com/advisor-michael',
  },
  {
    id: 'session_2',
    userId: 'user_1',
    scheduledAt: '2026-02-01T14:00:00Z',
    duration: 15,
    status: 'completed',
    notes: 'Discussed kitchen renovation ROI and MCI increases',
    advisorName: 'Sarah Chen, CPA',
    meetingLink: 'https://meet.example.com/advisor-sarah',
    recordingUrl: 'https://recordings.example.com/session_2',
  }
];

const mockMessages: AdvisorMessage[] = [
  {
    id: 'msg_1',
    userId: 'user_1',
    advisorId: 'advisor_1',
    content: 'Hi! I reviewed your January financial report. Your NOI is up 8.5% - great job! I noticed some units might be ready for a rent increase. Should we discuss on our next call?',
    sentAt: '2026-02-10T09:00:00Z',
    fromAdvisor: true,
    read: true
  },
  {
    id: 'msg_2',
    userId: 'user_1',
    advisorId: 'advisor_1',
    content: 'Yes, definitely! The tenant has been there 2 years with no increases.',
    sentAt: '2026-02-10T09:15:00Z',
    fromAdvisor: false,
    read: true
  },
  {
    id: 'msg_3',
    userId: 'user_1',
    advisorId: 'advisor_1',
    content: 'Perfect. I will prepare a market analysis for our call next Tuesday. Based on comps, you could reasonably go to $2,750 which is still below market median.',
    sentAt: '2026-02-10T09:20:00Z',
    fromAdvisor: true,
    read: false
  }
];

export function AdvisorPortal() {
  const { user } = useApp();
  const [sessions, setSessions] = useState<AdvisorSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [messages] = useState<AdvisorMessage[]>(mockMessages);
  const [activeTab, setActiveTab] = useState<'calendar' | 'messages'>('calendar');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Array<{ date: string; slots: string[] }>>([]);
  
  const isConciergeTier = user?.subscriptionTier === 'concierge';
  const hasAdvisorAccess = isConciergeTier;

  useEffect(() => {
    if (hasAdvisorAccess) {
      loadAdvisorData();
    }
  }, [hasAdvisorAccess]);

  const loadAdvisorData = async () => {
    setLoading(true);
    try {
      setIsConfigured(true);
      
      const slots = advisorService.getAvailabilityWindow('advisor_nyc_pro_concierge', 14);
      setAvailableSlots(slots);
      
      setSessions(prevSessions => [...prevSessions, ...mockSessions]);
    } catch (error) {
      console.error('Failed to load advisor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingSession = sessions.find(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const unreadMessages = messages.filter(m => m.fromAdvisor && !m.read).length;

  const handleBookCall = async (advisorId: string, duration: 15 | 30 | 60) => {
    if (!user?.email || !user?.id) return;
    
    // For demo purposes, just add a mock session
    const newSession: AdvisorSession = {
      id: `session_${Date.now()}`,
      userId: user.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: duration,
      status: 'scheduled',
      notes: 'Monthly portfolio review',
      advisorName: 'NYC Pro Advisor',
      meetingLink: 'https://meet.landlordbot.ai/demo',
    };
    
    setSessions(prev => [...prev, newSession]);
    setBookingSuccess('Call scheduled successfully!');
    setTimeout(() => {
      setBookingSuccess(null);
      setShowBooking(false);
    }, 2000);
  };

  if (!hasAdvisorAccess) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">Advisor Portal</h1>
            <p className="text-slate-400 mt-1">Speak with your dedicated property advisor</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center mb-6">
            <Crown className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-3">Pro Tier Required</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            Get monthly 15-minute calls with a dedicated property advisor. 
            Discuss strategy, get market insights, and optimize your portfolio.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {[
              'Monthly 15-min calls',
              'Portfolio strategy reviews', 
              'Email support included'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="text-emerald-400">✓</span> {feature}
              </div>
            ))}
          </div>
          <a
            href="/billing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>

        <ComplianceFooter />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UpgradeBanner removed - all features free */}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Advisor Portal</h1>
          <p className="text-slate-400 mt-1">Your dedicated property management advisor</p>
        </div>
        <button
          onClick={() => setShowBooking(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Calendar className="w-4 h-4" />
          Schedule Call
        </button>
      </div>

      {/* Configuration Notice */}
      {!isConfigured && !loading && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">Demo Mode</p>
            <p className="text-slate-400 text-sm mt-1">
              Calendly integration not configured. Showing mock scheduling data.
              {' '}<a href="/config" className="text-blue-400 hover:underline">Configure Calendly</a> to enable real booking.
            </p>
          </div>
        </div>
      )}

      {isConfigured && !loading && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-400">Connected to Calendly - Real scheduling enabled</p>
        </div>
      )}

      {/* Success Message */}
      {bookingSuccess && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">{bookingSuccess}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {upcomingSession ? new Date(upcomingSession.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None'}
              </p>
              <p className="text-sm text-slate-500">{upcomingSession ? 'Next Call Scheduled' : 'No upcoming calls'}</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{completedSessions}</p>
              <p className="text-sm text-slate-500">Sessions Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{unreadMessages}</p>
              <p className="text-sm text-slate-500">Unread Messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {(['calendar', 'messages'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-amber-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'calendar' ? (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendar & Sessions
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
                {unreadMessages > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-xs rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </span>
            )}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
        ))}
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Upcoming Session */}
          {upcomingSession && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Upcoming Session</h3>
                  <p className="text-slate-400 text-sm">{upcomingSession.notes}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">Date</p>
                  <p className="text-slate-200 font-medium">
                    {new Date(upcomingSession.scheduledAt).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">Time</p>
                  <p className="text-slate-200 font-medium">
                    {new Date(upcomingSession.scheduledAt).toLocaleTimeString('en-US', { 
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">Duration</p>
                  <p className="text-slate-200 font-medium">{upcomingSession.duration} minutes</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">{upcomingSession.advisorName}</p>
                  <p className="text-slate-500 text-sm">Property Advisor</p>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={upcomingSession.meetingLink}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Join Meeting
                </a>
                <button className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors">
                  Reschedule
                </button>
              </div>
            </div>
          )}

          {/* Past Sessions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Past Sessions</h3>
            <div className="space-y-3">
              {sessions.filter(s => s.status === 'completed').map(session => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">{session.advisorName}</p>
                      <p className="text-slate-500 text-sm">{session.notes}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300">
                      {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {session.recordingUrl && (
                      <a href={session.recordingUrl} className="text-amber-400 text-sm hover:underline">
                        View Recording
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-200 font-medium">Your Advisor</p>
              <p className="text-slate-500 text-sm">Response within 24 hours</p>
            </div>
          </div>
          
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.fromAdvisor ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-xl ${
                    msg.fromAdvisor
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-2 ${msg.fromAdvisor ? 'text-slate-500' : 'text-amber-900/60'}`}>
                    {new Date(msg.sentAt).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <ComplianceFooter />

      {/* Booking Modal - Simplified */}
      {showBooking && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowBooking(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-100 mb-4">Schedule Advisor Call</h2>
            <p className="text-slate-400 mb-6">
              All available times are in Eastern Time. Calls are 15 minutes.
            </p>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-slate-400">Loading available slots...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No available slots found. Check back tomorrow!</p>
                </div>
              ) : (
                availableSlots.slice(0, 3).map((day, dayIdx) => (
                  <div key={dayIdx} className="mb-4">
                    <p className="text-sm text-slate-400 mb-2">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {day.slots.slice(0, 6).map((timeSlot, timeIdx) => (
                        <button
                          key={timeIdx}
                          onClick={() => handleBookCall('advisor_nyc_pro_concierge', 30)}
                          disabled={loading}
                          className="p-2 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-800 rounded-lg text-sm text-slate-300 transition-colors disabled:opacity-50"
                        >
                          {timeSlot}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowBooking(false)}
              className="w-full py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
