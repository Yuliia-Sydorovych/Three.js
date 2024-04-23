import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// create scene
const scene = new THREE.Scene();

// initialize camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// straight position of the camera on initial load
camera.position.set(0, 0, 0);

// initialize renderer
const renderer = new THREE.WebGLRenderer({alpha: true,antialias: true});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// add renderer on the orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// initialize Box class
class Box extends THREE.Mesh{
    constructor({width, height, depth, color = '#e384ce', velocity = {x: 0, y: 0, z: 0}, position = {x: 0, y: 0, z: 0}, zAcceleration = false}) 
    {
        super(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({color})
        );

        this.width = width;
        this.height = height;
        this.depth = depth;

        this.position.set(position.x, position.y, position.z);

        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;

        this.velocity = velocity;
        this.gravity = -0.002;

        this.zAcceleration = zAcceleration;
    }

    updateSides()
    {
        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;
    }

    update(ground)
    {
        this.updateSides();

        if (this.zAcceleration) this.velocity.z += 0.0003;

        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;

        this.applyGravity(ground);
    }

    applyGravity(ground)
    {
        this.velocity.y += this.gravity;

        // this is where we hit the ground
        if (boxCollision({box1: this, box2: ground}))
        {
            const friction = 0.5;
            this.velocity.y *= friction;
            this.velocity.y = -this.velocity.y;
        }
        else
        {
            this.position.y += this.velocity.y;
        }
    }
}

// check collision of boxes
function boxCollision({box1, box2})
{
    const xCollision = box1.right >= box2.left && box1.left <= box2.right;
    const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
    const zCollision = box1.front >= box2.back && box1.back <= box2.front;

    return xCollision && yCollision && zCollision;
}

// create cube
const cube = new Box({width: 1, height: 1, depth: 1, velocity: {x: 0, y: -0.01, z: 0}});
cube.castShadow = true;
scene.add(cube);

// create ground
const ground = new Box({width: 10, height: 0.5, depth: 50, color: '#598a96', position: { x: 0, y: -2, z: 0}});
ground.receiveShadow = true;
scene.add(ground);

// create light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.y = 3;
light.position.z = 1;
light.castShadow = true;
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

camera.position.z = 5;

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    s: {
        pressed: false
    },
    w: {
        pressed: false
    }
}

// listeners for keys down
window.addEventListener('keydown', (event) =>
{
    switch (event.code) {
        case 'KeyA':
            keys.a.pressed = true;
            break;
        case 'KeyD':
            keys.d.pressed = true;
            break;
        case 'KeyS':
            keys.s.pressed = true;
            break;
        case 'KeyW':
            keys.w.pressed = true;
            break;
        case 'Space':
            cube.velocity.y = 0.08;
            break;
    }
});

// listeners for keys up
window.addEventListener('keyup', (event) =>
{
    switch (event.code) {
        case 'KeyA':
            keys.a.pressed = false;
            break;
        case 'KeyD':
            keys.d.pressed = false;
            break;
        case 'KeyS':
            keys.s.pressed = false;
            break;
        case 'KeyW':
            keys.w.pressed = false;
            break;
    }
});

// initialize enemies cubes
const enemies = [];

let frames = 0;
let spawnRate = 200;

// boxes movement
function animate()
{
    const animationId = requestAnimationFrame(animate);

    renderer.render(scene, camera);

    cube.velocity.x = 0;
    cube.velocity.z = 0;

    // change main cube velocity according to the pressed keys
    if (keys.a.pressed)
    {
        cube.velocity.x = -0.05;
    }
    else if (keys.d.pressed)
    {
        cube.velocity.x = 0.05;
    }

    if (keys.s.pressed)
    {
        cube.velocity.z = 0.05;
    }
    else if (keys.w.pressed)
    {
        cube.velocity.z = -0.05;
    }

    cube.update(ground);
    
    enemies.forEach((enemy) =>
    {
        enemy.update(ground);

        // check if cubes are faced
        if (boxCollision({box1: cube, box2: enemy}))
        {
            cancelAnimationFrame(animationId);
        }
    });

    if (frames % spawnRate === 0)
    {
        if (spawnRate > 20)
        {
            spawnRate -= 20;
        }

        // create enemy box
        const enemy = new Box(
        {
            width: 1,
            height: 1,
            depth: 1,
            position: {
                x: (Math.random() - 0.5) * 10,
                y: 0,
                z: -20
            },
            velocity: {
                x: 0,
                y: 0,
                z: 0.005
            },
            color: 'red',
            zAcceleration: true
        });

        enemy.castShadow = true;
        scene.add(enemy);
        enemies.push(enemy);
    }

    frames++;
}

// start game
animate();
