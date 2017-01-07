//calculate u
//plot U as contour as background image
//plot points and loop

var u = [];    
var uu = [];
var x = [];
var y = [];

function calculate(){
    var a = document.getElementById("mach").value;
    var b = document.getElementById("alpha").value;
    calculateU(a, b);
    
    for(var j = 0; j < 100; ++j)
    {
        uu[j] = [];
    }
    for(var i = 0; i < 160; ++i)
    {
        for(var j = 0; j < 100; ++j)
        {
            uu[j][i] = u[i][j];
        }
    }
	normalizeUU();
	
    document.getElementById("buttons").innerHTML = "<button id=\"display\" onclick=\"plot()\">Display</button>";
}

function plot() {
    var data = [ {
		    z: uu,
		    x: x,
		    y: y,
		    type: "heatmap",
		    colorscale: "Jet"
	    }
    ];

    var layout = {
      title: "Mach Distribution U: M<sub>∞</sub> = " + document.getElementById("mach").value + ", α = " + document.getElementById("alpha").value + "°",
      shapes: [{
          type: "line",
          x0: x[40],
          y0: 0,
          x1: x[59],
          y1: 0,
          line: {
            color: "rgb(255, 255, 255)",
            width: 2
            }
        }]
    };
    document.getElementById("buttons").innerHTML = "<button id=\"solve\" onclick=\"calculate()\">Calculate</button>";
    Plotly.newPlot("data", data, layout);
}

//~~~~~~~~~~~~~~~Begin Canvas Functions

var points = [];
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var count = [];
var frameCount = 0;
var run = false;

function init() {
    ctx.fillStyle = '#F6F6F6';
    ctx.fillRect(0, 0, 800,500);

	drawAirfoil();
	createPoints();
	
    requestAnimationFrame(draw);
}

function drawAirfoil() {
	ctx.beginPath();
	ctx.strokeStyle = '#00ff2b';
	ctx.lineWidth = 2;
	ctx.moveTo(5*40, 5*48);
	ctx.lineTo(5*60, 5*48);
	ctx.stroke();
}

function normalizeUU() {
	var min = 0;
	var max = 0;
	for(var j = 0; j < y.length; ++j) {
		if(Math.min.apply(null, uu[j]) < min) {
			min = Math.min.apply(null, uu[j]);
		}
		if(Math.max.apply(null, uu[j]) > max) {
			max = Math.max.apply(null, uu[j]);
		}
	}
	
    for(var j = 0; j < y.length; ++j) {
        for(var i = 0; i < x.length; ++i) {
			uu[j][i] += Math.abs(min);
			uu[j][i] += 0.015;
			//normalize and scale to .25 speed
			uu[j][i] = uu[j][i]/(max-min)*0.25;
		}
	}
}

function Point(pointX, pointY, pointU) {
    this.pointX = pointX;
    this.pointY = y.length - 1 - pointY;
    this.pointU = pointU;
    this.pointColor = "#FFFFFF";
}

Point.prototype.draw = function (ctx) {
	ctx.fillStyle = "hsla(" + this.pointColor + ", 100%, 50%, 1.0)";
	//ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(5*this.pointX, 5*this.pointY, 2, 2);
}

Point.prototype.update = function() {
	//uu is currently mirrored horizontally across the middle
	//Reflect y when updating velocities
	this.pointU = uu[y.length - 1 - Math.floor(this.pointY)][Math.floor(this.pointX)];
	this.pointX += this.pointU;
	this.pointColor = 240 - this.pointU/0.25*360*2/3;
}

function createPoints() {
    for(var j = 0; j < y.length; j+=2) {
		points[j/2] = [];
        for(var i = 0; i < x.length; i+=2) {
			points[j/2][i/2] = new Point(i, j, uu[j][i]);
			points[j/2][i/2].draw(ctx);
        }
    }
}

canvas.addEventListener("click", function(e) {
	if(uu.length === 0) {
		drawError();
	}
	else if(points.length === 0) {
		init();
		run = !run;
	} else {
		run = !run;
	}
});

function drawError() {
	ctx.font = "48px sans-serif"
	ctx.fillText("Click calculate before running the", 50, 100);
	ctx.fillText(" animation.", 300, 170);
}

function draw() {
	if(run == true) {
	    ctx.clearRec
	    ctx.fillStyle = '#000000';
	    ctx.fillRect(0, 0, 800,500);
	
		//draw airfoil
		drawAirfoil();
		
		for(var i = 0; i < points[0].length; ++i) {
			count[i] = 0;
	    }
		
		//update particle positions and draw
	    for(var j = 0; j < points.length; j++) {
	        for(var i = 0; i < points[j].length; i++) {
				//update position
				points[j][i].update();
				
				//determine and count updated points out of bounds
				if(isNaN(points[j][i].pointX) && i > 80) {
					points[j].pop();
				} else {
	            	points[j][i].draw(ctx);
				}
	        }
	    }
		
		if(frameCount % 20 === 0) {
			for(var j = 0; j < points.length; ++j) {
				points[j].unshift(new Point(0, 2*j, uu[j][0]));
			}
			frameCount = 0;
		}
		++frameCount;
	}
	requestAnimationFrame(draw);
}

