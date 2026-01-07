// A basic service worker to make the app installable
self.addEventListener('fetch', (event) => {
  // This service worker doesn't do anything with the fetch event,
  // it just needs to exist to make the app installable.
  // A more advanced PWA would implement caching strategies here.
});
