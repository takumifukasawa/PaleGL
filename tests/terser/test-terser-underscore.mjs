import { minify } from 'terser';

const code = `const x = {_name: "test", _type: 1}; console.log(x._name, x._type);`;

const options = {
    compress: {},
    mangle: {
        properties: {
            regex: /^_/
        }
    }
};

const result = await minify(code, options);
console.log('=== Result ===');
console.log(result.code);
