import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertCircle, ImageIcon, FileText, MapPin, Video, MessageSquare, List, Loader2, Upload, Plus, Trash2, Receipt } from 'lucide-react';
import SmsInvoiceDialog from '@/components/sms/SmsInvoiceDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';

type MessageType = 'text' | 'image' | 'document' | 'video' | 'location' | 'quick_reply' | 'list';

interface ManualRecipient {
  id: string;
  name: string;
  phone: string;
}

const DEFAULT_WHATSAPP_BUSINESS_NUMBER = '255736670202';
const DEFAULT_BUSINESS_NAME = 'Smart Events Tanzania';

const WhatsAppCompose = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fromNumber, setFromNumber] = useState(DEFAULT_WHATSAPP_BUSINESS_NUMBER);
  const [channel, setChannel] = useState('whatsapp');
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaMimeType, setMediaMimeType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [manualRecipients, setManualRecipients] = useState<ManualRecipient[]>([]);
  const [recipientMode, setRecipientMode] = useState<'single' | 'bulk'>('single');
  const [singlePhone, setSinglePhone] = useState('');
  const [singleName, setSingleName] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceUnits, setInvoiceUnits] = useState(0);

  // Quick Reply state
  const [qrHeader, setQrHeader] = useState('');
  const [qrText, setQrText] = useState('');
  const [qrOptions, setQrOptions] = useState([{ title: '', postbackText: '' }]);

  // List Reply state
  const [listTitle, setListTitle] = useState('');
  const [listBody, setListBody] = useState('');
  const [listButtonText, setListButtonText] = useState('');
  const [listItems, setListItems] = useState([{ title: '', options: [{ title: '', description: '', postbackText: '' }] }]);

  const { data: events = [] } = useQuery({
    queryKey: ['events-for-whatsapp'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title, event_date').order('event_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['guests-for-whatsapp', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data, error } = await supabase.from('guests').select('id, full_name, phone').eq('event_id', selectedEventId);
      if (error) throw error;
      return (data || []).filter((g: any) => g.phone);
    },
    enabled: !!selectedEventId,
  });

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const imported = rows.map((r, i) => ({
        id: `upload-${Date.now()}-${i}`,
        name: r.name || r.Name || r.jina || r.Jina || '',
        phone: String(r.phone || r.Phone || r.simu || r.Simu || r.number || ''),
      })).filter(r => r.phone);
      setManualRecipients(prev => [...prev, ...imported]);
      toast({ title: `${imported.length} contacts imported` });
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const addManualRecipient = () => {
    setManualRecipients(prev => [...prev, { id: `manual-${Date.now()}`, name: '', phone: '' }]);
  };

  const removeManualRecipient = (id: string) => {
    setManualRecipients(prev => prev.filter(r => r.id !== id));
  };

  const toggleGuest = (guestId: string) => {
    setSelectedGuests(prev => prev.includes(guestId) ? prev.filter(id => id !== guestId) : [...prev, guestId]);
  };

  const selectAllGuests = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map((g: any) => g.id));
    }
  };

  const buildMessagePayload = () => {
    const payload: any = { message_type: messageType };

    if (messageType === 'text') {
      payload.text = text;
    } else if (messageType === 'image') {
      payload.image = { mime_type: mediaMimeType || 'image/jpeg', url: mediaUrl };
    } else if (messageType === 'document') {
      payload.document = { mime_type: mediaMimeType || 'application/pdf', url: mediaUrl };
    } else if (messageType === 'video') {
      payload.video = { mime_type: mediaMimeType || 'video/mp4', url: mediaUrl };
    } else if (messageType === 'location') {
      payload.location = { latitude, longitude };
    } else if (messageType === 'quick_reply') {
      payload.quick_reply = {
        type: 'quick_reply',
        content: { type: 'text', text: qrText, header: qrHeader || undefined },
        options: qrOptions.map(o => ({ title: o.title, type: 'text', postbackText: o.postbackText })),
      };
    } else if (messageType === 'list') {
      payload.list_reply = {
        type: 'list',
        title: listTitle,
        body: listBody,
        globalButtons: [{ title: listButtonText || 'Select', type: 'text' }],
        items: listItems.map(item => ({
          title: item.title,
          options: item.options.map(opt => ({
            type: 'text',
            title: opt.title,
            description: opt.description || undefined,
            postbackText: opt.postbackText,
          })),
        })),
      };
    }

    return payload;
  };

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!fromNumber.trim()) errors.push('WhatsApp Business number is required');
    
    if (recipientMode === 'single') {
      if (!singlePhone.trim()) errors.push('Recipient phone number is required');
    } else {
      const totalRecipients = selectedGuests.length + manualRecipients.filter(r => r.phone.trim()).length;
      if (totalRecipients === 0) errors.push('At least one recipient is required');
    }

    if (messageType === 'text' && !text.trim()) errors.push('Message text is required');
    if (['image', 'document', 'video'].includes(messageType) && !mediaUrl.trim()) errors.push('Media URL is required');
    if (messageType === 'location' && (!latitude.trim() || !longitude.trim())) errors.push('Latitude and longitude are required');
    if (messageType === 'quick_reply') {
      if (!qrText.trim()) errors.push('Quick reply text is required');
      if (qrOptions.some(o => !o.title.trim())) errors.push('All quick reply options need a title');
    }
    if (messageType === 'list') {
      if (!listBody.trim()) errors.push('List body text is required');
      if (listItems.some(i => !i.title.trim())) errors.push('All list items need a title');
    }

    return errors;
  }, [fromNumber, singlePhone, recipientMode, selectedGuests, manualRecipients, messageType, text, mediaUrl, latitude, longitude, qrText, qrOptions, listBody, listItems]);

  const handleSend = async () => {
    if (validationErrors.length > 0) return;
    setSending(true);

    try {
      if (recipientMode === 'single') {
        const msgPayload = buildMessagePayload();
        const { data, error } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            action: 'send-message',
            from: fromNumber,
            to: singlePhone.replace(/[^0-9]/g, '').startsWith('0') ? '255' + singlePhone.replace(/[^0-9]/g, '').substring(1) : singlePhone.replace(/[^0-9]/g, ''),
            channel,
            userId: user?.id,
            eventId: selectedEventId || null,
            recipientName: singleName || null,
            ...msgPayload,
          },
        });
        if (error) throw error;
        if (data?.success === false) {
          toast({
            title: data.code === 'WHATSAPP_SESSION_EXPIRED' ? 'WhatsApp session expired' : 'Send failed',
            description: data.hint || data.error,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Message sent successfully!' });
          setInvoiceUnits(1);
          setInvoiceOpen(true);
        }
      } else {
        // Bulk send
        const allRecipients = [
          ...guests.filter((g: any) => selectedGuests.includes(g.id)).map((g: any) => ({ name: g.full_name, phone: g.phone })),
          ...manualRecipients.filter(r => r.phone.trim()).map(r => ({ name: r.name, phone: r.phone })),
        ];

        const msgPayload = buildMessagePayload();
        const { data, error } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            action: 'send-bulk',
            from: fromNumber,
            recipients: allRecipients,
            channel,
            userId: user?.id,
            eventId: selectedEventId || null,
            ...msgPayload,
          },
        });
        if (error) throw error;

        const results = data?.results || [];
        const sent = results.filter((r: any) => r.status === 'sent').length;
        const failed = results.filter((r: any) => r.status === 'failed').length;
        toast({ title: `Sent: ${sent}, Failed: ${failed}` });
        if (sent > 0) {
          setInvoiceUnits(sent);
          setInvoiceOpen(true);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sender & Channel */}
      <Card>
        <CardHeader><CardTitle className="text-base">Sender Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>WhatsApp Business Number</Label>
              <Input placeholder={`e.g. ${DEFAULT_WHATSAPP_BUSINESS_NUMBER}`} value={fromNumber} onChange={e => setFromNumber(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">{DEFAULT_BUSINESS_NAME}</p>
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google_business_messaging">Google Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={recipientMode} onValueChange={(v) => setRecipientMode(v as 'single' | 'bulk')}>
            <TabsList>
              <TabsTrigger value="single">Single</TabsTrigger>
              <TabsTrigger value="bulk">Bulk</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-3 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input placeholder="e.g. 0701000001" value={singlePhone} onChange={e => setSinglePhone(e.target.value)} />
                </div>
                <div>
                  <Label>Name (optional)</Label>
                  <Input placeholder="Recipient name" value={singleName} onChange={e => setSingleName(e.target.value)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 mt-3">
              {/* Event guests */}
              <div>
                <Label>Select Event (optional)</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger><SelectValue placeholder="Choose event..." /></SelectTrigger>
                  <SelectContent>
                    {events.map((ev: any) => (
                      <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {guests.length > 0 && (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox checked={selectedGuests.length === guests.length && guests.length > 0} onCheckedChange={selectAllGuests} />
                    <span className="text-sm font-medium">Select All ({guests.length})</span>
                  </div>
                  {guests.map((g: any) => (
                    <div key={g.id} className="flex items-center gap-2">
                      <Checkbox checked={selectedGuests.includes(g.id)} onCheckedChange={() => toggleGuest(g.id)} />
                      <span className="text-sm">{g.full_name} — {g.phone}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual + upload */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addManualRecipient}><Plus className="w-3 h-3 mr-1" /> Add Manually</Button>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild><span><Upload className="w-3 h-3 mr-1" /> Upload Excel</span></Button>
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkUpload} />
                </label>
              </div>

              {manualRecipients.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Input placeholder="Name" value={r.name} onChange={e => setManualRecipients(prev => prev.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} className="flex-1" />
                  <Input placeholder="Phone" value={r.phone} onChange={e => setManualRecipients(prev => prev.map(x => x.id === r.id ? { ...x, phone: e.target.value } : x))} className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeManualRecipient(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader><CardTitle className="text-base">Message</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={v => setMessageType(v as MessageType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text"><span className="flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Text</span></SelectItem>
                <SelectItem value="image"><span className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Image</span></SelectItem>
                <SelectItem value="document"><span className="flex items-center gap-2"><FileText className="w-3 h-3" /> Document</span></SelectItem>
                <SelectItem value="video"><span className="flex items-center gap-2"><Video className="w-3 h-3" /> Video</span></SelectItem>
                <SelectItem value="location"><span className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Location</span></SelectItem>
                <SelectItem value="quick_reply">Quick Reply</SelectItem>
                <SelectItem value="list"><span className="flex items-center gap-2"><List className="w-3 h-3" /> List</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text */}
          {messageType === 'text' && (
            <div>
              <Label>Message</Label>
              <Textarea placeholder="Type your message... Use {name} for personalization" value={text} onChange={e => setText(e.target.value)} rows={4} />
              <p className="text-xs text-muted-foreground mt-1">{text.length} characters</p>
            </div>
          )}

          {/* Image / Document / Video */}
          {['image', 'document', 'video'].includes(messageType) && (
            <div className="space-y-3">
              <div>
                <Label>Media URL (publicly accessible)</Label>
                <Input placeholder="https://example.com/file.pdf" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
              </div>
              <div>
                <Label>MIME Type</Label>
                <Input placeholder={messageType === 'image' ? 'image/jpeg' : messageType === 'document' ? 'application/pdf' : 'video/mp4'} value={mediaMimeType} onChange={e => setMediaMimeType(e.target.value)} />
              </div>
              {messageType !== 'document' && (
                <div>
                  <Label>Text/Caption (optional)</Label>
                  <Textarea placeholder="Optional caption..." value={text} onChange={e => setText(e.target.value)} rows={2} />
                </div>
              )}
            </div>
          )}

          {/* Location */}
          {messageType === 'location' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input placeholder="-6.7924" value={latitude} onChange={e => setLatitude(e.target.value)} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input placeholder="39.2083" value={longitude} onChange={e => setLongitude(e.target.value)} />
              </div>
            </div>
          )}

          {/* Quick Reply */}
          {messageType === 'quick_reply' && (
            <div className="space-y-3">
              <div>
                <Label>Header (optional, max 60 chars)</Label>
                <Input value={qrHeader} onChange={e => setQrHeader(e.target.value)} maxLength={60} />
              </div>
              <div>
                <Label>Text (max 640 chars)</Label>
                <Textarea value={qrText} onChange={e => setQrText(e.target.value)} maxLength={640} rows={3} />
              </div>
              <div>
                <Label>Options (max 3)</Label>
                {qrOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2">
                    <Input placeholder="Title (max 20)" value={opt.title} maxLength={20} onChange={e => {
                      const updated = [...qrOptions];
                      updated[i].title = e.target.value;
                      setQrOptions(updated);
                    }} />
                    <Input placeholder="Postback text" value={opt.postbackText} maxLength={164} onChange={e => {
                      const updated = [...qrOptions];
                      updated[i].postbackText = e.target.value;
                      setQrOptions(updated);
                    }} />
                    {qrOptions.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setQrOptions(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
                    )}
                  </div>
                ))}
                {qrOptions.length < 3 && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setQrOptions(prev => [...prev, { title: '', postbackText: '' }])}>
                    <Plus className="w-3 h-3 mr-1" /> Add Option
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* List */}
          {messageType === 'list' && (
            <div className="space-y-3">
              <div>
                <Label>Title (optional, max 60 chars)</Label>
                <Input value={listTitle} onChange={e => setListTitle(e.target.value)} maxLength={60} />
              </div>
              <div>
                <Label>Body (required, max 1000 chars)</Label>
                <Textarea value={listBody} onChange={e => setListBody(e.target.value)} maxLength={1000} rows={3} />
              </div>
              <div>
                <Label>Button Text (max 20 chars)</Label>
                <Input value={listButtonText} onChange={e => setListButtonText(e.target.value)} maxLength={20} placeholder="Select" />
              </div>
              <div>
                <Label>Items (max 10 total options across all items)</Label>
                {listItems.map((item, i) => (
                  <div key={i} className="border rounded-lg p-3 mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Item title (max 24)" value={item.title} maxLength={24} onChange={e => {
                        const updated = [...listItems];
                        updated[i].title = e.target.value;
                        setListItems(updated);
                      }} className="flex-1" />
                      {listItems.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => setListItems(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
                      )}
                    </div>
                    {item.options.map((opt, j) => (
                      <div key={j} className="flex items-center gap-2 ml-4">
                        <Input placeholder="Option title" value={opt.title} maxLength={24} onChange={e => {
                          const updated = [...listItems];
                          updated[i].options[j].title = e.target.value;
                          setListItems(updated);
                        }} />
                        <Input placeholder="Description" value={opt.description} maxLength={72} onChange={e => {
                          const updated = [...listItems];
                          updated[i].options[j].description = e.target.value;
                          setListItems(updated);
                        }} />
                        {item.options.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => {
                            const updated = [...listItems];
                            updated[i].options = updated[i].options.filter((_, idx) => idx !== j);
                            setListItems(updated);
                          }}><Trash2 className="w-3 h-3" /></Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="ml-4" onClick={() => {
                      const updated = [...listItems];
                      updated[i].options.push({ title: '', description: '', postbackText: '' });
                      setListItems(updated);
                    }}><Plus className="w-3 h-3 mr-1" /> Add Option</Button>
                  </div>
                ))}
                {listItems.length < 10 && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setListItems(prev => [...prev, { title: '', options: [{ title: '', description: '', postbackText: '' }] }])}>
                    <Plus className="w-3 h-3 mr-1" /> Add Item
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1">
            {validationErrors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-3 h-3" /> {err}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send */}
      <Button onClick={handleSend} disabled={sending || validationErrors.length > 0} className="w-full" size="lg">
        {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send WhatsApp Message</>}
      </Button>

      {/* Manual invoice generation */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          const count = recipientMode === 'single'
            ? 1
            : selectedGuests.length + manualRecipients.filter(r => r.phone.trim()).length;
          setInvoiceUnits(Math.max(count, 1));
          setInvoiceOpen(true);
        }}
      >
        <Receipt className="w-4 h-4 mr-2" /> Tengeneza Invoice ya WhatsApp
      </Button>

      <SmsInvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        eventId={selectedEventId || null}
        eventTitle={events.find((e: any) => e.id === selectedEventId)?.title}
        units={invoiceUnits}
        serviceName="WhatsApp"
        storageKey="whatsapp_unit_price"
      />
    </div>
  );
};

export default WhatsAppCompose;
