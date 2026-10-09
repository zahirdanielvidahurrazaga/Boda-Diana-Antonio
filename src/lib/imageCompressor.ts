const MAX_DIMENSION = 1280;
const QUALITY = 0.82;

export interface CompressResult {
  file: File;
  width: number;
  height: number;
}

export async function compressImage(file: File): Promise<CompressResult> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      if (file.size < 500 * 1024) {
        resolve({ file, width, height });
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) { resolve({ file, width, height }); return; }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve({ file, width, height });
            return;
          }
          resolve({
            file: new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }),
            width,
            height,
          });
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ file, width: 3, height: 4 });
    };

    img.src = objectUrl;
  });
}
