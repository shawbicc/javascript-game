window.addEventListener("load", () => {
  // window element will initiate game when loaded

  const canvas = document.getElementById("canvas1"); // canvas where the game will start
  const ctx = canvas.getContext("2d"); // context (idk what this is but its important)
  canvas.width = 1280; // canvas height and width
  canvas.height = 720;

  // context properties
  ctx.fillStyle = "white"; // fill color of the shape drawn
  ctx.lineWidth = 3; // stroke width
  ctx.strokeStyle = "black"; // stroke color
  ctx.font = "40px Bangers";
  ctx.textAlign = "center";

  // Player object
  class Player {
    constructor(game) {
      this.game = game; // Player object gets an instance of the Game object

      // properties of the hitbox area
      this.collisionX = this.game.width / 2;
      this.collisionY = this.game.height / 2;
      this.collisionRadius = 30;
      this.speedX = 0; // speed
      this.speedY = 0;
      this.dx = 0; // target pose - current pose
      this.dy = 0;
      this.speedModifier = 5; // speed modifier
      this.image = document.getElementById("bull"); // player character image

      // player character image properties
      this.scalingFactor = 0.5 + 0.1;
      this.spriteWidth = 255;
      this.spriteHeight = 255;
      this.width = this.spriteWidth * this.scalingFactor;
      this.height = this.spriteHeight * this.scalingFactor;
      this.spriteX = this.spriteWidth - this.width / 2; // player position in canvas
      this.spriteY = this.spriteHeight - this.height / 2 - 50;

      // character facing properties
      this.frameX = 0;
      this.frameY = 5;
      this.maxFrame = 58;
    }

    restart() {
      this.collisionX = this.game.width / 2;
      this.collisionY = this.game.height / 2;
      this.spriteX = this.collisionX - this.width / 2;
      this.spriteY = this.collisionY - this.height / 2 - 100;
    }

    draw(context) {
      // draw the shape in context
      context.drawImage(
        this.image, // image source
        this.frameX * this.spriteWidth, // crop start x
        this.frameY * this.spriteHeight, // crop start y
        this.spriteWidth, // crop size in +x
        this.spriteHeight, // crop size in +y
        this.spriteX, // position x in canvas
        this.spriteY, // position y in canvas
        this.width,
        this.height
      );

      if (this.game.debug) {
        // draw circle in debug mode
        context.beginPath();
        context.arc(
          // draw an arc
          this.collisionX,
          this.collisionY,
          this.collisionRadius,
          0,
          2 * Math.PI
        );
        context.save();
        context.globalAlpha = 0.2; // opacity
        context.fill();
        context.restore();
        context.stroke();

        // draw a line pointing towards movement direction
        context.beginPath();
        context.moveTo(this.collisionX, this.collisionY);
        context.lineTo(this.game.mouse.x, this.game.mouse.y);
        context.stroke();
      }
    }

    update() {
      // setting player position to mouse position
      this.dx = this.game.mouse.x - this.collisionX;
      this.dy = this.game.mouse.y - this.collisionY;
      // sprite animation
      const angle = Math.atan2(this.dy, this.dx);
      if (angle < -2.74 || angle > 2.74) this.frameY = 6;
      else if (angle < -1.96) this.frameY = 7;
      else if (angle < -1.17) this.frameY = 0;
      else if (angle < -0.39) this.frameY = 1;
      else if (angle < 0.39) this.frameY = 2;
      else if (angle < 1.17) this.frameY = 3;
      else if (angle < 1.96) this.frameY = 4;
      else if (angle < 2.74) this.frameY = 5;
      //sprite frames rendering
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
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

      this.spriteX = this.collisionX - this.width / 2; // update player position
      this.spriteY = this.collisionY - this.height / 2 - 50;

      if (this.collisionX < this.collisionRadius) {
        // horizontal boundaries
        this.collisionX = this.collisionRadius;
      } else if (this.collisionX > this.game.width - this.collisionRadius) {
        this.collisionX = this.game.width - this.collisionRadius;
      }

      if (this.collisionY < this.collisionRadius + this.game.topMargin) {
        // vertical boundaries
        this.collisionY = this.collisionRadius + this.game.topMargin;
      } else if (this.collisionY > this.game.height - this.collisionRadius) {
        this.collisionY = this.game.height - this.collisionRadius;
      }

      this.game.obstacles.forEach((obstacle) => {
        // collision with obstacle
        let [collision, distance, sumOfRadii, dx, dy] =
          this.game.checkCollision(this, obstacle);
        if (collision) {
          // making the obstacles "solid"
          const unit_x = dx / distance;
          const unit_y = dy / distance;
          this.collisionX = obstacle.collisionX + (sumOfRadii + 1) * unit_x;
          this.collisionY = obstacle.collisionY + (sumOfRadii + 1) * unit_y;
        }
      });
    }
  }

  // Egg object
  class Egg {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 40;
      this.margin = this.collisionRadius * 2;
      this.collisionX =
        this.margin + Math.random() * (this.game.width - this.margin * 2);
      this.collisionY =
        this.game.topMargin +
        Math.random() * (this.game.height - this.game.topMargin - this.margin);
      this.image = document.getElementById("egg");
      this.spriteWidth = 110; // image drawing start position on canvas
      this.spriteHeight = 135;
      this.scalingFactor = 0.3;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.spriteX;
      this.spriteY;

      this.hatchTimer = 0; // timer for egg to hatch and produce larva
      this.hatchInterval = 5000; // ms time interval between hatches
      this.markedForDeletion = false; // if marked, the egg will be removed and a larva will be placed
    }

    draw(context) {
      context.drawImage(this.image, this.spriteX, this.spriteY); // draw egg image

      if (this.game.debug) {
        // debugging
        context.beginPath();
        context.arc(
          // draw an arc
          this.collisionX,
          this.collisionY,
          this.collisionRadius,
          0,
          2 * Math.PI
        );
        context.save();
        context.globalAlpha = 0.2; // opacity
        context.fill();
        context.restore();
        context.stroke();
        const displayTimer = (this.hatchTimer / 1000).toFixed(0); // display the time interval
        context.fillText(
          displayTimer,
          this.collisionX,
          this.collisionY - this.collisionRadius * 2.5
        );
      }
    }

    update(deltaTime) {
      // update method
      this.spriteX = this.collisionX - this.width / 2;
      this.spriteY = this.collisionY - this.height / 2 - 20;

      // check collision with player, obstacles, larvas and enemies
      let collisionObjects = [
        this.game.player,
        ...this.game.obstacles,
        ...this.game.enemies,
        ...this.game.hatchlings,
      ];
      collisionObjects.forEach((object) => {
        let [collision, distance, sumOfRadii, dx, dy] =
          this.game.checkCollision(this, object);
        if (collision) {
          const unit_x = dx / distance;
          const unit_y = dy / distance;
          this.collisionX = object.collisionX + (sumOfRadii + 1) * unit_x;
          this.collisionY = object.collisionY + (sumOfRadii + 1) * unit_y;
        }
      });

      // hatching
      if (
        this.hatchTimer > this.hatchInterval ||
        this.collisionY < this.game.topMargin
      ) {
        // remove egg and place larva
        this.markedForDeletion = true;
        this.game.removeGameObjects();
        this.game.hatchlings.push(
          new Larva(this.game, this.collisionX, this.collisionY)
        );
      } else {
        this.hatchTimer += deltaTime;
      }
    }
  }

  // Game object
  class Game {
    constructor(canvas) {
      this.canvas = canvas; // canvas of the game
      this.height = this.canvas.height; // height and width of the game
      this.width = this.canvas.width;
      this.player = new Player(this); // instance of the Player object
      this.debug = false; // debugging
      this.score = 0;

      this.mouse = {
        // mouse properties
        x: this.width / 2, // initial mouse position
        y: this.height / 2,
        pressed: false,
      };

      // obstacles properties
      this.numberOfObstacles = 10;
      this.obstacles = [];
      this.topMargin = 260; // top margin

      // fps control
      this.fps = 70;
      this.timer = 0;
      this.interval = 1000 / this.fps;

      // egg properties
      this.eggs = [];
      this.maxEggs = 10;
      this.eggTimer = 0;
      this.eggInterval = 500; // interval (ms) for eggs to spawn
      this.hatchlings = [];
      this.lostHatchlings = 0;

      // enemy properties
      this.enemies = [];

      // game objects
      this.gameObjects = [];

      // animation particle properties
      this.particles = [];

      // game text properties
      this.winningScore = 20;
      this.gameOver = false;

      // event listeners
      window.addEventListener("mousedown", (e) => {
        // mousedown event
        this.mouse.x = e.offsetX; // offsetX -> coords when origin is at the top-left corner of the canvas, not window
        this.mouse.y = e.offsetY;
        this.mouse.pressed = true;
      });

      window.addEventListener("mouseup", (e) => {
        // mouseup event
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.pressed = false;
      });

      window.addEventListener("mousemove", (e) => {
        // mousemove event
        // update mouse only if mouse is pressed
        if (this.mouse.pressed) {
          this.mouse.x = e.offsetX;
          this.mouse.y = e.offsetY;
        }
      });

      // debug
      window.addEventListener("keydown", (e) => {
        if (e.key == "d") this.debug = !this.debug;
        else if (e.key == "r") this.restart();
        else if (e.key == "f") this.toggleFullScreen();
      });
    }

    toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    render(context, deltaTime) {
      // render -> draw the graphics in the context
      if (this.timer > this.interval) {
        context.clearRect(0, 0, this.width, this.height); // clear the canvas

        this.gameObjects = [
          // objects in the game
          ...this.eggs,
          ...this.obstacles,
          this.player,
          ...this.enemies,
          ...this.hatchlings,
          ...this.particles,
        ]; // sequence of rendering
        this.gameObjects.sort((a, b) => {
          // sort by vertical position
          if (a.collisionY < b.collisionY) return -1;
          else if (a.collisionY > b.collisionY) return 1;
          else return 0;
        });
        this.gameObjects.forEach((object) => {
          // render the sorted objects
          object.draw(context);
          object.update(deltaTime);
        });
        this.timer = 0;
      }
      this.timer += deltaTime;

      if (
        this.eggTimer > this.eggInterval &&
        this.eggs.length < this.maxEggs &&
        !this.gameOver
      ) {
        // add eggs periodically
        this.addEgg();
        this.eggTimer = 0;
      } else this.eggTimer += deltaTime;

      // draw status text
      context.save();
      context.textAlign = "left";
      context.fillText("Score: " + this.score, 25, 50);
      if (this.debug) {
        // show lost larva count when debugging
        context.fillText("Lost: " + this.lostHatchlings, 25, 100);
      }
      context.restore();

      // win, lose message
      if (this.score >= this.winningScore) {
        this.gameOver = true;
        context.save();
        context.fillStyle = "rgba(0,0,0,0.5)";
        context.fillRect(0, 0, this.width, this.height);
        context.fillStyle = "white";
        context.textAlign = "center";
        context.shadowOffsetX = 4;
        context.shadowOffsetY = 4;
        context.shadowColor = "black";
        let message1;
        let message2;
        if (this.lostHatchlings <= 5) {
          message1 = "Bullseye!";
          message2 = "You bullied the bullies!";
        } else {
          message1 = "Bullocks!";
          message2 = `Welp you lost ${this.lostHatchlings} hatchlings`;
        }
        context.font = "130px Bangers";
        context.fillText(message1, this.width / 2, this.height / 2 - 20);
        context.font = "40px Bangers";
        context.fillText(message2, this.width / 2, this.height / 2 + 30);
        context.fillText(
          "Final score: " + this.score + ". Press 'R' to butt heads again!",
          this.width / 2,
          this.height / 2 + 80
        );
        context.restore();
      }
    }

    restart() {
      // restart the game
      this.player.restart();
      this.obstacles = [];
      this.eggs = [];
      this.enemies = [];
      this.hatchlings = [];
      this.particles = [];
      this.mouse = {
        x: this.width / 2,
        y: this.height / 2,
        pressed: fase,
      };
      this.score = 0;
      this.lostHatchlings = 0;
      this.gameOver = false;
      this.init();
    }

    addEgg() {
      // add eggs
      this.eggs.push(new Egg(this));
    }

    addEnemy() {
      // add enemies
      if (Math.random() < 0.5) {
        this.enemies.push(new Toadskin(this));
      } else this.enemies.push(new Barkskin(this));
    }

    init() {
      // create enemies
      for (let i = 0; i < 3; i++) {
        this.addEnemy();
      }

      // create randomized obstacles
      let attempts = 0;
      let isOverlapping = false; // flag for checking overlaps

      while (this.obstacles.length < this.numberOfObstacles && attempts < 500) {
        // try to generate obstacles without overlapping
        let testObstacles = new Obstacle(this);
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
      const distance = Math.hypot(dy, dx);
      const sumOfRadii = a.collisionRadius + b.collisionRadius;
      return [distance < sumOfRadii, distance, sumOfRadii, dx, dy];
    }

    // remove object from game
    removeGameObjects() {
      this.eggs = this.eggs.filter((egg) => egg.markedForDeletion == false);
      this.hatchlings = this.hatchlings.filter(
        (larva) => larva.markedForDeletion == false
      );
      this.particles = this.particles.filter(
        (particle) => particle.markedForDeletion == false
      );
    }
  }

  // obstacle object
  class Obstacle {
    constructor(game) {
      this.game = game;
      this.collisionX = Math.random() * this.game.width; // collisionX,Y -> position of the base of the object
      this.collisionY = Math.random() * this.game.height;
      this.collisionRadius = 30; // effective radius of the object
      this.scalingFactor = 0.5; // scaling factor of the obstacle image
      this.image = document.getElementById("obstacle"); // get the obstacle image
      this.spriteWidth = 250; // the height and width of the sprite obstacle image, this should be known
      this.spriteHeight = 250;
      this.width = this.spriteWidth * this.scalingFactor; // the entire obstacle will be scaled to these values
      this.height = this.spriteHeight * this.scalingFactor;
      this.frameX = Math.floor(Math.random() * 4); // select the position of randomized obstacle
      this.frameY = Math.floor(Math.random() * 3);
    }
    draw(context) {
      context.drawImage(
        this.image, // image file to use
        this.frameX * 250, // crop start x
        this.frameY * 250, // crop start y
        this.spriteWidth, // crop distance in +x
        this.spriteHeight, // crop distance in +y
        this.collisionX - this.width / 2, // position x
        this.collisionY - this.height / 2 - 40, // position y
        this.width, // final width
        this.height // final height
      );

      if (this.game.debug) {
        context.beginPath();
        context.arc(
          // draw a circle
          this.collisionX,
          this.collisionY,
          this.collisionRadius,
          0,
          2 * Math.PI
        );
        context.save();
        context.globalAlpha = 0.2; // opacity
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    update() {}
  }

  // enemy object
  class Enemy {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 30;
      this.collisionY =
        this.game.topMargin +
        Math.random() * (this.game.height - this.game.topMargin);
      this.speedX = Math.random() * 3 + 0.5; // speed between 0.5 and 3.5
      this.spriteX;
      this.spriteY;
      this.scalingFactor = 0.3;
      this.frameX = 0;
      this.frameY = Math.floor(Math.random() * 4);
      this.maxFrame = 38;
    }

    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.width,
        this.height
      );

      if (this.game.debug) {
        // draw circle in debug mode
        context.beginPath();
        context.arc(
          // draw an arc
          this.collisionX,
          this.collisionY,
          this.collisionRadius,
          0,
          2 * Math.PI
        );
        context.save();
        context.globalAlpha = 0.2; // opacity
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    update() {
      // larva animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }

      this.spriteX = this.collisionX - this.width / 2;
      // this.spriteY = this.collisionY - this.height / 2 - 80;  // will be updated in individual enemy class
      this.collisionX -= this.speedX;
      // update after enemy passes the screen completely
      if (this.spriteX + this.width < 0 && !this.game.gameOver) {
        this.collisionX =
          this.game.width + this.width + (Math.random() * this.game.width) / 2;
        this.collisionY =
          this.game.topMargin +
          Math.random() * (this.game.height - this.game.topMargin);
        this.frameX = Math.floor(Math.random() * 2);
        this.frameY = Math.floor(Math.random() * 4);
      }
      // check collision with obstacles and player only
      let collisionObjects = [...this.game.obstacles, this.game.player];
      collisionObjects.forEach((object) => {
        let [collision, distance, sumOfRadii, dx, dy] =
          this.game.checkCollision(this, object);
        if (collision) {
          const unit_x = dx / distance;
          const unit_y = dy / distance;
          this.collisionX = object.collisionX + (sumOfRadii + 1) * unit_x;
          this.collisionY = object.collisionY + (sumOfRadii + 1) * unit_y;
        }
      });
    }
  }

  // enemy skins
  class Toadskin extends Enemy {
    constructor(game) {
      super(game);
      this.image = document.getElementById("toadskin");
      this.spriteWidth = 154;
      this.spriteHeight = 238;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.collisionX =
        this.game.width + this.width + (Math.random() * this.game.width) / 2;
    }

    update() {
      super.update();
      this.spriteY = this.collisionY - this.height / 2 - 90; // hitbox height
    }
  }

  class Barkskin extends Enemy {
    constructor(game) {
      super(game);
      this.image = document.getElementById("barkskin");
      this.spriteWidth = 183;
      this.spriteHeight = 280;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.collisionX =
        this.game.width + this.width + (Math.random() * this.game.width) / 2;
    }

    update() {
      super.update();
      this.spriteY = this.collisionY - this.height / 2 - 90; // hitbox height
    }
  }

  // larva class
  class Larva {
    constructor(game, x, y) {
      this.game = game;
      this.collisionX = x;
      this.collisionY = y;
      this.collisionRadius = 30;
      this.image = document.getElementById("larva_sprite");
      this.spriteWidth = 150;
      this.spriteHeight = 150;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.spriteX;
      this.spriteY;
      this.speedY = 1 + Math.random();
      this.markedForDeletion = false;
      this.frameX = 0;
      this.frameY = Math.floor(Math.random() * 2);
      this.maxFrame = 38;
    }

    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.width,
        this.height
      );

      if (this.game.debug) {
        // draw circle in debug mode
        context.beginPath();
        context.arc(
          // draw an arc
          this.collisionX,
          this.collisionY,
          this.collisionRadius,
          0,
          2 * Math.PI
        );
        context.save();
        context.globalAlpha = 0.2; // opacity
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    update() {
      this.collisionY -= this.speedY;
      this.spriteX = this.collisionX - this.width / 2;
      this.spriteY = this.collisionY - this.height / 2 - 50;

      // move to safety
      if (this.collisionY < this.game.topMargin) {
        this.markedForDeletion = true;
        this.game.removeGameObjects();
        if (!this.game.gameOver) this.game.score++; // no score added after game over

        // add firefly animation
        for (let i = 0; i < 4; i++) {
          this.game.particles.push(
            new Firefly(this.game, this.collisionX, this.collisionY, "yellow")
          );
        }
      }

      // larva animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }

      // check collision with player, obstacles
      let collisionObjects = [this.game.player, ...this.game.obstacles];
      collisionObjects.forEach((object) => {
        let [collision, distance, sumOfRadii, dx, dy] =
          this.game.checkCollision(this, object);
        if (collision) {
          const unit_x = dx / distance;
          const unit_y = dy / distance;
          this.collisionX = object.collisionX + (sumOfRadii + 1) * unit_x;
          this.collisionY = object.collisionY + (sumOfRadii + 1) * unit_y;
        }
      });
      this.game.enemies.forEach((enemy) => {
        // collision with enemies
        if (this.game.checkCollision(this, enemy)[0]) {
          this.markedForDeletion = true; // if collided with enemy, larva gets eaten
          this.game.removeGameObjects();
          this.game.lostHatchlings++; // increases lost larva count
          // add spark animation
          for (let i = 0; i < 4; i++) {
            this.game.particles.push(
              new Spark(this.game, this.collisionX, this.collisionY, "red")
            );
          }
        }
      });
    }
  }

  // particle effect
  class Particle {
    constructor(game, x, y, color) {
      this.game = game;
      this.collisionX = x;
      this.collisionY = y;
      this.color = color;
      this.radius = Math.floor(Math.random() * 15) + 5;
      this.speedX = Math.random() * 6 - 3; // bubble speed
      this.speedY = Math.random() * 2 + 0.5;
      this.angle = 0;
      this.va = Math.random() * 0.1 + 0.01;
      this.markedForDeletion = false;
    }

    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.beginPath();
      context.arc(
        this.collisionX,
        this.collisionY,
        this.radius,
        0,
        Math.PI * 2
      );
      context.fill();
      context.stroke();
      context.restore();
    }
  }

  // firefly effect
  class Firefly extends Particle {
    // draw() will be inherited
    update() {
      this.angle += this.va;
      this.collisionX += Math.cos(this.angle) * this.speedX;
      this.collisionY -= this.speedY;
      if (this.collisionY < 0 - this.radius) {
        this.markedForDeletion = true;
        this.game.removeGameObjects();
      }
    }
  }

  // spark effect
  class Spark extends Particle {
    // draw() will be inherited
    update() {
      this.angle += this.va * 0.5;
      this.collisionX -= Math.cos(this.angle) * this.speedX;
      this.collisionY -= Math.sin(this.angle) * this.speedY;
      if (this.radius > 0.1) this.radius -= 0.05;
      if (this.radius < 0.2) {
        this.markedForDeletion = true;
        this.game.removeGameObjects();
      }
    }
  }

  const game = new Game(canvas); // initiate game with Game object
  game.init(); // initaite obstacles

  let lastTime = 0; // animation handling
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime; // time interval (ms) between frames
    lastTime = timeStamp;
    game.render(ctx, deltaTime); // render the context
    if (!game.gameOver) window.requestAnimationFrame(animate);
  }

  animate(0); // call the animation function
});
