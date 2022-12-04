import {AttributeUsageType} from "../constants.js";

export class Attribute {
    data; // data
    location; // layout location index
    size; // data per vertex. ex) position: 3, uv: 2
    offset;
    usageType;
    
    constructor({ data, location, size, offset = 0, usageType = AttributeUsageType.StaticDraw }) {
        this.data = data;
        this.location = location;
        this.size = size;
        this.offset = offset;
        this.usageType = usageType;
    }
}