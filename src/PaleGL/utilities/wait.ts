
export const wait = async (msec: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, msec);
    });
}
