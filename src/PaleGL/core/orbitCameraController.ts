import {
    addVector3Array,
    createVector3,
    createVector3Zero,
    lerpVector3,
    rotateVector3DegreeX,
    rotateVector3DegreeY,
    scaleVector3ByScalar,
} from '@/PaleGL/math/vector3.ts';
import { clamp } from '@/PaleGL/utilities/mathUtilities.js';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { setLookAtPosition, setTranslation } from '@/PaleGL/core/transform.ts';

export type OrbitCameraController = ReturnType<typeof createOrbitCameraController>;

export function createOrbitCameraController(camera: Camera | null = null) {
    const dampingFactor = 0.01;
    const minAzimuth = -45;
    const maxAzimuth = 45;
    const minAltitude = -45;
    const maxAltitude = 45;
    const azimuthSpeed = 100;
    const altitudeSpeed = 100;
    const cameraAngle = { azimuth: 0, altitude: 0 };
    const lookAtTarget = createVector3Zero();
    const distance = 10;
    const attenuation = 0.001;
    const targetX = 0;
    const targetY = 0;
    const deltaAzimuthPower = 1;
    const deltaAltitudePower = 1;
    const defaultAzimuth = 0;
    const defaultAltitude = 0;
    const enabled = true;
    const enabledUpdateCamera = true;
    const targetCameraPosition = createVector3Zero();
    const currentCameraPosition = createVector3Zero();

    return {
        camera,
        dampingFactor,
        minAzimuth,
        maxAzimuth,
        minAltitude,
        maxAltitude,
        azimuthSpeed,
        altitudeSpeed,
        cameraAngle,
        lookAtTarget,
        distance,
        attenuation,
        targetX,
        targetY,
        deltaAzimuthPower,
        deltaAltitudePower,
        defaultAzimuth,
        defaultAltitude,
        enabled,
        enabledUpdateCamera,
        targetCameraPosition,
        currentCameraPosition,
    };
}

export const setOrbitCameraControllerCamera = (orbitCameraController: OrbitCameraController, camera: Camera | null) => {
    orbitCameraController.camera = camera;
};

export const startOrbitCameraController = (
    orbitCameraController: OrbitCameraController,
    daz: number | null = null,
    dal: number | null = null
) => {
    orbitCameraController.cameraAngle.azimuth = daz !== null ? daz : orbitCameraController.defaultAzimuth;
    orbitCameraController.cameraAngle.altitude = dal !== null ? dal : orbitCameraController.defaultAltitude;
    updateCameraPosition(orbitCameraController, true);
    // this.#targetCameraPosition = new Vector3(0, 0, this.distance);
    // this.#currentCameraPosition = this.#targetCameraPosition.clone();
};

export function setOrbitCameraControllerDelta(
    orbitCameraController: OrbitCameraController,
    delta: {
        x: number;
        y: number;
    }
) {
    if (!orbitCameraController.enabled) {
        return;
    }
    orbitCameraController.targetX = delta.x * orbitCameraController.deltaAzimuthPower;
    orbitCameraController.targetY = delta.y * orbitCameraController.deltaAltitudePower;
}

export function fixedUpdateOrbitCameraController(orbitCameraController: OrbitCameraController) {
    if (!orbitCameraController.enabled) {
        return;
    }

    orbitCameraController.targetX =
        Math.sign(orbitCameraController.targetX) *
        Math.max(0, Math.abs(orbitCameraController.targetX) - orbitCameraController.attenuation);
    orbitCameraController.targetY =
        Math.sign(orbitCameraController.targetY) *
        Math.max(0, Math.abs(orbitCameraController.targetY) - orbitCameraController.attenuation);

    orbitCameraController.cameraAngle.azimuth += orbitCameraController.targetX * orbitCameraController.azimuthSpeed;
    orbitCameraController.cameraAngle.altitude += orbitCameraController.targetY * orbitCameraController.altitudeSpeed;

    updateCameraPosition(orbitCameraController);
}

function updateCameraPosition(orbitCameraController: OrbitCameraController, isJump = false) {
    // TODO: limit azimuth
    // this.#cameraAngle.azimuth = this.#cameraAngle.azimuth % 360;
    orbitCameraController.cameraAngle.azimuth = clamp(
        orbitCameraController.cameraAngle.azimuth,
        orbitCameraController.minAzimuth,
        orbitCameraController.maxAzimuth
    );
    orbitCameraController.cameraAngle.altitude = clamp(
        orbitCameraController.cameraAngle.altitude,
        orbitCameraController.minAltitude,
        orbitCameraController.maxAltitude
    );

    const v1 = rotateVector3DegreeX(createVector3(0, 0, 1), orbitCameraController.cameraAngle.altitude);
    const v2 = rotateVector3DegreeY(v1, orbitCameraController.cameraAngle.azimuth);
    orbitCameraController.targetCameraPosition = addVector3Array(
        orbitCameraController.lookAtTarget,
        scaleVector3ByScalar(v2, orbitCameraController.distance)
    );
    orbitCameraController.currentCameraPosition = lerpVector3(
        orbitCameraController.currentCameraPosition,
        orbitCameraController.targetCameraPosition,
        isJump ? 1 : orbitCameraController.dampingFactor
    );

    if (orbitCameraController.camera && orbitCameraController.enabledUpdateCamera) {
        setTranslation(orbitCameraController.camera.transform, orbitCameraController.currentCameraPosition);
        setLookAtPosition(orbitCameraController.camera.transform, orbitCameraController.lookAtTarget);
    }
}
