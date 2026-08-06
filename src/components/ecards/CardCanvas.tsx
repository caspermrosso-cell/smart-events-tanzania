import { forwardRef, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import smartEventsLogo from '@/assets/smart-events-logo.png.asset.json';
import { CARD_H, CARD_W, CardData, CardElement, renderTokens } from './cardTypes';

type Props = {
  background: string | null;
  overlay: number;
  elements: CardElement[];
  data: CardData;
  scale: number;
  selectedId?: string | null;
  interactive?: boolean;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, patch: Partial<CardElement>) => void;
};

const CardCanvas = forwardRef<HTMLDivElement, Props>(function CardCanvas(
  { background, overlay, elements, data, scale, selectedId, interactive, onSelect, onChange },
  ref,
) {
  const dragRef = useRef<{ id: string; mode: 'move' | 'resize'; sx: number; sy: number; el: CardElement } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, el: CardElement, mode: 'move' | 'resize') => {
      if (!interactive) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onSelect?.(el.id);
      dragRef.current = { id: el.id, mode, sx: e.clientX, sy: e.clientY, el };
    },
    [interactive, onSelect],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || !onChange) return;
      const dx = (e.clientX - d.sx) / scale;
      const dy = (e.clientY - d.sy) / scale;
      if (d.mode === 'move') {
        onChange(d.id, {
          x: Math.round(Math.min(CARD_W - 20, Math.max(-d.el.w + 20, d.el.x + dx))),
          y: Math.round(Math.min(CARD_H - 20, Math.max(-d.el.h + 20, d.el.y + dy))),
        });
      } else {
        const w = Math.max(40, Math.round(d.el.w + dx));
        const square = d.el.type !== 'text';
        onChange(d.id, { w, h: square ? w : Math.max(30, Math.round(d.el.h + dy)) });
      }
    },
    [onChange, scale],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div
      className="relative origin-top-left overflow-hidden rounded-[18px] bg-muted shadow-2xl"
      style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})` }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerDown={() => interactive && onSelect?.(null)}
      ref={ref}
    >
      {background ? (
        <img src={background} alt="" crossOrigin="anonymous" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-accent/30" />
      )}
      {overlay > 0 && <div className="absolute inset-0 bg-black" style={{ opacity: overlay }} />}

      {elements.map((el) => {
        const selected = interactive && selectedId === el.id;
        return (
          <div
            key={el.id}
            onPointerDown={(e) => onPointerDown(e, el, 'move')}
            className={`absolute ${interactive ? 'cursor-move' : ''}`}
            style={{
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              opacity: el.opacity,
              transform: `rotate(${el.rotation}deg)`,
              outline: selected ? '3px dashed hsl(var(--primary))' : 'none',
              outlineOffset: 4,
            }}
          >
            {el.type === 'text' && (
              <div
                className="flex h-full w-full whitespace-pre-wrap break-words"
                style={{
                  color: el.color,
                  fontSize: el.fontSize,
                  fontWeight: el.weight,
                  letterSpacing: el.letterSpacing,
                  lineHeight: el.lineHeight,
                  fontStyle: el.italic ? 'italic' : 'normal',
                  textAlign: el.align,
                  textShadow: el.shadow ? '0 3px 14px rgba(0,0,0,.55)' : 'none',
                  alignItems: 'center',
                  justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
                }}
              >
                <span style={{ width: '100%' }}>{renderTokens(el.text || '', data)}</span>
              </div>
            )}

            {el.type === 'qr' && (
              <div
                className="flex h-full w-full items-center justify-center rounded-lg"
                style={{
                  background: el.qrBg === 'white' ? '#ffffff' : 'transparent',
                  padding: el.qrPad ?? 12,
                }}
              >
                <QRCodeSVG
                  value={data.qrValue || 'smart-events'}
                  size={Math.max(32, el.w - 2 * (el.qrPad ?? 12))}
                  fgColor={el.qrFg || '#111111'}
                  bgColor={el.qrBg === 'white' ? '#ffffff' : 'transparent'}
                  level="M"
                />
              </div>
            )}

{el.type === 'logo' && (
              <img src={smartEventsLogo.url} alt="Smart Events" crossOrigin="anonymous" className="h-full w-full object-contain" />
            )}

            {selected && (
              <div
                onPointerDown={(e) => onPointerDown(e, el, 'resize')}
                className="absolute -bottom-3 -right-3 h-6 w-6 cursor-nwse-resize rounded-full border-2 border-background bg-primary"
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

export default CardCanvas;
