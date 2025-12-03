import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Filter, X, ChevronDown, Loader2, Navigation, RefreshCw, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Types
interface Sighting {
  id: string;
  bird_id: string;
  bird_name: string;
  bird_rarity: string;
  lat: number;
  lng: number;
  sighted_at: string;
}

interface ClusteredSighting {
  lat: number;
  lng: number;
  sightings: Sighting[];
  primaryRarity: string;
}

interface RadarMapProps {
  userLocation: { lat: number; lng: number } | null;
  onClose?: () => void;
}

// Rarity to color mapping
const getRarityColor = (rarity: string): string => {
  const r = rarity?.toLowerCase() || '';
  if (r.includes('legendär')) return '#EAB308';
  if (r.includes('selten') || r.includes('epic')) return '#A855F7';
  if (r.includes('gefährdet')) return '#EF4444';
  if (r.includes('urlaub')) return '#F97316';
  return '#14B8A6';
};

// Rarity priority (higher = more important)
const getRarityPriority = (rarity: string): number => {
  const r = rarity?.toLowerCase() || '';
  if (r.includes('legendär')) return 5;
  if (r.includes('gefährdet')) return 4;
  if (r.includes('selten') || r.includes('epic')) return 3;
  if (r.includes('urlaub')) return 2;
  return 1;
};

// Time filter options
const TIME_FILTERS = [
  { label: 'Heute', value: 1 },
  { label: '3 Tage', value: 3 },
  { label: '7 Tage', value: 7 },
];

// Cluster sightings by location (rounded to ~200m grid)
const clusterSightings = (sightings: Sighting[]): ClusteredSighting[] => {
  const clusters: Map<string, ClusteredSighting> = new Map();
  
  sightings.forEach(sighting => {
    // Round to ~200m grid (0.002 degrees ≈ 200m)
    const gridLat = Math.round(Number(sighting.lat) * 500) / 500;
    const gridLng = Math.round(Number(sighting.lng) * 500) / 500;
    const key = `${gridLat},${gridLng}`;
    
    if (clusters.has(key)) {
      const cluster = clusters.get(key)!;
      cluster.sightings.push(sighting);
      
      // Update primary rarity if this one is rarer
      if (getRarityPriority(sighting.bird_rarity) > getRarityPriority(cluster.primaryRarity)) {
        cluster.primaryRarity = sighting.bird_rarity;
      }
    } else {
      clusters.set(key, {
        lat: gridLat,
        lng: gridLng,
        sightings: [sighting],
        primaryRarity: sighting.bird_rarity
      });
    }
  });
  
  return Array.from(clusters.values());
};

export const RadarMap: React.FC<RadarMapProps> = ({ userLocation, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [clusters, setClusters] = useState<ClusteredSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusteredSighting | null>(null);
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null);
  const [timeFilter, setTimeFilter] = useState(7);
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Default center (Germany)
  const defaultCenter = { lat: 51.1657, lng: 10.4515 };
  const center = userLocation || defaultCenter;

  // Load Leaflet CSS and JS dynamically
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

  // Initialize map when Leaflet is ready
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapRef.current) return;

    const L = (window as any).L;
    
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([center.lat, center.lng], userLocation ? 13 : 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          background: #14B8A6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('Dein Standort');
    }

    mapRef.current = map;
  }, [mapReady, center.lat, center.lng, userLocation]);

  // Fetch sightings
  const fetchSightings = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - timeFilter);
      
      const { data, error: fetchError } = await supabase
        .from('bird_sightings')
        .select('id, bird_id, bird_name, bird_rarity, lat, lng, sighted_at')
        .eq('flagged', false)
        .gte('sighted_at', dateLimit.toISOString().split('T')[0])
        .order('sighted_at', { ascending: false })
        .limit(500);
      
      if (fetchError) throw fetchError;
      
      console.log('[Radar] Loaded sightings:', data?.length || 0);
      setSightings(data || []);
      
      // Cluster the sightings
      const clustered = clusterSightings(data || []);
      console.log('[Radar] Clustered into:', clustered.length, 'locations');
      setClusters(clustered);
    } catch (e) {
      console.error('[Radar] Failed to fetch sightings:', e);
      setError('Konnte Sichtungen nicht laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSightings();
  }, [timeFilter]);

  // Update markers when clusters change
  useEffect(() => {
    if (!mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    console.log('[Radar] Adding markers for', clusters.length, 'clusters');

    // Add cluster markers
    clusters.forEach(cluster => {
      const color = getRarityColor(cluster.primaryRarity);
      const count = cluster.sightings.length;
      
      const icon = L.divIcon({
        className: 'cluster-marker',
        html: `<div style="
          min-width: 32px;
          height: 32px;
          background: ${color};
          border: 3px solid white;
          border-radius: ${count > 1 ? '16px' : '50%'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${count > 1 ? '12px' : '14px'};
          font-weight: bold;
          color: white;
          padding: 0 ${count > 1 ? '6px' : '0'};
        ">${count > 1 ? `🐦 ${count}` : '🐦'}</div>`,
        iconSize: [count > 1 ? 48 : 32, 32],
        iconAnchor: [count > 1 ? 24 : 16, 16],
      });

      const marker = L.marker([cluster.lat, cluster.lng], { icon })
        .addTo(mapRef.current)
        .on('click', () => {
          if (cluster.sightings.length === 1) {
            setSelectedSighting(cluster.sightings[0]);
            setSelectedCluster(null);
          } else {
            setSelectedCluster(cluster);
            setSelectedSighting(null);
          }
        });

      markersRef.current.push(marker);
    });
    
    console.log('[Radar] Markers added:', markersRef.current.length);
  }, [clusters, mapReady]);

  // Center on user location
  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13, {
        animate: true
      });
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    return date.toLocaleDateString('de-DE');
  };

  // Handle selecting a bird from cluster list
  const handleSelectBirdFromCluster = (sighting: Sighting) => {
    setSelectedSighting(sighting);
  };

return (
    <div className="flex flex-col bg-cream relative z-10 isolate" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="text-teal" size={24} />
          <div>
            <h1 className="font-bold text-teal text-lg leading-none">Vogelradar</h1>
            <p className="text-xs text-gray-400">{sightings.length} Sichtungen an {clusters.length} Orten</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Filter */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
          >
            <Filter size={16} />
            {TIME_FILTERS.find(f => f.value === timeFilter)?.label}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Refresh */}
          <button
            onClick={fetchSightings}
            disabled={loading}
            className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="absolute top-16 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => {
                setTimeFilter(filter.value);
                setShowFilters(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 ${
                timeFilter === filter.value ? 'text-teal bg-teal/5' : 'text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative min-h-0">
        <div ref={mapContainerRef} className="absolute inset-0" />
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[500]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-teal" size={32} />
              <span className="text-sm text-gray-500">Lade Sichtungen...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="absolute top-4 left-4 right-4 z-[500] bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <Info size={20} className="text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Center on User Button */}
        {userLocation && (
          <button
            onClick={centerOnUser}
            className="absolute bottom-24 right-4 z-[500] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-teal hover:bg-gray-50 transition-colors"
          >
            <Navigation size={24} />
          </button>
        )}

        {/* Legend */}
        <div className="absolute bottom-24 left-4 z-[500] bg-white rounded-xl shadow-lg p-3 text-xs">
          <p className="font-bold text-gray-700 mb-2">Legende</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#14B8A6' }}></div>
              <span className="text-gray-600">Häufig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#A855F7' }}></div>
              <span className="text-gray-600">Selten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#EAB308' }}></div>
              <span className="text-gray-600">Legendär</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }}></div>
              <span className="text-gray-600">Gefährdet</span>
            </div>
          </div>
        </div>

        {/* Cluster List Panel (multiple birds at location) */}
        {selectedCluster && !selectedSighting && (
          <div className="absolute bottom-24 left-4 right-4 z-[1000] bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-teal" />
                <span className="font-bold text-gray-800">
                  {selectedCluster.sightings.length} Sichtungen hier
                </span>
              </div>
              <button
                onClick={() => setSelectedCluster(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {selectedCluster.sightings.map((sighting, index) => (
                <button
                  key={sighting.id}
                  onClick={() => handleSelectBirdFromCluster(sighting)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ background: getRarityColor(sighting.bird_rarity) }}
                  >
                    🐦
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">{sighting.bird_name}</p>
                    <p className="text-xs text-gray-500">{sighting.bird_rarity || 'Häufig'}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(sighting.sighted_at)}</span>
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedCluster.lat},${selectedCluster.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-teal text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors"
              >
                <Navigation size={18} />
                Route planen
              </a>
            </div>
          </div>
        )}

        {/* Single Sighting Panel */}
        {selectedSighting && (
          <div className="absolute bottom-24 left-4 right-4 z-[1000] bg-white rounded-2xl shadow-2xl p-5 animate-slide-up">
            <button
              onClick={() => {
                setSelectedSighting(null);
                // If we came from a cluster, go back to cluster view
                if (selectedCluster) {
                  // Keep cluster open
                } else {
                  setSelectedCluster(null);
                }
              }}
              className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            {/* Back button if from cluster */}
            {selectedCluster && (
              <button
                onClick={() => setSelectedSighting(null)}
                className="absolute top-3 left-3 p-2 text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
              >
                ← Zurück
              </button>
            )}
            
            <div className="flex items-start gap-4 mt-2">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                style={{ background: getRarityColor(selectedSighting.bird_rarity) }}
              >
                🐦
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{selectedSighting.bird_name}</h3>
                <p className="text-sm text-gray-500">{selectedSighting.bird_rarity || 'Häufig'}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>📅 {formatDate(selectedSighting.sighted_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedSighting.lat},${selectedSighting.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-teal text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors"
              >
                <Navigation size={18} />
                Route planen
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
