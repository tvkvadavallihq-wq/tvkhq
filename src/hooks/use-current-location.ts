"use client";

import { useState } from "react";

export function useCurrentLocation() {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = () =>
    new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setLocationError("உங்கள் சாதனத்தில் GPS கிடைக்கவில்லை");
        resolve(null);
        return;
      }

      setIsLocating(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setIsLocating(false);
          setLocationError(error.message || "GPS பெற முடியவில்லை");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
      );
    });

  return {
    isLocating,
    locationError,
    requestLocation,
  };
}
