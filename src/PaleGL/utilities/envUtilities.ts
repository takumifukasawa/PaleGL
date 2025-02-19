
export function isProduction() {
    return import.meta.env.MODE === 'production';
}

export function isDevelopment() {
    return import.meta.env.MODE === 'development';
}

export function isNeededCompact() {
    return import.meta.env.VITE_COMPACT === 'true';
}
