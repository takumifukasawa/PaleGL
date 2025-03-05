import { Attribute } from '@/PaleGL/core/attribute.ts';
import { createVertexArrayObject } from '@/PaleGL/core/vertexArrayObject.ts';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { GPU } from '@/PaleGL/core/GPU';
import { setGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';

export function createTangentsAndBinormals(normals: number[]) {
    const tangents: number[] = [];
    const binormals: number[] = [];
    for (let i = 0; i < normals.length / 3; i++) {
        const x = normals[i * 3 + 0];
        const y = normals[i * 3 + 1];
        const z = normals[i * 3 + 2];
        const n = new Vector3(x, y, z);
        const t = Vector3.getTangent(n);
        const b = Vector3.getBinormalFromTangent(t, n);
        tangents.push(...t.e);
        binormals.push(...b.e);
    }
    return {
        tangents,
        binormals,
    };
}

export function createBinormals(normals: number[], tangents: number[]) {
    const binormals = [];
    for (let i = 0; i < normals.length / 3; i++) {
        const n = new Vector3(normals[i * 3 + 0], normals[i * 3 + 1], normals[i * 3 + 2]);
        const t = new Vector3(tangents[i * 3 + 0], tangents[i * 3 + 1], tangents[i * 3 + 2]);
        const b = Vector3.getBinormalFromTangent(t, n);
        binormals.push(...b.e);
    }
    return binormals;
}

// TODO: location, divisorをいい感じに指定したい

export type GeometryArgs = {
    // required
    gpu: GPU;
    attributes: Attribute[];
    drawCount: number;
    // optional
    indices?: number[]; // TODO: Uint16Array
    // calculateBinormal: boolean,
    instanceCount?: number | null;
};

export type Geometry = ReturnType<typeof createGeometry>;

// export type IGeometry = {
//     getRandomLocalPositionOnEdge: (rand1: number, rand2: number) => Vector3;
// };

// NOTE: あんまりgpu持たせたくないけど持たせた方がいろいろと楽
// TODO: actorをlifecycleに乗せたのでgpuもたせなくてもいいかも
// TODO: vaoの生成2回走ってる
export function createGeometry(args: GeometryArgs) {
    const {
        gpu,
        // indices,
        drawCount,
        // // calculateBinormal = false,
        // instanceCount = null,
    } = args;

    // const _gpu: GPU = gpu;
    // vertexCount: number = 0;
    const attributes: Attribute[] = [];
    const indices = args.indices || null;
    // const drawCount: number = drawCount;
    const instanceCount: number | null = typeof args.instanceCount == 'number' ? args.instanceCount : null;

    // TODO: vaoの生成2回やっちゃってる? constructorとstartで
    const vertexArrayObject = createVertexArrayObject({
        gpu,
        attributes: [],
        indices: indices,
    });

    // console.log("hogehoge - indices", attributes, indices, drawCount, instanceCount)

    // fallback data
    // TODO: fix
    args.attributes.forEach((attribute, i) => {
        attribute.location = i;
        attribute.divisor = attribute.divisor || 0;
    });

    const geometry = {
        attributes,
        indices,
        drawCount,
        instanceCount,
        vertexArrayObject,
    };

    // default
    // (attributes.filter(e => Object.keys(e).length > 0)).forEach(attribute => {
    //     this.setAttribute(attribute);
    // });
    args.attributes
        .filter((e) => Object.keys(e).length > 0)
        .forEach((attribute) => {
            setGeometryAttribute(geometry, attribute);
        });
    
    return geometry;

    // function setAttribute(attribute: Attribute) {
    //     const location = attribute.location ? attribute.location : attributes.length;
    //     const divisor = attribute.divisor ? attribute.divisor : 0;
    //
    //     // TODO: attrを受け取ってるのにまた生成しちゃってるのよくない
    //     const attr = createAttribute({
    //         name: attribute.name,
    //         data: attribute.data,
    //         location,
    //         size: attribute.size,
    //         offset: attribute.offset,
    //         usageType: attribute.usageType || AttributeUsageType.StaticDraw,
    //         divisor,
    //     });
    //     attributes.push(attr);

    //     // _vertexArrayObject.setAttribute(attr, true);
    //     _vertexArrayObject.setAttribute(attr);
    // }

    // const _createGeometry = ({ gpu }: { gpu: GPU }) => {
    //     console.log('[Geometry.createGeometry]', attributes);

    //     // fallback
    //     // TODO: fix
    //     attributes.forEach((attribute, i) => {
    //         attribute.location = i;
    //         attribute.divisor = 0;
    //         console.log('force: ', attribute);
    //     });

    //     _vertexArrayObject = new VertexArrayObject({
    //         gpu,
    //         attributes: attributes,
    //         indices: _indices,
    //     });
    // };

    // const start = () => {
    //     // if (!_vertexArrayObject) {
    //     //     _createGeometry({ gpu: _gpu });
    //     // }
    // };

    // const update = () => {
    //     // if (!_vertexArrayObject) {
    //     //     _createGeometry({ gpu: _gpu });
    //     // }
    // };

    // const updateAttribute = (key: string, data: Float32Array) => {
    //     const attribute = attributes.find(({ name }) => name === key);
    //     if (!attribute) {
    //         console.error('invalid attribute');
    //         return;
    //     }
    //     attribute.data = data;
    //     _vertexArrayObject.updateBufferData(key, attribute.data);
    // };

    // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // // @ts-ignore
    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const getRandomLocalPositionOnEdge = (rand1: number, rand2: number): Vector3 => Vector3.zero;

    // return {
    //     attributes,
    //     indices,
    //     drawCount,
    //     instanceCount,
    //     vertexArrayObject,
    //     // // getAttributes: () => attributes,
    //     // getVertexArrayObject: () => _vertexArrayObject,
    //     // getIndices: () => _indices,
    //     // getDrawCount: () => _drawCount,
    //     // getInstanceCount: () => _instanceCount,
    //     // setInstanceCount: (value: number) => (_instanceCount = value),
    //     // // methods
    //     // setAttribute,
    //     // start,
    //     // update,
    //     // updateAttribute,
    //     // getAttribute,
    //     // getAttributeDescriptors,
    //     // getRandomLocalPositionOnEdge
    // };
}
