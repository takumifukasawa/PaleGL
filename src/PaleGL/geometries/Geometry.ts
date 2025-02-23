import { createAttribute, Attribute } from '@/PaleGL/core/attribute.ts';
import { VertexArrayObject } from '@/PaleGL/core/VertexArrayObject';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { AttributeUsageType } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';

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

// NOTE: あんまりgpu持たせたくないけど持たせた方がいろいろと楽
// TODO: actorをlifecycleに乗せたのでgpuもたせなくてもいいかも
// TODO: vaoの生成2回走ってる
export class Geometry {
    _gpu: GPU;
    _attributes: Attribute[] = [];
    // vertexCount: number = 0;
    _vertexArrayObject: VertexArrayObject;
    _indices: number[] | null = null;
    _drawCount: number;
    _instanceCount: number | null;
   
    get attributes() {
        return this._attributes;
    }
    get vertexArrayObject() {
        return this._vertexArrayObject;
    }
    get indices() {
        return this._indices;
    }
    get drawCount() {
        return this._drawCount;
    }
    get instanceCount() {
        return this._instanceCount;
    }
    set instanceCount(value) {
        this._instanceCount = value;
    }

    constructor({
        gpu,
        attributes,
        indices,
        drawCount,
        // calculateBinormal = false,
        instanceCount = null,
    }: GeometryArgs) {
        this._gpu = gpu;

        this._instanceCount = typeof instanceCount == 'number' ? instanceCount : null;
        this._drawCount = drawCount;

        if (indices) {
            this._indices = indices;
        }

        // TODO: vaoの生成2回やっちゃってる. constructorとstartで

        // fallback
        // TOOD: fix
        attributes.forEach((attribute, i) => {
            attribute.location = i;
            attribute.divisor = attribute.divisor || 0;
        });

        this._vertexArrayObject = new VertexArrayObject({
            gpu,
            attributes: [],
            indices: this.indices,
        });

        // default
        // (attributes.filter(e => Object.keys(e).length > 0)).forEach(attribute => {
        //     this.setAttribute(attribute);
        // });
        attributes
            .filter((e) => Object.keys(e).length > 0)
            .forEach((attribute) => {
                this.setAttribute(attribute);
            });
    }

    // TODO: attribute class を渡す、で良い気がする
    setAttribute(attribute: Attribute) {
        const location = attribute.location ? attribute.location : this.attributes.length;

        const attr = createAttribute({
            name: attribute.name,
            data: attribute.data,
            location,
            size: attribute.size,
            offset: attribute.offset,
            usageType: attribute.usageType || AttributeUsageType.StaticDraw,
            divisor: attribute.divisor,
        });
        this._attributes.push(attr);

        // this.vertexArrayObject.setAttribute(attr, true);
        this.vertexArrayObject.setAttribute(attr);
    }

    #createGeometry({ gpu }: { gpu: GPU }) {
        console.log('[Geometry.createGeometry]', this.attributes);

        // fallback
        // TODO: fix
        this.attributes.forEach((attribute, i) => {
            attribute.location = i;
            attribute.divisor = 0;
            console.log('force: ', attribute);
        });

        this._vertexArrayObject = new VertexArrayObject({
            gpu,
            attributes: this.attributes,
            indices: this.indices,
        });
    }

    start() {
        if (!this.vertexArrayObject) {
            this.#createGeometry({ gpu: this._gpu });
        }
    }

    update() {
        if (!this.vertexArrayObject) {
            this.#createGeometry({ gpu: this._gpu });
        }
    }

    updateAttribute(key: string, data: Float32Array) {
        const attribute = this.attributes.find(({ name }) => name === key);
        if (!attribute) {
            console.error('invalid attribute');
            return;
        }
        attribute.data = data;
        this.vertexArrayObject.updateBufferData(key, attribute.data);
    }

    getAttribute(key: string) {
        return this.attributes.find(({ name }) => name === key);
    }

    getAttributeDescriptors() {
        return this.attributes.map((attribute) => attribute.getDescriptor());
    }

    static createTangentsAndBinormals(normals: number[]) {
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRandomLocalPositionOnEdge(rand1: number, rand2: number): Vector3 {}

    static createBinormals(normals: number[], tangents: number[]) {
        const binormals = [];
        for (let i = 0; i < normals.length / 3; i++) {
            const n = new Vector3(normals[i * 3 + 0], normals[i * 3 + 1], normals[i * 3 + 2]);
            const t = new Vector3(tangents[i * 3 + 0], tangents[i * 3 + 1], tangents[i * 3 + 2]);
            const b = Vector3.getBinormalFromTangent(t, n);
            binormals.push(...b.e);
        }
        return binormals;
    }
}
