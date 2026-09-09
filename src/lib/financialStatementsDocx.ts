import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, PageBreak,
} from 'docx';
import { computeFinancials, fmt, neg, type FinancialInput } from './financialStatements';

const CONTENT_W = 9360;
const COLS3 = [5160, 1600, 2600];
const COLS4 = [3360, 2000, 2000, 2000];

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const plainBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const topLine = { ...plainBorders, top: { style: BorderStyle.SINGLE, size: 6, color: '8B7355' } };
const doubleLine = {
  ...plainBorders,
  top: { style: BorderStyle.SINGLE, size: 6, color: '8B7355' },
  bottom: { style: BorderStyle.DOUBLE, size: 6, color: '8B7355' },
};

const run = (text: string, bold = false) => new TextRun({ text, bold, font: 'Arial', size: 20 });
const p = (text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
  new Paragraph({ alignment: opts.align, children: [run(text, opts.bold)] });

function cell(text: string, widthIdx: number, cols: number[], opts: { bold?: boolean; right?: boolean; borders?: any; shade?: string } = {}) {
  return new TableCell({
    width: { size: cols[widthIdx], type: WidthType.DXA },
    borders: opts.borders ?? plainBorders,
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [p(text, { bold: opts.bold, align: opts.right ? AlignmentType.RIGHT : undefined })],
  });
}

function row3(label: string, note: string, value: string, opts: { bold?: boolean; borders?: any; shade?: string } = {}) {
  return new TableRow({
    children: [
      cell(label, 0, COLS3, opts),
      cell(note, 1, COLS3, { ...opts, right: true }),
      cell(value, 2, COLS3, { ...opts, right: true }),
    ],
  });
}

const table = (rows: TableRow[], cols: number[]) =>
  new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: cols, rows });

function header(company: string, year: number, title: string, subtitle: string) {
  return [
    p(company.toUpperCase(), { bold: true, align: AlignmentType.CENTER }),
    p(`ANNUAL REPORT AND AUDITED FINANCIAL STATEMENTS FOR THE YEAR ENDED 31 DECEMBER ${year}`, { align: AlignmentType.CENTER }),
    new Paragraph({ children: [] }),
    p(title, { bold: true }),
    p(subtitle),
    new Paragraph({ children: [] }),
  ];
}

export async function buildFinancialStatementsDocx(d: FinancialInput): Promise<Blob> {
  const c = computeFinancials(d);
  const y = d.year;

  const pl = [
    ...header(d.company_name, y, 'STATEMENT OF PROFIT AND LOSS AND OTHER COMPREHENSIVE INCOME', `FOR THE YEAR ENDED 31 DECEMBER ${y}`),
    table([
      row3('', 'Notes', String(y), { bold: true, shade: 'F2EDE6' }),
      row3('', '', 'TZS', { bold: true }),
      row3('Revenue', '', fmt(d.revenue)),
      row3('Direct Cost', '5', neg(d.direct_cost)),
      row3('Operating profit before expenses', '', fmt(c.operatingProfitBeforeExpenses), { bold: true, borders: topLine }),
      row3('Operating expenses', '6', neg(d.operating_expenses)),
      row3('Profit before taxation', '', fmt(c.profitBeforeTax), { bold: true, borders: topLine }),
      row3('Tax charge', '', neg(d.tax_charge)),
      row3('Total comprehensive profit for the year', '', fmt(c.profitForYear), { bold: true, borders: doubleLine }),
    ], COLS3),
  ];

  const sfp = [
    ...header(d.company_name, y, 'STATEMENT OF FINANCIAL POSITION', `AS AT 31 DECEMBER ${y}`),
    table([
      row3('', 'Notes', String(y), { bold: true, shade: 'F2EDE6' }),
      row3('ASSETS', '', 'TZS', { bold: true }),
      row3('Non-current assets', '', '', { bold: true }),
      row3('Property and equipments', '', fmt(d.property_equipment)),
      row3('Total non-current assets', '', fmt(c.totalNonCurrentAssets), { bold: true, borders: topLine }),
      row3('Current assets', '', '', { bold: true }),
      row3('Tax receivables', '6', fmt(d.tax_receivables)),
      row3('Cash and bank', '7', fmt(d.cash_and_bank)),
      row3('Total Current Assets', '', fmt(c.totalCurrentAssets), { bold: true, borders: topLine }),
      row3('TOTAL ASSETS', '', fmt(c.totalAssets), { bold: true, borders: doubleLine }),
      row3('', '', ''),
      row3('SHAREHOLDERS EQUITY AND LIABILITIES', '', '', { bold: true }),
      row3("Capital and reserves attributable to the Company's equity holders", '', ''),
      row3('Share capital', '', fmt(d.share_capital)),
      row3('Accumulated Profit', '', fmt(c.closingAccumulatedProfit)),
      row3("Total shareholder's equity", '', fmt(c.totalEquity), { bold: true, borders: topLine }),
      row3('Current Liabilities', '', '', { bold: true }),
      row3('Trade and other Payables', '8', fmt(d.trade_payables)),
      row3('Total Liabilities', '', fmt(c.totalLiabilities), { bold: true, borders: topLine }),
      row3("Total shareholder's equity and liabilities", '', fmt(c.totalEquityAndLiabilities), { bold: true, borders: doubleLine }),
    ], COLS3),
  ];

  const eqRow = (label: string, a: string, b: string, v: string, opts: { bold?: boolean; borders?: any; shade?: string } = {}) =>
    new TableRow({
      children: [
        cell(label, 0, COLS4, opts),
        cell(a, 1, COLS4, { ...opts, right: true }),
        cell(b, 2, COLS4, { ...opts, right: true }),
        cell(v, 3, COLS4, { ...opts, right: true }),
      ],
    });

  const soce = [
    ...header(d.company_name, y, 'STATEMENT OF CHANGES IN EQUITY', `FOR THE YEAR ENDED 31 DECEMBER ${y}`),
    table([
      eqRow('', 'Share Capital TZS', 'Accumulated Profit TZS', 'Total TZS', { bold: true, shade: 'F2EDE6' }),
      eqRow(`Year ended 31 December ${y}`, '', '', '', { bold: true }),
      eqRow('Balance at the beginning of the year', fmt(d.share_capital - d.shares_issued_during_year), fmt(d.opening_accumulated_profit), fmt(d.share_capital - d.shares_issued_during_year + d.opening_accumulated_profit)),
      eqRow('Issued during the year', fmt(d.shares_issued_during_year), '-', fmt(d.shares_issued_during_year)),
      eqRow('Profit of the year', '-', fmt(c.profitForYear), fmt(c.profitForYear)),
      eqRow(`Balance at the end of year ${y}`, fmt(d.share_capital), fmt(c.closingAccumulatedProfit), fmt(c.totalEquity), { bold: true, borders: doubleLine }),
    ], COLS4),
  ];

  const scf = [
    ...header(d.company_name, y, 'STATEMENT OF CASH FLOWS', `FOR THE YEAR ENDED 31 DECEMBER ${y}`),
    table([
      row3('', '', String(y), { bold: true, shade: 'F2EDE6' }),
      row3('CASH FLOWS FROM OPERATING ACTIVITIES', '', 'TZS', { bold: true }),
      row3('Profit / Loss before taxation', '', fmt(c.profitBeforeTax)),
      row3('Adjustments for:', '', ''),
      row3('Depreciation', '', fmt(d.depreciation)),
      row3('Operating profit before working capital changes', '', fmt(c.operatingBeforeWorkingCapital), { bold: true, borders: topLine }),
      row3('Changes in:', '', ''),
      row3('Increase / (Decrease) in accounts payable', '', fmt(d.change_in_payables)),
      row3('Cash flows from operating activities before taxation', '', fmt(c.cashBeforeTax), { bold: true, borders: topLine }),
      row3('Taxation paid', '', neg(d.taxation_paid)),
      row3('Net cash flow used in operation activities', '', fmt(c.netOperating), { bold: true, borders: topLine }),
      row3('CASH FLOWS FROM INVESTING ACTIVITIES', '', '', { bold: true }),
      row3('Purchase of vehicles & equipments', '', neg(d.purchase_of_assets)),
      row3('Net cash flow from investing activities', '', fmt(c.netInvesting), { bold: true, borders: topLine }),
      row3('CASH FLOWS FROM FINANCING ACTIVITIES', '', '', { bold: true }),
      row3('Issues of shares', '', fmt(d.shares_issued_during_year)),
      row3('Net cash generated from financing activities', '', fmt(c.netFinancing), { bold: true, borders: topLine }),
      row3('Net increase in cash and cash equivalent', '', fmt(c.netIncrease), { bold: true }),
      row3('Balance at the beginning of the period', '', fmt(d.opening_cash)),
      row3('Cash and cash equivalent at the end of the period', '', fmt(c.closingCash), { bold: true, borders: doubleLine }),
    ], COLS3),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        p('FINANCIAL STATEMENTS', { bold: true, align: AlignmentType.CENTER }),
        p(d.company_name.toUpperCase(), { align: AlignmentType.CENTER }),
        p(`FOR THE YEAR ENDED 31 DECEMBER ${y}`, { align: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        p('1. STATEMENT OF PROFIT AND LOSS AND OTHER COMPREHENSIVE INCOME'),
        p('2. STATEMENT OF FINANCIAL POSITION'),
        p('3. STATEMENT OF CHANGES IN EQUITY'),
        p('4. STATEMENT OF CASH FLOWS'),
        new Paragraph({ children: [new PageBreak()] }),
        ...pl,
        new Paragraph({ children: [new PageBreak()] }),
        ...sfp,
        new Paragraph({ children: [new PageBreak()] }),
        ...soce,
        new Paragraph({ children: [new PageBreak()] }),
        ...scf,
      ],
    }],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
