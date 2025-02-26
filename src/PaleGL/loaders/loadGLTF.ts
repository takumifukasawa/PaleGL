import {Actor, addChildActor, createActor} from '@/PaleGL/actors/actor.ts';
import { Bone, createBone } from '@/PaleGL/core/bone.ts';
import { createBinormals, createGeometry, createTangentsAndBinormals } from '@/PaleGL/geometries/geometry.ts';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { createAnimationClip } from '@/PaleGL/core/animationClip.ts';
import { AnimationKeyframeType, AnimationKeyframeTypes, GLTextureFilter, GLTextureWrap } from '@/PaleGL/constants';
import { createAnimationKeyframes } from '@/PaleGL/core/animationKeyframes.ts';
import { Quaternion } from '@/PaleGL/math/Quaternion';
// import { Rotator } from '@/PaleGL/math/Rotator';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { GPU } from '@/PaleGL/core/GPU';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { resolveGLEnumTextureFilterType, resolveGLEnumTextureWrapType, Texture } from '@/PaleGL/core/Texture.ts';
import { loadImg } from '@/PaleGL/loaders/loadImg.ts';
import {createSkinnedMesh} from "@/PaleGL/actors/skinnedMesh.ts";
import {createMesh} from "@/PaleGL/actors/mesh.ts";
// import {GBufferMaterial} from "@/PaleGL/materials/gBufferMaterial.ts";

type GLTFScene = {
    nodes: number[];
};

type GLTFAsset = {
    generator: string;
    version: string;
};

type GLTFBufferView = {
    buffer: number;
    byteLength: number;
    byteOffset: number;
    target: number;
};

type GLTFMeshAccessor = {
    attributes: GLTFMeshAccessorAttribute[];
    indices: {
        // accessor: number
        accessor: GLTFAccessor;
    } | null;
    // material: number;
};

const GLTFMeshAttributes = {
    POSITION: 'POSITION',
    NORMAL: 'NORMAL',
    TEXCOORD_0: 'TEXCOORD_0',
    JOINTS_0: 'JOINTS_0',
    WEIGHTS_0: 'WEIGHTS_0',
} as const;

type GLTFMeshAttributes = (typeof GLTFMeshAttributes)[keyof typeof GLTFMeshAttributes];

type GLTFMeshPrimitives = {
    mode: number;
    indices: 0;
    attributes: {
        // [key: string]: number;
        [key in GLTFMeshAttributes]?: number;
        // POSITION: number,
        // NORMAL: number,
    };
    material: number;
};

type GLTFMeshAccessorAttribute = {
    attributeName: string;
    // accessor: number
    accessor: GLTFAccessor;
};

type GLTFBuffer = {
    byteLength: number;
    uri: string;
};

type GLTFAccessor = {
    bufferView: number;
    byteOffset: number;
    componentType: number; // 5126 gl.float
    type: string; // VEC2 | VEC3 ??
    count: number;
    min?: number[];
    max?: number[];
};

type GLTFMesh = {
    name: string;
    primitives: GLTFMeshPrimitives[];
    // primitives: {
    //     attributes: {
    //         [key in GLTFMeshAttributes]?: number; // ない要素があるはず
    //     }[];
    //     indices: number; // NOTE: 必ずある？
    // }[];
};

type GLTFNode = {
    name: string;
    children?: number[];
    matrix?: number[];
    translation?: number[];
    rotation?: number[];
    scale?: number[];
    mesh?: number;
    skin?: number;
    camera?: number;
};

type GLTFAnimationChannel = {
    target: {
        node: number;
        // path: string; // translation, rotation, scaling ??
        path: GLTFAnimationChannelTargetPath;
    };
    sampler: number;
};

export const GLTFAnimationSamplerInterpolation = {
    LINEAR: 'LINEAR',
    STEP: 'STEP',
    CATMULLROMSPLINE: 'CATMULLROMSPLINE',
    CUBICSPLINE: 'CUBICSPLINE',
} as const;

export type GLTFAnimationSamplerInterpolation =
    (typeof GLTFAnimationSamplerInterpolation)[keyof typeof GLTFAnimationSamplerInterpolation];

type GLTFAnimationSampler = {
    input: number;
    interpolation: GLTFAnimationSamplerInterpolation;
    output: number;
};

type GLTFAnimation = {
    name: string; // TODO: ないはず？
    channels: GLTFAnimationChannel[];
    samplers: GLTFAnimationSampler[];
};

export const GLTFAnimationChannelTargetPath = {
    translation: 'translation',
    rotation: 'rotation',
    scale: 'scale',
    // weights: "weights";
} as const;

export type GLTFAnimationChannelTargetPath =
    (typeof GLTFAnimationChannelTargetPath)[keyof typeof GLTFAnimationChannelTargetPath];

// export type GLTFAnimationKeyframeType = "Vector3" | "Quaternion";

export type GLTFNodeActorKind = Bone | Actor;

type GLTFMaterial = {
    doubleSided: boolean;
    name: string;
    emissiveFactor?: number[];
    pbrMetallicRoughness: {
        baseColorFactor?: number[]; // rgba
        baseColorTexture?: { index: number };
        metallicFactor: number;
        roughnessFactor: number;
    };
    normalTexture?: { index: number };
    extensions?: {
        KHR_materials_emissive_strength?: {
            emissiveStrength: number;
        };
    };
};

type GLTFExtensions = 'KHR_materials_emissive_strength';

type GLTFFormat = {
    extensionsUsed: GLTFExtensions[];
    accessors: GLTFAccessor[];
    animations: GLTFAnimation[];
    asset: GLTFAsset;
    bufferViews: GLTFBufferView[];
    buffers: GLTFBuffer[];
    materials: GLTFMaterial[];
    meshes: GLTFMesh[];
    nodes: GLTFNode[];
    scene: number;
    scenes: {
        name: string;
        nodes: number[];
    }[];
    skins: {
        inverseBindMatrices: number;
        joints: number[];
        name: string;
    }[];
    textures: { sampler: number; source: number }[];
    images: { bufferView?: number; uri?: string; mimeType: 'image/jpeg' | 'image/png'; name: string }[];
    samplers: {
        minFilter?: GLTextureFilter;
        magFilter?: GLTextureFilter;
        wrapS?: GLTextureWrap;
        wrapT?: GLTextureWrap;
    }[];
};

type Args = {
    gpu: GPU;
    dir?: string;
    path: string;
};

/**
 * gltf loader
 * ref: https://github.com/KhronosGroup/glTF
 * @param gpu
 * @param path
 */

export async function loadGLTF({ gpu, dir = '', path }: Args) {
    const resolvePath = (fileName: string) => {
        return dir + fileName;
    };

    const gltfPath = resolvePath(path);
    const response = await fetch(gltfPath);
    const gltf = (await response.json()) as GLTFFormat;

    const rootActor = createActor({});

    // for debug
    console.log('[loadGLTF]', gltfPath, gltf);

    // check used extensions
    const usedExtensions = {
        KHR_materials_emissive_strength: false,
    };
    if (gltf.extensionsUsed) {
        gltf.extensionsUsed.forEach((extension) => {
            switch (extension) {
                case 'KHR_materials_emissive_strength':
                    usedExtensions.KHR_materials_emissive_strength = true;
                    break;
            }
        });
    }

    const preloadTextures: Texture[] = [];

    if (gltf.textures) {
        await Promise.all(
            gltf.textures.map(async ({ source, sampler }) => {
                // TODO: 別ファイルな前提. bufferに格納されているときの出し分けをしていない
                const imgUrl = gltf.images[source].uri!;
                const minFilterEnum = gltf.samplers[sampler].minFilter;
                const magFilterEnum = gltf.samplers[sampler].magFilter;
                const wrapSEnum = gltf.samplers[sampler].wrapS;
                const wrapTEnum = gltf.samplers[sampler].wrapT;
                const minFilter = minFilterEnum ? resolveGLEnumTextureFilterType(minFilterEnum) : undefined;
                const magFilter = magFilterEnum ? resolveGLEnumTextureFilterType(magFilterEnum) : undefined;
                const wrapS = wrapSEnum ? resolveGLEnumTextureWrapType(wrapSEnum) : undefined;
                const wrapT = wrapTEnum ? resolveGLEnumTextureWrapType(wrapTEnum) : undefined;
                // for debug
                // console.log(gltf.samplers, gpu.gl.REPEAT, minFilter, magFilter, wrapS, wrapT);
                return {
                    img: await loadImg(resolvePath(imgUrl)),
                    minFilter,
                    magFilter,
                    wrapS,
                    wrapT,
                };
            })
        ).then((images) => {
            images.forEach(({ img, minFilter, magFilter, wrapS, wrapT }) => {
                const texture = new Texture({ gpu, img, minFilter, magFilter, wrapS, wrapT });
                preloadTextures.push(texture);
            });
        });
    }

    const cacheNodes: GLTFNodeActorKind[] = [];

    // gltf.scene ... default scene index
    // const targetScene = gltf.scenes[gltf.scene];

    // accessor の component type は gl の format と値が同じ
    // console.log('gl.BYTE', gl.BYTE); // 5120
    // console.log('gl.UNSIGNED_BYTE', gl.UNSIGNED_BYTE); // 5121
    // console.log('gl.SHORT', gl.SHORT); // 5122
    // console.log('gl.UNSIGNED_SHORT', gl.UNSIGNED_SHORT); // 5123
    // console.log('gl.INT', gl.INT); // 5124
    // console.log('gl.UNSIGNED_INT', gl.UNSIGNED_INT); // 5125
    // console.log('gl.FLOAT', gl.FLOAT); // 5126

    const binBufferDataList = await Promise.all(
        gltf.buffers.map(async (buffer: GLTFBuffer) => {
            // NOTE: buffer = { byteLength, uri }
            const isBase64 = buffer.uri.match('^data:application/octet-stream;base64.*');
            const bufferPath = isBase64 ? buffer.uri : resolvePath(buffer.uri);
            const binResponse = await fetch(bufferPath);
            const binBufferData = await binResponse.arrayBuffer();
            return { byteLength: buffer.byteLength, binBufferData };
        })
    );

    const getBufferData = (accessor: GLTFAccessor) => {
        const bufferView = gltf.bufferViews[accessor.bufferView];
        const { binBufferData } = binBufferDataList[bufferView.buffer];
        const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
        return slicedBuffer;
    };

    const createGLTFBone = (nodeIndex: number, parentBone: Bone | null = null) => {
        const node: GLTFNode = gltf.nodes[nodeIndex];
        // NOTE:
        // - nodeのindexを入れちゃう。なので数字が0始まりじゃないかつ飛ぶ場合がある
        const bone = createBone({ name: node.name, index: nodeIndex });
        cacheNodes[nodeIndex] = bone;

        // use basic mul
        // const offsetMatrix = Matrix4.multiplyMatrices(
        //     node.translation ? Matrix4.translationMatrix(new Vector3(...node.translation)) : Matrix4.identity,
        //     node.rotation ? Matrix4.fromQuaternion(new Quaternion(...node.rotation)) : Matrix4.identity,
        //     node.scale ? Matrix4.scalingMatrix(new Vector3(...node.scale)) : Matrix4.identity
        // );
        // use trs
        // console.log('[loadGLTF.createGLTFBone]', node.translation, node.rotation, node.scale)

        // TODO: quaternion-bug: 本当はこっちを使いたい
        // const offsetMatrix = Matrix4.fromTRS(
        //     node.translation
        //         ? new Vector3(node.translation[0], node.translation[1], node.translation[2])
        //         : Vector3.zero,
        //     node.rotation
        //         ? Rotator.fromQuaternion(
        //             new Quaternion(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3])
        //         )
        //         : new Rotator(0, 0, 0),
        //     node.scale ? new Vector3(node.scale[0], node.scale[1], node.scale[2]) : Vector3.one
        // );

        const offsetMatrix = Matrix4.multiplyMatrices(
            Matrix4.translationMatrix(
                node.translation
                    ? new Vector3(node.translation[0], node.translation[1], node.translation[2])
                    : Vector3.zero
            ),
            node.rotation
                ? new Quaternion(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]).toMatrix4()
                : Quaternion.identity().toMatrix4(),
            Matrix4.scalingMatrix(node.scale ? new Vector3(node.scale[0], node.scale[1], node.scale[2]) : Vector3.one)
        );

        bone.setOffsetMatrix(offsetMatrix);

        if (parentBone) {
            parentBone.addChild(bone);
        }
        if (node.children) {
            node.children.forEach((childNodeIndex) => createGLTFBone(childNodeIndex, bone));
        }

        return bone;
    };

    const createMeshInternal = ({
        // nodeIndex,
        meshIndex,
        skinIndex = null,
    }: {
        /*nodeIndex: number, */ meshIndex: number;
        skinIndex: number | null;
    }) => {
        let positions: Float32Array = new Float32Array();
        let normals: Float32Array = new Float32Array();
        let tangents: Float32Array | null = null;
        let binormals: Float32Array = new Float32Array();
        let uvs: Float32Array = new Float32Array();
        let indices: Uint16Array = new Uint16Array();
        let joints: Uint16Array = new Uint16Array();
        let weights: Float32Array = new Float32Array();
        let rootBone: Bone | null = null;

        // for debug
        // console.log(`[loadGLTF.createMesh] mesh index: ${meshIndex}, skin index: ${skinIndex}`);

        const mesh = gltf.meshes[meshIndex];
        console.log('[loadGLTG.createMesh] mesh:', mesh);

        const materialIndices: number[] = [];
        
        // console.log("======================================")

        mesh.primitives.forEach((primitive: GLTFMeshPrimitives) => {
            const meshAccessors: GLTFMeshAccessor = {
                attributes: [],
                indices: null,
            };
            Object.keys(primitive.attributes).forEach((key) => {
                const attributeName = key as GLTFMeshAttributes;
                const accessorIndex = primitive.attributes[attributeName];
                if (accessorIndex === undefined || accessorIndex === null) {
                    console.error(`invalid accessor - attribute name: ${attributeName}`);
                    return;
                }
                meshAccessors.attributes.push({
                    attributeName,
                    accessor: gltf.accessors[accessorIndex],
                });
            });

            if (Object.hasOwn(primitive, 'material')) {
                materialIndices.push(primitive.material);
            }

            if (primitive.indices) {
                meshAccessors.indices = { accessor: gltf.accessors[primitive.indices] };
            }

            meshAccessors.attributes.forEach((attributeAccessor) => {
                const { attributeName, accessor } = attributeAccessor;
                const bufferData = getBufferData(accessor);
                // console.log(attributeName, bufferData)
                switch (attributeName) {
                    case 'POSITION':
                        positions = new Float32Array(bufferData);
                        break;
                    case 'NORMAL':
                        normals = new Float32Array(bufferData);
                        break;
                    case 'TANGENT':
                        tangents = new Float32Array(bufferData);
                        break;
                    case 'TEXCOORD_0':
                        uvs = new Float32Array(bufferData);
                        break;
                    case 'JOINTS_0':
                        // データはuint8だけど、頂点にはuint16で送る
                        joints = new Uint16Array(new Uint8Array(bufferData));
                        break;
                    case 'WEIGHTS_0':
                        weights = new Float32Array(bufferData);
                        break;
                    default:
                        console.error('[loadGLTF.createMesh] invalid attribute name');
                }
            });
            if (meshAccessors.indices) {
                const { accessor } = meshAccessors.indices;
                const bufferData = getBufferData(accessor);
                indices = new Uint16Array(bufferData);
            }
        });

        if (skinIndex !== null) {
            // for debug
            // console.log('[loadGLTF.createMesh] mesh has skin');

            const skin = gltf.skins[skinIndex];

            // NOTE: joints の 0番目が常に root bone のはず？
            rootBone = createGLTFBone(skin.joints[0]);
        }

        // GLTF2.0は、UV座標の原点が左上にある。しかし左下を原点とした方が分かりやすい気がしているのでYを反転
        // - uvは2次元前提で処理している
        // ref: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#images
        const uvFlippedY = uvs.map((elem, i) => (i % 2 === 0 ? elem : 1 - elem));

        // for debug
        // console.log("pre", tangents, normals)
        
        
        if (tangents) {
            // binormals = Geometry.createBinormals(normals, tangents);
            binormals = new Float32Array(createBinormals(Array.from(normals), Array.from(tangents)));
        } else {
            // const d = Geometry.createTangentsAndBinormals(normals);
            // tangents = d.tangents;
            // binormals = d.binormals;
            const d = createTangentsAndBinormals(Array.from(normals));
            tangents = new Float32Array(d.tangents);
            binormals = new Float32Array(d.binormals);
        }

        // console.log("root bone", rootBone)
        // console.log(positions, uvFlippedY, normals, joints, weights, indices)
        // console.log(tangents, binormals)

        const geometry = createGeometry({
            gpu,
            attributes: [
                createAttribute({
                    name: 'aPosition',
                    data: positions,
                    size: 3,
                }),
                createAttribute({
                    name: 'aUv',
                    data: uvFlippedY,
                    size: 2,
                }),
                createAttribute({
                    name: 'aNormal',
                    data: normals,
                    size: 3,
                }),
                // bone があるならjointとweightもあるはず
                ...(rootBone
                    ? [
                          createAttribute({
                              name: 'aBoneIndices',
                              data: joints,
                              size: 4,
                          }),
                          createAttribute({
                              name: 'aBoneWeights',
                              data: weights,
                              size: 4,
                          }),
                      ]
                    : []),
                // TODO: tangent, binormal がいらない場合もあるのでオプションを作りたい
                createAttribute({
                    name: 'aTangent',
                    data: new Float32Array(tangents),
                    size: 3,
                }),
                createAttribute({
                    name: 'aBinormal',
                    data: new Float32Array(binormals),
                    size: 3,
                }),
            ],
            // indices,
            indices: Array.from(indices),
            drawCount: indices.length,
        });

        const materials = materialIndices.map((materialIndex) => {
            const targetMaterial = gltf.materials[materialIndex];
            const hasDiffuseMap = !!targetMaterial.pbrMetallicRoughness.baseColorTexture;
            const hasNormalMap = !!targetMaterial.normalTexture;

            const diffuseMap = hasDiffuseMap
                ? preloadTextures[targetMaterial.pbrMetallicRoughness.baseColorTexture!.index]
                : null;
            const normalMap = hasNormalMap ? preloadTextures[targetMaterial.normalTexture!.index] : null;

            let emissiveColor = Color.black;
            // eslint-disable-next-line no-prototype-builtins
            if (targetMaterial.hasOwnProperty('emissiveFactor')) {
                if (usedExtensions.KHR_materials_emissive_strength) {
                    const emissiveStrength =
                        targetMaterial.extensions!.KHR_materials_emissive_strength!.emissiveStrength;
                    emissiveColor = Color.fromArray(targetMaterial.emissiveFactor!).multiplyScalar(emissiveStrength);
                } else {
                    emissiveColor = Color.fromArray(targetMaterial.emissiveFactor!);
                }
            }

            return createGBufferMaterial({
                diffuseMap,
                diffuseColor: targetMaterial.pbrMetallicRoughness.baseColorFactor
                    ? Color.fromArray(targetMaterial.pbrMetallicRoughness.baseColorFactor)
                    : Color.white,
                normalMap,
                metallic: targetMaterial.pbrMetallicRoughness.metallicFactor,
                roughness: targetMaterial.pbrMetallicRoughness.roughnessFactor,
                emissiveColor,
            });
        });

        // for debug
        // console.log("[loadGLTF.createMesh]", materialIndices, materials, gltf.materials)

        const result = rootBone ? createSkinnedMesh({ geometry, bones: rootBone }) : createMesh({ geometry, materials });

        // console.log(result, result.geometry.getIndices(), Array.from(indices))
        
        return result; 
    };

    const findNode = (nodeIndex: number, parentActor: Actor): void => {
        const targetNode: GLTFNode = gltf.nodes[nodeIndex];

        // for debug
        // console.log("[loadGLTF.findNode] target node", targetNode);

        // const hasChildren = targetNode.hasOwnProperty('children');
        // const hasMesh = targetNode.hasOwnProperty('mesh');
        const hasChildren = targetNode.children !== undefined;
        const hasMesh = targetNode.mesh !== undefined;

        // mesh actor
        if (hasMesh) {
            // TODO: fix multi mesh
            const meshActor = createMeshInternal({
                // nodeIndex,
                meshIndex: targetNode.mesh!, // has mesh なのであるはず
                // skinIndex: targetNode.hasOwnProperty('skin') ? targetNode.skin! : null, //
                skinIndex: targetNode.skin !== null && targetNode.skin !== undefined ? targetNode.skin : null, //
            });
            cacheNodes[nodeIndex] = meshActor;

            addChildActor(parentActor, meshActor);

            if (hasChildren) {
                targetNode.children!.forEach((child) => findNode(child, meshActor));
            }

            return;
        }

        // TODO: meshがない時、boneなのかnull_actorなのかの判別がついてない
        if (hasChildren) {
            if (cacheNodes[nodeIndex]) {
                targetNode.children!.forEach((child) => findNode(child, parentActor));
            } else {
                const anchorActor = createActor({});
                addChildActor(parentActor, anchorActor);
                cacheNodes[nodeIndex] = anchorActor;
                targetNode.children!.forEach((child) => findNode(child, anchorActor));
            }
        }
    };

    gltf['scenes'].forEach((scene: GLTFScene) => {
        scene.nodes.forEach((node) => {
            findNode(node, rootActor);
        });
    });

    const createAnimationClips = () => {
        return gltf.animations.map((animation: GLTFAnimation) => {
            const keyframes = animation.channels.map((channel) => {
                const sampler = animation.samplers[channel.sampler];
                const inputAccessor = gltf.accessors[sampler.input];
                const inputBufferData = getBufferData(inputAccessor);
                const inputData = new Float32Array(inputBufferData);
                const outputAccessor = gltf.accessors[sampler.output];
                const outputBufferData = getBufferData(outputAccessor);
                const outputData = new Float32Array(outputBufferData);
                // let elementSize: number;
                switch (channel.target.path) {
                    case GLTFAnimationChannelTargetPath.translation:
                    case GLTFAnimationChannelTargetPath.scale:
                        // elementSize = 3;
                        break;
                    case GLTFAnimationChannelTargetPath.rotation:
                        // elementSize = 4;
                        break;
                    default:
                        console.error('invalid key type');
                }

                let animationKeyframeType: AnimationKeyframeType = AnimationKeyframeTypes.Vector3;
                switch (channel.target.path) {
                    case GLTFAnimationChannelTargetPath.rotation:
                        animationKeyframeType = AnimationKeyframeTypes.Quaternion;
                        break;
                    case GLTFAnimationChannelTargetPath.translation:
                    case GLTFAnimationChannelTargetPath.scale:
                        animationKeyframeType = AnimationKeyframeTypes.Vector3;
                        break;
                    default:
                        console.error('invalid channel target path');
                        break;
                }

                const animationKeyframes = createAnimationKeyframes({
                    target: cacheNodes[channel.target.node],
                    key: channel.target.path,
                    interpolation: sampler.interpolation,
                    // type: outputAccessor.type,
                    data: outputData,
                    // start: inputAccessor.min,
                    // end: inputAccessor.max,
                    // animation keyframe の場合はなにかしらmin,maxに入ってるはず
                    start: Math.min(...inputAccessor.min!),
                    end: Math.min(...inputAccessor.max!),
                    frames: inputData,
                    frameCount: inputAccessor.count,
                    // elementSize,
                    type: animationKeyframeType,
                });
                return animationKeyframes;
                // animationClip.addAnimationKeyframes(animationKeyframes);
            });
            const animationClip = createAnimationClip({
                name: animation.name,
                keyframes,
            });
            return animationClip;
        });
    };

    // for debug
    // console.log("------------")
    // console.log("cache nodes", cacheNodes)

    if (gltf.animations && gltf.animations.length > 0) {
        // for debug
        // console.log('[loadGLTF] has animations');
        const animationClips = createAnimationClips();
        // for debug
        // console.log("animation clips", animationClips);
        rootActor.animator?.setAnimationClips(animationClips);
    }

    // for debug
    // console.log("root actor", rootActor);
    // console.log("------------")

    return rootActor;
}
