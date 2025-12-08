import React, { useEffect, useState } from "react";
import { useDevRole } from "../contexts/DevRoleContext";
import { supabase } from "../config/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";

export default function DevModeSelector() {
  const { role, partnerId, setRole, setPartnerId } = useDevRole();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPartners() {
      try {
        const { data, error: queryError } = await supabase
          .from("partners")
          .select("id, name")
          .order("name");

        if (queryError) {
          console.warn("DevModeSelector partners error", queryError);
          setError("Could not load partners from database. You can still use Dev Mode with manual partner ID.");
          // Set some fallback partners for testing
          setPartners([
            { id: 1, name: "Demo Partner 1" },
            { id: 2, name: "Demo Partner 2" },
          ]);
        } else {
          setPartners(data || []);
        }
      } catch (err) {
        console.error("DevModeSelector error:", err);
        setError("Error loading partners. Using fallback list.");
        setPartners([
          { id: 1, name: "Demo Partner 1" },
          { id: 2, name: "Demo Partner 2" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadPartners();
  }, []);

  const handleContinue = () => {
    if (role === "partner" && !partnerId) {
      alert("Please select a partner when using Partner role.");
      return;
    }
    if (role === "unknown") {
      alert("Please select a role first.");
      return;
    }

    if (role === "superadmin" || role === "admin") {
      navigate("/Dashboard");
    } else if (role === "partner") {
      navigate("/PartnerHub");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading partners…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">SEF Partner Hub – Dev Mode</CardTitle>
          <CardDescription>
            Select a role and partner (for Partner mode) to simulate authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Select Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant={role === "superadmin" ? "default" : "outline"}
                size="lg"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  setRole("superadmin");
                  setPartnerId(null);
                }}
              >
                <span className="text-2xl">👑</span>
                <span className="font-semibold">Superadmin</span>
              </Button>
              <Button
                variant={role === "admin" ? "default" : "outline"}
                size="lg"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  setRole("admin");
                  setPartnerId(null);
                }}
              >
                <span className="text-2xl">🛡️</span>
                <span className="font-semibold">Admin</span>
              </Button>
              <Button
                variant={role === "partner" ? "default" : "outline"}
                size="lg"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  setRole("partner");
                }}
              >
                <span className="text-2xl">🤝</span>
                <span className="font-semibold">Partner</span>
              </Button>
            </div>
          </div>

          {role === "partner" && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Select Partner
              </label>
              <Select
                value={partnerId?.toString() || ""}
                onValueChange={(value) => setPartnerId(parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a partner..." />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id.toString()}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {role !== "unknown" && (
                <>
                  Selected: <strong>{role}</strong>
                  {role === "partner" && partnerId && (
                    <> • Partner ID: <strong>{partnerId}</strong></>
                  )}
                </>
              )}
            </div>
            <Button
              onClick={handleContinue}
              disabled={role === "unknown" || (role === "partner" && !partnerId)}
              size="lg"
            >
              Continue →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

