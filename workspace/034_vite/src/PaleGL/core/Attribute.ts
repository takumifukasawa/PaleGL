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
};

export class Attribute {
    name: string;
    data: Float32Array | Uint16Array; // data
    location: number; // layout location index
    size: number; // data per vertex. ex) position: 3, uv: 2
    offset: number;
    usageType: AttributeUsageType;
    divisor: number;

    constructor({
        name,
        data,
        location, // TODO
        size,
        offset = 0,
        usageType = AttributeUsageType.StaticDraw,
        divisor = -1, // TODO
    }: AttributeArgs) {
        this.name = name;
        this.data = data;
        // this.location = location || -1;
        this.location = location || 0;
        this.size = size;
        this.offset = offset || 0;
        this.usageType = usageType || AttributeUsageType.StaticDraw;
        this.divisor = divisor || 0;
    }

    getDescriptor(): AttributeDescriptor {
        return {
            name: this.name,
            location: this.location,
            size: this.size,
            dataType: this.data.constructor as AttributeDataConstructor,
        };
    }
}
