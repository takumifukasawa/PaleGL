import { subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { createSkybox, Skybox } from '@/PaleGL/actors/meshes/skybox.ts';
import type { CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    createProceduralCubeMap,
    updateProceduralCubeMap,
    type CubeMapUpdateContext,
} from '@/PaleGL/core/proceduralCubeMap.ts';
import { tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { setUniformValue } from '@/PaleGL/core/uniforms.ts';
import { UNIFORM_NAME_CUBE_TEXTURE } from '@/PaleGL/constants.ts';

export type ProceduralSkyboxOptions = {
    gpu: Gpu;
    size?: number;
    updateInterval?: number;
    baseIntensity?: number;
    specularIntensity?: number;
    rotationOffset?: number;
    fragmentShader?: string;
};

export function createProceduralSkybox({
    gpu,
    size = 256,
    updateInterval = 2,
    baseIntensity = 0.2,
    specularIntensity = 0.2,
    rotationOffset = 0,
    fragmentShader,
}: ProceduralSkyboxOptions): Skybox {
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
        const result = createProceduralCubeMap(renderer, size, updateInterval, fragmentShader);
        cubeMap = result.cubeMap;
        cubeMapUpdateContext = result.updateContext;

        skyboxMesh.cubeMap = cubeMap;

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
}
