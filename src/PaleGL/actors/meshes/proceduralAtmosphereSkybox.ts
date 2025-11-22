import { subscribeActorBeforeRender, subscribeActorOnStart } from '@/PaleGL/actors/actor.ts';
import { createSkybox, Skybox } from '@/PaleGL/actors/meshes/skybox.ts';
import { UNIFORM_NAME_CUBE_TEXTURE, UNIFORM_TYPE_FLOAT, UNIFORM_TYPE_VECTOR3 } from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    createProceduralCubeMap,
    CubeMapWithUpdateContext,
    updateProceduralCubeMap,
} from '@/PaleGL/core/proceduralCubeMap.ts';
import { tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { setUniformValue, type UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector3, Vector3 } from '@/PaleGL/math/vector3.ts';
import proceduralCubeMapAtmosphereFragmentShader from '@/PaleGL/shaders/procedural-cubemap-atmosphere-fragment.glsl';

export type ProceduralAtmosphereSkyboxOptions = {
    gpu: Gpu;
    size?: number;
    updateInterval?: number;
    baseIntensity?: number;
    specularIntensity?: number;
    rotationOffset?: number;
    fragmentShader?: string;
    sunPosition?: [number, number, number];
    sunIntensity?: number;
    planetRadius?: number;
    atmosphereRadius?: number;
    rayleighCoefficient?: [number, number, number];
    mieCoefficient?: number;
    rayleighScaleHeight?: number;
    mieScaleHeight?: number;
    mieScatteringDirection?: number;
    cameraAltitude?: number;
};

export type ProceduralAtmosphereSkybox = Skybox & {
    sunPosition: Vector3;
    sunIntensity: number;
    planetRadius: number;
    atmosphereRadius: number;
    rayleighCoefficient: Vector3;
    mieCoefficient: number;
    rayleighScaleHeight: number;
    mieScaleHeight: number;
    mieScatteringDirection: number;
    cameraAltitude: number;
    cubeMapWithUpdateContext: CubeMapWithUpdateContext | null;
};

const uniformNameSunPosition = 'uSunPosition';
const uniformNameSunIntensity = 'uSunIntensity';
const uniformNamePlanetRadius = 'uPlanetRadius';
const uniformNameAtmosphereRadius = 'uAtmosphereRadius';
const uniformNameRayleighCoefficient = 'uRayleighCoefficient';
const uniformNameMieCoefficient = 'uMieCoefficient';
const uniformNameRayleighScaleHeight = 'uRayleighScaleHeight';
const uniformNameMieScaleHeight = 'uMieScaleHeight';
const uniformNameMieScatteringDirection = 'uMieScatteringDirection';
const uniformNameCameraAltitude = 'uCameraAltitude';

export const SKYBOX_EPS_SCALE = 0.0001;

export const createProceduralAtmosphereSkybox: (
    args: ProceduralAtmosphereSkyboxOptions
) => ProceduralAtmosphereSkybox = (args: ProceduralAtmosphereSkyboxOptions) => {
    const {
        gpu,
        size = 256,
        updateInterval = 2,
        baseIntensity = 0.2,
        specularIntensity = 0.2,
        rotationOffset = 0,
        fragmentShader = proceduralCubeMapAtmosphereFragmentShader,
        sunPosition = [1, 1, 0],
        sunIntensity = 22.0,
        planetRadius = 6371e3,
        atmosphereRadius = 6471e3,
        cameraAltitude = 100.0,
        rayleighCoefficient = [5.5e-2, 13.0e-2, 22.4e-2], // needs eps scale
        rayleighScaleHeight = 8e3,
        mieCoefficient = 21e-2, // needs eps scale
        mieScaleHeight = 1.2e3,
        mieScatteringDirection = 0.758,
    } = args;

    // let cubeMap: CubeMap;
    // let cubeMapUpdateContext: CubeMapUpdateContext | null = null;
    let frameCount = 0;

    const mesh = createSkybox({
        gpu,
        cubeMap: null as any, // 一時的にnull、onStartで設定
        baseIntensity,
        specularIntensity,
        rotationOffset,
        renderMesh: true,
    });

    const skyboxMesh: ProceduralAtmosphereSkybox = {
        ...mesh,
        sunPosition: createVector3(sunPosition[0], sunPosition[1], sunPosition[2]),
        sunIntensity,
        planetRadius,
        atmosphereRadius,
        cameraAltitude,
        rayleighCoefficient: createVector3(
            rayleighCoefficient[0] * SKYBOX_EPS_SCALE,
            rayleighCoefficient[1] * SKYBOX_EPS_SCALE,
            rayleighCoefficient[2] * SKYBOX_EPS_SCALE
        ),
        rayleighScaleHeight,
        mieCoefficient: mieCoefficient * SKYBOX_EPS_SCALE,
        mieScaleHeight,
        mieScatteringDirection,
        cubeMapWithUpdateContext: null,
    };
    

    // onStartでcubemapを生成
    subscribeActorOnStart(skyboxMesh, ({ renderer }) => {
        // Prepare additional uniforms for atmosphere shader
        const additionalUniforms: UniformsData = [
            [uniformNameSunPosition, UNIFORM_TYPE_VECTOR3, skyboxMesh.sunPosition],
            [uniformNameSunIntensity, UNIFORM_TYPE_FLOAT, skyboxMesh.sunIntensity],
            [uniformNamePlanetRadius, UNIFORM_TYPE_FLOAT, skyboxMesh.planetRadius],
            [uniformNameAtmosphereRadius, UNIFORM_TYPE_FLOAT, skyboxMesh.atmosphereRadius],
            [uniformNameCameraAltitude, UNIFORM_TYPE_FLOAT, skyboxMesh.cameraAltitude],
            [uniformNameRayleighCoefficient, UNIFORM_TYPE_VECTOR3, skyboxMesh.rayleighCoefficient],
            [uniformNameRayleighScaleHeight, UNIFORM_TYPE_FLOAT, skyboxMesh.rayleighScaleHeight],
            [uniformNameMieCoefficient, UNIFORM_TYPE_FLOAT, skyboxMesh.mieCoefficient],
            [uniformNameMieScaleHeight, UNIFORM_TYPE_FLOAT, skyboxMesh.mieScaleHeight],
            [uniformNameMieScatteringDirection, UNIFORM_TYPE_FLOAT, skyboxMesh.mieScatteringDirection],
            // ['uSunPosition', UNIFORM_TYPE_VECTOR3, sunPosition],
            // ['uSunIntensity', UNIFORM_TYPE_FLOAT, sunIntensity],
            // ['uPlanetRadius', UNIFORM_TYPE_FLOAT, planetRadius],
            // ['uAtmosphereRadius', UNIFORM_TYPE_FLOAT, atmosphereRadius],
            // ['uRayleighCoefficient', UNIFORM_TYPE_VECTOR3, rayleighCoefficient],
            // ['uMieCoefficient', UNIFORM_TYPE_FLOAT, mieCoefficient],
            // ['uRayleighScaleHeight', UNIFORM_TYPE_FLOAT, rayleighScaleHeight],
            // ['uMieScaleHeight', UNIFORM_TYPE_FLOAT, mieScaleHeight],
            // ['uMieScatteringDirection', UNIFORM_TYPE_FLOAT, mieScatteringDirection],
            // ['uCameraAltitude', UNIFORM_TYPE_FLOAT, cameraAltitude],
        ];

        const result = createProceduralCubeMap(renderer, size, updateInterval, fragmentShader, additionalUniforms);
        // cubeMap = result.cubeMap;

        skyboxMesh.cubeMap = result.cubeMap;
        skyboxMesh.cubeMapWithUpdateContext = result;

        // Set cubemap uniform
        setUniformValue(
            skyboxMesh.materials[0].uniforms,
            UNIFORM_NAME_CUBE_TEXTURE,
            skyboxMesh.cubeMapWithUpdateContext.cubeMap
        );

        tryStartMaterial(gpu, renderer, skyboxMesh.geometry, skyboxMesh.materials[0]);
    });

    const updateParameters = () => {
        if (skyboxMesh.cubeMapWithUpdateContext) {
            const targetMaterialUniforms = skyboxMesh.cubeMapWithUpdateContext.updateContext.material.uniforms!;
            // console.log("======================");
            // console.log(skyboxMesh);
            // console.log(sunPosition);
            // console.log(sunIntensity);
            // console.log(planetRadius);
            // console.log(atmosphereRadius);
            // console.log(rayleighCoefficient);
            // console.log(mieCoefficient);
            // console.log(rayleighScaleHeight);
            // console.log(mieScaleHeight);
            // console.log(mieScatteringDirection);
            // console.log(cameraAltitude);
            setUniformValue(targetMaterialUniforms, uniformNameSunPosition, skyboxMesh.sunPosition);
            setUniformValue(targetMaterialUniforms, uniformNameSunIntensity, skyboxMesh.sunIntensity);
            setUniformValue(targetMaterialUniforms, uniformNamePlanetRadius, skyboxMesh.planetRadius);
            setUniformValue(targetMaterialUniforms, uniformNameAtmosphereRadius, skyboxMesh.atmosphereRadius);
            setUniformValue(targetMaterialUniforms, uniformNameCameraAltitude, skyboxMesh.cameraAltitude);
            setUniformValue(targetMaterialUniforms, uniformNameRayleighCoefficient, skyboxMesh.rayleighCoefficient);
            setUniformValue(targetMaterialUniforms, uniformNameRayleighScaleHeight, skyboxMesh.rayleighScaleHeight);
            setUniformValue(targetMaterialUniforms, uniformNameMieCoefficient, skyboxMesh.mieCoefficient);
            setUniformValue(targetMaterialUniforms, uniformNameMieScaleHeight, skyboxMesh.mieScaleHeight);
            setUniformValue(
                targetMaterialUniforms,
                uniformNameMieScatteringDirection,
                skyboxMesh.mieScatteringDirection
            );
            // console.log("hogehoge", rayleighCoefficient, mieCoefficient);
        }
    };

    subscribeActorBeforeRender(skyboxMesh, ({ renderer }) => {
        if (skyboxMesh.cubeMapWithUpdateContext) {
            frameCount++;
            if (frameCount % skyboxMesh.cubeMapWithUpdateContext.updateContext.updateInterval === 0) {
                updateParameters();
                updateProceduralCubeMap(
                    renderer,
                    skyboxMesh.cubeMapWithUpdateContext.cubeMap,
                    skyboxMesh.cubeMapWithUpdateContext.updateContext
                );
            }
        }
    });

    return skyboxMesh;
};
