/* app.js */

// Configuration
const GLOBE_RADIUS = 5;
const ROTATION_SPEED = 0.0015; // Slow rotation speed on Y axis
const LINE_COLOR = 0x00ff66;   // Vibrant neon green
const GRID_COLOR = 0x00441b;   // Faint forest green for the ocean grid
const INNER_COLOR = 0x000502;  // Dark green/black for the depth-mask sphere

// Select the container from the DOM using querySelector (as requested)
const container = document.querySelector('#canvas-container');

// 1. Initialize Scene, Camera, and Renderer
const scene = new THREE.Scene();

// Lower FOV (30) reduces perspective distortion at the screen boundaries
const camera = new THREE.PerspectiveCamera(
    30, 
    container.clientWidth / container.clientHeight || window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
// Set size initially
renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
container.appendChild(renderer.domElement);

// 2. Add OrbitControls for mouse interaction (drag to rotate, scroll to zoom)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false; // Disable panning to keep the globe centered
controls.minDistance = 10;
controls.maxDistance = 35;

// 3. Create the main Globe Group
const globeGroup = new THREE.Group();
// Tilt the Earth slightly (axial tilt of ~23.5 degrees) for a more realistic rotation
globeGroup.rotation.z = 0.41; 
scene.add(globeGroup);

// 4. Create a semi-opaque inner sphere
const innerGeo = new THREE.SphereGeometry(GLOBE_RADIUS - 0.02, 45, 45);
const innerMat = new THREE.MeshBasicMaterial({
    color: INNER_COLOR,
    transparent: true,
    opacity: 0.8, // 80% opaque to give a holographic feel while blocking the back lines
    depthWrite: false
});
const innerMesh = new THREE.Mesh(innerGeo, innerMat);
globeGroup.add(innerMesh);

// 5. Add a faint latitude/longitude grid (representing the oceans and general shape)
const gridGeo = new THREE.SphereGeometry(GLOBE_RADIUS - 0.01, 36, 18);
const gridMat = new THREE.MeshBasicMaterial({
    color: GRID_COLOR,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
});
const gridMesh = new THREE.Mesh(gridGeo, gridMat);
globeGroup.add(gridMesh);

// Helper function: Convert geographic (Lat/Lon) coordinates to 3D Cartesian coordinates
function latLonToVector3(lat, lon, radius) {
    const phi = lat * Math.PI / 180;
    // Direct mapping to theta (no subtraction) corrects the mirroring effect
    const theta = lon * Math.PI / 180;
    
    const x = radius * Math.cos(phi) * Math.sin(theta);
    const y = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * Math.cos(theta);
    
    return new THREE.Vector3(x, y, z);
}

// ==========================================
// THERMONUCLEAR WAR SIMULATION SYSTEMS
// ==========================================

// Factions, Silos, and Target Lists (Lat / Lon coordinates)
const FACTIONS = {
    USA: {
        name: "UNITED STATES",
        silos: [
            { name: "Washington D.C.", lat: 38.9, lon: -77.0 },
            { name: "Minot AFB (North Dakota)", lat: 48.2, lon: -101.3 },
            { name: "Malmstrom AFB (Montana)", lat: 47.5, lon: -111.1 },
            { name: "F.E. Warren AFB (Wyoming)", lat: 41.1, lon: -104.8 },
            { name: "Los Angeles", lat: 34.05, lon: -118.24 },
            { name: "New York", lat: 40.7, lon: -74.0 },
            { name: "Seattle", lat: 47.6, lon: -122.3 }
        ],
        targets: ["RUSSIA", "CHINA"]
    },
    RUSSIA: {
        name: "SOVIET UNION",
        silos: [
            { name: "Moscow", lat: 55.75, lon: 37.62 },
            { name: "Novosibirsk", lat: 55.0, lon: 82.9 },
            { name: "St. Petersburg", lat: 59.9, lon: 30.3 },
            { name: "Vladivostok", lat: 43.1, lon: 131.9 },
            { name: "Chelyabinsk", lat: 55.16, lon: 61.4 },
            { name: "Dombarovsky Silo Field", lat: 51.0, lon: 59.8 }
        ],
        targets: ["USA", "EUROPE"]
    },
    CHINA: {
        name: "CHINA",
        silos: [
            { name: "Beijing", lat: 39.9, lon: 116.4 },
            { name: "Urumqi", lat: 43.8, lon: 87.6 },
            { name: "Shanghai", lat: 31.2, lon: 121.4 },
            { name: "Guangzhou", lat: 23.1, lon: 113.2 }
        ],
        targets: ["USA"]
    },
    EUROPE: {
        name: "EUROPE",
        silos: [
            { name: "London", lat: 51.5, lon: -0.1 },
            { name: "Paris", lat: 48.8, lon: 2.35 },
            { name: "Brussels", lat: 50.85, lon: 4.35 },
            { name: "Berlin", lat: 52.5, lon: 13.4 }
        ],
        targets: ["RUSSIA"]
    },
    AFRICA: {
        name: "AFRICA",
        silos: [
            { name: "Cairo", lat: 30.0, lon: 31.2 },
            { name: "Johannesburg", lat: -26.2, lon: 28.0 }
        ],
        targets: ["EUROPE", "USA"]
    },
    SOUTH_AMERICA: {
        name: "SOUTH AMERICA",
        silos: [
            { name: "Rio de Janeiro", lat: -22.9, lon: -43.1 },
            { name: "Buenos Aires", lat: -34.6, lon: -58.3 }
        ],
        targets: ["USA"]
    }
};

const activeMissiles = [];
const activeBlasts = [];

// Missile Class (Handles ballistic arc calculations and rendering)
class Missile {
    constructor(startLat, startLon, endLat, endLon, color = 0xffffff) {
        this.startVec = latLonToVector3(startLat, startLon, GLOBE_RADIUS);
        this.endVec = latLonToVector3(endLat, endLon, GLOBE_RADIUS);
        this.endLat = endLat;
        this.endLon = endLon;
        this.progress = 0;
        this.speed = 0.007 + Math.random() * 0.004; // Random speeds to desynchronize arrivals

        // Calculate angular distance to scale the parabolic peak altitude
        const angle = this.startVec.angleTo(this.endVec);
        this.maxAltitude = GLOBE_RADIUS * 0.25 * angle; // Max height is proportional to distance

        // Create the warhead (moving point, halved in size)
        const dotGeo = new THREE.SphereGeometry(0.03, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.warhead = new THREE.Mesh(dotGeo, dotMat);
        globeGroup.add(this.warhead);

        // Pre-generate the arc path points for rendering the faint trail
        this.numSegments = 45;
        this.pathPoints = [];
        for (let i = 0; i <= this.numSegments; i++) {
            this.pathPoints.push(this.getPositionAtProgress(i / this.numSegments));
        }

        const pathGeo = new THREE.BufferGeometry().setFromPoints(this.pathPoints);
        const pathMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2
        });
        this.trail = new THREE.Line(pathGeo, pathMat);
        globeGroup.add(this.trail);

        this.updatePosition();
    }

    // Mathematical formula for the 3D ballistic arc trajectory
    getPositionAtProgress(t) {
        // Interpolate along the surface of the sphere
        const pointOnSphere = new THREE.Vector3().lerpVectors(this.startVec, this.endVec, t);
        pointOnSphere.normalize();

        // Parabolic altitude function: altitude = maxAltitude * sin(t * pi)
        const altitude = this.maxAltitude * Math.sin(t * Math.PI);

        // Displace position outwards from the center of the sphere by the altitude amount
        return pointOnSphere.multiplyScalar(GLOBE_RADIUS + altitude);
    }

    updatePosition() {
        const pos = this.getPositionAtProgress(this.progress);
        this.warhead.position.copy(pos);
    }

    update() {
        this.progress += this.speed;
        if (this.progress >= 1.0) {
            this.impact();
            return false; // Complete, flag for removal
        }
        this.updatePosition();
        return true; // Active
    }

    impact() {
        // Clean up WebGL resources to prevent memory leaks
        globeGroup.remove(this.warhead);
        globeGroup.remove(this.trail);
        this.warhead.geometry.dispose();
        this.warhead.material.dispose();
        this.trail.geometry.dispose();
        this.trail.material.dispose();

        // Spawn nuke blast at target coordinates
        activeBlasts.push(new Blast(this.endLat, this.endLon));
    }
}

// Blast Class (Handles nuke blast filled expanding circle)
class Blast {
    constructor(lat, lon) {
        this.progress = 0;
        // Max radius is halved to match request (0.25 to 0.45 range)
        this.maxRadius = (0.5 + Math.random() * 0.4) * 0.5;
        this.speed = 0.015; // Speed of expansion

        // 3D positioning tangent to the surface of the sphere
        const pos = latLonToVector3(lat, lon, GLOBE_RADIUS + 0.01);

        // Filled circle geometry
        this.geometry = new THREE.CircleGeometry(1.0, 32);
        this.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(pos);
        
        // Orient the flat circle tangent to the sphere surface by aligning its Z axis towards center
        const normal = pos.clone().normalize();
        this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

        globeGroup.add(this.mesh);
    }

    update() {
        this.progress += this.speed;
        if (this.progress >= 1.0) {
            this.destroy();
            return false; // Complete, flag for removal
        }

        // Expand circle and fade out opacity
        const scale = this.progress * this.maxRadius;
        this.mesh.scale.set(scale, scale, 1);
        this.material.opacity = 0.9 * (1.0 - Math.pow(this.progress, 2)); // Dynamic fade curve

        return true; // Active
    }

    destroy() {
        globeGroup.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
    }
}

// Conflict Director / DEFCON Manager
class WarSimulationManager {
    constructor() {
        this.active = true;
        this.defcon = 5;
        this.cycleTime = 0;
        this.lastLaunchTime = 0;
    }

    update(time) {
        if (!this.active) return;
        this.cycleTime += 0.016; // Approx delta-time

        // 1. DEFCON 5: Scanning & minor tension (0 to 10 seconds)
        // Launches occasional isolated single missiles
        if (this.defcon === 5) {
            if (this.cycleTime > 10) {
                this.defcon = 4;
                console.log("DEFCON STATUS INCREASED: DEFCON 4");
            } else if (time - this.lastLaunchTime > 3500) {
                this.launchRandomSilo();
                this.lastLaunchTime = time;
            }
        }
        // 2. DEFCON 4: Regional skirmishes (10 to 20 seconds)
        // Launches small batches of retaliatory missiles
        else if (this.defcon === 4) {
            if (this.cycleTime > 20) {
                this.defcon = 3;
                console.log("DEFCON STATUS INCREASED: DEFCON 3");
            } else if (time - this.lastLaunchTime > 2200) {
                this.launchSalvo(2);
                this.lastLaunchTime = time;
            }
        }
        // 3. DEFCON 3: Alliance mobilization (20 to 30 seconds)
        else if (this.defcon === 3) {
            if (this.cycleTime > 30) {
                this.defcon = 2;
                console.log("DEFCON STATUS INCREASED: DEFCON 2");
            } else if (time - this.lastLaunchTime > 1500) {
                this.launchSalvo(4);
                this.lastLaunchTime = time;
            }
        }
        // 4. DEFCON 2: Impending global exchange (30 to 40 seconds)
        else if (this.defcon === 2) {
            if (this.cycleTime > 40) {
                this.defcon = 1;
                console.log("DEFCON STATUS INCREASED: DEFCON 1 - MAXIMUM READINESS");
            } else if (time - this.lastLaunchTime > 1000) {
                this.launchSalvo(8);
                this.lastLaunchTime = time;
            }
        }
        // 5. DEFCON 1: Total Global Thermonuclear War (40 to 65 seconds)
        // Massive launch salvos, complete fire exchange
        else if (this.defcon === 1) {
            if (this.cycleTime > 65) {
                // Cool down / Reset
                this.defcon = 5;
                this.cycleTime = 0;
                this.lastLaunchTime = time;
                console.log("SIMULATION CYCLE RESET: DEFCON 5");
            } else if (time - this.lastLaunchTime > 600) {
                this.launchSalvo(12);
                this.lastLaunchTime = time;
            }
        }
    }

    launchRandomSilo() {
        // Pick random attacking faction
        const keys = Object.keys(FACTIONS);
        const attackerKey = keys[Math.floor(Math.random() * keys.length)];
        const attacker = FACTIONS[attackerKey];

        // Pick random target faction
        const targetFactionKey = attacker.targets[Math.floor(Math.random() * attacker.targets.length)];
        const targetFaction = FACTIONS[targetFactionKey];

        if (!attacker || !targetFaction) return;

        // Get random launch silo and target city
        const silo = attacker.silos[Math.floor(Math.random() * attacker.silos.length)];
        const target = targetFaction.silos[Math.floor(Math.random() * targetFaction.silos.length)];

        // Green-yellow paths for alliance, red-orange paths for hostiles
        const color = attackerKey === "USA" || attackerKey === "EUROPE" ? 0x00ffaa : 0xff4400;

        activeMissiles.push(new Missile(silo.lat, silo.lon, target.lat, target.lon, color));
    }

    launchSalvo(count) {
        for (let i = 0; i < count; i++) {
            // Slight delay spreads nuke trails
            setTimeout(() => {
                if (this.defcon > 1 || this.cycleTime < 65) {
                    this.launchRandomSilo();
                }
            }, i * 150);
        }
    }
}

const warManager = new WarSimulationManager();

// 6. Fetch and Render the Coastlines
fetch('./coastlines.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.features) {
            drawCoastlines(data.features);
        } else {
            console.error("Invalid GeoJSON data format.");
        }
    })
    .catch(error => {
        console.error("Error loading coastlines GeoJSON:", error);
    });

function drawCoastlines(features) {
    const lineMaterial = new THREE.LineBasicMaterial({
        color: LINE_COLOR,
        transparent: true,
        opacity: 0.95
    });

    const glowMaterial = new THREE.LineBasicMaterial({
        color: LINE_COLOR,
        transparent: true,
        opacity: 0.25
    });

    features.forEach(feature => {
        const type = feature.geometry.type;
        const coordinates = feature.geometry.coordinates;

        const drawSegment = (coords) => {
            const points = [];
            const glowPoints = [];
            
            coords.forEach(coord => {
                const lon = coord[0];
                const lat = coord[1];
                
                points.push(latLonToVector3(lat, lon, GLOBE_RADIUS));
                glowPoints.push(latLonToVector3(lat, lon, GLOBE_RADIUS * 1.006));
            });

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            globeGroup.add(line);

            const glowGeometry = new THREE.BufferGeometry().setFromPoints(glowPoints);
            const glowLine = new THREE.Line(glowGeometry, glowMaterial);
            globeGroup.add(glowLine);
        };

        if (type === 'LineString') {
            drawSegment(coordinates);
        } else if (type === 'MultiLineString') {
            coordinates.forEach(coords => drawSegment(coords));
        }
    });
}

// Dynamic resize function to handle CSS layout adjustments and prevent aspect ratio distortion
function resizeCanvasToDisplaySize() {
    const canvas = renderer.domElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Check if the canvas drawing buffer size differs from the display size
    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, true);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

// 7. Render Animation Loop
function animate(time) {
    requestAnimationFrame(animate);

    // Auto-correct any aspect ratio drift before rendering
    resizeCanvasToDisplaySize();

    // Slowly rotate the globe on the Y axis
    globeGroup.rotation.y += ROTATION_SPEED;

    // Update war simulation manager state (DEFCON timer and launches)
    warManager.update(time);

    // Update and animate active missiles
    for (let i = activeMissiles.length - 1; i >= 0; i--) {
        const isActive = activeMissiles[i].update();
        if (!isActive) {
            activeMissiles.splice(i, 1);
        }
    }

    // Update and animate active shockwave rings
    for (let i = activeBlasts.length - 1; i >= 0; i--) {
        const isActive = activeBlasts[i].update();
        if (!isActive) {
            activeBlasts.splice(i, 1);
        }
    }

    // Update controls (required for damping)
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate(0);

// 8. Handle Window Resizing
window.addEventListener('resize', () => {
    // Rely on the animate loop's resizeCanvasToDisplaySize for the actual resize,
    // but trigger camera updates explicitly for responsive smoothness.
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, true);
});
