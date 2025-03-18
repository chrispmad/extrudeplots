// ----------------------------------------------------------
// IMPORTS
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
// Access shiny.min.js from the parent window (the Shiny app)
const ShinyApp = window.parent.Shiny;

// -----------------------------------------------
// SETTINGS
// Extrude settings - change these to alter how tall etc. the shapes are.
const extrudeSettings = {
	steps: 2,
	depth: 1.5,
	bevelEnabled: true,
	bevelThickness: 0.5,
	bevelSize: 0.05,
	bevelOffset: 0,
	bevelSegments: 0
 };

const anim_steps = 50;

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

function updateHeights() {
	growth_rates = []; // How quickly should each shape extrude / shrink?
	shapes.forEach((shape, i) => {
		const growth_rate = (new_heights[i] - shape.z) / anim_steps;
		growth_rates.push(growth_rate);
	})
	new_heights_to_apply = true;
}

// Animate function - this is used to visualize the whole scene.
function animate() {
	// If the rotation animation is toggled TRUE, rotate shapes slowly.
	if(Rotate){
		shapes.forEach(shape => {
			shape.rotation.x += 0.00;
			shape.rotation.y += 0.00;
			shape.rotation.z += 0.004;
		})
		north_n_Mesh.rotation.z += 0.004;
		arrowMesh.rotation.z += 0.004;
	}

	// Test to see if the sum of the new heights array is equal to 0 (i.e., no height changes to apply.)
	const new_heights_sum = new_heights.reduce((acc, curr) => acc + curr, 0);
	const old_heights_sum = shapes.reduce((acc, curr) => acc + curr.z, 0);
	new_heights_to_apply = new_heights_sum != old_heights_sum;

	// If new heights have been calculated, adjust heights (and colours if transparent is true) of meshes over time
	// until the deltas have been reduced to 0.
	if(new_heights_to_apply == true){
		shapes.forEach((shape, i) => {
			if(shape.label != 'BASE'){
				// calculate delta height for this shape
				const height_delta = new_heights[i] - shape.z;

				if(Math.abs(height_delta) > 0){
					// Are we within 0.001 of the new height? If so, set old_z to new height and be done with animation.
					if(Math.abs(height_delta) <= 0.01){
						shape.z = new_heights[i]; // Hard-code shape.z to be the new height
					} else {
					  // Apply gradual height transformation
						shape.scale.z += 0.10 * growth_rates[i];
						shape.position.z += 0.1 * growth_rates[i];
						shape.z += growth_rates[i];
					}
				}
			}
		})
	}
	// Pass the scene with these animation options to the renderer.
	renderer.render( scene, camera );
}

function onWindowResize() {

	const canvasWidth = window.innerWidth;
	const canvasHeight = window.innerHeight;

	renderer.setSize( canvasWidth, canvasHeight );

	camera.aspect = canvasWidth / canvasHeight;
	if(canvasWidth < canvasHeight){
		camera.fov = 30 * (canvasHeight / canvasWidth);
	}
	camera.updateProjectionMatrix();
	renderer.setAnimationLoop( animate );
}

// ----------------------------------------------------------
// THREE.JS OBJECTS
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbfe3dd );
const camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 10, 100 );
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const gui = new GUI();
camera.position.set( 0, -30, 50.0 );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
const container = document.getElementById( 'container' );
container.appendChild( renderer.domElement );
const svg_loader = new SVGLoader();

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
scene.add( light );
const directionalLight = new THREE.DirectionalLight(0xFFFFC5, 3);
directionalLight.position.set(5, 5, 30);
scene.add(directionalLight);
// ----------------------------------------------------------
// Variables and parameters
var Rotate = false;
var new_heights_to_apply = false;
let new_heights = [0];
let growth_rates = [0];
const shapes = [];
const params = {
	Rotate: false
};

// ----------------------------------------------------------
// Resize canvas when window is resized!
window.addEventListener('resize', onWindowResize);

// GUI interactibility
gui.add( params, "Rotate" ).onChange( function () {
	// Toggle Rotate between TRUE and FALSE
	Rotate = !Rotate;
	// Reset animation loop.
	renderer.setAnimationLoop( animate );
} );

gui.open();

// -----------------------------------------------------
// This whole section reads in a geojson file that describes a MULTIPOLYGON
// and adds each polygon to the shapes array to be visualized.
// ShinyApp below was just Shiny
ShinyApp.addCustomMessageHandler("geojsonData_" + outputId, function(message) {

    if (get_id() == message.iframeID){

    // Loop over each feature in the GeoJSON (which corresponds to a polygon or multipolygon)
    message.data.features.forEach((feature) => {
      // Check if the feature is a polygon or multipolygon
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {

		  var polygons = [feature];
        // Loop through each polygon in the feature(for MultiPolygon, multiple polygons)
      polygons.forEach(polygon => {
        const shape = new THREE.Shape();
        const label = polygon.properties.label;
  			const height = 1;
  			if(polygon.properties.label == 'BASE'){
  				extrudeSettings['depth'] = 0.1;
  			} else {
  			  // In initial rendering, set all to default value of 1.
				  extrudeSettings['depth'] = height;
			  }
			  var polygon_coords = polygon.geometry.coordinates
			  // Create the shape by moving to the first point and drawing lines between points
  			polygon_coords[0].forEach((point, index) => {
  				const [x, y] = point;
  				if (index === 0) {
  				shape.moveTo(x + 123.6651, y - 53.79805);
  				} else {
  				shape.lineTo(x + 123.6651, y - 53.79805);
  				}
  			});

  			// Close the shape by connecting the last point to the first point
  			shape.lineTo(polygon_coords[0][0][0] + 123.6651, polygon_coords[0][0][1] - 53.79805);

  			// Apply extrude to shape.
  			var extruded_shape = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  			let my_color
  			if(polygon.properties.label == 'BASE'){
  				my_color = setHSLColor(0, 0, 0);
  			} else {
  				my_color = setHSLColor(height);
  			}

  			const shape_material = new THREE.MeshPhongMaterial( {
  				color: my_color,
  				side: THREE.DoubleSide,
  				alphaToCoverage: true,
  				shininess: 50,            // Shiny surface
  				specular: 0x555555,        // Subtle specular highlights
  				reflectivity: 0.4          // Reflectivity (higher means more reflective)
  			} );

  			// convert extruded shape to mesh with the material described above.
  			const mesh = new THREE.Mesh(extruded_shape, shape_material);

  			mesh['label'] = label; // Add label to the mesh's label slot.
  			//mesh['z'] = polygon.properties.height; // Add Z dimension to the mesh's z slot.
  			mesh['z'] = height; // Add Z dimension to the mesh's z slot.
  			new_heights.push(mesh.z); // Add this Z to the new_heights for the first, initial extrude rendering.
  			//mesh['old_z'] = height; // Add Z dimension to the mesh's z slot.

  			// Add that mesh to the scene to be visualized.
  			scene.add(mesh);
  			// Also push the shape into the array so we have access to these data for e.g. mouse-over effects!
  			shapes.push(mesh);
        });
      }
    });
}
});

// ShinyApp below was just Shiny
ShinyApp.addCustomMessageHandler("heightData_" + outputId, function(message) {

    if (get_id() == message.iframeID){
      new_heights = message.data['height'];
      updateHeights()
    }
});
// Enable initial state of the animation described above.
renderer.setAnimationLoop( animate );
