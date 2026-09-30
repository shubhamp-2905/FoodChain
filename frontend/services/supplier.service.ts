// ============================================
// FoodChain AI - Supplier Service
// ============================================

import api from "@/lib/axios";
import type {
  Supplier,
  Product,
  SupplierSearchParams,
  PaginatedResponse,
} from "@/types/supplier";

export const supplierService = {
  async getSuppliers(
    params?: SupplierSearchParams
  ): Promise<PaginatedResponse<Supplier>> {
    const response = await api.get<PaginatedResponse<Supplier>>("/suppliers", {
      params,
    });
    return response.data;
  },

  async getSupplier(id: number): Promise<Supplier> {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  async getProducts(params?: {
    search?: string;
    category?: string;
  }): Promise<Product[]> {
    const response = await api.get<Product[]>("/products", { params });
    return response.data;
  },

  async getIngredients(): Promise<string[]> {
    const response = await api.get<string[]>("/ingredients");
    return response.data;
  },

  async onboardSupplier(payload: any): Promise<Supplier> {
    const response = await api.post<Supplier>("/suppliers/onboard", payload);
    return response.data;
  },

  async addInventory(supplierId: number, payload: any): Promise<Product> {
    const response = await api.post<Product>(`/suppliers/${supplierId}/inventory`, payload);
    return response.data;
  },
};

