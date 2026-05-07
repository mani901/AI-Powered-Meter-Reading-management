import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Receipt, Download, CheckCircle2, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MOCK_TARIFFS, calculateBillBreakdown } from '../../data/mockData';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';

const statusConfig = {
  ESTIMATED: { label: 'Estimated', color: 'bg-blue-100 text-blue-700', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  OVERDUE: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function Billing() {
  const navigate = useNavigate();
  const { currentUser, bills, meters } = useApp();
  const [selectedMeter, setSelectedMeter] = useState('m1');

  const userBills = bills.filter(b => b.userId === currentUser?.id).sort((a, b) =>
    new Date(b.billingMonth).getTime() - new Date(a.billingMonth).getTime()
  );
  const userMeters = meters.filter(m => m.userId === currentUser?.id && m.status === 'ACTIVE');
  const currentBill = userBills.find(b => b.meterId === selectedMeter && b.status === 'ESTIMATED')
    || userBills.find(b => b.meterId === selectedMeter);

  const breakdown = currentBill ? calculateBillBreakdown(currentBill.unitsConsumed, MOCK_TARIFFS) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle="NEPRA tariff-based electricity bill estimation"
        actions={(
          <button
            onClick={() => navigate('/export')}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors w-fit"
          >
            <Download size={16} /> Export Bills
          </button>
        )}
      />

      {/* Bill estimate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Meter selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Meter</label>
            <div className="flex flex-wrap gap-2">
              {userMeters.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMeter(m.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border
                    ${selectedMeter === m.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                  {m.meterLabel || m.meterSerial}
                </button>
              ))}
            </div>
          </div>

          {/* Bill breakdown */}
          {currentBill && breakdown ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Electricity Bill</p>
                    <p className="text-white font-bold">
                      {new Date(currentBill.billingMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig[currentBill.status].color}`}>
                    {statusConfig[currentBill.status].label}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Reading info */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 mb-5">
                  <div className="text-center">
                    <p className="text-slate-500 text-xs mb-1">Previous Reading</p>
                    <p className="text-slate-900 font-mono font-bold">{currentBill.previousReading.toLocaleString()}</p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <p className="text-slate-500 text-xs mb-1">Current Reading</p>
                    <p className="text-slate-900 font-mono font-bold">{currentBill.currentReading.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 text-xs mb-1">Units Consumed</p>
                    <p className="text-blue-600 font-mono font-bold">{currentBill.unitsConsumed}</p>
                  </div>
                </div>

                {/* Slab breakdown */}
                <div className="mb-5">
                  <p className="text-slate-700 text-sm font-semibold mb-3">Energy Charges (Slab-wise)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['Slab (units)', 'Units', 'Rate (PKR/kWh)', 'Amount (PKR)'].map(h => (
                            <th key={h} className="text-left text-xs font-medium text-slate-500 pb-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.slabs.map((s, i) => (
                          <tr key={i} className="border-b border-slate-50">
                            <td className="py-2 text-slate-700">{s.slab}</td>
                            <td className="py-2 font-mono text-slate-900">{s.units}</td>
                            <td className="py-2 font-mono text-slate-900">{s.rate.toFixed(2)}</td>
                            <td className="py-2 font-mono font-medium text-slate-900">{s.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charge breakdown */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  {[
                    { label: 'Energy Charges', value: breakdown.energyCharges, highlight: false },
                    { label: 'Fixed Monthly Charges', value: breakdown.fixedCharges, highlight: false },
                    { label: 'Fuel Price Adjustment', value: breakdown.fuelAdjustment, highlight: false },
                    { label: 'GST / Tax (17%)', value: breakdown.taxAmount, highlight: false },
                  ].map(line => (
                    <div key={line.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{line.label}</span>
                      <span className="text-slate-900 font-mono">PKR {line.value.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-1">
                    <span className="font-bold text-slate-900">Total Amount Due</span>
                    <span className="font-bold text-blue-600 text-xl font-mono">
                      PKR {breakdown.totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>

                {currentBill.dueDate && (
                  <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} />
                    Due: {new Date(currentBill.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => toast.success('PDF downloaded! (Demo)')}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download size={15} /> Download PDF
                  </button>
                  {currentBill.status !== 'PAID' && (
                    <button
                      onClick={() => toast.success('Bill marked as paid!')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <CreditCard size={15} /> Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Receipt size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-sm">No bill found for this meter. Upload readings to generate a bill.</p>
            </div>
          )}
        </div>

        {/* Tariff info sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">NEPRA Tariff Slabs</h3>
            <div className="space-y-2">
              {MOCK_TARIFFS.filter(t => t.isActive && t.name.startsWith('Residential')).map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{t.minUnits}–{t.maxUnits ?? '∞'} units</span>
                  <span className="font-medium text-slate-900 font-mono">PKR {t.ratePerUnit}/kWh</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <p>+ Fixed charges + Fuel adjustment + 17% GST</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-700 text-xs font-medium mb-2">Bill Summary</p>
            <div className="space-y-1.5">
              {userBills.slice(0, 4).map(b => {
                const s = statusConfig[b.status];
                const SIcon = s.icon;
                return (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span className="text-blue-700">{b.billingMonth}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700 font-medium">PKR {b.totalAmount.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
                      <SIcon size={12} className={b.status === 'PAID' ? 'text-green-600' : b.status === 'OVERDUE' ? 'text-red-600' : 'text-blue-600'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bill history table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Billing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Month', 'Meter', 'Units', 'Energy', 'Total', 'Status', 'Due Date', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userBills.map(b => {
                const s = statusConfig[b.status];
                const SIcon = s.icon;
                return (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-900">
                      {new Date(b.billingMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{b.meterLabel}</td>
                    <td className="px-5 py-3 font-mono text-sm text-slate-900">{b.unitsConsumed}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">PKR {b.energyCharges.toLocaleString('en', { maximumFractionDigits: 0 })}</td>
                    <td className="px-5 py-3 font-mono text-sm font-medium text-slate-900">PKR {b.totalAmount.toLocaleString('en', { maximumFractionDigits: 0 })}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                        <SIcon size={10} /> {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {b.dueDate ? new Date(b.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toast.success('PDF downloaded! (Demo)')} className="text-blue-600 hover:text-blue-700 p-1 rounded">
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
