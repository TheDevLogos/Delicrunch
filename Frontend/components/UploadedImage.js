import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import api from '../services/api';

export const resolveImageUri = (uri) => {
  if (typeof uri !== 'string' || !uri.trim()) return null;
  const value = uri.trim();
  if (/^(https?:|data:|blob:|file:|content:)/i.test(value)) return value;
  if (value.startsWith('/')) {
    const baseUrl = String(api.defaults?.baseURL || '').replace(/\/?api\/?$/i, '');
    return baseUrl ? `${baseUrl}${value}` : value;
  }
  return value;
};

const UploadedImage = ({ uri, source, fallbackSource, resizeMode = 'cover', onError, ...props }) => {
  const resolvedUri = resolveImageUri(uri);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => setHasFailed(false), [resolvedUri]);

  const imageSource = hasFailed && fallbackSource
    ? fallbackSource
    : (source || (resolvedUri ? { uri: resolvedUri } : fallbackSource));

  if (!imageSource) return null;

  return (
    <Image
      {...props}
      source={imageSource}
      resizeMode={hasFailed || !resolvedUri ? 'contain' : resizeMode}
      onError={(event) => {
        setHasFailed(true);
        onError?.(event);
      }}
    />
  );
};

export default UploadedImage;
