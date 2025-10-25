type objType = { [k: string]: unknown };

export function optimizeJsonData(obj: objType, decimalPlaces: number = 3): unknown {
    const round = (num: number) => Number(num.toFixed(decimalPlaces));

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
        return round(obj);
    } else {
        return obj;
    }
}
