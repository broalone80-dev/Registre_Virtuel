// API Configuration
// Cloudflare Tunnel expose l'API via internet.
// Lancez: npx cloudflared tunnel --url http://localhost:5000
// L'URL change à chaque redémarrage.

const API_URL = __DEV__
    ? 'https://webster-floating-nottingham-agencies.trycloudflare.com/api/v1'
    : 'https://votre-api.com/api/v1';

export default {
    API_URL,
    SOCKET_URL: API_URL.replace('/api/v1', ''),
    TIMEOUT: 15000,
};
