// ----------------------------------------------------------
// IMPORTS
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';

console.log("Is anyone out there?")
//const data_path = "C:\\Users\\CMADSEN\\AppData\\Local\\Temp\\RtmpGq8npP/user_dat.geojson"

// -----------------------------------------------
// SETTINGS
// Extrude settings - change these to alter how tall etc. the shapes are.
const extrudeSettings = {
	steps: 2,
	depth: 0.5,
	bevelEnabled: true,
	bevelThickness: 0.5,
	bevelSize: 0.05,
	bevelOffset: 0,
	bevelSegments: 1
 };

const anim_steps = 50;
const max_height = 10;

// -----------------------------------------------
// FUNCTIONS
function setHSLColor(z, s = 50, l = 50) {
	const h = Math.floor(z * 36); // Hue: 0 to 360 degrees
	//const s = Math.floor(Math.random() * 50) + 50; // Saturation: 50 to 100%
	//s = 50; // Saturation: 50 to 100%
	//const l = Math.floor(Math.random() * 50) + 25; // Lightness: 25 to 75%
	// l = 50; // Lightness: 25 to 75%
	return `hsl(${h}, ${s}%, ${l}%)`;
  }

function updateHeights() {
	//new_heights = [];
	growth_rates = []; // How quickly should each shape extrude / shrink?
	//const heights_need_scaling = false;
	//const largest_height = 0;
	// We have an array of meshes that were created when the data was loaded. Try to pull Z dimension from these.
	shapes.forEach((shape, i) => {
		//new_heights.push(shape.z);

		//const growth_rate = (shape.z - shape.old_z) / anim_steps;
		const growth_rate = (new_heights[i] - shape.z) / anim_steps;
		growth_rates.push(growth_rate);
		//if(shape.z > 10){
			//heights_need_scaling = true;
			//largest_height = shape.z;
		//}
	})
	//console.log("new heights are " + new_heights)
	new_heights_to_apply = true;
	// Check if the new heights are of a scale that passes 10; if so, adjust so that the max is 10.
	//if(heights_need_scaling){
	//	new_heights.forEach(new_height => {
	//		largest_height / 10
	//	});
	//}
}

// Animate function - this is used to visualize the whole scene.
function animate() {
	// If the rotation animation is toggled TRUE, rotate shapes slowly.
	if(Rotate){
		shapes.forEach(shape => {
			shape.rotation.x += 0.00;
			shape.rotation.y += 0.00;
			shape.rotation.z += 0.002;
		})
		north_n_Mesh.rotation.z += 0.002;
		arrowMesh.rotation.z += 0.002;
	}

  // This is a weird thing to add here, but check to see if data has been
  // sent from Shiny to Main.js; if it has, update a Shiny input.
  //if(shapes != []){
//  document.addEventListener("DOMContentLoaded", function() {
//    if (typeof Shiny !== "undefined") {
//        Shiny.setInputValue("geometryReceived", true, { priority: "event" });
//    } else {
//        console.error("Shiny is not loaded!");
//    }
//});
  //  console.log("Setting Shiny's input 'geometryReceived'")
  //  Shiny.setInputValue('geometryReceived', true, { priority: "event" });
  //}

	// Test to see if the sum of the new heights array is equal to 0 (i.e., no height changes to apply.)
	const new_heights_sum = new_heights.reduce((acc, curr) => acc + curr, 0);
	const old_heights_sum = shapes.reduce((acc, curr) => acc + curr.z, 0);
	new_heights_to_apply = new_heights_sum != old_heights_sum;

	// If new heights have been calculated, adjust heights and colours of meshes over time
	// until the deltas have been reduced to 0.
	if(new_heights_to_apply == true){
		shapes.forEach((shape, i) => {
			if(shape.label != 'BASE'){
				// calculate delta height for this shape
				const height_delta = new_heights[i] - shape.z;

				if(Math.abs(height_delta) > 0){
					// Are we within 0.001 of the new height? If so, set old_z to new height and be done with animation.
					if(Math.abs(height_delta) <= 0.01){
						shape.z = new_heights[i];
					} else {
						if(height_delta > 0.001){
							shape.scale.z += 0.10 * growth_rates[i];
							shape.position.z += 0.1 * growth_rates[i];
							shape.z += growth_rates[i];
						}
						if(height_delta < 0.001){
							shape.scale.z -= 0.10 * growth_rates[i];
							shape.position.z -= 0.1 * growth_rates[i];
							shape.z -= growth_rates[i];
						}
					}
					// Is this shape one that's being moused over by the user? If so, increase brightness of colour.
					if(shape.label == moused_shape){
						shape.material.color.set(setHSLColor(shape.z, 50, 75));
					} else {
						shape.material.color.set(setHSLColor(shape.z));
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
	//camera.fov =  200000/(canvasWidth * canvasHeight);
	camera.updateProjectionMatrix();

	renderer.setAnimationLoop( animate );
}

// Snag elements from HTML page
var info_table = document.getElementById('info_table');
var label_value = document.getElementById('label_value');
var field_value = document.getElementById('field_value');

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
//const loader = new FontLoader();
container.appendChild( renderer.domElement );

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
var moused_shape = "NA";
var Rotate = false;
var new_heights_to_apply = false;
let new_heights = [0];
let growth_rates = [0];
const shapes = [];
const params = {
	Rotate: false,
	update_heights: function() {
		updateHeights()
	}
};

// ----------------------------------------------------------
// Add document listeners.
document.addEventListener('pointermove', onPointerMove);
// Resize canvas when window is resized!
window.addEventListener( 'resize', onWindowResize );

// On mouse-over shapes, identify moused-over shape and update text label
function onPointerMove(e) {

	e.preventDefault();

	mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

	// Update position of info table.
	//info_table.style.top = e.clientY + 'px';
	//console.log('clientY is ' + e.clientY)
	//info_table.style.left = e.clientX + 'px';

	raycaster.setFromCamera( mouse, camera );

	const intersections = raycaster.intersectObjects( shapes, true );

	if ( intersections.length > 0 ) {
		const object = intersections[ 0 ].object;
		if (object.label != "BASE"){
			moused_shape = object.label;
			//field_name.innerText = "Region: ";
			label_value.innerText = moused_shape;
			field_value.innerText = object.z;
			// Adjust colour of that shape.
			shapes.forEach(shape => {
				if(shape.label == moused_shape){
					shape.material.color.set(setHSLColor(shape.old_z, 50, 75));
				} else {
					if(shape.label != "BASE"){
						shape.material.color.set(setHSLColor(shape.old_z));
					}
				}
			})
		}
	} else {
		field_value.innerText = " ";
		label_value.innerText = " ";
		shapes.forEach(shape => {
			if(shape.label != "BASE"){
				shape.material.color.set(setHSLColor(shape.old_z));
			}
		})
	}
}

// North Arrow
const arrowLength = 4; const arrowWidth = 0.5; const headSize = 1; const n_thick = 0.5;
const north_arrow = new THREE.Shape();
north_arrow.moveTo(10,6); // Move to NE extent of map.
north_arrow.lineTo(10,6 + arrowLength); // From bottom left to top left of shaft
north_arrow.lineTo(10 + arrowWidth,6 + arrowLength); // Top left to top right of shaft
north_arrow.lineTo(10 + arrowWidth,6); // Top right to bottom right of shaft
north_arrow.lineTo(10,6); // Close the rectangle
// Draw the arrowhead (triangle)
north_arrow.moveTo(10 + arrowWidth/2, 6 + arrowLength); // Starting point at the middle of the top side of the shaft
north_arrow.lineTo(10 - arrowWidth, 6 + arrowLength); // Left side of the arrowhead
north_arrow.lineTo(10 + arrowWidth/2, 6 + arrowLength + headSize); // Top of the arrowhead
north_arrow.lineTo(10 + arrowWidth*2, 6 + arrowLength); // Right side of the arrowhead
north_arrow.lineTo(10 + arrowWidth, 6 + arrowLength); // Close the triangle
//north_arrow.lineTo(10 + arrowWidth/2, 6 + arrowLength); // Close the triangle
// Create the N
const north_n = new THREE.Shape();
north_n.moveTo(10 - n_thick*2, 6.5);
north_n.lineTo(10 - n_thick*2, 9.5);
north_n.lineTo(10 - n_thick, 9.5);
north_n.lineTo(10 + n_thick*2, 7);
north_n.lineTo(10 + n_thick*2, 9.5);
north_n.lineTo(10 + n_thick*3, 9.5);
north_n.lineTo(10 + n_thick*3, 6.5);
north_n.lineTo(10 + n_thick*2, 6.5);
north_n.lineTo(10 - n_thick, 9);
north_n.lineTo(10 - n_thick, 6.5);
north_n.lineTo(10 - n_thick*2, 6.5);
// Define extrude settings (how thick the arrow is)
const arrow_extrudeSettings = {
  depth: 0.1,  // Thickness of the arrow
  bevelEnabled: false, // No bevels on the arrow
  curveSegments: 12
};
const north_n_extrudeSettings = {
	depth: 0.3,  // Thickness of the arrow
	bevelEnabled: false, // No bevels on the arrow
	curveSegments: 12
  };
// Create the geometry from the shape
const north_arrow_geometry = new THREE.ExtrudeGeometry(north_arrow, arrow_extrudeSettings);
const north_n_geometry = new THREE.ExtrudeGeometry(north_n, north_n_extrudeSettings);
// Create a material for the arrow
const goldMaterial = new THREE.MeshPhongMaterial({
	color: 0xD4A148,           // Gold color
	emissive: 0xD4A148,        // Gold-like glowing (optional)
	emissiveIntensity: 0.1,    // Control the intensity of the emissive glow
	shininess: 50,            // Shiny surface
	specular: 0x555555,        // Subtle specular highlights
	reflectivity: 0.4          // Reflectivity (higher means more reflective)
  });

// Create the mesh
const arrowMesh = new THREE.Mesh(north_arrow_geometry, goldMaterial);
const north_n_Mesh = new THREE.Mesh(north_n_geometry, goldMaterial);
scene.add(arrowMesh);
scene.add(north_n_Mesh);

// GUI interactibility
gui.add( params, "Rotate" ).onChange( function () {
	// Toggle Rotate between TRUE and FALSE
	Rotate = !Rotate;
	// Reset animation loop.
	renderer.setAnimationLoop( animate );
} );
gui.add( params, "update_heights" ).onChange( function () {
	updateHeights();
} );

gui.open();

// -----------------------------------------------------
// This whole section reads in a geojson file that describes a MULTIPOLYGON
// and adds each polygon to the shapes array to be visualized.
Shiny.addCustomMessageHandler("geojsonData", function(geojsonData) {
    // Loop over each feature in the GeoJSON (which corresponds to a polygon or multipolygon)
    geojsonData.features.forEach((feature) => {
      // Check if the feature is a polygon or multipolygon
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {

		  var polygons = [feature];
        // Loop through each polygon in the feature(for MultiPolygon, multiple polygons)
      polygons.forEach(polygon => {
        const shape = new THREE.Shape();
        const label = polygon.properties.label;
  			console.log('label is ' + label)
  			//const height = polygon.properties.z;
  			const height = 2;
  			if(polygon.properties.label == 'BASE'){
  				extrudeSettings['depth'] = 0.1;
  			} else {
  			  // In initial rendering, set all to default value of 2.
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
});

Shiny.addCustomMessageHandler("heightData", function(heightData) {
  console.log(heightData);
  new_heights = heightData['height'];
  updateHeights()
});
// Enable initial state of the animation described above.
renderer.setAnimationLoop( animate );
