import { useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../api/client';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'textarea';
  options?: { value: string | number; label: string }[];
  required?: boolean;
  step?: string;
}

export interface ColumnConfig<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface CrudTableProps<T extends { id: number }> {
  title: string;
  endpoint: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  canWrite?: boolean;
  hideEditDelete?: boolean;
  emptyDefaults?: Record<string, unknown>;
}

interface PaginatedResponse<T> {
  results?: T[];
  count?: number;
}

export default function CrudTable<T extends { id: number }>({
  title,
  endpoint,
  columns,
  fields,
  canWrite = true,
  hideEditDelete = false,
  emptyDefaults = {},
}: CrudTableProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<T[] | PaginatedResponse<T>>(`/${endpoint}/`);
      const data = res.data;
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems(data.results ?? []);
      }
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({ ...emptyDefaults });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (item: T) => {
    setEditingId(item.id);
    const data: Record<string, unknown> = {};
    fields.forEach((f) => {
      data[f.name] = (item as Record<string, unknown>)[f.name] ?? '';
    });
    setFormData(data);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({});
    setFormError('');
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload: Record<string, unknown> = {};
      fields.forEach((f) => {
        let val = formData[f.name];
        if (f.type === 'number' && val !== '' && val !== undefined) {
          val = Number(val);
        }
        if (val === '') val = null;
        payload[f.name] = val;
      });

      if (editingId) {
        await api.patch(`/${endpoint}/${editingId}/`, payload);
      } else {
        await api.post(`/${endpoint}/`, payload);
      }
      closeForm();
      fetchItems();
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } };
      if (axiosErr.response?.data) {
        const data = axiosErr.response.data as Record<string, unknown>;
        const messages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        setFormError(messages || 'Something went wrong.');
      } else {
        setFormError('Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/${endpoint}/${id}/`);
      fetchItems();
    } catch {
      alert('Failed to delete. It may be referenced by other records.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        {canWrite && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            <Plus size={16} />
            Add New
          </button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <p className="p-6 text-gray-500 text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">No records found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-4 py-3 font-semibold text-gray-600">
                    {col.label}
                  </th>
                ))}
                {!hideEditDelete && canWrite && <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key as string] ?? '-')}
                    </td>
                  ))}
                  {!hideEditDelete && canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditForm(item)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? `Edit ${title}` : `Add ${title}`}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{formError}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={String(formData[field.name] ?? '')}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      required={field.required}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="">-- Select --</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={String(formData[field.name] ?? '')}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      required={field.required}
                      className="w-full border rounded px-3 py-2 text-sm"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      step={field.step}
                      value={String(formData[field.name] ?? '')}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      required={field.required}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}