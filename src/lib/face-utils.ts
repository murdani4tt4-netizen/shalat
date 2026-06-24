import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export async function loadFaceModels(): Promise<boolean> {
  if (modelsLoaded) return true;

  try {
    const MODEL_URL = '/models';

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log('Face-api models loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to load face-api models:', error);
    modelsLoaded = false;
    return false;
  }
}

export async function detectFace(
  videoOrCanvas: HTMLVideoElement | HTMLCanvasElement
): Promise<{ descriptor: Float32Array; detection: faceapi.FaceDetection } | null> {
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5,
  });

  const detection = await faceapi
    .detectSingleFace(videoOrCanvas, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  return {
    descriptor: detection.descriptor,
    detection: detection.detection,
  };
}

export function compareFaces(
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[],
  threshold: number = 0.6
): { matched: boolean; distance: number; confidence: number } {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);

  // Euclidean distance
  let distance = 0;
  for (let i = 0; i < d1.length; i++) {
    const diff = d1[i] - d2[i];
    distance += diff * diff;
  }
  distance = Math.sqrt(distance);

  // Convert distance to confidence (0-100%)
  // Typical distances: 0 (identical) to 1.0+ (different)
  const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

  return {
    matched: distance < threshold,
    distance: parseFloat(distance.toFixed(4)),
    confidence: parseFloat(confidence.toFixed(1)),
  };
}

export function drawFaceDetection(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  detection: faceapi.FaceDetection
): void {
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  const resized = faceapi.resizeResults(detection, displaySize);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw detection box
  const box = resized.box;
  ctx.strokeStyle = '#10b981'; // emerald
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  // Draw corner accents
  const cornerLength = 20;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#059669';

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + cornerLength);
  ctx.lineTo(box.x, box.y);
  ctx.lineTo(box.x + cornerLength, box.y);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(box.x + box.width - cornerLength, box.y);
  ctx.lineTo(box.x + box.width, box.y);
  ctx.lineTo(box.x + box.width, box.y + cornerLength);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + box.height - cornerLength);
  ctx.lineTo(box.x, box.y + box.height);
  ctx.lineTo(box.x + cornerLength, box.y + box.height);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
  ctx.lineTo(box.x + box.width, box.y + box.height);
  ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
  ctx.stroke();
}

export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

export function arrayToDescriptor(arr: number[]): Float32Array {
  return new Float32Array(arr);
}
