export const CARD_W = 900;
export const CARD_H = 1200;

export type ElType = 'text' | 'qr' | 'logo';

export type CardElement = {
  id: string;
  type: ElType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  // text only
  text?: string;
  fontSize?: number;
  color?: string;
  weight?: number;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  italic?: boolean;
  shadow?: boolean;
  // qr only
  qrBg?: 'white' | 'transparent';
  qrFg?: string;
  qrPad?: number;
};

export type CardData = {
  guestName: string;
  cardNumber: string;
  title: string;
  dateText: string;
  venue: string;
  qrValue: string;
};

export const TOKENS = ['{jina}', '{kadi}', '{tukio}', '{tarehe}', '{mahali}'] as const;

export function renderTokens(raw: string, d: CardData) {
  return (raw || '')
    .replaceAll('{jina}', d.guestName || 'Jina la Mgeni')
    .replaceAll('{kadi}', d.cardNumber || '—')
    .replaceAll('{tukio}', d.title || '')
    .replaceAll('{tarehe}', d.dateText || '')
    .replaceAll('{mahali}', d.venue || '');
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function newElement(type: ElType): CardElement {
  const base = { id: uid(), type, rotation: 0, opacity: 1 } as CardElement;
  if (type === 'qr') return { ...base, x: 620, y: 900, w: 210, h: 210, qrBg: 'white', qrFg: '#111111', qrPad: 12 };
  if (type === 'logo') return { ...base, x: 360, y: 60, w: 180, h: 180 };
  return {
    ...base,
    x: 90, y: 520, w: 720, h: 90,
    text: '{jina}',
    fontSize: 56, color: '#ffffff', weight: 600, align: 'center',
    letterSpacing: 0, lineHeight: 1.2, italic: false, shadow: true,
  };
}
