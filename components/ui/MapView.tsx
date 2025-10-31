import React, { useEffect, useRef } from 'react';

// Declare Leaflet's global 'L' object to satisfy TypeScript
declare const L: any;

interface MapItem {
  lat?: number;
  lng?: number;
  name: string;
}

interface MapViewProps {
  items: MapItem[];
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({ items, className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // To hold the Leaflet map instance

  const validItems = items.filter(item => typeof item.lat === 'number' && typeof item.lng === 'number');

  useEffect(() => {
    if (!mapRef.current || typeof L === 'undefined') return;

    // Initialize map only once
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        scrollWheelZoom: false, // More user-friendly for embedded maps
      }).setView([50.8503, 4.3517], 8); // Default view (Brussels)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
    }
    
    const map = mapInstance.current;
    
    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    if (validItems.length > 0) {
      const markers = validItems.map(item => {
        const marker = L.marker([item.lat!, item.lng!]);
        marker.bindPopup(`<b>${item.name}</b><br/><a href="https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>`);
        return marker;
      });

      const featureGroup = L.featureGroup(markers).addTo(map);
      
      // Check if the bounds are valid before fitting
      if (featureGroup.getBounds().isValid()) {
        map.fitBounds(featureGroup.getBounds(), { padding: [40, 40], maxZoom: 15 });
      }
    } else {
        // If no items, reset to default view
        map.setView([50.8503, 4.3517], 7);
    }

    // Invalidate size to ensure map tiles render correctly after modal open etc.
    setTimeout(() => map.invalidateSize(), 100);

  }, [items]); // Rerun when items prop changes to ensure map updates

  return (
    <div className={`relative block rounded-lg overflow-hidden group ${className}`}>
      <div ref={mapRef} className="h-full w-full z-0" />
      {validItems.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background/50 p-4 text-center z-10 pointer-events-none">
            Geen locaties met coördinaten gevonden om op de kaart te tonen.
         </div>
      )}
    </div>
  );
};