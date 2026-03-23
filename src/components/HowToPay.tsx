import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

import { useLanguage } from '@/contexts/LanguageContext';
import selcomLogo from '@/assets/selcom-logo.png';

const SELCOM_ACCOUNT = '5525100337337';

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
            {isEn ? 'Use Selcom Pesa to make your payment' : 'Tumia Selcom Pesa kufanya malipo yako'}
          </p>
        </motion.div>

        {/* Selcom Pesa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden mx-auto mb-4">
            <img src={selcomLogo} alt="Selcom" className="w-full h-full object-contain bg-white" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Selcom Pesa</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {isEn ? 'Scan the QR code or use the account number below' : 'Scan QR code au tumia namba ya akaunti hapa chini'}
          </p>
          <div className="bg-white rounded-xl p-4 inline-block mb-4 shadow-warm">
            <QRCodeSVG value={SELCOM_ACCOUNT} size={160} />
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">{isEn ? 'Account Number' : 'Namba ya Akaunti'}:</p>
            <p className="text-2xl font-bold text-foreground">{SELCOM_ACCOUNT}</p>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground text-left">
            <p className="font-semibold mb-1">{isEn ? 'Steps:' : 'Hatua:'}</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>{isEn ? 'Open Selcom Pesa app' : 'Fungua app ya Selcom Pesa'}</li>
              <li>{isEn ? 'Scan QR code or enter account number' : 'Scan QR code au weka namba ya akaunti'}</li>
              <li>{isEn ? 'Enter amount and confirm' : 'Weka kiasi na uthibitishe'}</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowToPay;
