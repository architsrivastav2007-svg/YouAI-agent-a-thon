/**
 * SOS Button Component
 * 
 * Manual Emergency SOS button that:
 * 1. Gets user's current location via browser geolocation
 * 2. Sends POST request to /api/sos/manual
 * 3. Shows clear success/error feedback
 */

"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AlertTriangle, MapPin, Loader2 } from "lucide-react";

interface SOSButtonProps {
  userEmail?: string;
  className?: string;
}

export default function SOSButton({ userEmail, className = "" }: SOSButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  /**
   * Get user's current location using browser geolocation API
   */
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      console.log("[SOS] Requesting geolocation permission...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log("[SOS] Location obtained:", location);
          resolve(location);
        },
        (error) => {
          console.error("[SOS] Geolocation error:", error);
          let errorMessage = "Failed to get location";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true, // Use GPS if available
          timeout: 10000, // 10 second timeout
          maximumAge: 0, // Don't use cached position
        }
      );
    });
  };

  /**
   * Handle SOS button click
   * Gets location and sends to backend
   */
  const handleSOSClick = async () => {
    console.log("[SOS] ========== SOS BUTTON CLICKED ==========");
    
    // Reset previous errors
    setLocationError(null);

    // Check if user email is available
    if (!userEmail) {
      console.error("[SOS] No user email provided");
      toast.error("Cannot send SOS: User email not available");
      return;
    }

    console.log("[SOS] User email:", userEmail);

    // Start loading state
    setIsLoading(true);
    toast.loading("Getting your location...", { id: "sos-loading" });

    try {
      // Step 1: Get current location
      console.log("[SOS] Step 1: Getting current location...");
      const { latitude, longitude } = await getCurrentLocation();
      
      toast.loading("Sending SOS alert...", { id: "sos-loading" });

      // Step 2: Send SOS to backend
      console.log("[SOS] Step 2: Sending POST request to /api/sos/manual");
      console.log("[SOS] Request data:", { userEmail, latitude, longitude });

      const response = await api.post("/api/sos/manual", {
        userEmail,
        latitude,
        longitude,
      });

      console.log("[SOS] ✅ API Response:", response.data);

      // Step 3: Show success feedback
      toast.dismiss("sos-loading");
      toast.success(
        "🚨 SOS sent successfully! Your trusted contact has been notified.",
        {
          duration: 5000,
          icon: "✅",
        }
      );

      console.log("[SOS] ✅ SOS sent successfully");
      console.log("[SOS] Sent to:", response.data.data?.sentTo);
      console.log("[SOS] Location:", response.data.data?.location);

    } catch (error: any) {
      console.error("[SOS] ❌ Error:", error);
      
      toast.dismiss("sos-loading");

      // Handle different error types
      if (error.message.includes("Location")) {
        // Geolocation error
        setLocationError(error.message);
        toast.error(error.message, { duration: 5000 });
      } else if (error.response) {
        // API error
        const errorMsg = error.response.data?.message || "Failed to send SOS alert";
        console.error("[SOS] API Error:", error.response.data);
        toast.error(errorMsg, { duration: 5000 });
      } else {
        // Network or unknown error
        toast.error("Network error. Please check your connection.", {
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* SOS Button */}
      <button
        onClick={handleSOSClick}
        disabled={isLoading}
        className={`
          relative group
          bg-gradient-to-r from-red-600 to-red-700
          hover:from-red-700 hover:to-red-800
          text-white font-bold
          px-8 py-4 rounded-full
          shadow-lg hover:shadow-2xl
          transform hover:scale-105
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:transform-none
          flex items-center gap-3
          ${isLoading ? "cursor-wait" : "cursor-pointer"}
        `}
        aria-label="Emergency SOS"
      >
        {/* Pulsing animation when not loading */}
        {!isLoading && (
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping"></span>
        )}

        <span className="relative z-10 flex items-center gap-3">
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg">Sending SOS...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-6 h-6" />
              <span className="text-lg">Emergency SOS</span>
            </>
          )}
        </span>
      </button>

      {/* Info text */}
      <p className="text-sm text-gray-500 text-center max-w-xs">
        <MapPin className="w-4 h-4 inline mr-1" />
        Sends your location to your trusted contact
      </p>

      {/* Location error message */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
          <p className="text-sm text-red-700">{locationError}</p>
          <p className="text-xs text-red-600 mt-1">
            Please enable location permissions in your browser settings
          </p>
        </div>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <details className="text-xs text-gray-400 mt-2">
          <summary className="cursor-pointer">Debug Info</summary>
          <div className="mt-2 p-2 bg-gray-50 rounded">
            <p>User Email: {userEmail || "Not set"}</p>
            <p>Geolocation: {navigator.geolocation ? "Supported" : "Not supported"}</p>
            <p>Status: {isLoading ? "Loading" : "Ready"}</p>
          </div>
        </details>
      )}
    </div>
  );
}
