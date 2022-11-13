
import {Actor} from "../actors/Actor.js";
import {Bone} from "../core/Bone.js";
import {SkinnedMesh} from "../actors/SkinnedMesh.js";
import {Geometry} from "../geometries/Geometry.js";
import {Mesh} from "../actors/Mesh.js";

export async function loadGLTF({ gpu, path }) {
    const response = await fetch(path);
    const gltf = await response.json();

    const rootActor = new Actor();
   
    // for debug
    console.log(gltf);
    
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
    
    const binBufferDataList = await Promise.all(gltf.buffers.map(async (buffer) => {
        // NOTE: buffer = { byteLength, uri }
        const binResponse = await fetch(buffer.uri);
        const binBufferData = await binResponse.arrayBuffer();
        return { byteLength: buffer.byteLength, binBufferData };
    }));
    
    const getBufferData = (accessor) => {
        const bufferView = gltf.bufferViews[accessor.bufferView];
        const {binBufferData} = binBufferDataList[bufferView.buffer];
        const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
        return slicedBuffer;
    }
    
    const createMesh = ({ meshIndex, skinIndex = null }) => {
        let positions = null;
        let normals = null;
        let uvs = null;
        let indices = null;
        let joints = null;
        let weights = null;
        let rootBone = null;
        
        console.log(`[loadGLTF.createMesh] mesh index: ${meshIndex}, skin index: ${skinIndex}`);

        const mesh = gltf.meshes[meshIndex];

        mesh.primitives.forEach(primitive => {
            const meshAccessors = {
                attributes: [],
                indices: null
            }
            Object.keys(primitive.attributes).forEach(attributeName => {
                const accessorIndex = primitive.attributes[attributeName];
                meshAccessors.attributes.push({attributeName, accessor: gltf.accessors[accessorIndex]});
            });
            if (primitive.indices) {
                meshAccessors.indices = {accessor: gltf.accessors[primitive.indices]};
            }
            meshAccessors.attributes.forEach(attributeAccessor => {
                const {attributeName, accessor} = attributeAccessor;
                // NOTE: accessor = {buffer, byteLength, byteOffset, target }
                // const bufferView = gltf.bufferViews[accessor.bufferView];
                // const {binBufferData} = binBufferDataList[bufferView.buffer];
                // const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                // const data = new Float32Array(slicedBuffer);
                const bufferData = getBufferData(accessor);
                const data = new Float32Array(bufferData);
                switch (attributeName) {
                    case "POSITION":
                        positions = data;
                        break;
                    case "NORMAL":
                        normals = data;
                        break;
                    case "TEXCOORD_0":
                        uvs = data;
                        break;
                    case "JOINTS_0":
                        joints = data;
                        break;
                    case "WEIGHTS_0":
                        weights = data;
                        break;
                    default:
                        throw "[loadGLTF] invalid attribute name";
                }
            });
            if (meshAccessors.indices) {
                const {attributeName, accessor} = meshAccessors.indices;
                // NOTE: accessor = {buffer, byteLength, byteOffset, target }
                // const bufferView = gltf.bufferViews[accessor.bufferView];
                // const {binBufferData} = binBufferDataList[bufferView.buffer];
                // const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                // indices = new Uint16Array(slicedBuffer);
                const bufferData = getBufferData(accessor);
                indices = new Uint16Array(bufferData);
            }
        });
        
        if(skinIndex !== null) {
            console.log("[loadGLTF.createMesh] mesh has skin");
            // gltf.skins
            const skin = gltf.skins[skinIndex];
            
            const createBone = (nodeIndex, parentBone) => {
                const node = gltf.nodes[nodeIndex];
                const bone = new Bone({ name: node.name, index: nodeIndex });
                if(parentBone) {
                    parentBone.addChild(bone);
                }
                if(node.children) {
                    node.children.forEach(childNodeIndex => createBone(childNodeIndex, bone));
                }
                return bone;
            };
            
            // NOTE: joints の 0番目が常に root bone のはず？
            rootBone = createBone(skin.joints[0]);
        }
        
        console.log("root bone", rootBone)
        
        const geometry = new Geometry({
            gpu,
            attributes: {
                position: {
                    data: positions,
                    size: 3,
                },
                normal: {
                    data: normals,
                    size: 3
                },
                uv: {
                    data: uvs,
                    size: 3
                },
                // bone があるならjointとweightもあるはず
                ...(rootBone ? {
                    joint: {
                        data: joints,
                        size: 4,
                    },
                    weight: {
                        data: weights,
                        size: 4,
                    }
                } : {}),
            },
            indices,
            drawCount: indices.length
        });
        
        // return rootBone
        //     ? new SkinnedMesh({ geometry, bones: rootBone })
        //     : new Mesh({ geometry })
    }
    
    const findNode = (node) => {
        const targetNode = gltf.nodes[node];

        // for debug
        // console.log("[loadGLTF.findNode] target node", targetNode);

        if(targetNode.hasOwnProperty("children")) {
            targetNode.children.forEach(targetNode => findNode(targetNode));
            return;
        }
        // mesh node
        if(targetNode.hasOwnProperty("mesh")) {
            // TODO: fix multi mesh
            const mesh = createMesh({
                meshIndex: targetNode.mesh,
                skinIndex: targetNode.hasOwnProperty("skin") ? targetNode.skin : null
            });
            // rootActor.addChild(mesh);
        }
        // // skin node
        // if(targetNode.hasOwnProperty("skin")) {
        // }
    }

    gltf.scenes.forEach(scene => {
        scene.nodes.forEach(node => {
            findNode(node)
        });
    });
    
    // console.log(rootActor)
    
    return rootActor;
    
    // const data = {
    //     positions: mesh.positions,
    //     normals: mesh.normals,
    //     uvs: mesh.uvs,
    //     indices: mesh.indices
    // }
   
    // // for debug
    // // console.log(data)
    // 
    // return data;
}