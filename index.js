class Game {
  constructor(width, height, speed) {
    if (width%10 + height%10 != 0) {
      throw "Bad width or height";
    }

    this.CANVAS = document.getElementById('snake-field');
    this.FIELD = this.CANVAS.getContext('2d');

    this.CANVAS_HEIGHT = height;
    this.CANVAS_WIDTH = width;

    this.CANVAS.width = this.CANVAS_WIDTH;
    this.CANVAS.height = this.CANVAS_HEIGHT;

    this.GAME_HEIGHT = height/10;
    this.GAME_WIDTH  = width/10;

    this.GAME_TICK_RATE = speed;
    this.SNAKE_START_LENGTH = 3;

    this.DIRECTIONS = {
      'up':    ['w', 'W', 'ArrowUp'],
      'left':  ['a', 'A', 'ArrowLeft'],
      'down':  ['s', 'S', 'ArrowDown'],
      'right': ['d', 'D', 'ArrowRight']
    }

    this.initEventBindings();
    this.game_clock = null;
  }

  initEventBindings() {
    window.addEventListener("keydown", (e) => {
      this.handleKeyDown(e.key, this.game_state);
    });
  }

  generateInitState() {
    const starting_snake = this.generateStartingSnake();
    const starting_food = this.generateFood(starting_snake);

    return {
      direction: 'up',
      food: starting_food,
      pending_direction: 'up',
      running: 1,
      snake: starting_snake
    };
  }

  generateStartingSnake() {
    return new Snake(
      this.GAME_WIDTH/2,
      this.GAME_HEIGHT/2,
      this.SNAKE_START_LENGTH
    );
  }

  generateFood(snake) {
    let food;

    do
      food = [
        Math.floor(Math.random() * this.GAME_WIDTH),
        Math.floor(Math.random() * this.GAME_HEIGHT)
      ];
    while(
      snake.collidesWith(food)
    )

    return food;
  }

  killGameClock() {
    clearInterval(this.game_clock);
  }

  startGame() {
    this.killGameClock();
    this.clearField(this.FIELD);
    this.game_state = this.generateInitState();

    this.game_clock = setInterval(this.gameTick.bind(this), this.GAME_TICK_RATE);
  }

  killGame() {
    this.killGameClock();
    this.drawGameOver();
  }


  drawGameOver() {
    this.FIELD.font = "30px Helvetica";
    const go_text = "GAME OVER";
    const go_text_width = this.FIELD.measureText(go_text).width;

    this.FIELD.fillStyle = "red";
    this.FIELD.fillText(
      go_text,
      this.CANVAS_WIDTH/2 - go_text_width/2,
      this.CANVAS_HEIGHT/2
    );

    this.FIELD.font = "15px Helvetica";
    const instr_text = "PRESS 'R' TO PLAY AGAIN";
    const instr_text_width = this.FIELD.measureText(instr_text).width;

    this.FIELD.fillStyle = "black";
    this.FIELD.fillText(
      instr_text,
      this.CANVAS_WIDTH/2 - instr_text_width/2,
      this.CANVAS_HEIGHT/2 + 15
    );
  }

  clearField() {
    this.FIELD.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
  }

  drawGame({direction, food, snake}) {
    this.clearField();
    snake.draw(this.FIELD);
    this.drawFood(food);
    this.updateScore(snake.getLength() - 3);
  }

  drawFood(food) {
    this.FIELD.beginPath();
    this.FIELD.arc(food[0]*10+4.5, food[1]*10+4.5, 4.5, 2 * Math.PI, false);
    this.FIELD.fillStyle = "red";
    this.FIELD.fill();

    this.FIELD.beginPath();
    this.FIELD.arc(food[0]*10+4.5, food[1]*10-1, 3, 1.5, 4.5, false);
    this.FIELD.fillStyle = "green";
    this.FIELD.fill();
  }

  updateScore(score) {
    document.getElementById('points').textContent = score;
  }

  updateGame(state) {
    const new_dir = state.pending_direction;
    state.snake.grow(new_dir);

    let new_food;

    if (state.snake.collidesWith(state.food)) {
      new_food = this.generateFood(state.snake);
    } else {
      new_food = state.food;
      state.snake.shrink();
    }

    return {
      direction: new_dir,
      food: new_food,
      pending_direction: new_dir,
      running: state.running,
      snake: state.snake
    }
  }

  handleKeyDown(key, state) {
    if (key === 'r' || key === 'R') {
      this.startGame();
    } else {
      const selected_dir = ['up', 'left', 'down', 'right'].reduce((acc, dir) => {
        if (this.DIRECTIONS[dir] && this.DIRECTIONS[dir].includes(key)) {
          return dir;
        } else {
          return acc;
        }
      }, state.direction);

      this.game_state.pending_direction = (
        (selected_dir === 'up' && state.direction === 'down') ||
        (selected_dir === 'down' && state.direction === 'up') ||
        (selected_dir === 'left' && state.direction === 'right') ||
        (selected_dir === 'right' && state.direction === 'left')
      ) ? state.direction : selected_dir;
    }
  }

  gameTick() {
    this.game_state = this.updateGame(this.game_state);

    if(this.game_state.snake.died(this.GAME_WIDTH, this.GAME_HEIGHT)) {
      this.killGame();
    } else {
      this.drawGame(this.game_state);
    }
  }
}

class Snake {
  constructor(start_x, start_y, length) {
    this.snake = new Array(length).fill(0).map((piece, i) => {
      return [start_x, start_y + i];
    });
  }

  getHead() {
    return this.snake[0];
  }

  getLength() {
    return this.snake.length;
  }

  collidesWith(coord) {
    return this.snake.reduce((acc, piece) => {
      return(acc || (piece[0] === coord[0] && piece[1] === coord[1]));
    }, false)
  }

  died(width, height) {
    return(this.hitWall(width, height) || this.hitSelf());
  }

  hitWall(width, height) {
    const head = this.getHead();
    return(
      head[0] < 0 || head[0] >= width ||
      head[1] < 0 || head[1] >= height
    );
  }

  hitSelf() {
    const head = this.getHead();

    return this.snake.slice(1).reduce((acc, piece) => {
      return acc || (piece[0] === head[0] && piece[1] === head[1]);
    }, false);
  }

  draw(canvas) {
    canvas.beginPath();
    this.snake.forEach((piece) => {
      canvas.rect(piece[0]*10, piece[1]*10, 9, 9);
    });
    canvas.fillStyle = "green";
    canvas.fill();
  }

  grow(dir) {
    const head_x = this.getHead()[0];
    const head_y = this.getHead()[1];

    switch(dir) {
      case 'up':
        this.snake.unshift([head_x, head_y - 1]);
        break;
      case 'down':
        this.snake.unshift([head_x, head_y + 1]);
        break;
      case 'left':
        this.snake.unshift([head_x - 1, head_y]);
        break;
      case 'right':
        this.snake.unshift([head_x + 1, head_y]);
    }
  }

  shrink() {
    this.snake.pop();
  }
}

const game = new Game(500, 280, 75);
game.startGame();
