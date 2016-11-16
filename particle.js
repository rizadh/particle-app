const options = {};

// Prompt for options
options.maxBalls = promptOption("Number of balls?", parseInt, 100);
options.ballSize = promptOption("Size of balls?", parseInt, 10);
options.maxSpeed = promptOption("Maximum initial speed?", parseInt, 100);
options.maxAccel = promptOption("Maximum acceleration?", parseInt, options.maxSpeed / 4);
options.areaRestrictFactor = promptOption("Size of simulation area (0 - 1)?", x => Math.min(Math.max(parseFloat(x), 0), 1), 1);
options.gravity = !confirm("Disable gravity?");

console.log(options);

let bounds = [Infinity, Infinity];

// Physics functions
const restitution = () => options.gravity ? getRandom(0.25, 0.75) : 1;
const acceleration = () => options.gravity ? [0, 98] : [getRandom(-options.maxAccel, options.maxAccel), getRandom(-options.maxAccel, options.maxAccel)];

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

    getPosition() {
        const currTime = new Date().getTime();
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

        return this.position;
    }

    setBounds(x, y) {
        this.bounds = [x, y];
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
        this.stage.style.width = window.innerWidth;
        this.stage.style.height = window.innerHeight;
        this.stage.width = window.innerWidth * ratio;
        this.stage.height = window.innerHeight * ratio;
        this.ctx.clearRect(0, 0, this.stage.width, this.stage.height);
        this.ctx.scale(ratio, ratio);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.particles.forEach(particle => {
            let [x, y] = particle.getPosition();
            this.ctx.moveTo(x + particle.radius, y);
            this.ctx.beginPath();
            this.ctx.arc(x, y, particle.radius, 0, 2 * Math.PI, false);
            this.ctx.fill();
        })
    }

    animate() {
        this.render();
        window.requestAnimationFrame(() => this.animate());
    }
}


window.onload = () => {
    setBounds();
    const stage = new CanvasStage();
    for (let i = 0; i < options.maxBalls; i++)
        stage.addParticle(new Particle(
            [getRandom(bounds[0][0], bounds[0][1]), getRandom(bounds[1][0], bounds[1][1])],
            [getRandom(-options.maxSpeed, options.maxSpeed), getRandom(-options.maxSpeed, options.maxSpeed)],
            acceleration(),
            restitution(),
            options.ballSize,
            bounds
        ))

    stage.animate();
}

window.onresize = setBounds

function setBounds() {
    let [width, height] = [
        window.innerWidth,
        window.innerHeight
    ];
    let [xMargin, yMargin] = [
        width * (1 - options.areaRestrictFactor) / 2,
        height * (1 - options.areaRestrictFactor) / 2
    ];

    bounds[0] = [xMargin, width - xMargin];
    bounds[1] = [yMargin, height - yMargin];
}

function getPixelRatio() { return 'devicePixelRatio' in window ? window.devicePixelRatio : 1; }

function getRandom(lowerBound, upperBound) { return lowerBound + Math.random() * (upperBound - lowerBound); }

function promptOption(promptMessage, parserFunction, defaultValue) {
    const parsedValue = parserFunction(prompt(promptMessage + "\n\nDefault: " + defaultValue));
    return parsedValue || parsedValue == 0 ? parsedValue : defaultValue;
}
