var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var sq_len = 5;
var N = Math.floor(canvas.width/sq_len);
var mouseDown = false;
var mouseX = 0;
var mouseY = 0;
var oldMouseX = 0;
var oldMouseY = 0;
var field = new Field(N);

var buffer = ctx.createImageData(canvas.width, canvas.height);

//event listener
canvas.addEventListener("mousemove", function(e) {
    //do stuff only if mouse is down
    if(mouseDown)
    {
		var mouseX = e.offsetX,
			mouseY = e.offsetY;

		var i = Math.floor(mouseX/sq_len),
			j = Math.floor(mouseY/sq_len);
			
		if(i <= 0 || i >= N || j <= 0 || j >= N)
		{
			return;
		}
		
		field.dx = mouseX - oldMouseX;
		field.dy = mouseY - oldMouseY;

		field.u_old[i][j] = field.dx;
		field.v_old[i][j] = field.dy;
		
		field.u_old[i+1][j] = field.dx;
		field.v_old[i+1][j] = field.dy;
		
		field.v_old[i-1][j] = field.dx;
		field.v_old[i-1][j] = field.dy;
		
		field.u_old[i][j-1] = field.dx;
		field.v_old[i][j-1] = field.dy;
		
		field.u_old[i][j+1] = field.dx;
		field.v_old[i][j+1] = field.dy;

		var d = 30;
		field.rho_old[i][j] = d;
		/*
		field.rho_old[i+1][j] = d/2;
		field.rho_old[i-1][j] = d/2;
		field.rho_old[i][j+1] = d/2;
		field.rho_old[i][j-1] = d/2;
		field.rho_old[i+1][j+1] = d/2;
		field.rho_old[i-1][j+1] = d/2;
		field.rho_old[i+1][j-1] = d/2;
		field.rho_old[i-1][j-1] = d/2;
		*/
		
		oldMouseX = mouseX;
		oldMouseY = mouseY;
	}
});

canvas.addEventListener("mousedown", function(e) {
    oldMouseX = e.offsetX;
    oldMouseY = e.offsetY;
    mouseDown = true;
});

canvas.addEventListener("mouseup", function(e) {
    mouseDown = false;
});

requestAnimationFrame(draw);

function draw()
{
	ctx.clearRect(0, 0, canvas.width, canvas.height);
    field.velStep();
    field.densStep();
	ctx.putImageData(buffer, 0, 0);
    field.draw();
    requestAnimationFrame(draw);
}