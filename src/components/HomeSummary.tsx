import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, HeartHandshake, Sparkles, Route, Tag } from 'lucide-react';
import Reveal from '@/components/Reveal';
import AnimatedHeading from '@/components/AnimatedHeading';

const HomeSummary = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const cards = [
    {
      icon: HeartHandshake,
      to: '/about',
      title: isEn ? 'Who we are' : 'Sisi ni nani',
      desc: isEn
        ? 'A small Tanzanian team obsessed with the moment a guest walks in.'
        : 'Timu ndogo ya Kitanzania inayojali sana dakika mgeni anapoingia.',
    },
    {
      icon: Sparkles,
      to: '/features',
      title: isEn ? 'What we do' : 'Tunachofanya',
      desc: isEn
        ? 'Invites, reminders, e-cards and QR check-in — in one calm place.'
        : 'Mialiko, vikumbusho, e-cards na check-in ya QR — sehemu moja tulivu.',
    },
    {
      icon: Route,
      to: '/how-it-works',
      title: isEn ? 'How it works' : 'Inavyofanya kazi',
      desc: isEn
        ? 'Five steps from your guest list to a report you can trust.'
        : 'Hatua tano kutoka orodha ya wageni hadi ripoti ya kuaminika.',
    },
    {
      icon: Tag,
      to: '/pricing',
      title: isEn ? 'Packages' : 'Vifurushi',
      desc: isEn
        ? 'Simple pricing that fits a wedding, a launch or a whole institution.'
        : 'Bei rahisi inayofaa harusi, uzinduzi au taasisi nzima.',
    },
  ];

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Reveal>
            <span className="eyebrow mb-6">{isEn ? 'In short' : 'Kwa kifupi'}</span>
          </Reveal>
          <h2 className="font-heading mb-5 text-3xl font-bold text-foreground md:text-5xl">
            <AnimatedHeading
              text={isEn ? 'We look after the guest list.' : 'Sisi tunashika orodha ya wageni.'}
            />
            <span className="block text-primary">
              <AnimatedHeading
                text={isEn ? 'You look after the people.' : 'Wewe unashika watu wako.'}
                delay={0.25}
              />
            </span>
          </h2>
          <Reveal delay={0.35}>
            <p className="text-lg text-muted-foreground">
              {isEn
                ? 'Everything below has a page of its own — take the tour at your own pace.'
                : 'Kila kitu hapa chini kina ukurasa wake — tembea kwa mwendo wako.'}
            </p>
          </Reveal>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.to}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={c.to}
                className="soft-card group flex h-full flex-col rounded-3xl p-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <c.icon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                </span>
                <h3 className="font-heading mb-2 text-xl font-bold text-foreground">{c.title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {isEn ? 'Read more' : 'Soma zaidi'}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeSummary;
