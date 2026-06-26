"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SupplierRecommendation } from "@/types/recommendation";

// Workaround for Leaflet marker icon rendering issues in React builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom colored markers
const vendorIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const bestSupplierIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const alternativeSupplierIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapComponentProps {
  vendorLat: number;
  vendorLon: number;
  bestSupplier: SupplierRecommendation | null;
  alternatives: SupplierRecommendation[];
  activeSupplierId: number | null;
  onSupplierSelect?: (supplier: SupplierRecommendation) => void;
}

// Sub-component to auto-fit zoom bounds for all markers
function AutoFitBounds({ markers }: { markers: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }, [markers, map]);
  
  return null;
}

// Sub-component to handle smooth flyTo panning to the active supplier marker
function ActiveSupplierPan({
  activeSupplierId,
  suppliers,
}: {
  activeSupplierId: number | null;
  suppliers: SupplierRecommendation[];
}) {
  const map = useMap();
  
  useEffect(() => {
    if (activeSupplierId === null) return;
    const active = suppliers.find((s) => s.id === activeSupplierId);
    if (active) {
      map.flyTo([active.latitude, active.longitude], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [activeSupplierId, suppliers, map]);
  
  return null;
}

export default function MapComponent({
  vendorLat,
  vendorLon,
  bestSupplier,
  alternatives,
  activeSupplierId,
  onSupplierSelect,
}: MapComponentProps) {
  const allSuppliers: SupplierRecommendation[] = [];
  if (bestSupplier) allSuppliers.push(bestSupplier);
  allSuppliers.push(...alternatives);

  // Generate bounds coordinates (Vendor + all suppliers)
  const markerPositions = [
    { lat: vendorLat, lng: vendorLon },
    ...allSuppliers.map((s) => ({ lat: s.latitude, lng: s.longitude })),
  ];

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 z-0">
      <MapContainer
        center={[vendorLat, vendorLon]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Vendor Marker */}
        <Marker position={[vendorLat, vendorLon]} icon={vendorIcon}>
          <Popup>
            <div className="font-semibold text-xs">Your Business Location</div>
          </Popup>
        </Marker>

        {/* Best Supplier Marker */}
        {bestSupplier && (
          <Marker
            position={[bestSupplier.latitude, bestSupplier.longitude]}
            icon={bestSupplierIcon}
            eventHandlers={{
              click: () => onSupplierSelect?.(bestSupplier),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-bold text-xs text-amber-600">★ Best Supplier</div>
                <div className="font-semibold text-xs">{bestSupplier.supplier_name}</div>
                <div className="text-[10px] text-muted-foreground">{bestSupplier.area}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Alternative Supplier Markers */}
        {alternatives.map((supplier) => (
          <Marker
            key={supplier.id}
            position={[supplier.latitude, supplier.longitude]}
            icon={alternativeSupplierIcon}
            eventHandlers={{
              click: () => onSupplierSelect?.(supplier),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-xs">{supplier.supplier_name}</div>
                <div className="text-[10px] text-muted-foreground">{supplier.area}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Behavior modifiers */}
        <AutoFitBounds markers={markerPositions} />
        <ActiveSupplierPan activeSupplierId={activeSupplierId} suppliers={allSuppliers} />
      </MapContainer>
    </div>
  );
}
