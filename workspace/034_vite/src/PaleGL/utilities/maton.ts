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

type MatonWrapper<T> = {
    value: () => T[],
    // fill: () => T[]
    fill: () => MatonWrapper<T>
};

function matonWrapper<T>(obj: T[]): MatonWrapper<T> {
    let tmp: T[];

    tmp = obj;

    function fill(...args: T[]): MatonWrapper<T> {
        // if (Array.isArray(args[0])) {
        //     // return fillFunc(...args);
        //     return fillFunc(args[0], args[1]);
        // }
        fillFunc(tmp, args[0]);
        // return this as MatonWrapper<T>;
        // @ts-ignore
        return this;
    }

    const value = () => {
        return tmp;
    }

    return {
        value,
        fill
    };
}

// wrapper
const maton = <T>(obj: T[]) => {
    return matonWrapper(obj);
}

maton.fill = fillFunc;

export {
    maton
};
