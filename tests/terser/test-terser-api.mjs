import { minify } from 'terser';

const code = `
const uniforms = [
    {name: "uTest1", type: 1, value: 0},
    {name: "uTest2", type: 2, value: 1},
];
console.log(uniforms[0].name, uniforms[0].type, uniforms[0].value);
`;

const options = {
    compress: {},
    mangle: {
        properties: {
            regex: /^[a-z]/
        }
    }
};

const result = await minify(code, options);
console.log('=== Result ===');
console.log(result.code);
