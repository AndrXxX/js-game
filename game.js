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

    this.act = function () {};
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

const grid = [
  new Array(3),
  ['wall', 'wall', 'lava']
];
const level = new Level(grid);
runLevel(level, DOMDisplay);

