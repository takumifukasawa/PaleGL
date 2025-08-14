export type ShapeFontBase<T> = {
    rawCellWidth: number;
    rawCellHeight: number;
    colNum: number;
    charInfo: [string, T][];
};
