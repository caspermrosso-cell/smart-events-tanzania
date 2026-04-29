import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Clock, MapPin, Sparkles, Heart, Star, Crown, Gem, Flower2 } from 'lucide-react';

export type ECardTemplate = {
  id: string;
  name: string;
  preview: string; // gradient preview for selector
};

export const CARD_TEMPLATES: ECardTemplate[] = [
  { id: 'royal-emerald', name: 'Royal Emerald', preview: 'from-emerald-900 via-emerald-700 to-teal-900' },
  { id: 'midnight-gold', name: 'Midnight Gold', preview: 'from-slate-900 via-amber-900 to-slate-900' },
  { id: 'rose-blush', name: 'Rose Blush', preview: 'from-rose-200 via-pink-300 to-rose-400' },
  { id: 'ocean-mist', name: 'Ocean Mist', preview: 'from-cyan-700 via-blue-800 to-indigo-900' },
  { id: 'sahara-sunset', name: 'Sahara Sunset', preview: 'from-orange-500 via-red-600 to-purple-900' },
  { id: 'minimal-noir', name: 'Minimal Noir', preview: 'from-neutral-900 via-neutral-800 to-black' },
  { id: 'platinum', name: 'Platinum', preview: 'from-slate-100 via-zinc-200 to-slate-300' },
  { id: 'tropical-leaf', name: 'Tropical', preview: 'from-green-700 via-emerald-800 to-lime-900' },
];

type Props = {
  template: string;
  title: string;
  hostNames: string;
  customMessage: string;
  venue: string;
  eventDate: string;
  eventPhoto?: string | null;
  qrData: string;
  getMapsUrl: (v: string) => string;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('sw-TZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });

const QRBlock = ({ data, light = false }: { data: string; light?: boolean }) => (
  <div className="mt-6 flex flex-col items-center gap-2">
    <div className={`${light ? 'bg-white' : 'bg-white'} rounded-xl p-3 shadow-lg`}>
      <QRCodeSVG value={data} size={110} />
    </div>
    <p className="text-[10px] tracking-[0.3em] uppercase opacity-60">Scan for details</p>
  </div>
);

const InfoRow = ({ icon: Icon, children }: any) => (
  <div className="flex items-center justify-center gap-2 text-sm">
    <Icon className="w-4 h-4 opacity-80" />
    <span>{children}</span>
  </div>
);

// Template-aware overlay gradient that blends photo into card body
const OVERLAYS: Record<string, string> = {
  'royal-emerald': 'from-emerald-950/10 via-emerald-950/40 to-emerald-950',
  'midnight-gold': 'from-neutral-950/10 via-neutral-950/50 to-neutral-950',
  'rose-blush': 'from-rose-100/0 via-rose-100/30 to-rose-100',
  'ocean-mist': 'from-cyan-900/10 via-blue-900/40 to-indigo-950',
  'sahara-sunset': 'from-orange-500/0 via-red-700/30 to-purple-900',
  'minimal-noir': 'from-neutral-950/10 via-neutral-950/50 to-neutral-950',
  'platinum': 'from-slate-100/0 via-slate-100/30 to-slate-200',
  'tropical-leaf': 'from-green-900/10 via-emerald-900/40 to-lime-950',
};

type PhotoHeaderProps = {
  src?: string | null;
  template: string;
  title: string;
  variant?: 'banner' | 'frame' | 'circle';
};

/**
 * Photo header rendered inside each template.
 * - banner: 16:9 hero with template-tinted gradient overlay (default)
 * - frame:  bordered/inset photo with corner ornaments (royal/platinum)
 * - circle: circular portrait centered (minimal/editorial)
 */
const PhotoHeader = ({ src, template, title, variant = 'banner' }: PhotoHeaderProps) => {
  if (!src) return null;
  const overlay = OVERLAYS[template] || 'from-black/0 via-black/30 to-black/70';

  if (variant === 'circle') {
    return (
      <div className="flex justify-center mb-4">
        <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-white/30 shadow-xl">
          <img src={src} alt={title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>
    );
  }

  if (variant === 'frame') {
    return (
      <div className="relative mb-5 mx-auto">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl ring-1 ring-white/20 shadow-lg">
          <img src={src} alt={title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className={`absolute inset-0 bg-gradient-to-b ${overlay} opacity-80`} />
        </div>
      </div>
    );
  }

  // banner (default) — full-bleed 16:9 that blends into card body
  return (
    <div className="relative -mx-10 -mt-10 mb-6">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img src={src} alt={title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
      </div>
    </div>
  );
};

export default function ECardPreview(props: Props) {
  const { template, title, hostNames, customMessage, venue, eventDate, eventPhoto, qrData, getMapsUrl } = props;

  const Date_ = (
    <InfoRow icon={Calendar}>{formatDate(eventDate)}</InfoRow>
  );
  const Time_ = <InfoRow icon={Clock}>Saa {formatTime(eventDate)}</InfoRow>;
  const Venue_ = venue ? (
    <div className="flex items-center justify-center gap-2 text-sm">
      <MapPin className="w-4 h-4 opacity-80" />
      <a href={getMapsUrl(venue)} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:opacity-80">
        {venue}
      </a>
    </div>
  ) : null;

  const wrap = (children: React.ReactNode, extra = '') => (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-3xl overflow-hidden shadow-2xl ${extra}`}
    >
      {children}
    </motion.div>
  );

  // ROYAL EMERALD — luxurious dark green with gold ornaments
  if (template === 'royal-emerald') {
    return wrap(
      <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-950 text-amber-100 p-10 text-center">
        {/* ornamental corners */}
        <div className="absolute inset-4 border border-amber-400/30 rounded-2xl pointer-events-none" />
        <div className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-amber-400/60 rounded-tl-xl" />
        <div className="absolute top-6 right-6 w-10 h-10 border-r-2 border-t-2 border-amber-400/60 rounded-tr-xl" />
        <div className="absolute bottom-6 left-6 w-10 h-10 border-l-2 border-b-2 border-amber-400/60 rounded-bl-xl" />
        <div className="absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 border-amber-400/60 rounded-br-xl" />

        <div className="relative pt-6">
          <PhotoHeader src={eventPhoto} template="royal-emerald" title={title} variant="frame" />
          <Crown className="w-8 h-8 mx-auto text-amber-400 mb-3" />
          <p className="text-[10px] tracking-[0.5em] uppercase text-amber-300/80 mb-2">You are cordially invited</p>
          <div className="w-20 h-px bg-amber-400/60 mx-auto mb-4" />
          <h3 className="font-heading text-4xl font-bold mb-3 text-amber-50" style={{ fontFamily: 'Georgia, serif' }}>
            {title}
          </h3>
          {hostNames && <p className="italic text-amber-200/90 mb-4">— {hostNames} —</p>}
          <p className="text-amber-200/80 mb-2 text-sm italic">
            Ndugu: <span className="underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className="text-sm leading-relaxed opacity-90 max-w-xs mx-auto mb-6">{customMessage}</p>
          <div className="space-y-2">{Date_}{Time_}{Venue_}</div>
          <QRBlock data={qrData} />
          <p className="text-[10px] tracking-[0.3em] uppercase opacity-50 mt-6">Smart Events</p>
        </div>
      </div>
    );
  }

  // MIDNIGHT GOLD — dark with gold foil typography
  if (template === 'midnight-gold') {
    return wrap(
      <div className="relative bg-neutral-950 text-white p-10 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(251,191,36,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(251,191,36,0.3), transparent 40%)'
        }} />
        <div className="relative">
          <PhotoHeader src={eventPhoto} template="midnight-gold" title={title} variant="banner" />
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
          </div>
          <p className="text-[10px] tracking-[0.6em] uppercase text-amber-300 mb-3">An Invitation</p>
          <h3 className="font-heading text-5xl font-light mb-4 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>
            {title}
          </h3>
          {hostNames && <p className="text-amber-200/90 tracking-widest text-sm mb-6">{hostNames.toUpperCase()}</p>}
          <p className="text-white/70 mb-4 text-sm italic">
            Ndugu: <span className="text-amber-300 underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className="text-sm leading-relaxed text-white/80 max-w-xs mx-auto mb-6">{customMessage}</p>
          <div className="space-y-2 text-amber-100">{Date_}{Time_}{Venue_}</div>
          <QRBlock data={qrData} />
        </div>
      </div>
    );
  }

  // ROSE BLUSH — soft floral romantic
  if (template === 'rose-blush') {
    return wrap(
      <div className="relative bg-gradient-to-br from-rose-50 via-pink-100 to-rose-200 text-rose-950 p-10 text-center overflow-hidden">
        {/* floral accents */}
        <Flower2 className="absolute top-4 left-4 w-16 h-16 text-rose-300/40 -rotate-12" />
        <Flower2 className="absolute bottom-4 right-4 w-20 h-20 text-rose-400/40 rotate-45" />
        <Heart className="absolute top-1/2 right-8 w-6 h-6 text-rose-400/30" />
        <div className="relative">
          <PhotoHeader src={eventPhoto} template="rose-blush" title={title} variant="banner" />
          <p className="text-[10px] tracking-[0.5em] uppercase text-rose-700/70 mb-3">Together with our families</p>
          <h3 className="text-4xl mb-4 text-rose-900" style={{ fontFamily: '"Brush Script MT", cursive' }}>
            {title}
          </h3>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-rose-400" />
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <div className="h-px w-10 bg-rose-400" />
          </div>
          {hostNames && <p className="italic text-rose-800 mb-4 text-lg" style={{ fontFamily: 'Georgia, serif' }}>{hostNames}</p>}
          <p className="text-rose-800/80 mb-3 text-sm italic">
            Mpendwa: <span className="underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className="text-sm leading-relaxed text-rose-900/80 max-w-xs mx-auto mb-6">{customMessage}</p>
          <div className="space-y-2">{Date_}{Time_}{Venue_}</div>
          <QRBlock data={qrData} />
        </div>
      </div>
    );
  }

  // OCEAN MIST — modern gradient with glassmorphism
  if (template === 'ocean-mist') {
    return wrap(
      <div className="relative bg-gradient-to-br from-cyan-700 via-blue-800 to-indigo-950 text-white p-10 text-center overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl" />
        <div className="relative backdrop-blur-sm bg-white/5 border border-white/20 rounded-2xl p-6">
          <PhotoHeader src={eventPhoto} template="ocean-mist" title={title} variant="frame" />
          <Gem className="w-8 h-8 mx-auto text-cyan-300 mb-3" />
          <p className="text-[10px] tracking-[0.5em] uppercase text-cyan-200 mb-2">Save the date</p>
          <h3 className="font-heading text-4xl font-bold mb-3">{title}</h3>
          {hostNames && <p className="text-cyan-100/90 mb-4 tracking-wide">{hostNames}</p>}
          <p className="text-white/70 mb-3 text-sm italic">
            Ndugu: <span className="underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className="text-sm leading-relaxed text-white/80 max-w-xs mx-auto mb-6">{customMessage}</p>
          <div className="space-y-2">{Date_}{Time_}{Venue_}</div>
          <QRBlock data={qrData} />
        </div>
      </div>
    );
  }

  // SAHARA SUNSET — warm vibrant gradient
  if (template === 'sahara-sunset') {
    return wrap(
      <div className="relative bg-gradient-to-br from-orange-500 via-red-600 to-purple-900 text-white p-10 text-center overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-yellow-300/30 blur-2xl" />
        <div className="relative">
          <PhotoHeader src={eventPhoto} template="sahara-sunset" title={title} variant="banner" />
          <Star className="w-7 h-7 mx-auto text-yellow-200 mb-3 fill-yellow-200" />
          <p className="text-[10px] tracking-[0.5em] uppercase text-yellow-100 mb-2">A celebration awaits</p>
          <h3 className="font-heading text-5xl font-black mb-3 drop-shadow-lg">{title}</h3>
          {hostNames && <p className="text-yellow-100 mb-4 italic text-lg">{hostNames}</p>}
          <p className="text-white/80 mb-3 text-sm italic">
            Ndugu: <span className="underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className="text-sm leading-relaxed text-white/90 max-w-xs mx-auto mb-6">{customMessage}</p>
          <div className="space-y-2">{Date_}{Time_}{Venue_}</div>
          <QRBlock data={qrData} />
        </div>
      </div>
    );
  }

  // MINIMAL NOIR — ultra clean editorial
  if (template === 'minimal-noir') {
    return wrap(
      <div className="relative bg-neutral-950 text-white p-12 text-left">
        <div className="border-l-2 border-white pl-6">
          {eventPhoto && (
            <div className="mb-6 -mr-12 aspect-[16/9] overflow-hidden">
              <img src={eventPhoto} alt={title} className="w-full h-full object-cover grayscale contrast-110" loading="lazy" />
            </div>
          )}
          <p className="text-[10px] tracking-[0.6em] uppercase text-white/50 mb-6">Invitation · No.001</p>
          <h3 className="font-heading text-5xl font-light leading-tight mb-6">{title}</h3>
          <div className="w-12 h-px bg-white mb-6" />
          {hostNames && <p className="text-white/80 mb-6 tracking-widest text-xs uppercase">{hostNames}</p>}
          <p className="text-white/60 text-sm italic mb-4">
            Ndugu — <span className="underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className="text-sm leading-relaxed text-white/70 mb-8">{customMessage}</p>
          <div className="space-y-2 text-sm text-white/80">
            <div className="flex items-center gap-3"><Calendar className="w-4 h-4" />{formatDate(eventDate)}</div>
            <div className="flex items-center gap-3"><Clock className="w-4 h-4" />Saa {formatTime(eventDate)}</div>
            {venue && (
              <div className="flex items-center gap-3"><MapPin className="w-4 h-4" />
                <a href={getMapsUrl(venue)} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">{venue}</a>
              </div>
            )}
          </div>
          <div className="mt-8 flex items-end justify-between">
            <div className="bg-white rounded p-2"><QRCodeSVG value={qrData} size={90} /></div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/40">Smart<br />Events</p>
          </div>
        </div>
      </div>
    );
  }

  // PLATINUM — light luxe
  if (template === 'platinum') {
    return wrap(
      <div className="relative bg-gradient-to-br from-slate-50 via-zinc-100 to-slate-200 text-slate-900 p-10 text-center overflow-hidden">
        <div className="absolute inset-6 border border-slate-400/40 rounded-2xl pointer-events-none" />
        <div className="relative">
          <PhotoHeader src={eventPhoto} template="platinum" title={title} variant="frame" />
          <Sparkles className="w-7 h-7 mx-auto text-slate-700 mb-3" />
          <p className="text-[10px] tracking-[0.5em] uppercase text-slate-600 mb-2">Cordially invites you</p>
          <h3 className="font-heading text-4xl font-bold mb-3 text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
          <div className="w-16 h-px bg-slate-500 mx-auto mb-4" />
          {hostNames && <p className="italic text-slate-700 mb-4">{hostNames}</p>}
          <p className="text-slate-700 mb-3 text-sm italic">
            Ndugu: <span className="underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className="text-sm leading-relaxed text-slate-700 max-w-xs mx-auto mb-6">{customMessage}</p>
          <div className="space-y-2">{Date_}{Time_}{Venue_}</div>
          <QRBlock data={qrData} />
        </div>
      </div>
    );
  }

  // TROPICAL — botanical lush
  if (template === 'tropical-leaf') {
    return wrap(
      <div className="relative bg-gradient-to-br from-green-800 via-emerald-900 to-lime-950 text-emerald-50 p-10 text-center overflow-hidden">
        <Flower2 className="absolute -top-6 -left-6 w-32 h-32 text-emerald-400/20 rotate-12" />
        <Flower2 className="absolute -bottom-6 -right-6 w-32 h-32 text-lime-300/20 -rotate-45" />
        <div className="relative">
          <PhotoHeader src={eventPhoto} template="tropical-leaf" title={title} variant="banner" />
          <p className="text-[10px] tracking-[0.5em] uppercase text-lime-300 mb-3">A garden celebration</p>
          <h3 className="font-heading text-4xl font-bold mb-3">{title}</h3>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-lime-400" />
            <Flower2 className="w-4 h-4 text-lime-300" />
            <div className="h-px w-10 bg-lime-400" />
          </div>
          {hostNames && <p className="italic text-emerald-100 mb-4">{hostNames}</p>}
          <p className="text-emerald-100/80 mb-3 text-sm italic">
            Ndugu: <span className="underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className="text-sm leading-relaxed text-emerald-50/90 max-w-xs mx-auto mb-6">{customMessage}</p>
          <div className="space-y-2">{Date_}{Time_}{Venue_}</div>
          <QRBlock data={qrData} />
        </div>
      </div>
    );
  }

  return null;
}