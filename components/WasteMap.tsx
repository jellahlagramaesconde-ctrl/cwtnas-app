import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { WasteRoute } from '../types';

// Fix Leaflet Default Icon issue in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Custom Markers ---

// Green Truck for Active Routes
export const truckIconActive = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Grey Truck for Inactive/Delayed
export const truckIconInactive = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Blue User Marker (The Driver or Resident's Location)
export const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- Helper Component to Handle Map Movement ---
const MapController: React.FC<{ center: [number, number]; zoom: number; active: boolean }> = ({ center, zoom, active }) => {
    const map = useMap();
    const prevCenterRef = useRef<[number, number]>(center);

    useEffect(() => {
        if (!active) return;
        
        // Only fly if distance is significant to avoid jitter
        const dist = Math.sqrt(
            Math.pow(center[0] - prevCenterRef.current[0], 2) + 
            Math.pow(center[1] - prevCenterRef.current[1], 2)
        );

        if (dist > 0.0001) { // Only move if updated significantly
            map.flyTo(center, zoom, {
                animate: true,
                duration: 1.5 
            });
            prevCenterRef.current = center;
        }
    }, [center, zoom, map, active]);
    return null;
};

interface WasteMapProps {
    center: [number, number];
    activeRoutes: WasteRoute[];
    myRouteId?: string;
    height?: string;
    driverLocation?: { lat: number; lng: number } | null;
    zoom?: number;
}

const WasteMap: React.FC<WasteMapProps> = ({ center, activeRoutes, myRouteId, height = "400px", zoom = 14, driverLocation }) => {
    // Validate center coordinates
    const safeCenter: [number, number] = 
        (center && !isNaN(center[0]) && !isNaN(center[1])) 
        ? center 
        : [14.5995, 120.9842]; // Default to Manila

    return (
        <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden', zIndex: 0, position: 'relative' }}>
            <style>
                {`
                .leaflet-control-layers {
                    border-radius: 12px !important;
                    border: 1px solid rgba(0,0,0,0.1) !important;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
                    font-family: 'Inter', sans-serif !important;
                    padding: 8px !important;
                }
                .leaflet-control-layers-list {
                    margin-bottom: 0 !important;
                }
                .leaflet-control-layers-base label {
                    padding: 4px 8px !important;
                    cursor: pointer !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #475569 !important;
                }
                .leaflet-control-layers-base label:hover {
                    background-color: #f1f5f9 !important;
                    border-radius: 6px !important;
                }
                `}
            </style>
            <MapContainer center={safeCenter} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                
                <LayersControl position="topright">
                    {/* 1. Default Clean Light View */}
                    <LayersControl.BaseLayer checked name="Clean View">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                    </LayersControl.BaseLayer>

                    {/* 2. Satellite View */}
                    <LayersControl.BaseLayer name="Satellite View">
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>

                    {/* 3. Detailed Street View */}
                    <LayersControl.BaseLayer name="Standard Street">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>

                    {/* 4. Dark View (Night Mode) */}
                    <LayersControl.BaseLayer name="Dark Mode">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>
                
                <MapController center={safeCenter} zoom={zoom} active={!!myRouteId || activeRoutes.length > 0} />
                
                {/* Render Routes */}
                {activeRoutes.map(route => {
                    const isMe = route.id === myRouteId;
                    
                    let lat: number | undefined;
                    let lng: number | undefined;

                    // Priority: Local Driver Location > Database Location
                    if (isMe && driverLocation) {
                        lat = driverLocation.lat;
                        lng = driverLocation.lng;
                    } else if (route.currentLocation) {
                        // Handle potential Firestore object format differences
                        lat = typeof route.currentLocation.lat === 'number' ? route.currentLocation.lat : (route.currentLocation as any).latitude;
                        lng = typeof route.currentLocation.lng === 'number' ? route.currentLocation.lng : (route.currentLocation as any).longitude;
                    }
                    
                    // Skip if no valid location
                    if (typeof lat !== 'number' || typeof lng !== 'number') return null;

                    const pos: [number, number] = [lat, lng];
                    
                    return (
                        <Marker 
                            key={route.id} 
                            position={pos}
                            icon={isMe ? userIcon : (route.status === 'In Progress' ? truckIconActive : truckIconInactive)}
                            zIndexOffset={isMe ? 1000 : 0} // Put current user on top
                        >
                            <Popup>
                                <div className="font-sans text-sm min-w-[150px]">
                                    <strong className="block text-[#4F7942] text-base mb-1">{route.name}</strong>
                                    <div className="text-gray-600 text-xs mb-2">
                                        <p>Driver: <b>{route.driver}</b></p>
                                        <p>Truck: <b>{route.truckId}</b></p>
                                    </div>
                                    
                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                        ${route.status === 'In Progress' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {route.status}
                                    </span>
                                    
                                    <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                                        {isMe ? 'Updated: Live (You)' : 'Updated: Just now'}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default WasteMap;