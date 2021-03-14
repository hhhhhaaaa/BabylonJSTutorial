/* eslint-disable no-undef */
/* eslint require-jsdoc: "off" */
/* eslint no-unused-vars: "off"*/
import * as BABYLON from "@babylonjs/core";

import flower from "./textures/flwr.png";

var inputAmt;
var moveDirection;
var h;
var v;
// var lanternsLit = 1;
// var totalLanterns;
// var spakler = new BABYLON.ParticleSystem;

export class player extends BABYLON.TransformNode {
    constructor(assets, scene, shadowGenerator, input) {
        super("player", scene)
        // Properties
        this.PLAYER_SPEED = 0.45;
        this.JUMP_FORCE = 0.80;
        this.GRAVITY = -2.8;
        this.DASH_FACTOR = 2.5;
        this.DASH_TIME = 10;
        this.DOWN_TILT = new BABYLON.Vector3(0.8290313946973066, 0, 0);
        this.ORIGINAL_TILT = new BABYLON.Vector3(0.5934119456780721, 0, 0);
        this.sparkLit = false;
        this.sparkReset = false;
        this.lanternsLit = 1;
        this.lastGroundPos = new BABYLON.Vector3(0, 0, 0);
        this.win = false;
        this.dashPressed = false;
        this.canDash = true;
        this.grounded = true;
        this.dashTime = 0;
        this.gravity = new BABYLON.Vector3(0, 0, 0);
        this.jumpCount = 1;

        this.scene = scene;

        this.setupPlayerCamera();        
        this.mesh = assets.outer;
        this.mesh.parent = this;

        this.scene.getLightByName("sparklight").parent = this.scene.getTransformNodeByName("Empty");

        // Animations
        this.idle = assets.animationGroups[1];
        this.jump = assets.animationGroups[2];
        this.land = assets.animationGroups[3];
        this.run = assets.animationGroups[4];
        this.dash = assets.animationGroups[0];


        // Collisions
        this.mesh.actionManager = new BABYLON.ActionManager(this.scene);

        this.mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: this.scene.getMeshByName("destination"),
                },
                () => {
                    if (this.lanternsLit == 22) {
                        this.win = true;
                        
                        this.yTilt.rotation = new BABYLON.Vector3(5.689773361501514, 0.23736477827122882, 0);
                        this.yTilt.position = new BABYLON.Vector3(0, 6, 0);
                        this.camera.position.y = 17;
                    }
                }
            )
        );

        this.mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: this.scene.getMeshByName("ground"),
                },
                () => {
                    this.mesh.position.copyFrom(this.lastGroundPos);
                }
            )
        )

        this.createSparkles();
        this.setUpAnimations();
        shadowGenerator.addShadowCaster(assets.outer); //the player mesh will cast shadows

        this.input = input; //inputs we will get from inputController.ts
    }

    async updateFromControls() {
        try {
            this.deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
    
            this.moveDirection = new BABYLON.Vector3.Zero();
            this.h = this.input.horizontal;
            this.v = this.input.vertical;
    
            if (this.input.dashing && !this.dashPressed && this.canDash && !this.grounded) {
                this.canDash = false
                this.dashPressed = true;

                this.currentAnimation = this.dash;
            }
    
            var dashFactor = 1;
    
            if (this.dashPressed) {
                if (this.dashTime > this.DASH_TIME) {
                    this.dashTime = 0;
                    this.dashPressed = false;
                } else {
                    dashFactor = this.DASH_FACTOR;
                }
                this.dashTime++;
            }
    
            var fwd = this.camRoot.forward;
            var right = this.camRoot.right;
            var correctedVertical = fwd.scaleInPlace(this.v);
            var correctedHorizontal = right.scaleInPlace(this.h);
    
            var move = correctedHorizontal.addInPlace(correctedVertical);
    
            this.moveDirection = new BABYLON.Vector3((move).normalize().x * dashFactor, 0, (move).normalize().z * dashFactor);
    
            var inputMag = Math.abs(this.h) + Math.abs(this.v);
            if (inputMag < 0) {
                this.inputAmt = 0;
            } else if (inputMag > 1) {
                this.inputAmt = 1;
            } else {
                this.inputAmt = inputMag;
            }
    
            this.moveDirection = this.moveDirection.scaleInPlace(this.inputAmt * this.PLAYER_SPEED);

            let input = new BABYLON.Vector3(this.input.horizontalAxis, 0, this.input.verticalAxis);
    
            if (input.length() == 0) {
                return;
            }
    
            var angle = Math.atan2(this.input.horizontalAxis, this.input.verticalAxis);
            angle += this.camRoot.rotation.y;
            var target = BABYLON.Quaternion.FromEulerAngles(0, angle, 0);
            this.mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(this.mesh.rotationQuaternion, target, 10 * this.deltaTime);
        } catch (error) {
            console.log("Something was wrong in Update Controls");
            console.log(error);
        }
    }

    setUpAnimations() {
        this.scene.stopAllAnimations();
        this.run.loopAnimation = true;
        this.idle.loopAnimation = true;

        this.currentAnimation = this.idle;
        this.previousAnimation = this.land;
    }

    animatePlayer() {
        if (!this.dashPressed && !this.isFalling && !this.jumped && 
            (this.input.inputMap["ArrowUp"] || this.input.inputMap["ArrowDown"] || this.input.inputMap["ArrowLeft"] || this.input.inputMap["ArrowRight"])) {
                this.currentAnimation = this.run;
            } else if (this.jumped && !this.isFalling && !this.dashPressed) {
                this.currentAnimation = this.jump;
            } else if (!this.isFalling && this.grounded) {
                this.currentAnimation = this.idle;
            } else if (this.isFalling) {
                this.currentAnimation = this.land;
            }
        if (this.currentAnimation != null && this.previousAnimation !== this.currentAnimation) {
            this.previousAnimation.stop();
            this.currentAnimation.play(this.currentAnimation.loopAnimation);
            this.previousAnimation = this.currentAnimation;
        }
    }
    
    floorRaycast(offsetx, offsetz, length) {
        let rayCastFloorPos = new BABYLON.Vector3(this.mesh.position.x + offsetx, this.mesh.position.y + 0.5, this.mesh.position.z + offsetz);
        let ray = new BABYLON.Ray(rayCastFloorPos, new BABYLON.Vector3.Up().scale(-1), length);
    
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }
        let pick = this.scene.pickWithRay(ray, predicate);
    
        if (pick.hit) {
            return pick.pickedPoint;
        } else {
            return new BABYLON.Vector3.Zero();
        }
    }
    
    isGrounded() {
        if (this.floorRaycast(0, 0, 0.6).equals(new BABYLON.Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }
    
    checkSlope() {
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }
    
        //4 raycasts outward from center
        let raycast1 = new BABYLON.Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z + 0.25);
        let ray1 = new BABYLON.Ray(raycast1, BABYLON.Vector3.Up().scale(-1), 1.5);
        let pick1 = this.scene.pickWithRay(ray1, predicate);
    
        let raycast2 = new BABYLON.Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z - 0.25);
        let ray2 = new BABYLON.Ray(raycast2, BABYLON.Vector3.Up().scale(-1), 1.5);
        let pick2 = this.scene.pickWithRay(ray2, predicate);
    
        let raycast3 = new BABYLON.Vector3(this.mesh.position.x + 0.25, this.mesh.position.y + 0.5, this.mesh.position.z);
        let ray3 = new BABYLON.Ray(raycast3, BABYLON.Vector3.Up().scale(-1), 1.5);
        let pick3 = this.scene.pickWithRay(ray3, predicate);
    
        let raycast4 = new BABYLON.Vector3(this.mesh.position.x - 0.25, this.mesh.position.y + 0.5, this.mesh.position.z);
        let ray4 = new BABYLON.Ray(raycast4, BABYLON.Vector3.Up().scale(-1), 1.5);
        let pick4 = this.scene.pickWithRay(ray4, predicate);
    
        if (pick1.hit && !pick1.getNormal().equals(BABYLON.Vector3.Up())) {
            if (pick1.pickedMesh.name.includes("stair")) {
                return true;
            }
        } else if (pick2.hit && !pick2.getNormal().equals(BABYLON.Vector3.Up())) {
            if (pick2.pickedMesh.name.includes("stair")) {
                return true;
            }
        } else if (pick3.hit && !pick3.getNormal().equals(BABYLON.Vector3.Up())) {
            if (pick3.pickedMesh.name.includes("stair")) {
                return true;
            }
        } else if (pick4.hit && !pick4.getNormal().equals(BABYLON.Vector3.Up())) {
            if (pick4.pickedMesh.name.includes("stair")) {
                return true;
            }
        }
        return false;
    }
    
    updateGroundDetection() {
        if (!this.isGrounded()) {
            if (this.checkSlope() && this.gravity.y <= 0) {
                this.gravity.y = 0;
                this.jumpCount = 1;
                this.grounded = true;
            } else {
                this.gravity = this.gravity.addInPlace(new BABYLON.Vector3.Up().scale(this.deltaTime * this.GRAVITY));
                this.grounded = false;
            }
    
        }
        if (this.gravity.y < -this.JUMP_FORCE) {
            this.gravity.y = -this.JUMP_FORCE;
        }

        if (this.gravity.y < 0 && this.jumped) {
            this.isFalling = true;
        }
        
        this.mesh.moveWithCollisions(this.moveDirection.addInPlace(this.gravity));
    
        if (this.isGrounded()) {
            this.gravity.y = 0;
            this.grounded = true;
            this.lastGroundPos.copyFrom(this.mesh.position);
    
            this.jumpCount = 1;
    
            this.canDash = true;
            this.dashTime = 0;
            this.dashPressed = false;

            this.jumped = false;
            this.isFalling = false;
        }
    
        if (this.input.jumpKeyDown && this.jumpCount > 0) {
            this.gravity.y = this.JUMP_FORCE;
            this.jumpCount--;

            // Animation stuff
            this.jumped = true;
            this.isFalling = false;
        }
    }
    
    beforeRenderUpdate() {
        this.updateFromControls();
        this.updateGroundDetection();
        this.animatePlayer();
    }
    
    activatePlayerCamera() {
        this.scene.registerBeforeRender(() => {
            this.beforeRenderUpdate();
            this.updateCamera();
        })
        return this.camera;
    }
    
    updateCamera() {
        if(this.mesh.intersectsMesh(this.scene.getMeshByName("cornerTrigger"))) {
            if (this.input.horizontalAxis > 0) {
                this.camRoot.rotation = new BABYLON.Vector3.Lerp(this.camRoot.rotation, new BABYLON.Vector3(this.camRoot.rotation.x, Math.PI / 2, this.camRoot.rotation.z), 0.4);
            } else if (this.input.horizontalAxis < 0) {
                this.camRoot.rotation = new BABYLON.Vector3.Lerp(this.camRoot.rotation, new BABYLON.Vector3(this.camRoot.rotation.x, Math.PI, this.camRoot.rotation.z), 0.4); 
            }
        }
    
        if(this.mesh.intersectsMesh(this.scene.getMeshByName("festivalTrigger"))) {
            if (this.input.verticalAxis > 0) {
                this.yTilt.rotation = new BABYLON.Vector3.Lerp(this.yTilt.rotation, this.DOWN_TILT, 0.4);
            } else if (this.input.verticalAxis < 0) {
                this.yTilt.rotation = new BABYLON.Vector3.Lerp(this.yTilt.rotation, this.ORIGINAL_TILT, 0.4);
            }
        }
    
        if(this.mesh.intersectsMesh(this.scene.getMeshByName("destinationTrigger"))) {
            if (this.input.verticalAxis > 0) {
                this.yTilt.rotation = new BABYLON.Vector3.Lerp(this.yTilt.rotation, this.ORIGINAL_TILT, 0.4);
            } else if (this.input.verticalAxis < 0) {
                this.yTilt.rotation = new BABYLON.Vector3.Lerp(this.yTilt.rotation, this.DOWN_TILT, 0.4);
            }
        }
        var centerPlayer = this.mesh.position.y + 2;
        this.camRoot.position = new BABYLON.Vector3.Lerp(this.camRoot.position, new BABYLON.Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);
    }
    
    async setupPlayerCamera() {
        try {
            console.log("Camera");
            // Handles positioning of camera following this
            this.camRoot = new BABYLON.TransformNode("root");
            this.camRoot.position = new BABYLON.Vector3(0, 0, 0);
            // Face the this from behind
            this.camRoot.rotation = new BABYLON.Vector3(0, Math.PI, 0);
        
            // Up/Down tilting
            var yTiltSetup = new BABYLON.TransformNode("ytilt");
            yTiltSetup.rotation = this.ORIGINAL_TILT;
            this.yTilt = yTiltSetup;
            yTiltSetup.parent = this.camRoot;

            this.camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 0, -30), this.scene);
            this.camera.lockedTarget = this.camRoot.position;
            this.camera.fov = 0.47350045992678597;
            this.camera.parent = this.yTilt;

            this.scene.activeCamera = this.camera;
            return this.camera;
        }
        catch (error) {
            console.log("Something was wrong in Camera");
            console.log(error);
        }
    }

    createSparkles() {
        const sphere = BABYLON.Mesh.CreateSphere("sparkles", 4, 1, this.scene);
        sphere.position = new BABYLON.Vector3(0, 0, 0);
        sphere.parent = this.scene.getTransformNodeByName("Empty");
        sphere.isVisible = false;

        let particleSystem = new BABYLON.ParticleSystem("sparkles", 1000, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("./flwr.png", this.scene);
        particleSystem.emitter = sphere;
        particleSystem.particleEmitterType = new BABYLON.SphereParticleEmitter(0);
        particleSystem.updateSpeed = 0.014;
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = 360;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.minSize = 0.5;
        particleSystem.maxSize = 2;
        particleSystem.minScaleX = 0.5;
        particleSystem.minScaleY = 0.5;
        particleSystem.color1 = new BABYLON.Color4(0.8,  0.8549019607843137, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0.8509803921568627, 0.7647058823529411, 1, 1);
        particleSystem.addRampGradient(0, BABYLON.Color3.White());
        particleSystem.addRampGradient(1, BABYLON.Color3.Black());
        particleSystem.getRampGradients()[0].color = BABYLON.Color3.FromHexString("BBC1FF");
        particleSystem.getRampGradients()[1].color = BABYLON.Color3.FromHexString("FFFFFF");
        particleSystem.maxAngularSpeed = 0;
        particleSystem.maxInitialRotation = 360;
        particleSystem.minAngularSpeed = -10;
        particleSystem.maxAngularSpeed = 10;
        particleSystem.start();

        this.sparkler = particleSystem;
    }
}
