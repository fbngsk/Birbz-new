import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Check, Loader2 } from 'lucide-react';

// ============================================
// LOCATION SHARE MODAL
// Asks user where they saw the bird
// ============================================

interface LocationShareModalProps {
  birdName: string;
  hasGPS: boolean;
  onShareCurrentLocation: () => void;
  onShareCustomLocation: (lat: number, lng: number) => void;
  onSkip: () => void;
  onClose: () => void;
}

export const LocationShareModal: React.FC<LocationShareModalProps> = ({ 
  birdName,
  hasGPS,
  onShareCurrentLocation,
  onShareCustomLocation,
  onSkip,
  onClose
}) => {
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  if (showMapPicker) {
    return (
      <LocationPickerModal
        birdName={birdName}
        onConfirm={(lat, lng) => {
          onShareCustomLocation(lat, lng);
        }}
        onBack={() => setShowMapPicker(false)}
        onClose={onClose}
      />
    );
  }
  
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal to-cyan-500 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin size={32} />
          </div>
          <h3 className="font-bold text-xl">Sichtung teilen?</h3>
          <p className="text-teal-100 text-sm mt-1">
            Hilf anderen, den <strong>{birdName}</strong> zu finden!
          </p>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600 text-center mb-4">
            Wo hast du den Vogel gesehen?
          </p>
          
          {/* Current Location Button */}
          {hasGPS && (
            <button
              onClick={onShareCurrentLocation}
              className="w-full py-4 bg-teal text-white rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-3"
            >
              <Navigation size={20} />
              Aktueller Standort
            </button>
          )}
          
          {/* Pick on Map Button */}
          <button
            onClick={() => setShowMapPicker(true)}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
          >
            <MapPin size={20} />
            Anderen Ort wählen
          </button>
          
          {/* Skip Button */}
          <button
            onClick={onSkip}
            className="w-full py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Nicht teilen
          </button>
          
          <p className="text-[10px] text-gray-400 text-center pt-2">
            Dein Standort wird auf ~200m gerundet. Dein Name bleibt anonym.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LOCATION PICKER MODAL
// Map where user can set a custom pin
// ============================================

interface LocationPickerModalProps {
  birdName: string;
  onConfirm: (lat: number, lng: number) => void;
  onBack: () => void;
  onClose: () => void;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  birdName,
  onConfirm,
  onBack,
  onClose
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Default center (Germany)
  const defaultCenter = { lat: 51.1657, lng: 10.4515 };
  
  // Load Leaflet
  useEffect(() => {
    if ((window as any).L) {
      setMapReady(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Initialize map
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapRef.current) return;

    const L = (window as any).L;
    
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([defaultCenter.lat, defaultCenter.lng], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    
    // Try to get user's location for initial view
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.setView([position.coords.latitude, position.coords.longitude], 13);
        },
        () => {
          // Ignore error, keep default view
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
    
    // Handle map clicks
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      setSelectedLocation({ lat, lng });
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-pin',
          html: `<div style="
            width: 36px;
            height: 36px;
            background: #14B8A6;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          ">🐦</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }
    });

    mapRef.current = map;
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapReady]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-cream animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
        >
          ← Zurück
        </button>
        <div className="text-center">
          <h2 className="font-bold text-teal">Ort wählen</h2>
          <p className="text-xs text-gray-400">Tippe auf die Karte</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0" />
        
        {!mapReady && (
          <div className="absolute inset-0 bg-white flex items-center justify-center">
            <Loader2 className="animate-spin text-teal" size={32} />
          </div>
        )}
        
        {/* Hint overlay */}
        {mapReady && !selectedLocation && (
          <div className="absolute top-4 left-4 right-4 z-[500] bg-white/95 rounded-xl p-3 shadow-lg text-center">
            <p className="text-sm text-gray-700">
              <strong>Tippe auf die Karte</strong> um den Fundort zu markieren
            </p>
          </div>
        )}
      </div>
      
      {/* Confirm Button */}
      <div className="bg-white border-t border-gray-200 p-4 shrink-0">
        <button
          onClick={() => selectedLocation && onConfirm(selectedLocation.lat, selectedLocation.lng)}
          disabled={!selectedLocation}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
            selectedLocation 
              ? 'bg-teal text-white hover:bg-teal-700' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Check size={20} />
          Standort bestätigen
        </button>
      </div>
    </div>
  );
};

// ============================================
// UNUSUAL SIGHTING WARNING MODAL
// ============================================

interface UnusualSightingModalProps {
  birdName: string;
  reason: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UnusualSightingModal: React.FC<UnusualSightingModalProps> = ({
  birdName,
  reason,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="font-bold text-xl">Ungewöhnliche Sichtung</h3>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-700">
              Du möchtest einen <strong className="text-orange-600">{birdName}</strong> an diesem Standort loggen.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {reason}
            </p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm text-orange-800">
              <strong>Bist du sicher?</strong><br/>
              Falls ja, wird die Sichtung zur Überprüfung markiert.
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
            >
              Ja, wirklich!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
