export const BACKEND_URL = 'https://tulip-backend-fcrw.onrender.com';
export const GOOGLE_CLIENT_ID = '195981996582-p1dr4sadsuiemg5petnbk8gvtn0h0nng.apps.googleusercontent.com';
// Web application type OAuth client — used as webClientId for @react-native-google-signin/google-signin
export const GOOGLE_WEB_CLIENT_ID = '195981996582-5khiunvevc89bfqmvgghnot6pe7fv9di.apps.googleusercontent.com';

// Shared secret for backend auth (must match BACKEND_API_SECRET on Render).
// TEMP: hardcoded like GOOGLE_CLIENT_ID above until a proper secrets/build-config setup exists.
export const BACKEND_API_SECRET = 'd423f57a4f54eaec403d21640b9843ed0e2cc380d653a09903e7ed39c21b891d';

// TEMP: placeholder userId until real Google Sign-In (task F2) lands.
export const TEMP_USER_ID = 'temp-google-user';
