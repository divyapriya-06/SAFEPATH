import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Menu, 
  Navigation, 
  AlertTriangle, 
  CloudRain, 
  Moon, 
  Sun,
  ShieldCheck,
  Zap,
  Maximize2,
  Crosshair,
  AlertOctagon,
  X,
  Settings,
  User,
  Bookmark,
  Bell,
  LogOut,
  PhoneCall,
  MessageSquareWarning,
  Eye,
  Activity,
  Layers
} from 'lucide-react';
import { io } from 'socket.io-client';
import AnalysisPanel from './AnalysisPanel';
import NavigationPanel from './NavigationPanel';
import Sidebar from './Sidebar';

// Fix Leaflet icon issue using CDN
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const reportIcon = L.divIcon({
  className: 'report-icon',
  html: '<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-bounce">!</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom pulsing marker for current location
const pulsingIcon = L.divIcon({
  className: 'custom-pulsing-icon',
  html: '<div class="pulsater"></div><div class="pulsate"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapScreenProps {
  onLogout: () => void;
  key?: string;
}

export default function MapScreen({ onLogout }: MapScreenProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [location, setLocation] = useState<[number, number]>([40.7128, -74.0060]); // Default NYC
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]);
  const [zoom, setZoom] = useState(13);
  const [isNavigating, setIsNavigating] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState('1');
  const [activeModal, setActiveModal] = useState<{ title: string, content: React.ReactNode } | null>(null);
  const [logs, setLogs] = useState<{ id: string, text: string, type: 'info' | 'warning' }[]>([
    { id: 'init-' + Date.now().toString(), text: 'SafePath System Initialized', type: 'info' }
  ]);
  const [safetyTipIndex, setSafetyTipIndex] = useState(0);
  const safetyTips = [
    "AI Tip: Stick to streets with working streetlights at night.",
    "AI Tip: Share your live location with at least one trusted contact.",
    "AI Tip: Avoid using noise-canceling headphones while walking alone.",
    "AI Tip: The 'Safest' route is calculated based on real-time crime data.",
    "AI Tip: Use the 'Report' button to help other explorers stay safe."
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setSafetyTipIndex(prev => (prev + 1) % safetyTips.length);
    }, 10000);
    return () => clearInterval(tipInterval);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showHeatmap, setShowHeatmap] = useState<'none' | 'crime' | 'lighting'>('none');
  const [reports, setReports] = useState<{ id: string, lat: number, lng: number, type: string }[]>([
    { id: '1', lat: 40.7228, lng: -74.0160, type: 'Poor Lighting' }
  ]);
  const [isEscortActive, setIsEscortActive] = useState(false);

  useEffect(() => {
    const socket = io();
    socket.on('live-update', (data: any) => {
      setLiveData(data);
      if (data.safetyAlert) {
        setLogs(prev => [{ id: 'alert-' + Date.now() + Math.random(), text: data.safetyAlert, type: 'warning' }, ...prev.slice(0, 4)]);
      }
    });

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition((position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setLocation(coords);
        // Only center if not looking at a destination
        if (!destination) {
          setMapCenter(coords);
        }
        fetchSafetyAnalysis(coords[0], coords[1]);
        setLogs(prev => [{ id: 'loc-' + Date.now() + Math.random(), text: `GPS: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`, type: 'info' }, ...prev.slice(0, 5)]);
      }, (err) => console.error(err), { enableHighAccuracy: true });

      return () => {
        socket.disconnect();
        navigator.geolocation.clearWatch(watchId);
      };
    }

    return () => {
      socket.disconnect();
    };
  }, [destination]);

  // Search suggestions logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3 || (destination && searchQuery === destination.name)) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, destination]);

  const fetchSafetyAnalysis = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/safety-analysis?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to fetch safety analysis", err);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
    setLogs(prev => [{ id: 'ai-' + Date.now() + '-' + Math.random(), text: `AI: "${text}"`, type: 'info' }, ...prev.slice(0, 5)]);
  };

  const addReport = (type: string) => {
    const newReport = {
      id: Date.now().toString() + '-' + Math.random(),
      lat: location[0] + (Math.random() - 0.5) * 0.002,
      lng: location[1] + (Math.random() - 0.5) * 0.002,
      type
    };
    setReports(prev => [...prev, newReport]);
    setActiveModal(null);
    setLogs(prev => [{ id: 'report-' + Date.now() + '-' + Math.random(), text: `Community Report: ${type} tagged`, type: 'warning' }, ...prev.slice(0, 5)]);
    speak(`Report captured. AI Engine recalculating route safety based on ${type}.`);
  };

  const handleReportAction = () => {
    setActiveModal({
      title: 'Report Safety Hazard',
      content: (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Poor Lighting', icon: <Moon className="w-5 h-5" />, color: 'bg-indigo-500' },
            { label: 'Suspicious Activity', icon: <Eye className="w-5 h-5" />, color: 'bg-red-500' },
            { label: 'Unsafe Road', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-amber-500' },
            { label: 'Construction', icon: <Settings className="w-5 h-5" />, color: 'bg-blue-500' },
            { label: 'Harassment', icon: <AlertOctagon className="w-5 h-5" />, color: 'bg-rose-600' },
            { label: 'Crowded Area', icon: <User className="w-5 h-5" />, color: 'bg-purple-500' },
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => addReport(item.label)}
              className={`${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'} p-4 rounded-2xl border text-center transition-all group flex flex-col items-center gap-2`}
            >
              <div className={`p-2 rounded-lg ${item.color} text-white`}>{item.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      )
    });
  };

  const handleSearch = async (item: any) => {
    const newDest = {
      name: item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    };
    setDestination(newDest);
    setMapCenter([newDest.lat, newDest.lng]);
    setZoom(15);
    setShowAnalysis(false);
    setSuggestions([]);
    setSearchQuery(newDest.name);
    setLogs(prev => [{ id: 'search-' + Date.now() + Math.random(), text: `Route found to ${newDest.name}`, type: 'info' }, ...prev.slice(0, 5)]);
  };

  const handleStartNav = () => {
    setIsNavigating(true);
    setShowAnalysis(false);
    setMapCenter(location);
    setZoom(17);
    setLogs(prev => [{ id: 'nav-' + Date.now() + Math.random(), text: `Navigation started. Safest Path engine active.`, type: 'info' }, ...prev]);
    speak("Starting navigation. Safest route selected. Please stay alert.");
  };

  const handleSidebarAction = (label: string) => {
    switch (label) {
      case 'Profile':
        setActiveModal({
          title: 'User Profile',
          content: (
            <div className="space-y-4">
              <div className={`flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-2xl`}>
                <div className="w-16 h-16 bg-neon-purple rounded-full flex items-center justify-center text-2xl font-bold text-white">DP</div>
                <div>
                  <h4 className="font-bold">Divya Priya</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>Verified Explorer • Level 5</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} p-3 rounded-xl text-center`}>
                  <div className="text-neon-accent font-bold">1.2k</div>
                  <div className={`text-[10px] uppercase ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Safe KM</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} p-3 rounded-xl text-center`}>
                  <div className="text-neon-accent font-bold">12</div>
                  <div className={`text-[10px] uppercase ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Safe Streak</div>
                </div>
              </div>
            </div>
          )
        });
        break;
      case 'Environmental Safety':
        const isNight = new Date().getHours() > 18 || new Date().getHours() < 6;
        const visibilityStatus = liveData?.weather === 'Rainy' || liveData?.weather === 'Mist' ? 'Low (Mist/Fog)' : 'High (Clear)';
        const trafficLevel = (liveData?.trafficDensity || 0) > 70 ? 'High' : (liveData?.trafficDensity || 0) > 30 ? 'Moderate' : 'Low';
        
        setActiveModal({
          title: 'Environmental Safety',
          content: (
            <div className="space-y-4">
              <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-2xl`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <CloudRain className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-bold">Weather Condition</span>
                  </div>
                  <span className="text-sm font-bold text-neon-accent">{liveData?.weather || 'Sunny'}</span>
                </div>
                <div className={`text-[11px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} flex justify-between`}>
                  <span>Temperature: 28°C</span>
                  <span>Humidity: 65%</span>
                </div>
              </div>

              <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-2xl`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-bold">Visibility & Lighting</span>
                  </div>
                  <span className="text-sm font-bold">{isNight ? 'Night' : 'Daylight'}</span>
                </div>
                <div className={`text-[11px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                  Status: <span className={visibilityStatus.includes('Low') ? 'text-red-400' : 'text-green-400'}>{visibilityStatus}</span>
                </div>
              </div>

              <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-2xl`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold">Traffic Density</span>
                  </div>
                  <span className={`text-sm font-bold ${trafficLevel === 'High' ? 'text-red-400' : 'text-green-400'}`}>{trafficLevel}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${liveData?.trafficDensity || 20}%` }}
                    className={`h-full ${trafficLevel === 'High' ? 'bg-red-500' : 'bg-neon-accent'}`}
                  />
                </div>
                <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Capacity: {liveData?.trafficDensity || 20}% utilized</p>
              </div>

              <p className={`text-[10px] ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-widest text-center mt-4`}>Live Satellite Feed Active</p>
            </div>
          )
        });
        break;
      case 'Emergency Contacts':
        setActiveModal({
          title: 'Emergency SOS',
          content: (
            <div className="space-y-3">
              <p className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'} mb-2`}>The following contacts will be notified during an SOS alert.</p>
              {['Police (911)', 'Mom: Radha', 'Father: Raja'].map((c) => (
                <div key={c} className={`flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} p-4 rounded-xl border text-sm`}>
                  <span>{c}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]" />
                </div>
              ))}
              <button className={`w-full mt-4 py-3 ${theme === 'dark' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'} border rounded-xl font-bold text-sm`}>Update Contacts</button>
            </div>
          )
        });
        break;
      case 'Saved Places':
        setActiveModal({
          title: 'Saved Locations',
          content: (
            <div className="space-y-2">
              <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-xl flex items-center justify-between`}>
                <div>
                  <h5 className="font-bold text-sm">Kerala</h5>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>God's Own Country</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-xl flex items-center justify-between`}>
                <div>
                  <h5 className="font-bold text-sm">Thanjavur</h5>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>The Rice Bowl of Tamil Nadu</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
            </div>
          )
        });
        break;
      case 'Safety Settings':
        setActiveModal({
          title: 'Safety Preferences',
          content: (
            <div className="space-y-4 text-sm font-medium">
              <div className="flex items-center justify-between">
                <span>Avoid Unlit Areas</span>
                <div className="w-10 h-5 bg-neon-accent rounded-full relative shadow-lg shadow-neon-accent/20 cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" /></div>
              </div>
              <div className="flex items-center justify-between">
                <span>Crowded Route Preference</span>
                <div className={`w-10 h-5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'} rounded-full relative cursor-pointer`}><div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" /></div>
              </div>
              <div className="flex items-center justify-between">
                <span>Live Location Sharing</span>
                <div className="w-10 h-5 bg-neon-accent rounded-full relative shadow-lg shadow-neon-accent/20 cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" /></div>
              </div>
            </div>
          )
        });
        break;
      default:
        console.log("Action:", label);
    }
  };

  const handleEmergency = async () => {
    try {
      await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'User123', location: { lat: location[0], lng: location[1] } })
      });
      speak("Emergency alert triggered. Alerting emergency contacts, Radha and Raja. Your location is being shared with the police.");
      alert('🚨 SOS TRIGGERED! Your live location has been shared with emergency services.');
    } catch (err) {
      console.error(err);
    }
  };

  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png';

  // Mock paths for different routes
  const getRoutePath = (id: string): [number, number][] => {
    if (!destination) return [];
    if (id === '1') { // Safest: winding but visible
      return [
        location,
        [location[0] + (destination.lat - location[0]) * 0.3, location[1] + (destination.lng - location[1]) * 0.1],
        [location[0] + (destination.lat - location[0]) * 0.6, location[1] + (destination.lng - location[1]) * 0.8],
        [destination.lat, destination.lng]
      ];
    }
    return [location, [destination.lat, destination.lng]]; // Straight line for others
  };

  return (
    <div className={`relative h-screen w-full transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Map Container */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={location} zoom={zoom} zoomControl={false} className="h-full w-full">
          <TileLayer url={tileUrl} />
          <ChangeView center={mapCenter} zoom={zoom} />
          
          <Marker position={location} icon={pulsingIcon} />
          
          {destination && (
            <Marker position={[destination.lat, destination.lng]} />
          )}

          {reports.map(report => (
            <Marker key={report.id} position={[report.lat, report.lng]} icon={reportIcon}>
              <Circle center={[report.lat, report.lng]} radius={100} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1 }} />
            </Marker>
          ))}

          {showHeatmap === 'crime' && (
             <>
               <Circle center={[location[0] + 0.005, location[1] + 0.005]} radius={500} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1 }} />
               <Circle center={[location[0] - 0.01, location[1] - 0.005]} radius={800} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.05 }} />
             </>
          )}

          {showHeatmap === 'lighting' && (
             <>
               <Circle center={[location[0] + 0.008, location[1] - 0.008]} radius={600} pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.1 }} />
               <Circle center={[location[0] - 0.004, location[1] + 0.01]} radius={400} pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.15 }} />
             </>
          )}

          {destination && (
            <Polyline 
              positions={getRoutePath(selectedRouteId)} 
              color={selectedRouteId === '1' ? '#10b981' : '#6366f1'}
              weight={6}
              opacity={0.8}
              dashArray={isNavigating ? "10, 10" : ""}
            >
               {isNavigating && <motion.div animate={{ strokeDashoffset: [0, -20] }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} />}
            </Polyline>
          )}

          {/* Safe Zones Icons (Mock) */}
          <Circle 
            center={[location[0] + 0.01, location[1] + 0.01]} 
            radius={200} 
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }} 
          />
        </MapContainer>
      </div>

      {/* UI Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4 md:p-6 flex flex-col" style={{ paddingTop: 'max(2.5rem, calc(env(safe-area-inset-top) + 1rem))', paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}>
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSidebarOpen(true)}
            className={`p-4 rounded-2xl ${theme === 'dark' ? 'glass-dark text-white' : 'bg-white border-slate-200 text-slate-900 shadow-lg'} border z-10 transition-colors pointer-events-auto`}
          >
            <Menu className="w-6 h-6" />
          </motion.button>

          <div className="flex-1 max-w-md mx-4 relative">
            <div className="relative group">
              <input 
                type="text"
                placeholder="Where to?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${theme === 'dark' ? 'bg-white/10 text-white placeholder-white/50 border-white/20' : 'bg-white text-slate-900 placeholder-slate-400 border-slate-200 shadow-lg'} backdrop-blur-md border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-neon-accent transition-all shadow-2xl`}
              />
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`} />
            </div>
            
            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-2 ${theme === 'dark' ? 'glass-dark border-white/10' : 'bg-white border-slate-100 shadow-xl'} rounded-2xl border overflow-hidden shadow-2xl pointer-events-auto`}>
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.place_id}-${idx}`}
                    onClick={() => handleSearch(item)}
                    className={`w-full p-4 text-left ${theme === 'dark' ? 'hover:bg-white/10 border-white/5' : 'hover:bg-slate-50 border-slate-100'} transition-colors border-b last:border-b-0`}
                  >
                    <div className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.display_name.split(',')[0]}</div>
                    <div className={`text-[10px] truncate ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{item.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-4 rounded-2xl ${theme === 'dark' ? 'glass-dark text-white' : 'bg-white border-slate-200 text-slate-900 shadow-lg'} border ml-2 transition-colors pointer-events-auto`}
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Live Status Pill */}
        <div className="mt-4 self-center pointer-events-auto flex flex-col items-center gap-2">
           <AnimatePresence>
             {liveData && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center gap-2"
               >
                 <div className={`px-4 py-2 rounded-full ${theme === 'dark' ? 'glass-dark text-white/80 border-white/10' : 'bg-white text-slate-900 border-slate-200 shadow-lg'} text-[10px] font-black flex items-center gap-2 border shadow-lg tracking-widest uppercase`}>
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                   AI ENGINE ACTIVE • UPDATING DATA
                 </div>
                 
                 {isEscortActive && (
                   <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="px-3 py-1 bg-neon-purple text-white text-[9px] font-bold rounded-full shadow-lg flex items-center gap-2"
                   >
                     <Activity className="w-3 h-3 animate-pulse" />
                     VIRTUAL ESCORT MODE ON
                   </motion.div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
           
           {/* Live Event Console */}
           <div className="hidden md:flex flex-col gap-1 w-64">
              <AnimatePresence mode="popLayout">
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'glass-dark' : 'bg-white shadow-md'} text-[10px] border-l-2 ${log.type === 'warning' ? 'border-red-500 text-red-500' : 'border-neon-accent ' + (theme === 'dark' ? 'text-white/60' : 'text-slate-600')}`}
                  >
                    {log.text}
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Bottom Contextual Panels */}
        <div className="mt-auto pointer-events-auto flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {!activeModal && !destination && !isNavigating && (
              <motion.div
                key={safetyTipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`max-w-[280px] p-3 rounded-xl border ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-700'} text-[10px] font-medium flex items-center gap-3 backdrop-blur-sm shadow-lg`}
              >
                <div className="shrink-0 w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">!</div>
                {safetyTips[safetyTipIndex]}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {/* Full Screen Modal Overlay */}
            {activeModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] pointer-events-auto flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                onClick={() => setActiveModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`${theme === 'dark' ? 'glass-dark border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-[40px] p-8 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-0 right-0 p-6">
                    <button 
                      onClick={() => setActiveModal(null)}
                      className={`p-3 ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'} rounded-2xl transition-colors`}
                    >
                      <X className={`w-5 h-5 ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-neon-purple rounded-3xl shadow-lg">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">
                      {activeModal.title}
                    </h3>
                  </div>
                  
                  <div className="relative z-10 font-medium overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    {activeModal.content}
                    <div className="h-8" />
                  </div>

                  {/* Aesthetic Background Accents */}
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-neon-purple/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-neon-accent/10 rounded-full blur-3xl pointer-events-none" />
                </motion.div>
              </motion.div>
            )}

            {showAnalysis && metrics && !activeModal && (
              <div className="max-h-[65vh] overflow-y-auto custom-scrollbar rounded-[32px] pointer-events-auto">
                <AnalysisPanel metrics={metrics} theme={theme} onClose={() => setShowAnalysis(false)} onStart={() => setDestination({ name: 'Safe Path Selection', lat: location[0] + 0.01, lng: location[1] + 0.01 })} />
                <div className="h-8" />
              </div>
            )}
            
            {destination && !isNavigating && (
               <div className="max-h-[65vh] overflow-y-auto custom-scrollbar rounded-[32px] pointer-events-auto">
                 <NavigationPanel 
                  destination={destination} 
                  metrics={metrics} 
                  theme={theme}
                  onStart={handleStartNav}
                  onCancel={() => {
                    setDestination(null);
                    setMapCenter(location);
                    setZoom(13);
                  }}
                  onSelectRoute={(id: string) => setSelectedRouteId(id)}
                  selectedRouteId={selectedRouteId}
                />
                <div className="h-8" />
              </div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          {isNavigating && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neon-purple text-white p-6 rounded-3xl shadow-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Navigation className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedRouteId === '1' ? 'Safest' : 'Fast'} Route</h3>
                  <p className="text-white/70">{calculateDistance(location[0], location[1], destination.lat, destination.lng)} km • Monitoring Area...</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsNavigating(false);
                  setDestination(null);
                  setMapCenter(location);
                  setZoom(13);
                }}
                className="px-6 py-2 bg-white text-neon-purple rounded-xl font-bold shadow-lg"
              >
                Exit
              </button>
            </motion.div>
          )}

          {/* Emergency & Quick Actions */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsEscortActive(!isEscortActive);
                  speak(isEscortActive ? "Virtual escort deactivated." : "Virtual escort mode activated. I am now monitoring your trip with high precision.");
                }}
                className={`p-4 rounded-2xl ${isEscortActive ? 'bg-neon-purple text-white shadow-neon-purple/40 ring-2 ring-white/20' : (theme === 'dark' ? 'glass-dark text-white' : 'bg-white text-slate-900 shadow-xl border-slate-200')} shadow-xl flex items-center gap-2 font-bold border transition-all pointer-events-auto`}
              >
                <Activity className="w-6 h-6" />
                <span className="hidden md:inline">Escort</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEmergency}
                className="relative bg-red-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-2 font-bold transition-all hover:bg-red-600 active:ring-4 active:ring-red-500/50 overflow-hidden pointer-events-auto"
              >
                <motion.div 
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-white/40 rounded-full"
                />
                <AlertOctagon className="w-6 h-6 relative z-10" />
                <span className="relative z-10">SOS</span>
              </motion.button>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-4 rounded-2xl ${showHeatmap !== 'none' ? 'bg-neon-accent text-white' : (theme === 'dark' ? 'glass-dark text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl')} border shadow-xl flex items-center gap-2 pointer-events-auto`}
                  onClick={() => setShowHeatmap(showHeatmap === 'none' ? 'crime' : showHeatmap === 'crime' ? 'lighting' : 'none')}
                >
                  <Layers className="w-6 h-6" />
                  <span className="text-[10px] uppercase font-black tracking-tighter">
                    {showHeatmap === 'none' ? 'Layers' : showHeatmap}
                  </span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  title="Report safety hazard"
                  className={`p-4 rounded-2xl ${theme === 'dark' ? 'glass-dark text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'} border shadow-xl pointer-events-auto`}
                  onClick={handleReportAction}
                >
                  <MessageSquareWarning className="w-6 h-6" />
                </motion.button>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                className={`p-4 rounded-2xl ${theme === 'dark' ? 'glass-dark text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'} border shadow-xl pointer-events-auto`}
                onClick={() => {
                  setMapCenter(location);
                  setZoom(17);
                }}
              >
                <Crosshair className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Drawer */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onItemClick={handleSidebarAction}
        onLogout={onLogout}
        theme={theme}
      />
    </div>
  );
}
