const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; //set to 100%
canvas.height = window.innerHeight;

const hitCanvas = document.getElementById("hitCanvas");
const hitCanvasctx = hitCanvas.getContext("2d");
hitCanvas.width = window.innerWidth; //set to 100%
hitCanvas.height = window.innerHeight;

const canvas2 = document.getElementById("canvas2");
const ctx2 = canvas2.getContext("2d");
canvas2.width = window.innerWidth; //set to 100%
canvas2.height = window.innerHeight;

let ravens = []; // enemies set up
let gameSpeed = 0;

// set up frame load independent of computer power
let timeToNextRaven = 0;
let ravenInterval = 700; // in mscec
let lastTime = 0;

let score = 0;
ctx.font = "50px Impact";
ctx2.font = "50px Impact";
let lives = 3;
let record = 0;

// set up enemy class
class Raven {
  constructor() {
    this.size = Math.random() * 0.5 + 0.45;
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.width = this.spriteWidth * this.size;
    this.height = this.spriteHeight * this.size;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.speedX = Math.random() * 4 + 3;
    this.speedY = Math.random() * 5 - 2.5;
    this.image = new Image();
    this.image.src = "https://www.frankslaboratory.co.uk/downloads/raven.png";
    this.frame = 0;
    
    // optimie animation
    this.flapInterval = Math.random() * 50 + 50;
    this.timeSinceFlap = 0;
    
    this.markedToDelete = false; // to filter out those off scrin
    
    
    // generate random colored hitboxes
    this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
    this.color = "rgb(" + this.randomColors[0] + "," + this.randomColors[1] + "," + this.randomColors[2] + ")";
  }
  
  update(deltatime) { // pass in frame load speed
    this.x -= this.speedX;
    this.y += this.speedY;
    
    if (this.y > canvas.height - this.height || this.y < 0) this.speedY = 0 - this.speedY; // make ravens bounce off edges
    
    // optimise flap animation
    this.timeSinceFlap += deltatime;
    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > 4) this.frame = 0; // frame change
      else this.frame++;
      this.timeSinceFlap = 0; // reset count
    }
    if (this.x < 0 - this.width) {
      this.markedToDelete = true;
      lives -= 1;
    } // mark to delete if offscrin
    
  }
  
  draw() {
    // create unique hitboxes
    hitCanvasctx.fillStyle = this.color;
    hitCanvasctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height)
  }
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.fillText("Score: " + score, 54, 76);
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 50, 75)
}

function drawLives() {
  ctx2.fillStyle = "black";
  ctx2.fillText("Lives: " + lives, 52, 166);
  ctx2.fillStyle = "red";
  ctx2.fillText("Lives: " + lives, 50, 165)
}

let explosions = [];

// add explosion effects
class Explosion {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.size = size;
    this.image = new Image();
    this.image.src = "https://www.frankslaboratory.co.uk/downloads/boom.png";
    this.frame = 0;
    this.audio = new Audio();
    this.audio.src = "https://audio.jukehost.co.uk/5ZfJ0s6jomuTzJ5gePeqP0WB3sJKNB1B";
    this.timeSinceLast = 0;
    this.frameInterval = 100;
    this.markedToDelete = false;
  }
  
  update(deltatime) {
    if (this.frame === 0) {
      this.audio.play();
    }
    this.timeSinceLast += deltatime; // increase time since last frame
    if (this.timeSinceLast > this.frameInterval) {
      this.frame++;
      this.timeSinceLast = 0;
    }
    if (this.frame > 5) this.markedToDelete = true; // delete when cycled through all frames
  }
  
  draw() {
    ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.size, this.size)
  }
}

window.addEventListener("click", function(e) {
  const detectPixelColor = hitCanvasctx.getImageData(e.x, e.y, 1, 1) // scan canvas to get pixel color when clicked
  const pc = detectPixelColor.data;
  ravens.forEach(obj => {
    if (obj.randomColors[0] === pc[0] && obj.randomColors[1] === pc[1] && obj.randomColors[2] === pc[2]) {
      obj.markedToDelete = true;
      score++;
      explosions.push(new Explosion(obj.x, obj.y, obj.width))
    }
  })
})

function animate(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hitCanvasctx.clearRect(0, 0, canvas.width, canvas.height);
   ctx2.clearRect(0, 0, canvas.width, canvas.height);
  
  
  // count time until next raven
  let deltatime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltatime; // increases by amount of msec between two frame loads
  if (timeToNextRaven > ravenInterval) {
    // when enough time passes new raven is added
    ravens.push(new Raven ());
    timeToNextRaven = 0;
    ravens.sort((a, b) => {
      return a.width - b.width;
    }) // small ravens sorted behind bigger ones
  }
  
  drawScore(); // draw score :)
  drawLives();
  
  // spread op can be used to load various arrays at once
  [...ravens, ...explosions].forEach(object => {
    object.update(deltatime);
    object.draw();
  })
  ravens = ravens.filter(obj => !obj.markedToDelete);
  explosions = explosions.filter(obj => !obj.markedToDelete);// filter out those moved offscrin
  gameSpeed++;
  if (lives > 0) {
    requestAnimationFrame(animate);
    
  } else gameOver();
}

animate(0); // pass in the first timestamp value

function gameOver() {
  ctx2.clearRect(0, 0, canvas.width, canvas.height);
  lives = 0;
  drawLives();
  ctx.save();
  ctx.font = "150px Impact";
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.fillText("GAME OVER", canvas.width/2 + 5, canvas.height/2 + 5);
  ctx.fillStyle = "white";
  ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
  ctx.restore();
  if (score > record) {
    record = score;
     ctx.save();
  ctx.font = "50px Impact";
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.fillText("New Record: " + record, canvas.width/2, canvas.height/2 - 150);
  ctx.fillStyle = "red";
  ctx.fillText("New Record: " + record, canvas.width/2 - 2, canvas.height/2 - 152);
  ctx.restore();
  }
  
  const button = document.createElement("button");
button.innerText = "Restart";
  button.id = "button";
  button.addEventListener("click", () => {
   score = 0;
   lives = 3;
   ravens = [];
   animate(0);
   ctx.font = "50px Impact";
    document.getElementById("button").remove()
    
});
document.body.appendChild(button);
}


