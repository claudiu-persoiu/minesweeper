const cache_name = "v1"
const caching_assets = [
    "/minesweeper",
    "/minesweeper/index.html",
    "/minesweeper/css/game.css",
    "/minesweeper/css/overlay.css",
    "/minesweeper/js/app.js",
    "/minesweeper/js/game.js",
    "/minesweeper/js/utils.js",
    "/minesweeper/media/bomb.png",
    "/minesweeper/media/button-sprite.png",
    "/minesweeper/media/flag.png",
    "/minesweeper/media/sprite.jpg",
    "/minesweeper/media/icons/icon-72x72.png",
    "/minesweeper/media/icons/icon-96x96.png",
    "/minesweeper/media/icons/icon-128x128.png",
    "/minesweeper/media/icons/icon-144x144.png",
    "/minesweeper/media/icons/icon-152x152.png",
    "/minesweeper/media/icons/icon-192x192.png",
    "/minesweeper/media/icons/icon-384x384.png",
    "/minesweeper/media/icons/icon-512x512.png",
]


self.addEventListener("install", (event) => {
    console.log("Service Worker : Installed!")

    event.waitUntil(

        (async() => {
            try {
                const cache_obj = await caches.open(cache_name);
                cache_obj.addAll(caching_assets);

                const skip = self.skipWaiting();
            }
            catch{
                console.log("error occured while caching...")
            }
        })()
    )
} )



// activated event
// before activating the service worker, we can get rid of the old cache.
self.addEventListener("activate", (event) => {
    console.log("Service Worker : Activated!")

    // removing the old cache.
    event.waitUntil(

        (async () => {

            const cache_keys = await caches.keys()
            console.log(cache_keys)

            cache_keys.forEach(
                key => {
                    if (key !== cache_name) {
                        console.log("Service Worker deleted old cache!")
                        return caches.delete(key)

                    }
                }
            )
            return Promise.all(cache_keys)


        })()

    )
})

// In the fetch event, we need to configure that, whenever the browser
// try to get the file from the server, we need to check whether the browser
// is online or offline. and give the files according to it.

self.addEventListener("fetch", (event) => {
    console.log("Service Worker : fetch!")
    event.respondWith(
        // we are sending the request to the server. if network is down, then sending the res
        // from the cache.
        fetch(event.request)
            .catch(() => {
                caches.match(event.request)
            })

    )
})
