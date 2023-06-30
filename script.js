// window element will initiate game when loaded
window.addEventListener("load", () => {
  // canvas where the game will start
  const canvas = document.getElementById("canvas1");

  // context (idk what this is but its important)
  const ctx = canvas.getContext("2d");

  // canvas height and width
  canvas.width = 1280;
  canvas.height = 720;

  // context properties

  // fill color of the shape drawn
  ctx.fillStyle = "white";
  // stroke width
  ctx.lineWidth = 3;
  // stroke color
  ctx.strokeStyle = "white";

  // Player object
  class Player {
    constructor(game) {
      // Player object gets an instance of the Game object
      this.game = game;

      // properties of the hitbox area
      this.collisionX = this.game.width / 2;
      this.collisionY = this.game.height / 2;
      this.collisionRadius = 30;
      // speed along x axis
      this.speedX = 0;
      this.speedY = 0;
      // target pose - current pose
      this.dx = 0;
      this.dy = 0;

      this.speedModifier = 5;
    }

    // draw the shape in context
    draw(context) {
      context.beginPath();

      // draw an arc
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius,
        0,
        2 * Math.PI
      );

      // save and restore method -> save a state, change some property, draw something with new property, go back to previous state, draw something with previous settings.
      // Here, context.save() created a checkpoint. then the opacity was changed, and fill context was called, and the fill was done with 50% opacity.
      // Then context.restore() was called to bring the context back to previous state and opacity was back to 100%. then the stroke was called with 100% opacity.

      context.save();
      // opacity
      context.globalAlpha = 0.2;
      context.fill();
      context.restore();
      context.stroke();

      // draw a line pointing towards movement direction
      context.beginPath();
      context.moveTo(this.collisionX, this.collisionY);
      context.lineTo(this.game.mouse.x, this.game.mouse.y);
      context.stroke();
    }

    update() {
      // setting player position to mouse position

      this.dx = this.game.mouse.x - this.collisionX;
      this.dy = this.game.mouse.y - this.collisionY;

      // technique 1 -> p controller
      // this.speedX = this.dx;
      // this.speedY = this.dy;

      // technique 2 -> make player movement constant
      const distance = Math.hypot(this.dy, this.dx);
      if (distance > this.speedModifier) {
        this.speedX = this.dx / distance || 0;
        this.speedY = this.dy / distance || 0;
      } else {
        this.speedX = 0;
        this.speedY = 0;
      }
      this.collisionX += this.speedX * this.speedModifier;
      this.collisionY += this.speedY * this.speedModifier;

      // collision with obstacle
      this.game.obstacles.forEach((obstacle) => {
        if (this.game.checkCollision(this, obstacle)) console.log("collision");
      });
    }
  }

  // Game object
  class Game {
    constructor(canvas) {
      // canvas of the game
      this.canvas = canvas;
      // height and width of the game
      this.height = this.canvas.height;
      this.width = this.canvas.width;
      // instance of the Player object
      this.player = new Player(this);

      // mouse properties
      this.mouse = {
        // initial mouse position
        x: this.width / 2,
        y: this.height / 2,
        pressed: false,
      };

      // obstacles
      this.numberOfObstacles = 10;
      this.obstacles = [];
      this.topMargin = 260; // top margin
      // event listeners

      // mousedown event
      window.addEventListener("mousedown", (e) => {
        this.mouse.x = e.offsetX; // offsetX -> coords when origin is at the top-left corner of the canvas, not window
        this.mouse.y = e.offsetY;
        this.mouse.pressed = true;
      });

      // mouseup event
      window.addEventListener("mouseup", (e) => {
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.pressed = false;
      });

      // mousemove event
      window.addEventListener("mousemove", (e) => {
        // update mouse only if mouse is pressed
        if (this.mouse.pressed) {
          this.mouse.x = e.offsetX;
          this.mouse.y = e.offsetY;
        }
      });
    }

    // render -> draw the graphics in the context
    render(context) {
      this.player.draw(context);
      this.player.update();
      this.obstacles.forEach((obstacle) => obstacle.draw(context));
    }

    // create randomized obstacles
    init() {
      let attempts = 0;
      let isOverlapping = false; // flag for checking overlaps
      // try to generate obstacles without overlapping
      while (this.obstacles.length < this.numberOfObstacles && attempts < 500) {
        let testObstacles = new Obstacle(this);
        console.log(testObstacles);
        this.obstacles.forEach((obstacle) => {
          const distance = Math.sqrt(
            // distance between the testObstacle and iterating obstacle
            Math.pow(obstacle.collisionX - testObstacles.collisionX, 2) +
              Math.pow(obstacle.collisionY - testObstacles.collisionY, 2)
          );
          const distanceBuffer = 100; // distance buffer between two obstacles
          const sumOfRadii =
            obstacle.collisionRadius +
            testObstacles.collisionRadius +
            distanceBuffer;

          if (distance < sumOfRadii) {
            isOverlapping = true;
          }
        });
        const margin = testObstacles.collisionRadius * 2; // additional margin
        if (
          // place obstacle if:
          !isOverlapping && // not overlapping with the existing ones
          testObstacles.collisionX > 0 && // horizontal left limit
          testObstacles.collisionX < this.width - testObstacles.width && // horizontal right limit (for the entire obstacle to be visible)
          testObstacles.collisionY > this.topMargin + margin && // vertical top limit
          testObstacles.collisionY < this.height - testObstacles.height - margin // vertical bottom limit
        ) {
          this.obstacles.push(testObstacles);
        }
        attempts++;
      }
    }
    // check if two objects collide
    checkCollision(a, b) {
      const dx = a.collisionX - b.collisionX;
      const dy = a.collisionY - b.collisionY;
      return Math.hypot(dy, dx) <= a.collisionRadius + b.collisionRadius;
    }
  }

  // obstacle object
  class Obstacle {
    constructor(game) {
      this.game = game;
      // collisionX,Y -> position of the base of the object
      this.collisionX = Math.random() * this.game.width;
      this.collisionY = Math.random() * this.game.height;

      this.collisionRadius = 30; // effective radius of the object
      this.scalingFactor = 0.5; // scaling factor of the obstacle image

      this.image = document.getElementById("obstacle"); // get the obstacle image

      this.spriteWidth = 250; // the height and width of the sprite obstacle image, this should be known
      this.spriteHeight = 250;

      this.width = this.spriteWidth * this.scalingFactor; // the entire obstacle will be scaled to these values
      this.height = this.spriteHeight * this.scalingFactor;
    }
    draw(context) {
      context.drawImage(
        this.image, // image file to use
        0, // crop start x
        0, // crop start y
        this.spriteWidth, // crop end x
        this.spriteHeight, // crop end y
        this.collisionX - this.width / 2, // position x
        this.collisionY - this.height / 2 - 40, // position y
        this.width, // final width
        this.height // final height
      );
      context.beginPath();

      // draw a circle
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius,
        0,
        2 * Math.PI
      );

      // save and restore method -> save a state, change some property, draw something with new property, go back to previous state, draw something with previous settings.
      // Here, context.save() created a checkpoint. then the opacity was changed, and fill context was called, and the fill was done with 50% opacity.
      // Then context.restore() was called to bring the context back to previous state and opacity was back to 100%. then the stroke was called with 100% opacity.

      context.save();
      // opacity
      context.globalAlpha = 0.2;
      context.fill();
      context.restore();
      context.stroke();
    }
  }

  // initiate game with Game object
  const game = new Game(canvas);
  game.init(); // initaite obstacles
  console.log(game);

  // animation handling
  function animate() {
    //clear previous contexts
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // render the context
    game.render(ctx);
    window.requestAnimationFrame(animate);
  }

  // call the animation function
  animate();
});
