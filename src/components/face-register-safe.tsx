"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface FaceRegisterSafeProps {
  onCapture: (descriptor: number[]) => void;
  onCancel: () => void;
}

export default function FaceRegisterSafe({ onCapture, onCancel }: FaceRegisterSafeProps) {
  const [FaceRegisterComponent, setFaceRegisterComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string>("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    import("@/components/face-register")
      .then((mod) => {
        if (mountedRef.current) {
          setFaceRegisterComponent(() => mod.default);
        }
      })
      .catch((err) => {
        console.error("Failed to load face register:", err);
        if (mountedRef.current) {
          setError("Fitur registrasi wajah tidak tersedia di browser ini.");
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <p className="text-sm font-medium text-gray-800">Registrasi Wajah Tidak Tersedia</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
        <Button variant="outline" className="mt-3" onClick={onCancel}>
          Kembali
        </Button>
      </div>
    );
  }

  if (!FaceRegisterComponent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium">Memuat kamera...</p>
      </div>
    );
  }

  return <FaceRegisterComponent onCapture={onCapture} onCancel={onCancel} />;
}