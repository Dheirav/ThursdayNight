// UI layer for Nivi's Thursday
// - Exports initUI(appState)
// - Orchestrates role screen and home UI modules

import { initRoleScreen } from './roleScreen.js';
import { initHomeUI } from './homeUI.js';

// Main exported function - orchestrates role screen and home UI
export function initUI(appState, opts = {}){
  let homeUIInstance = null;

  // Initialize role screen with callback to start home UI when role is selected
  initRoleScreen({
    setRole: opts.setRole,
    onRoleSelected: (role) => {
      // Start home UI after role selection
      homeUIInstance = initHomeUI(appState, opts);
    }
  });

  return {
    destroy(){
      if(homeUIInstance && homeUIInstance.destroy) {
        homeUIInstance.destroy();
      }
    }
  };
}
