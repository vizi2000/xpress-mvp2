// Route Map Component - Visualizes delivery route using Leaflet and OSRM
export class RouteMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.containerWrapper = null;
        this.map = null;
        this.routeLayer = null;
        this.pickupMarker = null;
        this.deliveryMarker = null;
    }

    // Initialize Leaflet map
    initialize() {
        if (!this.container) {
            console.error(`❌ RouteMap container not found: ${this.containerId}`);
            return;
        }

        // Get container wrapper (parent element with display:none)
        this.containerWrapper = this.container.parentElement;

        try {
            // Initialize Leaflet map (centered on Warsaw)
            this.map = L.map(this.container, {
                center: [52.2297, 21.0122],
                zoom: 12,
                zoomControl: true,
                scrollWheelZoom: true
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);

            console.log('✅ RouteMap initialized with Leaflet');
        } catch (error) {
            console.error('❌ Error initializing RouteMap:', error);
        }
    }

    // Draw route between two coordinates
    async drawRoute(pickupCoords, deliveryCoords) {
        if (!this.map) {
            console.error('❌ Map not initialized. Call initialize() first.');
            return;
        }

        try {
            // Clear existing markers and route
            this.clearRoute();

            // Add pickup marker (green)
            this.pickupMarker = L.marker([pickupCoords.lat, pickupCoords.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        width: 40px;
                        height: 40px;
                        background: #27ae60;
                        border: 3px solid #fff;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        font-weight: bold;
                        color: white;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    ">A</div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })
            }).bindPopup('<strong>📍 Odbiór</strong>').addTo(this.map);

            // Add delivery marker (blue)
            this.deliveryMarker = L.marker([deliveryCoords.lat, deliveryCoords.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        width: 40px;
                        height: 40px;
                        background: #6366F1;
                        border: 3px solid #fff;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        font-weight: bold;
                        color: white;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    ">B</div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })
            }).bindPopup('<strong>📍 Dostawa</strong>').addTo(this.map);

            // Fetch route from OSRM
            console.log('🗺️ Fetching route from OSRM...');
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`;

            const response = await fetch(osrmUrl);
            if (!response.ok) {
                throw new Error(`OSRM API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.routes && data.routes[0]) {
                const route = data.routes[0];

                // Draw route polyline (yellow/gold color matching the theme)
                this.routeLayer = L.geoJSON(route.geometry, {
                    style: {
                        color: '#F4C810',
                        weight: 5,
                        opacity: 0.8,
                        lineJoin: 'round',
                        lineCap: 'round'
                    }
                }).addTo(this.map);

                // Fit map to route bounds with padding
                const bounds = L.latLngBounds([
                    [pickupCoords.lat, pickupCoords.lng],
                    [deliveryCoords.lat, deliveryCoords.lng]
                ]);
                this.map.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 14
                });

                console.log('✅ Route drawn successfully');
            } else {
                console.warn('⚠️ No route found in OSRM response');
            }

        } catch (error) {
            console.error('❌ Error drawing route:', error);
        }
    }

    // Clear existing route and markers
    clearRoute() {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
        if (this.pickupMarker) {
            this.map.removeLayer(this.pickupMarker);
            this.pickupMarker = null;
        }
        if (this.deliveryMarker) {
            this.map.removeLayer(this.deliveryMarker);
            this.deliveryMarker = null;
        }
    }

    // Show map container
    show() {
        if (this.containerWrapper) {
            this.containerWrapper.style.display = 'block';

            // Invalidate size to fix Leaflet rendering issues
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
        }
    }

    // Hide map container
    hide() {
        if (this.containerWrapper) {
            this.containerWrapper.style.display = 'none';
        }
    }

    // Destroy map instance
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}
