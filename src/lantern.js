/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */
import * as BABYLON from "@babylonjs/core";
import {
    Vector3
} from "@babylonjs/core";

import rocketTexture from "./textures/flare.png"
import solidStar from "./textures/solidStar.png"


export class lantern {
    constructor(light, mesh, scene, position, animationGroups) {
        this.scene = scene;
        // Properties
        this.isLit = false;
        this.lightmt1 = light;
        
        // Load lantern
        this.loadLantern(mesh, position);
        
        this.loadStars();

        this.spinAnimation = animationGroups;


        // ILLUMINASHONE
        const lightSphere = new BABYLON.PointLight("lantern light", this.mesh.getAbsolutePosition(), this.scene);
        lightSphere.intensity = 0;
        lightSphere.radius = 2;
        lightSphere.diffuse = new BABYLON.Color3(0.45, 0.56, 0.80);
        this.spherical = lightSphere;

        // Set animations
        this.findNearestMeshes(lightSphere);
    }

    loadLantern(mesh, position) {
        try {
            this.mesh = mesh;
            this.mesh.scaling = new Vector3(0.8, 0.8, 0.8);
            this.mesh.setAbsolutePosition(position);
            this.mesh.isPickable = false;
        } catch (error) {
            console.log("Something was wrong in LoadLantern");
            console.log(error);
        }
    }
    
    setEmissiveTexture() {
        this.isLit = true;
    
        // Play animation and particle system
        this.spinAnimation.play();
        this.stars.start();
        // Swap texture
        this.mesh.material = this.lightmt1;
        this.spherical.intensity = 30;
    }
    
    findNearestMeshes(light) {
        if(this.mesh.name.includes("14" || this.mesh.name.includes("15"))) {
            light.includedOnlyMeshes.push(this.scene.getMeshByName("festivalPlatform1"));
        } else if(this.mesh.name.includes("16" || this.mesh.name.includes("17"))) {
            light.includedOnlyMeshes.push(this.scene.getMeshByName("festivalPlatform2"));
        } else if(this.mesh.name.includes("18" || this.mesh.name.includes("19"))) {
            light.includedOnlyMeshes.push(this.scene.getMeshByName("festivalPlatform3"));
        } else if(this.mesh.name.includes("20" || this.mesh.name.includes("21"))) {
            light.includedOnlyMeshes.push(this.scene.getMeshByName("festivalPlatform4"));
        }

        this.scene.getTransformNodeByName(this.mesh.name + "lights").getChildMeshes().forEach(mesh => {
            light.includedOnlyMeshes.push(mesh);
        });
    }
    
    loadStars() {
        const particlesInTheirMultitudes = new BABYLON.ParticleSystem("stars", 1000, this.scene);

        particlesInTheirMultitudes.particleTexture = new BABYLON.Texture("./solidStar.png", this.scene);
        particlesInTheirMultitudes.emitter = new BABYLON.Vector3(this.mesh.position.x, this.mesh.position.y + 1.5, this.mesh.position.z);
        particlesInTheirMultitudes.createPointEmitter(new BABYLON.Vector3(0.6, 1, 0), new BABYLON.Vector3(0, 1, 0));
        particlesInTheirMultitudes.color1 = new BABYLON.Color4(1, 1, 1);
        particlesInTheirMultitudes.color2 = new BABYLON.Color4(1, 1, 1);
        particlesInTheirMultitudes.colorDead = new BABYLON.Color4(1, 1, 1, 1);
        particlesInTheirMultitudes.emitRate = 12;
        particlesInTheirMultitudes.minEmitPower = 14;
        particlesInTheirMultitudes.maxEmitPower = 14;
        particlesInTheirMultitudes.addStartSizeGradient(0, 2);
        particlesInTheirMultitudes.addStartSizeGradient(1, 0.8);
        particlesInTheirMultitudes.minAngularSpeed = 0;
        particlesInTheirMultitudes.maxAngularSpeed = 2;
        particlesInTheirMultitudes.addDragGradient(0, 0.7, 0.7);
        particlesInTheirMultitudes.targetStopDuration = 0.25;
    
        this.stars = particlesInTheirMultitudes;
    }
}
