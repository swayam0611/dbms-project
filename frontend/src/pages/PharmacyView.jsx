import React, { useState, useEffect } from 'react';
import { Pill, AlertTriangle, RefreshCw, Plus, PackageCheck, Search, Filter, X } from 'lucide-react';
import { getInventory, restockMedicine, addMedicine } from '../api';

export default function PharmacyView() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState('');

  // Restock modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [restockQty, setRestockQty] = useState(50);
  const [submittingRestock, setSubmittingRestock] = useState(false);

  // Add Medicine modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [medData, setMedData] = useState({
    name: '',
    strength: '',
    form: 'Tablet',
    unit_price: 15.00,
    manufacturer: '',
    initial_quantity: 100,
    reorder_level: 25
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getInventory(lowStockFilter);
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lowStockFilter]);

  const handleOpenRestock = (item) => {
    setTargetItem(item);
    setRestockQty(50);
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRestock(true);
    try {
      await restockMedicine(targetItem.medicine_id, parseInt(restockQty));
      setShowRestockModal(false);
      loadData();
    } catch (err) {
      alert("Failed to restock: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingRestock(false);
    }
  };

  const handleAddMedicineSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setSubmittingAdd(true);
    try {
      await addMedicine({
        ...medData,
        unit_price: parseFloat(medData.unit_price),
        initial_quantity: parseInt(medData.initial_quantity) || 0,
        reorder_level: parseInt(medData.reorder_level) || 20
      });
      setShowAddModal(false);
      setMedData({
        name: '',
        strength: '',
        form: 'Tablet',
        unit_price: 15.00,
        manufacturer: '',
        initial_quantity: 100,
        reorder_level: 25
      });
      loadData();
    } catch (err) {
      setAddError(err.response?.data?.detail || "Failed to add medicine to formulary.");
    } finally {
      setSubmittingAdd(false);
    }
  };

  const filteredItems = inventory.filter((item) => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.form.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = inventory.filter((i) => i.is_low_stock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory & Drug Formulary</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time stock monitoring, threshold alerts, and formulary catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            Add Medicine
          </button>
          <button 
            onClick={loadData}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search medicine name or form..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border-slate-300 border p-2 pl-8 focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-4">
          {lowStockCount > 0 && (
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              {lowStockCount} items below reorder level
            </span>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lowStockOnly"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
            />
            <label htmlFor="lowStockOnly" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Show Low Stock Only
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading stock inventory...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No inventory items matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3">Dosage Form</th>
                  <th className="px-4 py-3">Unit Price (MRP)</th>
                  <th className="px-4 py-3">Stock Available</th>
                  <th className="px-4 py-3">Reorder Threshold</th>
                  <th className="px-4 py-3">Stock Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.inventory_id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400">Strength: {item.strength}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                        {item.form}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 font-mono">₹{item.unit_price}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold text-sm ${item.is_low_stock ? 'text-rose-600' : 'text-slate-800'}`}>
                          {item.quantity_in_stock}
                        </span>
                        <span className="text-[11px] text-slate-400">units</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {item.reorder_level} units
                    </td>
                    <td className="px-4 py-3.5">
                      {item.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <PackageCheck className="w-3 h-3" />
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenRestock(item)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {showRestockModal && targetItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-100 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900">Restock Medicine</h2>
            <p className="text-xs text-slate-500 mt-1">{targetItem.name} ({targetItem.strength})</p>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Add Quantity (Units) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                Current stock: <span className="font-bold text-slate-800">{targetItem.quantity_in_stock}</span>.
                New stock will be: <span className="font-bold text-sky-700">{targetItem.quantity_in_stock + parseInt(restockQty || 0)}</span>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRestock}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow disabled:opacity-60"
                >
                  {submittingRestock ? "Updating..." : "Add to Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Medicine to Formulary</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {addError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddMedicineSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cefuroxime Axetil"
                  value={medData.name}
                  onChange={(e) => setMedData({ ...medData, name: e.target.value })}
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg, 10 ml"
                    value={medData.strength}
                    onChange={(e) => setMedData({ ...medData, strength: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 border p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form *</label>
                  <select
                    value={medData.form}
                    onChange={(e) => setMedData({ ...medData, form: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 border p-2"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Retail Price (₹ MRP) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    required
                    value={medData.unit_price}
                    onChange={(e) => setMedData({ ...medData, unit_price: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 border p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sun Pharma, Cipla"
                    value={medData.manufacturer}
                    onChange={(e) => setMedData({ ...medData, manufacturer: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 border p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock (Units) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={medData.initial_quantity}
                    onChange={(e) => setMedData({ ...medData, initial_quantity: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 border p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level *</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={medData.reorder_level}
                    onChange={(e) => setMedData({ ...medData, reorder_level: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 border p-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow disabled:opacity-60"
                >
                  {submittingAdd ? "Saving..." : "Add to Formulary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
