var canvas = document.querySelector('canvas');

canvas.width = 600;
canvas.height = 600;

var c = canvas.getContext('2d');

var paused = true;
var creating = false;
var editing = false;
var centered = {
	x: 300,
	y: 300
};

const G = 5; //6.67 * Math.pow(10, -11);



function toggleStart() {
	if (paused) {
		document.getElementById("toggleStart").innerHTML = "Pause";
	} else {
		document.getElementById("toggleStart").innerHTML = "Start";
	}
	paused = !paused;
}

function edit() {
	console.log("no");
	// probably make this function do something
}

function create() {
	if (!paused) {
		paused = true;
		document.getElementById("toggleStart").innerHTML = "Start";
	}
	creating = true;

	document.getElementById("editing").style.visibility = "visible";
	document.getElementById("select-object").style.visibility = "hidden";
	document.getElementById("colorPicker1").value = "#ff0000";
	document.getElementById("colorPicker2").value = "#ff0000";
	document.getElementById("x-location").value = "";
	document.getElementById("y-location").value = "";
	document.getElementById("radius").value = "";
	document.getElementById("mass").value = "";
	document.getElementById("force").value = "";
	document.getElementById("angle").value = "";
	document.getElementById("fixed").checked = false;
	document.getElementById("centered").checked = false;
}

function save() {
	var colour1 = document.getElementById("colorPicker1").value;
	var colour2 = document.getElementById("colorPicker2").value;
	var x = parseInt(document.getElementById("x-location").value);
	var y = parseInt(document.getElementById("y-location").value);
	var radius = parseInt(document.getElementById("radius").value);
	var mass = parseInt(document.getElementById("mass").value);
	var force = parseInt(document.getElementById("force").value);
	var angle = parseInt(document.getElementById("angle").value % 360);
	var fixed = document.getElementById("fixed").checked;
	var center = document.getElementById("centered").checked;

	if (creating) {
		var name = document.getElementById("name").value;
	} else if (editing) {
		// get the selected object
	}

	bodies.push(new CelestialBody(x, y, radius, mass, colour1, colour2, new Velocity(force, angle), fixed=fixed, name=name));

	if (center) {
		centered = bodies[bodies.length - 1];
	}

}

function get_distance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function rad(deg) {
	return deg * Math.PI / 180;
}

function getRGB(colour) {
	d = document.createElement("div");
	d.style.color = colour;
	document.body.appendChild(d);
	
	return window.getComputedStyle(d).color;
}

function addAlpha(colour, alpha) {
	return colour.slice(0, -1) + ", " + alpha.toString() + ")";
}

function gradient(x, y, radius, color1, color2) {
	var grd = c.createLinearGradient(x - 10, y - 10, x + radius + 10, y + radius + 10);
	grd.addColorStop(0, color1);
	grd.addColorStop(1, color2);

	return grd;
}

function drawLine(x1, y1, x2, y2, colour) {
	c.beginPath();
	c.moveTo(x1, y1);
	c.lineTo(x2, y2);
	c.strokeStyle = colour;
	c.stroke();
}

function Velocity(force, angle) {
	this.force = force;
	this.angle = angle;
}

function find_angle(x1, y1, x2, y2) {
    try {
        var angle = Math.atan((y2 - y1) / (x2 - x1));
    } catch (err) {
        var angle = (Math.pi / 2);
    }

    if (y1 <= y2 && x1 >= x2) {
        angle = Math.abs(angle);
    } else if (y1 <= y2 && x1 <= x2) {
        angle = Math.PI - angle;
    } else if (y1 >= y2 && x1 <= x2) {
        angle = Math.PI + Math.abs(angle);
    } else if (y1 >= y2 && x1 >= x2) {
        angle = (Math.PI * 2) - angle;
    }

    angle -= rad(90);

    if (Number.isNaN(angle)) {
    	return 0;
    }
    return angle;
}

function gravitational_force(targetBody, otherBody) {
	var m = targetBody.mass * otherBody.mass;
	var r = get_distance(targetBody.x, targetBody.y, otherBody.x, otherBody.y);
	var force = G * (m / Math.pow(r, 2));

	return force;
}

function addCurrentVelocity(body) {
	var x = Math.sin(body.velocity.angle) * body.velocity.force;
    var y = Math.cos(body.velocity.angle) * body.velocity.force;

    return [x, y];
}

function vectorAdd(targetBody, otherBodies) {
	var start_x = targetBody.x;
	var start_y = targetBody.y;
	var end_x = targetBody.x;
	var end_y = targetBody.y;

	for (var body of otherBodies) {
		var gravity = gravitational_force(targetBody, body);
		var angle = find_angle(targetBody.x, targetBody.y, body.x, body.y);
		end_x += Math.sin(angle) * gravity;
		end_y += Math.cos(angle) * gravity;
	}

	var currentVel = addCurrentVelocity(targetBody);
	end_x += currentVel[0];
	end_y += currentVel[1];

	var angle = find_angle(start_x, start_y, end_x, end_y);
	var force = get_distance(start_x, start_y, end_x, end_y);
	
	return new Velocity(force, angle);
}

function CelestialBody(x, y, radius, mass, colour1, colour2, velocity, fixed=false, name="Unnamed") {
	this.x = x;
	this.y = y;
	this.name = name;
	this.colour1 = colour1;
	this.colour2 = colour2
	this.radius = radius;
	this.mass = mass;
	this.velocity = velocity;
	this.fixed = fixed;

	this.draw = function() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = gradient(this.x, this.y, this.radius, this.colour1, this.colour2);
		c.fill();
	}

	this.update_velocity = function() {
		if (!paused) {
			var otherBodies = bodies.filter((body) => bodies.indexOf(body) !== bodies.indexOf(this)); 
			this.velocity = vectorAdd(this, otherBodies);
		}
	}

	this.update_position = function() {
		if (!this.fixed) {
			this.x = this.x + Math.sin(this.velocity.angle) * this.velocity.force;
	    	this.y = this.y + Math.cos(this.velocity.angle) * this.velocity.force;
	    }
	}

}

// new Velocity(force, angle);
var bodies = [];

c.fillStyle = "rgba(0,0,0,1)";
c.fillRect(0, 0, canvas.width, canvas.height);
function animate() {
	requestAnimationFrame(animate);

	if (!paused) {
		c.fillStyle = "rgba(0,0,0,0.2)";
		c.fillRect(0, 0, canvas.width, canvas.height);

		var x_offset = 300 - centered.x;
		var y_offset = 300 - centered.y;

		for (var body of bodies) {
			body.update_position();
			body.x += x_offset;
			body.y += y_offset;
		}
	}

	for (var body of bodies) {
		body.draw();
		body.update_velocity();
	}
}
animate();
