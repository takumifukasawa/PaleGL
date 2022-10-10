export class Attributes {
    type;
    data;
    stride;
    location;
    size;
    offset;
    
    constructor({ type, data, stride, location, size, offset = 0 }) {
        this.type = type;
        this.data = data;
        this.stride = stride;
        this.location = location;
        this.size = size;
        this.offset = offset;
    }
}