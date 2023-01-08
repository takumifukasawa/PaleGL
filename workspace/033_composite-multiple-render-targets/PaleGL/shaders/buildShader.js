
// -----------------------------------------------
// TODO:
// - out varying を centroid できるようにしたい
// -----------------------------------------------

export const buildVertexAttributeLayouts = (attributeDescriptors) => {
    const sortedAttributeDescriptors = [...attributeDescriptors].sort((a, b) => a.location - b.location);

    const attributesList = sortedAttributeDescriptors.map(({ location, size, name, dataType }) => {
        let type;
        // TODO: fix all type
        switch(dataType) {
            case Float32Array:
                switch(size) {
                    case 1:
                        type = "float";
                        break;
                    case 2:
                        type = "vec2";
                        break;
                    case 3:
                        type = "vec3";
                        break;
                    case 4:
                        type = "vec4";
                        break;
                    default:
                        throw "[buildVertexAttributeLayouts] invalid attribute float";
                }
                break;
            // TODO: signedなパターンが欲しい    
            case Uint16Array:
                switch(size) {
                    case 1:
                        type = "uint";
                        break;
                    case 2:
                        type = "uvec2";
                        break;
                    case 3:
                        type = "uvec3";
                        break;
                    case 4:
                        type = "uvec4";
                        break;
                    default:
                        throw "[buildVertexAttributeLayouts] invalid attribute int";
                }
                break;
            default:
                throw "[buildVertexAttributeLayouts] invalid attribute data type";
        }
        const str = `layout(location = ${location}) in ${type} ${name};`;
        return str;
    });

    return attributesList;
}

export const buildVertexShader = (shader, attributeDescriptors) => {
    const shaderLines =  shader.split("\n");
    const resultShaderLines = [];

    shaderLines.forEach(shaderLine => {
        const pragma = shaderLine.match(/#pragma\s([a-zA-Z0-9_]*)$/);

        if(!pragma) {
            resultShaderLines.push(shaderLine);
            return;
        }

        const pragmaContent = pragma[1];
        let newLines = [];
        switch(pragmaContent) {
            case "attributes":
                const attributes = buildVertexAttributeLayouts(attributeDescriptors);
                newLines.push(...attributes);
                break;
            case "uniform_time":
                newLines.push("uniform float uTime;");
                break;
            case "uniform_vertex_matrices":
                newLines.push(`uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;`);
                break;
            default:
                throw "[buildVertexShader] invalid pragma";
        }
        resultShaderLines.push(newLines.join("\n"));
    });
    return resultShaderLines.join("\n");
}

export const buildFragmentShader = (shader) => {
    const shaderLines =  shader.split("\n");
    const resultShaderLines = [];

    shaderLines.forEach(shaderLine => {
        const pragma = shaderLine.match(/#pragma\s([a-zA-Z0-9_]*)$/);

        if(!pragma) {
            resultShaderLines.push(shaderLine);
            return;
        }

        const pragmaContent = pragma[1];
        let newLines = [];
        switch(pragmaContent) {
            case "uniform_time":
                newLines.push("uniform float uTime;");
                break;
            case "uniform_vertex_matrices":
                newLines.push(`uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;`);
                break;
            default:
                throw "[buildFragmentShader] invalid pragma";
        }
        resultShaderLines.push(newLines.join("\n"));
    });
    return resultShaderLines.join("\n");
}