import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, CheckCircle2, Clock, Plus, Receipt, ShieldCheck } from 'lucide-react';
import { getBills, recordPayment } from '../api';

export default function BillingView() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Payment modal
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadBills = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.payment_status = statusFilter;
      const res = await getBills(params);
      setBills(res.data);
    } catch (err) {
      console.error("Failed to load billing ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [statusFilter]);

  const handleOpenPayment = (bill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.total_amount);
    setRefNo(`UPI-REF-${Date.now().toString().slice(-6)}`);
    setShowModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recordPayment({
        billing_id: selectedBill.billing_id,
        amount_paid: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        reference_number: refNo
      });
      setShowModal(false);
      loadBills();
    } catch (err) {
      alert("Payment processing failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Invoicing & Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Itemized billing for consultations, bed stays, and medications with transactional payment logging</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Invoices</option>
            <option value="Pending">Pending</option>
            <option value="Partially_Paid">Partially Paid</option>
            <option value="Paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Billing Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No bills found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Bill ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Billing Category</th>
                  <th className="px-4 py-3">Consult Fee</th>
                  <th className="px-4 py-3">Bed Charges</th>
                  <th className="px-4 py-3">Pharmacy</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => {
                  const isPaid = b.payment_status === 'Paid';
                  return (
                    <tr key={b.billing_id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-500">
                        #INV-{b.billing_id.toString().padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{b.patient_name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {b.admission_id ? (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold rounded">
                            Inpatient (Adm #{b.admission_id})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded">
                            OPD (Appt #{b.appointment_id})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">₹{b.consultation_fee}</td>
                      <td className="px-4 py-3.5 text-slate-600">₹{b.bed_charges}</td>
                      <td className="px-4 py-3.5 text-slate-600">₹{b.pharmacy_charges}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 text-base">₹{b.total_amount}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' :
                          b.payment_status === 'Partially_Paid' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {b.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {!isPaid && (
                          <button
                            onClick={() => handleOpenPayment(b)}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                          >
                            Collect Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {showModal && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-100 animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-900">Record Payment Transaction</h2>
            <p className="text-xs text-slate-500 mt-1">Invoice #INV-{selectedBill.billing_id} for {selectedBill.patient_name}</p>

            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Pay (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-base font-bold text-slate-900 rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Insurance">TPA Insurance Claim</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / UTR No.</label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow disabled:opacity-60"
                >
                  {submitting ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
