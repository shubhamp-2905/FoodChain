// ============================================
// FoodChain AI - Supplier Account Service
// Self-service API for supplier-role accounts
// ============================================

import api from "@/lib/axios";
import type { Supplier, Product } from "@/types/supplier";

export interface InventoryCreatePayload {
  ingredient: string;
  category?: string;
  unit?: string;
  price: number;
  stock_available: number;
  minimum_order?: number;
}

export const supplierAccountService = {
  /** Get the supplier profile linked to the current supplier account */
  async getMyProfile(): Promise<Supplier> {
    const response = await api.get<Supplier>("/supplier-account/me");
    return response.data;
  },

  /** Link an existing supplier profile to the current supplier account */
  async claimProfile(supplierId: number): Promise<Supplier> {
    const response = await api.post<Supplier>(`/supplier-account/claim/${supplierId}`);
    return response.data;
  },

  /** Get all inventory items for the current supplier */
  async getMyInventory(): Promise<Product[]> {
    const response = await api.get<Product[]>("/supplier-account/me/inventory");
    return response.data;
  },

  /** Add a new inventory item */
  async addInventoryItem(payload: InventoryCreatePayload): Promise<Product> {
    const response = await api.post<Product>(
      "/supplier-account/me/inventory",
      payload
    );
    return response.data;
  },

  /** Update price/stock for an existing inventory item */
  async updateInventoryItem(
    inventoryId: number,
    payload: InventoryCreatePayload
  ): Promise<Product> {
    const response = await api.put<Product>(
      `/supplier-account/me/inventory/${inventoryId}`,
      payload
    );
    return response.data;
  },

  /** Remove an inventory item */
  async deleteInventoryItem(inventoryId: number): Promise<void> {
    await api.delete(`/supplier-account/me/inventory/${inventoryId}`);
  },
};
