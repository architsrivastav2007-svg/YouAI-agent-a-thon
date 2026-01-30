# Google Maps Integration for SOS Location Preview

This document explains how to set up and use the Google Maps preview feature for SOS location notifications.

## Overview

The map preview feature displays the user's exact location on an interactive Google Map when they send an SOS alert. This helps trusted contacts quickly identify where help is needed.

**Features:**
- Interactive Google Maps with marker at user location
- Accuracy circle showing GPS precision
- Info window with coordinates and accuracy
- Automatic fallback to Google Maps link if map fails to load
- Expandable/collapsible view in notification panel

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Copy the generated API key
6. **Important:** Restrict your API key:
   - Click on the key name to edit it
   - Under **Application restrictions**, select **HTTP referrers**
   - Add your domains:
     - `localhost:3001` (for development)
     - Your production domain (e.g., `yourdomain.com`)
   - Under **API restrictions**, select **Restrict key**
   - Choose **Maps JavaScript API**
   - Click **Save**

### 2. Enable Required APIs

Make sure these APIs are enabled in your Google Cloud project:
1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Maps JavaScript API** (required)

### 3. Configure Environment Variable

1. Open `frontend/.env.local`
2. Add your API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   ```
3. Restart your Next.js development server

**Security Note:**
- The `.env.local` file is git-ignored to protect your API key
- Never commit API keys to version control
- Use different API keys for development and production
- Always restrict your API keys as described above

## Component Usage

### MapPreview Component

The `MapPreview` component is located at `frontend/src/components/MapPreview.tsx`.

**Props:**
```typescript
interface MapPreviewProps {
  latitude: number;           // Required: Latitude coordinate
  longitude: number;          // Required: Longitude coordinate
  accuracy?: number;          // Optional: GPS accuracy in meters
  className?: string;         // Optional: Additional CSS classes
  height?: string;            // Optional: Map height (default: "300px")
  showFallbackLink?: boolean; // Optional: Show Google Maps link (default: true)
}
```

**Example Usage:**
```tsx
import MapPreview from "@/components/MapPreview";

function MyComponent() {
  return (
    <MapPreview
      latitude={37.7749}
      longitude={-122.4194}
      accuracy={25}
      height="400px"
      showFallbackLink={true}
    />
  );
}
```

### Integration in NotificationPanel

The map is automatically integrated into SOS notifications:

1. **SOS** notifications with location data show a "Show Map" button
2. Clicking the button expands an interactive map preview
3. The map displays:
   - User's exact location with a marker
   - Accuracy circle (if GPS accuracy is available)
   - Info window with coordinates on marker click
   - External link to open in full Google Maps

**Supported notification types with map preview:**
- `SOS` - Manual SOS alert
- `AUTO_SOS` - Automatic SOS after 30-minute timeout
- `LOCATION_SHARED` - When trusted contact shares their location

## Error Handling

The component handles errors gracefully:

### 1. Missing API Key
If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not set:
- Shows error message: "Unable to load map - Google Maps API key not configured"
- Displays fallback button to open Google Maps in browser

### 2. Map Load Failure
If Google Maps script fails to load:
- Shows error message: "Unable to load map - Failed to initialize Google Maps"
- Displays fallback button to open Google Maps in browser

### 3. Network Issues
- Component shows loading spinner while initializing
- Times out gracefully if network is slow
- Always provides fallback Google Maps link

## Troubleshooting

### Map not showing?

**Check these common issues:**

1. **API Key not set**
   - Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is in `.env.local`
   - Restart Next.js dev server after adding the key

2. **Maps JavaScript API not enabled**
   - Go to Google Cloud Console → APIs & Services → Library
   - Search "Maps JavaScript API" and click Enable

3. **API Key restrictions too strict**
   - Check your API key restrictions in Google Cloud Console
   - Make sure `localhost:3001` is allowed under HTTP referrers

4. **Browser console errors**
   - Open browser DevTools → Console
   - Look for `[MAP-PREVIEW]` log messages
   - Common errors:
     - "ApiNotActivatedMapError" → Enable Maps JavaScript API
     - "RefererNotAllowedMapError" → Update API key restrictions
     - "InvalidKeyMapError" → Check your API key is correct

### Map is slow to load?

- Google Maps script is loaded once and cached
- First map may take 2-3 seconds to appear
- Subsequent maps load instantly
- Loading spinner shows while initializing

### Want to test without API key?

The component will gracefully fall back to a Google Maps link if:
- No API key is configured
- Maps fails to load

This ensures users can always access location data, even if maps aren't working.

## Cost Considerations

**Google Maps Pricing:**
- Maps JavaScript API has a free tier: **$200 credit/month**
- Each map load costs ~$0.007
- With $200 credit, you get ~28,000 free map loads per month
- After that, you pay per use

**To minimize costs:**
1. Use API key restrictions to prevent abuse
2. Only show maps for SOS notifications (not all location data)
3. Consider implementing map caching for repeated views
4. Monitor usage in Google Cloud Console

**For high-volume apps:**
- Consider upgrading to a paid Google Maps Platform plan
- Implement server-side API key protection
- Use static map images for thumbnails (cheaper than interactive maps)

## Files

**Component files:**
- `frontend/src/components/MapPreview.tsx` - Map component
- `frontend/src/components/NotificationPanel.tsx` - Integration with notifications

**Configuration:**
- `frontend/.env.local` - API key (git-ignored)
- `frontend/.env.example` - Example configuration

**Documentation:**
- `GOOGLE_MAPS_SETUP.md` - This file

## Next Steps

Once maps are working, consider:

1. **Offline support**: Cache last known location
2. **Multiple markers**: Show both user and trusted contact locations
3. **Route planning**: Add directions from trusted contact to user
4. **Live tracking**: Update location in real-time during active SOS
5. **Static map images**: Generate server-side thumbnails for email notifications

## Support

For Google Maps API issues:
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Maps Platform Support](https://developers.google.com/maps/support)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
