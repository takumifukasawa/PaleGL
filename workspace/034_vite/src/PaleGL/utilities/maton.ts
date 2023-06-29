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

function matonWrapper<T>(obj: T[]): T {
    let tmp: T[];

    tmp = obj;

    function fill(...args: T[]): T[] {
        if (Array.isArray(args[0])) {
            return fillFunc(...args);
        }
        fillFunc(tmp, args[0]);
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
const maton = (obj) => {
    return matonWrapper(obj);
}

maton.fill = fillFunc;

export {
    maton
};