// src/lib/device.ts
export function getDeviceId() {
  if (typeof window === "undefined") return "server";
  const key = "mannaka_device_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}
