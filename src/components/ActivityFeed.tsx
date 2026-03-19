import { MessageSquare, Users, Wrench, Clock } from 'lucide-react';
import { Message } from '../types';
import { MessageTypeBadge } from './MessageTypeBadge';
import { useFormatDate } from '../hooks';
import { useApp } from '../context/AppContext';

interface ActivityFeedProps {
  limit?: number;
}

export function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const { messages, markMessageResponded } = useApp();
  const { formatTime, formatRelativeTime } = useFormatDate();

  const displayMessages = messages.slice(0, limit);

  return (
    <div className="space-y-3 sm:space-y-4">
      {displayMessages.map((message, index) => (
        <div
          key={message.id}
          className="group bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <MessageTypeBadge type={message.type} />
              <span className="text-xs text-slate-500">{formatRelativeTime(message.timestamp)}</span>
            </div>
            <span className="text-xs text-slate-500 flex-shrink-0">{formatTime(message.timestamp)}</span>
          </div>

          {/* Tenant Message */}
          <div className="mb-2 sm:mb-3">
            <p className="text-xs text-slate-400 mb-1"><span className="text-slate-500">[Tenant]</span></p>
            <p className="text-sm text-slate-200 italic leading-relaxed">"{message.tenantMessage}"</p>
          </div>

          {/* Bot Response */}
          <div className="bg-slate-900/50 rounded-lg p-2.5 sm:p-3 border-l-2 border-amber-500/50">
            <p className="text-xs text-amber-500/70 mb-1 font-mono">[Bot Response]</p>
            <p className="text-sm text-slate-300 font-mono leading-relaxed">{message.botResponse}</p>
          </div>

          {/* Escalation Status */}
          {message.escalated && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-2.5 bg-red-900/20 border border-red-700/30 rounded-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-red-400 font-semibold text-xs">🚨 ESCALATED</span>
                {message.landlordResponded ? (
                  <span className="text-emerald-400 text-xs">✓ You responded</span>
                ) : (
                  <span className="text-amber-400 text-xs">⚠ Waiting for response</span>
                )}
              </div>
              {!message.landlordResponded && (
                <button
                  onClick={() => markMessageResponded(message.id)}
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline touch-manipulation min-h-[32px] flex items-center"
                >
                  Mark as responded
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {displayMessages.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-slate-500">
          <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm sm:text-base">No messages yet</p>
          <p className="text-xs sm:text-sm mt-2">Your bot is ready and waiting.</p>
        </div>
      )}
    </div>
  );
}
