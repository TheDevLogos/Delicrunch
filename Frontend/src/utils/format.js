export const formatPrice = (value, decimals = 2) => {
  const n = Number(value);
  if (!isFinite(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

export const formatNumber = (value, decimals = 0) => {
  const n = Number(value);
  if (!isFinite(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
};

export default { formatPrice, formatNumber };
