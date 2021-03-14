/* eslint require-jsdoc: "off" */
/* eslint no-unused-vars: "off"*/
import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import {
    world
} from "./world.js";
import {
    player
} from "./character.js";
import {
    playerInput
} from "./inputController.js";
import {
    hud
} from "./ui.js";
import "babylonjs-loaders";
import "@babylonjs/loaders/glTF";
import playerModel from './models/player.glb';
import { HDRCubeTexture } from "@babylonjs/core";

import beginningAnimation from "./sprites/beginning_anim.png";
import workingAnimation from "./sprites/working_anim.png";
import dropoffAnimation from "./sprites/dropoff_anim.png";
import leavingAnimation from "./sprites/leaving_anim.png";
import readingAnimation from "./sprites/reading_anim.png";
import watermelonAnimation from "./sprites/watermelon_anim.png";
import dialogueBg from "./sprites/bg_anim_text_dialogue.png";
import dialoglog from "./sprites/text_dialogue.png";
import arrowBtn from "./sprites/arrowBtn.png";

console.log("Load");
var canvasGame;
// var canvasGame = document.getElementById("renderCanvas");
var engineGame = BABYLON.Engine;
var sceneGame = BABYLON.Scene;
var gameScene = BABYLON.Scene;
var cutSceneGame = BABYLON.Scene;
var worldGame;
var assetsGame;
var playerGame;
var inputGame;
var uiGame;

var state = {
    START: 0,
    GAME: 1,
    LOSE: 2,
    CUTSCENE: 3,
};

var stateGame = state.START;

async function createScene() {
    try {
        construct();
    } catch (error) {
        console.log("Something was wrong in Create");
        console.log(error);
    }
}

async function construct() {
    try {
        console.log("Construct");
        // Resizing Canvas
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        //create the canvas html element and attach it to the webpage
        canvasGame = document.createElement("canvas");
        canvasGame.style.width = "100%";
        canvasGame.style.height = "100%";
        canvasGame.id = "renderCanvas";
        document.body.appendChild(canvasGame);

        // Initialize babylon scene and engine
        engineGame = new BABYLON.Engine(canvasGame, true);
        sceneGame = new BABYLON.Scene(engineGame);

        // Hide/show the Inspector
        window.addEventListener("keydown", ev => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (sceneGame.debugLayer.isVisible()) {
                    sceneGame.debugLayer.hide();
                } else {
                    sceneGame.debugLayer.show();
                }
            }
        });

        main();
    } catch (error) {
        console.log("Something was wrong in Construct");
        console.log(error);
    }
}

async function main() {
    try {
        console.log("Main");
        await goToStart();
        // Render loop, repeated scene render
        engineGame.runRenderLoop(() => {
            switch (stateGame) {
                case state.START:
                    sceneGame.render();
                    break;
                case state.CUTSCENE:
                    sceneGame.render();
                    break;
                case state.GAME:
                    if (uiGame.time >= 240 && !playerGame.win) {
                        goToLose();
                        uiGame.stopTimer();
                    }
                    sceneGame.render();
                    break;
                case state.LOSE:
                    sceneGame.render();
                    break;
                default:
                    break;
            }
        });
        window.addEventListener("resize", () => {
            engineGame.resize();
        })
    } catch (error) {
        console.log("Something was wrong in Main");
        console.log(error);
    }
}

async function goToStart() {
    try {
        console.log("Start");
        engineGame.displayLoadingUI();

        sceneGame.detachControl();
        var scene = new BABYLON.Scene(engineGame);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene);
        camera.setTarget(new BABYLON.Vector3.Zero());

        // GUI
        var guiMenu = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        // Start Button
        var startBtn = GUI.Button.CreateSimpleButton("start", "PLAY");
        startBtn.width = 0.2;
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(startBtn);

        // Button Interaction
        startBtn.onPointerDownObservable.add(() => {
            goToCutScene();
            scene.detachControl();
        });
        // When the scene's finished loading
        await scene.whenReadyAsync();

        engineGame.hideLoadingUI();
        // Set state to start
        sceneGame.dispose();
        sceneGame = scene;
        stateGame = state.START;
    } catch (error) {
        console.log("Something was wrong in Start");
        console.log(error);
    }
}

async function goToCutScene() {
    try {
        console.log("Cutscene");
        engineGame.displayLoadingUI();
        // Scene Setup
        sceneGame.detachControl();
        cutSceneGame = new BABYLON.Scene(engineGame);
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), cutSceneGame);
        camera.setTarget(new BABYLON.Vector3.Zero());
        cutSceneGame.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        // GUI
        var cutScene = GUI.AdvancedDynamicTexture.CreateFullscreenUI("cutscene");
        let transition = 0;
        let canplay = false;
        let finished_anim = false;
        let anims_loaded = 0;

        // Cutscene stuff
        const beginningAnimation = new GUI.Image("sparklife", "./beginning_anim.png");
        beginningAnimation.stretch = GUI.Image.STRETCH_UNIFORM;
        beginningAnimation.cellId = 0;
        beginningAnimation.cellHeight = 480;
        beginningAnimation.cellWidth = 480;
        beginningAnimation.sourceHeight = 480;
        beginningAnimation.sourceWidth = 480;
        cutScene.addControl(beginningAnimation);
        beginningAnimation.onImageLoadedObservable.add(() => {
            anims_loaded++;
        });
        const workingAnimation = new GUI.Image("sparklife", "./working_anim.png");
        workingAnimation.stretch = GUI.Image.STRETCH_UNIFORM;
        workingAnimation.cellId = 0;
        workingAnimation.cellHeight = 480;
        workingAnimation.cellWidth = 480;
        workingAnimation.sourceHeight = 480;
        workingAnimation.sourceWidth = 480;
        workingAnimation.isVisible = false;
        cutScene.addControl(workingAnimation);
        workingAnimation.onImageLoadedObservable.add(() => {
            anims_loaded++;
        });
        const dropoffAnimation = new GUI.Image("sparklife", "./dropoff_anim.png");
        dropoffAnimation.stretch = GUI.Image.STRETCH_UNIFORM;
        dropoffAnimation.cellId = 0;
        dropoffAnimation.cellHeight = 480;
        dropoffAnimation.cellWidth = 480;
        dropoffAnimation.sourceHeight = 480;
        dropoffAnimation.sourceWidth = 480;
        dropoffAnimation.isVisible = false;
        cutScene.addControl(dropoffAnimation);
        dropoffAnimation.onImageLoadedObservable.add(() => {
            anims_loaded++;
        });
        const leavingAnimation = new GUI.Image("sparklife", "./leaving_anim.png");
        leavingAnimation.stretch = GUI.Image.STRETCH_UNIFORM;
        leavingAnimation.cellId = 0;
        leavingAnimation.cellHeight = 480;
        leavingAnimation.cellWidth = 480;
        leavingAnimation.sourceHeight = 480;
        leavingAnimation.sourceWidth = 480;
        leavingAnimation.isVisible = false;
        cutScene.addControl(leavingAnimation);
        leavingAnimation.onImageLoadedObservable.add(() => {
            anims_loaded++;
        });
        const watermelonAnimation = new GUI.Image("sparklife", "./watermelon_anim.png");
        watermelonAnimation.stretch = GUI.Image.STRETCH_UNIFORM;
        watermelonAnimation.cellId = 0;
        watermelonAnimation.cellHeight = 480;
        watermelonAnimation.cellWidth = 480;
        watermelonAnimation.sourceHeight = 480;
        watermelonAnimation.sourceWidth = 480;
        watermelonAnimation.isVisible = false;
        cutScene.addControl(watermelonAnimation);
        watermelonAnimation.onImageLoadedObservable.add(() => {
            anims_loaded++;
        });
        const readingAnimation = new GUI.Image("sparklife", "./reading_anim.png");
        readingAnimation.stretch = GUI.Image.STRETCH_UNIFORM;
        readingAnimation.cellId = 0;
        readingAnimation.cellHeight = 480;
        readingAnimation.cellWidth = 480;
        readingAnimation.sourceHeight = 480;
        readingAnimation.sourceWidth = 480;
        readingAnimation.isVisible = false;
        cutScene.addControl(readingAnimation);
        readingAnimation.onImageLoadedObservable.add(() => {
            anims_loaded++;
        });

        // Dialogue Animation
        const dialogueBg = new GUI.Image("sparklife", "./bg_anim_text_dialogue.png");
        dialogueBg.stretch = GUI.Image.STRETCH_UNIFORM;
        dialogueBg.cellId = 0;
        dialogueBg.cellHeight = 480;
        dialogueBg.cellWidth = 480;
        dialogueBg.sourceHeight = 480;
        dialogueBg.sourceWidth = 480;
        dialogueBg.horizontalAlignment = 0;
        dialogueBg.verticalAlignment = 0;
        dialogueBg.isVisible = false;
        cutScene.addControl(dialogueBg);
        dialogueBg.onImageLoadedObservable.add(() => {
            anims_loaded++;
        });

        const dialoglog = new GUI.Image("sparklife", "./text_dialogue.png");
        dialoglog.stretch = GUI.Image.STRETCH_UNIFORM;
        dialoglog.cellId = 0;
        dialoglog.cellHeight = 480;
        dialoglog.cellWidth = 480;
        dialoglog.sourceHeight = 480;
        dialoglog.sourceWidth = 480;
        dialoglog.horizontalAlignment = 0;
        dialoglog.verticalAlignment = 0;
        dialoglog.isVisible = false;
        cutScene.addControl(dialoglog);
        dialoglog.onImageLoadedObservable.add(() => {
            anims_loaded++;
        });

        let dialogueTimer = setInterval(() => {
            if (finished_anim && dialogueBg.cellId < 3) {
                dialogueBg.cellId++;
            } else {
                dialogueBg.cellId = 0;
            }
        }, 250);

        // Skip
        const skipBtn = GUI.Button.CreateSimpleButton("skip", "SKIP");
        skipBtn.fontFamily = "Viga";
        skipBtn.width = "45px";
        skipBtn.left = "-14px";
        skipBtn.height = "40px";
        skipBtn.color = "white";
        skipBtn.top = "14px";
        skipBtn.thickness = 0;
        skipBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        skipBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        cutScene.addControl(skipBtn);

        skipBtn.onPointerDownObservable.add(() => {
            cutSceneGame.detachControl();
            clearInterval(animTimer);
            clearInterval(anim2Timer);
            clearInterval(dialogueTimer);
            engineGame.displayLoadingUI();
            canplay = true;
        });

        // Playing animations
        let animTimer;
        let anim2Timer;
        let anim = 1;
        // State for animations
        cutSceneGame.onBeforeRenderObservable.add(() => {
            if(anims_loaded == 8) {
                engineGame.hideLoadingUI();
                anims_loaded = 0;

                // Sequence
                animTimer = setInterval(() => {
                    switch(anim) {
                        case 1:
                            if(beginningAnimation.cellId == 9) {
                                anim++;
                                beginningAnimation.isVisible = false;
                                workingAnimation.isVisible = true;
                            } else {
                                beginningAnimation.cellId++;
                            }
                            break;
                        case 2:
                            if(workingAnimation.cellId == 11) {
                                anim++;
                                workingAnimation.isVisible = false;
                                dropoffAnimation.isVisible = true;
                            } else {
                                workingAnimation.cellId++;
                            }
                            break;
                        case 3:
                            if(dropoffAnimation.cellId == 11) {
                                anim++;
                                dropoffAnimation.isVisible = false;
                                leavingAnimation.isVisible = true;
                            } else {
                                dropoffAnimation.cellId++;
                            }
                            break;
                        case 4:
                            if(leavingAnimation.cellId == 9) {
                                anim++;
                                leavingAnimation.isVisible = false;
                                watermelonAnimation.isVisible = true;
                            } else {
                                leavingAnimation.cellId++;
                            }
                            break;
                        default:
                            break;
                    }
                }, 250)
                anim2Timer = setInterval(() => {
                    switch(anim) {
                        case 5:
                            if(watermelonAnimation.cellId == 8) {
                                anim++;
                                watermelonAnimation.isVisible = false;
                                readingAnimation.isVisible = true;
                            } else {
                                watermelonAnimation.cellId++;
                            }
                            break;
                        case 6:
                            if(readingAnimation.cellId == 11) {
                                readingAnimation.isVisible = false;
                                finished_anim = true;
                                dialogueBg.isVisible = true;
                                dialoglog.isVisible = true;
                                next.isVisible = true;
                            } else {
                                readingAnimation.cellId++;
                            }
                            break;
                    }
                }, 750);
            }

            if(finishedLoading && canplay) {
                canplay = false;
                goToGame();
            }
        });


        // Forward Dialogue
        var next = GUI.Button.CreateImageOnlyButton("next", "./arrowBtn.png");
        next.rotation = Math.PI / 2;
        next.thickness = 0;
        next.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        next.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        next.width = "64px";
        next.height = "64px";
        next.top = "-3%";
        next.left = "-12%";
        next.isVisible = false;
        cutScene.addControl(next);

        next.onPointerUpObservable.add(() => {
            if (transition == 8) {
                cutSceneGame.detachControl();
                engineGame.displayLoadingUI();
                transition = 0;
                canplay = true;
            } else if (transition < 8) {
                transition++;
                dialoglog.cellId++;
            }
        });

        // Finished Loading
        await cutSceneGame.whenReadyAsync();
        sceneGame.dispose();
        stateGame = state.CUTSCENE;
        sceneGame = cutSceneGame;

        // Start loading and setting up the game
        var finishedLoading = false;
        let setup = await setUpGame();
        if (setup !== undefined) {
            console.log("Error");
            console.log(setup);
        } else {
            finishedLoading = true;
        }
    } catch (error) {
        console.log("Something was wrong in Cutscene");
        console.log(error);
    }
}

async function setUpGame() {
    try {
        console.log("Setup");
        // Create Scene
        var scene = new BABYLON.Scene(engineGame);
        gameScene = scene;

        // Create World
        var worldInner = new world(scene);
        worldGame = worldInner;
        await worldGame.load();
        await loadCharacterAssets(scene);
    } catch (error) {
        console.log("Something was wrong in Setup");
        console.log(error);
    }
}

async function loadCharacterAssets(scene) {
    async function loadCharacter() {
        try {
            console.log("Load");
            var outer = BABYLON.MeshBuilder.CreateBox("outer", {
                width: 2,
                depth: 1,
                height: 3
            }, scene);
            outer.isVisible = false;
            outer.isPickable = false;
            outer.checkCollisions = true;

            // Move origin of box collider to bottom of player mesh and match
            outer.bakeTransformIntoVertices(BABYLON.Matrix.Translation(0, 1.5, 0));

            // Collider
            outer.ellipsoid = new BABYLON.Vector3(1, 1.5, 1);
            outer.ellipsoidOffset = new BABYLON.Vector3(0, 1.5, 0);
            // Make sure we can see the back of the player
            outer.rotationQuaternion = new BABYLON.Quaternion(0, 1, 0, 0);

            return BABYLON.SceneLoader.ImportMeshAsync("", "", "507f1cd0d36685b4bb568d79dd91e40f.glb", scene, undefined, ".glb").then(result => {
                var root = result.meshes[0];

                var body = root;
                body.parent = outer;
                body.isPickable = false;
                body.getChildMeshes().forEach(mesh => {
                    mesh.isPickable = false;
                });

                var animationGroups = result.animationGroups;

                return {
                    outer,
                    animationGroups
                }
            });
        } catch (error) {
            console.log("Something was wrong in Load Character");
            console.log(error);
        }
    }

    return loadCharacter()
        .then(assets => {
            assetsGame = assets;
        })
        .catch(error => {
            console.log("Something was wrong in Load Character Assets");
            console.log(error);
        })
}

async function initializeGameAsync(scene) {
    try {
        console.log("Initialize");
        var light0 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);

        var light = new BABYLON.PointLight("sparklight", new BABYLON.Vector3(0, 0, 0), scene);
        light.diffuse = new BABYLON.Color3(0.08627450980392157, 0.10980392156862745, 0.15294117647058825);
        light.intensity = 35;
        light.radius = 1;

        var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
        shadowGenerator.darkness = 0.4;

        playerGame = new player(assetsGame, scene, shadowGenerator, inputGame);
        var camera = playerGame.activatePlayerCamera();

        // LANTERN CHECK
        worldGame.checkLanterns(playerGame);

        scene.onBeforeRenderObservable.add(() => {
            if (playerGame.sparkReset) {
                uiGame.startSparklerTimer(playerGame.sparkler);
                playerGame.sparkReset = false;

                uiGame.updateLanternCount(playerGame.lanternsLit);
            } else if (uiGame.stopSpark && playerGame.sparkLit) {
                uiGame.stopSparklerTimer(playerGame.sparkler);
                player.sparkLit = false;
            }
            // if (playerGame.win && playerGame.lanternsLit == 22) {
            //     uiGame.gamePaused = true;
            //     uiGame.pauseBtn.isHitTestVisible = false;

            //     let i = 10;
            //     window.setInterval(() => {
            //         i--;
            //         if (i == 0) {
            //             showWin();
            //         }
            //     }), 1000;
            // }
            if(!uiGame.gamePaused) {
                uiGame.updateHud();
            }
        })
    } catch (error) {
        console.log("Something was wrong in Initialize");
        console.log(error);
    }
}

async function goToGame() {
    try {
        console.log("Game");
        // Scene Setup
        var scene = gameScene;
        scene.clearColor = new BABYLON.Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098);

        // GUI
        const ui = new hud(scene);
        uiGame = ui;
        sceneGame.detachControl();

        // Input
        inputGame = new playerInput(scene);

        await initializeGameAsync(scene, uiGame);

        // Get rid of start scene, switch to gamescene and change states
        await scene.whenReadyAsync();
        scene.getMeshByName("outer").position = scene.getTransformNodeByName("startPosition").getAbsolutePosition();
        uiGame.startTimer();
        uiGame.startSparklerTimer();
        sceneGame.dispose();
        stateGame = state.GAME;
        sceneGame = scene;
        engineGame.hideLoadingUI();
        // Re-attach control
        sceneGame.attachControl();
    } catch (error) {
        console.log("Something was wrong in Game");
        console.log(error);
    }
}

async function goToLose() {
    try {
        console.log("Lose");
        engineGame.displayLoadingUI();

        // Scene Setup
        sceneGame.detachControl();
        var scene = new BABYLON.Scene(engineGame);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene);
        camera.setTarget(new BABYLON.Vector3.Zero());

        // GUI
        var guiMenu = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var mainBtn = GUI.Button.CreateSimpleButton("mainmenu", "MAIN MENU");
        mainBtn.width = 0.2;
        mainBtn.height = "40px";
        mainBtn.color = "white";
        guiMenu.addControl(mainBtn);

        // Button Interaction
        mainBtn.onPointerDownObservable.add(() => {
            goToStart();
        });
        // Finished Loading
        await scene.whenReadyAsync();
        // Hide loading when scene's ready
        engineGame.hideLoadingUI();
        // Set current state and scene to lose
        sceneGame.dispose();
        sceneGame = scene;
        stateGame = state.LOSE;
    } catch (error) {
        console.log("Something was wrong in Lose");
        console.log(error);
    }
}

createScene();