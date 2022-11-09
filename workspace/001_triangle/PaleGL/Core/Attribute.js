export class Attributes {
    data;
    location;
    size;
    offset;
    
    constructor({ data, location, size, offset = 0 }) {
        this.data = data;
        this.location = location;
        this.size = size;
        this.offset = offset;
    }
}