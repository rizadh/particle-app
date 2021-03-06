const options = {};

// Prompt for options
options.maxBalls = promptOption("Number of balls?",
    x => Math.max(parseInt(x), 1), 100);
options.coreHue = promptOption("Average hue? (0 - 360)",
    x => Math.min(Math.max(parseInt(x), 0), 360), 0);
options.hueVariance = promptOption("Hue variance? (0 - 360)",
    x => Math.min(Math.max(parseInt(x), 0), 360), 360);
options.saturation = promptOption("Colour saturation? (0 - 100)",
    x => Math.min(Math.max(parseInt(x), 0), 100), 80);
options.lightness = promptOption("Colour lightness? (0 - 100)",
    x => Math.min(Math.max(parseInt(x), 0), 100), 60);
options.ballOpacity = promptOption("Ball opacity? (0 - 1)",
    x => Math.min(Math.max(parseFloat(x), 0), 1), 0.8);
options.gravity = !confirm("Disable gravity?");
options.maxSize = promptOption("Maximum size of balls?",
    x => Math.max(parseInt(x), 1), 20);
options.minSize = promptOption("Minimum size of balls?",
    x => Math.min(Math.max(parseInt(x), 1), options.maxSize),
    options.maxSize / 2
);
options.maxSpeed = promptOption("Maximum initial speed?",
    x => Math.max(parseFloat(x), 0), 100);
options.minSpeed = promptOption("Minimum initial speed?",
    x => Math.min(Math.max(parseFloat(x), 0), options.maxSpeed),
    options.maxSpeed / 2
);
if (!options.gravity) {
    options.maxAccel = promptOption("Maximum acceleration?",
        x => Math.max(parseFloat(x), 0), options.maxSpeed / 4);
    options.minAccel = promptOption("Minimum acceleration?",
        x => Math.min(Math.max(parseFloat(x), 0), options.maxAccel),
        options.minSpeed / 4);
}
options.areaRestrictFactor = promptOption("Size of simulation area (0 - 1)?",
    x => Math.min(Math.max(parseFloat(x), 0), 1), 1);
options.scalePixels = confirm("Scale pixels?");
options.bounds = [[Infinity, Infinity], [Infinity, Infinity]];

console.log(options);

// Physics functions
const generate = {
    restitution: () => options.gravity ? getRandom(0.25, 0.75) : 1,
    position: () => [
        getRandom(options.bounds[0][0], options.bounds[0][1]),
        getRandom(options.bounds[1][0], options.bounds[1][1])
    ],
    speed: () => {
        const speed = getRandom(options.minSpeed, options.maxSpeed);
        const direction = getRandom(0, 2 * Math.PI);

        return [
            speed * Math.cos(direction),
            speed * Math.sin(direction)
        ];
    },
    acceleration: () => {
        const acceleration = getRandom(options.minAccel, options.maxAccel);
        const direction = getRandom(0, 2 * Math.PI);

        return [
            options.gravity ? 0 : acceleration * Math.cos(direction),
            options.gravity ? 98 : acceleration * Math.sin(direction)
        ];
    },
    size: () => getRandom(options.minSize, options.maxSize),
    hue: () => Math.round(
        options.coreHue + options.hueVariance * (Math.random() - 0.5)
    )
};

/* jshint -W078 */
class Particle {
    constructor(position = [0, 0], velocity = [0, 0], acceleration = [0, 0],
        restitution = 1, radius = 0, bounds = [Infinity, Infinity]) {
        this._position = position;
        this._velocity = velocity;
        this._acceleration = acceleration;
        this._restitution = restitution;
        this._radius = radius;
        this._bounds = bounds;
        this._lastUpdate = new Date().getTime();
    }

    checkBounds() {
        for (let axis = 0; axis < 2; axis++) {
            const minPos = this._position[axis] - this._radius;
            const maxPos = this._position[axis] + this._radius;
            const minTrespass = this._bounds[axis][0] - minPos;
            const maxTrespass = maxPos - this._bounds[axis][1];
            if (minTrespass > 0)
                this._position[axis] = this._bounds[axis][0] +
                    this._radius + minTrespass;
            else if (maxTrespass > 0)
                this._position[axis] = this._bounds[axis][1] -
                    this._radius - maxTrespass;
            else
                continue;

            this._velocity[axis] = -this._velocity[axis] * this._restitution;
            this._acceleration = generate.acceleration();
            this.checkBounds();
        }
    }

    get position() {
        const currTime = new Date().getTime();
        let dt = (currTime - this._lastUpdate) / 1000;
        this._lastUpdate = currTime;
        this._position = [
            this._position[0] + dt * this._velocity[0],
            this._position[1] + dt * this._velocity[1]
        ];
        this._velocity = [
            this._velocity[0] + dt * this._acceleration[0],
            this._velocity[1] + dt * this._acceleration[1]
        ];

        this.checkBounds();

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
/* jshint +W078 */

class CanvasStage {
    constructor() {
        this.particles = [];
        this.stage = document.createElement('canvas');
        this.ctx = this.stage.getContext('2d');
        document.body.appendChild(this.stage);
    }

    addParticle(particle) {
        particle._stage_color =
            `hsla(${generate.hue()}, ${options.saturation}%, ${options.lightness}%, ${options.ballOpacity})`;
        this.particles.push(particle);
    }

    render() {
        const ratio = getPixelRatio();
        this.stage.style.width = window.innerWidth;
        this.stage.style.height = window.innerHeight;
        this.stage.width = window.innerWidth * ratio;
        this.stage.height = window.innerHeight * ratio;
        if (options.scalePixels)
            this.ctx.scale(ratio, ratio);
        this.ctx.clearRect(0, 0, this.stage.width, this.stage.height);
        this.particles.forEach(particle => {
            particle.stageBounds = options.bounds;
            this.ctx.fillStyle = particle._stage_color;
            let [x, y] = particle.position;
            this.ctx.moveTo(x + particle.radius, y);
            this.ctx.beginPath();
            this.ctx.arc(x, y, particle.radius, 0, 2 * Math.PI, false);
            this.ctx.fill();
        });
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
            generate.size(),
            options.bounds
        ));

    stage.animate();
};

window.onresize = setBounds;

function setBounds() {
    let [width, height] = [
        window.innerWidth,
        window.innerHeight
    ];

    if (!options.scalePixels) {
        const ratio = getPixelRatio();
        width *= ratio;
        height *= ratio;
    }

    let [xMargin, yMargin] = [
        width * (1 - options.areaRestrictFactor) / 2,
        height * (1 - options.areaRestrictFactor) / 2
    ];

    options.bounds = [
        [xMargin, width - xMargin],
        [yMargin, height - yMargin]
    ];
}

function getPixelRatio() {
    return 'devicePixelRatio' in window ? window.devicePixelRatio : 1;
}

function getRandom(lowerBound, upperBound) {
    return lowerBound + Math.random() * (upperBound - lowerBound);
}

function promptOption(promptMessage, parserFunction, defaultValue) {
    const parsedValue = parserFunction(
        prompt(promptMessage + "\n\nDefault: " + defaultValue)
    );
    return parsedValue || parsedValue === 0 ? parsedValue : defaultValue;
}
