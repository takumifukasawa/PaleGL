import { Plugin } from 'vite';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
// import * as path from "node:path";
// import * as fs from "node:fs";

/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/ban-ts-comment,@typescript-eslint/no-unsafe-assignment */

// @ts-ignore
typeof _traverse === "function" ? traverse : traverse.default;

// @ts-ignore
typeof _generate === "function" ? generate : generate.default;

const PRECISION: number = 5;

// Babelを使ってASTを操作する関数
export function processAst(ast: t.File, precision: number) {
    // @ts-ignore
    traverse.default(ast, {
        NumericLiteral(path: unknown) {
            // @ts-ignore
            const value = path.node.value as unknown as number;
            // TODO: なくてもいいか？要確認
            if(value === 0) {
                // @ts-ignore
                path.node.value = 0;
            }
            if (value % 1 !== 0) {
                // @ts-ignore
                path.node.value = parseFloat(value.toFixed(precision));
            }
        },
    });
}

type objType = { [k: string]: unknown };

// JSON内のデータを再帰的に処理してfloatを丸める関数
export function roundFloatInJson(data: unknown, precision: number): unknown {
    console.log(`[roundFloatPlugin -> roundFloatInJson] type: ${typeof data}, data: ${data as string}`);
    // オブジェクトの場合
    if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
            // 配列の場合
            return data.map((item) => roundFloatInJson(item, precision));
        } else {
            const dataObj = data as unknown as objType;
            // オブジェクトの場合
            const roundedObject: objType = {};
            for (const key in dataObj) {
                if (Object.prototype.hasOwnProperty.call(dataObj, key)) {
                    // if (dataObj.hasOwnProperty(key)) {
                    // if (dataObj.hasOwnProperty(key)) {
                    roundedObject[key] = roundFloatInJson(dataObj[key], precision);
                    // }
                }
                return roundedObject;
            }
        }

        // 数値がfloatの場合、指定した精度に丸める
        if (typeof data === 'number' && data % 1 !== 0) {
            return parseFloat((data as number).toFixed(precision));
        }

        // その他のデータ型はそのまま返す
        return data;
    }
}


export function roundNumbersInJson(obj: objType, decimalPlaces: number): unknown{
    // 数値を丸めるヘルパー関数
    const round = (num: number) => Number(num.toFixed(decimalPlaces));

    // オブジェクトまたは配列の処理
    if (Array.isArray(obj)) {
        return obj.map(item => roundNumbersInJson(item as objType, decimalPlaces));
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj = {} as objType;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = roundNumbersInJson(obj[key] as objType, decimalPlaces);
            }
        }
        return newObj;
    } else if (typeof obj === 'number') {
        return round(obj);
    } else {
        return obj; // 数値以外のデータはそのまま返す
    }
}

// Viteプラグインの定義
export const roundFloatPlugin: () => Plugin = () => {
    return {
        name: 'vite-plugin-round-float', // プラグイン名
        transform(code, id) {
            // 拡張子が`.json`の場合に処理
            if (id.endsWith('.json')) {
                // tmp
                console.log(`[roundFloatPlugin] id: ${id}`);
                const ast = parse(code, {
                    sourceType: 'module',
                    plugins: ['typescript'],
                });
                processAst(ast, PRECISION);
                // @ts-ignore
                const { code: transfsormedCode } = generate.default(ast, {}, code);
                return {
                    code: transfsormedCode,
                    map: null,
                };
              
                // wip
                // console.log("====================================");
                // const filePath = path.resolve(__dirname, 'assets/data/scene.json');
                // const fileContent = fs.readFileSync(filePath, 'utf-8');
                // const newCodeContent = `${JSON.stringify(fileContent)}`
                //     // .replace(/"/g, "'")
                //     // .replace(/^'/, "")
                //     // .replace(/'$/, "");
                // console.log("hogehoge:", fileContent)
                // console.log("fugafuga:", newCodeContent)
                // const newCode = `export default '${JSON.stringify(newCodeContent)}'`;
                // 
                // // const rounded = roundNumbersInJson(JSON.parse(fileContent), PRECISION);

                // // console.log("filePath: ", filePath);
                // // console.log("fileContent: ", fileContent);
                // // console.log("fileContent: parsed ", JSON.parse(fileContent));
                // // console.log("fileContent rounded: ", rounded);
                // return {
                //     // code: transfsormedCode,
                //     code: newCode,
                //     map: null,
                // };
            }
        },
        // load(id) {
        //     // 特定のJSONファイルが読み込まれた際に、その内容をテキストとして返す
        //     if (id.endsWith('scene.json')) {
        //         return fetch(id).then(response => response.text());
        //     }
        // }
    };
};
