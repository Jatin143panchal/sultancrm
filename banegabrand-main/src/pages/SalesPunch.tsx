// src/pages/SalesPunch.tsx
import React, { useState, useEffect, useRef } from 'react';

// ==================== TYPES ====================
interface PaymentSlip {
  id: string;
  fileName: string;
  fileData: string;
  fileType: string;
  uploadedAt: string;
}

interface SalesEntry {
  id: string;
  date: string;
  clientName: string;
  mobile: string;
  address: string;
  state: string;
  hasGst: boolean;
  amount: number;
  product: string;
  paymentMode: 'UPI' | 'Netbanking' | 'Razorpay' | 'Cash' | 'Other';
  paymentSlips: PaymentSlip[];
  notes: string;
}

interface SalesFormData {
  clientName: string;
  mobile: string;
  address: string;
  state: string;
  hasGst: boolean;
  amount: number;
  product: string;
  paymentMode: 'UPI' | 'Netbanking' | 'Razorpay' | 'Cash' | 'Other';
  notes: string;
}

// ==================== MAIN COMPONENT ====================
const SalesPunch: React.FC = () => {
  // ---------- STATE ----------
  const [entries, setEntries] = useState<SalesEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showSlipModal, setShowSlipModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<SalesFormData>({
    clientName: '',
    mobile: '',
    address: '',
    state: '',
    hasGst: false,
    amount: 0,
    product: '',
    paymentMode: 'Cash',
    notes: '',
  });

  // ---------- LOCAL STORAGE ----------
  useEffect(() => {
    const saved = localStorage.getItem('salesPunchEntries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const fixed = parsed.map((entry: any) => ({
          ...entry,
          paymentSlips: entry.paymentSlips || [],
          notes: entry.notes || '',
          state: entry.state || '',
        }));
        setEntries(fixed);
      } catch (e) {
        console.error('Error loading data:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('salesPunchEntries', JSON.stringify(entries));
  }, [entries]);

  // ---------- HELPERS ----------
  function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const getPaymentEmoji = (mode: string): string => {
    const map: Record<string, string> = {
      Cash: '💵',
      UPI: '📱',
      Netbanking: '🏦',
      Razorpay: '⚡',
      Other: '🔄',
    };
    return map[mode] || '🔄';
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // ---------- CRUD ----------
  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.mobile.trim() || form.amount <= 0) {
      alert('Please fill Client Name, Mobile, and Amount correctly!');
      return;
    }

    const newEntry: SalesEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      clientName: form.clientName.trim(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),
      state: form.state.trim(),
      hasGst: form.hasGst,
      amount: form.amount,
      product: form.product.trim(),
      paymentMode: form.paymentMode,
      paymentSlips: [],
      notes: form.notes.trim(),
    };

    setEntries([...entries, newEntry]);
    resetForm();
    setShowForm(false);
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.mobile.trim() || form.amount <= 0) {
      alert('Please fill Client Name, Mobile, and Amount correctly!');
      return;
    }

    if (!editingId) return;

    setEntries(entries.map(entry => {
      if (entry.id === editingId) {
        return {
          ...entry,
          date: selectedDate,
          clientName: form.clientName.trim(),
          mobile: form.mobile.trim(),
          address: form.address.trim(),
          state: form.state.trim(),
          hasGst: form.hasGst,
          amount: form.amount,
          product: form.product.trim(),
          paymentMode: form.paymentMode,
          notes: form.notes.trim(),
        };
      }
      return entry;
    }));

    resetForm();
    setShowForm(false);
    setEditingId(null);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Delete this entry?')) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const handleEditEntry = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      setForm({
        clientName: entry.clientName,
        mobile: entry.mobile,
        address: entry.address,
        state: entry.state || '',
        hasGst: entry.hasGst,
        amount: entry.amount,
        product: entry.product,
        paymentMode: entry.paymentMode,
        notes: entry.notes || '',
      });
      setSelectedDate(entry.date);
      setEditingId(id);
      setShowForm(true);
    }
  };

  const resetForm = () => {
    setForm({
      clientName: '',
      mobile: '',
      address: '',
      state: '',
      hasGst: false,
      amount: 0,
      product: '',
      paymentMode: 'Cash',
      notes: '',
    });
    setEditingId(null);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  // ---------- PAYMENT SLIP HANDLERS ----------
  const handleAddSlip = (entryId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const newSlip: PaymentSlip = {
        id: Date.now().toString(),
        fileName: file.name,
        fileData: base64,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      };

      setEntries(entries.map(entry => {
        if (entry.id === entryId) {
          return {
            ...entry,
            paymentSlips: [...(entry.paymentSlips || []), newSlip],
          };
        }
        return entry;
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteSlip = (entryId: string, slipId: string) => {
    if (window.confirm('Delete this payment slip?')) {
      setEntries(entries.map(entry => {
        if (entry.id === entryId) {
          return {
            ...entry,
            paymentSlips: (entry.paymentSlips || []).filter(slip => slip.id !== slipId),
          };
        }
        return entry;
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedEntryId) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      handleAddSlip(selectedEntryId, file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openSlipModal = (entryId: string) => {
    setSelectedEntryId(entryId);
    setShowSlipModal(true);
  };

  const closeSlipModal = () => {
    setShowSlipModal(false);
    setSelectedEntryId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---------- FILTERED DATA ----------
  const filteredEntries = entries.filter(entry => entry.date === selectedDate);
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // ---------- RENDER ----------
  return (
    <div className="h-full bg-gray-50 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                💰 Sales Punch
              </h2>
              <p className="text-sm text-gray-500 mt-1">Daily payment entries with payment slips</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {showForm ? '✕ Close Form' : '➕ New Entry'}
            </button>
          </div>
        </div>

        {/* ===== DATE FILTER & TOTAL ===== */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-white text-sm font-medium whitespace-nowrap">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border-0 text-sm focus:ring-2 focus:ring-white outline-none w-full sm:w-auto"
              />
            </div>
            <div className="text-white text-right w-full sm:w-auto">
              <p className="text-xs opacity-80">Total Collection</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalAmount)}</p>
              <p className="text-xs opacity-80">{filteredEntries.length} entries</p>
            </div>
          </div>
        </div>

        {/* ===== FORM ===== */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {editingId ? '✏️ Edit Entry' : '📝 New Entry'}
            </h3>

            <form onSubmit={editingId ? handleUpdateEntry : handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Rajesh Sharma"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="123, Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Product / Service
                  </label>
                  <input
                    type="text"
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Website Development"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="UPI">📱 UPI</option>
                    <option value="Netbanking">🏦 Netbanking</option>
                    <option value="Razorpay">⚡ Razorpay</option>
                    <option value="Other">🔄 Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="text-sm font-medium text-gray-600 whitespace-nowrap">GST Registered:</label>
                  <input
                    type="checkbox"
                    checked={form.hasGst}
                    onChange={(e) => setForm({ ...form, hasGst: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">{form.hasGst ? '✅ Yes' : '❌ No'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
                >
                  {editingId ? '💾 Update Entry' : '✅ Save Entry'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== ENTRIES LIST ===== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-3 md:p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">
              📋 Entries ({filteredEntries.length})
            </h3>
            <span className="text-xs text-gray-500">
              Total: {formatCurrency(totalAmount)}
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-gray-400">
              <p className="text-4xl md:text-5xl mb-3">📭</p>
              <p className="text-sm">No entries for this date</p>
              <p className="text-xs">Click "New Entry" to add your first sale</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-gray-600 text-xs uppercase tracking-wider">
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold">#</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold">Client</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden sm:table-cell">Mobile</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden lg:table-cell">State</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden md:table-cell">Product</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold">Amount</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden sm:table-cell">Payment</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold text-center">Slips</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEntries.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition">
                      <td className="py-2 md:py-3 px-2 md:px-4 text-gray-500 text-center">{index + 1}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4">
                        <div className="font-medium text-gray-700">
                          {entry.clientName}
                          {entry.hasGst && (
                            <span className="ml-1 md:ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              GST
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 sm:hidden">
                          {entry.mobile}
                        </div>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-gray-600 hidden sm:table-cell">
                        {entry.mobile}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-gray-600 hidden lg:table-cell">
                        {entry.state || '—'}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-gray-600 hidden md:table-cell">
                        {entry.product || '—'}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 font-bold text-gray-800 whitespace-nowrap">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 hidden sm:table-cell">
                        <span className="text-[10px] bg-gray-100 px-1.5 py-1 rounded-full whitespace-nowrap">
                          {getPaymentEmoji(entry.paymentMode)} {entry.paymentMode}
                        </span>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-center">
                        <button
                          onClick={() => openSlipModal(entry.id)}
                          className="relative text-indigo-500 hover:text-indigo-700 p-1 rounded hover:bg-indigo-50 transition"
                          title="View/Add Slips"
                        >
                          📎
                          {(entry.paymentSlips && entry.paymentSlips.length > 0) && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                              {entry.paymentSlips.length}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <button
                            onClick={() => handleEditEntry(entry.id)}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== PAYMENT SLIP MODAL ===== */}
      {showSlipModal && selectedEntryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                📎 Payment Slips
              </h3>
              <button
                onClick={closeSlipModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 md:p-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 mb-6 text-center">
                <p className="text-gray-600 mb-1">Upload Payment Slip</p>
                <p className="text-xs text-gray-400 mb-3">Supported: JPG, PNG, PDF (Max 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Slips List */}
              {(() => {
                const entry = entries.find(e => e.id === selectedEntryId);
                if (!entry) return null;

                const slips = entry.paymentSlips || [];

                if (slips.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-4xl mb-2">📭</p>
                      <p className="text-sm">No payment slips uploaded</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {slips.map((slip) => (
                      <div key={slip.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="relative bg-gray-50 p-2">
                          {slip.fileType && slip.fileType.startsWith('image/') ? (
                            <img
                              src={slip.fileData}
                              alt={slip.fileName}
                              className="w-full h-32 md:h-40 object-contain rounded"
                            />
                          ) : (
                            <div className="w-full h-32 md:h-40 flex items-center justify-center bg-gray-100 rounded">
                              <div className="text-center">
                                <p className="text-3xl md:text-4xl mb-1">📄</p>
                                <p className="text-xs text-gray-600 truncate px-2">{slip.fileName}</p>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteSlip(selectedEntryId, slip.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="p-2 text-xs text-gray-500">
                          <p className="truncate font-medium">{slip.fileName}</p>
                          <p>Uploaded: {formatDate(slip.uploadedAt)} at {formatTime(slip.uploadedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPunch;