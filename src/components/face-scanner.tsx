"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { loadFaceModels, detectFace, compareFaces, drawFaceDetection } from "@/lib/face-utils";
import { toast } from "sonner";
import { Camera, XCircle, CheckCircle, Loader2, RotateCcw } from "lucide-react";

interface FaceScannerProps {
  studentName: string;
  faceDescriptor: number[] | null;
  onVerified: (confidence: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

type ScanState = "loading" | "ready" | "scanning" | "matched" | "failed";

export default function FaceScanner({ studentName, faceDescriptor, onVerified, onCancel, loading }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ScanState>("loading");
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string>("");
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

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
      setState("failed");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const loaded = await loadFaceModels();
      if (!mounted) return;

      if (!loaded) {
        setError("Gagal memuat model pengenalan wajah");
        setState("failed");
        return;
      }

      await startCamera();
      if (mounted) setState("ready");
    };

    init();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const startScan = useCallback(() => {
    if (!faceDescriptor) {
      toast.error("Data wajah tidak tersedia");
      return;
    }

    setState("scanning");
    let attempts = 0;
    const maxAttempts = 20;

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || attempts >= maxAttempts) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        if (attempts >= maxAttempts && state === "scanning") {
          setState("ready");
          toast.warning("Wajah tidak terdeteksi. Coba lagi.");
        }
        return;
      }

      attempts++;

      try {
        const result = await detectFace(videoRef.current);
        if (!result) return;

        drawFaceDetection(canvasRef.current, videoRef.current, result.detection);

        const comparison = compareFaces(result.descriptor, faceDescriptor, 0.6);
        setConfidence(comparison.confidence);

        if (comparison.matched) {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          setState("matched");
          toast.success(`Wajah terverifikasi! Akurasi: ${comparison.confidence}%`);
          setTimeout(() => {
            onVerified(comparison.confidence);
          }, 1500);
        }
      } catch {}
    }, 300);
  }, [faceDescriptor, onVerified, state]);

  const handleRetry = () => {
    setConfidence(0);
    setState("ready");
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleClose = () => {
    stopCamera();
    onCancel();
  };

  const getStateContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
            <p className="text-sm font-medium">Memuat model pengenalan wajah...</p>
            <p className="text-xs text-muted-foreground mt-1">Ini mungkin memakan waktu beberapa detik</p>
          </div>
        );

      case "failed":
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <XCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-sm font-medium text-red-600">{error || "Terjadi kesalahan"}</p>
            <Button variant="outline" className="mt-4" onClick={handleRetry}>
              <RotateCcw className="w-4 h-4 mr-2" />Coba Lagi
            </Button>
          </div>
        );

      case "ready":
      case "scanning":
        return (
          <div>
            <div className="relative mx-auto w-full aspect-[4/3] bg-gray-900 rounded-t-xl overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
              {state === "scanning" && (
                <div className="absolute inset-0 border-4 border-emerald-400 rounded-t-xl scan-animation pointer-events-none" />
              )}
              {state === "scanning" && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Mendeteksi wajah... {confidence > 0 && `(${confidence}%)`}
                </div>
              )}
            </div>
            <div className="p-4 bg-white rounded-b-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{studentName}</p>
                  <p className="text-xs text-muted-foreground">Hadapkan wajah ke kamera</p>
                </div>
                {confidence > 0 && state === "scanning" && (
                  <div className={`text-sm font-bold ${confidence > 50 ? "text-emerald-600" : "text-amber-600"}`}>
                    {confidence}%
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {state === "ready" && (
                  <Button className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white" onClick={startScan}>
                    <Camera className="w-4 h-4 mr-2" />Mulai Scan
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Batal
                </Button>
              </div>
            </div>
          </div>
        );

      case "matched":
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center pulse-ring">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-emerald-700 mt-6">Terverifikasi!</h3>
            <p className="text-sm text-muted-foreground mt-1">{studentName}</p>
            <p className="text-3xl font-bold text-emerald-600 mt-3">{confidence}%</p>
            <p className="text-xs text-muted-foreground">Akurasi kecocokan wajah</p>
            {loading && (
              <div className="flex items-center gap-2 mt-4 text-emerald-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Menyimpan absensi...</span>
              </div>
            )}
          </div>
        );
    }
  };

  return <div className="w-full">{getStateContent()}</div>;
}
