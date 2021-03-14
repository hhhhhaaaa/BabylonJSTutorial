/* eslint require-jsdoc: "off" */
/* eslint no-unused-vars: "off"*/
import * as BABYLON from "@babylonjs/core";

export class playerInput {
    constructor(scene) {
                // Properties
        this.horizontal = 0;
        this.vertical = 0;
        this.horizontalAxis = 0;
        this.verticalAxis = 0;
        this.dashing = false;
        this.jumpKeyDown = false;
        scene.actionManager = new BABYLON.ActionManager(scene);

        this.inputMap = {};
        scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnKeyDownTrigger, (event) => {
                    this.inputMap[event.sourceEvent.key] = event.sourceEvent.type == "keydown";
                }
            )
        );
        scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnKeyUpTrigger, (event) => {
                    this.inputMap[event.sourceEvent.key] = event.sourceEvent.type == "keydown";
                }
            )
        )
        scene.onBeforeRenderObservable.add(() => {
            this.updateFromKeyboard();
        });
    }

    updateFromKeyboard() {
        if (this.inputMap["ArrowUp"]) {
            this.vertical = BABYLON.Scalar.Lerp(this.vertical, 1, 0.2);
            this.verticalAxis = 1;
        } else if (this.inputMap["ArrowDown"]) {
            this.vertical = BABYLON.Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
        } else {
            this.vertical = 0;
            this.verticalAxis = 0;
        }
    
        if (this.inputMap["ArrowLeft"]) {
            this.horizontal = BABYLON.Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;
        } else if (this.inputMap["ArrowRight"]) {
            this.horizontal = BABYLON.Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        } else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }
    
        if (this.inputMap["Shift"]) {
    
            this.dashing = true;
        } else {
            this.dashing = false;
        }
    
        if (this.inputMap[" "]) {
            this.jumpKeyDown = true;
        } else {
            this.jumpKeyDown = false;
        }
    }
}
