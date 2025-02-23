import { Vector3 } from '@/PaleGL/math/Vector3.js';
import { clamp } from '@/PaleGL/utilities/mathUtilities.js';
import { Camera } from '@/PaleGL/actors/Camera';

export function createOrbitCameraController(camera?: Camera | null) {
    let _camera = camera ?? null;
    let _dampingFactor = 0.01;
    let _minAzimuth = -45;
    let _maxAzimuth = 45;
    let _minAltitude = -45;
    let _maxAltitude = 45;
    let _azimuthSpeed = 100;
    let _altitudeSpeed = 100;
    const _cameraAngle = { azimuth: 0, altitude: 0 };
    let _lookAtTarget = Vector3.zero;
    let _distance = 10;
    let _attenuation = 0.001;
    let _targetX = 0;
    let _targetY = 0;
    let _deltaAzimuthPower = 1;
    let _deltaAltitudePower = 1;
    let _defaultAzimuth = 0;
    let _defaultAltitude = 0;
    let _enabled = true;
    let _enabledUpdateCamera = true;
    let _targetCameraPosition = Vector3.zero;
    let _currentCameraPosition = Vector3.zero;

    const setCamera = (camera: Camera | null) => {
        _camera = camera;
    };

    setCamera(camera ?? null);

    const start = (daz: number | null = null, dal: number | null = null) => {
        _cameraAngle.azimuth = daz !== null ? daz : _defaultAzimuth;
        _cameraAngle.altitude = dal !== null ? dal : _defaultAltitude;
        _updateCameraPosition(true);
        // this.#targetCameraPosition = new Vector3(0, 0, this.distance);
        // this.#currentCameraPosition = this.#targetCameraPosition.clone();
    };

    const setDelta = (delta: { x: number; y: number }) => {
        if (!_enabled) {
            return;
        }
        _targetX = delta.x * _deltaAzimuthPower;
        _targetY = delta.y * _deltaAltitudePower;
    };

    const fixedUpdate = () => {
        if (!_enabled) {
            return;
        }

        _targetX = Math.sign(_targetX) * Math.max(0, Math.abs(_targetX) - _attenuation);
        _targetY = Math.sign(_targetY) * Math.max(0, Math.abs(_targetY) - _attenuation);

        _cameraAngle.azimuth += _targetX * _azimuthSpeed;
        _cameraAngle.altitude += _targetY * _altitudeSpeed;

        _updateCameraPosition();
    };

    const _updateCameraPosition = (isJump = false) => {
        // TODO: limit azimuth
        // this.#cameraAngle.azimuth = this.#cameraAngle.azimuth % 360;
        _cameraAngle.azimuth = clamp(_cameraAngle.azimuth, _minAzimuth, _maxAzimuth);
        _cameraAngle.altitude = clamp(_cameraAngle.altitude, _minAltitude, _maxAltitude);

        const v1 = Vector3.rotateVectorX(new Vector3(0, 0, 1), _cameraAngle.altitude);
        const v2 = Vector3.rotateVectorY(v1, _cameraAngle.azimuth);
        _targetCameraPosition = Vector3.addVectors(_lookAtTarget, v2.scale(_distance));
        _currentCameraPosition = Vector3.lerpVectors(
            _currentCameraPosition,
            _targetCameraPosition,
            isJump ? 1 : _dampingFactor
        );

        if (_camera && _enabledUpdateCamera) {
            _camera.transform.position = _currentCameraPosition;
            _camera.transform.lookAt(_lookAtTarget);
        }
    };

    return {
        getDampingFactor: () => _dampingFactor,
        setDampingFactor: (value: number) => (_dampingFactor = value),
        getMinAzimuth: () => _minAzimuth,
        setMinAzimuth: (value: number) => (_minAzimuth = value),
        getMaxAzimuth: () => _maxAzimuth,
        setMaxAzimuth: (value: number) => (_maxAzimuth = value),
        getMinAltitude: () => _minAltitude,
        setMinAltitude: (value: number) => (_minAltitude = value),
        getMaxAltitude: () => _maxAltitude,
        setMaxAltitude: (value: number) => (_maxAltitude = value),
        getAzimuthSpeed: () => _azimuthSpeed,
        setAzimuthSpeed: (value: number) => (_azimuthSpeed = value),
        getAltitudeSpeed: () => _altitudeSpeed,
        setAltitudeSpeed: (value: number) => (_altitudeSpeed = value),
        getLookAtTarget: () => _lookAtTarget,
        setLookAtTarget: (value: Vector3) => (_lookAtTarget = value),
        getDistance: () => _distance,
        setDistance: (value: number) => (_distance = value),
        getAttenuation: () => _attenuation,
        setAttenuation: (value: number) => (_attenuation = value),
        getDeltaAzimuthPower: () => _deltaAzimuthPower,
        setDeltaAzimuthPower: (value: number) => (_deltaAzimuthPower = value),
        getDeltaAltitudePower: () => _deltaAltitudePower,
        setDeltaAltitudePower: (value: number) => (_deltaAltitudePower = value),
        getDefaultAzimuth: () => _defaultAzimuth,
        setDefaultAzimuth: (value: number) => (_defaultAzimuth = value),
        getDefaultAltitude: () => _defaultAltitude,
        setDefaultAltitude: (value: number) => (_defaultAltitude = value),
        getEnabled: () => _enabled,
        setEnabled: (value: boolean) => (_enabled = value),
        getEnabledUpdateCamera: () => _enabledUpdateCamera,
        setEnabledUpdateCamera: (value: boolean) => (_enabledUpdateCamera = value),

        setCamera,
        start,
        setDelta,
        fixedUpdate,
    };
}
