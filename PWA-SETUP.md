# Progressive Web App (PWA) Setup

## Overview

Your Multi-Model Orchestrator application now has full PWA functionality, allowing it to be installed and run as a standalone app on mobile devices (iOS and Android) and desktop computers.

## Features

### ✅ Standalone App Experience
- Runs in full-screen mode without browser UI
- App icon on home screen/app drawer
- Native app-like feel

### ✅ Offline Support
- Service worker caching for offline access
- Cached assets include:
  - HTML, CSS, JavaScript files
  - Images and icons
  - Google Fonts
  - ESM modules from esm.sh

### ✅ Automatic Updates
- Service worker auto-updates when new versions are deployed
- Users get the latest version automatically

### ✅ Optimized Caching Strategy
- **CacheFirst** for fonts (365-day expiration)
- **StaleWhileRevalidate** for ESM modules (30-day expiration)
- Precaching for all static assets up to 5MB

## Installation Instructions

### On Mobile Devices

#### iOS (iPhone/iPad)
1. Open Safari browser
2. Navigate to your app URL
3. Tap the **Share** button (square with arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Tap **"Add"** in the top right
6. The app icon will appear on your home screen

#### Android (Chrome)
1. Open Chrome browser
2. Navigate to your app URL
3. Tap the **menu** (three dots) in the top right
4. Tap **"Add to Home screen"** or **"Install app"**
5. Confirm by tapping **"Add"** or **"Install"**
6. The app will appear in your app drawer

### On Desktop

#### Chrome/Edge/Brave
1. Navigate to your app URL
2. Look for the install icon (⊕ or computer icon) in the address bar
3. Click it and confirm the installation
4. The app will open in its own window

#### Safari (macOS Sonoma+)
1. Navigate to your app URL
2. Click **File** → **Add to Dock**
3. The app will be added to your Dock

## Technical Details

### Files Added/Modified

#### New Files
- `public/icon-192x192.png` - App icon (192x192)
- `public/icon-512x512.png` - App icon (512x512)
- `dist/manifest.webmanifest` - PWA manifest (auto-generated)
- `dist/sw.js` - Service worker (auto-generated)
- `dist/registerSW.js` - Service worker registration (auto-generated)
- `dist/workbox-*.js` - Workbox runtime (auto-generated)

#### Modified Files
- `vite.config.ts` - Added VitePWA plugin configuration
- `index.html` - Added PWA meta tags
- `package.json` - Added vite-plugin-pwa dependency

### PWA Configuration

The PWA is configured with the following settings:

```json
{
  "name": "Multi-Model Orchestrator",
  "short_name": "MMO",
  "description": "AI-powered multi-model orchestration platform",
  "theme_color": "#10a37f",
  "background_color": "#212121",
  "display": "standalone",
  "orientation": "any"
}
```

### Caching Strategy

1. **Static Assets**: Precached during installation
   - HTML, CSS, JavaScript
   - Images, icons (up to 5MB per file)
   - Fonts

2. **Google Fonts**: CacheFirst with 365-day expiration
3. **ESM Modules**: StaleWhileRevalidate with 30-day expiration

## Testing PWA Functionality

### Development Testing
The PWA is enabled in development mode, so you can test it locally:

```bash
npm run dev
```

Then open Chrome DevTools → Application → Manifest to verify the PWA configuration.

### Production Testing

1. Build the production version:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

3. Test the PWA:
   - Open Chrome DevTools → Application
   - Check "Manifest" section
   - Check "Service Workers" section
   - Test "Add to Home Screen" functionality

### Lighthouse Audit
Run a Lighthouse audit to verify PWA compliance:

1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Select **Progressive Web App**
4. Click **Generate report**

## Customization

### Changing App Icons
Replace the icons in the `public/` directory:
- `public/icon-192x192.png`
- `public/icon-512x512.png`

Then rebuild:
```bash
npm run build
```

### Changing App Name/Description
Edit `vite.config.ts` and modify the manifest configuration:

```typescript
manifest: {
  name: 'Your App Name',
  short_name: 'YourApp',
  description: 'Your app description',
  // ... other settings
}
```

### Changing Theme Colors
Edit these values in `vite.config.ts`:
- `theme_color`: Color of the address bar (when app loads)
- `background_color`: Splash screen background color

Also update the meta tag in `index.html`:
```html
<meta name="theme-color" content="#10a37f" />
```

### Adjusting Cache Size Limits
In `vite.config.ts`, modify the workbox configuration:

```typescript
workbox: {
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB (adjust as needed)
  // ... other settings
}
```

## Troubleshooting

### Issue: "Add to Home Screen" not appearing
- **Solution**: Ensure you're using HTTPS (or localhost for testing)
- Verify the manifest is loaded correctly (check DevTools → Application → Manifest)

### Issue: Changes not reflecting after update
- **Solution**: Clear the service worker cache
- In Chrome DevTools → Application → Service Workers → Click "Unregister"
- In Chrome DevTools → Application → Storage → Click "Clear site data"

### Issue: Build fails with "Assets exceeding the limit"
- **Solution**: Increase `maximumFileSizeToCacheInBytes` in `vite.config.ts`
- Or exclude large files from precaching

## Best Practices

1. **Always test on real devices** - PWA behavior can differ between desktop and mobile
2. **Use HTTPS in production** - Required for service workers
3. **Keep icons optimized** - Large icons slow down installation
4. **Test offline functionality** - Use Chrome DevTools → Network → Offline
5. **Monitor cache size** - Large caches can impact performance

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## Support

If you encounter issues with PWA functionality:
1. Check the browser console for errors
2. Verify service worker registration in DevTools
3. Check manifest validity in DevTools → Application
4. Review the build output for warnings/errors
