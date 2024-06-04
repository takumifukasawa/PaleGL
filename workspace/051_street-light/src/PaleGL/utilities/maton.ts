function fillFunc<T>(arr: T[], value: T): T[] {
    // 非破壊
    const newArr = [...arr];
    for (let i = 0; i < arr.length; i++) {
        newArr[i] = value;
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

type MatonWrapper<T> = {
    value: () => T[];
    // fill: () => T[]
    fill: () => MatonWrapper<T>;
    range: (length: number) => MatonWrapper<T>;
};

function matonWrapper<T>(obj: T[]): MatonWrapper<T> {
    const tmp: T[] = obj;

    function fill(...args: T[]): MatonWrapper<T> {
        // if (Array.isArray(args[0])) {
        //     // return fillFunc(...args);
        //     return fillFunc(args[0], args[1]);
        // }
        fillFunc(tmp, args[0]);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this as MatonWrapper<T>;
    }
    
    function range(length: number): MatonWrapper<T> {
        rangeFunc(length);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this as MatonWrapper<T>;
    }

    const value = () => {
        return tmp;
    };

    return {
        value,
        fill,
        range
    };
}

// wrapper
const maton = <T>(obj: T[] = []) => {
    return matonWrapper(obj);
};

maton.fill = fillFunc;
maton.range = rangeFunc;

export { maton };
