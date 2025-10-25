type objType = { [k: string]: unknown };

export function optimizeJsonData(obj: objType, decimalPlaces: number = 3): unknown {
    const optimizeNumber = (num: number): number => {
        // 整数に変換できる値は整数にする
        if (Number.isInteger(num)) {
            return num;
        }
        const rounded = Number(num.toFixed(decimalPlaces));
        // 丸めた結果が整数になる場合は整数にする（例: 1.0 → 1）
        if (Number.isInteger(rounded)) {
            return Math.round(rounded);
        }
        return rounded;
    };

    if (Array.isArray(obj)) {
        return obj.map(item => optimizeJsonData(item as objType, decimalPlaces));
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj = {} as objType;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = optimizeJsonData(obj[key] as objType, decimalPlaces);
            }
        }
        return newObj;
    } else if (typeof obj === 'number') {
        return optimizeNumber(obj);
    } else {
        return obj;
    }
}
