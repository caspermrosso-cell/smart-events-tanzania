import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Clock, MapPin } from 'lucide-react';

export type CustomTemplate = {
  id: string;
  name: string;
  image_url: string;
  text_color: 'light' | 'dark' | string;
  overlay_style: 'gradient-bottom' | 'gradient-full' | 'dark-veil' | 'light-veil' | 'none' | string;
};

type Props = {
  template: CustomTemplate;
  title: string;
  hostNames: string;
  customMessage: string;
  venue: string;
  eventDate: string;
  qrData: string;
  getMapsUrl: (v: string) => string;
};

const overlayClass = (style: string) => {
  switch (style) {
    case 'gradient-full':
      return 'bg-gradient-to-b from-black/50 via-black/30 to-black/80';
    case 'dark-veil':
      return 'bg-black/55';
    case 'light-veil':
      return 'bg-white/55';
    case 'none':
      return '';
    case 'gradient-bottom':
    default:
      return 'bg-gradient-to-b from-black/10 via-black/40 to-black/85';
  }
};

export default function CustomTemplateRenderer(props: Props) {
  const { template, title, hostNames, customMessage, venue, eventDate, qrData, getMapsUrl } = props;
  const isLight = template.text_color === 'light';
  const txt = isLight ? 'text-white' : 'text-slate-900';
  const sub = isLight ? 'text-white/85' : 'text-slate-700';
  const muted = isLight ? 'text-white/70' : 'text-slate-600';
  const ring = isLight ? 'ring-white/30' : 'ring-slate-900/20';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[3/4] w-full"
    >
      {/* Background image */}
      <img
        src={template.image_url}
        alt={template.name}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayClass(template.overlay_style)}`} />

      {/* Content */}
      <div className={`relative h-full w-full flex flex-col ${txt} p-8 text-center`}>
        <div className="flex-1" />
        <div className={`backdrop-blur-[2px] ${isLight ? 'bg-black/20' : 'bg-white/40'} rounded-2xl p-5 ring-1 ${ring}`}>
          <p className={`text-[10px] tracking-[0.5em] uppercase mb-2 ${muted}`}>You are invited</p>
          <h3 className="font-heading text-3xl font-bold mb-2 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {title}
          </h3>
          {hostNames && <p className={`italic mb-3 ${sub}`}>— {hostNames} —</p>}
          <p className={`text-xs italic mb-2 ${sub}`}>
            Ndugu: <span className="underline decoration-dotted">{'{ Jina la Mgeni }'}</span>
          </p>
          <p className={`text-xs leading-relaxed mb-4 ${sub} max-w-xs mx-auto`}>{customMessage}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-3.5 h-3.5 opacity-80" />
              <span>
                {new Date(eventDate).toLocaleDateString('sw-TZ', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-3.5 h-3.5 opacity-80" />
              <span>
                Saa {new Date(eventDate).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {venue && (
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-3.5 h-3.5 opacity-80" />
                <a href={getMapsUrl(venue)} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:opacity-80">
                  {venue}
                </a>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col items-center gap-1">
            <div className="bg-white rounded-lg p-2 shadow-md">
              <QRCodeSVG value={qrData} size={80} />
            </div>
            <p className={`text-[9px] tracking-[0.3em] uppercase ${muted}`}>Scan for details</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}