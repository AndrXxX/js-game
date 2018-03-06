'use strict';


class Vector {
  constructor(x, y) {
    if (typeof(x) === 'undefined' && typeof(y) === 'undefined') {
      x = 0;
      y = 0;
    }
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector === false) {
      throw(new Error(`Vector.plus | Переданный параметр ${vector} не является экземпляром класса Vector`));
    }
     return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(n) {
    return new Vector(this.x * n, this.y * n);
  }
}


class Actor {
  constructor(posVector, sizeVector, speedVector) {
    let args = {
      "pos": posVector,
      "size": sizeVector,
      "speed": speedVector
    };

    for (let key in args) {
      if (typeof(args[key]) === 'undefined') {
        if (key === 'size') {
          this[key] = new Vector(1, 1);
        } else {
          this[key] = new Vector();
        }
      } else if (args[key] instanceof Vector) {
        this[key] = args[key];
      } else {
        throw(new Error(`Actor.constructor | Переданный параметр ${args[key]} не является экземпляром класса Actor`));
      }
    }
  }

  get type() {
    return 'actor';
  }

  get left() {
    return this.pos.x;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get top() {
    return this.pos.y;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  act() {

  }

  isIntersect(actor) {
    if (actor instanceof Actor === false) {
      throw(new Error(`Actor.isIntersect | Переданный параметр ${actor} не является экземпляром класса Actor`));
    } else if (actor === this) {
      return false; // Объект не пересекается сам с собой 
    } else {

      return !(this.top >= actor.bottom || this.bottom <= actor.top
        || this.right <= actor.left || this.left >= actor.right);
    }
  }
}

class Level {
  constructor(grid, actors) {
    if (Array.isArray(grid)) {
      this.grid = grid;
      this.height = grid.length;

      this.width = grid.reduce((memo, el) => {
        if (memo <= el.length) return el.length;
      }, 0);
    } else {
      [this.height, this.width] = [0, 0];
    }

    this.status = null;
    this.finishDelay = 1;

    if (!actors) actors = [];
    this.actors = actors;
    this.player = actors.find((el) => el.type === 'player');
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (actor instanceof Actor === false) {
      throw(new Error(`Level.actorAt | Переданный параметр ${actor} не является экземпляром класса Actor`));
    } else if (typeof(this.actors) === 'undefined') {
      return undefined;
    } else if (this.actors.length === 1) {
      return undefined;
    }

    return this.actors.find((el) => el.isIntersect(actor));
  }

  obstacleAt(position, size) {
    if (position instanceof Vector === false || size instanceof Vector === false) {
      throw(new Error(`Level.obstacleAt | Аргументы ${position}, ${size} должны быть экземплярами класса Vector`));
    }

    let actor = new Actor(position, size);

    if (actor.left < 0 || actor.right > this.width || actor.top < 0) return 'wall';
    if (actor.bottom > this.height) return 'lava';

    for (let col = Math.floor(actor.top); col < Math.ceil(actor.bottom); col++) {
      for (let row = Math.floor(actor.left); row < Math.ceil(actor.right); row++) {
        if (this.grid[col][row] !== undefined) {
          return this.grid[col][row];
        }
      }
    }

    return undefined;
  }

  removeActor(actor) {
    let indexOfActor = this.actors.findIndex((el) => el === actor);
    if (indexOfActor !== -1) {
      this.actors.splice(indexOfActor, 1);
    }
  }

  noMoreActors(type) {
    return (this.actors.length === 0) || (this.actors.findIndex((el) => el.type === type) === -1);
  }

  playerTouched(actorType, actor) {
    if (actorType === 'lava' || actorType === 'fireball') {
      this.status = 'lost';
    } else if (actorType === 'coin' && typeof actor !== 'undefined') {
      let indexOfActor = this.actors.findIndex((el) => el.type === 'coin');
      if (indexOfActor !== -1) {
        this.actors.splice(indexOfActor, 1);
      }
      if (this.actors.findIndex((el) => el.type === 'coin') === -1) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;

    this.objDictionary = {
      'x': 'wall',
      '!': 'lava'
    };
  }

  actorFromSymbol(symbol) {
    if (typeof symbol === 'undefined') {
      return undefined;
    } else {
      return this.dictionary[symbol];
    }
  }

  obstacleFromSymbol(symbol) {
    if (typeof symbol === 'undefined') {
      return undefined;
    } else {
      return this.objDictionary[symbol];
    }
  }

  createGrid(grid) {
    let newGrid = [];

    if (Array.isArray(grid)) {
      for (let row of grid) {
        let newRow = [];

        for (let cell of row.split('')) {
          newRow.push(this.objDictionary[cell]);
        }

        newGrid.push(newRow);
      }

      return newGrid;

    } else {
      return [];
    }
  }

  createActors(plan) {
    let actors = [];

    if (Array.isArray(plan) && plan.length > 0 && typeof this.dictionary !== 'undefined') {

      let curRowNum = 0;
      for (let row of plan) {

        let curCellNum = 0;
        for (let cell of row.split('')) {

          if (this.dictionary[cell] === Actor ||
            typeof this.dictionary[cell] !== 'undefined' && this.dictionary[cell].prototype instanceof Actor) {
            actors.push(new this.dictionary[cell](new Vector(curCellNum, curRowNum)));
          }

          curCellNum++;
        }

        curRowNum++;
      }

      return actors;

    } else {
      return [];
    }

  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

class Fireball extends Actor{
  constructor(pos, speed) {
    super(pos, undefined,speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    if (this.speed.x === 0 && this.speed.y === 0) {
      return this.pos;
    } else {
      return new Vector(this.pos.x + (this.speed.x * time), this.pos.y + (this.speed.y * time));
    }
  }

  handleObstacle() {
    this.speed.x = -this.speed.x;
    this.speed.y = -this.speed.y;
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);

    if (level.obstacleAt(nextPosition, this.size) === undefined) {
      this.pos = nextPosition;
    } else {
      this.handleObstacle();
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));

    if (pos !== undefined) {
      this.startPos = new Vector(pos.x, pos.y);
    }
  }

  handleObstacle() {
    if (this.startPos !== undefined) {
      this.pos.x = this.startPos.x;
      this.pos.y = this.startPos.y;
    }

  }
}

class Coin extends Actor{
  constructor(pos) {
    super(pos, new Vector(0.6, 0.6), undefined);
    this.pos = this.pos.plus(new Vector(0.2, 0.1));
    this.startPos = this.pos;
    this.spring = Math.random() * 2 * Math.PI;
    this.springSpeed = 8;
    this.springDist = 0.07;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos) {
    if (pos !== undefined) {
      pos = pos.plus(new Vector(0, -0.5));
    }
    super(pos, new Vector(0.8, 1.5), new Vector(0, 0));
  }

  get type() {
    return 'player';
  }
}

const schemas = [
  [
    '           ',
    '           ',
    ' o    =    ',
    '         o ',
    '       !xxx',
    ' @     =   ',
    'xxx!       ',
    '           '
  ],
  [
    '      v  ',
    '    v    ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];

const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  'o': Coin,
  '|': VerticalFireball
};

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));