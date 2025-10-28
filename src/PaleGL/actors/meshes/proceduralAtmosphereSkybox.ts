import { subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { createSkybox, Skybox } from '@/PaleGL/actors/meshes/skybox.ts';
import { UNIFORM_NAME_CUBE_TEXTURE, UNIFORM_TYPE_FLOAT, UNIFORM_TYPE_VECTOR3 } from '@/PaleGL/constants.ts';
import type { CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    createProceduralCubeMap,
    updateProceduralCubeMap,
    type CubeMapUpdateContext,
} from '@/PaleGL/core/proceduralCubeMap.ts';
import { tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { setUniformValue, type UniformsData } from '@/PaleGL/core/uniforms.ts';
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

export const createProceduralAtmosphereSkybox: (args: ProceduralAtmosphereSkyboxOptions) => Skybox = ({
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
    rayleighCoefficient = [5.5e-6, 13.0e-6, 22.4e-6],
    mieCoefficient = 21e-6,
    rayleighScaleHeight = 8e3,
    mieScaleHeight = 1.2e3,
    mieScatteringDirection = 0.758,
    cameraAltitude = 100.0,
}: ProceduralAtmosphereSkyboxOptions) => {
    let cubeMap: CubeMap;
    let cubeMapUpdateContext: CubeMapUpdateContext | null = null;
    let frameCount = 0;

    const skyboxMesh = createSkybox({
        gpu,
        cubeMap: null as any, // 一時的にnull、onStartで設定
        baseIntensity,
        specularIntensity,
        rotationOffset,
        renderMesh: true,
    });

    // onStartでcubemapを生成
    subscribeActorOnStart(skyboxMesh, ({ renderer }) => {
        // Prepare additional uniforms for atmosphere shader
        const additionalUniforms: UniformsData = [
            ['uSunPosition', UNIFORM_TYPE_VECTOR3, sunPosition],
            ['uSunIntensity', UNIFORM_TYPE_FLOAT, sunIntensity],
            ['uPlanetRadius', UNIFORM_TYPE_FLOAT, planetRadius],
            ['uAtmosphereRadius', UNIFORM_TYPE_FLOAT, atmosphereRadius],
            ['uRayleighCoefficient', UNIFORM_TYPE_VECTOR3, rayleighCoefficient],
            ['uMieCoefficient', UNIFORM_TYPE_FLOAT, mieCoefficient],
            ['uRayleighScaleHeight', UNIFORM_TYPE_FLOAT, rayleighScaleHeight],
            ['uMieScaleHeight', UNIFORM_TYPE_FLOAT, mieScaleHeight],
            ['uMieScatteringDirection', UNIFORM_TYPE_FLOAT, mieScatteringDirection],
            ['uCameraAltitude', UNIFORM_TYPE_FLOAT, cameraAltitude],
        ];

        const result = createProceduralCubeMap(renderer, size, updateInterval, fragmentShader, additionalUniforms);
        cubeMap = result.cubeMap;
        cubeMapUpdateContext = result.updateContext;

        skyboxMesh.cubeMap = cubeMap;
        // Store updateContext for external access (e.g., debugger)
        (skyboxMesh as any).cubeMapUpdateContext = cubeMapUpdateContext;

        // Set cubemap uniform
        setUniformValue(skyboxMesh.materials[0].uniforms, UNIFORM_NAME_CUBE_TEXTURE, cubeMap);

        tryStartMaterial(gpu, renderer, skyboxMesh.geometry, skyboxMesh.materials[0]);
    });

    subscribeActorOnUpdate(skyboxMesh, ({ renderer }) => {
        if (cubeMapUpdateContext) {
            frameCount++;
            if (frameCount % cubeMapUpdateContext.updateInterval === 0) {
                updateProceduralCubeMap(renderer, cubeMap, cubeMapUpdateContext);
            }
        }
    });

    return skyboxMesh;
};
