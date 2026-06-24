"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { loadFaceModels, detectFace, descriptorToArray } from "@/lib/face-utils";
import { toast } from "sonner";
import { Camera, XCircle, CheckCircle, Loader2, RotateCcw } from "lucide-react";

interface FaceRegisterProps {
  onCapture: (descriptor: number[]) => void;
  onCancel: () => void;
}

type RegisterState = "loading" | "ready" | "capturing" | "success";

export default function FaceRegister({ onCapture, onCancel }: FaceRegisterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<RegisterState>("loading");
  const [error, setError] = useState("");
  const [captured, setCaptured] = useState(0);
  const [descriptors, setDescriptors] = useState<number[][]>([]);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const loaded = await loadFaceModels();
      if (!mounted) return;
      if (!loaded) {
        setError("Gagal memuat model");
        setState("ready");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (mounted) setState("ready");
      } catch {
        setError("Tidak dapat mengakses kamera");
        setState("ready");
      }
    };
    init();
    return () => { mounted = false; stopCamera(); };
  }, [stopCamera]);

  const captureFace = async () => {
    if (!videoRef.current) return;
    setState("capturing");

    try {
      const result = await detectFace(videoRef.current);
      if (!result) {
        toast.warning("Wajah tidak terdeteksi. Pastikan pencahayaan cukup.");
        setState("ready");
        return;
      }

      const desc = descriptorToArray(result.descriptor);
      const newDescriptors = [...descriptors, desc];
      setDescriptors(newDescriptors);
      setCaptured((c) => c + 1);

      toast.success(`Foto ${newDescriptors.length}/3 berhasil diambil`);

      if (newDescriptors.length >= 3) {
        // Average the descriptors for better accuracy
        const avg = new Array(128).fill(0);
        newDescriptors.forEach((d) => {
          d.forEach((v, i) => { avg[i] += v; });
        });
        const averaged = avg.map((v) => v / newDescriptors.length);

        stopCamera();
        setState("success");
        onCapture(averaged);
      } else {
        setState("ready");
      }
    } catch {
      toast.error("Gagal mendeteksi wajah");
      setState("ready");
    }
  };

  return (
    <div className="w-full space-y-3">
      {state !== "success" && (
        <div className="relative mx-auto w-full aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {state === "capturing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-24 h-24 rounded-full border-4 border-emerald-400 animate-ping opacity-30" />
              <Loader2 className="absolute w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      )}

      {state === "loading" && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">Memuat model AI...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 rounded-lg">
          <XCircle className="w-4 h-4" />{error}
        </div>
      )}

      {state === "success" && (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <p className="font-medium text-emerald-700">Wajah berhasil didaftarkan!</p>
          <p className="text-xs text-muted-foreground mt-1">3 foto telah diambil dan diproses</p>
        </div>
      )}

      {state === "ready" && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm ${i < captured ? "bg-emerald-100 border-emerald-400 text-emerald-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}
              >
                {i < captured ? "✓" : i + 1}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-2">{captured}/3 foto</span>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Hadapkan wajah ke kamera lalu klik &quot;Ambil Foto&quot;. Ambil 3 foto dari sudut berbeda.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white" onClick={captureFace}>
              <Camera className="w-4 h-4 mr-2" />Ambil Foto ({3 - captured} lagi)
            </Button>
            <Button variant="outline" onClick={() => { stopCamera(); onCancel(); }}>Batal</Button>
          </div>
        </div>
      )}
    </div>
  );
}
