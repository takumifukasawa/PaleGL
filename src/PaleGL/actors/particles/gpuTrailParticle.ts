import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    createMRTDoubleBuffer,
    getReadMultipleRenderTargetOfMRTDoubleBuffer,
    MRTDoubleBuffer,
    updateMRTDoubleBufferAndSwap,
} from '@/PaleGL/core/doubleBuffer.ts';
import {
    AttributeNames,
    FaceSide,
    TextureFilterTypes,
    TextureTypes,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { createGraphicsDoubleBufferMaterial } from '@/PaleGL/core/graphicsDoubleBuffer.ts';
import { createInstancingParticle, InstancingParticleArgs } from '@/PaleGL/actors/particles/instancingParticle.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { addUniformValue } from '@/PaleGL/core/uniforms.ts';
import {subscribeActorOnStart, subscribeActorOnUpdate} from '@/PaleGL/actors/actor.ts';
import { Renderer, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { Attribute, createAttribute } from '@/PaleGL/core/attribute.ts';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { createColor } from '@/PaleGL/math/color.ts';

export type GPUTrailParticleArgs = InstancingParticleArgs & {
    gpu: Gpu;
    mesh: Mesh;
    vatWidth: number;
    vatHeight: number;
    initializeFragmentShader: string;
    updateFragmentShader: string;
};

// export type InstancingParticle = Mesh & { positionGraphicsDoubleBuffer: GraphicsDoubleBuffer };
export type GPUTrailParticle = Mesh & { mrtDoubleBuffer: MRTDoubleBuffer };

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

const addQuad = (indices: Uint16Array, i: number, v00: number, v10: number, v01: number, v11: number) => {
    indices[i] = v00;
    indices[i + 1] = indices[i + 5] = v10;
    indices[i + 2] = indices[i + 4] = v01;
    indices[i + 3] = v11;
    return i + 6;
};

// trail vertex ... min = 2
const createTrailPlaneGeometry = (gpu: Gpu, planeWidth: number, trailVertexNum: number) => {
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

    // for debug
    // // 0 2
    // // 1 3
    // posCount = addVertex3(positions, posCount, -halfWidth, halfWidth, 0);
    // uvCount = addVertex2(uvs, uvCount, 0, 0);
    // normalCount = addVertex3(normals, normalCount, 0, 0, 0);
    // posCount = addVertex3(positions, posCount, -halfWidth, -halfWidth, 0);
    // uvCount = addVertex2(uvs, uvCount, 0, 0);
    // normalCount = addVertex3(normals, normalCount, 1, 0, 0);
    // trailVertices[2 * 0] = trailVertices[2 * 0 + 1] = 0;
    // posCount = addVertex3(positions, posCount, halfWidth, halfWidth, 0);
    // uvCount = addVertex2(uvs, uvCount, 0, 0);
    // normalCount = addVertex3(normals, normalCount, 0, 0, 0);
    // posCount = addVertex3(positions, posCount, halfWidth, -halfWidth, 0);
    // uvCount = addVertex2(uvs, uvCount, 0, 0);
    // normalCount = addVertex3(normals, normalCount, 1, 0, 0);
    // trailVertices[2 * 1] = trailVertices[2 * 1 + 1] = 1;

    let indexCount = 0;
    for (let i = 0; i < trailVertexNum - 1; i++) {
        // prettier-ignore
        indexCount = addQuad(
            indices, indexCount,
            2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 3
        );
    }

    const attributes: Attribute[] = [
        createAttribute({
            name: AttributeNames.Position,
            data: positions,
            size: 3,
        }),
        createAttribute({
            name: AttributeNames.Uv,
            data: uvs,
            size: 2,
        }),
        createAttribute({
            name: AttributeNames.Normal,
            data: normals,
            size: 3,
        }),
        createAttribute({
            name: 'aTrailIndex',
            data: trailVertices,
            size: 1,
        }),
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
        UniformNames.VelocityMap,
        getReadVelocityMap(mrtDoubleBuffer)
    );

    // 更新した速度をposition更新. doublebufferのuniformに設定
    // prettier-ignore
    setMaterialUniformValue(
        material,
        UniformNames.PositionMap,
        getReadPositionMap(mrtDoubleBuffer)
    );

    // prettier-ignore
    setMaterialUniformValue(
        material,
        UniformNames.UpMap,
        getReadUpMap(mrtDoubleBuffer)
    );

    // update velocity
    updateMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, material);
};

export const createGPUTrailParticle = (args: GPUTrailParticleArgs) => {
    const {
        gpu,
        vatWidth,
        vatHeight,
        initializeFragmentShader,
        updateFragmentShader,
    } = args;

    // TODO: meshは外から渡す
    const geometry = createTrailPlaneGeometry(gpu, 0.5, vatHeight);

    // const geometry = createPlaneGeometry({ gpu });
    const material = createGBufferMaterial({
        metallic: 0,
        roughness: 0,
        baseColor: createColor(1, 0, 0, 1),
        faceSide: FaceSide.Double,
    });
    const mesh = createMesh({
        geometry,
        material,
        name: 'GPUTrailPlaneParticle',
    });

    const gpuParticle = createInstancingParticle({ ...args, mesh });

    const mrtDoubleBuffer = createMRTDoubleBuffer({
        gpu,
        name: 'mrt',
        width: vatWidth,
        height: vatHeight,
        minFilter: TextureFilterTypes.Nearest,
        magFilter: TextureFilterTypes.Nearest,
        textureTypes: [TextureTypes.RGBA16F, TextureTypes.RGBA16F, TextureTypes.RGBA16F], // 0: velocity, 1: position
    });

    const createUniforms = () => [
        {
            name: UniformNames.VelocityMap,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.PositionMap,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.UpMap,
            type: UniformTypes.Texture,
            value: null,
        },
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

    // materialの強制更新
    // uniformsの追加
    iterateAllMeshMaterials(gpuParticle, (mat) => {
        mat.useVAT = true;
        mat.isTrail = true;
        // depthが作られる前なのでdepthUniformsにも設定する
        const vatResolution = createVector2(vatWidth, vatHeight);
        addUniformValue(mat.uniforms, UniformNames.VelocityMap, UniformTypes.Texture, null);
        addUniformValue(mat.uniforms, UniformNames.PositionMap, UniformTypes.Texture, null);
        addUniformValue(mat.uniforms, UniformNames.UpMap, UniformTypes.Texture, null);
        addUniformValue(mat.uniforms, UniformNames.VATResolution, UniformTypes.Vector2, vatResolution);
        addUniformValue(mat.depthUniforms, UniformNames.VelocityMap, UniformTypes.Texture, null);
        addUniformValue(mat.depthUniforms, UniformNames.PositionMap, UniformTypes.Texture, null);
        addUniformValue(mat.depthUniforms, UniformNames.UpMap, UniformTypes.Texture, null);
        addUniformValue(mat.depthUniforms, UniformNames.VATResolution, UniformTypes.Vector2, vatResolution);
    });

    const vatGPUParticle: GPUTrailParticle = { ...gpuParticle, mrtDoubleBuffer };

    let tmpReadVelocityMap;
    let tmpReadPositionMap;
    let tmpReadUpMap;

    subscribeActorOnStart(vatGPUParticle, ({renderer}) => {
        tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForInitialize);
        tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForUpdate);

        renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
        renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
    });

    subscribeActorOnUpdate(vatGPUParticle, ({ renderer }) => {
        renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForUpdate);

        tmpReadVelocityMap = getReadVelocityMap(mrtDoubleBuffer);
        tmpReadPositionMap = getReadPositionMap(mrtDoubleBuffer);
        tmpReadUpMap = getReadUpMap(mrtDoubleBuffer);
        setUniformValueToAllMeshMaterials(gpuParticle, UniformNames.VelocityMap, tmpReadVelocityMap);
        setUniformValueToAllMeshMaterials(gpuParticle, UniformNames.PositionMap, tmpReadPositionMap);
        setUniformValueToAllMeshMaterials(gpuParticle, UniformNames.UpMap, tmpReadUpMap);
    });

    return vatGPUParticle;
};
