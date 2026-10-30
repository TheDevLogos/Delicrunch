const listeners = new Set();

export const emitNewOrder = () => listeners.forEach(listener => listener());

export const subscribeNewOrders = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
