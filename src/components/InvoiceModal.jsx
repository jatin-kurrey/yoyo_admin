import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function InvoiceModal({ data, type, onClose }) {
  const printRef = useRef(null);
  const { defaultRules } = useApp();
  const today = new Date();

  const hotelInfo = {
    name: defaultRules?.receiptHotelName || 'YOYO Fun Resort & Water Park',
    address: defaultRules?.receiptAddress || 'Plot No. 12, Waterfront Road, Near Beach Colony',
    city: defaultRules?.receiptCity || 'Goa - 403001',
    phone: defaultRules?.receiptPhone || '+91 98765 43210',
    email: defaultRules?.receiptEmail || 'accounts@yoyofun.in',
    gstin: defaultRules?.receiptGstin || '30ABCDE1234F1Z5',
    pan: defaultRules?.receiptPan || 'ABCDE1234F',
  };

  const invoiceNo = type === 'pos'
    ? `POS-${data?.id?.slice(-6) || Date.now().toString().slice(-6)}`
    : `INV-${data?.id || Date.now().toString().slice(-6)}`;
  const invoiceDate = data?.date || today.toLocaleDateString('en-IN');

  const taxRate = defaultRules?.taxRate || 12;
  
  let stayNights = 1;
  if (data?.checkIn && data?.checkOut) {
    stayNights = Math.max(1, Math.round((new Date(data.checkOut) - new Date(data.checkIn)) / (1000 * 60 * 60 * 24)));
  }
  const calculatedRoomCharges = (data?.rate || 4000) * stayNights;
  const subtotal = data?.total ? (data.total - (data.tax || 0)) : (data?.amount || calculatedRoomCharges);

  const taxAmt = data?.tax || Math.round(subtotal * taxRate / 100);
  const grandTotal = data?.total || (subtotal + taxAmt);
  
  const totalPaid = data?.paid || 0;
  const advancePaid = data?.status === 'checked-in' ? totalPaid : (data?.advancePaid || (totalPaid - (data?.checkoutPaid || 0)));
  const checkoutPaid = data?.status === 'checked-out' ? (data?.checkoutPaid || (totalPaid - advancePaid)) : 0;
  const balanceAmt = Math.max(0, grandTotal - totalPaid);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    const taxRate = data?.taxRate || defaultRules?.taxRate || 12;
    const halfTax = taxRate / 2;
    const cgst = Math.round((data?.tax || taxAmt) / 2);
    const sgst = Math.round((data?.tax || taxAmt) / 2);
    const paidStr = data?.paymentMethod ? data.paymentMethod : '';
    const changeStr = data?.change ? data.change : 0;
    const tenderedStr = data?.tendered ? data.tendered : grandTotal;
    win.document.write(`
      <html><head><title>Invoice ${invoiceNo}</title>
      <style>
        @page { margin: 10mm; size: A4; }
        body { font-family: 'Courier New', monospace; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; }
        .invoice { max-width: 190mm; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 16px; }
        .hotel-name { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .hotel-info { font-size: 9px; color: #64748b; line-height: 1.5; }
        .invoice-title { font-size: 13px; font-weight: bold; margin-top: 6px; }
        .invoice-meta { font-size: 9px; color: #64748b; }
        .section { margin-bottom: 14px; }
        .section-title { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row td { font-weight: bold; border-top: 2px solid #1e293b; padding-top: 8px; }
        .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #94a3b8; text-align: center; }
        .print-btn { display: block; margin: 16px auto; padding: 8px 24px; background: #1e293b; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; }
        .bill-receipt { border: 1px dashed #cbd5e1; padding: 12px; background: #fafafa; margin-bottom: 12px; }
        .receipt-line { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; }
        .divider { border-top: 1px dashed #cbd5e1; margin: 6px 0; }
        @media print {
          .print-btn { display: none; }
          body { padding: 0; }
          @page { margin: 8mm; }
        }
      </style></head><body>
      <div class="invoice">
        <div class="header">
          <div class="hotel-name">${hotelInfo.name}</div>
          <div class="hotel-info">${hotelInfo.address}<br>${hotelInfo.city}<br>Phone: ${hotelInfo.phone} | GST: ${hotelInfo.gstin}</div>
          <div class="invoice-title">${type === 'pos' ? 'RESTAURANT BILL' : 'TAX INVOICE'}</div>
          <div class="invoice-meta">${type === 'pos' ? 'Bill' : 'Invoice'} #: ${invoiceNo} | Date: ${invoiceDate}</div>
        </div>

        <div class="section">
          <div class="section-title">Bill To</div>
          <div style="font-size: 11px;">
            <strong>${data?.guestName || data?.guest || 'Guest'}</strong><br>
            ${data?.roomNumber ? `Room ${data.roomNumber}` : ''}${data?.tableNumber ? `Table ${data.tableNumber}` : ''}
            ${data?.area ? ` (${data.area})` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">${type === 'pos' ? 'Ordered Items' : 'Invoice Details'}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(data?.items || []).map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.name || item.description || 'Item'}</td>
                  <td class="text-center">${item.qty || item.quantity || 1}</td>
                  <td class="text-right">₹${(item.price || item.amount || 0).toLocaleString()}</td>
                  <td class="text-right">₹${((item.price || item.amount || 0) * (item.qty || item.quantity || 1)).toLocaleString()}</td>
                </tr>
              `).join('')}
              ${!data?.items?.length ? `
                <tr>
                  <td>1</td>
                  <td>${data?.description || (type === 'pos' ? 'Restaurant Services' : 'Room Booking Charges')}</td>
                  <td class="text-center">1</td>
                  <td class="text-right">₹${subtotal.toLocaleString()}</td>
                  <td class="text-right">₹${subtotal.toLocaleString()}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        ${data?.checkIn ? `
        <div class="section">
          <div class="section-title">Stay Details</div>
          <div style="font-size: 10px; display: flex; gap: 24px;">
            <div><strong>Check-In:</strong> ${data.checkIn}</div>
            <div><strong>Check-Out:</strong> ${data.checkOut}</div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Payment Summary</div>
          ${type === 'pos' ? `
          <div class="bill-receipt">
            <div class="receipt-line"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
            <div class="receipt-line"><span>CGST @ ${halfTax}%</span><span>₹${cgst.toLocaleString()}</span></div>
            <div class="receipt-line"><span>SGST @ ${halfTax}%</span><span>₹${sgst.toLocaleString()}</span></div>
            <div class="divider"></div>
            <div class="receipt-line" style="font-size: 13px; font-weight: bold;"><span>Grand Total</span><span>₹${grandTotal.toLocaleString()}</span></div>
            <div class="divider"></div>
            <div class="receipt-line" style="color: #059669;"><span>Payment: ${paidStr}</span><span>₹${tenderedStr.toLocaleString()}</span></div>
            ${changeStr > 0 ? `<div class="receipt-line" style="color: #d97706;"><span>Change Due</span><span>₹${changeStr.toLocaleString()}</span></div>` : ''}
            <div class="divider"></div>
            <div class="receipt-line" style="font-weight: bold; color: #059669;">
              <span>${changeStr > 0 ? 'Amount Paid' : 'Paid'}</span>
              <span>₹${(tenderedStr - changeStr).toLocaleString()}</span>
            </div>
          </div>
          ` : `
          <table style="width: 100%; max-width: 400px; margin-left: auto;">
            <tr><td style="padding: 4px 8px;">Room Charges</td><td style="padding: 4px 8px; text-align: right;">₹${subtotal.toLocaleString()}</td></tr>
            <tr><td style="padding: 4px 8px;">GST (${taxRate}%)</td><td style="padding: 4px 8px; text-align: right;">₹${taxAmt.toLocaleString()}</td></tr>
            <tr class="total-row"><td style="padding: 6px 8px; font-size: 13px;">Grand Total</td><td style="padding: 6px 8px; text-align: right; font-size: 13px;">₹${grandTotal.toLocaleString()}</td></tr>
            ${advancePaid > 0 ? `<tr><td style="padding: 4px 8px; color: #059669;">Advance Paid at Check-In</td><td style="padding: 4px 8px; text-align: right; color: #059669;">- ₹${advancePaid.toLocaleString()}</td></tr>` : ''}
            ${advancePaid > 0 ? `<tr style="color: #d97706;"><td style="padding: 4px 8px; font-weight: 500;">Balance Due at Check-In</td><td style="padding: 4px 8px; text-align: right; font-weight: 500;">₹${Math.max(0, grandTotal - advancePaid).toLocaleString()}</td></tr>` : ''}
            ${checkoutPaid > 0 ? `<tr><td style="padding: 4px 8px; color: #059669;">Paid at Check-Out</td><td style="padding: 4px 8px; text-align: right; color: #059669;">- ₹${checkoutPaid.toLocaleString()}</td></tr>` : ''}
            <tr style="font-weight: bold; ${balanceAmt > 0 ? 'color: #dc2626;' : 'color: #059669;'} border-top: 2px solid #1e293b;">
              <td style="padding: 6px 8px;">${balanceAmt > 0 ? 'Balance Due' : 'Total Paid'}</td>
              <td style="padding: 6px 8px; text-align: right;">₹${(balanceAmt > 0 ? balanceAmt : totalPaid).toLocaleString()}</td>
            </tr>
            ${balanceAmt <= 0 && totalPaid > 0 ? `<tr><td colspan="2" style="text-align: right; padding-top: 6px;"><span style="display:inline-block;padding:2px 6px;border-radius:2px;font-size:7px;font-weight:bold;background:#dcfce7;color:#059669;">PAID IN FULL</span></td></tr>` : ''}
          </table>
          `}
        </div>

        <div style="font-size: 9px; color: #64748b; margin-top: 8px;">
          Amount in Words: <strong style="color: #1e293b;">${numberToWords(grandTotal)}</strong>
        </div>

        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b;">
          <table style="width: 100%;">
            <tr>
              <td><strong>GST:</strong> ${hotelInfo.gstin}</td>
              <td><strong>PAN:</strong> ${hotelInfo.pan}</td>
              <td><strong>Phone:</strong> ${hotelInfo.phone}</td>
              <td><strong>Email:</strong> ${hotelInfo.email}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          This is a computer-generated ${type === 'pos' ? 'bill' : 'invoice'}. No signature required.<br>
          Thank you for choosing ${hotelInfo.name}!
        </div>

        <button class="print-btn" onclick="window.print()">🖨 Print ${type === 'pos' ? 'Bill' : 'Invoice'}</button>
      </div>
      <script>
        function numberToWords(n) {
          const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
          const b = ['','','Twenty ','Thirty ','Forty ','Fifty ','Sixty ','Seventy ','Eighty ','Ninety '];
          if (n === 0) return 'Zero';
          const num = (n.toString()).split('');
          let str = '';
          const numLength = num.length;
          for (let i = 0; i < numLength; i++) {
            if ((numLength - i) % 3 === 2) {
              if (num[i] === '1') { str += a[Number(num[i+1])] || ''; i++; }
              else if (num[i] !== '0') str += b[Number(num[i])];
            } else if (num[i] !== '0') {
              if (numLength - i <= 3) str += a[Number(num[i])] + (numLength - i === 3 ? 'Hundred ' : '');
              if (numLength - i === 4) str += a[Number(num[i])] + 'Thousand ';
              if (numLength - i === 5) str += b[Number(num[i])];
              if (numLength - i === 6) str += a[Number(num[i])] + 'Lakh ';
              if (numLength - i === 7) str += b[Number(num[i])];
              if (numLength - i === 8) str += a[Number(num[i])] + 'Crore ';
            }
          }
          return str.trim() + ' Rupees Only';
        }
      </script>
      </body></html>
    `);
    win.document.close();
    win.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Tax Invoice</h3>
            <p className="text-[10px] text-slate-500">{invoiceNo} · {invoiceDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <Printer size={13} /> Print / Download PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
        </div>

        <div ref={printRef} className="flex-1 overflow-y-auto p-8 bg-white" style={{ fontFamily: "'Courier New', monospace" }}>
          <div className="border-b-2 border-slate-800 pb-5 mb-5 flex justify-between items-start">
            <div>
              <div className="text-xl font-bold uppercase tracking-wider text-slate-800">{hotelInfo.name}</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                {hotelInfo.address}<br />
                {hotelInfo.city}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800 uppercase">Tax Invoice</div>
              <div className="text-[10px] text-slate-500 mt-1">
                Invoice #: {invoiceNo}<br />
                Date: {invoiceDate}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bill To</div>
            <div className="text-sm font-semibold text-slate-800">
              {data?.guestName || data?.guest || 'Guest'}
              {data?.roomNumber ? <span className="text-slate-500 font-normal"> — Room {data.roomNumber}</span> : ''}
              {data?.tableNumber ? <span className="text-slate-500 font-normal"> — Table {data.tableNumber}{data?.area ? ` (${data.area})` : ''}</span> : ''}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Details</div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase border-b border-slate-200">#</th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase border-b border-slate-200">{type === 'pos' ? 'Item' : 'Description'}</th>
                  <th className="px-3 py-2 text-center text-[9px] font-semibold text-slate-500 uppercase border-b border-slate-200">Qty</th>
                  <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase border-b border-slate-200">Rate</th>
                  <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase border-b border-slate-200">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).length > 0 ? data.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2 text-slate-700 font-medium">{item.name || item.description || 'Item'}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{item.qty || item.quantity || 1}</td>
                    <td className="px-3 py-2 text-right text-slate-600">₹{(item.price || item.amount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800">₹{((item.price || item.amount || 0) * (item.qty || item.quantity || 1)).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-500">1</td>
                    <td className="px-3 py-2 text-slate-700 font-medium">{data?.description || (type === 'pos' ? 'Restaurant Services' : 'Room Booking Charges')}</td>
                    <td className="px-3 py-2 text-center text-slate-600">1</td>
                    <td className="px-3 py-2 text-right text-slate-600">₹{subtotal.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800">₹{subtotal.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data?.checkIn && (
            <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Stay Details</div>
              <div className="grid grid-cols-2 gap-3 p-4 text-xs">
                <div>
                  <span className="text-slate-500">Check-In</span>
                  <span className="ml-2 font-medium text-slate-700">{data.checkIn}</span>
                </div>
                <div>
                  <span className="text-slate-500">Check-Out</span>
                  <span className="ml-2 font-medium text-slate-700">{data.checkOut}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Payment Summary</div>
            <div className="p-4">
              {type === 'pos' ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1"><span className="text-slate-600">Subtotal</span><span className="font-semibold">₹{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span className="text-slate-600">CGST @ {taxRate/2}%</span><span className="font-semibold">₹{Math.round((data?.tax || taxAmt)/2).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span className="text-slate-600">SGST @ {taxRate/2}%</span><span className="font-semibold">₹{Math.round((data?.tax || taxAmt)/2).toLocaleString()}</span></div>
                  <div className="border-t-2 border-slate-800 flex justify-between py-2 font-bold text-sm">
                    <span>Grand Total</span><span>₹{grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 flex justify-between py-1.5 text-emerald-600 font-semibold">
                    <span>Payment: {data?.paymentMethod || '—'}</span>
                    <span>₹{(data?.tendered || grandTotal).toLocaleString()}</span>
                  </div>
                  {data?.change > 0 && (
                    <div className="flex justify-between py-1 text-amber-600">
                      <span>Change Due</span><span>₹{data.change.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-1.5 text-[9px] font-semibold text-slate-500 uppercase">Particulars</th>
                      <th className="text-right py-1.5 text-[9px] font-semibold text-slate-500 uppercase">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50">
                      <td className="py-2 text-slate-700">Room Charges ({data.checkIn || ''} to {data.checkOut || ''})</td>
                      <td className="py-2 text-right font-semibold text-slate-800">{subtotal.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-slate-50">
                      <td className="py-2 text-slate-700">GST @ {taxRate}%</td>
                      <td className="py-2 text-right font-semibold text-slate-800">{taxAmt.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b-2 border-slate-800 font-bold">
                      <td className="py-2 text-slate-800">Grand Total</td>
                      <td className="py-2 text-right text-slate-800">{grandTotal.toLocaleString()}</td>
                    </tr>
                    {advancePaid > 0 && (
                      <tr className="text-emerald-600">
                        <td className="py-2">Advance Paid at Check-In</td>
                        <td className="py-2 text-right font-semibold">- {advancePaid.toLocaleString()}</td>
                      </tr>
                    )}
                    {advancePaid > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2 text-amber-700 font-medium">Balance Due at Check-In</td>
                        <td className="py-2 text-right font-semibold text-amber-700">{Math.max(0, grandTotal - advancePaid).toLocaleString()}</td>
                      </tr>
                    )}
                    {checkoutPaid > 0 && (
                      <tr className="text-emerald-600">
                        <td className="py-2">Paid at Check-Out</td>
                        <td className="py-2 text-right font-semibold">- {checkoutPaid.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className={`border-t-2 font-bold ${balanceAmt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      <td className="pt-2">{balanceAmt > 0 ? 'Balance Due' : 'Total Paid'}</td>
                      <td className="pt-2 text-right">{balanceAmt > 0 ? balanceAmt.toLocaleString() : totalPaid.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              {balanceAmt <= 0 && totalPaid > 0 && type !== 'pos' && (
                <div className="mt-3 text-center">
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded font-semibold">✓ PAID IN FULL</span>
                </div>
              )}
              {type === 'pos' && grandTotal > 0 && (
                <div className="mt-3 text-center">
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded font-semibold">✓ PAID</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-2 mb-5">
            Amount in Words: <strong className="text-slate-700">{numberToWords(grandTotal)}</strong>
          </div>

          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500">
            <div className="grid grid-cols-4 gap-4">
              <div><strong>GST:</strong> {hotelInfo.gstin}</div>
              <div><strong>PAN:</strong> {hotelInfo.pan}</div>
              <div><strong>Phone:</strong> {hotelInfo.phone}</div>
              <div><strong>Email:</strong> {hotelInfo.email}</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-[9px] text-slate-400 text-center">
            This is a computer-generated invoice. No signature required.<br />
            Thank you for choosing {hotelInfo.name}!
          </div>
        </div>
      </div>
    </div>
  );
}

function numberToWords(n) {
  if (n === 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
  const numStr = n.toString();
  const numLength = numStr.length;
  let str = '';
  for (let i = 0; i < numLength; i++) {
    const digit = parseInt(numStr[i]);
    const place = numLength - i;
    if (place % 3 === 2) {
      if (numStr[i] === '1') {
        str += a[parseInt(numStr[i + 1])] || '';
        i++;
      } else if (digit !== 0) {
        str += b[digit];
      }
    } else if (digit !== 0 || place === 1) {
      if (place <= 3) str += a[digit] + (place === 3 ? 'Hundred ' : '');
      else if (place === 4 || place === 5) {
        if (place === 5 && digit > 0) str += b[digit];
        else if (place === 4) str += a[digit] + 'Thousand ';
      } else if (place === 6 || place === 7) {
        if (place === 7 && digit > 0) str += b[digit];
        else if (place === 6) str += a[digit] + 'Lakh ';
      } else if (place >= 8) {
        if (place === 9 && digit > 0) str += b[digit];
        else if (place === 8) str += a[digit] + 'Crore ';
      }
    }
  }
  return str.trim() + ' Rupees Only';
}
