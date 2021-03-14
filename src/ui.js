/* eslint require-jsdoc: "off" */
/* eslint no-unused-vars: "off"*/
import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui"
import sparkLifeArt from "./sprites/sparkLife.png";
import sparkArt from "./sprites/spark.png";
import pauseBtnArt from "./sprites/pauseBtn.png";
import pauseArt from "./sprites/pause.jpeg";
import controlsArt from "./sprites/controls.jpeg";
import lanternButtonArt from "./sprites/lanternbutton.jpeg";

export class hud {
    constructor (scene) {
        this.scene = scene;

        // Properties
        this.prevTime = 0;
        this.clockTime = null;
        this.sString = "00";
        this.mString = 11;
        this.transition = false;

        const playerUI = new GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.playerUI = playerUI
        this.playerUI.idealHeight = 720;

        const lanternCount = new GUI.TextBlock();
        lanternCount.name = "lantern count";
        lanternCount.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        lanternCount.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        lanternCount.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        lanternCount.fontSize = "22px";
        lanternCount.color = "white";
        lanternCount.text = "Lanterns: 1 / 22";
        lanternCount.top = "32px";
        lanternCount.left = "-64px";
        lanternCount.width = "25%";
        lanternCount.fontFamily = "Viga";
        lanternCount.resizeToFit = true;
        playerUI.addControl(lanternCount);
        this.lanternCount = lanternCount;

        const stackPanel = new GUI.StackPanel();
        stackPanel.height = "100%";
        stackPanel.width = "100%";
        stackPanel.top = "14px";
        stackPanel.verticalAlignment = 0;
        playerUI.addControl(stackPanel);

        const clockTime = new GUI.TextBlock();
        clockTime.name = "clock";
        clockTime.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        clockTime.fontSize = "48px";
        clockTime.color = "white";
        clockTime.text = "11:00";
        clockTime.resizeToFit = true;
        clockTime.height = "96px";
        clockTime.width = "220px";
        clockTime.fontFamily = "Viga";
        stackPanel.addControl(clockTime);
        this.clockTime = clockTime;

        const sparklerLife = new GUI.Image("spakeLife", "/sparkLife.png");
        sparklerLife.width = "54px";
        sparklerLife.height = "162px";
        sparklerLife.cellId = 0;
        sparklerLife.cellHeight = 108;
        sparklerLife.cellWidth = 36;
        sparklerLife.sourceWidth = 36;
        sparklerLife.sourceHeight = 108;
        sparklerLife.horizontalAlignment = 0;
        sparklerLife.verticalAlignment = 0;
        sparklerLife.left = "14px";
        sparklerLife.top = "20px";
        playerUI.addControl(sparklerLife);
        this.sparklerLife = sparklerLife;

        const spark = new GUI.Image("spark", "/spark.png");
        spark.width = "40px";
        spark.height = "40px";
        spark.cellId = 0;
        spark.cellHeight = 20;
        spark.cellWidth = 20;
        spark.sourceWidth = 20;
        spark.sourceHeight = 20;
        spark.horizontalAlignment = 0;
        spark.verticalAlignment = 0;
        spark.left = "21px";
        spark.top = "20px";
        playerUI.addControl(spark);
        this.spark = spark;

        const pauseBtn = GUI.Button.CreateImageOnlyButton("pauseBtn", "/pauseBtn.png");
        pauseBtn.width = "48px";
        pauseBtn.height = "86px";
        pauseBtn.thickness = 0;
        pauseBtn.verticalAlignment = 0;
        pauseBtn.horizontalAlignment = 1;
        pauseBtn.top = "-16px";
        playerUI.addControl(pauseBtn);
        pauseBtn.zIndex = 10;
        this.pauseBtn = pauseBtn;
        // When pause is down, make pause menu visable and add controls
        pauseBtn.onPointerDownObservable.add(() => {
            this.pauseMenu.isVisible = true;
            playerUI.addControl(this.pauseMenu);
            this.pauseBtn.isHitTestVisible = false;

            // When paused, make sure next start time is equal to time when paused
            this.gamePaused = true;
            this.prevTime = this.time;
        })
        this.createPauseMenu();
        this.createControlsMenu();
    }

    updateHud() {
        if (!this.stopTimer && this.startTime != null) {
            let currentTime = Math.floor((new Date().getTime() - this.startTime) / 1000) + this.prevTime;

            this.time = currentTime;
            this.clockTime.text = this.formatTime(currentTime);
        }
    }
    
    updateLanternCount(number) {
        this.lanternCount.text = `Lanterns: ${number} / 22`;
    }

    startTimer() {
        this.startTime = new Date().getTime();
        this.stopTimer = false;
    }

    stopTimer() {
        this.stopTimer = true;
    }

    formatTime(time) {
        let minutesPassed = Math.floor(time / 60);
        let secondsPassed = time % 240;

        if (secondsPassed % 4 == 0) {
            this.mString = Math.floor(minutesPassed / 4) + 11;
            this.sString = (secondsPassed / 4 < 10 ? "0" : "") + secondsPassed / 4;
        }
        let day = this.mString == 11 ? " PM" : " AM";
        return (this.mString + ":" + this.sString + day);
    }

    startSparklerTimer(sparkler) {
        this.stopSpark = false;
        this.sparklerLife.cellId = 0;
        this.spark.cellId = 0;
        if (this.handle) {
            clearInterval(this.handle);
        }
        if (this.sparkhandle) {
            clearInterval(this.sparkhandle);
        }

        this.scene.getLightByName("sparklight").intensity = 35;

        this.handle = setInterval(() => {
            if (!this.gamePaused) {
                if (this.sparklerLife.cellId < 10) {
                    this.sparklerLife.cellId++;
                }
                if (this.sparklerLife.cellId == 10) {
                    this.stopSpark = true;
                    clearInterval(this.handle);
                }
            }
        }, 2000);

        this.sparkhandle = setInterval(() => {
            if (!this.gamePaused) {
                if (this.sparklerLife.cellId < 10 && this.spark.cellId < 5) {
                    this.spark.cellId++;
                } else if (this.sparklerLife.cellId < 10 && this.spark.cellId >=5) {
                    this.spark.cellId = 0;
                } else {
                    this.spark.cellId = 0;
                    clearInterval(this.sparkhandle);
                }
            }
        }, 185);
    }

    stopSparklerTimer(sparkler) {
        this.stopSpark = true;
        this.scene.getLightByName("sparklight").intensity = 0;
    }

    createPauseMenu() {
        this.gamePaused = false;

        const pauseMenu = new GUI.Rectangle();
        pauseMenu.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        pauseMenu.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        pauseMenu.height = 0.8;
        pauseMenu.width = 0.5;
        pauseMenu.thickness = 0;
        pauseMenu.isVisible = false;

        const image = new GUI.Image("pause", "/pause.jpeg");
        pauseMenu.addControl(image);

        const stackPanel = new GUI.StackPanel();
        stackPanel.width = 0.83;
        pauseMenu.addControl(stackPanel);

        const resumeBtn = GUI.Button.CreateSimpleButton("resume", "RESUME");
        resumeBtn.widht = 0.18;
        resumeBtn.height = "44px";
        resumeBtn.color = "white";
        resumeBtn.fontFamily = "Viga";
        resumeBtn.paddingBottom = "14px";
        resumeBtn.cornerRadius = 14;
        resumeBtn.fontSize = "12px";
        resumeBtn.textBlock.resizeToFit = true;
        resumeBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        resumeBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        stackPanel.addControl(resumeBtn);

        this.pauseMenu = pauseMenu;

        resumeBtn.onPointerDownObservable.add(() => {
            this.pauseMenu.isVisible = false;
            this.playerUI.removeControl(pauseMenu);
            this.pauseBtn.isHitTestVisible = true;

            this.gamePaused = false;
            this.startTime = new Date().getTime();
        });

        const controlsBtn = GUI.Button.CreateSimpleButton("controls", "CONTROLS");
        controlsBtn.width = 0.18;
        controlsBtn.height = "44px";
        controlsBtn.color = "white";
        controlsBtn.fontFamily = "Viga";
        controlsBtn.paddingBottom = "14px";
        controlsBtn.cornerRadius = 14;
        controlsBtn.fontSize = "12px";
        resumeBtn.textBlock.resizeToFit = true;
        controlsBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        controlsBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        stackPanel.addControl(controlsBtn);

        controlsBtn.onPointerDownObservable.add(() => {
            this.controls.isVisible = true;
            this.pauseMenu.isVisible = false;
        });

        const quitBtn = GUI.Button.CreateSimpleButton("quit", "QUIT");
        quitBtn.width = 0.18;
        quitBtn.height = "44px";
        quitBtn.color = "white";
        quitBtn.fontFamily = "Viga";
        quitBtn.paddingBottom = "14px";
        quitBtn.cornerRadius = 14;
        quitBtn.fontSize = "12px";
        resumeBtn.textBlock.resizeToFit = true;
        quitBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        quitBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        stackPanel.addControl(quitBtn);

        quitBtn.onPointerDownObservable.add(() => {
            const postProcess = new BABYLON.PostProcess("Fade", "fade", ["fadeLevel"], null, 1.0, this.scene.getCameraByName("cam"));
            postProcess.onApply = effect => {
                effect.setFloat("fadeLevel", this.fadeLevel)
            }
            this.transition = true;
        })

        BABYLON.Effect.RegisterShader("fade",
        "precision highp float;" +
        "varying vec2 vUV;" +
        "uniform sampler2d textureSampler;" +
        "uniform float fadeLevel;" +
        "void main(void){" +
        "vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;" +
        "baseColor.a = 1.0;" +
        "gl_FragColor = baseColor;" +
        "}"
        );
        this.fadeLevel = 1.0;
    }

    createControlsMenu() {
        const controls = new GUI.Rectangle();
        controls.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        controls.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        controls.height = 0.8;
        controls.width = 0.5;
        controls.thickness = 0;
        controls.color = "white";
        controls.isVisible = false;
        this.playerUI.addControl(controls);
        this.controls = controls;

        const image = new GUI.Image("controls", "/controls.jpeg");
        controls.addControl(image);

        const title = new GUI.TextBlock("title", "CONTROLS");
        title.resizeToFit = true;
        title.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        title.fontFamily = "Viga";
        title.fontSize = "32px";
        title.top = "14px";
        controls.addControl(title);

        const backBtn = GUI.Button.CreateImageOnlyButton("back", "/lanternbutton.jpeg");
        backBtn.width = "40px";
        backBtn.height = "40px";
        backBtn.top = "14px";
        backBtn.thickness = 0;
        backBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        backBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        controls.addControl(backBtn);

        backBtn.onPointerDownObservable.add(() => {
            this.pauseMenu.isVisible = true;
            this.controls.isVisible = false;
        });
    }
}