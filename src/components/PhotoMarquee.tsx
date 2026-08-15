import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Reveal from '@/components/Reveal';
import imgA from '@/assets/amaizing-setting-tableware-appliances-some-romantic-place.jpg.asset.json';
import imgB from '@/assets/bunch-flowers-leaves-table.jpg.asset.json';
import imgC from '@/assets/festive-dinner-table-decorated-white-green-tones.jpg.asset.json';
import heroEvents from '@/assets/hero-events.jpg';
import heroWelcome from '@/assets/hero-welcome.jpg';

type Shot = { src: string; alt: string };

const Row = ({ shots, duration, reverse }: { shots: Shot[]; duration: number; reverse?: boolean }) => {
  const loop = [...shots, ...shots];
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex w-max gap-5"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {loop.map((s, i) => (
          <figure
            key={i}
            className="soft-card h-52 w-72 shrink-0 overflow-hidden rounded-3xl p-0 md:h-64 md:w-96"
          >
            <img
              src={s.src}
              alt={s.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </figure>
        ))}
      </motion.div>
    </div>
  );
};

const PhotoMarquee = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const rowOne: Shot[] = [
    { src: imgA.url, alt: isEn ? 'Candlelit wedding reception table' : 'Meza ya harusi yenye mishumaa' },
    { src: imgB.url, alt: isEn ? 'Wedding hall with floral centrepieces' : 'Ukumbi wa harusi wenye maua' },
    { src: imgC.url, alt: isEn ? 'Garden dinner table in white and green' : 'Meza ya chakula bustanini' },
  ];
  const rowTwo: Shot[] = [
    { src: heroWelcome, alt: isEn ? 'Guests being welcomed at check-in' : 'Wageni wakikaribishwa kwenye check-in' },
    { src: imgC.url, alt: isEn ? 'Long banquet table set for guests' : 'Meza ndefu iliyoandaliwa kwa wageni' },
    { src: heroEvents, alt: isEn ? 'Event in full flow' : 'Tukio likiendelea' },
    { src: imgA.url, alt: isEn ? 'Elegant table setting' : 'Mapambo ya meza' },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto mb-10 px-4 text-center">
        <Reveal>
          <span className="eyebrow mb-5">{isEn ? 'Moments' : 'Kumbukumbu'}</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            {isEn ? 'Rooms we have helped fill.' : 'Kumbi tulizosaidia kuzijaza.'}
          </h2>
        </Reveal>
      </div>

      <div className="space-y-5">
        <Row shots={rowOne} duration={70} />
        <Row shots={rowTwo} duration={90} reverse />
      </div>
    </section>
  );
};

export default PhotoMarquee;
