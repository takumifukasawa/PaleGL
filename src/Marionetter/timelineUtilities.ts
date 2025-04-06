import { saturate } from '@/PaleGL/utilities/mathUtilities.ts';

export const isTimeInClip = (time: number, startTime: number, endTime: number) => {
    return startTime <= time && time < endTime;
};

export const clipRate = (time: number, startTime: number, endTime: number) => {
    return saturate((time - startTime) / (endTime - startTime));
};

export const buildTimelinePropertyX = (key: string) => {
    return `${key}.x`;
};

export const buildTimelinePropertyY = (key: string) => {
    return `${key}.y`;
};

export const buildTimelinePropertyZ = (key: string) => {
    return `${key}.z`;
};

export const buildTimelinePropertyR = (key: string) => {
    return `${key}.r`;
};

export const buildTimelinePropertyG = (key: string) => {
    return `${key}.g`;
};

export const buildTimelinePropertyB = (key: string) => {
    return `${key}.b`;
};

export const buildTimelinePropertyA = (key: string) => {
    return `${key}.a`;
};
export const snapToStep = (v: number, s: number) => Math.floor(v / s) * s;

export const tryAssignTimelineProperty = (key: string, value: number, needle: string, cb: (v: number) => void) => {
    if (key === needle) {
        cb(value);
        return true;
    }
    return false;
};
