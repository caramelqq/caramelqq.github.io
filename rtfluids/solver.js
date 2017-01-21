//initial density -> add forces -> diffuse -> move -> back to add forces
function Field(N)
{
    this.n = N;         //n - the number of cells both horizontally and vertically
    this.x = [];        //x - x-coord
    this.y = [];        //y - y-coord
    this.u = [];        //u - velocity in the x direction
    this.v = [];        //v - velocity in the y direction
    this.u_old = [];    //u_old - previous timestep's u
    this.v_old = [];    //v_old - previous timestep's v
    this.rho = [];      //rho - density
    this.rho_old = [];  //rho - previous timestep's density
    this.dt = 0.166;    //dt - timestep
    this.visc = 0;      //visc - viscosity
    this.diff = 0.0001; //diff - diffusion
    this.dx = 0;		//mouse dx
    this.dy = 0;		//mouse dy
    
    for(var i = 0; i < this.n+2; ++i)
    {
        this.x[i] = Math.floor(canvas.width/this.n*i);
        this.y[i] = Math.floor(canvas.height/this.n*i);
        this.u[i] = [];
        this.v[i] = [];
        this.rho[i] = [];
        this.u_old[i] = [];
        this.v_old[i] = [];
        this.rho_old[i] = [];
        for(var j = 0; j < this.n+2; ++j) 
        {
            this.u[i][j] = 0;
            this.v[i][j] = 0;
            this.rho[i][j] = 0;
            this.u_old[i][j] = 0;
            this.v_old[i][j] = 0;
            this.rho_old[i][j] = 0;
        }
    }
}

Field.prototype.addSource = function(a, b)
{
    for(var i = 0; i < this.n+2; ++i)
    {
        for(var j = 0; j < this.n+2; ++j)
        {
            a[i][j] += b[i][j]*this.dt;
        }
    }
};

Field.prototype.diffuse = function(b, x, x_old, diff) 
{
    var a = this.dt*diff*this.n*this.n;

    for(var k = 0; k < 20; ++k)
    {
        for(var i = 1; i <= this.n; ++i)
        {
            for(var j = 1; j <= this.n; ++j)
            {
                //Gauss-Seidel iteration
                x[i][j] = (x_old[i][j] + a*(x[i-1][j] + x[i+1][j] + x[i][j-1] + x[i][j+1])) / (1+4*a);
                //TODO - Improve iterator to use SOR?
            }
        }
        this.setBnd(b, x);
    }
};

Field.prototype.advect = function(b, d, d0, u, v)
{
    var i0, j0, i1, j1;
    var x, y, s0, t0, s1, t1;
    var dt0 = this.dt*this.n;
    
    for(var i = 1; i <= this.n; ++i)
    {
        for(var j = 1; j <= this.n; ++j)
        {
            x = i - dt0*u[i][j];
            y = j - dt0*v[i][j];
            if(x < 0.5)
            {
                x = 0.5;
            }
            if(x > this.n + 0.5)
            {
                x = this.n + 0.5;
            }
            i0 = Math.floor(x);
            i1 = i0 + 1;
            
            if(y < 0.5)
            {
                y = 0.5;
            }
            if(y > this.n + 0.5)
            {
                y = this.n + 0.5;
            }
            j0 = Math.floor(y);
            j1 = j0 + 1;
            
            s1 = x - i0;
            s0 = 1 - s1;
            t1 = y - j0;
            t0 = 1 - t1;
            
            d[i][j] = s0*(t0*d0[i0][j0] + t1*d0[i0][j1]) + s1*(t0*d0[i1][j0] + t1*d0[i1][j1]);
        }
    }
    this.setBnd(b, d);
};

Field.prototype.swapRho = function()
{
    var a = this.rho;
    this.rho = this.rho_old;
    this.rho_old = a;
};

Field.prototype.swapU = function()
{
    var a = this.u;
    this.u = this.u_old;
    this.u_old = a;
};

Field.prototype.swapV = function()
{
    var a = this.v;
    this.v = this.v_old;
    this.v_old = a;
};

Field.prototype.densStep = function(diff)
{
    this.addSource(this.rho, this.rho_old);
    this.swapRho();
    this.diffuse(0, this.rho, this.rho_old, this.diff);
    this.swapRho();
    this.advect(0, this.rho, this.rho_old, this.u, this.v);
    
    for (var i = 0; i < this.n+2; i++) 
    {
    	for(var j = 0; j < this.n+2; ++j)
    	{
    		this.rho_old[i][j] = 0;
    	}
    }
};

Field.prototype.velStep = function()
{
    this.addSource(this.u, this.u_old);
    this.addSource(this.v, this.v_old);
    this.swapU();
    this.diffuse(1, this.u, this.u_old, this.diff);
    this.swapV();
    this.diffuse(2, this.v, this.v_old, this.diff);
    this.project(this.u, this.v, this.u_old, this.v_old);
    this.swapU();
    this.swapV();
    this.advect(1, this.u, this.u_old, this.u_old, this.v_old);
    this.advect(2, this.v, this.v_old, this.u_old, this.v_old);
    this.project(this.u, this.v, this.u_old, this.v_old);
};

Field.prototype.project = function(u, v, p, div)
{
    var h = 1/this.n;
    
    for(var i = 1; i <= this.n; ++i)
    {
        for(var j = 1; j <= this.n; ++j)
        {
            div[i][j] = -0.5*h*(u[i+1][j] - u[i-1][j] + v[i][j+1] - v[i][j-1]);
            p[i][j] = 0;
            if(this.rho[i][j] > 50)
            {
                this.rho[i][j] = 50;
            }
        }
    }
    
    this.setBnd(0, div);
    this.setBnd(0, p);
    
    for(var k = 0; k < 10; ++k)
    {
        for(var i = 1; i <= this.n; ++i)
        {
            for(var j = 1; j <= this.n; ++j)
            {
                p[i][j] = (div[i][j] + p[i-1][j] + p[i+1][j] + p[i][j-1] + p[i][j+1])/4;
            }
        }
        this.setBnd(0, p);
    }
    
    for(var i = 1; i <= this.n; ++i)
    {
        for(var j = 1; j <= this.n; ++j)
        {
            u[i][j] -= 0.5*(p[i+1][j] - p[i-1][j])/h;
            v[i][j] -= 0.5*(p[i][j+1] - p[i][j-1])/h;
        }
    }
    this.setBnd(1, u);
    this.setBnd(2, v);
};

Field.prototype.setBnd = function(b, x)
{
    for(var i = 1; i <= this.n; ++i)
    {
        x[0][i] = (b === 1) ? -x[1][i] : x[1][i];
        x[this.n+1][i] = (b === 1) ? -x[this.n][i] : x[this.n][i];
        x[i][0] = (b === 2) ? -x[i][1] : x[i][1];
        x[i][this.n+1] = (b === 2) ? -x[i][this.n] : x[i][this.n];
    }
    
    x[0][0] = 0.5*(x[1][0] + x[0][1]);
    x[0][this.n+1] = 0.5*(x[1][this.n+1] + x[0][this.n]);
    x[this.n+1][0] = 0.5*(x[this.n][0] + x[this.n+1][1]);
    x[this.n+1][this.n+1] = 0.5*(x[this.n][this.n+1] + x[this.n+1][this.n]);
};

Field.prototype.draw = function()
{
	for(var i = 1; i <= this.n; i++) 
	{
		for(var j = 1; j <= this.n; j++) 
		{
    		var h = Math.sqrt(this.u[i][j]*this.u[i][j] + this.v[i][j]*this.v[i][j])*3+.33;
    		var s = 1;
    		var lum = this.rho[i][j]*20;
    		if(h < .33)
    		{
    			h = .33;
    		}
    		if(h > 1)
    		{
    			h = 1;
    		}
    		if(lum > 0.5)
    		{
    			lum = 0.5;
    		}
    		var colors = hslToRgb(h, s, lum);
    					
    		var r = colors[0];
    		var g = colors[1];
    		var b = colors[2];	
    
    		//draw each square pixel by pixel. Faster
    		//https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    		for (var k = 0; k < sq_len; k++)
    		{
    			for (var l = 0; l < sq_len; l++) 
    			{
    				var px = (i - 1) * sq_len + k;
    				var py = (j - 1) * sq_len + l;
    				var m = (px + py*canvas.width) * 4;
    
    				buffer.data[m] = r;
    				buffer.data[m+1] = g;
    				buffer.data[m+2] = b;
    				buffer.data[m+3] = 255;
    			}
    		}
    		
    		//Damp rho
    		this.rho[i][j] *= 0.98;
		}
	}
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}