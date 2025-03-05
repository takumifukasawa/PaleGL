import { Attribute, createAttribute, getAttributeDescriptor } from '@/PaleGL/core/attribute.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { AttributeUsageType } from '@/PaleGL/constants.ts';
import {
    setVertexArrayObjectAttribute, updateVertexArrayObjectBufferData,
} from '@/PaleGL/core/VertexArrayObject.ts';

export function setGeometryAttribute(geometry: Geometry, attribute: Attribute) {
    const location = attribute.location ? attribute.location : geometry.attributes.length;
    const divisor = attribute.divisor ? attribute.divisor : 0;

    // TODO: attrを受け取ってるのにまた生成しちゃってるのよくない
    const attr = createAttribute({
        name: attribute.name,
        data: attribute.data,
        location,
        size: attribute.size,
        offset: attribute.offset,
        usageType: attribute.usageType || AttributeUsageType.StaticDraw,
        divisor,
    });
    geometry.attributes.push(attr);

    // _vertexArrayObject.setAttribute(attr, true);
    setVertexArrayObjectAttribute(geometry.vertexArrayObject, attr);
}


export function updateGeometryAttribute (geometry: Geometry, key: string, data: Float32Array) {
    const attribute = geometry.attributes.find(({ name }) => name === key);
    if (!attribute) {
        console.error('invalid attribute');
        return;
    }
    attribute.data = data;
    updateVertexArrayObjectBufferData(geometry.vertexArrayObject, key, attribute.data);
};


export const getGeometryAttributeByName = (geometry: Geometry, key: string) => {
    return geometry.attributes.find(({ name }) => name === key);
};

export const getGeometryAttributeDescriptors = (geometry: Geometry) => {
    return geometry.attributes.map((attribute) => getAttributeDescriptor(attribute));
};


