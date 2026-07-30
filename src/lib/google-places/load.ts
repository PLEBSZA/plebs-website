const SCRIPT_ID = "plebs-google-maps";

declare global {
  interface Window {
    google?: typeof google;
  }
}

let loadPromise: Promise<typeof google.maps> | null = null;

export function getGoogleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
}

export function loadGoogleMaps(): Promise<typeof google.maps | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google!.maps), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Maps failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places&loading=async`;
    script.onload = () => {
      if (!window.google?.maps) {
        reject(new Error("Google Maps loaded without maps namespace."));
        return;
      }
      resolve(window.google.maps);
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Google Maps failed to load."));
    };
    document.head.appendChild(script);
  });

  return loadPromise.catch((error) => {
    loadPromise = null;
    console.warn(error);
    return null;
  });
}
