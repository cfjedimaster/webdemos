// Setup basic Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Setup camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Setup renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Create the Black Hole (Event Horizon) ---
const blackHoleGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
scene.add(blackHole);

// --- Create the Green Grid Funnel ---
const gridRadius = 50;
const gridSegments = 100;
// We'll use a polar-like approach mapped onto a Plane for a nice grid
const gridGeometry = new THREE.PlaneGeometry(gridRadius * 2, gridRadius * 2, gridSegments, gridSegments);

// Manipulate vertices to form a funnel
const positionAttribute = gridGeometry.attributes.position;
for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    
    // Distance from the center (0,0) in the local flat plane
    const distance = Math.sqrt(x * x + y * y);
    
    // Calculate a z-depth that plunges sharply near the center
    // Function: z = -scale / (distance + offset)
    const d = Math.max(0.1, distance); // prevent division by exactly zero
    const z = -20 / (d * 0.4 + 0.1) + 2; // Offset slightly so outskirts are near z=0
    
    positionAttribute.setZ(i, z);
}

gridGeometry.computeVertexNormals();

// Create the wireframe material
const gridMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, 
    wireframe: true,
    transparent: true,
    opacity: 0.8
});

const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
// Rotate so it lays "flat" and the funnel goes down the Y axis
gridMesh.rotation.x = -Math.PI / 2;
scene.add(gridMesh);

// Optional: Give it a slight angle to match the reference better overall
scene.rotation.z = 0.2;


// --- Camera Animation ---
// We want to fly in and then circle around
let time = 0;
const clock = new THREE.Clock();

// Initial camera state
const flyInDuration = 5.0; // seconds to reach orbit
const orbitRadius = 15;
const orbitHeight = 5;

// Initial position far away
camera.position.set(0, 20, 40);

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    time += delta;

    // Camera animation logic
    if (time < flyInDuration) {
        // Interpolate over fly-in period
        const t = time / flyInDuration;
        // Smooth step
        const smoothT = t * t * (3 - 2 * t);
        
        // Target orbit position at t=1: 
        // x = 0, y = orbitHeight, z = orbitRadius
        const startPos = new THREE.Vector3(0, 30, 40);
        const endPos = new THREE.Vector3(0, orbitHeight, orbitRadius);
        
        camera.position.lerpVectors(startPos, endPos, smoothT);
    } else {
        // In orbit
        const orbitTime = time - flyInDuration;
        const speed = 0.3; // radians per second
        
        camera.position.x = Math.sin(orbitTime * speed) * orbitRadius;
        camera.position.z = Math.cos(orbitTime * speed) * orbitRadius;
        // Keep height steady or slightly bob it
        camera.position.y = orbitHeight + Math.sin(orbitTime * 0.5) * 1.5;
    }

    // Always look at the center of the black hole
    camera.lookAt(0, -2, 0);

    // Slowly rotate the grid itself to give an accretion disc feeling
    gridMesh.rotation.z -= delta * 0.05;

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();
