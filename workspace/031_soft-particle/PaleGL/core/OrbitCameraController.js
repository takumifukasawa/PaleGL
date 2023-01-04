import {Vector3} from "../math/Vector3.js";
import {clamp} from "../utilities/mathUtilities.js";

export class OrbitCameraController {
    #camera;
    dampingFactor = 0.01;
    minAzimuth;
    maxAzimuth;
    minAltitude = -45;
    maxAltitude = 45;
    azimuthSpeed = 100;
    altitudeSpeed = 100;
    #cameraAngle = { azimuth: 0, altitude: 0};
    #lookAtTarget = Vector3.zero;
    distance = 10;
    attenuation = 0.001;
    #targetX;
    #targetY;
    
    #targetCameraPosition = Vector3.zero;
    #currentCameraPosition = Vector3.zero;
    
    set lookAtTarget(v) {
        this.#lookAtTarget = v;
    }
    
    constructor(camera) {
        this.#camera = camera;
    }
    
    start(defaultAzimuth = 0, defaultAltitude = 0) {
        this.#cameraAngle.azimuth = defaultAzimuth;
        this.#cameraAngle.altitude = defaultAltitude;
        this.#updateCameraPosition(true);
        // this.#targetCameraPosition = new Vector3(0, 0, this.distance);
        // this.#currentCameraPosition = this.#targetCameraPosition.clone();
    }
    
    setDelta(deltaX, deltaY) {
        this.#targetX = deltaX;
        this.#targetY = deltaY;
    }

    fixedUpdate() {
        this.#targetX = Math.sign(this.#targetX) * Math.max(0, Math.abs(this.#targetX) - this.attenuation);
        this.#targetY = Math.sign(this.#targetY) * Math.max(0, Math.abs(this.#targetY) - this.attenuation);
        
        this.#cameraAngle.azimuth += this.#targetX * this.azimuthSpeed;
        this.#cameraAngle.altitude += this.#targetY * this.altitudeSpeed;
        
        this.#updateCameraPosition();
    }

    #updateCameraPosition(isJump = false) {
        // TODO: limit azimuth
        this.#cameraAngle.azimuth = this.#cameraAngle.azimuth % 360;
        this.#cameraAngle.altitude = clamp(this.#cameraAngle.altitude, this.minAltitude, this.maxAltitude);

        const v1 = Vector3.rotateVectorX(new Vector3(0, 0, 1), this.#cameraAngle.altitude);
        const v2 = Vector3.rotateVectorY(v1, this.#cameraAngle.azimuth);
        this.#targetCameraPosition = Vector3.addVectors(
            this.#lookAtTarget,
            v2.scale(this.distance)
        );
        this.#currentCameraPosition = Vector3.lerpVectors(
            this.#currentCameraPosition,
            this.#targetCameraPosition,
            isJump ? 1 : this.dampingFactor
        );

        this.#camera.transform.position = this.#currentCameraPosition;
        this.#camera.transform.lookAt(this.#lookAtTarget);
    }
}