// Options
const maxBalls = parseInt(prompt("How many balls can ya handle?")) || 10;
const ballSize = parseInt(prompt("How big should they be? (px)")) || 5;
const maxSpeed = parseFloat(prompt("How fast do you want 'em? (px/s)")) || 100;
const maxAccel = parseFloat(prompt(
    "How much energy do you want to give 'em? (px/s\u00B2)\n\n" +
    `I recommend ${maxSpeed / 2}`
)) || maxSpeed / 2;
const areaRestrictFactor = Math.min(Math.max(parseFloat(prompt(
    "How much of the screen should they cover?\n\n" +
    "0 = only right in the middle (boring)\n" +
    "0.5 = half the screen (interesting)\n" +
    "1 = the entire screen (fun)"
)), 0), 1) || 1;

const gravity = !confirm("Disable gravity?");

// Physics functions
const restitution = function () {
    return gravity ? getRandom(0.5, 0.9) : 1;
}
const acceleration = function () {
    return gravity ? [0, 98] : [getRandom(-maxAccel, maxAccel), getRandom(-maxAccel, maxAccel)];
}

setBounds()

class Particle {
    constructor(position = [0, 0], velocity = [0, 0], acceleration = [0, 0], restitution = 1, radius = 0) {
        this.position = position;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.restitution = restitution;
        this.radius = radius;
        this.lastUpdate = new Date().getTime();
    }

    checkBounds(bounds) {
        for (let axis = 0; axis < 2; axis++)
            for (let extreme = 0; extreme < 2; extreme++)
                if ((extreme ? -this.position[axis] : this.position[axis]) - this.radius < (extreme ? -bounds[axis][extreme] : bounds[axis][extreme])) {
                    this.position[axis] = bounds[axis][extreme] + (extreme ? -this.radius : this.radius);
                    this.velocity[axis] = -this.velocity[axis] * this.restitution;
                    this.acceleration = acceleration()
                }
    }

    render() {
        let currTime = new Date().getTime();
        let dt = (currTime - this.lastUpdate) / 1000;
        this.lastUpdate = currTime;
        this.position = [
            this.position[0] + dt * this.velocity[0],
            this.position[1] + dt * this.velocity[1]
        ];
        this.velocity = [
            this.velocity[0] + dt * this.acceleration[0],
            this.velocity[1] + dt * this.acceleration[1]
        ];

        this.checkBounds(bounds)
    }

    getPosition() {
        this.render();
        return this.position;
    }
}

class Ball {
    constructor(ballElement, particleModel) {
        this.ballElement = ballElement;
        this.particleModel = particleModel;
    }

    update() {
        let [x, y] = this.particleModel.getPosition()
        this.ballElement.style.WebkitTransform = `translate(${x}px, ${y}px)`
    }
}

function getRandom(lowerBound, upperBound) {
    return lowerBound + Math.random() * (upperBound - lowerBound)
}

let balls = [];

window.onload = function () {
    for (let i = 0; i < maxBalls; i++) {
        let ball = document.createElement('div')
        ball.className = 'ball'
        ball.style.width = `${ballSize * 2}px`
        ball.style.height = `${ballSize * 2}px`
        ball.style.margin = `-${ballSize}px`
        document.body.appendChild(ball)
        balls[i] = new Ball(ball, new Particle(
            [getRandom(bounds[0][0], bounds[0][1]), getRandom(bounds[1][0], bounds[1][1])],
            [getRandom(-maxSpeed, maxSpeed), getRandom(-maxSpeed, maxSpeed)],
            acceleration(),
            restitution(),
            ballSize
        ))
    }

    window.requestAnimationFrame(updateAll);
}

window.onresize = setBounds

function setBounds() {
    let [width, height] = [
        window.innerWidth,
        window.innerHeight
    ];
    let [xMargin, yMargin] = [
        width * (1 - areaRestrictFactor) / 2,
        height * (1 - areaRestrictFactor) / 2
    ];
    window.bounds = [
        [xMargin, width - xMargin],
        [yMargin, height - yMargin]
    ]
}

function updateAll() {
    balls.forEach(function (ball) {
        ball.update();
    });
    window.requestAnimationFrame(updateAll);
}
