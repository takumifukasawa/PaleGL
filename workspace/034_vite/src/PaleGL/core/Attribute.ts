import {AttributeUsageType} from "../constants.ts";

export class Attribute {
    name: string;
    data: Float32Array; // data
    location: number; // layout location index
    size: number; // data per vertex. ex) position: 3, uv: 2
    offset: number;
    usageType: AttributeUsageType;
    divisor: number;

    constructor({
                    name,
                    data,
                    location = -1, // TODO
                    size,
                    offset = 0,
                    usageType = AttributeUsageType.StaticDraw,
                    divisor = -1 // TODO
                }: {
        name: string,
        data: Float32Array,
        location?: number,
        size: number,
        offset?: number,
        usageType?: AttributeUsageType,
        divisor?: number
    }) {
        this.name = name;
        this.data = data;
        this.location = location;
        this.size = size;
        this.offset = offset;
        this.usageType = usageType;
        this.divisor = divisor;
    }

    getDescriptor() {
        return {
            name: this.name,
            location: this.location,
            size: this.size,
            dataType: this.data.constructor
        }
    }
}