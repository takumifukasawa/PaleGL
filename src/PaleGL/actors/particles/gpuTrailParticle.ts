import { subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {
    createInstancingParticle,
    InstancingParticleArgs,
    overrideInstancingParticleMaterialSettings,
} from '@/PaleGL/actors/particles/instancingParticle.ts';
import {
    ATTRIBUTE_NAME_NORMAL,
    ATTRIBUTE_NAME_POSITION,
    ATTRIBUTE_NAME_TRAIL_INDEX,
    ATTRIBUTE_NAME_UV,
    TEXTURE_FILTER_TYPE_NEAREST,
    TEXTURE_TYPE_RGBA16F,
    UNIFORM_NAME_POSITION_MAP,
    UNIFORM_NAME_UP_MAP,
    UNIFORM_NAME_VAT_RESOLUTION,
    UNIFORM_NAME_VELOCITY_MAP,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_VECTOR2,
} from '@/PaleGL/constants.ts';
import { Attribute, createAttribute } from '@/PaleGL/core/attribute.ts';
import {
    createMRTDoubleBuffer,
    getReadMultipleRenderTargetOfMRTDoubleBuffer,
    MRTDoubleBuffer,
    updateMRTDoubleBufferAndSwap,
} from '@/PaleGL/core/doubleBuffer.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGraphicsDoubleBufferMaterial } from '@/PaleGL/core/graphicsDoubleBuffer.ts';
import { Renderer, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { addUniformValue, UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { createVector3, normalizeVector3, v3x, v3y, v3z } from '@/PaleGL/math/vector3.ts';

export type GPUTrailParticleArgs = InstancingParticleArgs & {
    gpu: Gpu;
    mesh: Mesh;
    vatWidth: number;
    vatHeight: number;
    initializeFragmentShader: string;
    updateFragmentShader: string;
};

// export type InstancingParticle = Mesh & { positionGraphicsDoubleBuffer: GraphicsDoubleBuffer };
export type GPUTrailParticle = Mesh & {
    mrtDoubleBuffer: MRTDoubleBuffer;
    materialForInitialize: Material;
    materialForUpdate: Material;
    vatWidth: number;
    vatHeight: number;
};

const getReadVelocityMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[0];
const getReadPositionMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[1];
const getReadUpMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[2];

const addVertex2 = (vertices: Float32Array, vi: number, x: number, y: number) => {
    vertices[vi++] = x;
    vertices[vi++] = y;
    return vi;
};

const addVertex3 = (vertices: Float32Array, vi: number, x: number, y: number, z: number) => {
    vertices[vi++] = x;
    vertices[vi++] = y;
    vertices[vi++] = z;
    return vi;
};

function addTriangle(indices: Uint16Array, i: number, v0: number, v1: number, v2: number) {
    indices[i++] = v0;
    indices[i++] = v1;
    indices[i++] = v2;
    return i;
}

const addQuad = (indices: Uint16Array, i: number, v00: number, v10: number, v01: number, v11: number) => {
    indices[i] = v00;
    indices[i + 1] = indices[i + 5] = v10;
    indices[i + 2] = indices[i + 4] = v01;
    indices[i + 3] = v11;
    return i + 6;
};

// trail vertex ... min = 2
export const createTrailPlaneGeometry = (gpu: Gpu, planeWidth: number, trailVertexNum: number) => {
    const vertexNum = 2 * trailVertexNum;
    const indexNum = 6 * (trailVertexNum - 1);

    const indices = new Uint16Array(indexNum);
    const trailVertices = new Float32Array(vertexNum);
    const positions = new Float32Array(3 * vertexNum);
    const uvs = new Float32Array(2 * vertexNum);
    const normals = new Float32Array(3 * vertexNum);

    const halfWidth = planeWidth * 0.5;

    let posCount = 0;
    let uvCount = 0;
    let normalCount = 0;

    for (let i = 0; i < trailVertexNum; i++) {
        posCount = addVertex3(positions, posCount, 0, halfWidth, 0);
        uvCount = addVertex2(uvs, uvCount, 0, 0);
        normalCount = addVertex3(normals, normalCount, 1, 0, 0);
        posCount = addVertex3(positions, posCount, 0, -halfWidth, 0);
        uvCount = addVertex2(uvs, uvCount, 0, 0);
        normalCount = addVertex3(normals, normalCount, 1, 0, 0);
        trailVertices[2 * i] = trailVertices[2 * i + 1] = i;
    }

    let indexCount = 0;
    for (let i = 0; i < trailVertexNum - 1; i++) {
        // prettier-ignore
        indexCount = addQuad(
            indices, indexCount,
            2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 3
        );
    }

    const attributes: Attribute[] = [
        createAttribute(ATTRIBUTE_NAME_POSITION, positions, 3),
        createAttribute(ATTRIBUTE_NAME_UV, uvs, 2),
        createAttribute(ATTRIBUTE_NAME_NORMAL, normals, 3),
        createAttribute(ATTRIBUTE_NAME_TRAIL_INDEX, trailVertices, 1),
    ];

    const geometry = createGeometry({
        gpu,
        attributes,
        indices,
        drawCount: indices.length,
    });

    return geometry;
};

export const createTrailCylinderGeometry = (gpu: Gpu, radius: number, angleSegment: number, trailVertexNum: number) => {
    const vertexNum = (1 + angleSegment) * 2 + trailVertexNum * angleSegment;
    const indexNum = 3 * (angleSegment * 2 + (trailVertexNum - 1) * angleSegment * 2);

    const indices = new Uint16Array(indexNum);
    const trailVertices = new Float32Array(vertexNum);
    const positions = new Float32Array(3 * vertexNum);
    const uvs = new Float32Array(2 * vertexNum);
    const normals = new Float32Array(3 * vertexNum);

    const angleStep = (2.0 * Math.PI) / angleSegment;

    let posCount = 0;
    let normalCount = 0;
    let trailVertexCount = 0;

    posCount = addVertex3(positions, posCount, 0.0, 0.0, 0.0);
    normalCount = addVertex3(normals, normalCount, 0.0, 0.0, -1.0);
    trailVertices[trailVertexCount++] = 0;
    for (let ti = 0; ti < trailVertexNum + 2; ti++) {
        for (let ai = 0; ai < angleSegment; ai++) {
            const angle = ai * angleStep + Math.PI * 0.5;
            const position = createVector3(radius * Math.cos(angle), radius * Math.sin(angle), 0.0);
            posCount = addVertex3(positions, posCount, v3x(position), v3y(position), v3z(position));
            if (ti === 0) {
                // 前のcap部分
                normalCount = addVertex3(normals, normalCount, 0.0, 0.0, -1.0);
                trailVertices[trailVertexCount++] = 0;
            } else if (ti === trailVertexNum + 1) {
                // 胴体部分
                normalCount = addVertex3(normals, normalCount, 0.0, 0.0, 1.0);
                trailVertices[trailVertexCount++] = trailVertexNum - 1;
            } else {
                // 後ろのcap
                const normal = normalizeVector3(position);
                normalCount = addVertex3(normals, normalCount, v3x(normal), v3y(normal), 0.0);
                trailVertices[trailVertexCount++] = ti - 1;
            }
        }
    }

    // tmp
    // posCount = addVertex3(positions, posCount, 0.0, 0.0, 0.0);
    // normalCount = addVertex3(normals, normalCount, 0.0, 0.0, 1.0);

    trailVertices[trailVertexCount++] = trailVertexNum - 1;

    let indexCount = 0;
    for (let ai = 0; ai < angleSegment; ai++) {
        // 前のcap部分のインデックス
        const aj = ai !== angleSegment - 1 ? ai + 1 : 0;
        indexCount = addTriangle(indices, indexCount, 0, ai + 1, aj + 1);
    }
    let vertexOffset = angleSegment + 1;
    for (let ti = 0; ti < trailVertexNum - 1; ti++) {
        // 胴体部分のインデックス
        for (let ai = 0; ai < angleSegment; ai++) {
            const aj = ai !== angleSegment - 1 ? ai + 1 : 0;
            const tj = ti + 1;
            const v00 = ai + ti * angleSegment + vertexOffset;
            const v10 = aj + ti * angleSegment + vertexOffset;
            const v01 = ai + tj * angleSegment + vertexOffset;
            const v11 = aj + tj * angleSegment + vertexOffset;
            indexCount = addQuad(indices, indexCount, v00, v01, v10, v11);
        }
    }
    vertexOffset += angleSegment * trailVertexNum;
    for (let ai = 0; ai < angleSegment; ai++) {
        // 後ろのcap部分のインデックス
        const aj = ai !== angleSegment - 1 ? ai + 1 : 0;
        indexCount = addTriangle(indices, indexCount, vertexNum - 1, aj + vertexOffset, ai + vertexOffset);
    }

    const attributes: Attribute[] = [
        createAttribute(ATTRIBUTE_NAME_POSITION, positions, 3),
        createAttribute(ATTRIBUTE_NAME_UV, uvs, 2),
        createAttribute(ATTRIBUTE_NAME_NORMAL, normals, 3),
        createAttribute(ATTRIBUTE_NAME_TRAIL_INDEX, trailVertices, 1),
    ];

    const geometry = createGeometry({
        gpu,
        attributes,
        indices,
        drawCount: indices.length,
    });

    return geometry;
};

const renderMRTDoubleBufferAndSwap = (renderer: Renderer, mrtDoubleBuffer: MRTDoubleBuffer, material: Material) => {
    // prettier-ignore
    setMaterialUniformValue(
        material,
        UNIFORM_NAME_VELOCITY_MAP,
        getReadVelocityMap(mrtDoubleBuffer)
    );

    // 更新した速度をposition更新. doublebufferのuniformに設定
    // prettier-ignore
    setMaterialUniformValue(
        material,
        UNIFORM_NAME_POSITION_MAP,
        getReadPositionMap(mrtDoubleBuffer)
    );

    // prettier-ignore
    setMaterialUniformValue(
        material,
        UNIFORM_NAME_UP_MAP,
        getReadUpMap(mrtDoubleBuffer)
    );

    // update velocity
    updateMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, material);
};

export const createGPUTrailParticle = (args: GPUTrailParticleArgs) => {
    const { gpu, mesh, vatWidth, vatHeight, initializeFragmentShader, updateFragmentShader } = args;

    const gpuParticle = createInstancingParticle({ ...args, mesh });

    const mrtDoubleBuffer = createMRTDoubleBuffer({
        gpu,
        name: 'mrt',
        width: vatWidth,
        height: vatHeight,
        minFilter: TEXTURE_FILTER_TYPE_NEAREST,
        magFilter: TEXTURE_FILTER_TYPE_NEAREST,
        textureTypes: [TEXTURE_TYPE_RGBA16F, TEXTURE_TYPE_RGBA16F, TEXTURE_TYPE_RGBA16F], // 0: velocity, 1: position
    });

    const createUniforms = (): UniformsData => [
        [UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE, null],
    ];

    const materialForInitialize = createGraphicsDoubleBufferMaterial(
        initializeFragmentShader,
        vatWidth,
        vatHeight,
        createUniforms()
    );
    const materialForUpdate = createGraphicsDoubleBufferMaterial(
        updateFragmentShader,
        vatWidth,
        vatHeight,
        createUniforms()
    );

    const vatGPUParticle: GPUTrailParticle = {
        ...gpuParticle,
        mrtDoubleBuffer,
        materialForInitialize,
        materialForUpdate,
        vatWidth,
        vatHeight,
    };

    overrideGPUTrailParticleMaterialSettings(vatGPUParticle);

    let tmpReadVelocityMap;
    let tmpReadPositionMap;
    let tmpReadUpMap;

    subscribeActorOnStart(vatGPUParticle, ({ renderer }) => {
        tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForInitialize);
        tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForUpdate);

        resetGPUTrailParticleByInitialize(renderer, vatGPUParticle);
    });

    subscribeActorOnUpdate(vatGPUParticle, ({ renderer }) => {
        renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForUpdate);

        tmpReadVelocityMap = getReadVelocityMap(mrtDoubleBuffer);
        tmpReadPositionMap = getReadPositionMap(mrtDoubleBuffer);
        tmpReadUpMap = getReadUpMap(mrtDoubleBuffer);
        setUniformValueToAllMeshMaterials(gpuParticle, UNIFORM_NAME_VELOCITY_MAP, tmpReadVelocityMap);
        setUniformValueToAllMeshMaterials(gpuParticle, UNIFORM_NAME_POSITION_MAP, tmpReadPositionMap);
        setUniformValueToAllMeshMaterials(gpuParticle, UNIFORM_NAME_UP_MAP, tmpReadUpMap);
    });

    return vatGPUParticle;
};

export const overrideGPUTrailParticleMaterialSettings = (gpuTrailParticle: GPUTrailParticle) => {
    if (!gpuTrailParticle.materials[0].isInstancing) {
        overrideInstancingParticleMaterialSettings(gpuTrailParticle);
    }
    // materialの強制更新
    // uniformsの追加
    iterateAllMeshMaterials(gpuTrailParticle, (mat) => {
        mat.useVAT = true;
        mat.cachedArgs.useVAT = true;
        mat.isTrail = true;
        mat.cachedArgs.isTrail = true;
        // depthが作られる前なのでdepthUniformsにも設定する
        const vatResolution = createVector2(gpuTrailParticle.vatWidth, gpuTrailParticle.vatHeight);
        addUniformValue(mat.uniforms, UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, vatResolution);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, vatResolution);
    });
};

export const resetGPUTrailParticleByInitialize = (renderer: Renderer, gpuTrailParticle: GPUTrailParticle) => {
    const { mrtDoubleBuffer, materialForInitialize } = gpuTrailParticle;
    renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
    renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
};
