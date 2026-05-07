import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Tariff } from '../../types';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';

interface TariffFormData {
  name: string; description: string; minUnits: string; maxUnits: string;
  ratePerUnit: string; fixedCharges: string; fuelAdjustment: string;
  taxPercentage: string; effectiveFrom: string; isActive: boolean;
}

const defaultForm: TariffFormData = {
  name: '', description: '', minUnits: '', maxUnits: '',
  ratePerUnit: '', fixedCharges: '150', fuelAdjustment: '3.23',
  taxPercentage: '17', effectiveFrom: new Date().toISOString().split('T')[0], isActive: true,
};

export default function AdminTariffs() {
  const { tariffs, addTariff, updateTariff, deleteTariff } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<TariffFormData>(defaultForm);

  const set = (field: keyof TariffFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const startEdit = (t: Tariff) => {
    setEditingId(t.id);
    setAdding(false);
    setForm({
      name: t.name, description: t.description ?? '',
      minUnits: String(t.minUnits), maxUnits: t.maxUnits ? String(t.maxUnits) : '',
      ratePerUnit: String(t.ratePerUnit), fixedCharges: String(t.fixedCharges),
      fuelAdjustment: String(t.fuelAdjustment), taxPercentage: String(t.taxPercentage),
      effectiveFrom: t.effectiveFrom.split('T')[0], isActive: t.isActive,
    });
  };

  const handleSave = () => {
    if (!form.name || !form.minUnits || !form.ratePerUnit) {
      toast.error('Please fill required fields'); return;
    }
    const data = {
      name: form.name, description: form.description,
      minUnits: parseInt(form.minUnits), maxUnits: form.maxUnits ? parseInt(form.maxUnits) : undefined,
      ratePerUnit: parseFloat(form.ratePerUnit), fixedCharges: parseFloat(form.fixedCharges),
      fuelAdjustment: parseFloat(form.fuelAdjustment), taxPercentage: parseFloat(form.taxPercentage),
      effectiveFrom: form.effectiveFrom, isActive: form.isActive,
    };
    if (editingId) {
      updateTariff(editingId, data);
      toast.success('Tariff updated');
    } else {
      addTariff(data);
      toast.success('Tariff added');
    }
    setEditingId(null);
    setAdding(false);
    setForm(defaultForm);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete tariff "${name}"?`)) {
      deleteTariff(id);
      toast.success('Tariff deleted');
    }
  };

  const FormSection = () => (
    <div className="bg-white border-2 border-blue-200 rounded-xl p-5 mb-4">
      <h3 className="font-semibold text-slate-900 mb-4">{adding ? 'Add New Tariff Slab' : 'Edit Tariff'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { field: 'name', label: 'Name *', placeholder: 'e.g. Residential A-1 (1-100)' },
          { field: 'minUnits', label: 'Min Units *', placeholder: '1', type: 'number' },
          { field: 'maxUnits', label: 'Max Units (leave empty = unlimited)', placeholder: '100', type: 'number' },
          { field: 'ratePerUnit', label: 'Rate / kWh (PKR) *', placeholder: '7.74', type: 'number' },
          { field: 'fixedCharges', label: 'Fixed Charges (PKR)', placeholder: '150', type: 'number' },
          { field: 'fuelAdjustment', label: 'Fuel Adjustment / kWh', placeholder: '3.23', type: 'number' },
          { field: 'taxPercentage', label: 'Tax %', placeholder: '17', type: 'number' },
          { field: 'effectiveFrom', label: 'Effective From', type: 'date' },
        ].map(f => (
          <div key={f.field}>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{f.label}</label>
            <input type={f.type || 'text'} value={form[f.field as keyof TariffFormData] as string} onChange={set(f.field as keyof TariffFormData)}
              placeholder={f.placeholder} step="0.01"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
          <input value={form.description} onChange={set('description')} placeholder="Optional description"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <label className="text-sm font-medium text-slate-700">Active</label>
          <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Save size={15} /> {adding ? 'Add Tariff' : 'Save Changes'}
        </button>
        <button onClick={() => { setEditingId(null); setAdding(false); setForm(defaultForm); }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <X size={15} /> Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tariff Management"
        subtitle="NEPRA electricity tariff slabs"
        actions={!adding && !editingId ? (
          <button
            onClick={() => { setAdding(true); setEditingId(null); setForm(defaultForm); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Add Tariff Slab
          </button>
        ) : undefined}
      />

      {(adding || editingId) && <FormSection />}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Name', 'Units Range', 'Rate/kWh', 'Fixed', 'Fuel Adj', 'Tax', 'Effective From', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tariffs.map(t => (
                <tr key={t.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${editingId === t.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="text-slate-900 text-sm font-medium">{t.name}</p>
                    {t.description && <p className="text-slate-400 text-xs">{t.description}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-700">{t.minUnits}–{t.maxUnits ?? '∞'}</td>
                  <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">PKR {t.ratePerUnit}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">PKR {t.fixedCharges}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.fuelAdjustment}/kWh</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{t.taxPercentage}%</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{new Date(t.effectiveFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {t.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(t.id, t.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
