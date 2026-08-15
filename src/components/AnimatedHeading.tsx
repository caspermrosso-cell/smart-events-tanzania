import { motion } from 'framer-motion';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  delay?: number;
}

/** Splits a heading into words that rise into place one after another. */
const AnimatedHeading = ({ text, className, delay = 0 }: AnimatedHeadingProps) => (
  <motion.span
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    transition={{ staggerChildren: 0.05, delayChildren: delay }}
    className={`inline-block ${className ?? ''}`}
  >
    {text.split(' ').map((word, i) => (
      <motion.span
        key={`${word}-${i}`}
        variants={{
          hidden: { opacity: 0, y: '0.5em', filter: 'blur(5px)' },
          visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {word}&nbsp;
      </motion.span>
    ))}
  </motion.span>
);

export default AnimatedHeading;
