import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { useApp } from '../store/AppContext';

const HOTEL_INFO = {
  name: 'YOYO Fun Resort & Water Park',
  address: 'Plot No. 12, Waterfront Road, Near Beach Colony',
  city: 'Goa - 403001',
  gst: '30ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  phone: '+91 98765 43210',
  email: 'accounts@yoyofun.in',
};

export default function InvoiceModal({ data, type, onClose }) {
  const printRef = useRef(null);
  const { defaultRules } = useApp();
  const today = new Date();
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
    win.document.write(`
      <html><head><title>Invoice ${invoiceNo}</title>
      <style>
        @page { margin: 15mm; size: A4; }
        body { font-family: 'Courier New', monospace; font-size: 12px; color: #1e293b; margin: 0; padding: 30px; }
        .invoice { max-width: 210mm; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px; }
        .hotel-name { font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .hotel-info { font-size: 10px; color: #64748b; line-height: 1.6; }
        .invoice-title { font-size: 14px; font-weight: bold; text-align: right; }
        .invoice-meta { font-size: 10px; color: #64748b; text-align: right; }
        .section { margin-bottom: 16px; }
        .section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row td { font-weight: bold; border-top: 2px solid #1e293b; padding-top: 10px; }
        .grand-total { font-size: 16px; }
        .balance { color: #dc2626; }
        .paid { color: #059669; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 8px; font-weight: bold; text-transform: uppercase; }
        .badge-paid { background: #dcfce7; color: #059669; }
        .badge-pending { background: #fef3c7; color: #d97706; }
        .guest-info { display: flex; gap: 40px; }
        .guest-info > div { flex: 1; }
        .amount-words { font-size: 10px; color: #64748b; margin-top: 8px; }
        .print-btn { display: block; margin: 20px auto; padding: 10px 30px; background: #1e293b; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
        @media print {
          .print-btn { display: none; }
          body { padding: 0; }
        }
      </style></head><body>
      <div class="invoice">
        <div class="header">
          <div>
            <div class="hotel-name">${HOTEL_INFO.name}</div>
            <div class="hotel-info">${HOTEL_INFO.address}<br>${HOTEL_INFO.city}</div>
          </div>
          <div>
            <div class="invoice-title">TAX INVOICE</div>
            <div class="invoice-meta">Invoice #: ${invoiceNo}<br>Date: ${invoiceDate}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Bill To</div>
          <div style="font-size: 12px;">
            <strong>${data?.guestName || data?.guest || 'Guest'}</strong><br>
            ${data?.roomNumber ? `Room ${data.roomNumber}` : ''}${data?.tableNumber ? `Table ${data.tableNumber}` : ''}
            ${data?.area ? ` - ${data.area}` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Invoice Details</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
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
                  <td>${data?.description || type === 'pos' ? 'Restaurant Services' : 'Room Booking Charges'}</td>
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
          <div style="font-size: 11px; display: flex; gap: 30px;">
            <div><strong>Check-In:</strong> ${data.checkIn}</div>
            <div><strong>Check-Out:</strong> ${data.checkOut}</div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Payment Summary</div>
          <table style="width: 100%; max-width: 450px; margin-left: auto;">
            <tr><td style="padding: 4px 10px;">Room Charges</td><td style="padding: 4px 10px; text-align: right;">₹${subtotal.toLocaleString()}</td></tr>
            <tr><td style="padding: 4px 10px;">GST (${taxRate}%)</td><td style="padding: 4px 10px; text-align: right;">₹${taxAmt.toLocaleString()}</td></tr>
            <tr class="total-row"><td style="padding: 8px 10px; font-size: 14px;">Grand Total</td><td style="padding: 8px 10px; text-align: right; font-size: 14px;">₹${grandTotal.toLocaleString()}</td></tr>
            ${advancePaid > 0 ? `<tr><td style="padding: 4px 10px; color: #059669;">Advance Paid at Check-In</td><td style="padding: 4px 10px; text-align: right; color: #059669;">- ₹${advancePaid.toLocaleString()}</td></tr>` : ''}
            ${advancePaid > 0 ? `<tr style="color: #d97706;"><td style="padding: 4px 10px; font-weight: 500;">Balance Due at Check-In</td><td style="padding: 4px 10px; text-align: right; font-weight: 500;">₹${Math.max(0, grandTotal - advancePaid).toLocaleString()}</td></tr>` : ''}
            ${checkoutPaid > 0 ? `<tr><td style="padding: 4px 10px; color: #059669;">Paid at Check-Out</td><td style="padding: 4px 10px; text-align: right; color: #059669;">- ₹${checkoutPaid.toLocaleString()}</td></tr>` : ''}
            <tr style="font-weight: bold; ${balanceAmt > 0 ? 'color: #dc2626;' : 'color: #059669;'} border-top: 2px solid #1e293b;">
              <td style="padding: 8px 10px;">${balanceAmt > 0 ? 'Balance Due' : 'Total Paid'}</td>
              <td style="padding: 8px 10px; text-align: right;">₹${(balanceAmt > 0 ? balanceAmt : totalPaid).toLocaleString()}</td>
            </tr>
            ${balanceAmt <= 0 && totalPaid > 0 ? `<tr><td colspan="2" style="text-align: right; padding-top: 8px;"><span class="badge badge-paid">PAID IN FULL</span></td></tr>` : ''}
          </table>
        </div>

        <div class="amount-words">
          Amount in Words: <strong>${numberToWords(grandTotal)}</strong>
        </div>

        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">
          <table style="width: 100%;">
            <tr>
              <td><strong>GST:</strong> ${HOTEL_INFO.gst}</td>
              <td><strong>PAN:</strong> ${HOTEL_INFO.pan}</td>
              <td><strong>Phone:</strong> ${HOTEL_INFO.phone}</td>
              <td><strong>Email:</strong> ${HOTEL_INFO.email}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          This is a computer-generated invoice. No signature required.<br>
          Thank you for choosing ${HOTEL_INFO.name}!
        </div>

        <button class="print-btn" onclick="window.print()">🖨 Print Invoice</button>
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
              <div className="text-xl font-bold uppercase tracking-wider text-slate-800">{HOTEL_INFO.name}</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                {HOTEL_INFO.address}<br />
                {HOTEL_INFO.city}
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
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase border-b border-slate-200">Description</th>
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

          {/* Payment Summary */}
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

          {/* Payment Timeline */}
          <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Payment Summary</div>
            <div className="p-4">
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
              {balanceAmt <= 0 && totalPaid > 0 && (
                <div className="mt-3 text-center">
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded font-semibold">✓ PAID IN FULL</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-2 mb-5">
            Amount in Words: <strong className="text-slate-700">{numberToWords(grandTotal)}</strong>
          </div>

          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500">
            <div className="grid grid-cols-4 gap-4">
              <div><strong>GST:</strong> {HOTEL_INFO.gst}</div>
              <div><strong>PAN:</strong> {HOTEL_INFO.pan}</div>
              <div><strong>Phone:</strong> {HOTEL_INFO.phone}</div>
              <div><strong>Email:</strong> {HOTEL_INFO.email}</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-[9px] text-slate-400 text-center">
            This is a computer-generated invoice. No signature required.<br />
            Thank you for choosing {HOTEL_INFO.name}!
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
