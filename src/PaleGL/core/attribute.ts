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

export function createAttribute(
    name: string,
    data: Float32Array | Uint16Array,
    size: number,
    location: number = 0,
    offset: number = 0,
    usageType: AttributeUsageType = AttributeUsageType.StaticDraw,
    divisor: number = 0
) {

    // const getDescriptor: () => AttributeDescriptor = () => {
    //     return {
    //         name,
    //         location,
    //         size,
    //         dataType: data.constructor as AttributeDataConstructor,
    //     };
    // }

    return {
        // TODO: setter, getter
        name,
        data,
        location,
        size,
        offset,
        usageType,
        divisor,
        // getDescriptor
    };
}

export const getAttributeDescriptor: (attribute: Attribute) => AttributeDescriptor = (attribute: Attribute) => {
    return {
        name: attribute.name,
        location: attribute.location,
        size: attribute.size,
        dataType: attribute.data.constructor as AttributeDataConstructor,
    };
};
