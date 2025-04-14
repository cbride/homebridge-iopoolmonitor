import type { API } from 'homebridge';

import { PLATFORM_NAME } from './settings.js';
import { IopoolHomebridgePlatform } from './platform/platform.js';

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, IopoolHomebridgePlatform);
};
