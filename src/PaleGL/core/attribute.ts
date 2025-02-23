import { AttributeUsageType } from '@/PaleGL/constants';

type AttributeDataConstructor = Float32ArrayConstructor | Uint16ArrayConstructor;

export type AttributeDescriptor = {
    location: number;
    size: number;
    name: string;
    // dataType: Float32Array | Uint16Array
    dataType: AttributeDataConstructor;
};

export type AttributeArgs = {
    name: string;
    data: Float32Array | Uint16Array;
    location?: number;
    size: number;
    offset?: number;
    usageType?: AttributeUsageType;
    divisor?: number;
    // buffer?: WebGLBuffer | null;
};

export type Attribute = ReturnType<typeof createAttribute>;

export function createAttribute(args: AttributeArgs) {
    const name: string = args.name;
    const data: Float32Array | Uint16Array = args.data; // data
    const location: number = args.location || 0; // layout location index
    const size: number = args.size; // data per vertex. ex) position: 3, uv: 2
    const offset = args.offset || 0;
    const usageType: AttributeUsageType = args.usageType || AttributeUsageType.StaticDraw;
    const divisor = args.divisor || 0;
    
    const getDescriptor: () => AttributeDescriptor = () => {
        return {
            name,
            location,
            size,
            dataType: data.constructor as AttributeDataConstructor,
        };
    }

    return {
        // TODO: setter, getter
        name,
        data,
        location,
        size,
        offset,
        usageType,
        divisor,
        getDescriptor
    }
}
