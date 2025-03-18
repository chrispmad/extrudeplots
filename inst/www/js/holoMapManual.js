// ----------------------------------------------------------
// IMPORTS
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
//import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
const fileLoader = new THREE.FileLoader();
// Access shiny.min.js from the parent window (the Shiny app)
const ShinyApp = window.parent.Shiny;

// -----------------------------------------------
// SETTINGS

// -----------------------------------------------
// FUNCTIONS
// Get iframe's unique ID from URL parameters
function get_id(){
  let url = window.location.href;
  return url.split("id=")[1];
}

let outputId = get_id();

function setHSLColor(z, s = 50, l = 50) {
	const h = Math.floor(z * 36); // Hue: 0 to 360 degrees
	return `hsl(${h}, ${s}%, ${l}%)`;
}

function onWindowResize() {

	const canvasWidth = window.innerWidth;
	const canvasHeight = window.innerHeight;

	renderer.setSize( canvasWidth, canvasHeight );

	camera.aspect = canvasWidth / canvasHeight;
	if(canvasWidth < canvasHeight){
		camera.fov = 50 * (canvasHeight / canvasWidth);
	}
	camera.updateProjectionMatrix();
	renderer.setAnimationLoop( animate );
}

// ----------------------------------------------------------
// THREE.JS OBJECTS
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbfe3dd );
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const gui = new GUI();
camera.position.set( 0, -250, 200.0 );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
const container = document.getElementById( 'container' );
container.appendChild( renderer.domElement );
const material = new THREE.MeshPhongMaterial({ 
	//color: 0x232020, // black
	//color: 0x15177a, // purple
	color: 0x272629, // dark grey
	side: THREE.DoubleSide,
	alphaToCoverage: true,
	shininess: 5,            // Shiny surface
	//specular: 0x232020,        // Subtle specular highlights
	specular: 0xc2c2c2,        // light grey specular light
	reflectivity: 1
 });
const cellSize = 0.25;

// Add mouse controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0.5, 0 );
controls.update();
controls.enablePan = true;
controls.enableDamping = true;

// Add lights!
const light = new THREE.HemisphereLight( 0xFFFFFF, 0x080808, 1.5 );
light.position.set( 30, 30, 30 );
light.castShadow = true; // default false
//scene.add( light );
// const directional_light_colour = '0xFFFFC5' // cream coloured light
//const directional_light_colour = '0xd2c5d9' // very light purple light
const directional_light_colour = '0xf2f1e6' // extremely light yellow light
const directionalLight = new THREE.DirectionalLight(directional_light_colour, 1);
directionalLight.position.set(20, 20, 30);
scene.add(directionalLight);
// ----------------------------------------------------------
// Variables and parameters
var Rotate = false;
var cols = [];
var rows = [];
var vert_z_container = Array;
var vert_z_frozen = Array;
let waveMap;
const shapes = [];
const params = {
	Rotate: false,
	Reset_Camera: function () {
		camera.position.set( 0, -250, 200.0 );
		controls.target.set( 0, 0.5, 0 );
		controls.update();
		shapes.forEach(shape => {
            shape.rotation.z = 0;
        })
	} ,
};

// ----------------------------------------------------------
// Resize canvas when window is resized!
window.addEventListener('resize', onWindowResize);

// GUI interactibility
gui.add( params, "Rotate" ).onChange( function () {
	// Toggle Rotate between TRUE and FALSE
	Rotate = !Rotate;
	// Reset animation loop.
	//renderer.setAnimationLoop( animate );
} );
gui.add( params, "Reset_Camera" );
gui.open();

// -----------------------------------------------------
// This whole section reads in a geojson file that describes a MULTIPOLYGON
// and adds each polygon to the shapes array to be visualized.
// ShinyApp below was just Shiny
//ShinyApp.addCustomMessageHandler("geojsonData_" + outputId, function(message) {

fetch("van_matrix.json")
  .then(response => response.json())
  .then(mdata => {
	mdata = JSON.parse(mdata)
	rows = mdata.length
	cols = mdata[0].length

	const geometry = new THREE.PlaneGeometry(cols, rows, cols - 1, rows - 1);

	//waveMap = Array(rows).fill().map(() => Array(cols).fill(-1));
	//waveMap[0][0] = 1; // First frame

	//for (let i = 2; i <= cols; i++) { // `i` corresponds to the frame number
	//	for (let r = 0; r < rows; r++) {
	//		for (let c = 0; c < cols; c++) {
	//			if (waveMap[r][c] == -1) { // Only assign if not set
	//				// Check if this cell is adjacent to a cell with wave number (i-1)
	//				if (
	//					(r > 0 && waveMap[r - 1][c] == i - 1) ||  // Above
	//					(r < rows - 1 && waveMap[r + 1][c] == i - 1) ||  // Below
	//					(c > 0 && waveMap[r][c - 1] == i - 1) ||  // Left
	//					(c < cols - 1 && waveMap[r][c + 1] == i - 1)  // Right
	//				) {
	//					waveMap[r][c] = i;
	//				}
	//			}
	//		}
	//	}
	//}

	vert_z_container = Array(geometry.attributes.position.array);
	vert_z_frozen = Array(geometry.attributes.position.array);

	const vertices = geometry.attributes.position.array;

	// Loop over rows...
	for(let r = 0; r < rows; r++){
		// And loop over columns...
		for(let c = 0; c < cols-1; c++){
			// Set height to 1 for all vertices initially.
			vertices[(r*cols + c)*3 + 2] = 1;
			//vertices[(r*cols + c)*3 + 2] = mdata[r][c] / 5;

			// Save the 'real' height to this array of heights
			vert_z_container[(r*cols + c)] = mdata[r][c] / 5;
			vert_z_frozen[(r*cols + c)] = true;
		}
	}

	geometry.computeVertexNormals();
  
	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);
	shapes.push(mesh)

	renderer.setAnimationLoop( animate );
	}
);

let currentRow = 0;
let heights_need_updating = true;
let wave_length = 5;

function updateHeights() {
	// This function cycles through all rows, updating heights as it goes in a wa
    if (currentRow >= rows + wave_length) {
		heights_need_updating = false;
		console.log('all height info has been applied.')
        return; // Stop when all rows are done
    }

	// We just have one shape, so maybe not necessary to map it.
    shapes.forEach(shape => {
		// Diminished leading leading wave
		if(currentRow <= rows){
			console.log("correcting wave number is " + (currentRow + wave_length))
			// Loop through all columns.
			for (let c = 0; c < cols - 1; c++) {
				// Find and apply wave leading edge
				let cell_index = (currentRow + wave_length) * cols + c
				
				let cell_z_index = cell_index * 3 + 2; // Z index
				if(cell_index >= 0){
					shape.geometry.attributes.position.array[cell_z_index] = 0.5 * vert_z_container[cell_index];
				}
			}
		}
		// Exaggerated leading wave
		if(currentRow <= rows){
			// Loop through all columns.
			for (let c = 0; c < cols - 1; c++) {
				// Find and apply wave leading edge
				let cell_index = currentRow * cols + c
				let cell_z_index = cell_index * 3 + 2; // Z index
				shape.geometry.attributes.position.array[cell_z_index] = 1.3 * vert_z_container[cell_index];
			}
		}	
		// Correcting wave
		if(currentRow <= rows + wave_length){
			console.log("correcting wave number is " + (currentRow - wave_length))
			// Loop through all columns.
			for (let c = 0; c < cols - 1; c++) {
				// Find and apply wave leading edge
				let cell_index = (currentRow - wave_length) * cols + c
				
				let cell_z_index = cell_index * 3 + 2; // Z index
				if(cell_index >= 0){
					shape.geometry.attributes.position.array[cell_z_index] = 1 * vert_z_container[cell_index];
				}
			}
		}
        shape.geometry.attributes.position.needsUpdate = true;
        shape.geometry.computeVertexNormals();
    });

    currentRow++; // Move to next row
	console.log("current row is: " + currentRow)
}

// Animate function - this is used to visualize the whole scene.
function animate() {
    if (Rotate) {
        shapes.forEach(shape => {
            shape.rotation.z += 0.005;
        });
    }

	console.log("heights_need_updating: " + heights_need_updating)
	if(heights_need_updating){
		updateHeights()
	}

	//if(!Rotate){
	//	requestAnimationFrame(animate);
	//}
    renderer.render(scene, camera);
	//requestAnimationFrame(animate);
}

// Start both animations
//animate();

animate(); // Start the animation

// Enable initial state of the animation described above.
//renderer.setAnimationLoop( animate );
