import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, QrCode, MessageCircle } from 'lucide-react';
import heroImage from '@/assets/hero-welcome.jpg';

const Hero = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const chips = [
    { icon: MessageCircle, label: isEn ? 'Invites by SMS & WhatsApp' : 'Mialiko kwa SMS & WhatsApp' },
    { icon: QrCode, label: isEn ? 'QR check-in at the door' : 'Check-in ya QR mlangoni' },
    { icon: CheckCircle2, label: isEn ? 'Live attendance you can trust' : 'Mahudhurio ya wakati halisi' },
  ];

  return (
    <section id="hero" className="relative overflow-hidden bg-background pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="pointer-events-none absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[26rem] w-[26rem] rounded-full bg-secondary blur-3xl" />

      <div className="container relative z-10 mx-auto grid items-center gap-12 px-4 lg:grid-cols-[1.05fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {isEn ? 'Karibu — made in Tanzania' : 'Karibu — imetengenezwa Tanzania'}
          </span>

          <h1 className="font-heading mb-6 text-4xl font-bold leading-[1.05] text-foreground md:text-6xl">
            {isEn ? (
              <>
                Every guest arrives
                <span className="block text-primary">feeling expected.</span>
              </>
            ) : (
              <>
                Kila mgeni afike
                <span className="block text-primary">akijua anasubiriwa.</span>
              </>
            )}
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {isEn
              ? 'Smart Events handles the invitations, the reminders and the door — so you can spend the day with your people instead of a clipboard.'
              : 'Smart Events inashughulikia mialiko, vikumbusho na mlango — ili siku yako uitumie na watu wako, si na daftari la majina.'}
          </p>

          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => scrollTo('contact')}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-warm transition-all hover:bg-foreground"
            >
              {isEn ? 'Book a Demo' : 'Omba Demo'}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => scrollTo('howitworks')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-lg font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-secondary"
            >
              {isEn ? 'See How It Works' : 'Jinsi Inavyofanya Kazi'}
            </button>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {chips.map((c, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <c.icon className="h-4 w-4 text-primary" />
                {c.label}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-warm">
            <img
              src={heroImage}
              alt={isEn ? 'A hostess welcoming a guest at a Smart Events check-in desk' : 'Mhudumu akimkaribisha mgeni kwenye meza ya check-in ya Smart Events'}
              width={1600}
              height={1200}
              className="h-[22rem] w-full object-cover md:h-[30rem]"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="soft-card absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl px-5 py-4 md:left-8"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="font-heading text-lg font-bold leading-none text-foreground">218 / 240</p>
              <p className="text-xs text-muted-foreground">
                {isEn ? 'guests checked in tonight' : 'wageni wamecheck-in leo'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <p className="container relative z-10 mx-auto mt-16 px-4 text-center text-sm text-muted-foreground">
        {isEn
          ? 'Trusted by weddings, institutions and corporate teams across Tanzania.'
          : 'Inaaminiwa na harusi, taasisi na makampuni kote Tanzania.'}
      </p>
    </section>
  );
};

export default Hero;
