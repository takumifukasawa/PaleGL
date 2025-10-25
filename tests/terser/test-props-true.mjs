import { minify } from 'terser';

const code = `
const obj = {name: "test", type: 1, value: 2};
console.log(obj.name, obj.type, obj.value);
`;

const options = {
    compress: {},
    mangle: {
        properties: true  // 全プロパティ
    }
};

const result = await minify(code, options);
console.log('=== Result ===');
console.log(result.code);
