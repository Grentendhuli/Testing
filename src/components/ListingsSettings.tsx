import { useState, useEffect } from 'react';
import { 
  ExternalLink, Link as LinkIcon, CheckCircle, XCircle, 
  Loader2, Phone, Copy, Check, AlertCircle,
  MessageSquare, DollarSign, TrendingUp
} from 'lucide-react';
import { 
  listingsAPIService, 
  LISTING_PLATFORMS,
  type ListingPlatform,
  type IncomingLead 
} from '../services/listingsAPI';

export function ListingsSettings() {
  const [platforms, setPlatforms] = useState(LISTING_PLATFORMS);
  const [botPhone, setBotPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<Partial<Record<ListingPlatform, boolean>>>({});
  const [leads, setLeads] = useState<IncomingLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load current state
    const currentPlatforms = listingsAPIService.getPlatforms();
    setPlatforms(currentPlatforms);
    setBotPhone(listingsAPIService.getBotPhoneNumber());
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const incomingLeads = await listingsAPIService.getIncomingLeads({ daysBack: 30 });
      setLeads(incomingLeads);
    } catch {
      // Error handled silently
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleConnect = async (platformId: ListingPlatform) => {
    if (!botPhone) {
      setError('Please set your bot phone number first in the Phone section.');
      return;
    }

    setLoading(prev => ({ ...prev, [platformId]: true }));
    setError(null);
    setSuccess(null);

    try {
      const result = await listingsAPIService.connectPlatform(platformId, {
        botPhoneNumber: botPhone,
        autoReply: true,
      });

      if (result.success) {
        setSuccess(result.message);
        const updatedPlatforms = listingsAPIService.getPlatforms();
        setPlatforms(updatedPlatforms);
      } else {
        setError(result.error || 'Failed to connect platform');
      }
    } catch {
      setError('An error occurred while connecting the platform');
    } finally {
      setLoading(prev => ({ ...prev, [platformId]: false }));
    }
  };

  const handleDisconnect = async (platformId: ListingPlatform) => {
    setLoading(prev => ({ ...prev, [platformId]: true }));
    setError(null);
    
    try {
      await listingsAPIService.disconnectPlatform(platformId);
      const updatedPlatforms = listingsAPIService.getPlatforms();
      setPlatforms(updatedPlatforms);
      setSuccess('Platform disconnected successfully');
    } catch {
      setError('Failed to disconnect platform');
    } finally {
      setLoading(prev => ({ ...prev, [platformId]: false }));
    }
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(botPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getStatusBadge = (platform: typeof platforms[0]) => {
    if (platform.connected) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
          <CheckCircle className="w-3 h-3" /> Connected
        </span>
      );
    }

    switch (platform.apiStatus) {
      case 'available':
        return (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
            Available
          </span>
        );
      case 'beta':
        return (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
            Beta
          </span>
        );
      case 'coming_soon':
        return (
          <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded">
            Coming Soon
          </span>
        );
      case 'paid_only':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
            <DollarSign className="w-3 h-3" /> Premium
          </span>
        );
      default:
        return null;
    }
  };

  const freePlatforms = platforms.filter(p => !p.isPaid);
  const paidPlatforms = platforms.filter(p => p.isPaid);

  return (
    <div className="space-y-8">
      {/* Bot Phone Number Section */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Phone className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-200">Your Bot Phone Number</h3>
            <p className="text-sm text-slate-500">Use this number as the contact on all listing platforms</p>
          </div>
        </div>

        {botPhone ? (
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-slate-900 border border-slate-700 rounded-lg">
              <p className="text-2xl font-mono font-semibold text-amber-400">{botPhone}</p>
            </div>
            <button
              onClick={copyPhone}
              className="flex items-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">No bot phone number configured. Complete onboarding to get your number.</p>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-400">
            <strong>💡 Tip:</strong> When creating listings on Reddit, Facebook, or Craigslist, paste this number in the contact field. 
            Leads will automatically flow to your dashboard.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Free Platforms */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-slate-200">Free Listing Platforms</h3>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Recommended</span>
        </div>

        <div className="grid gap-4">
          {freePlatforms.map((platform) => (
            <div
              key={platform.id}
              className="p-5 bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                    {platform.id === 'reddit' && <span className="text-lg">🤖</span>}
                    {platform.id === 'facebook' && <span className="text-lg">📘</span>}
                    {platform.id === 'craigslist' && <span className="text-lg">📋</span>}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">{platform.displayName}</h4>
                    <p className="text-sm text-slate-500">{platform.description}</p>
                  </div>
                </div>
                {getStatusBadge(platform)}
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {platform.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {platform.connected ? (
                  <>
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={loading[platform.id]}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading[platform.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Disconnect
                    </button>
                    <a
                      href={platform.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                    >
                      Open Platform
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={loading[platform.id] || !botPhone}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading[platform.id] && <Loader2 className="w-4 h-4 animate-spin" />}
                      <LinkIcon className="w-4 h-4" />
                      Connect
                    </button>
                    <a
                      href={platform.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                    >
                      Learn More
                    </a>
                  </>
                )}
              </div>

              {platform.connected && platform.botPhoneInstructions && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    <strong>Next Step:</strong> {platform.botPhoneInstructions.replace('[BOT_PHONE]', botPhone)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Premium Platforms */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-slate-200">Premium Listing Platforms</h3>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">Premium</span>
        </div>

        <div className="grid gap-4">
          {paidPlatforms.map((platform) => (
            <div
              key={platform.id}
              className="p-5 bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                    {platform.id === 'streeteasy' && <span className="text-lg">🏢</span>}
                    {platform.id === 'apartments' && <span className="text-lg">🏠</span>}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">{platform.displayName}</h4>
                    <p className="text-sm text-slate-500">{platform.description}</p>
                  </div>
                </div>
                {getStatusBadge(platform)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">Monthly Cost</p>
                  <p className="text-lg font-semibold text-slate-300">${platform.monthlyCost}/mo</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Setup Cost</p>
                  <p className="text-lg font-semibold text-slate-300">${platform.setupCost}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {platform.features.slice(0, 4).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-400">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  <strong>Premium Option:</strong> {platform.displayName} offers maximum exposure in NYC. 
                  Contact our team to set up integration.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-200">Recent Incoming Leads</h3>
          </div>
          <button
            onClick={loadLeads}
            disabled={leadsLoading}
            className="text-sm text-amber-400 hover:text-amber-300 disabled:opacity-50"
          >
            {leadsLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {leadsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No incoming leads yet</p>
            <p className="text-sm text-slate-600 mt-1">Connect a listing platform to start receiving leads</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-200">{lead.tenantName}</p>
                    <p className="text-sm text-slate-500">
                      From {lead.sourceName} • {new Date(lead.receivedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                    lead.status === 'contacted' ? 'bg-amber-500/20 text-amber-400' :
                    lead.status === 'qualified' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                
                <p className="text-sm text-slate-400 line-clamp-2">"{lead.inquiryText}"</p>
                
                {lead.botResponded && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-emerald-400">🤖 Bot responded</span>
                  </div>
                )}
              </div>
            ))}
            
            {leads.length > 5 && (
              <button 
                onClick={() => {/* Navigate to Leads page */}}
                className="w-full py-2 text-sm text-amber-400 hover:text-amber-300"
              >
                View all {leads.length} leads →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
