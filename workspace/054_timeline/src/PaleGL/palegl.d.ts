declare module '*?shader' {
    const content: string;
    export default content;
}

export type Override<Type, NewType> = Omit<Type, keyof NewType> & NewType;
