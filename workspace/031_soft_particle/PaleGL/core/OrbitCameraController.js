import {Vector3} from "../math/Vector3";
import {clamp} from "../utilities/mathUtilities.js";

export class OrbitCameraController {
    #camera;
    dumpingFactor = 0.01;
    minAzimuth;
    maxAzimuth;
    minAltitude = -45;
    maxAltitude = 45;
    azimuthSpeed = 100;
    altitudeSpeed = 100;
    #cameraAngle = { azimuth: 0, altitude: 0};
    #lookAtTarget = Vector3.zero();
    distance = 10;
    
    constructor(camera) {
        this.#camera = camera;
    }

    update(deltaX, deltaY) {
        this.#cameraAngle.azimuth += deltaX * this.azimuthSpeed;
        this.#cameraAngle.altitude += deltaY * this.altitudeSpeed;

        // TODO: limit azimuth
        this.#cameraAngle.azimuth = this.#cameraAngle.azimuth % 360;
        this.#cameraAngle.altitude = clamp(this.#cameraAngle.altitude, this.minAltitude, this.maxAltitude);

        const v1 = Vector3.rotateVectorX(new Vector3(0, 0, 1), this.#cameraAngle.altitude);
        const v2 = Vector3.rotateVectorY(v1, this.#cameraAngle.azimuth);
        const targetCameraPosition = v2.scale(this.distance).clone();

        this.#camera.transform.position = targetCameraPosition;
        this.#camera.transform.lookAt(this.#lookAtTarget);
    }
}