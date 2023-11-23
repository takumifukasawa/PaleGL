import { Attribute } from '@/PaleGL/core/Attribute';
import { VertexArrayObject } from '@/PaleGL/core/VertexArrayObject';
// import { AttributeUsageType } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import { Shader } from '@/PaleGL/core/Shader.ts';
import { TransformFeedback } from '@/PaleGL/core/TransformFeedback.ts';

// TODO: location, divisorをいい感じに指定したい

type GeometryArgs = {
    gpu: GPU;
    attributes: Attribute[];
    drawCount: number;
    vertexShader: string;
    fragmentShader: string;
    varyings: {
        name: string;
        data: Float32Array | Uint16Array;
    }[];
    // shader: Shader;
    // targets: {
    //     data: Float32Array | Uint16Array,
    //     size: number
    // }[]
};

// NOTE: あんまりgpu持たせたくないけど持たせた方がいろいろと楽
// TODO: actorをlifecycleに乗せたのでgpuもたせなくてもいいかも
export class TransformFeedbackBuffer {
    // private gpu: GPU;

    shader: Shader;
    attributes: Attribute[] = [];
    // vertexCount: number = 0;
    vertexArrayObject: VertexArrayObject;
    drawCount: number;

    transformFeedback: TransformFeedback;

    outputs: {
        buffer: WebGLBuffer;
        // size: number
    }[] = [];

    constructor({ gpu, attributes, drawCount, vertexShader, fragmentShader, varyings }: GeometryArgs) {
        // this.gpu = gpu;
        const { gl } = gpu;
        const transformFeedbackVaryings = varyings.map(({ name }) => name);
        this.shader = new Shader({ gpu, vertexShader, fragmentShader, transformFeedbackVaryings });

        this.drawCount = drawCount;
        
        // fallback
        // TODO: fix
        attributes.forEach((attribute, i) => {
            attribute.location = i;
            attribute.divisor = 0;
        });
        this.attributes = attributes;

        this.vertexArrayObject = new VertexArrayObject({
            gpu,
            attributes,
        });

        // default
        // (attributes.filter(e => Object.keys(e).length > 0)).forEach(attribute => {
        //     this.setAttribute(attribute);
        // });
        // attributes
        //     .filter((e) => Object.keys(e).length > 0)
        //     .forEach((attribute) => {
        //         this.setAttribute(attribute);
        //     });
        // attributes.forEach(attribute => {
        //     console.log(attribute.data.length);
        // });

        const buffers = varyings.map(({ data }) => {
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this.outputs.push({
                buffer: buffer!,
            });
            return buffer!;
        });

        this.transformFeedback = new TransformFeedback({ gpu, buffers });
    }

    /**
     *
     * @param attribute
     */
    // setAttribute(attribute: Attribute) {
    //     const location = attribute.location ? attribute.location : this.attributes.length;

    //     const attr = new Attribute({
    //         name: attribute.name,
    //         data: attribute.data,
    //         location,
    //         size: attribute.size,
    //         offset: attribute.offset,
    //         usageType: attribute.usageType || AttributeUsageType.StaticDraw,
    //         divisor: attribute.divisor,
    //     });
    //     this.attributes.push(attr);

    //     this.vertexArrayObject.setAttribute(attr, true);
    // }

    // #createGeometry({ gpu }: { gpu: GPU }) {
    //     console.log('[Geometry.createGeometry]', this.attributes);

    //     // fallback
    //     // TODO: fix
    //     this.attributes.forEach((attribute, i) => {
    //         attribute.location = i;
    //         attribute.divisor = 0;
    //         console.log('force: ', attribute);
    //     });

    //     this.vertexArrayObject = new VertexArrayObject({
    //         gpu,
    //         attributes: this.attributes,
    //     });
    // }

    // start() {
    //     if (!this.vertexArrayObject) {
    //         this.#createGeometry({ gpu: this.gpu });
    //     }
    // }

    // update() {
    //     if (!this.vertexArrayObject) {
    //         this.#createGeometry({ gpu: this.gpu });
    //     }
    // }

    // updateAttribute(key: string, data: Float32Array) {
    //     const attribute = this.attributes.find(({ name }) => name === key);
    //     if (!attribute) {
    //         throw 'invalid attribute';
    //     }
    //     attribute.data = data;
    //     this.vertexArrayObject.updateAttribute(key, attribute.data);
    // }

    // getAttribute(key: string) {
    //     return this.attributes.find(({ name }) => name === key);
    // }

    // getAttributeDescriptors() {
    //     return this.attributes.map((attribute) => attribute.getDescriptor());
    // }
}
