/**
 * Map Preview Component
 * 
 * Shows a Google Maps preview with a marker at the specified location
 * Falls back to Google Maps link if the map fails to load
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ExternalLink, AlertCircle } from "lucide-react";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  className?: string;
  height?: string;
  showFallbackLink?: boolean;
}

export default function MapPreview({
  latitude,
  longitude,
  accuracy,
  className = "",
  height = "300px",
  showFallbackLink = true,
}: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Google Maps URL for fallback
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log('[MAP-PREVIEW] Initializing map...');
    console.log('[MAP-PREVIEW] API Key present:', !!apiKey);
    console.log('[MAP-PREVIEW] Location:', { latitude, longitude, accuracy });

    // Check if API key is available
    if (!apiKey) {
      console.error('[MAP-PREVIEW] ❌ Google Maps API key not found');
      setMapError(true);
      setIsLoading(false);
      return;
    }

    // Load Google Maps script if not already loaded
    const loadGoogleMaps = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if already loaded
        if (window.google && window.google.maps) {
          console.log('[MAP-PREVIEW] Google Maps already loaded');
          resolve();
          return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector(
          `script[src*="maps.googleapis.com"]`
        );
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Script load failed')));
          return;
        }

        // Load the script
        console.log('[MAP-PREVIEW] Loading Google Maps script...');
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          console.log('[MAP-PREVIEW] ✅ Google Maps script loaded');
          resolve();
        };

        script.onerror = () => {
          console.error('[MAP-PREVIEW] ❌ Failed to load Google Maps script');
          reject(new Error('Failed to load Google Maps'));
        };

        document.head.appendChild(script);
      });
    };

    // Initialize the map
    const initializeMap = async () => {
      try {
        await loadGoogleMaps();

        if (!mapRef.current) {
          console.error('[MAP-PREVIEW] Map container ref not found');
          return;
        }

        console.log('[MAP-PREVIEW] Creating map instance...');

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: accuracy && accuracy > 100 ? 14 : 16, // Zoom out if accuracy is low
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Add marker
        const marker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: map,
          title: 'User Location',
          animation: google.maps.Animation.DROP,
        });

        // Add accuracy circle if available
        if (accuracy) {
          new google.maps.Circle({
            map: map,
            center: { lat: latitude, lng: longitude },
            radius: accuracy,
            fillColor: '#4285F4',
            fillOpacity: 0.15,
            strokeColor: '#4285F4',
            strokeOpacity: 0.5,
            strokeWeight: 1,
          });
        }

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">User Location</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">
                Lat: ${latitude.toFixed(6)}<br/>
                Lng: ${longitude.toFixed(6)}
                ${accuracy ? `<br/>Accuracy: ±${accuracy.toFixed(0)}m` : ''}
              </p>
            </div>
          `,
        });

        // Show info window on marker click
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        console.log('[MAP-PREVIEW] ✅ Map initialized successfully');
        setIsLoading(false);
        setMapError(false);
      } catch (error) {
        console.error('[MAP-PREVIEW] ❌ Error initializing map:', error);
        setMapError(true);
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [latitude, longitude, accuracy]);

  // Show error state
  if (mapError) {
    return (
      <div className={`${className}`}>
        <div
          style={{ height }}
          className="relative flex flex-col items-center justify-center bg-red-50 border-2 border-red-200 rounded-lg p-6"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-sm font-medium text-red-700 mb-2">
            Unable to load map
          </p>
          <p className="text-xs text-red-600 mb-4 text-center max-w-xs">
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              ? 'Google Maps API key not configured'
              : 'Failed to initialize Google Maps'}
          </p>
          
          {showFallbackLink && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Open in Google Maps
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-gray-200"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{ height }}
          className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Fallback Link */}
      {showFallbackLink && !isLoading && (
        <div className="mt-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            Open in Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

// Type declaration for Google Maps
declare global {
  interface Window {
    google: any;
  }
}
