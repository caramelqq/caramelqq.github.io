function calculateU(M_inf, alpha){
    //CONSTANTS
    var pi = 3.14159;
    var rho = 1;
	var v_inf = 1;
	var gamma = 1.4;	
	var gamma2 = 0;
    alpha = alpha*pi/180;
    
	//GRID - airfoil
	var n_af = 20;
	var nx_le = 2*n_af;
	var nx_te = nx_le + n_af;
	var nx = nx_te + 5*n_af;

	//GRID - X
	var xmax = 6;
	var xmin = -2;
	var dx = (xmax-xmin)/(nx-1);
	for(var i = 0; i < nx; ++i)
	{
		x[i] = xmin + i*dx;
	}

	//GRID - Y
	var ny = 100;
	var jlower = ny/2;
	var jupper = ny/2+1;
	var ymax = 4;
	var ymin = -4;
	var dy = (ymax-ymin)/(ny-1);
	for(var i = 0; i < ny; ++i)
	{
		y[i] = ymin + (i-1)*dy;
	}
   
	var dydx_u = [];
	var dydx_l = [];
	
	//10% DIAMOND ARIFOIL
	for(var i = 0; i < nx_te; ++i)
	{
		dydx_l[i] = 0;
		dydx_u[i] = 0;
	}
	for(var i = nx_le; i < nx_le + (nx_te-nx_le)/2; ++i)
	{
		dydx_u[i] = .1;
		dydx_l[i] = -.1;
	}
	for(var i = nx_le + (nx_te-nx_le)/2; i < nx_te; ++i)
	{
		dydx_u[i] = -.1;
		dydx_l[i] = .1;
	}

	//field matrices
	var v = [];
	var ugs = [];
	var resi = [];
	var res2 = [];
	for(var i = 0; i < nx; ++i)
	{
	    u[i] = [];
	    resi[i] = [];
	    for(var j = 0; j < ny; ++j)
	    {
	        u[i][j] = 0;
	        resi[i][j] = 0;
	    }
	    v[i] = 0;
	}

	var a = [];
	var b = [];
	var c = [];
	var d = [];

	//loop parameters	
	var iter = 0;
	var iter_line = 0;
	var itermax = 5;
	var itermax_line = 25;
	var resmax = .000001;
	var res = 5;
	var res_old = 5;
   
	var u_sonic = (1-M_inf*M_inf)/((gamma+1)*M_inf*M_inf);
	var f_s = .5*(1-M_inf*M_inf)*(1-M_inf*M_inf)/((gamma+1)*M_inf*M_inf);

	//OMEGA
	var w = 1.5;
	if(M_inf >= 0.6)
	{
		w = 0.9;
	}

	//SOVLE FOR V
	if(M_inf < 1)
	{
		//SUBSONIC
		v[0] = v_inf*Math.sin(alpha);
		v[1] = v_inf*Math.sin(alpha);
	}
	else //M_inf >= 1
	{
		//SUPERSONIC
		for(var i = 0; i < nx; ++i)
		{
			if(i >= nx_le && i <= nx_te)
			{
				//airfoil
				v[i] = 0;
			}
			else 
			{
				v[i] = v_inf*Math.sin(alpha);
			}
		}
	}
   
	//MAIN LOOP
	while(res > resmax && iter < itermax)
	{
		//increase iterations
		iter = iter + 1;

		//zero out boundary condition
		for(var i = 0; i < 2; ++i)
		{
			for(var j = 0; j < ny; ++j)
			{
				u[i][j] = 0;
			}
		}
		for(var j = 0; j < ny; j += ny-1)
		{
			for(var i = 0; i < nx; ++i)
			{
				u[i][j] = 0;
			}
		}
		
		gamma2 = 0;
		for(var i = nx_le-1; i < nx_te; ++i)
		{
			gamma2 = gamma2 - dx*u[i][jlower] + dx*u[i][jupper];  
		}


		//solve for V
		if(M_inf < 1)
		{
			v[0] = v_inf*Math.sin(alpha) + gamma2/(2*pi)*Math.sqrt(1-M_inf*M_inf)*(x[0]+.25)/((x[0]+.2)*(x[0]+.2));
			v[1] = v_inf*Math.sin(alpha) + gamma2/(2*pi)*Math.sqrt(1-M_inf*M_inf)*(x[1]+.25)/((x[0]+.2)*(x[1]+.2));
		}
		else
		{
			v[0] = v_inf*Math.sin(alpha);
			v[1] = v_inf*Math.sin(alpha);
		}

		//iterate from i = 2 -> nx-1
		for(var i = 2; i < nx-1; ++i)
		{
			iter_line = 0;
			res2[i] = 1;

			while(res2[i] > resmax && iter_line < itermax_line)
			{
				iter_line += 1;

				a[0] = 0;
				b[0] = 1;
				c[0] = 0;
				if(M_inf < 1)
				{
					d[0] = gamma2/(2*pi)*(Math.sqrt(1-M_inf*M_inf))*y[0]/((x[i]+.25)*(x[i]+.25)+Math.sqrt(1-M_inf*M_inf)*y[0]*y[0]);
				}
				else
				{
					d[0] = 0;
				}

				//stencil
				//
				//freestream <----------- fbm2	<-	fbm1	<-	fbi		<-	fbp1 <----------- freestream
				//

				var fbp1 = 0;
				var fbi = 0;
				var fbm1 = 0;
				var fbm2 = 0;
				for(var j = 1; j < ny-1; ++j)
				{
					var fu = (1-M_inf*M_inf)			  - (gamma+1)*M_inf*M_inf*u[i][j];
					var fm2= (1-M_inf*M_inf)*u[i-2][j] - (gamma+1)/2*M_inf*M_inf*u[i-2][j]*u[i-2][j];
					var fm = (1-M_inf*M_inf)*u[i-1][j] - (gamma+1)/2*M_inf*M_inf*u[i-1][j]*u[i-1][j];
					var fi = (1-M_inf*M_inf)*u[i][j]   - (gamma+1)/2*M_inf*M_inf*u[i][j]*u[i][j];
					var fp = (1-M_inf*M_inf)*u[i+1][j] - (gamma+1)/2*M_inf*M_inf*u[i+1][j]*u[i+1][j];
						
					//test u(i+1,j)
					if(u[i+1][j] > u_sonic)
					{
						fbp1 = fp;
					}
					else
					{
						fbp1 = f_s;
					}

					//test u(i,j)
					if(u[i][j] > u_sonic)
					{
						fbi = 0;
					}
					else 
					{
						fbi = f_s;
					}

					//test u(i-1,j)
					if(u[i-1][j] > u_sonic)
					{
						fbm1 = fm;
					}
					else
					{
						fbm1 = f_s;
					}
					
					//test u(i-2,j)
					if(u[i-2][j] > u_sonic)
					{
						fbm2 = fm2;
					}
					else
					{
						fbm2 = f_s;
					}

					//GENERAL CASE
					//SUPERSONIC
					if(u[i][j] > u_sonic)
					{
						a[j] = 1/(dy*dy);
						b[j] = -2/(dy*dy) + fu/(dx*dx);
						c[j] = 1/(dy*dy);
						d[j] = -(fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx);
					}
					//SUBSONIC
					else
					{
						a[j] = 1/(dy*dy);
						b[j] = -2/(dy*dy) - 2*fu/(dx*dx);
						c[j] = 1/(dy*dy);
						d[j] = 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
					}

					//nx_le
					if(i == nx_le-1)
					{
						if(j == jlower)
						{
							if(u[i][j] > u_sonic)
							{
								a[j] = 1/(dy*dy);
								b[j] = fu/(dx*dx) - 1/(dy*dy);
								c[j] = 0;
								d[j] = -(dydx_l[i] - v[i-1])/(dy*dx) - (fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx);
							}
							else
							{
								a[j] = 1/(dy*dy);
								b[j] = -(1/(dy*dy) + 2*fu/(dx*dx));
								c[j] = 0;
								d[j] = -(dydx_l[i]-v[i-1])/(dy*dx) + 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
							}
						}
						if(j == jupper)
						{
							if(u[i][j] > u_sonic)
							{
								a[j] = 0;
								b[j] = fu/(dx*dx) - 1/(dy*dy);
								c[j] = 1/(dy*dy);
								d[j] = (dydx_u[i] - v[i-1])/(dy*dx) - (fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm2+fbm2)/(dx*dx);
							}
							else
							{
								a[j] = 0;
								b[j] = -(2*fu/(dx*dx) + 1/(dy*dy));
								c[j] = 1/(dy*dy);
								d[j] = (dydx_u[i]-v[i-1])/(dy*dx) + 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
							}
						}
					}

					//airfoil
					if(i >= nx_le && i < nx_te)
					{
						if(j == jlower)
						{
							if(u[i][j] > u_sonic)
							{
								a[j] = 1/(dy*dy);
								b[j] = fu/(dx*dx) - 1/(dy*dy);
								c[j] = 0;
								d[j] = -(dydx_l[i] - dydx_l[i-1])/(dy*dx) - (fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx);
							}
							else
							{
								a[j] = 1/(dy*dy);
								b[j] = -(1/(dy*dy) + 2*fu/(dx*dx));
								c[j] = 0;
								d[j] = -(dydx_l[i]-dydx_l[i-1])/(dy*dx) + 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
							}
						}
						if(j == jupper)
						{
							if(u[i][j] > u_sonic)
							{
								a[j] = 0;
								b[j] = fu/(dx*dx) - 1/(dy*dy);
								c[j] = 1/(dy*dy);
								d[j] = (dydx_u[i] - dydx_u[i-1])/(dy*dx) - (fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx);
							}
							else
							{
								a[j] = 0;
								b[j] = -(2*fu/(dx*dx) + 1/(dy*dy));
								c[j] = 1/(dy*dy);
								d[j] = (dydx_u[i]-dydx_u[i-1])/(dy*dx) + 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
							}
						}
					}

					//nx_te
					if(i == nx_te)
					{
						if(j == jlower)
						{
							if(u[i][j] > u_sonic)
							{
								a[j] = 1/(dy*dy);
								b[j] = fu/(dx*dx) - 1/(dy*dy);
								c[j] = 0;
								d[j] = -(v[i] - dydx_l[i-1])/(dy*dx) - (fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx);
							}
							else
							{
								a[j] = 1/(dy*dy);
								b[j] = -(1/(dy*dy) + 2*fu/(dx*dx));
								c[j] = 0;
								d[j] = -(v[i]-dydx_l[i-1])/(dy*dx) + 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
							}
						}
						if(j == jupper)
						{
							if(u[i][j] > u_sonic)
							{
								a[j] = 0;
								b[j] = fu/(dx*dx) - 1/(dy*dy);
								c[j] = 1/(dy*dy);
								d[j] = (v[i] - dydx_u[i-1])/(dy*dx) -(fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx);
							}
							else
							{
								a[j] = 0;
								b[j] = -(2*fu/(dx*dx) + 1/(dy*dy));
								c[j] = 1/(dy*dy);
								d[j] = (v[i] - dydx_u[i-1])/(dy*dx) + 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
							}
						}
					}

					//kutta
					if(i == nx_te + 1)
					{
						if(j == jlower)
						{
							if(u[i][j] > u_sonic)
							{
								a[j] = 1/(dy*dy);
								b[j] = fu/(dx*dx) - 1/(dy*dy);
								c[j] = 0;
								d[j] = -(fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx);
							}
							else
							{
								a[j] = 1/(dy*dy);
								b[j] = -(1/(dy*dy) + 2*fu/(dx*dx));
								c[j] = 0;
								d[j] = 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
							}
						}
						if(j == jupper)
						{
							if(u[i][j] > u_sonic)
							{
								a[j] = 0;
								b[j] = fu/(dx*dx) - 1/(dy*dy);
								c[j] = 1/(dy*dy);
								d[j] = -(fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx);
							}
							else
							{
								a[j] = 0;
								b[j] = -(2*fu/(dx*dx) + 1/(dy*dy));
								c[j] = 1/(dy*dy);
								d[j] = 2*(fi - fu*u[i][j])/(dx*dx) - 3*fbi/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (fbm2-2*fbm1)/(dx*dx);
							}
						}
					}
				}//END J


				//solve for ny-1
				a[ny-1] = 0;
				b[ny-1] = 1;
				c[ny-1] = 0;
				if(M_inf < 1)
				{
					d[ny-1] = gamma2/(2*pi)*(Math.sqrt(1-M_inf*M_inf))*y[ny-1]/((x[i]+.25)*(x[i]+.25)+Math.sqrt(1-M_inf*M_inf)*y[ny-1]*y[ny-1]);
				}
				else
				{
					d[ny-1] = 0;
				}

				//TRISOLVE
				for(var ii = 1; ii < ny; ++ii)
				{
					b[ii] = b[ii] - a[ii]/b[ii-1]*c[ii-1];
					d[ii] = d[ii] - a[ii]/b[ii-1]*d[ii-1];
				}
				
				ugs[ny-1] = d[ny-1]/b[ny-1];
				
				for(var ii = ny - 2; ii >= 0; --ii)
				{
					ugs[ii] = (d[ii] - c[ii]*ugs[ii+1])/b[ii];
				}

				for(var j = 0; j < ny; ++j)
				{
					u[i][j] = u[i][j] + w*(ugs[j] - u[i][j]);
				}

				//SOLVE FOR V
				if(i > 1 && i < nx_le)
				{
					if((u[i][jlower]+u[i-1][jlower])/2 > u_sonic && (u[i][jupper]+u[i-1][jupper])/2 > u_sonic)
					{
						//SUPERSONIC
						v[i] = Math.sin(alpha);
					}
					else
					{
						//SUBSONIC
						v[i] = v[i-1] + dx/dy*(u[i-1][jupper]-u[i-1][jlower]);
					}
				}
                
				if((u[nx_te+1][jlower]+u[nx_te][jlower])/2 > u_sonic && (u[nx_te+1][jupper]+u[nx_te][jupper])/2 > u_sonic)
				{
					v[nx_te+1] = Math.sin(alpha);
				}
				else
				{
					v[nx_te+1] = 0;
				}

				if(i > nx_te+1 && i < nx-1)
				{
					if((u[i][jlower]+u[i-1][jlower])/2 > u_sonic && (u[i][jupper]+u[i-1][jupper])/2 > u_sonic)
					{
						//SUPERSONIC
						v[i] = Math.sin(alpha);
					}
					else
					{
						//SUBSONIC
						v[i] = v[i-1] + dx/dy*(u[i-1][jupper]-u[i-1][jlower]);
					}
				}
					
				//UPDATE F VALUES and CALCULATE RESIDUAL
				var colmax = 0;
				for(var j = 1; j < ny-1; ++j)
				{
					var fu = (1-M_inf*M_inf)			  - (gamma+1)*M_inf*M_inf*u[i][j];
					var fm2= (1-M_inf*M_inf)*u[i-2][j] - (gamma+1)/2*M_inf*M_inf*u[i-2][j]*u[i-2][j];
					var fm = (1-M_inf*M_inf)*u[i-1][j] - (gamma+1)/2*M_inf*M_inf*u[i-1][j]*u[i-1][j];
					var fi = (1-M_inf*M_inf)*u[i][j]   - (gamma+1)/2*M_inf*M_inf*u[i][j]*u[i][j];
					var fp = (1-M_inf*M_inf)*u[i+1][j] - (gamma+1)/2*M_inf*M_inf*u[i+1][j]*u[i+1][j];

					//test u(i+1,j)
					if(u[i+1][j] > u_sonic)
					{
						fbp1 = fp;
					}
					else
					{
						fbp1 = f_s;
					}

					//test u(i,j)
					if(u[i][j] > u_sonic)
					{
						fbi = 0;
					}
					else 
					{
						fbi = f_s;
					}

					//test u(i-1,j)
					if(u[i-1][j] > u_sonic)
					{
						fbm1 = fm;
					}
					else
					{
						fbm1 = f_s;
					}
					
					//test u(i-2,j)
					if(u[i-2][j] > u_sonic)
					{
						fbm2 = fm2;
					}
					else
					{
						fbm2 = f_s;
					}

					//RESIDUAL
					if(u[i][j] > u_sonic)
					{
						resi[i][j] =  (u[i][j-1]/(dy*dy) + (fu/(dx*dx)-2/(dy*dy))*u[i][j] + u[i][j+1]/(dy*dy)) - (-(fi - fu*u[i][j])/(dx*dx) - (fp+fm)/(dx*dx) + (fbp1+fbm1)/(dx*dx) - (-2*fbm1+fbm2)/(dx*dx));
					}
					else
					{
						resi[i][j] = u[i][j-1]/(dy*dy) - (2*fu/(dx*dx) + 2/(dy*dy)) + u[i][j+1]/(dy*dy) - ((fbp1+fbm1)/(dx*dx) + (fp+fm)/(dx*dx) - 3*fbi/(dx*dx) + 2*(fi-fu*u[i][j])/(dx*dx) - (fbm2-2*fbm1)/(dx*dx));
					}
					
					if(resi[i][j] < 0)
					{
					    resi[i][j] = (-1)*resi[i][j];
                    }
                    
					//ignore points around airfoil because takes forever to converge
					if(i >= nx_le-1 && i <= nx_te+1)
					{
						if(j == jlower || j == jupper)
						{
							resi[i][j] = 0;
						}
					}

					
					if(resi[i][j] > colmax)
					{
						colmax = resi[i][j];
					}
					

				}//END FOR LOOP J

				res2[i] = colmax;

			}//END WHILE LOOP

		}//END FOR LOOP I


		for(var i = nx-1; i < nx; ++i)
		{
			for(var j = 0; j < ny; ++j)
			{
				a[j] = 0;
				b[j] = 1;
				c[j] = 0;
				if(M_inf < 1)
				{
					d[j] = gamma2/(2*pi)*(Math.sqrt(1-M_inf*M_inf))*y[ny-1]/((x[i]+.25)*(x[i]+.25)+Math.sqrt(1-M_inf*M_inf)*y[ny-1]*y[ny-1]);
				}
				else
				{
					d[j] = 0;
				}
			}


			//TRISOLVE
			for(var ii = 1; ii < ny; ++ii)
			{
				b[ii] = b[ii] - a[ii]/b[ii-1]*c[ii-1];
				d[ii] = d[ii] - a[ii]/b[ii-1]*d[ii-1];
			}
			
			ugs[ny-1] = d[ny-1]/b[ny-1];
			
			for(var ii = ny - 2; ii >= 0; --ii)
			{
				ugs[ii] = (d[ii] - c[ii]*ugs[ii+1])/b[ii];
			}

			for(var j = 0; j < ny; ++j)
			{
				u[i][j] = u[i][j] + w*(ugs[j] - u[i][j]);
			}

			v[i] = v[i-1] = dx/dy*(u[i-1][jupper] - u[i-1][jlower]);
		}

		//find max of res2
		for(var i = 0; i < nx; ++i)
		{
			if(res2[i] > res_old)
			{
				res_old = res2[i];
			}
		}

		res = res_old;
	}//END MAIN LOOP
	
}
