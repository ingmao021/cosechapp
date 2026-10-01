export const environment = {
  production: true,
  apiUrl: 'https://cosechapp-backend.onrender.com', // Backend en Render (ajustar URL real)
  // Activar solo cuando exista android/app/google-services.json (Firebase). Sin él,
  // PushNotifications.register() cierra la app nativa (FirebaseApp no inicializado).
  pushNotificationsEnabled: false,
};
