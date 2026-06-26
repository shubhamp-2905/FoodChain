"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Star, Clock, Truck, Shield, Package, DollarSign,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supplierService } from "@/services/supplier.service";

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => supplierService.getSupplier(parseInt(id)),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold">Supplier not found</h2>
        <Link href="/suppliers">
          <Button className="mt-4">Back to Suppliers</Button>
        </Link>
      </div>
    );
  }

  const infoItems = [
    { icon: Star, label: "Rating", value: `${supplier.rating}/5`, color: "text-yellow-500" },
    { icon: Shield, label: "Quality Score", value: `${supplier.quality_score}/5`, color: "text-blue-500" },
    { icon: Shield, label: "Reliability", value: `${supplier.reliability_score}%`, color: "text-green-500" },
    { icon: Truck, label: "Delivery Radius", value: `${supplier.delivery_radius_km} km`, color: "text-purple-500" },
    { icon: Clock, label: "Avg. Delivery", value: `${supplier.average_delivery_time_min} min`, color: "text-orange-500" },
    { icon: MapPin, label: "Market", value: supplier.market, color: "text-red-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <Link href="/suppliers">
        <Button variant="ghost" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Suppliers
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {supplier.supplier_name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Badge className="gradient-orange text-white">
              {supplier.supplier_type}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {supplier.area}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{supplier.rating}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          ID: {supplier.supplier_id}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {infoItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${item.color} shrink-0`} />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Products Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Products ({supplier.products?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supplier.products && supplier.products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Ingredient</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Category</th>
                        <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Price</th>
                        <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Stock</th>
                        <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Min Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplier.products.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-medium">{product.ingredient}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="secondary" className="text-[10px]">
                              {product.category}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-semibold">₹{product.price}</span>
                            <span className="text-muted-foreground">/{product.unit}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">{product.stock_available}</td>
                          <td className="py-2.5 px-3 text-right">{product.minimum_order} {product.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No products listed yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Map Placeholder & Location */}
        <div className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Map Placeholder */}
              <div className="h-48 rounded-lg bg-muted/50 flex items-center justify-center mb-4 border border-dashed">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Map integration coming soon
                  </p>
                </div>
              </div>

              <Separator className="mb-4" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area</span>
                  <span className="font-medium">{supplier.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market</span>
                  <span className="font-medium">{supplier.market}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latitude</span>
                  <span className="font-mono text-xs">{supplier.latitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longitude</span>
                  <span className="font-mono text-xs">{supplier.longitude.toFixed(6)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
