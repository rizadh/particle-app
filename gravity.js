// Options
const maxBalls = parseInt(prompt("How many balls can ya handle?"));
const ballSize = parseInt(prompt("How big should they be? (pixels)"))
const maxSpeed = parseFloat(prompt("How fast do you want 'em? (pixels/second)"));
const maxAccel = parseFloat(prompt(
    "How much energy do you want to give 'em? (pixels^s/second)\n\nI recommend " + (maxSpeed / 2)
));
const areaRestrictFactor = parseFloat(prompt(
    `How much of the screen should they cover?
     0 = only right in the middle (boring)
     1 = the entire screen (fun!)
     `));

const gravity = confirm("Do you like gravity?");
alert("Warning you now, this app will break spectacularly if you close it down for a while and come back. Don't complain :)")

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

Particle.generateRandom = function () {
    return new Particle(
        [getRandom(bounds[0][0], bounds[0][1]), getRandom(bounds[1][0], bounds[1][1])],
        [getRandom(-maxSpeed, maxSpeed), getRandom(-maxSpeed, maxSpeed)],
        acceleration(),
        restitution(),
        ballSize
    );
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
let p = new Particle([0, 0], [5, 0], [0, 9.8]);

window.onload = function () {
    for (let i = 0; i < maxBalls; i++) {
        let ball = document.createElement('div')
        ball.className = 'ball'
        ball.style.width = `${ballSize*2}px`
        ball.style.height = `${ballSize*2}px`
        ball.style.margin = `-${ballSize}px`
        document.body.appendChild(ball)
        balls[i] = new Ball(ball, Particle.generateRandom())
    }

    updateAll()
}

window.onresize = setBounds

function setBounds() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let xMargin = width * (1 - areaRestrictFactor) / 2
    let yMargin = height * (1 - areaRestrictFactor) / 2
    window.bounds = [
        [0 + xMargin, width - xMargin],
        [0 + yMargin, height - yMargin]
    ]
}

function updateAll() {
    window.requestAnimationFrame(function () {
        balls.forEach(function (ball) {
            ball.update()
        })
        updateAll();
    });
}