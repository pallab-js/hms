"use client";

import { AppShell } from "@/components/AppShell";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getInventoryItems,
  upsertInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
  type CreateInventoryItem,
} from "@/lib/api";
import { useState } from "react";
import { Plus, Search, Trash2, X, AlertTriangle, Pencil } from "lucide-react";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: getInventoryItems,
  });

  const createMutation = useMutation({
    mutationFn: upsertInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter((i) => i.quantity <= i.min_quantity).length;

  return (
    <AppShell>
      <div id="main-content">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-1">Inventory</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
              Track supplies and equipment
              {lowStockCount > 0 && (
                <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)' }}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {lowStockCount} low stock
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'var(--color-bg-button)',
              color: 'var(--color-text-primary)',
              padding: '8px 24px',
              borderRadius: '9999px',
              border: '1px solid var(--color-text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '9999px',
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                padding: '10px 16px 10px 40px',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
          {isLoading ? (
            <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
              {search ? "No items match your search" : "No inventory items yet"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-default)', background: 'var(--color-bg-surface)' }}>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Item</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Category</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Quantity</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Unit</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Min. Stock</th>
                  <th className="text-right p-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.min_quantity;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: isLow ? 'var(--color-bg-surface)' : 'transparent' }}>
                      <td className="p-4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isLow && <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} />}
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span style={{ borderRadius: '9999px', padding: '4px 12px', fontSize: '0.75rem', background: 'var(--color-bg-button)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-default)' }}>
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span style={{ fontWeight: 500, color: isLow ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{item.unit}</td>
                      <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{item.min_quantity}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingItem(item); setShowForm(true); }}
                            style={{ borderRadius: '9999px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)' }}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete inventory item "${item.name}"? This cannot be undone.`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            style={{ borderRadius: '9999px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)' }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <InventoryFormModal
            item={editingItem}
            onClose={() => { setShowForm(false); setEditingItem(null); }}
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}

function InventoryFormModal({
  item,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSubmit: (data: CreateInventoryItem) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "");
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? "0");
  const [unit, setUnit] = useState(item?.unit || "pcs");
  const [minQuantity, setMinQuantity] = useState(item?.min_quantity?.toString() ?? "5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      alert("Please enter a valid non-negative quantity");
      return;
    }
    const parsedMinQuantity = parseInt(minQuantity);
    if (isNaN(parsedMinQuantity) || parsedMinQuantity < 0) {
      alert("Please enter a valid non-negative minimum quantity");
      return;
    }
    onSubmit({
      id: item?.id,
      name,
      category,
      quantity: parsedQuantity,
      unit,
      min_quantity: parsedMinQuantity,
    });
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-button)',
    color: 'var(--color-text-primary)',
    padding: '10px 16px',
    borderRadius: '9999px',
    fontSize: '0.875rem',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-lg" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', padding: '24px' }}>
        <div className="flex items-center justify-between mb-6">
          <h3>{item ? "Edit Inventory Item" : "Add Inventory Item"}</h3>
          <button onClick={onClose} style={{ borderRadius: '9999px', padding: '8px', cursor: 'pointer', border: '1px solid var(--color-border-default)', background: 'transparent' }}>
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Item Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Category *</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required maxLength={100} placeholder="e.g. Medication, Equipment" style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Quantity *</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Unit *</label>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required maxLength={50} placeholder="pcs" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Min. Stock *</label>
              <input type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} required min="0" style={inputStyle} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} style={{ borderRadius: '9999px', border: '1px solid var(--color-border-default)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', padding: '10px 24px', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ borderRadius: '9999px', background: 'var(--color-bg-button)', color: 'var(--color-text-primary)', padding: '10px 24px', fontSize: '0.875rem', border: '1px solid var(--color-text-primary)', opacity: isSubmitting ? 0.5 : 1, cursor: 'pointer' }}>
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}