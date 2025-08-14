
export function isMac(process: any) {
    return process.platform === 'darwin';
}

export function isWin(process: any) {
    return process.platform === 'win32';
}