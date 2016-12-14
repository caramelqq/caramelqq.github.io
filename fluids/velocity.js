//calculate u
//plot U as contour as background image
//plot points and loop

var background = new Image();
var u = [];
var x = [];
var y = [];

function calculate(){
    var a = document.getElementById("mach").value;
    var b = document.getElementById("alpha").value;
    
    calculateU(a, b);

    /*var html = "<table><tr><td></td>";
    for(var i = 0; i < 100; ++i)
    {
        html += "<td>" + i + "</td>";
    }
    html += "</tr>";
    
    for(var i = 0; i < 160; ++i)
    {
        html += "<tr><td>" + i + "</td>";
        for(var j = 0; j < 100; ++j)
        {
            html += "<td>";
            html += Number(u[i][j]).toFixed(6) + "    ";
            html += "</td>";
        }
        html += "</tr>";
    }
    html += "</table>";*/
    document.getElementById("buttons").innerHTML = "<button id=\"display\" onclick=\"plot()\">Display</button>";
    //document.getElementById("data").innerHTML = html;   
}

function plot()
{

    var uu = [];
    
    for(var j = 0; j < 100; ++j)
    {
        uu[j] = [];
    }
    for(var i = 0; i < 160; ++i)
    {
        for(var j = 0; j < 100; ++j)
        {
            uu[j][i] = u[i][j];
            //if(Math.abs(uu[j][i]) < 0.00001)
            //{
            //    uu[j][i] = 0;
            //}
        }
    }
    
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

function displayU(){

}

function drawBackground(){
    
}

function draw(){

}
