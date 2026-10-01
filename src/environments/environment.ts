// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Capacitor } from '@capacitor/core';

export const environment = {
  production: false,
  // Backend local (NestJS en puerto 3000). Desde el emulador Android, la PC es 10.0.2.2.
  apiUrl: Capacitor.isNativePlatform() ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
  // Activar solo cuando exista android/app/google-services.json (Firebase). Sin él,
  // PushNotifications.register() cierra la app nativa (FirebaseApp no inicializado).
  pushNotificationsEnabled: false,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
