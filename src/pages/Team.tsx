import { 
  Award, Calendar, Star, CheckCircle, Phone, Mail, 
  Globe, MapPin, Briefcase, GraduationCap, ShieldCheck,
  MessageSquare, Clock, ChevronRight
} from 'lucide-react';
import { GRENTEN_DHULI_PROFILE, ADDITIONAL_ADVISORS, ALL_ADVISORS } from '../services/advisorBooking';
import type { AdvisorProfile } from '../services/advisorBooking';

function AdvisorCard({ advisor }: { advisor: AdvisorProfile }) {
  return (
    <div className={`p-6 rounded-2xl border-2 transition-all ${
      advisor.tier === 'elite' 
        ? 'bg-gradient-to-br from-amber-900/20 to-purple-900/20 border-amber-500/30' 
        : 'bg-slate-800/50 border-slate-700'
    }`}>
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar Placeholder */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
          advisor.tier === 'elite' 
            ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/50' 
            : 'bg-slate-700 text-slate-300'
        }`}>
          {advisor.name.split(' ').map(n => n[0]).join('')}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-100">{advisor.name}</h3>
            {advisor.verified && (
              <span title="Verified Expert">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </span>
            )}
          </div>
          
          <p className="text-amber-400 font-medium">{advisor.title}</p>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm text-slate-300">{advisor.rating}</span>
              <span className="text-sm text-slate-500">({advisor.reviewCount} reviews)</span>
            </div>
            
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              advisor.tier === 'elite' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {advisor.tier.toUpperCase()} Tier
            </span>
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-400 mb-2">Credentials:</p>
        <div className="space-y-1">
          {advisor.credentials.slice(0, 3).map((cred) => (
            <div key={cred} className="flex items-center gap-2 text-sm text-slate-300">
              <Award className="w-4 h-4 text-emerald-400" />
              {cred}
            </div>
          ))}
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-slate-400 mb-4 line-clamp-4">{advisor.bio}</p>

      {/* Specialties */}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-400 mb-2">Specialties:</p>
        <div className="flex flex-wrap gap-2">
          {advisor.specialties.slice(0, 5).map((specialty) => (
            <span
              key={specialty}
              className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{advisor.availableHours.start}-{advisor.availableHours.end} ET</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{advisor.availableDays.slice(0, 3).join(', ')}...</span>
        </div>
      </div>

      {/* CTA */}
      <button className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
        advisor.tier === 'elite'
          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          : 'bg-blue-500 hover:bg-blue-400 text-white'
      }`}
      >
        <Calendar className="w-4 h-4" />
        Book a Session
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function NYCProAdvisorFeature() {
  const advisor = GRENTEN_DHULI_PROFILE;

  return (
    <div className="bg-gradient-to-br from-amber-900/30 via-slate-900 to-purple-900/20 rounded-3xl p-8 border-2 border-amber-500/30">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Photo + Quick Info */}
        <div className="lg:w-1/3 text-center lg:text-left">
          <div className="w-32 h-32 mx-auto lg:mx-0 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 border-4 border-amber-500/50 flex items-center justify-center text-4xl font-bold text-amber-400 mb-4">
            GD
          </div>
          
          <h2 className="text-2xl font-bold text-slate-100">{advisor.name}</h2>
          <p className="text-amber-400 font-medium">{advisor.title}</p>
          
          <div className="flex items-center justify-center lg:justify-start gap-2 mt-3">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-2xl font-bold text-slate-100">{advisor.rating}</span>
            <span className="text-slate-400">({advisor.reviewCount} reviews)</span>
          </div>

          <div className="mt-6 space-y-3">
            <a 
              href={`mailto:${advisor.email}`}
              className="flex items-center justify-center lg:justify-start gap-2 text-slate-300 hover:text-amber-400 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {advisor.email}
            </a>
            
            {advisor.phone && (
              <a 
                href={`tel:${advisor.phone}`}
                className="flex items-center justify-center lg:justify-start gap-2 text-slate-300 hover:text-amber-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {advisor.phone}
              </a>
            )}
          </div>
        </div>

        {/* Right: Detailed Info */}
        <div className="lg:w-2/3">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Verified Expert • Elite Tier</span>
          </div>

          <p className="text-slate-300 leading-relaxed mb-6 whitespace-pre-line">
            {advisor.bio}
          </p>

          {/* Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Credentials
              </h4>
              <ul className="space-y-1 text-sm text-slate-400">
                {advisor.credentials.map((cred) => (
                  <li key={cred} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    {cred}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-400" /> Specialties
              </h4>
              <div className="flex flex-wrap gap-2">
                {advisor.specialties.slice(0, 6).map((spec) => (
                  <span 
                    key={spec}
                    className="px-2 py-1 bg-slate-800/50 border border-slate-700 text-slate-300 text-xs rounded-full"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="mb-6">
            <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              Certifications
            </h4>
            <div className="flex flex-wrap gap-2">
              {advisor.certifications.map((cert) => (
                <span 
                  key={cert}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Book Strategy Call
            </button>
            
            <button className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Team() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Meet Your Advisor Team</h1>
        <p className="text-slate-400 mt-2">Expert property managers and specialists here to help you succeed.</p>
      </div>

      {/* Featured: NYC Pro Concierge Advisor */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Elite Tier Advisor</h2>
        </div>

        <NYCProAdvisorFeature />
      </section>

      {/* Additional Advisors */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <UsersIcon className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Pro Tier Advisors</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {ADDITIONAL_ADVISORS.map((advisor) => (
            <div key={advisor.id}>
              <AdvisorCard advisor={advisor} />
            </div>
          ))}
        </div>
      </section>

      {/* Why Work With Our Advisors */}
      <section className="bg-slate-800/50 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-slate-100 mb-6">Why Work With Our Advisors?</h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: ShieldCheck, 
              title: 'NYC Expertise', 
              desc: 'Deep knowledge of NYC-specific regulations and compliance requirements.' 
            },
            { 
              icon: Award, 
              title: 'Verified Credentials', 
              desc: 'All advisors are licensed professionals with verified certifications.' 
            },
            { 
              icon: Clock, 
              title: 'Flexible Scheduling', 
              desc: 'Book calls that fit your schedule - early morning or evening slots available.' 
            },
            { 
              icon: MessageSquare, 
              title: 'Ongoing Support', 
              desc: 'Get answers to your questions between sessions via messaging.' 
            },
          ].map((item) => (
            <div key={item.title} className="text-center p-4">
              <div className="w-12 h-12 mx-auto bg-amber-500/20 rounded-xl flex items-center justify-center mb-3">
                <item.icon className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-medium text-slate-200 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Helper icon component
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

export default Team;
