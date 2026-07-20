import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

import { useLanguage } from '@/contexts/LanguageContext';

const NBC_MERCHANT_ID = '41048485';
const NBC_MERCHANT_NAME = 'Smart Events Tanzania';

const HowToPay = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <section id="howtopay" className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'How to Pay' : 'Jinsi ya Kulipa'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {isEn ? 'Use NBC Lipa No. to make your payment via Mobile Money or Bank' : 'Tumia NBC Lipa No. kulipa kupitia Mobile Money au Benki'}
          </p>
        </motion.div>

        {/* NBC Lipa No. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto"
        >
          <h3 className="font-heading text-2xl font-bold text-foreground mb-1">NBC Lipa No.</h3>
          <p className="text-sm font-medium text-foreground mb-3">{NBC_MERCHANT_NAME}</p>
          <p className="text-muted-foreground text-sm mb-4">
            {isEn ? 'Scan the QR code or use the Lipa No. below' : 'Scan QR code au tumia Lipa No. hapa chini'}
          </p>
          <div className="bg-warm-cream rounded-xl p-4 inline-block mb-4 shadow-warm">
            <QRCodeSVG value={NBC_MERCHANT_ID} size={160} />
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">{isEn ? 'Lipa No.' : 'Lipa No.'}:</p>
            <p className="text-2xl font-bold text-foreground">{NBC_MERCHANT_ID}</p>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-warm-cream/40 text-xs text-muted-foreground text-left">
            <p className="font-semibold mb-1">{isEn ? 'Steps:' : 'Hatua:'}</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>{isEn ? 'Open your Mobile Money or Bank app' : 'Fungua app ya Mobile Money au Benki yako'}</li>
              <li>{isEn ? 'Select Pay Merchant / Lipa Namba and enter the Lipa No.' : 'Chagua Lipa kwa Namba kisha weka Lipa No.'}</li>
              <li>{isEn ? 'Enter amount and confirm' : 'Weka kiasi na uthibitishe'}</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowToPay;
