import { forwardRef } from 'react';
import smartEventsLogo from '@/assets/smart-events-logo.png';

const NBC_MERCHANT_ID = '41048485';
const NBC_MERCHANT_NAME = 'Smart Events Tanzania';

const COMPANY = {
  name: 'Smart Events Tanzania',
  address: 'Plot no 22 Mbezi Beach A, Kinondoni',
  email: 'info@smartevents.co.tz',
  website: 'www.smartevents.co.tz',
};

export type DocItem = { description: string; qty: number; unitPrice: number; total: number };

export type DocumentData = {
  type: 'quotation' | 'invoice' | 'receipt';
  docNumber: string;
  date: string;
  clientName: string;
  contactPerson: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  tinNumber?: string;
  eventTitle: string;
  items: DocItem[];
  subtotal: number;
  vatEnabled: boolean;
  vatAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  grandTotal: number;
  validityDays?: number;
  paymentDueDays?: number;
  paymentMethod?: string;
  amountInWords?: string;
  invoiceRef?: string;
  remarks?: string;
};

const DocumentPreview = forwardRef<HTMLDivElement, { data: DocumentData }>(({ data }, ref) => {
  const isReceipt = data.type === 'receipt';
  const title = data.type === 'quotation' ? 'QUOTATION' : data.type === 'invoice' ? 'PROFORMA INVOICE' : 'PAYMENT RECEIPT';

  return (
    <div ref={ref} className="bg-white text-gray-900 p-8 max-w-[210mm] mx-auto" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', lineHeight: '1.5' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-amber-500">
        <div className="flex items-center gap-3">
          <img src={smartEventsLogo} alt="Smart Events" className="w-28 h-auto" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{COMPANY.name}</h1>
            <p className="text-xs text-gray-600">{COMPANY.address}</p>
            <p className="text-xs text-gray-600">{COMPANY.email} | {COMPANY.website}</p>
            {data.tinNumber && <p className="text-xs text-gray-600">TIN: {data.tinNumber}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-amber-700">{title}</h2>
          <p className="text-sm font-semibold text-gray-700">{data.docNumber}</p>
          <p className="text-xs text-gray-500">Date: {data.date}</p>
          {data.type === 'quotation' && <p className="text-xs text-gray-500">Valid for {data.validityDays || 14} days</p>}
          {data.type === 'invoice' && <p className="text-xs text-gray-500">Due: {data.paymentDueDays || 7} days</p>}
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-xs font-bold text-amber-700 uppercase mb-2">{isReceipt ? 'Received From' : 'Bill To'}</h3>
        <p className="font-semibold text-sm">{data.clientName}</p>
        {data.contactPerson && <p className="text-xs text-gray-600">Attn: {data.contactPerson}</p>}
        {data.clientAddress && <p className="text-xs text-gray-600">{data.clientAddress}</p>}
        {(data.clientEmail || data.clientPhone) && (
          <p className="text-xs text-gray-600">{[data.clientEmail, data.clientPhone].filter(Boolean).join(' | ')}</p>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full mb-4 text-xs">
        <thead>
          <tr className="bg-amber-600 text-white">
            <th className="p-2 text-left w-10">#</th>
            <th className="p-2 text-left">{isReceipt ? 'Description' : 'Description of Services'}</th>
            {!isReceipt && <th className="p-2 text-center w-14">Qty</th>}
            {!isReceipt && <th className="p-2 text-right w-24">Unit Price</th>}
            <th className="p-2 text-right w-28">{isReceipt ? 'Amount Paid' : 'Total (TZS)'}</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="p-2 border-b border-gray-200">{i + 1}</td>
              <td className="p-2 border-b border-gray-200">{item.description}</td>
              {!isReceipt && <td className="p-2 border-b border-gray-200 text-center">{item.qty}</td>}
              {!isReceipt && <td className="p-2 border-b border-gray-200 text-right">{Number(item.unitPrice).toLocaleString()}</td>}
              <td className="p-2 border-b border-gray-200 text-right font-medium">{Number(item.total).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-1 text-xs">
            <span>Subtotal:</span>
            <span className="font-medium">TZS {data.subtotal.toLocaleString()}</span>
          </div>
          {data.vatEnabled && (
            <div className="flex justify-between py-1 text-xs">
              <span>VAT (18%):</span>
              <span className="font-medium">TZS {data.vatAmount.toLocaleString()}</span>
            </div>
          )}
          {data.discountAmount > 0 && (
            <div className="flex justify-between py-1 text-xs text-red-600">
              <span>Discount {data.discountType === 'percentage' ? `(${data.discountValue}%)` : ''}:</span>
              <span>- TZS {data.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-amber-500 mt-1 text-sm font-bold">
            <span>Grand Total:</span>
            <span className="text-amber-700">TZS {data.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Amount in words for receipt */}
      {isReceipt && data.amountInWords && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg text-xs">
          <span className="font-semibold">Amount in words: </span>{data.amountInWords}
        </div>
      )}

      {/* Payment for receipt */}
      {isReceipt && data.paymentMethod && (
        <div className="mb-4 text-xs">
          <p><span className="font-semibold">Payment Method:</span> {data.paymentMethod}</p>
          {data.remarks && <p className="mt-2 italic text-gray-600">{data.remarks}</p>}
        </div>
      )}

      {/* Payment Terms for quotation/invoice */}
      {!isReceipt && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xs font-bold text-amber-700 uppercase mb-2">Payment Terms</h3>
          <div className="text-xs text-gray-700 space-y-1">
            <p>• Payment Terms: 100% advance</p>
            <p>• Payment Method: Bank Transfer / Mobile Money</p>
            <p>• Payment Due: Ndani ya siku {data.paymentDueDays || 7}</p>
          </div>
          <div className="mt-3 text-xs text-gray-700">
            <p><span className="font-semibold">NBC Lipa No.:</span> {NBC_MERCHANT_ID}</p>
            <p><span className="font-semibold">Name:</span> {NBC_MERCHANT_NAME}</p>
          </div>
        </div>
      )}

      {/* Terms & Conditions for quotation/invoice */}
      {!isReceipt && (
        <div className="mb-6 text-xs text-gray-600">
          <h3 className="text-xs font-bold text-amber-700 uppercase mb-1">Terms & Conditions</h3>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>This {data.type === 'quotation' ? 'quotation' : 'invoice'} is valid for {data.validityDays || 14} days from the date of issue.</li>
            <li>Services will be rendered upon confirmation of payment.</li>
            <li>Changes in scope may affect the final amount payable.</li>
          </ol>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-amber-500 pt-4 mt-6 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">
          {isReceipt ? 'Authorized by' : 'Issued by'}: Finance Department, {COMPANY.name}
        </p>
        <p className="mt-1">{COMPANY.address} | {COMPANY.email} | {COMPANY.website}</p>
      </div>
    </div>
  );
});

DocumentPreview.displayName = 'DocumentPreview';
export default DocumentPreview;
