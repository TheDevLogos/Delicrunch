// Polyfill to make EventTarget dispatch safer in React Native/Expo
// Wraps EventTarget.prototype.dispatchEvent to catch listener errors
(function () {
  try {
    const ET = global.EventTarget || (typeof window !== 'undefined' && window.EventTarget);
    if (!ET || !ET.prototype) return;

    const proto = ET.prototype;
    if (proto.__dispatchEventSafe) return; // already patched

    const original = proto.dispatchEvent;
    proto.dispatchEvent = function (event) {
      try {
        return original.call(this, event);
      } catch (err) {
        // Log minimally to avoid noisy Metro connection errors
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('[EventTargetSafe] listener error:', err && err.message ? err.message : err);
        }
        // Swallow the error to avoid bubbling to global error handlers
        return true;
      }
    };
    proto.__dispatchEventSafe = true;
  } catch (e) {
    // Best-effort; don't crash startup
    try {
      console.warn('[EventTargetSafe] could not apply patch', e && e.message ? e.message : e);
    } catch (_) {}
  }
})();
