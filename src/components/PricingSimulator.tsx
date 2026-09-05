import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, MessagesSquare, Minus, Plus, BadgePercent } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type Channel = 'sms' | 'whatsapp';

const RATES: Record<Channel, number> = { sms: 50, whatsapp: 1000 };
const MIN_UNITS = 0;
const MAX_UNITS = 5000;
const STEP = 10;

// Map units -> knob angle (-135deg .. 135deg)
const toAngle = (units: number) => -135 + (units / MAX_UNITS) * 270;

const PricingSimulator = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [channel, setChannel] = useState<Channel>('sms');
  const [units, setUnits] = useState(500);

  const knobRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const clamp = (v: number) => Math.min(MAX_UNITS, Math.max(MIN_UNITS, Math.round(v / STEP) * STEP));

  const handlePointer = useCallback((clientY: number, startY: number, startUnits: number) => {
    // Dragging up increases volume — like turning a radio knob
    const delta = startY - clientY;
    setUnits(clamp(startUnits + delta * (MAX_UNITS / 300)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startUnits = units;
    const move = (ev: PointerEvent) => {
      if (dragging.current) handlePointer(ev.clientY, startY, startUnits);
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const total = units * RATES[channel];
  const fmt = (n: number) => n.toLocaleString();

  const tickAngles = Array.from({ length: 11 }, (_, i) => -135 + i * 27);

  return (
    <section className="py-24 bg-secondary/40">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="eyebrow mb-4">{isEn ? 'Cost simulator' : 'Kipima gharama'}</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'Turn the dial. See your price.' : 'Zungusha kikohozi. Ona bei yako.'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {isEn
              ? 'Pick a channel, spin the knob to your volume, and watch the total update live.'
              : 'Chagua njia, zungusha kikohozi hadi idadi unayotaka, kisha ona jumla papo hapo.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="soft-card rounded-3xl p-8 md:p-12 max-w-3xl mx-auto"
        >
          {/* Channel selector */}
          <div className="flex justify-center gap-3 mb-10">
            <button
              onClick={() => setChannel('sms')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                channel === 'sms'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              SMS · TZS {RATES.sms}/unit
            </button>
            <button
              onClick={() => setChannel('whatsapp')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                channel === 'whatsapp'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <MessagesSquare className="w-4 h-4" />
              WhatsApp · TZS {fmt(RATES[channel === 'whatsapp' ? 'whatsapp' : 'whatsapp'])}/unit
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            {/* Knob */}
            <div className="relative select-none">
              {/* tick marks */}
              <div className="absolute inset-0 pointer-events-none">
                {tickAngles.map((a, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-muted-foreground/40 rounded-full"
                    style={{
                      transform: `rotate(${a}deg) translateY(-118px)`,
                      transformOrigin: '0 0',
                    }}
                  />
                ))}
              </div>

              <div
                ref={knobRef}
                onPointerDown={onPointerDown}
                role="slider"
                aria-valuemin={MIN_UNITS}
                aria-valuemax={MAX_UNITS}
                aria-valuenow={units}
                aria-label={isEn ? 'Message volume' : 'Idadi ya ujumbe'}
                className="relative w-48 h-48 rounded-full cursor-grab active:cursor-grabbing touch-none shadow-warm border-4 border-background"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, hsl(var(--secondary)), hsl(var(--muted)) 70%)',
                }}
              >
                {/* indicator line */}
                <div
                  className="absolute inset-0 transition-transform duration-75"
                  style={{ transform: `rotate(${toAngle(units)}deg)` }}
                >
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 w-1.5 h-8 rounded-full bg-primary" />
                </div>
                {/* center cap */}
                <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-background shadow-inner flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    {isEn ? 'VOLUME' : 'IDADI'}
                  </span>
                </div>
              </div>

              {/* +/- buttons */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setUnits(clamp(units - 50))}
                  className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
                  aria-label={isEn ? 'Decrease' : 'Punguza'}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUnits(clamp(units + 50))}
                  className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
                  aria-label={isEn ? 'Increase' : 'Ongeza'}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Readout */}
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground mb-1">
                {isEn ? 'Messages' : 'Ujumbe'}
              </p>
              <p className="font-heading text-5xl font-bold text-foreground mb-4">
                {fmt(units)}
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                {isEn ? 'Estimated total' : 'Jumla ya gharama'}
              </p>
              <p className="font-heading text-4xl font-bold text-primary">
                TZS {fmt(total)}
              </p>
            </div>
          </div>

          {/* Discount note */}
          <div className="mt-10 flex items-start gap-3 rounded-2xl bg-gold/10 border border-gold/30 p-4">
            <BadgePercent className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              {isEn
                ? 'Good news — discounts are available depending on your volume and how we negotiate. Talk to us and we will find a price that works for you.'
                : 'Habari njema — unaweza kupata punguzo (discount) kulingana na idadi ya ujumbe wako na mazungumzo yetu. Wasiliana nasi tupate bei inayokufaa.'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSimulator;
