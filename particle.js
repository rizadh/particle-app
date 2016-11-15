// Options
const maxBalls = parseInt(prompt("How many balls can ya handle?\n\nDefault: 100")) || 100;
const ballSize = parseInt(prompt("How big should they be? (px)\n\nDefault: 10")) || 10;
const maxSpeed = parseFloat(prompt("How fast do you want 'em? (px/s)\n\nDefault: 100")) || 100;
const maxAccel = parseFloat(prompt(
    "How much energy do you want to give 'em? (px/s\u00B2)\n\n" +
    "Default: " + parseInt(maxSpeed / 4)
)) || maxSpeed / 4;
const areaRestrictFactor = Math.min(Math.max(parseFloat(prompt(
    "How much of the screen should they cover?\n\n" +
    "0 = only right in the middle (boring)\n" +
    "0.5 = half the screen (interesting)\n" +
    "1 = the entire screen (fun)\n\n" +
    "Default: 1"
)), 0), 1) || 1;

const gravity = !confirm("Disable gravity?");

var bounds = [Infinity, Infinity];

// Physics functions
const restitution = () => gravity ? getRandom(0.5, 0.9) : 1;
const acceleration = () => gravity ? [0, 98] : [getRandom(-maxAccel, maxAccel), getRandom(-maxAccel, maxAccel)];

class Particle {
    constructor(position = [0, 0], velocity = [0, 0], acceleration = [0, 0], restitution = 1, radius = 0, bounds = [Infinity, Infinity]) {
        this.position = position;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.restitution = restitution;
        this.radius = radius;
        this.bounds = bounds;
        this.lastUpdate = new Date().getTime();
    }

    checkBounds() {
        for (let axis = 0; axis < 2; axis++)
            for (let extreme = 0; extreme < 2; extreme++)
                if ((extreme ? -this.position[axis] : this.position[axis]) - this.radius < (extreme ? -this.bounds[axis][extreme] : this.bounds[axis][extreme])) {
                    this.position[axis] = this.bounds[axis][extreme] + (extreme ? -this.radius : this.radius);
                    this.velocity[axis] = -this.velocity[axis] * this.restitution;
                    this.acceleration = acceleration()
                }
    }

    render() {
        let currTime = new Date().getTime();
        let dt = (currTime - this.lastUpdate) / 1000;
        if (dt > 0.5)
            dt = 1 / 30;
        this.lastUpdate = currTime;
        this.position = [
            this.position[0] + dt * this.velocity[0],
            this.position[1] + dt * this.velocity[1]
        ];
        this.velocity = [
            this.velocity[0] + dt * this.acceleration[0],
            this.velocity[1] + dt * this.acceleration[1]
        ];

        this.checkBounds()
    }

    getPosition() {
        this.render();
        return this.position;
    }

    setBounds(x, y) {
        this.bounds = [x, y];
    }
}

class DivStage {
    constructor() {
        this.particles = [];
        this.stage = document.body
    }

    addParticle(particle) {
        let particleNode = document.createElement('div')
        particleNode.className = 'ball'
        particleNode.style.width = `${ballSize * 2}px`
        particleNode.style.height = `${ballSize * 2}px`
        particleNode.style.margin = `-${ballSize}px`
        this.stage.appendChild(particleNode) &&
            this.particles.push([particleNode, particle]);
    }

    render() {
        this.particles.forEach(function([particleNode, particle]) {
            let [x, y] = particle.getPosition()
            particleNode.style.WebkitTransform = `translate(${x}px, ${y}px)`
        })
    }
}

class CanvasStage {
    constructor() {
        this.particles = [];
        this.stage = document.createElement('canvas');
        this.ctx = this.stage.getContext('2d');
        document.body.appendChild(this.stage);
    }

    addParticle(particle) {
        this.particles.push(particle);
    }

    render() {
        let ratio = getPixelRatio();
        this.stage.width = window.innerWidth * ratio;
        this.stage.height = window.innerHeight * ratio;
        this.ctx.clearRect(0, 0, this.stage.width, this.stage.height);
        this.ctx.scale(ratio, ratio);
        this.particles.forEach(function(particle) {
            let [x, y] = particle.getPosition();
            this.ctx.moveTo(x + particle.radius, y);
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.arc(x, y, particle.radius, 0, 2 * Math.PI, false);
            this.ctx.fill();
        }, this)
    }
}

function getRandom(lowerBound, upperBound) {
    return lowerBound + Math.random() * (upperBound - lowerBound)
}

window.onload = function() {
    setBounds();
    // window.stage = new DivStage();
    window.stage = new CanvasStage();
    for (let i = 0; i < maxBalls; i++) {
        stage.addParticle(new Particle(
            [getRandom(bounds[0][0], bounds[0][1]), getRandom(bounds[1][0], bounds[1][1])],
            [getRandom(-maxSpeed, maxSpeed), getRandom(-maxSpeed, maxSpeed)],
            acceleration(),
            restitution(),
            ballSize,
            bounds
        ))
    }

    let animate = function() {
        stage.render();
        window.requestAnimationFrame(animate);
    }

    window.requestAnimationFrame(animate);
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

    bounds[0] = [xMargin, width - xMargin];
    bounds[1] = [yMargin, height - yMargin];
}

function getPixelRatio() {
    if ('devicePixelRatio' in window) {
        return window.devicePixelRatio;
    }

    return 1;
}
