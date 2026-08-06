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
  fontFamily?: string;
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
  // logo only
  src?: string;
};

export const FONT_OPTIONS = [
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Cinzel', value: "'Cinzel', serif" },
  { label: 'Great Vibes', value: "'Great Vibes', cursive" },
  { label: 'Dancing Script', value: "'Dancing Script', cursive" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Georgia', value: "Georgia, serif" },
  { label: 'Courier', value: "'Courier New', monospace" },
] as const;

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
    .replace(/\{jina\}/g, d.guestName || 'Jina la Mgeni')
    .replace(/\{kadi\}/g, d.cardNumber || '—')
    .replace(/\{tukio\}/g, d.title || '')
    .replace(/\{tarehe\}/g, d.dateText || '')
    .replace(/\{mahali\}/g, d.venue || '');
}

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Human-readable QR payload carrying guest name + card details. */
export function buildQrPayload(input: {
  guestId?: string;
  guestName?: string;
  cardNumber?: string;
  title?: string;
  dateText?: string;
  venue?: string;
  eventId?: string;
}) {
  return [
    'SMART EVENTS',
    `Jina: ${input.guestName || '—'}`,
    `Kadi: ${input.cardNumber || '—'}`,
    `Tukio: ${input.title || '—'}`,
    `Tarehe: ${input.dateText || '—'}`,
    `Mahali: ${input.venue || '—'}`,
    `ID: ${input.guestId || '—'}`,
    `EV: ${input.eventId || '—'}`,
  ].join('\n');
}

/** Parse a scanned code into identifiers usable for check-in. */
export function parseQrPayload(raw: string): { guestId?: string; cardNumber?: string; raw: string } {
  const text = (raw || '').trim();
  const idMatch = text.match(/^ID:\s*(.+)$/mi);
  const cardMatch = text.match(/^Kadi:\s*(.+)$/mi);
  if (idMatch || cardMatch) {
    return { guestId: idMatch?.[1]?.trim(), cardNumber: cardMatch?.[1]?.trim(), raw: text };
  }
  try {
    const j = JSON.parse(text);
    if (j && typeof j === 'object') return { guestId: j.g || j.id, cardNumber: j.c || j.card_number, raw: text };
  } catch { /* plain code */ }
  return { raw: text };
}

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
