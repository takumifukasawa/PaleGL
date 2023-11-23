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
    // transformFeedbackVaryings: string[]
    varyings: {
        name: string;
        data: Float32Array | Uint16Array;
    }[];
};

type TransformFeedbackBuffer = {
    attributes: Attribute[];
    srcVertexArrayObject: VertexArrayObject;
    transformFeedback: TransformFeedback;
    outputVertexArrayobject: VertexArrayObject;
};

export class TransformFeedbackDoubleBuffer {
    // private gpu: GPU;

    shader: Shader;
    // srcAttributes: Attribute[] = [];
    // outputAttributes: Attribute[] = [];
    // vertexCount: number = 0;
    // vertexArrayObject: VertexArrayObject;
    drawCount: number;

    // transformFeedback: TransformFeedback;

    private transformFeedbackBuffers: TransformFeedbackBuffer[] = [];

    // outputs: {
    //     buffer: WebGLBuffer;
    //     // size: number
    // }[] = [];

    // NOTE: readもwriteも実態は同じだがapiとして分ける
    
    get read() {
        const buffer = this.transformFeedbackBuffers[0];
        return {
            vertexArrayObject: buffer.srcVertexArrayObject,
            transformFeedback: buffer.transformFeedback,
        }
    }
    get write() {
        const buffer = this.transformFeedbackBuffers[0];
        return {
            vertexArrayObject: buffer.srcVertexArrayObject,
            transformFeedback: buffer.transformFeedback,
        }
    }

    constructor({ gpu, attributes, drawCount, vertexShader, fragmentShader, varyings }: GeometryArgs) {
        // this.gpu = gpu;
        // const {gl} = gpu;

        const transformFeedbackVaryings = varyings.map(({ name }) => name);
        this.shader = new Shader({ gpu, vertexShader, fragmentShader, transformFeedbackVaryings });

        this.drawCount = drawCount;

        // fallback
        // TODO: fix
        attributes.forEach((attribute, i) => {
            attribute.location = i;
            attribute.divisor = 0;
        });
        const attributes1 = attributes;

        const attributes2 = attributes.map((attribute, i) => {
            return {
                ...attribute,
                data: varyings[i].data, // replace
            } as Attribute;
        });

        const vertexArrayObject1 = new VertexArrayObject({
            gpu,
            attributes: attributes1,
        });
        const vertexArrayObject2 = new VertexArrayObject({
            gpu,
            attributes: attributes2,
        });

        const transformFeedback1 = new TransformFeedback({
            gpu,
            buffers: vertexArrayObject1.getBuffers(),
        });
        const transformFeedback2 = new TransformFeedback({
            gpu,
            buffers: vertexArrayObject2.getBuffers(),
        });

        this.transformFeedbackBuffers.push({
            attributes: attributes1,
            srcVertexArrayObject: vertexArrayObject1,
            transformFeedback: transformFeedback2,
            outputVertexArrayobject: vertexArrayObject2,
        });

        this.transformFeedbackBuffers.push({
            attributes: attributes2,
            srcVertexArrayObject: vertexArrayObject2,
            transformFeedback: transformFeedback1,
            outputVertexArrayobject: vertexArrayObject1,
        });
    }

    swap() {
        const tmp = this.transformFeedbackBuffers[0];
        this.transformFeedbackBuffers[0] = this.transformFeedbackBuffers[1];
        this.transformFeedbackBuffers[1] = tmp;
    }
}
