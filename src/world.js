/* eslint-disable no-undef */
/* eslint require-jsdoc: "off" */
/* eslint no-unused-vars: "off"*/
import * as BABYLON from "@babylonjs/core";
import "babylonjs-loaders";
import {
    lantern
} from "./lantern.js";
import lanternTexture from "./textures/litLantern.png";
import environmentSetting from './models/envSetting.glb';
import lanternModel from './models/lantern.glb';
import { GroundBuilder } from "@babylonjs/core";

export class world {
    constructor(scene) {
        this.scene = scene;

        this.lanternObjs = [];
        this.fireworkObjs = [];
        this.startFireWorks = false;

        // Emissive Material
        const lightmt1 = new BABYLON.PBRMetallicRoughnessMaterial("lantern mesh light", this.scene);
        lightmt1.emissiveTexture = new BABYLON.Texture("./litLantern.png", this.scene, true, false);
        lightmt1.emissiveColor = new BABYLON.Color3(0.8784313725490196, 0.7568627450980392, 0.6235294117647059);
        this.lightmt1 = lightmt1;
    }

    async load() {
        try {
            console.log("Load World");
            var assets = await this.loadAsset();
            assets.allMeshes.forEach((mesh) => {
                mesh.receiveShadows = true;
                mesh.checkCollisions = true;
                if (mesh.name == "ground") {
                    mesh.checkCollisions = false;
                    mesh.isPickable = false;
                }
                if (mesh.name.includes("stairs") || mesh.name == "cityentranceground" || mesh.name == "fishingground.001" || mesh.name.includes("lilyflwr")) {
                    mesh.checkCollisions = false;
                    mesh.isPickable = false;
                }
                if (mesh.name.includes("collision")) {
                    mesh.isVisible = false;
                    mesh.isPickable = true;
                }
    
                if (mesh.name.includes("Trigger")) {
                    mesh.isVisible = false;
                    mesh.isPickable = false;
                    mesh.checkCollisions = false;
                }
            });
    
            assets.lantern.isVisible = false;
            const lanternHolder = new BABYLON.TransformNode("lanternHolder", this.scene);
            for (let i = 0; i < 22; i++) {
                // Mesh Cloning
                let lanternInstance = assets.lantern.clone("lantern" + i);
                lanternInstance.isVisible = true;
                lanternInstance.setParent(lanternHolder);
    
                // Animation cloning
                let animGroupClone = new BABYLON.AnimationGroup("lanternAnimGroup " + i);
                animGroupClone.addTargetedAnimation(assets.animGroup.targetedAnimations[0].animation, lanternInstance);
    
                // Create lantern object
                let newLantern = new lantern(this.lightmt1, lanternInstance, this.scene, assets.env.getChildTransformNodes(false).find(mesh => mesh.name === "lantern " + i).getAbsolutePosition(), animGroupClone);
                this.lanternObjs.push(newLantern);
            }
            assets.lantern.dispose();
            assets.animGroup.dispose();

            for (let i = 0; i < 20; i++) {
                this.fireworkObjs.push(new Firework(this.scene, i));
            }

            this.scene.onBeforeRenderObservable.add(() => {
                this.fireworkObjs.forEach(fire => {
                    if (this.startFireWorks) {
                        fire.startFireWork();
                    }
                })
            })
        } catch (error) {
            console.log("Something was wrong in load World");
            console.log(error);
        }
    }
    
    async loadAsset() {
        try {
            console.log("Load Asset");
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", "2412d7adba7529624d489554d68f6e60.glb", this.scene, undefined, ".glb");
    
            let env = result.meshes[0];
            let allMeshes = env.getChildMeshes();
    
            const res = await BABYLON.SceneLoader.ImportMeshAsync("", "", "2ae61f5683608ecaea0147c9ce4269b7.glb", this.scene, undefined, ".glb");
            
            let lantern = res.meshes[0].getChildMeshes()[0];
            lantern.parent = null;
            res.meshes[0].dispose();
            
            const importedAnimations = res.animationGroups;
            let animation = [];
            animation.push(importedAnimations[0].targetedAnimations[0].animation);
            importedAnimations[0].dispose;

            let animGroup = new BABYLON.AnimationGroup("lanternAnimGroup");
            animGroup.addTargetedAnimation(animation[0], res.meshes[1]);

            return {
                env,
                allMeshes,
                lantern,
                animGroup
            }
        } catch (error) {
            console.log("Something was wrong in Load Assets");
            console.log(error);
        }
    }
    
     checkLanterns(player) {
        try {
            if (!this.lanternObjs[0].isLit) {
                this.lanternObjs[0].setEmissiveTexture();
            }
    
            this.lanternObjs.forEach(lantern => {
                player._children[0].actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction({
                            trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                            parameter: lantern.mesh
                        },
                        () => {
                            if (!lantern.isLit && player.sparkLit) {
                                player.lanternsLit += 1;
                                lantern.setEmissiveTexture();
                                player.sparkReset = true;
                                player.sparkLit = true;
                            } else if (lantern.isLit) {
                                player.sparkReset = true;
                                player.sparkLit = true;
                            }
                        }
                    )
                )
            })
        } catch (error) {
            console.log("Something was wrong in Check Lantern");
            console.log(error);
        }
    }
}

class Firework {
    constructor(scene, i) {
        this.scene = scene;

        const sphere = BABYLON.Mesh.CreateSphere("rocket", 4, 1, scene);
        sphere.isVisible = false;

        let randomPosition = Math.random() * 10;
        sphere.position = (new BABYLON.Vector3(scene.getTransformNodeByName("fireworks").getAbsolutePosition().x + randomPosition * -1,
        scene.getTransformNodeByName("fireworks").getAbsolutePosition().y,
        scene.getTransformNodeByName("fireworks").getAbsolutePosition().z));
        this.emitter = sphere;

        let rocket = new BABYLON.ParticleSystem("rocket", 350, scene);
        rocket.particleTexture = new BABYLON.Texture("./flare.png", scene);
        rocket.emitter = sphere;
        rocket.emitRate = 20;
        rocket.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        rocket.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
        rocket.color1 = new BABYLON.Color4(0.49, 0.57, 0.76);
        rocket.color2 = new BABYLON.Color4(0.29, 0.29, 0.66);
        rocket.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.5);
        rocket.minSize = 1;
        rocket.maxSize = 1;
        rocket.addSizeGradient(0, 1);
        rocket.addSizeGradient(1, 0.01);
        this.rocket = rocket;
        
        this.height = sphere.position.y + Math.random() * (15 + 4) + 4;
        this.delay = (Math.random() * i + 1) * 60;
    }

    explosion(position) {
        const explosion = BABYLON.Mesh.CreateSphere("explosion", 4, 1, this.scene);
        explosion.isVisible = false;
        explosion.position = position;

        let emitter = explosion;
        emitter.useVertexColors = true;
        let vertPos = emitter.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let vertNorms = emitter.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        let vertColors = [];

        for (let i = 0; i < vertPos.length; i += 3) {
            let vertPosition = new BABYLON.Vector3( vertPos[i], vertPos[i + 1], vertNorms[i + 2])
            let vertNormal = new BABYLON.Vector3(vertNorms[i], vertNorms[i + 1], vertNorms[i + 2])
            let r = Math.random();
            let g = Math.random();
            let b = Math.random();
            let alpha = 1.0;
            let color = new BABYLON.Color4(r, g, b, alpha);
            vertColors.push(r);
            vertColors.push(g);
            vertColors.push(b);
            vertColors.push(alpha);

            let gizmo = BABYLON.Mesh.CreateBox("gizmo", 0.001, this.scene);
            gizmo.position = vertPosition;
            gizmo.parent = emitter;
            let direction = vertNormal.normalize().scale(1);

            const particleSys = new BABYLON.ParticleSystem("particles", 500, this.scene);
            particleSys.particleTexture = new BABYLON.Texture("./flare.png", this.scene);
            particleSys.emitter = gizmo;
            particleSys.minEmitBox = new BABYLON.Vector3(1, 0, 0);
            particleSys.maxEmitBox = new BABYLON.Vector3(1, 0, 0);
            particleSys.minSize = 0.1;
            particleSys.maxSize = 0.1;
            particleSys.color1 = color;
            particleSys.color2 = color;
            particleSys.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
            particleSys.minLifeTime = 1;
            particleSys.maxLifeTime = 2;
            particleSys.emitRate = 500;
            particleSys.gravity = new BABYLON.Vector3(0, -9.8, 0);
            particleSys.direction1 = direction;
            particleSys.direction2 = direction;
            particleSys.minEmitPower = 10;
            particleSys.maxEmitPower = 13;
            particleSys.updateSpeed = 0.01;
            particleSys.targetStopDuration = 0.2;
            particleSys.disposeOnStop = true;
            particleSys.start();
        }
        emitter.setVerticesData(BABYLON.VertexBuffer.ColorKind, vertColors);
    }

    startFireWork() {
        if (this.started) {
            if (this.emitter.position.y >= this.height && !this.exploded) {
                this.exploded = !this.exploded;
                this.explosions(this.emitter.position);
                this.emitter.dispose();
                this.rocket.stop();
            } else {
                this.emitter.position.y += 0.2;
            }
        } else {
            if (this.delay <= 0) {
                this.started = true;
                this.rocket.start();
            } {
                this.delay--;
            }
        }
    }
}