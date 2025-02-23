import { createAttribute, Attribute } from '@/PaleGL/core/attribute.ts';
import { VertexArrayObject } from '@/PaleGL/core/VertexArrayObject';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { AttributeUsageType } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';

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

export type IGeometry = {
    getRandomLocalPositionOnEdge: (rand1: number, rand2: number) => Vector3;
};

// NOTE: あんまりgpu持たせたくないけど持たせた方がいろいろと楽
// TODO: actorをlifecycleに乗せたのでgpuもたせなくてもいいかも
// TODO: vaoの生成2回走ってる
export function createGeometry({
    gpu,
    attributes,
    indices,
    drawCount,
    // calculateBinormal = false,
    instanceCount = null,
}: GeometryArgs) {
    // const _gpu: GPU = gpu;
    // vertexCount: number = 0;
    const _attributes: Attribute[] = [];
    const _indices: number[] | null = indices || null;
    const _drawCount: number = drawCount;
    let _instanceCount: number | null = typeof instanceCount == 'number' ? instanceCount : null;

    // TODO: vaoの生成2回やっちゃってる? constructorとstartで
    const _vertexArrayObject: VertexArrayObject = new VertexArrayObject({
        gpu,
        attributes: [],
        indices: _indices,
    });

    // fallback data
    // TODO: fix
    attributes.forEach((attribute, i) => {
        attribute.location = i;
        attribute.divisor = attribute.divisor || 0;
    });

    // default
    // (attributes.filter(e => Object.keys(e).length > 0)).forEach(attribute => {
    //     this.setAttribute(attribute);
    // });
    attributes
        .filter((e) => Object.keys(e).length > 0)
        .forEach((attribute) => {
            setAttribute(attribute);
        });

    function setAttribute(attribute: Attribute) {
        const location = attribute.location ? attribute.location : _attributes.length;
        const divisor = attribute.divisor ? attribute.divisor : 0;
        
        // TODO: attrを受け取ってるのにまた生成しちゃってるのよくない
        const attr = createAttribute({
            name: attribute.name,
            data: attribute.data,
            location,
            size: attribute.size,
            offset: attribute.offset,
            usageType: attribute.usageType || AttributeUsageType.StaticDraw,
            divisor,
        });
        _attributes.push(attr);

        // _vertexArrayObject.setAttribute(attr, true);
        _vertexArrayObject.setAttribute(attr);
    }

    // const _createGeometry = ({ gpu }: { gpu: GPU }) => {
    //     console.log('[Geometry.createGeometry]', _attributes);

    //     // fallback
    //     // TODO: fix
    //     _attributes.forEach((attribute, i) => {
    //         attribute.location = i;
    //         attribute.divisor = 0;
    //         console.log('force: ', attribute);
    //     });

    //     _vertexArrayObject = new VertexArrayObject({
    //         gpu,
    //         attributes: _attributes,
    //         indices: _indices,
    //     });
    // };

    const start = () => {
        // if (!_vertexArrayObject) {
        //     _createGeometry({ gpu: _gpu });
        // }
    };

    const update = () => {
        // if (!_vertexArrayObject) {
        //     _createGeometry({ gpu: _gpu });
        // }
    };

    const updateAttribute = (key: string, data: Float32Array) => {
        const attribute = _attributes.find(({ name }) => name === key);
        if (!attribute) {
            console.error('invalid attribute');
            return;
        }
        attribute.data = data;
        _vertexArrayObject.updateBufferData(key, attribute.data);
    };

    const getAttribute = (key: string) => {
        return _attributes.find(({ name }) => name === key);
    };

    const getAttributeDescriptors = () => {
        return _attributes.map((attribute) => attribute.getDescriptor());
    };

    // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // // @ts-ignore
    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const getRandomLocalPositionOnEdge = (rand1: number, rand2: number): Vector3 => Vector3.zero;

    return {
        getAttributes: () => _attributes,
        getVertexArrayObject: () => _vertexArrayObject,
        getIndices: () => _indices,
        getDrawCount: () => _drawCount,
        getInstanceCount: () => _instanceCount,
        setInstanceCount: (value: number) => (_instanceCount = value),
        // methods
        setAttribute,
        start,
        update,
        updateAttribute,
        getAttribute,
        getAttributeDescriptors,
        // getRandomLocalPositionOnEdge
    };
}
