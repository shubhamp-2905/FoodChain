"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Building, MapPin, Calendar, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { supplierAccountService } from "@/services/supplier-account.service";
import OnboardSupplierModal from "@/components/suppliers/OnboardSupplierModal";
import type { UserProfile } from "@/types/auth";
import type { Supplier } from "@/types/supplier";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">
        {value || <span className="text-muted-foreground font-normal">—</span>}
      </p>
    </div>
  );
}

export default function SupplierProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  const loadProfile = async () => {
    const storedUser = authService.getUser();
    setUser(storedUser);

    if (storedUser?.supplier_profile_id) {
      try {
        const p = await supplierAccountService.getMyProfile();
        setProfile(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleOnboardSuccess = async () => {
    setLoading(true);
    await loadProfile();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
          Supplier Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your account and supplier business details.
        </p>
      </motion.div>

      {/* Account Details */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-foreground flex items-center justify-center text-2xl font-bold text-background">
                {user?.full_name?.[0]?.toUpperCase() || "S"}
              </div>
              <div>
                <h2 className="text-lg font-bold">{user?.full_name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge
                  variant="secondary"
                  className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border-0"
                >
                  Supplier Account
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Full Name" value={user?.full_name} />
              <Field label="Email Address" value={user?.email} />
              <Field label="Mobile Number" value={user?.mobile_number} />
              <Field label="Business Name" value={user?.business_name} />
              <Field label="Area" value={user?.area} />
              <Field label="City" value={user?.city} />
              <Field label="State" value={user?.state} />
              <Field
                label="Member Since"
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : null
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Supplier Business Profile */}
      {profile && (
        <motion.div variants={itemVariants}>
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building className="h-4 w-4" />
                Supplier Business Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Supplier Name" value={profile.supplier_name} />
                <Field label="Supplier ID" value={profile.supplier_id} />
                <Field label="Supplier Type" value={profile.supplier_type} />
                <Field label="Market" value={profile.market} />
                <Field label="Area" value={profile.area} />
                <Field
                  label="Coordinates"
                  value={`${profile.latitude.toFixed(4)}° N, ${profile.longitude.toFixed(4)}° E`}
                />
                <Field label="Delivery Radius" value={`${profile.delivery_radius_km} km`} />
                <Field
                  label="Avg. Delivery Time"
                  value={`${profile.average_delivery_time_min} minutes`}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-xl bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                    Rating
                  </p>
                  <p className="text-2xl font-black">
                    {profile.rating != null ? profile.rating.toFixed(1) : "Not rated"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.rating != null ? "out of 5.0" : "New supplier"}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                    Quality Score
                  </p>
                  <p className="text-2xl font-black">
                    {profile.quality_score != null ? profile.quality_score.toFixed(1) : "Not available"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.quality_score != null ? "out of 5.0" : "No orders yet"}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                    Reliability
                  </p>
                  <p className="text-2xl font-black">
                    {profile.reliability_score != null ? `${profile.reliability_score.toFixed(1)}%` : "Not available"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.reliability_score != null ? "on-time rate" : "No deliveries yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!loading && !profile && (
        <motion.div variants={itemVariants}>
          <Card className="border border-dashed border-border">
            <CardContent className="p-8 text-center">
              <Building className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-bold text-sm">No supplier profile linked</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Complete onboarding to link your business profile and start listing
                inventory for vendor recommendations.
              </p>
              <Button
                onClick={() => setShowOnboardModal(true)}
                className="mt-4 bg-foreground text-background hover:bg-foreground/90 gap-2 text-xs"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Complete Supplier Onboarding
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Onboard Supplier Modal */}
      <OnboardSupplierModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSuccess={handleOnboardSuccess}
      />
    </motion.div>
  );
}
