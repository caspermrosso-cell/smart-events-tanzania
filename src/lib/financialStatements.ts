export type FinancialInput = {
  year: number;
  year_end_month: number;
  year_end_day: number;
  company_name: string;
  revenue: number;
  direct_cost: number;
  operating_expenses: number;
  tax_charge: number;
  property_equipment: number;
  depreciation: number;
  tax_receivables: number;
  cash_and_bank: number;
  share_capital: number;
  opening_accumulated_profit: number;
  shares_issued_during_year: number;
  trade_payables: number;
  change_in_payables: number;
  taxation_paid: number;
  purchase_of_assets: number;
  opening_cash: number;
  auto_revenue: boolean;
};

export const emptyFinancials = (year: number): FinancialInput => ({
  year,
  year_end_month: 12,
  year_end_day: 31,
  company_name: 'SMART EVENTS TANZANIA LIMITED',
  revenue: 0,
  direct_cost: 0,
  operating_expenses: 0,
  tax_charge: 0,
  property_equipment: 0,
  depreciation: 0,
  tax_receivables: 0,
  cash_and_bank: 0,
  share_capital: 0,
  opening_accumulated_profit: 0,
  shares_issued_during_year: 0,
  trade_payables: 0,
  change_in_payables: 0,
  taxation_paid: 0,
  purchase_of_assets: 0,
  opening_cash: 0,
  auto_revenue: true,
});

export const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const clampDay = (month: number, day: number) => {
  const max = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Math.min(Math.max(month, 1), 12) - 1];
  return Math.min(Math.max(day || 1, 1), max);
};

/** e.g. "31 DECEMBER 2027" — follows whatever year end the company uses. */
export const yearEndLabel = (d: Pick<FinancialInput, 'year' | 'year_end_month' | 'year_end_day'>) => {
  const m = Math.min(Math.max(d.year_end_month || 12, 1), 12);
  return `${clampDay(m, d.year_end_day || 31)} ${MONTHS[m - 1]} ${d.year}`;
};

/** e.g. "FOR THE YEAR ENDED 31 DECEMBER 2027" */
export const periodLabel = (d: Pick<FinancialInput, 'year' | 'year_end_month' | 'year_end_day'>) =>
  `FOR THE YEAR ENDED ${yearEndLabel(d)}`;

/** e.g. "AS AT 31 DECEMBER 2027" */
export const asAtLabel = (d: Pick<FinancialInput, 'year' | 'year_end_month' | 'year_end_day'>) =>
  `AS AT ${yearEndLabel(d)}`;

/** Start of the financial year, e.g. "1 JANUARY 2027" */
export const yearStartLabel = (d: Pick<FinancialInput, 'year' | 'year_end_month' | 'year_end_day'>) => {
  const m = Math.min(Math.max(d.year_end_month || 12, 1), 12);
  const startMonth = (m % 12) + 1;
  const startYear = m === 12 ? d.year : d.year - 1;
  return `1 ${MONTHS[startMonth - 1]} ${startYear}`;
};

export const fmt = (n: number) => {
  const v = Math.abs(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (Number(n) || 0) < 0 ? `(${v})` : v;
};
export const neg = (n: number) => `(${(Math.abs(Number(n) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;

export function computeFinancials(d: FinancialInput) {
  const operatingProfitBeforeExpenses = d.revenue - d.direct_cost;
  const profitBeforeTax = operatingProfitBeforeExpenses - d.operating_expenses;
  const profitForYear = profitBeforeTax - d.tax_charge;

  const totalNonCurrentAssets = d.property_equipment;
  const totalCurrentAssets = d.tax_receivables + d.cash_and_bank;
  const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

  const closingAccumulatedProfit = d.opening_accumulated_profit + profitForYear;
  const totalEquity = d.share_capital + closingAccumulatedProfit;
  const totalLiabilities = d.trade_payables;
  const totalEquityAndLiabilities = totalEquity + totalLiabilities;

  const operatingBeforeWorkingCapital = profitBeforeTax + d.depreciation;
  const cashBeforeTax = operatingBeforeWorkingCapital + d.change_in_payables;
  const netOperating = cashBeforeTax - d.taxation_paid;
  const netInvesting = -d.purchase_of_assets;
  const netFinancing = d.shares_issued_during_year;
  const netIncrease = netOperating + netInvesting + netFinancing;
  const closingCash = d.opening_cash + netIncrease;

  return {
    operatingProfitBeforeExpenses,
    profitBeforeTax,
    profitForYear,
    totalNonCurrentAssets,
    totalCurrentAssets,
    totalAssets,
    closingAccumulatedProfit,
    totalEquity,
    totalLiabilities,
    totalEquityAndLiabilities,
    balanceCheck: Math.round((totalAssets - totalEquityAndLiabilities) * 100) / 100,
    operatingBeforeWorkingCapital,
    cashBeforeTax,
    netOperating,
    netInvesting,
    netFinancing,
    netIncrease,
    closingCash,
    cashCheck: Math.round((closingCash - d.cash_and_bank) * 100) / 100,
  };
}

export type Computed = ReturnType<typeof computeFinancials>;
