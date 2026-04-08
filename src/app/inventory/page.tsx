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
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-1">Inventory</h1>
            <p className="text-[#737373] dark:text-[#a3a3a3] text-base">
              Track supplies and equipment
              {lowStockCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-[#737373] dark:text-[#a3a3a3]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {lowStockCount} low stock
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#141414] pl-10 pr-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[#737373]">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#737373]">
              {search ? "No items match your search" : "No inventory items yet"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#141414]">
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Item</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Category</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Quantity</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Unit</th>
                  <th className="text-left p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Min. Stock</th>
                  <th className="text-right p-4 font-medium text-[#737373] dark:text-[#a3a3a3]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.min_quantity;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-[#e5e5e5] dark:border-[#262626] last:border-0 hover:bg-[#fafafa] dark:hover:bg-[#141414] ${
                        isLow ? "bg-[#fafafa] dark:bg-[#141414]" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isLow && (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#a3a3a3]" />
                          )}
                          <span className="font-medium text-[#262626] dark:text-[#d4d4d4]">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-[#e5e5e5] dark:bg-[#262626] px-3 py-1 text-xs font-medium text-[#525252] dark:text-[#a3a3a3]">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-medium ${
                            isLow
                              ? "text-[#737373] dark:text-[#a3a3a3]"
                              : "text-[#262626] dark:text-[#d4d4d4]"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{item.unit}</td>
                      <td className="p-4 text-[#525252] dark:text-[#a3a3a3]">{item.min_quantity}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowForm(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[#737373] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#262626] transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete inventory item "${item.name}"? This cannot be undone.`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[#737373] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#262626] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-lg rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#141414] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[1.5rem]">{item ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4 text-[#737373]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
              Category *
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              maxLength={100}
              placeholder="e.g. Medication, Equipment"
              className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0"
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
                Unit *
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                maxLength={50}
                placeholder="pcs"
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#525252] dark:text-[#a3a3a3] mb-1">
                Min. Stock *
              </label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                required
                min="0"
                className="w-full rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#262626] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#141414] text-[#404040] dark:text-[#d4d4d4] px-6 py-2.5 text-sm font-medium hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
