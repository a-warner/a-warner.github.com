(function() {
  var LEFT_KEY = 37,
      RIGHT_KEY = 39,
      DOWN_KEY = 40,
      UP_KEY = 38,
      LEFT = 'Left',
      RIGHT = 'Right',
      DOWN = 'Down',
      UP = 'Up',
      HIGH_SCORE_KEY = 'awarner_snake_highscore';

  var KEY_MAPPING = {}
  KEY_MAPPING[LEFT_KEY] = LEFT
  KEY_MAPPING[RIGHT_KEY] = RIGHT
  KEY_MAPPING[UP_KEY] = UP
  KEY_MAPPING[DOWN_KEY] = DOWN

  var SPEED_ACCELERATION = 0.95,
      SCORE_BONUS_PER_LEVEL = 1.05,
      SCORE_PENALTY_PER_RUN_LOOP = 0.99

  function Game($surface) {
    this.$surface = $surface
    this.$msg = $surface.find('#msg')
    this.$grid = $surface.find('#grid')
    this.$highScore = $surface.find('#high-score')
    this.score = 0
    this.speed = 250
    this.appleLevelValue = this.currentAppleValue = 100
    this.changedDirectionThisLoop = false

    this.$grid.html(this.boxesHtml())
    this.snake = new Snake(this.randomBox())
    this.$apple = this.generateApple()

    this.snake.onEatApple(function() {
      this.$apple.removeClass('apple')
      this.$apple = this.generateApple()
      this.speed = SPEED_ACCELERATION * this.speed
      this.$msg.find('#score').text(this.score += Math.ceil(this.currentAppleValue))

      this.appleLevelValue = this.currentAppleValue = (this.appleLevelValue * SCORE_BONUS_PER_LEVEL)
    }.bind(this))

    this.$msg.text('Press any arrow key to start')
    this.$highScore.text("High Score: " + this.getHighScore())
  }

  Game.prototype = {
    userPressedArrow: function(arrowKey) {
      if (!this.changedDirectionThisLoop) {
        this.changedDirectionThisLoop = this.snake.changeDirection(KEY_MAPPING[arrowKey])
      }
    },

    done: function(doneFn) {
      this.doneFn = doneFn
    },

    start: function() {
      this.$msg.html('Score: <span id="score">' + this.score + '</span>')

      var runLoop = function() {
        this.currentAppleValue *= SCORE_PENALTY_PER_RUN_LOOP
        this.snake.move()
        this.changedDirectionThisLoop = false

        if (this.snake.dead) {
          if(this.saveHighScore(this.score)) {
            this.$msg.text('High score! (' + this.score + ') Click grid to try again')
          } else {
            this.$msg.text('Game over! Click grid to try again')
          }

          if(this.doneFn) { this.doneFn() }
        } else {
          setTimeout(runLoop, this.speed)
        }
      }.bind(this)

      setTimeout(runLoop, this.speed)
    },

    boxesHtml: function() {
      var dim = 25
      var html = '<div class="row">'
      for(var i = 0; i < dim * dim; i++) {
        if (i > 0 && i % dim === 0) {
          html += '</div><div class="row">'
        }
        html += '<div class="box"></div>'
      }
      html += "</div>"
      return html
    },

    generateApple: function() {
      var $apple
      while (!$apple || $apple.hasClass('snake')) {
        $apple = this.randomBox()
      }
      return $apple.addClass('apple')
    },

    randomBox: function() {
      var $boxes = this.$grid.find('.box')
      return $($boxes[Math.floor(Math.random() * $boxes.length)])
    },

    getHighScore: function() {
      if (window.localStorage && localStorage[HIGH_SCORE_KEY]) {
        return Number(localStorage[HIGH_SCORE_KEY])
      } else {
        return 0
      }
    },

    saveHighScore: function() {
      if (window.localStorage && this.score > this.getHighScore()) {
        localStorage[HIGH_SCORE_KEY] = this.score
        return true
      }
    }
  }


  function Snake($head) {
    this.PHANTOM_TAIL_SEGMENT = undefined
    this.segments = [$head.addClass('snake'), this.PHANTOM_TAIL_SEGMENT, this.PHANTOM_TAIL_SEGMENT]
  }

  Snake.prototype = {
    move: function() {
      if (!this.currentDirection) return

      var $head = this.segments[0]
      var $tail = this.segments[this.segments.length - 1]
      var $nextPosition = this['position' + this.currentDirection]($head)

      if (!$nextPosition.length || $nextPosition.hasClass('snake')) {
        return this.die()
      }

      if ($nextPosition.hasClass('apple')) {
        this.grow()
        if (this._onEatAppleCallback) { this._onEatAppleCallback() }
      }

      $nextPosition.addClass('snake')

      if ($tail) { $tail.removeClass('snake') }

      this.segments.unshift($nextPosition)
      this.segments.pop()
    },

    grow: function() {
      this.segments.push(this.PHANTOM_TAIL_SEGMENT)
    },

    onEatApple: function(fn) {
      this._onEatAppleCallback = fn
    },

    changeDirection: function(newDirection) {
      switch(newDirection) {
        case UP:
          if(this.currentDirection !== DOWN) {
            this.currentDirection = UP
            return true
          }
          break
        case DOWN:
          if(this.currentDirection !== UP) {
            this.currentDirection = DOWN
            return true
          }
          break
        case LEFT:
          if(this.currentDirection !== RIGHT) {
            this.currentDirection = LEFT
            return true
          }
          break
        case RIGHT:
          if(this.currentDirection !== LEFT) {
            this.currentDirection = RIGHT
            return true
          }
          break
      }
    },

    positionUp: function($head) {
      var $row = $head.closest('.row')
      var indexInRow = $row.find('.box').index($head)
      var $prevRow = $row.prev('.row')
      return $prevRow.find('.box').eq(indexInRow)
    },

    positionDown: function($head) {
      var $row = $head.closest('.row')
      var indexInRow = $row.find('.box').index($head)
      var $nextRow = $row.next('.row')
      return $nextRow.find('.box').eq(indexInRow)
    },

    positionLeft: function($head) {
      var $prev = $head.prev('.box')
      return $prev
    },

    positionRight: function($head) {
      var $next = $head.next('.box')
      return $next
    },

    die: function() {
      this.dead = true
    }
  }

  function reset() {
    var game = new Game($('#surface'))
    game.done(function() {
      $(document).one('click', reset)
    })

    $(document).one('keydown', game.start.bind(game)).
      off('keydown.game').on('keydown.game', function(e) {
        if(KEY_MAPPING[e.which]) {
          game.userPressedArrow(e.which)
          return false
        }
      })
  }

  $(reset)
})()
