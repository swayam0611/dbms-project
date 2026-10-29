import React, { useState, useEffect } from 'react';
import { Receipt, Search, Filter, RefreshCw, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { getPharmacyBills, getPharmacyBillById } from '../api';

export default function PharmacySalesView() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Bill detail modal
  const [activeBillDetail, setActiveBillDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.payment_status = statusFilter;
      const res = await getPharmacyBills(params);
      setBills(res.data);
    } catch (err) {
      console.error("Failed to load pharmacy invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleViewDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await getPharmacyBillById(id);
      setActiveBillDetail(res.data);
    } catch (err) {
      alert("Failed to load bill detail: " + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredBills = bills.filter((b) =>
    b.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    b.patient_phone.includes(search) ||
    b.pharmacy_bill_id.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Invoices & Sales Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Audit log of all dispensed pharmaceuticals and patient payments</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by invoice ID, patient name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border-slate-300 border p-2 pl-8 focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Payment Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Invoices</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading pharmacy sales ledger...</div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No pharmacy invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Prescribing Doctor</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items Count</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">View Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((bill) => (
                  <tr key={bill.pharmacy_bill_id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                      #PHARM-{bill.pharmacy_bill_id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{bill.patient_name}</div>
                      <div className="text-[11px] text-slate-400">{bill.patient_phone}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {bill.doctor_name || <span className="text-slate-400 italic">OTC / Walk-in</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {new Date(bill.bill_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {bill.items_count} items
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900 text-sm">
                      ₹{bill.total_amount}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        bill.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {bill.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleViewDetail(bill.pharmacy_bill_id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {activeBillDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Pharmacy Receipt #PHARM-{activeBillDetail.pharmacy_bill_id.toString().padStart(4, '0')}
              </h2>
              <button onClick={() => setActiveBillDetail(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <p><span className="font-semibold text-slate-700">Patient:</span> {activeBillDetail.patient_name} ({activeBillDetail.patient_phone})</p>
              <p><span className="font-semibold text-slate-700">Prescribing Doctor:</span> {activeBillDetail.doctor_name || "Direct Sale"}</p>
              <p><span className="font-semibold text-slate-700">Date & Time:</span> {new Date(activeBillDetail.bill_date).toLocaleString()}</p>
              <p><span className="font-semibold text-slate-700">Status:</span> <span className="font-bold text-emerald-700">{activeBillDetail.payment_status}</span></p>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4 mb-2">Dispensed Medication Items</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Medicine</th>
                    <th className="px-3 py-2">Form</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeBillDetail.items.map((it) => (
                    <tr key={it.bill_item_id}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {it.medicine_name} <span className="text-slate-400 text-[11px]">({it.strength})</span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{it.form}</td>
                      <td className="px-3 py-2 text-center font-mono font-semibold">{it.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono">₹{it.unit_price}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">₹{it.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">Includes 5% Healthcare GST</span>
              <div className="text-right">
                <span className="text-xs text-slate-500 mr-2">Grand Total:</span>
                <span className="text-lg font-bold font-mono text-slate-900">₹{activeBillDetail.total_amount}</span>
              </div>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setActiveBillDetail(null)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
