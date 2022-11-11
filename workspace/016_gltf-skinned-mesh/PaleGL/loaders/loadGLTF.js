
export async function loadGLTF(path) {
    const response = await fetch(path);
    const gltf = await response.json();
   
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

    let positions = null;
    let normals = null;
    let uvs = null;
    let indices = null;
    
    const binBufferDataList = await Promise.all(gltf.buffers.map(async (buffer) => {
        // NOTE: buffer = { byteLength, uri }
        const binResponse = await fetch(buffer.uri);
        const binBufferData = await binResponse.arrayBuffer();
        return { byteLength: buffer.byteLength, binBufferData };
    }));

    gltf.scenes.forEach(scene => {
        scene.nodes.forEach(node => {
            const targetNode = gltf.nodes[node];
            const mesh = gltf.meshes[targetNode.mesh];
            mesh.primitives.forEach(primitive => {
                const meshAccessors = {
                    attributes: [],
                    indices: null
                }
                Object.keys(primitive.attributes).forEach(attributeName => {
                    const accessorIndex = primitive.attributes[attributeName];
                    meshAccessors.attributes.push({ attributeName, accessor: gltf.accessors[accessorIndex] });
                });
                if(primitive.indices) {
                    meshAccessors.indices = { accessor: gltf.accessors[primitive.indices] };
                }
                meshAccessors.attributes.forEach(attributeAccessor => {
                    const { attributeName, accessor } = attributeAccessor;
                    // NOTE: accessor = {buffer, byteLength, byteOffset, target }
                    const bufferView = gltf.bufferViews[accessor.bufferView];
                    const { binBufferData } = binBufferDataList[bufferView.buffer];
                    const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                    const data = new Float32Array(slicedBuffer);
                    switch(attributeName) {
                        case "POSITION":
                            positions = data;
                            break;
                        case "NORMAL":
                            normals = data;
                            break;
                        case "TEXCOORD_0":
                            uvs = data;
                            break;
                        default:
                            throw "invalid attribute name";
                    }
                });
                if(meshAccessors.indices) {
                    const { attributeName, accessor } = meshAccessors.indices;
                    // NOTE: accessor = {buffer, byteLength, byteOffset, target }
                    const bufferView = gltf.bufferViews[accessor.bufferView];
                    const { binBufferData } = binBufferDataList[bufferView.buffer];
                    const slicedBuffer = binBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                    indices = new Uint16Array(slicedBuffer);
                }
            });
        });
    });

    const data = {
        positions,
        normals,
        uvs,
        indices
    }
   
    // for debug
    // console.log(data)
    
    return data;
}