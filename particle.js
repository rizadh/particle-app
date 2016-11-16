const options = {};

// Prompt for options
options.maxBalls = promptOption("Number of balls?", parseInt, 100);
options.ballSize = promptOption("Size of balls?", parseInt, 10);
options.maxSpeed = promptOption("Maximum initial speed?", parseInt, 100);
options.maxAccel = promptOption("Maximum acceleration?", parseInt, options.maxSpeed / 4);
options.areaRestrictFactor = promptOption("Size of simulation area (0 - 1)?", x => Math.min(Math.max(parseFloat(x), 0), 1), 1);
options.gravity = !confirm("Disable gravity?");
options.bounds = [[Infinity, Infinity], [Infinity, Infinity]]

console.log(options);

// Physics functions
const generate = {
    restitution: () => options.gravity ? getRandom(0.25, 0.75) : 1,
    position: () => [getRandom(options.bounds[0][0], options.bounds[0][1]), getRandom(options.bounds[1][0], options.bounds[1][1])],
    speed: () => [getRandom(-options.maxSpeed, options.maxSpeed), getRandom(-options.maxSpeed, options.maxSpeed)],
    acceleration: () => options.gravity ? [0, 98] : [getRandom(-options.maxAccel, options.maxAccel), getRandom(-options.maxAccel, options.maxAccel)]
}

class Particle {
    constructor(position = [0, 0], velocity = [0, 0], acceleration = [0, 0], restitution = 1, radius = 0, bounds = [Infinity, Infinity]) {
        this._position = position;
        this._velocity = velocity;
        this._acceleration = acceleration;
        this._restitution = restitution;
        this._radius = radius;
        this._bounds = bounds;
        this._lastUpdate = new Date().getTime();
    }

    checkBounds() {
        for (let axis = 0; axis < 2; axis++)
            for (let extreme = 0; extreme < 2; extreme++)
                if ((extreme ? -this._position[axis] : this._position[axis]) - this._radius < (extreme ? -this._bounds[axis][extreme] : this._bounds[axis][extreme])) {
                    this._position[axis] = this._bounds[axis][extreme] + (extreme ? -this._radius : this._radius);
                    this._velocity[axis] = -this._velocity[axis] * this._restitution;
                    this._acceleration = generate.acceleration()
                }
    }

    get position() {
        const currTime = new Date().getTime();
        const targetFps = 30;
        let dt = (currTime - this._lastUpdate) / 1000;
        if (dt > 1 / targetFps)
            dt = 1 / targetFps;
        this._lastUpdate = currTime;
        this._position = [
            this._position[0] + dt * this._velocity[0],
            this._position[1] + dt * this._velocity[1]
        ];
        this._velocity = [
            this._velocity[0] + dt * this._acceleration[0],
            this._velocity[1] + dt * this._acceleration[1]
        ];

        this.checkBounds()

        return this._position;
    }

    set position(position) {
        this._position = position;
    }

    get radius() {
        return this._radius;
    }

    set stageBounds(bounds) {
        this._bounds = bounds;
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
            particle.stageBounds = options.bounds;
            let [x, y] = particle.position;
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
            generate.position(),
            generate.speed(),
            generate.acceleration(),
            generate.restitution(),
            options.ballSize,
            options.bounds
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

    options.bounds = [
        [xMargin, width - xMargin],
        [yMargin, height - yMargin]
    ]
}

function getPixelRatio() { return 'devicePixelRatio' in window ? window.devicePixelRatio : 1; }

function getRandom(lowerBound, upperBound) { return lowerBound + Math.random() * (upperBound - lowerBound); }

function promptOption(promptMessage, parserFunction, defaultValue) {
    const parsedValue = parserFunction(prompt(promptMessage + "\n\nDefault: " + defaultValue));
    return parsedValue || parsedValue == 0 ? parsedValue : defaultValue;
}
