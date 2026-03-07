import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import selcomQr from '@/assets/selcom-qr.png';
import { useLanguage } from '@/contexts/LanguageContext';

const MPESA_MERCHANT_ID = '5537073';
const SELCOM_ACCOUNT = '5525100337337';

const HowToPay = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <section id="howtopay" className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
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
            {isEn ? 'Choose your preferred payment method below' : 'Chagua njia unayoipendelea ya malipo hapa chini'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* M-Pesa */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-700">M</span>
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Lipa kwa M-Pesa</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isEn ? 'Scan the QR code or use the merchant number below' : 'Scan QR code au tumia namba ya merchant hapa chini'}
            </p>
            <div className="bg-white rounded-xl p-4 inline-block mb-4 shadow-warm">
              <QRCodeSVG value={MPESA_MERCHANT_ID} size={160} />
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{isEn ? 'Merchant Number' : 'Namba ya Merchant'}:</p>
              <p className="text-3xl font-bold text-foreground">{MPESA_MERCHANT_ID}</p>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground text-left">
              <p className="font-semibold mb-1">{isEn ? 'Steps:' : 'Hatua:'}</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>{isEn ? 'Open M-Pesa on your phone' : 'Fungua M-Pesa kwenye simu yako'}</li>
                <li>{isEn ? 'Select "Lipa kwa Namba"' : 'Chagua "Lipa kwa Namba"'}</li>
                <li>{isEn ? `Enter merchant number: ${MPESA_MERCHANT_ID}` : `Weka namba ya merchant: ${MPESA_MERCHANT_ID}`}</li>
                <li>{isEn ? 'Enter amount and confirm' : 'Weka kiasi na uthibitishe'}</li>
              </ol>
            </div>
          </motion.div>

          {/* Selcom Pesa */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-700">S</span>
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Selcom Pesa</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isEn ? 'Scan the QR code or use the account number below' : 'Scan QR code au tumia namba ya akaunti hapa chini'}
            </p>
            <div className="bg-white rounded-xl p-2 inline-block mb-4 shadow-warm">
              <img src={selcomQr} alt="Selcom Pesa QR" className="w-40 h-40 object-contain" />
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
      </div>
    </section>
  );
};

export default HowToPay;
