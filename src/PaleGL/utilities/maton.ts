
function fillFunc<T>(arr: T[], ...value: T[]): T[] {
    // 非破壊
    const newArr = [...arr];
    for (let i = 0; i < arr.length; i++) {
        // newArr[arr.length] = value[i];
        newArr.push(value[i]);
    }
    return newArr;

    // 破壊的
    // for (let i = 0; i < arr.length; i++) {
    //     arr[i] = value;
    // }
    // return arr;
}

function rangeFunc(length: number, fillIndex: boolean = false): number[]{
    // とりあえずindex埋め
    const array = (new Array(length)).fill(0) as number[];
    if(!fillIndex) {
        return array;
    }
    return array.map((_, i) => i);
}

function compactFunc<T>(arr: T[]): T[] {
    const newArr = [...arr];
    return newArr.filter(Boolean);
}

export function uniqFunc<T>(arr: T[]): T[] {
    return [...new Set(arr)];
}

// function float32ArrayFunc(arr: number[]): Float32Array {
//     return new Float32Array(arr);
// }

type MatonWrapper<T> = {
    value: () => T[];
    fill: () => MatonWrapper<T>;
    range: (length: number) => MatonWrapper<T>;
    compact: () => MatonWrapper<Exclude<T, null | undefined>>;
    uniq: () => MatonWrapper<T>;
    // toFloat32Array: () => Float32Array;
};

function matonWrapper<T>(obj: T[]): MatonWrapper<T> {
    const tmp: T[] = obj;

    function fill(...args: T[]): MatonWrapper<T> {
        // TODO: tmpにassignしないとダメな気がする
        // fillFunc(tmp, args[0]);
        fillFunc(tmp, ...args);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this as MatonWrapper<T>;
    }
    
    function range(length: number): MatonWrapper<T> {
        // TODO: tmpにassignしないとダメな気がする
        rangeFunc(length);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this as MatonWrapper<T>;
    }
    
    function compact(): MatonWrapper<Exclude<T, null | undefined>> {
        // TODO: tmpにassignしないとダメな気がする
        compactFunc(tmp);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this as MatonWrapper<T>;
    }
    
    function uniq(): MatonWrapper<T> {
        uniqFunc(tmp);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this as MatonWrapper<T>;
    }
    
    // function toFloat32Array(): MatonWrapper<T>  {
    //     return float32ArrayFunc(tmp as number[]);
    // }

    const value = () => {
        return tmp;
    };

    return {
        value,
        fill,
        range,
        compact,
        uniq
        // toFloat32Array 
    };
}

// wrapper
const maton = <T>(obj: T[] = []) => {
    return matonWrapper(obj);
};

maton.fill = fillFunc;
maton.range = rangeFunc;
maton.compact = compactFunc;
maton.uniq = uniqFunc;
// maton.toFloat32Array = float32ArrayFunc;

export { maton };
