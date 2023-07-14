export async function wait(msec) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, msec);
    });
}
