export class Attribute {
    data; // data
    location; // layout location index
    size; // data per vertex. ex) position: 3, uv: 2
    offset;
    
    constructor({ data, location, size, offset = 0 }) {
        this.data = data;
        this.location = location;
        this.size = size;
        this.offset = offset;
    }
}