import { Platform } from 'react-native';

const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920;

const getImageMetadata = (asset) => {
  const mimeType = String(asset?.mimeType || asset?.file?.type || '').toLowerCase();
  const uriName = asset?.fileName || asset?.uri?.split('/').pop()?.split('?')[0] || '';
  const ext = uriName.includes('.') ? uriName.split('.').pop().toLowerCase() : '';
  const normalizedMime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
  const inferredMime = normalizedMime || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] || 'image/jpeg');

  if (!MIME_TYPES.has(inferredMime)) {
    throw new Error('Formato no compatible. Elige una foto JPG, PNG o WebP.');
  }

  const extension = inferredMime === 'image/jpeg' ? 'jpg' : inferredMime.split('/')[1];
  return { mimeType: inferredMime, extension };
};

export const appendImageToFormData = async (formData, fieldName, asset, baseName) => {
  if (!asset?.uri) throw new Error('No se pudo leer la imagen seleccionada.');
  const { mimeType, extension } = getImageMetadata(asset);

  if (Platform.OS === 'web') {
    let file = asset.file;
    if (typeof Blob === 'undefined' || !(file instanceof Blob)) {
      const response = await fetch(asset.uri);
      if (!response.ok) throw new Error('No se pudo preparar la imagen seleccionada.');
      file = await response.blob();
    }

    file = await optimizeWebImage(file, mimeType);
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('La imagen supera 5 MB incluso después de optimizarla. Elige una imagen más pequeña.');
    }
    const outputMime = file.type || mimeType;
    const outputExtension = outputMime === 'image/png' ? 'png' : outputMime === 'image/webp' ? 'webp' : 'jpg';
    formData.append(fieldName, file, `${baseName}_${Date.now()}.${outputExtension}`);
    return;
  }

  const size = Number(asset.fileSize || asset.file?.size || 0);
  if (size > MAX_IMAGE_SIZE) {
    throw new Error('La imagen supera 5 MB. Elige una versión más pequeña.');
  }
  formData.append(fieldName, {
    uri: asset.uri,
    name: `${baseName}_${Date.now()}.${extension}`,
    type: mimeType,
  });
};

const optimizeWebImage = async (file, sourceMime) => {
  if (typeof document === 'undefined') return file;

  let bitmap;
  let imageUrl;
  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file);
    } else {
      imageUrl = URL.createObjectURL(file);
      bitmap = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
        image.src = imageUrl;
      });
    }

    const width = bitmap.width || bitmap.naturalWidth;
    const height = bitmap.height || bitmap.naturalHeight;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
    const outputMime = sourceMime === 'image/png' ? 'image/png' : 'image/jpeg';
    if (scale === 1 && outputMime === file.type && file.size <= MAX_IMAGE_SIZE) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let optimized = await canvasToBlob(canvas, outputMime, outputMime === 'image/jpeg' ? 0.88 : undefined);
    if (optimized.size > MAX_IMAGE_SIZE && outputMime === 'image/jpeg') {
      optimized = await canvasToBlob(canvas, outputMime, 0.8);
    }
    return optimized;
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }
};

const canvasToBlob = (canvas, mimeType, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('No se pudo optimizar la imagen.'));
  }, mimeType, quality);
});
