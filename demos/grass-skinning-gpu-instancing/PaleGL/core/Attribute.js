import {AttributeUsageType} from "../constants.js";

export class Attribute {
    name;
    data; // data
    location; // layout location index
    size; // data per vertex. ex) position: 3, uv: 2
    offset;
    usageType;
    divisor;
    
    constructor({
        name,
        data,
        location,
        size,
        offset = 0,
        usageType = AttributeUsageType.StaticDraw,
        divisor
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