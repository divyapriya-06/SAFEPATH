import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import MapScreen from './components/MapScreen';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'map'>('landing');

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950">
      <AnimatePresence mode="wait">
        {screen === 'landing' ? (
          <LandingPage key="landing" onStart={() => setScreen('map')} />
        ) : (
          <MapScreen key="map" onLogout={() => setScreen('landing')} />
        )}
      </AnimatePresence>
    </div>
  );
}
