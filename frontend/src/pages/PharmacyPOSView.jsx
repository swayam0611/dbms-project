import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Trash2, Search, CheckCircle2, 
  AlertCircle, DollarSign, User, FileText, ShoppingCart, ArrowRight
} from 'lucide-react';
import { 
  getPatients, getMedicines, getDoctors, 
  getPatientPrescriptions, createPharmacyBill 
} from '../api';

export default function PharmacyPOSView() {
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Billing form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [selectedRxId, setSelectedRxId] = useState('');

  // Cart items: [{ medicine_id, name, strength, form, unit_price, quantity, available_stock, total_price }]
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [refNumber, setRefNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBill, setSuccessBill] = useState(null);

  // Medicine selector state for manual addition
  const [medSearch, setMedSearch] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [inputQty, setInputQty] = useState(10);

  useEffect(() => {
    const init = async () => {
      try {
        const [resPats, resMeds, resDocs] = await Promise.all([
          getPatients({ limit: 100 }),
          getMedicines(),
          getDoctors()
        ]);
        setPatients(resPats.data);
        setMedicines(resMeds.data);
        setDoctors(resDocs.data);
      } catch (err) {
        console.error("Failed to load initial POS data", err);
      }
    };
    init();
  }, []);

  // When patient changes, fetch their prescriptions
  useEffect(() => {
    if (selectedPatientId) {
      loadPrescriptions(selectedPatientId);
    } else {
      setPatientPrescriptions([]);
      setSelectedRxId('');
    }
  }, [selectedPatientId]);

  const loadPrescriptions = async (patId) => {
    try {
      const res = await getPatientPrescriptions(patId);
      setPatientPrescriptions(res.data);
    } catch (err) {
      console.error("Failed to fetch prescriptions", err);
    }
  };

  // Import items from a prescription
  const handleImportRx = (rx) => {
    setSelectedRxId(rx.prescription_id);
    if (rx.doctor_id) setSelectedDoctorId(rx.doctor_id);

    const newCart = [...cart];
    rx.items.forEach((item) => {
      const existingIdx = newCart.findIndex((c) => c.medicine_id === item.medicine_id);
      // derive a default dispensing quantity (e.g., 10 units)
      const qtyToDispense = 10;
      const unitPrice = item.unit_price;

      if (existingIdx >= 0) {
        newCart[existingIdx].quantity = qtyToDispense;
        newCart[existingIdx].total_price = qtyToDispense * unitPrice;
      } else {
        newCart.push({
          medicine_id: item.medicine_id,
          name: item.medicine_name,
          strength: item.strength,
          form: item.form,
          unit_price: unitPrice,
          quantity: qtyToDispense,
          total_price: qtyToDispense * unitPrice
        });
      }
    });
    setCart(newCart);
  };

  const handleAddMedicine = () => {
    if (!selectedMedId) return;
    const med = medicines.find((m) => m.medicine_id === parseInt(selectedMedId));
    if (!med) return;

    const qty = parseInt(inputQty) || 1;
    const existingIdx = cart.findIndex((c) => c.medicine_id === med.medicine_id);
    const unitPrice = parseFloat(med.unit_price);

    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += qty;
      updated[existingIdx].total_price = updated[existingIdx].quantity * unitPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          medicine_id: med.medicine_id,
          name: med.name,
          strength: med.strength,
          form: med.form,
          unit_price: unitPrice,
          quantity: qty,
          total_price: qty * unitPrice
        }
      ]);
    }
    setSelectedMedId('');
    setInputQty(10);
  };

  const updateCartQty = (idx, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    const updated = [...cart];
    updated[idx].quantity = qty;
    updated[idx].total_price = qty * updated[idx].unit_price;
    setCart(updated);
  };

  const removeCartItem = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // Computations
  const subtotal = cart.reduce((acc, it) => acc + it.total_price, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const totalAmount = subtotal + tax;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorMsg("Please select a patient.");
      return;
    }
    if (cart.length === 0) {
      setErrorMsg("Please add at least one medicine item to dispense.");
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const payload = {
        patient_id: parseInt(selectedPatientId),
        doctor_id: selectedDoctorId ? parseInt(selectedDoctorId) : null,
        prescription_id: selectedRxId ? parseInt(selectedRxId) : null,
        items: cart.map((c) => ({
          medicine_id: c.medicine_id,
          quantity: c.quantity
        })),
        payment_method: paymentMethod,
        amount_paid: totalAmount,
        reference_number: refNumber || `POS-${Date.now().toString().slice(-6)}`
      };

      const res = await createPharmacyBill(payload);
      setSuccessBill(res.data);
      // Reset form
      setCart([]);
      setSelectedRxId('');
      setRefNumber('');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Transaction failed. Please verify stock availability.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((p) => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone.includes(patientSearch) ||
    p.aadhaar_no.includes(patientSearch)
  );

  const selectedPatient = patients.find((p) => p.patient_id === parseInt(selectedPatientId));

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Dispensing & POS Billing</h1>
          <p className="text-sm text-slate-500 mt-1">Dispense prescription medications, verify live stock, and generate patient receipts</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successBill && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2 text-base text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Pharmacy Invoice #PHARM-{successBill.pharmacy_bill_id.toString().padStart(4, '0')} Issued Successfully
            </span>
            <button 
              onClick={() => setSuccessBill(null)}
              className="text-xs font-semibold px-3 py-1 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100"
            >
              Start Next Bill
            </button>
          </div>
          <p className="text-xs text-emerald-700">
            Patient: <span className="font-semibold">{successBill.patient_name}</span> • 
            Total Paid: <span className="font-bold">₹{successBill.total_amount}</span> • 
            Status: <span className="font-semibold">{successBill.payment_status}</span> • 
            Items Dispensed: <span className="font-semibold">{successBill.items_count}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient & Medicine Selection */}
        <div className="lg:col-span-2 space-y-5">
          {/* Patient Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600" />
              1. Select Patient
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patient by name or phone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 pl-8 focus:ring-2 focus:ring-sky-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Choose Patient --</option>
                {filteredPatients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.name} ({p.phone}) [{p.gender}, {p.blood_group}]
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900">{selectedPatient.name}</span>
                  <span className="text-slate-500 ml-2">Phone: {selectedPatient.phone}</span>
                </div>
                <div className="text-slate-600">
                  Address: {selectedPatient.city}, {selectedPatient.state} ({selectedPatient.pincode})
                </div>
              </div>
            )}

            {/* Prescriptions Detected */}
            {selectedPatientId && patientPrescriptions.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-2">Doctor Prescriptions Available on File:</p>
                <div className="space-y-2">
                  {patientPrescriptions.map((rx) => (
                    <div key={rx.prescription_id} className="p-3 bg-sky-50 border border-sky-100 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-sky-950 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          Prescription #{rx.prescription_id} — Prescribed by {rx.doctor_name || "Doctor"}
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Date: {new Date(rx.issue_date).toLocaleDateString()} • Items: {rx.items.length} prescribed medicines
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportRx(rx)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-sm transition"
                      >
                        Import Medicines
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Medicine to Bill */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-sky-600" />
              2. Add Medicines to Dispense
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Medicine from Formulary</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map((m) => (
                    <option key={m.medicine_id} value={m.medicine_id}>
                      {m.name} ({m.strength}) - ₹{m.unit_price} [{m.form}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={inputQty}
                  onChange={(e) => setInputQty(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAddMedicine}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Add Item
              </button>
            </div>

            {/* Cart Table */}
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Medicine</th>
                    <th className="px-3 py-2.5">Form</th>
                    <th className="px-3 py-2.5">Unit Price</th>
                    <th className="px-3 py-2.5 w-24">Dispense Qty</th>
                    <th className="px-3 py-2.5">Total</th>
                    <th className="px-3 py-2.5 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-400 italic">
                        No medicines added yet. Import from prescription above or select from formulary.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {item.name} <span className="font-normal text-slate-500">({item.strength})</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{item.form}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">₹{item.unit_price}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartQty(idx, e.target.value)}
                            className="w-16 text-xs p-1 border border-slate-300 rounded font-semibold text-center"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900 font-mono">₹{item.total_price.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => removeCartItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout & Billing Summary */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-600" />
              3. Invoice Summary
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Prescribing Doctor (Optional)</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Direct Sale / OTC --</option>
                {doctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_id}>{d.name} ({d.specialisation})</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5% Pharma Tax):</span>
                <span className="font-mono font-medium">₹{tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-sky-600 font-mono">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Reference / UTR (Optional)</label>
              <input
                type="text"
                placeholder="e.g. UPI-123456"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0 || !selectedPatientId}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? "Processing Sale..." : "Dispense & Issue Bill"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
