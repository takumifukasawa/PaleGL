
export const isProduction = () => {
    return import.meta.env.MODE === 'production';
}

export const isDevelopment = () => {
    return import.meta.env.MODE === 'development';
}

export const isNeededCompact = () => {
    return import.meta.env.VITE_COMPACT === 'true';
}

export const isMinifyShader = () => {
    return import.meta.env.VITE_MINIFY_SHADER === "true";
}
