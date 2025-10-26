type objType = { [k: string]: unknown };

export function optimizeJsonData(
    obj: objType,
    decimalPlaces: number = 3,
    filePath?: string,
    currentPath: string = '',
    verbose: boolean = false,
): unknown {
    const optimizeNumber = (num: number, path: string): number => {
        // 整数に変換できる値は整数にする
        if (Number.isInteger(num)) {
            return num;
        }
        const rounded = Number(num.toFixed(decimalPlaces));

        // 警告チェック: 0になる場合 or 50%以上の変化
        if (num !== 0) {
            const isRoundedToZero = rounded === 0;
            const changePercent = Math.abs((num - rounded) / num) * 100;

            if (verbose && (isRoundedToZero || changePercent >= 50)) {
                console.warn(
                    `[JSON Optimizer Warning] Significant value change detected:` +
                        (filePath ? `\n  File: ${filePath}` : '') +
                        (path ? `\n  Path: ${path}` : '') +
                        `\n  Original: ${num}` +
                        `\n  Rounded: ${rounded}` +
                        `\n  Change: ${changePercent.toFixed(1)}%`
                );
            }
        }

        // 丸めた結果が整数になる場合は整数にする（例: 1.0 → 1）
        if (Number.isInteger(rounded)) {
            return Math.round(rounded);
        }
        return rounded;
    };

    if (Array.isArray(obj)) {
        return obj.map((item, index) =>
            optimizeJsonData(
                item as objType,
                decimalPlaces,
                filePath,
                currentPath ? `${currentPath}[${index}]` : `[${index}]`
            )
        );
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj = {} as objType;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = optimizeJsonData(
                    obj[key] as objType,
                    decimalPlaces,
                    filePath,
                    currentPath ? `${currentPath}.${key}` : key
                );
            }
        }
        return newObj;
    } else if (typeof obj === 'number') {
        return optimizeNumber(obj, currentPath);
    } else {
        return obj;
    }
}
