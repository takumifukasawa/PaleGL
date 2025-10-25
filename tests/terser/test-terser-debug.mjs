import { minify } from 'terser';

const code = `const x = {name: "test", type: 1}; console.log(x.name);`;

const options = {
    compress: {},
    mangle: {
        properties: {
            regex: /^[a-z]/,
            debug: true
        }
    }
};

const result = await minify(code, options);
console.log('=== Result ===');
console.log(result.code);
