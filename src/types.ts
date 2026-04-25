export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface SafetyMetrics {
  crimeScore: number; // 0-100, 100 is safest
  trafficScore: number;
  weatherScore: number;
  lightingScore: number;
  crowdScore: number;
  overallScore: number;
}

export interface RouteInfo {
  id: string;
  type: 'fastest' | 'shortest' | 'safest';
  path: [number, number][];
  distance: number; // km
  duration: number; // minutes
  safetyScore: number;
}

export interface AppState {
  currentLocation: Location | null;
  metrics: SafetyMetrics | null;
  routes: RouteInfo[];
  isNight: boolean;
  weather: string;
}
