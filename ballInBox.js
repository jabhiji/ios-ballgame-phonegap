/* ---------------------------------------------------------------------
   Copyright (C) 2014 Abhijit Joshi
  
   License:
   --------
  
   Permission is hereby granted, free of charge, to any person obtaining 
   a copy of this software, to deal in the Software without restriction,
   including without limitation the rights to use, copy, modify, merge,
   publish, distribute, sublicense, and/or sell copies of the Software,
   and to permit persons to whom the Software is furnished to do so,
   subject to the following conditions:
  
   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.
  
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
   OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
   HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
   WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
   FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.
------------------------------------------------------------------------*/

    var canvas = document.getElementById('canvas'), 
        xmax = document.getElementById("canvas").getAttribute("width"),
        ymax = document.getElementById("canvas").getAttribute("height"),
        context = canvas.getContext('2d');

    // load images

    var tableImage = new Image();
    tableImage.src = "./greenTable.png";

    var flagImage = new Image();
    flagImage.src = "./finish_flag.png";

    // location of the marble
    var x;
    var y;
    var RAD = 15;

    // velocity of the marble
    var ux;
    var uy;

    // center coordinates and radii of 4 "black holes"
    var NBH = 9;
    var xBH = new Array(NBH);
    var yBH = new Array(NBH);
    var rBH = new Array(NBH);
    var radiusBH = 20;
    var dtheta;

    // score
    var score;

    // lives
    var lives;

    // game time
    var time;
    var delta_t;

    // The watch id references the current `watchAcceleration`
    var watchID = null;

    // Wait for Cordova to load
    //
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is ready
    //
    function onDeviceReady() {
        initializeGame();
        startWatch();
    }

    // initialize game
    function initializeGame()
    {
        time = 0;
        delta_t = 1e-6;

        score = 0;
        lives = 3;
        x = xmax - RAD;
        y = ymax - RAD;
        ux = 0;
        uy = 0;

        // black holes
        xBH[0] = 0.25*xmax; yBH[0] = 0.25*ymax; rBH[0] = radiusBH;
        xBH[1] = 0.75*xmax; yBH[1] = 0.25*ymax; rBH[1] = radiusBH;
        xBH[2] = 0.25*xmax; yBH[2] = 0.75*ymax; rBH[2] = radiusBH;
        xBH[3] = 0.75*xmax; yBH[3] = 0.75*ymax; rBH[3] = radiusBH;
        xBH[4] = 0.50*xmax; yBH[4] = 0.00*ymax; rBH[4] = radiusBH;
        xBH[5] = 1.00*xmax; yBH[5] = 0.50*ymax; rBH[5] = radiusBH;
        xBH[6] = 0.50*xmax; yBH[6] = 1.00*ymax; rBH[6] = radiusBH;
        xBH[7] = 0.00*xmax; yBH[7] = 0.50*ymax; rBH[7] = radiusBH;
        xBH[8] = 0.50*xmax; yBH[8] = 0.50*ymax; rBH[8] = radiusBH;

        // initial rate of rotation
        dtheta = Math.PI/10000;
    }

    // Start watching the acceleration
    //
    function startWatch() {

        // Update acceleration every 10 milliseconds
        var options = { frequency: 10 };

        watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
    }

    // Stop watching the acceleration
    //
    function stopWatch() {
        if (watchID) {
            navigator.accelerometer.clearWatch(watchID);
            watchID = null;
        }
    }

    // onSuccess: Get a snapshot of the current acceleration
    //
    function onSuccess(acceleration) {

        // update game 
        updateGame(acceleration.x, 
                   acceleration.y);

        // draw the instantaneous acceleration vector on screen
        drawGame();
    }

    // onError: Failed to get the acceleration
    //
    function onError() {
        alert('onError!');
    }

    function updateGame(ax,ay)
    {

        // dynamics 
        ux += -0.02*ax;
        uy +=  0.02*ay;

        // kinematics 
        x += ux;
        y += uy;

        // update location of black holes
        var xnew,ynew;
        for(var i = 0; i < NBH; i++)
        {
            // translate to origin
            xBH[i] = xBH[i] - xmax/2;
            yBH[i] = yBH[i] - ymax/2;

            // rotate about the origin
            xnew =  xBH[i]*Math.cos(dtheta) + yBH[i]*Math.sin(dtheta);
            ynew = -xBH[i]*Math.sin(dtheta) + yBH[i]*Math.cos(dtheta);

            xBH[i] = xnew;
            yBH[i] = ynew;

            // translate back
            xBH[i] = xBH[i] + xmax/2;
            yBH[i] = yBH[i] + ymax/2;
        }

        // detect whether ball falls inside a black hole
        for(var i = 0; i < NBH; i++)
        {
            var dis = Math.sqrt(Math.pow(x - xBH[i],2) 
                              + Math.pow(y - yBH[i],2));
            if (dis < rBH[i] - 0.5*RAD) {
                lives--;
                x = xmax-RAD;
                y = ymax-RAD;
                ux = 0;
                uy = 0;
            }
        }

        // check if the ball makes it to the flag
        if(x < 30 && y < 30)
        {
            score += 1;
            x = xmax-RAD;
            y = ymax-RAD;
            ux = 0;
            uy = 0;
            dtheta += Math.PI/10000
        }

        // wall bounce conditions
        var COR = 0.55;
        if (x < RAD)
        {
            ux = Math.abs(COR*ux);
            x = RAD;
        }

        if (x > xmax-RAD)
        {
            ux = -Math.abs(COR*ux);
            x = xmax - RAD;
        }

        if (y < RAD)
        {
            uy = Math.abs(COR*uy);
            y = RAD;
        }

        if (y > ymax-RAD)
        {
            uy = -Math.abs(COR*uy);
            y = ymax - RAD;
        }
    }

    function drawGame()
    {
        // draw the green "billards table" image
        context.drawImage(tableImage,0,0,xmax,ymax);

        // draw black holes with white boundary
        for(var blackHole = 0; blackHole < NBH; blackHole++)
        {
            context.beginPath();
            context.fillStyle="black";
            context.strokeStyle="white";
            context.arc(xBH[blackHole],yBH[blackHole],
                        rBH[blackHole],0,2*Math.PI,false);
            context.closePath();
            context.fill();
            context.stroke();
        }

        // display score
        context.font = '18pt Arial';
        context.lineWidth = 1;
        var credits = 'SCORE: ' + score.toString();
        context.strokeStyle = 'black';
        context.strokeText(credits, 5, ymax - 8);
        context.fillStyle = 'yellow';
        context.fillText(credits, 5, ymax - 8);

        // display lives remaining
        context.font = '18pt Arial';
        context.lineWidth = 1;
        var life = 'LIVES: ' + lives.toString();
        context.strokeStyle = 'black';
        context.strokeText(life, 0.65*xmax, 25);
        context.fillStyle = 'yellow';
        context.fillText(life, 0.65*xmax, 25);

        // draw the flag 
        context.beginPath();
        context.moveTo(10,30);
        context.lineTo(10,10);
        context.lineTo(30,15);
        context.lineTo(10,20);
        context.fillStyle="blue";
        context.fill();
        context.strokeStyle = 'yellow';
        context.lineWidth = 2;
        context.stroke();

        // draw ball 
        context.beginPath();
        context.arc(x,y,RAD,0,2*Math.PI,false);
        context.fillStyle="yellow";
        context.fill();

        // game over
        if(lives==0) 
        {
            context.font = '30pt Arial';
            context.lineWidth = 1;
            context.fillStyle = 'blue';
            context.strokeStyle = 'yellow';
            context.fillText("GAME OVER", 30, 0.55*ymax);
            context.strokeText("GAME OVER", 30, 0.55*ymax);
            stopWatch();
        }
    }

    function restart()
    {
        stopWatch();
        initializeGame();
        startWatch();
    }