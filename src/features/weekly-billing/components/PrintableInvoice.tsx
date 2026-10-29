import React from 'react';
import type { FarmerWeeklyBill, CustomerWeeklyBill, MilkCollection, MilkSale } from '../../../types/database';
import { formatCurrency, formatQuantity, formatDate, amountToWords } from '../../../lib/utils';

export interface PrintableInvoiceProps {
  bill: FarmerWeeklyBill | CustomerWeeklyBill;
  items: (MilkCollection | MilkSale)[];
  type: 'farmer' | 'customer';
  entityName: string;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  bill,
  items,
  type,
  entityName,
}) => {
  const isFarmer = type === 'farmer';
  const phone = (bill as any).farmer?.phone || (bill as any).customer?.phone || '';

  // Calculate totals
  const totalLitres = items.reduce((acc, item) => {
    const qty = isFarmer
      ? (item as MilkCollection).quantity || 0
      : (item as MilkSale).quantity_litres || 0;
    return acc + Number(qty);
  }, 0);

  // Calculate weighted avg fat for farmers
  const totalFatVolume = isFarmer
    ? (items as MilkCollection[]).reduce(
        (acc, item) => acc + (Number(item.fat_percent) || 0) * (Number(item.quantity) || 0),
        0
      )
    : 0;
  const avgFat = totalLitres > 0 && isFarmer ? totalFatVolume / totalLitres : 0;

  const invoiceNo = `WB-${isFarmer ? 'FMR' : 'CUST'}-${bill.id.slice(0, 8).toUpperCase()}`;
  const todayStr = formatDate(new Date().toISOString().split('T')[0]);

  return (
    <div id="printable-invoice" className="hidden font-sans text-black p-6 max-w-[210mm] mx-auto bg-white">
      {/* Dairy Official Letterhead */}
      <div className="border-b-2 border-black pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-black">
              Gokul Dairy
            </h1>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mt-0.5">
              Milk Collection & Distribution Center
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              Main Market Road, Anandpur Dairy Complex • Tel: +91 98765 43210
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block border border-black font-bold uppercase text-xs px-2.5 py-1 mb-1 tracking-wider">
              {isFarmer ? 'Farmer Settlement Bill' : 'Customer Sales Invoice'}
            </span>
            <div className="text-xs font-mono text-gray-800">
              <strong>Invoice #:</strong> {invoiceNo}
            </div>
            <div className="text-xs text-gray-800">
              <strong>Date:</strong> {todayStr}
            </div>
            <div className="text-xs text-gray-800">
              <strong>Status:</strong>{' '}
              <span className="font-bold uppercase">{bill.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Meta & Recipient Details */}
      <div className="grid grid-cols-2 gap-4 mb-4 border border-gray-400 p-3 bg-gray-50/50 text-xs">
        <div>
          <span className="font-bold uppercase tracking-wider text-gray-600 block text-[10px]">
            {isFarmer ? 'Supplier / Farmer Details' : 'Billed To (Customer Details)'}
          </span>
          <div className="text-sm font-bold text-black mt-1">{entityName}</div>
          {phone && <div className="text-gray-700 mt-0.5">Phone: {phone}</div>}
          <div className="text-gray-600 text-[11px] mt-0.5 font-mono">
            ID: {isFarmer ? (bill as any).farmer_id : (bill as any).customer_id}
          </div>
        </div>

        <div>
          <span className="font-bold uppercase tracking-wider text-gray-600 block text-[10px]">
            Billing Period & Summary
          </span>
          <div className="mt-1 font-semibold text-gray-900">
            Period: {formatDate(bill.period_start)} — {formatDate(bill.period_end)}
          </div>
          <div className="text-gray-700 mt-0.5">
            Total Milk Volume: <strong className="font-mono">{formatQuantity(totalLitres)}</strong>
          </div>
          {isFarmer && avgFat > 0 && (
            <div className="text-gray-700 mt-0.5">
              Avg Fat Content: <strong className="font-mono">{avgFat.toFixed(2)}%</strong>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Transactions Table */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2 px-2.5 border-r border-black w-8 text-center">#</th>
              <th className="py-2 px-2.5 border-r border-black">Date</th>
              <th className="py-2 px-2.5 border-r border-black">Shift</th>
              <th className="py-2 px-2.5 border-r border-black">Milk Type</th>
              <th className="py-2 px-2.5 border-r border-black text-right">Litres</th>
              {isFarmer && (
                <th className="py-2 px-2.5 border-r border-black text-right">Fat %</th>
              )}
              <th className="py-2 px-2.5 border-r border-black text-right">Rate (₹)</th>
              <th className="py-2 px-2.5 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((rawItem, index) => {
              const date = formatDate(rawItem.business_date);
              const shift = rawItem.shift === 'morning' ? 'Morning' : 'Evening';
              const milkType = rawItem.milk_type === 'cow' ? 'Cow' : 'Buffalo';
              const litres = isFarmer
                ? (rawItem as MilkCollection).quantity
                : (rawItem as MilkSale).quantity_litres;
              const fat = isFarmer ? (rawItem as MilkCollection).fat_percent : null;
              const rate = rawItem.applied_rate;
              const amount = rawItem.amount;

              return (
                <tr
                  key={rawItem.id || index}
                  className="border-b border-gray-300 hover:bg-gray-50"
                >
                  <td className="py-1.5 px-2.5 border-r border-gray-300 text-center font-mono text-gray-600">
                    {index + 1}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-gray-300 font-medium">
                    {date}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-gray-300 uppercase text-[10px]">
                    {shift}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-gray-300 font-medium">
                    {milkType} Milk
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-gray-300 text-right font-mono font-medium">
                    {formatQuantity(litres)}
                  </td>
                  {isFarmer && (
                    <td className="py-1.5 px-2.5 border-r border-gray-300 text-right font-mono">
                      {fat !== null ? `${Number(fat).toFixed(1)}%` : '-'}
                    </td>
                  )}
                  <td className="py-1.5 px-2.5 border-r border-gray-300 text-right font-mono">
                    ₹{Number(rate).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-gray-900">
                    {formatCurrency(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-black font-bold">
              <td
                colSpan={isFarmer ? 4 : 3}
                className="py-2 px-2.5 border-r border-black uppercase text-[11px]"
              >
                Total ({items.length} Entries)
              </td>
              <td className="py-2 px-2.5 border-r border-black text-right font-mono">
                {formatQuantity(totalLitres)}
              </td>
              {isFarmer && (
                <td className="py-2 px-2.5 border-r border-black text-right font-mono">
                  {avgFat > 0 ? `${avgFat.toFixed(1)}%` : '-'}
                </td>
              )}
              <td className="py-2 px-2.5 border-r border-black text-right font-mono">
                —
              </td>
              <td className="py-2 px-2.5 text-right font-mono text-sm font-extrabold">
                {formatCurrency(bill.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Net Payable Settlement Box */}
      <div className="border-2 border-black p-3 mb-6 bg-gray-50 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 block">
            {isFarmer ? 'Net Payable to Farmer' : 'Total Amount Due'}
          </span>
          <div className="text-xs text-gray-800 font-medium italic mt-0.5">
            {amountToWords(bill.total_amount)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono text-black">
            {formatCurrency(bill.total_amount)}
          </div>
        </div>
      </div>

      {/* Authorization & Signatures Section */}
      <div className="pt-8 pb-4 grid grid-cols-2 gap-12 text-xs">
        <div className="text-center">
          <div className="border-t border-black pt-2 mx-8">
            <span className="font-bold uppercase text-gray-800 text-[11px] block">
              {isFarmer ? 'Farmer Signature' : 'Customer Signature'}
            </span>
            <span className="text-[10px] text-gray-500">I verify the above milk records</span>
          </div>
        </div>

        <div className="text-center">
          <div className="border-t border-black pt-2 mx-8">
            <span className="font-bold uppercase text-gray-800 text-[11px] block">
              Authorized Signatory
            </span>
            <span className="text-[10px] text-gray-500">For Gokul Dairy</span>
          </div>
        </div>
      </div>

      {/* Footer System Disclaimer */}
      <div className="mt-4 pt-2 border-t border-gray-300 text-center text-[10px] text-gray-500">
        This is a computer-generated billing statement issued by Gokul Dairy ERP. All milk volumes and rates are system-verified.
      </div>
    </div>
  );
};
