import { minify } from 'terser';

const code = `
const scene = {"o": [{"n": "test"}]};
const obj = {name: "test", type: 1};
// bracket notation
console.log(scene["o"][0]["n"]);
// dot notation  
console.log(obj.name, obj.type);
`;

const options = {
    compress: {},
    mangle: {
        properties: {
            regex: /^[a-z]/,
            keep_quoted: "strict"
        }
    }
};

const result = await minify(code, options);
console.log('=== Result ===');
console.log(result.code);
