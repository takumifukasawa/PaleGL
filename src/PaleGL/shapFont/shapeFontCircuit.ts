import { ShapeFont } from './shapeFont.ts';

export const shapeFontCircuit: ShapeFont = {
    rawCellWidth: 91,
    rawCellHeight: 150,
    colNum: 18,
    lineWidth: 6,
    dotLineWidth: 4,
    dotRadius: 5,
    charInfo: [
        {
            char: 'A',
            // prettier-ignore
            lines: [
                [
                    15, 109,
                    45, 19,
                    76, 109
                ],
                [
                    25, 82,
                    67, 82
                ]
            ],
            // prettier-ignore
            dots: [
                [25, 82],
                [66, 82]
            ],
            // prettier-ignore
            strokeDots: [
                [15, 109],
                [76, 109]
            ],
        },
    ],
};
