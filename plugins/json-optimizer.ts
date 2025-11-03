type objType = { [k: string]: unknown };

export type OptimizeJsonDataOptions = {
    obj: unknown;
    enableRound?: boolean;
    decimalPlaces?: number;
    filePath?: string;
    currentPath?: string;
    verbose?: boolean;
};

export function optimizeJsonData({
    obj,
    enableRound = true,
    decimalPlaces = 3,
    filePath,
    currentPath = '',
    verbose = false,
}: OptimizeJsonDataOptions): unknown {
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
            optimizeJsonData({
                obj: item,
                enableRound,
                decimalPlaces,
                filePath,
                currentPath: currentPath ? `${currentPath}[${index}]` : `[${index}]`,
                verbose,
            })
        );
    } else if (typeof obj === 'object' && obj !== null) {
        const objTyped = obj as objType;
        const newObj = {} as objType;
        for (const key in objTyped) {
            if (Object.prototype.hasOwnProperty.call(objTyped, key)) {
                newObj[key] = optimizeJsonData({
                    obj: objTyped[key],
                    enableRound,
                    decimalPlaces,
                    filePath,
                    currentPath: currentPath ? `${currentPath}.${key}` : key,
                    verbose,
                });
            }
        }
        return newObj;
    } else if (typeof obj === 'number') {
        return enableRound ? optimizeNumber(obj, currentPath) : obj;
    } else {
        return obj;
    }
}
