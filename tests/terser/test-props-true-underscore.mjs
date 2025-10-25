import { minify } from 'terser';

const code = `
const obj = {_name: "test", _type: 1, _value: 2};
console.log(obj._name, obj._type, obj._value);
`;

const options = {
    compress: {},
    mangle: {
        properties: true
    }
};

const result = await minify(code, options);
console.log('=== Result ===');
console.log(result.code);
