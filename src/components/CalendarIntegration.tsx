import { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Clock,
  MapPin,
  AlertTriangle,
  Wrench,
  Home,
  User,
  Trash2,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { 
  GoogleCalendarService, 
  CalendarEvent,
  isGoogleCalendarConnected,
  disconnectGoogleCalendar,
  getLandlordBotEvents,
  deleteEvent
} from '../services/googleCalendar';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

interface CalendarIntegrationProps {
  compact?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarIntegration({ compact = false, onEventClick }: CalendarIntegrationProps) {
  const { 
    isConnected, 
    isLoading, 
    error, 
    upcomingEvents, 
    connect, 
    disconnect, 
    refreshEvents,
    deleteCalendarEvent
  } = useGoogleCalendar();

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Format event date/time
  const formatEventTime = (event: CalendarEvent): string => {
    if (event.start.dateTime) {
      const date = new Date(event.start.dateTime);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (event.start.date) {
      const date = new Date(event.start.date);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    }
    return 'Unknown';
  };

  // Get event type from description or summary
  const getEventType = (event: CalendarEvent): 'maintenance' | 'showing' | 'renewal' | 'other' => {
    const text = (event.description || '') + (event.summary || '').toLowerCase();
    if (text.includes('maintenance') || text.includes('repair')) return 'maintenance';
    if (text.includes('showing') || text.includes('tour')) return 'showing';
    if (text.includes('renewal') || text.includes('lease end')) return 'renewal';
    return 'other';
  };

  // Get icon based on event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'showing':
        return <Home className="w-4 h-4" />;
      case 'renewal':
        return <CalendarDays className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  // Get color based on event type
  const getEventColor = (type: string): string => {
    switch (type) {
      case 'maintenance':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'showing':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'renewal':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingEventId(eventId);
    await deleteCalendarEvent(eventId);
    setDeletingEventId(null);
  };

  // Compact view for sidebar/dashboard
  if (compact) {
    return (
      <div className="bg-lb-surface border border-lb-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="font-medium text-lb-text-primary">Google Calendar</h3>
          </div>
          {isConnected && (
            <button
              onClick={refreshEvents}
              disabled={isLoading}
              className="p-1.5 text-lb-text-secondary hover:text-lb-text-primary hover:bg-lb-base rounded-lg transition-colors"
              title="Refresh events"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {!isConnected ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-lb-base rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-lb-text-secondary" />
            </div>
            <p className="text-sm text-lb-text-secondary mb-3">
              Connect Google Calendar to sync maintenance and showing schedules
            </p>
            <button
              onClick={connect}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Connect Calendar
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-lb-text-muted">No upcoming events</p>
                <p className="text-xs text-lb-text-secondary mt-1">
                  Events will appear here when scheduled
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 3).map((event) => {
                  const type = getEventType(event);
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="w-full text-left p-3 bg-lb-base rounded-lg hover:bg-lb-muted transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded ${getEventColor(type)}`}>
                          {getEventIcon(type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-lb-text-primary truncate">
                            {event.summary}
                          </p>
                          <p className="text-xs text-lb-text-secondary flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatEventTime(event)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-lb-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
                {upcomingEvents.length > 3 && (
                  <p className="text-xs text-center text-lb-text-muted pt-2">
                    +{upcomingEvents.length - 3} more events
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-lb-border">
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Disconnect Calendar
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </p>
          </div>
        )}

        {/* Disconnect Confirmation Modal */}
        {showDisconnectConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-lb-surface border border-lb-border rounded-xl p-6 max-w-sm w-full">
              <h4 className="font-medium text-lb-text-primary mb-2">Disconnect Calendar?</h4>
              <p className="text-sm text-lb-text-secondary mb-4">
                This will remove the connection to Google Calendar. Your existing events will remain in Google Calendar.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="flex-1 px-4 py-2 bg-lb-muted hover:bg-lb-base text-lb-text-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    disconnect();
                    setShowDisconnectConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-lb-text-primary">
              Google Calendar Integration
            </h1>
            <p className="text-lb-text-secondary text-sm">
              Sync maintenance schedules and property showings
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              Connected
            </span>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected ? (
        <div className="bg-lb-surface border border-lb-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-lb-base rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-lb-text-secondary" />
          </div>
          <h3 className="text-lg font-medium text-lb-text-primary mb-2">
            Connect Google Calendar
          </h3>
          <p className="text-lb-text-secondary max-w-md mx-auto mb-6">
            Sync your maintenance requests, property showings, and lease renewal reminders 
            directly to your Google Calendar. Get notifications and never miss an appointment.
          </p>
          <button
            onClick={connect}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Connect Google Calendar
              </>
            )}
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}
        </div>
      ) : (
        <>
          {/* Connected State */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-lb-text-primary">Google Calendar Connected</p>
                  <p className="text-sm text-lb-text-secondary">
                    {upcomingEvents.length} upcoming events synced
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshEvents}
                  disabled={isLoading}
                  className="p-2 text-lb-text-secondary hover:text-lb-text-primary hover:bg-lb-base rounded-lg transition-colors"
                  title="Refresh events"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Disconnect"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-lb-surface border border-lb-border rounded-xl">
            <div className="p-4 border-b border-lb-border flex items-center justify-between">
              <h3 className="font-medium text-lb-text-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Upcoming Events
              </h3>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Open Calendar
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="divide-y divide-lb-border">
              {upcomingEvents.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-lb-base rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-lb-text-secondary" />
                  </div>
                  <p className="text-lb-text-secondary">No upcoming events</p>
                  <p className="text-sm text-lb-text-muted mt-1">
                    Schedule maintenance or showings to see them here
                  </p>
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const type = getEventType(event);
                  return (
                    <div
                      key={event.id}
                      className="p-4 hover:bg-lb-base transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getEventColor(type)}`}>
                          {getEventIcon(type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-lb-text-primary">
                                {event.summary}
                              </h4>
                              <p className="text-sm text-lb-text-secondary mt-1">
                                {formatEventTime(event)}
                              </p>
                              {event.location && (
                                <p className="text-xs text-lb-text-muted flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={event.htmlLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-lb-text-secondary hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                title="View in Google Calendar"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={(e) => event.id && handleDeleteEvent(event.id, e)}
                                disabled={deletingEventId === event.id}
                                className="p-1.5 text-lb-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete event"
                              >
                                {deletingEventId === event.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-sm text-lb-text-secondary mt-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Features Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-lb-surface border border-lb-border rounded-xl p-4">
              <div className="p-2 bg-red-500/10 rounded-lg w-fit mb-3">
                <Wrench className="w-5 h-5 text-red-400" />
              </div>
              <h4 className="font-medium text-lb-text-primary mb-1">Maintenance Scheduling</h4>
              <p className="text-sm text-lb-text-secondary">
                Schedule maintenance visits and get reminders before appointments
              </p>
            </div>
            <div className="bg-lb-surface border border-lb-border rounded-xl p-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg w-fit mb-3">
                <Home className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="font-medium text-lb-text-primary mb-1">Property Showings</h4>
              <p className="text-sm text-lb-text-secondary">
                Book property tours and sync prospect details to your calendar
              </p>
            </div>
            <div className="bg-lb-surface border border-lb-border rounded-xl p-4">
              <div className="p-2 bg-amber-500/10 rounded-lg w-fit mb-3">
                <CalendarDays className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="font-medium text-lb-text-primary mb-1">Lease Renewals</h4>
              <p className="text-sm text-lb-text-secondary">
                Automatic reminders 60 days before lease expiration
              </p>
            </div>
          </div>
        </>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-lb-surface border border-lb-border rounded-xl p-6 max-w-md w-full">
            <h4 className="text-lg font-medium text-lb-text-primary mb-2">
              Disconnect Google Calendar?
            </h4>
            <p className="text-lb-text-secondary mb-6">
              This will remove the connection between LandlordBot and your Google Calendar. 
              Your existing events will remain in Google Calendar, but new events won't be synced.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 px-4 py-2 bg-lb-muted hover:bg-lb-base text-lb-text-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  disconnect();
                  setShowDisconnectConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarIntegration;
