import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send, Clock, MessageSquare, Users } from 'lucide-react';

export interface PreviewRecipient {
  name: string;
  phone: string;
  vars?: Record<string, string>;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  message: string;
  recipients: PreviewRecipient[];
  eventTitle?: string;
  eventDate?: string;
  smsCount: number;
  scheduled?: boolean;
  scheduleAt?: string;
  sending: boolean;
  onConfirm: () => void;
}

const renderMessage = (
  tpl: string,
  r: PreviewRecipient,
  eventTitle?: string,
  eventDate?: string,
) => {
  let out = tpl
    .replace(/\{name\}/g, r.name || '')
    .replace(/\{event\}/g, eventTitle || '')
    .replace(/\{date\}/g, eventDate ? new Date(eventDate).toLocaleDateString('sw-TZ') : '');
  if (r.vars) {
    for (const [k, v] of Object.entries(r.vars)) {
      const re = new RegExp(`\\{${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g');
      out = out.replace(re, String(v ?? ''));
    }
  }
  return out.replace(/\{[a-zA-Z0-9_]+\}/g, '');
};

const SmsPreviewDialog = ({
  open, onOpenChange, message, recipients, eventTitle, eventDate,
  smsCount, scheduled, scheduleAt, sending, onConfirm,
}: Props) => {
  const total = recipients.length;
  const previewList = recipients.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Kagua SMS Kabla ya Kutuma
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Wapokeaji</p>
            <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
              <Users className="w-4 h-4" /> {total}
            </p>
          </div>
          <div className="rounded-lg border border-border p-2">
            <p className="text-[10px] uppercase text-muted-foreground">SMS/mmoja</p>
            <p className="text-lg font-bold text-foreground">{smsCount}</p>
          </div>
          <div className="rounded-lg border border-border p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Jumla SMS</p>
            <p className="text-lg font-bold text-primary">{total * smsCount}</p>
          </div>
        </div>

        {scheduled && scheduleAt && (
          <div className="flex items-center gap-2 text-xs rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-primary">
            <Clock className="w-3.5 h-3.5" />
            Zitatumwa: <strong>{scheduleAt}</strong>
          </div>
        )}

        <div className="space-y-2 max-h-[45vh] overflow-y-auto">
          <p className="text-xs text-muted-foreground">
            Onyesho la SMS {previewList.length} za kwanza (kila mpokeaji ana ujumbe wake baada ya variables kubadilishwa):
          </p>
          {previewList.map((r, i) => {
            const rendered = renderMessage(message, r, eventTitle, eventDate);
            const chars = rendered.length;
            const segs = chars === 0 ? 0 : chars <= 160 ? 1 : Math.ceil(chars / 153);
            return (
              <div key={i} className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 text-xs">
                  <span className="font-medium text-foreground">{r.name}</span>
                  <span className="text-muted-foreground">{r.phone}</span>
                </div>
                <div className="px-3 py-2 bg-background">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{rendered || <em className="text-muted-foreground">(tupu)</em>}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{chars} herufi • SMS {segs}</p>
                </div>
              </div>
            );
          })}
          {total > previewList.length && (
            <p className="text-xs text-center text-muted-foreground pt-1">
              …na wapokeaji wengine {total - previewList.length}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Rudi Kuhariri
          </Button>
          <Button onClick={onConfirm} disabled={sending} className="gap-2">
            {sending ? 'Inatuma...' : scheduled ? <><Clock className="w-4 h-4" /> Thibitisha Kupanga</> : <><Send className="w-4 h-4" /> Thibitisha & Tuma</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmsPreviewDialog;