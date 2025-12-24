import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  stock: number;
  unit: string;
  reorder_level: number;
  price: number;
  expiry_date: string | null;
  doctor_id: string;
  created_at: string;
  updated_at: string;
}

export type InventoryCategory = "medicine" | "procedure" | "examination" | "tool" | "supply" | "equipment";

interface UseInventoryOptions {
  category?: InventoryCategory | "all";
  autoFetch?: boolean;
}

interface UseInventoryReturn {
  inventory: InventoryItem[];
  loading: boolean;
  error: Error | null;
  fetchInventory: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, "id" | "doctor_id" | "created_at" | "updated_at">) => Promise<boolean>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  getItemsByCategory: (category: InventoryCategory) => InventoryItem[];
  getLowStockItems: (excludeCategories?: InventoryCategory[]) => InventoryItem[];
}

export const useInventory = (options: UseInventoryOptions = {}): UseInventoryReturn => {
  const { category = "all", autoFetch = true } = options;
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("inventory").select("*").order("name");
      
      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setInventory(data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch inventory");
      setError(error);
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [user, category]);

  useEffect(() => {
    if (autoFetch) {
      fetchInventory();
    }
  }, [autoFetch, fetchInventory]);

  const addItem = useCallback(async (
    item: Omit<InventoryItem, "id" | "doctor_id" | "created_at" | "updated_at">
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("inventory").insert({
        ...item,
        doctor_id: user.id,
      });

      if (error) throw error;
      toast.success("Item added successfully");
      await fetchInventory();
      return true;
    } catch (err) {
      console.error("Error adding item:", err);
      toast.error("Failed to add item");
      return false;
    }
  }, [user, fetchInventory]);

  const updateItem = useCallback(async (
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("inventory")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast.success("Item updated successfully");
      await fetchInventory();
      return true;
    } catch (err) {
      console.error("Error updating item:", err);
      toast.error("Failed to update item");
      return false;
    }
  }, [fetchInventory]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item deleted successfully");
      await fetchInventory();
      return true;
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Failed to delete item");
      return false;
    }
  }, [fetchInventory]);

  const getItemsByCategory = useCallback((cat: InventoryCategory): InventoryItem[] => {
    return inventory.filter((item) => item.category === cat);
  }, [inventory]);

  const getLowStockItems = useCallback((
    excludeCategories: InventoryCategory[] = ["procedure", "examination"]
  ): InventoryItem[] => {
    return inventory.filter(
      (item) => 
        item.stock <= item.reorder_level && 
        !excludeCategories.includes(item.category as InventoryCategory)
    );
  }, [inventory]);

  return {
    inventory,
    loading,
    error,
    fetchInventory,
    addItem,
    updateItem,
    deleteItem,
    getItemsByCategory,
    getLowStockItems,
  };
};
