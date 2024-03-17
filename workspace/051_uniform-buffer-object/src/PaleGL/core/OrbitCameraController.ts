import { Vector3 } from '@/PaleGL/math/Vector3.js';
import { clamp } from '@/PaleGL/utilities/mathUtilities.js';
import { Camera } from '@/PaleGL/actors/Camera';

export class OrbitCameraController {
    #camera: Camera;
    dampingFactor = 0.01;
    // minAzimuth: number;
    // maxAzimuth: number;
    minAzimuth: number = -45;
    maxAzimuth: number = 45;
    minAltitude: number = -45;
    maxAltitude: number = 45;
    azimuthSpeed: number = 100;
    altitudeSpeed: number = 100;
    #cameraAngle: { azimuth: number; altitude: number } = { azimuth: 0, altitude: 0 };
    #lookAtTarget: Vector3 = Vector3.zero;
    distance: number = 10;
    attenuation: number = 0.001;
    #targetX: number = 0;
    #targetY: number = 0;
    deltaAzimuthPower: number = 1;
    deltaAltitudePower: number = 1;

    defaultAzimuth: number = 0;
    defaultAltitude: number = 0;

    enabled: boolean = true;

    #targetCameraPosition = Vector3.zero;
    #currentCameraPosition = Vector3.zero;

    set lookAtTarget(v: Vector3) {
        this.#lookAtTarget = v;
    }

    constructor(camera: Camera) {
        this.#camera = camera;
    }

    start(defaultAzimuth: number | null = null, defaultAltitude: number | null = null) {
        this.#cameraAngle.azimuth = defaultAzimuth !== null ? defaultAzimuth : this.defaultAzimuth;
        this.#cameraAngle.altitude = defaultAltitude !== null ? defaultAltitude : this.defaultAltitude;
        this.#updateCameraPosition(true);
        // this.#targetCameraPosition = new Vector3(0, 0, this.distance);
        // this.#currentCameraPosition = this.#targetCameraPosition.clone();
    }

    setDelta(delta: { x: number; y: number }) {
        if (!this.enabled) {
            return;
        }
        this.#targetX = delta.x * this.deltaAzimuthPower;
        this.#targetY = delta.y * this.deltaAltitudePower;
    }

    fixedUpdate() {
        if (!this.enabled) {
            return;
        }
       
        this.#targetX = Math.sign(this.#targetX) * Math.max(0, Math.abs(this.#targetX) - this.attenuation);
        this.#targetY = Math.sign(this.#targetY) * Math.max(0, Math.abs(this.#targetY) - this.attenuation);

        this.#cameraAngle.azimuth += this.#targetX * this.azimuthSpeed;
        this.#cameraAngle.altitude += this.#targetY * this.altitudeSpeed;

        this.#updateCameraPosition();
    }

    #updateCameraPosition(isJump = false) {
        // TODO: limit azimuth
        // this.#cameraAngle.azimuth = this.#cameraAngle.azimuth % 360;
        this.#cameraAngle.azimuth = clamp(this.#cameraAngle.azimuth, this.minAzimuth, this.maxAzimuth);
        this.#cameraAngle.altitude = clamp(this.#cameraAngle.altitude, this.minAltitude, this.maxAltitude);

        const v1 = Vector3.rotateVectorX(new Vector3(0, 0, 1), this.#cameraAngle.altitude);
        const v2 = Vector3.rotateVectorY(v1, this.#cameraAngle.azimuth);
        this.#targetCameraPosition = Vector3.addVectors(this.#lookAtTarget, v2.scale(this.distance));
        this.#currentCameraPosition = Vector3.lerpVectors(
            this.#currentCameraPosition,
            this.#targetCameraPosition,
            isJump ? 1 : this.dampingFactor
        );

        this.#camera.transform.position = this.#currentCameraPosition;
        this.#camera.transform.lookAt(this.#lookAtTarget);
    }
}
