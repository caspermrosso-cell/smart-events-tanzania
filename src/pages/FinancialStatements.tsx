import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Download, Save, RefreshCw, Loader2 } from 'lucide-react';
import { computeFinancials, emptyFinancials, fmt, neg, type FinancialInput } from '@/lib/financialStatements';
import { buildFinancialStatementsDocx, downloadBlob } from '@/lib/financialStatementsDocx';

const NUMERIC_FIELDS: { key: keyof FinancialInput; label: string; group: string }[] = [
  { key: 'revenue', label: 'Revenue / Mapato', group: 'Profit & Loss' },
  { key: 'direct_cost', label: 'Direct Cost / Gharama za moja kwa moja', group: 'Profit & Loss' },
  { key: 'operating_expenses', label: 'Operating expenses / Matumizi ya uendeshaji', group: 'Profit & Loss' },
  { key: 'tax_charge', label: 'Tax charge / Kodi', group: 'Profit & Loss' },
  { key: 'property_equipment', label: 'Property and equipments', group: 'Financial Position' },
  { key: 'tax_receivables', label: 'Tax receivables', group: 'Financial Position' },
  { key: 'cash_and_bank', label: 'Cash and bank', group: 'Financial Position' },
  { key: 'trade_payables', label: 'Trade and other payables', group: 'Financial Position' },
  { key: 'share_capital', label: 'Share capital (closing)', group: 'Equity' },
  { key: 'shares_issued_during_year', label: 'Shares issued during the year', group: 'Equity' },
  { key: 'opening_accumulated_profit', label: 'Opening accumulated profit', group: 'Equity' },
  { key: 'depreciation', label: 'Depreciation', group: 'Cash Flows' },
  { key: 'change_in_payables', label: 'Increase / (Decrease) in accounts payable', group: 'Cash Flows' },
  { key: 'taxation_paid', label: 'Taxation paid', group: 'Cash Flows' },
  { key: 'purchase_of_assets', label: 'Purchase of vehicles & equipments', group: 'Cash Flows' },
  { key: 'opening_cash', label: 'Cash at the beginning of the period', group: 'Cash Flows' },
];

const GROUPS = ['Profit & Loss', 'Financial Position', 'Equity', 'Cash Flows'];

const Row = ({ label, note, value, bold, indent }: { label: string; note?: string; value?: string; bold?: boolean; indent?: boolean }) => (
  <div className={`grid grid-cols-[1fr_50px_130px] gap-2 py-1.5 text-sm ${bold ? 'font-semibold border-t border-border' : ''}`}>
    <span className={indent ? 'pl-4' : ''}>{label}</span>
    <span className="text-right text-muted-foreground text-xs">{note || ''}</span>
    <span className="text-right tabular-nums">{value ?? ''}</span>
  </div>
);

const FinancialStatements = () => {
  const qc = useQueryClient();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [form, setForm] = useState<FinancialInput>(emptyFinancials(thisYear));
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: saved, isFetching } = useQuery({
    queryKey: ['financial-statements', year],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('financial_statements').select('*').eq('year', year).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  // Auto figures from the system (invoices + payments) for the selected year
  const { data: auto, refetch: refetchAuto } = useQuery({
    queryKey: ['financial-auto', year],
    queryFn: async () => {
      const from = `${year}-01-01T00:00:00Z`;
      const to = `${year + 1}-01-01T00:00:00Z`;
      const [inv, pay, pur] = await Promise.all([
        supabase.from('invoices').select('subtotal, vat_amount, grand_total, status, created_at').gte('created_at', from).lt('created_at', to),
        supabase.from('payments').select('amount, created_at').gte('created_at', from).lt('created_at', to),
        (supabase as any).from('supplier_purchases').select('amount_excl_vat, vat_amount, total_amount, units, purchase_date')
          .gte('purchase_date', `${year}-01-01`).lte('purchase_date', `${year}-12-31`),
      ]);
      const invoices = inv.data || [];
      // VAT 18% inahesabiwa ndani ya bei ya kuuza (jumla x 18/118)
      const outputVat = invoices.reduce(
        (s: number, i: any) => s + (Number(i.vat_amount) || vatFromGross(Number(i.grand_total) || 0)),
        0,
      );
      const revenue = invoices.reduce((s: number, i: any) => s + (Number(i.grand_total) || 0), 0) - outputVat;
      const paid = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (Number(i.grand_total) || 0), 0);
      const receipts = (pay.data || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
      const receivables = revenue - paid;
      const purchases = (pur as any).data || [];
      const directCost = purchases.reduce((s: number, p: any) => s + (Number(p.amount_excl_vat) || 0), 0);
      const inputVat = purchases.reduce((s: number, p: any) => s + (Number(p.vat_amount) || 0), 0);
      const purchasedUnits = purchases.reduce((s: number, p: any) => s + (Number(p.units) || 0), 0);
      return {
        revenue, paid, receipts, receivables, count: invoices.length,
        outputVat, directCost, inputVat, purchasedUnits,
        netVat: outputVat - inputVat, purchaseCount: purchases.length,
      };
    },
  });

  useEffect(() => {
    setForm(saved ? { ...emptyFinancials(year), ...saved, year } : emptyFinancials(year));
  }, [saved, year]);

  useEffect(() => {
    if (form.auto_revenue && auto) {
      setForm((f) =>
        f.revenue === auto.revenue && f.direct_cost === auto.directCost
          ? f
          : { ...f, revenue: auto.revenue, direct_cost: auto.directCost },
      );
    }
  }, [auto, form.auto_revenue]);

  const c = useMemo(() => computeFinancials(form), [form]);

  const setNum = (key: keyof FinancialInput, v: string) =>
    setForm((f) => ({ ...f, [key]: Number(v.replace(/,/g, '')) || 0 }));

  const save = async () => {
    setSaving(true);
    const payload = { ...form, year };
    const { error } = await (supabase as any)
      .from('financial_statements').upsert(payload, { onConflict: 'year' });
    setSaving(false);
    if (error) return toast({ title: 'Imeshindikana kuhifadhi', description: error.message, variant: 'destructive' });
    qc.invalidateQueries({ queryKey: ['financial-statements', year] });
    toast({ title: 'Imehifadhiwa', description: `Taarifa za mwaka ${year} zimehifadhiwa.` });
  };

  const exportWord = async () => {
    setExporting(true);
    try {
      const blob = await buildFinancialStatementsDocx(form);
      downloadBlob(blob, `Financial-Statements-${year}.docx`);
      toast({ title: 'Imepakuliwa', description: 'Faili la Word limetengenezwa.' });
    } catch (e: any) {
      toast({ title: 'Imeshindikana', description: e.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const applyAuto = () => {
    if (!auto) return;
    setForm((f) => ({
      ...f,
      revenue: auto.revenue,
      direct_cost: auto.directCost,
      tax_receivables: Math.max(0, auto.receivables),
      cash_and_bank: auto.receipts,
    }));
    toast({ title: 'Takwimu zimechukuliwa', description: `Invoices ${auto.count} na risiti ${auto.purchaseCount} za mwaka ${year}.` });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Financial Statements</h2>
          <p className="text-sm text-muted-foreground">Taarifa nne za kifedha kwa mwaka — hifadhi na pakua kama Word.</p>
        </div>
        <div className="ml-auto flex items-end gap-2">
          <div>
            <Label className="text-xs">Mwaka</Label>
            <Input type="number" className="w-28" value={year} onChange={(e) => setYear(Number(e.target.value) || thisYear)} />
          </div>
          <Button variant="outline" onClick={() => { refetchAuto(); applyAuto(); }}>
            <RefreshCw className="w-4 h-4 mr-2" /> Chukua takwimu
          </Button>
          <Button variant="outline" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Hifadhi
          </Button>
          <Button onClick={exportWord} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Pakua Word
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Inputs */}
        <Card className="p-4 space-y-4 h-fit">
          <div>
            <Label className="text-xs">Jina la kampuni</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div>
              <p className="text-sm font-medium">Revenue &amp; Direct Cost za kiotomatiki</p>
              <p className="text-xs text-muted-foreground">
                Invoices za {year} (bila VAT 18%) na risiti za manunuzi ya units
              </p>
            </div>
            <Switch checked={form.auto_revenue} onCheckedChange={(v) => setForm({ ...form, auto_revenue: v })} />
          </div>
          {auto && (
            <div className="rounded-lg border border-border p-3 space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">VAT 18% (ndani ya bei)</p>
              <div className="flex justify-between"><span>VAT ya mauzo (output)</span><span className="tabular-nums">{fmt(auto.outputVat)}</span></div>
              <div className="flex justify-between"><span>VAT ya manunuzi (input)</span><span className="tabular-nums">{fmt(auto.inputVat)}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1"><span>VAT ya kulipa TRA</span><span className="tabular-nums">{fmt(auto.netVat)}</span></div>
              <p className="text-xs text-muted-foreground pt-1">Units zilizonunuliwa: {auto.purchasedUnits.toLocaleString()}</p>
            </div>
          )}
          {GROUPS.map((g) => (
            <div key={g} className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{g}</p>
              {NUMERIC_FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key as string}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    type="number"
                    value={String(form[f.key] as number)}
                    disabled={f.key === 'revenue' && form.auto_revenue}
                    onChange={(e) => setNum(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ))}
        </Card>

        {/* Preview */}
        <Card className="p-5">
          {isFetching && <p className="text-xs text-muted-foreground mb-2">Inapakia...</p>}
          <Tabs defaultValue="pl">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
              <TabsTrigger value="sfp">Financial Position</TabsTrigger>
              <TabsTrigger value="soce">Changes in Equity</TabsTrigger>
              <TabsTrigger value="scf">Cash Flows</TabsTrigger>
            </TabsList>

            <div className="mt-4 text-center mb-4">
              <p className="font-semibold">{form.company_name.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">ANNUAL REPORT AND AUDITED FINANCIAL STATEMENTS FOR THE YEAR ENDED 31 DECEMBER {year}</p>
            </div>

            <TabsContent value="pl">
              <Row label="STATEMENT OF PROFIT AND LOSS AND OTHER COMPREHENSIVE INCOME" note="Notes" value={`${year} TZS`} bold />
              <Row label="Revenue" value={fmt(form.revenue)} />
              <Row label="Direct Cost" note="5" value={neg(form.direct_cost)} />
              <Row label="Operating profit before expenses" value={fmt(c.operatingProfitBeforeExpenses)} bold />
              <Row label="Operating expenses" note="6" value={neg(form.operating_expenses)} />
              <Row label="Profit before taxation" value={fmt(c.profitBeforeTax)} bold />
              <Row label="Tax charge" value={neg(form.tax_charge)} />
              <Row label="Total comprehensive profit for the year" value={fmt(c.profitForYear)} bold />
            </TabsContent>

            <TabsContent value="sfp">
              <Row label="STATEMENT OF FINANCIAL POSITION" note="Notes" value={`${year} TZS`} bold />
              <Row label="Non-current assets" bold />
              <Row label="Property and equipments" value={fmt(form.property_equipment)} indent />
              <Row label="Total non-current assets" value={fmt(c.totalNonCurrentAssets)} bold />
              <Row label="Current assets" bold />
              <Row label="Tax receivables" note="6" value={fmt(form.tax_receivables)} indent />
              <Row label="Cash and bank" note="7" value={fmt(form.cash_and_bank)} indent />
              <Row label="Total Current Assets" value={fmt(c.totalCurrentAssets)} bold />
              <Row label="TOTAL ASSETS" value={fmt(c.totalAssets)} bold />
              <div className="h-3" />
              <Row label="SHAREHOLDERS EQUITY AND LIABILITIES" bold />
              <Row label="Share capital" value={fmt(form.share_capital)} indent />
              <Row label="Accumulated Profit" value={fmt(c.closingAccumulatedProfit)} indent />
              <Row label="Total shareholder's equity" value={fmt(c.totalEquity)} bold />
              <Row label="Trade and other Payables" note="8" value={fmt(form.trade_payables)} indent />
              <Row label="Total Liabilities" value={fmt(c.totalLiabilities)} bold />
              <Row label="Total shareholder's equity and liabilities" value={fmt(c.totalEquityAndLiabilities)} bold />
              {c.balanceCheck !== 0 && (
                <p className="mt-3 text-xs text-destructive">
                  Tofauti ya TZS {fmt(c.balanceCheck)} kati ya jumla ya mali na mtaji + madeni.
                </p>
              )}
            </TabsContent>

            <TabsContent value="soce">
              <div className="grid grid-cols-[1fr_110px_130px_130px] gap-2 py-2 text-xs font-semibold border-b border-border">
                <span>STATEMENT OF CHANGES IN EQUITY</span>
                <span className="text-right">Share Capital</span>
                <span className="text-right">Accumulated Profit</span>
                <span className="text-right">Total</span>
              </div>
              {[
                ['Balance at the beginning of the year', form.share_capital - form.shares_issued_during_year, form.opening_accumulated_profit],
                ['Issued during the year', form.shares_issued_during_year, 0],
                ['Profit of the year', 0, c.profitForYear],
                [`Balance at the end of year ${year}`, form.share_capital, c.closingAccumulatedProfit],
              ].map(([label, a, b], i, arr) => (
                <div key={i} className={`grid grid-cols-[1fr_110px_130px_130px] gap-2 py-1.5 text-sm ${i === arr.length - 1 ? 'font-semibold border-t border-border' : ''}`}>
                  <span>{label as string}</span>
                  <span className="text-right tabular-nums">{fmt(a as number)}</span>
                  <span className="text-right tabular-nums">{fmt(b as number)}</span>
                  <span className="text-right tabular-nums">{fmt((a as number) + (b as number))}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="scf">
              <Row label="STATEMENT OF CASH FLOWS" value={`${year} TZS`} bold />
              <Row label="CASH FLOWS FROM OPERATING ACTIVITIES" bold />
              <Row label="Profit / Loss before taxation" value={fmt(c.profitBeforeTax)} indent />
              <Row label="Depreciation" value={fmt(form.depreciation)} indent />
              <Row label="Operating profit before working capital changes" value={fmt(c.operatingBeforeWorkingCapital)} bold />
              <Row label="Increase / (Decrease) in accounts payable" value={fmt(form.change_in_payables)} indent />
              <Row label="Cash flows from operating activities before taxation" value={fmt(c.cashBeforeTax)} bold />
              <Row label="Taxation paid" value={neg(form.taxation_paid)} indent />
              <Row label="Net cash flow used in operation activities" value={fmt(c.netOperating)} bold />
              <Row label="CASH FLOWS FROM INVESTING ACTIVITIES" bold />
              <Row label="Purchase of vehicles & equipments" value={neg(form.purchase_of_assets)} indent />
              <Row label="Net cash flow from investing activities" value={fmt(c.netInvesting)} bold />
              <Row label="CASH FLOWS FROM FINANCING ACTIVITIES" bold />
              <Row label="Issues of shares" value={fmt(form.shares_issued_during_year)} indent />
              <Row label="Net cash generated from financing activities" value={fmt(c.netFinancing)} bold />
              <Row label="Net increase in cash and cash equivalent" value={fmt(c.netIncrease)} bold />
              <Row label="Balance at the beginning of the period" value={fmt(form.opening_cash)} indent />
              <Row label="Cash and cash equivalent at the end of the period" value={fmt(c.closingCash)} bold />
              {c.cashCheck !== 0 && (
                <p className="mt-3 text-xs text-destructive">
                  Salio la mwisho la fedha linatofautiana na "Cash and bank" kwa TZS {fmt(c.cashCheck)}.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FinancialStatements;
