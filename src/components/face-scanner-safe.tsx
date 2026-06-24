"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, XCircle, Loader2, AlertTriangle } from "lucide-react";

interface FaceScannerSafeProps {
  studentName: string;
  faceDescriptor: number[] | null;
  onVerified: (confidence: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function FaceScannerSafe({ studentName, faceDescriptor, onVerified, onCancel, loading }: FaceScannerSafeProps) {
  const [FaceScannerComponent, setFaceScannerComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string>("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Dynamically import face-scanner with error handling
    import("@/components/face-scanner")
      .then((mod) => {
        if (mountedRef.current) {
          setFaceScannerComponent(() => mod.default);
        }
      })
      .catch((err) => {
        console.error("Failed to load face scanner:", err);
        if (mountedRef.current) {
          setError("Fitur scan wajah tidak tersedia. Gunakan absensi manual.");
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // If error loading the component, show fallback
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <p className="text-sm font-medium text-gray-800">Scan Wajah Tidak Tersedia</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs">
          {error}
        </p>
        <Button
          className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white"
          onClick={() => {
            // Skip face scan, go directly to verified with 0 confidence (manual override)
            onVerified(0);
          }}
        >
          Lanjutkan Tanpa Scan
        </Button>
        <Button variant="outline" className="mt-2" onClick={onCancel}>
          Batal
        </Button>
      </div>
    );
  }

  // Loading the face scanner component
  if (!FaceScannerComponent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-sm font-medium">Memuat scanner wajah...</p>
        <p className="text-xs text-muted-foreground mt-1">Mengunduh model pengenalan wajah</p>
      </div>
    );
  }

  // Render the actual face scanner
  return (
    <FaceScannerComponent
      studentName={studentName}
      faceDescriptor={faceDescriptor}
      onVerified={onVerified}
      onCancel={onCancel}
      loading={loading}
    />
  );
}