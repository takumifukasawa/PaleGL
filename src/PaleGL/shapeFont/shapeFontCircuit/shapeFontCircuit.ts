import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';

export type ShapeFontCircuitChar = [
    number[], // x, y ... : 2要素ずつ区切る
    number[][], // lines: fromIndex, toIndex ... : 2要素ずつ区切る. 末尾が-1ならclosePath
    number[], // dot indices
    number[], // stroke dot indices
];

export type ShapeFontCircuit = ShapeFontBase<ShapeFontCircuitChar> & {
    lineWidth: number;
    dotLineWidth: number;
    dotRadius: number;
    charInfo: [string, ShapeFontCircuitChar][];
};

const ty = 19; // yの上端
const by = 109; // yの下端

const closePathIndex = -1;

export const shapeFontCircuit: ShapeFontCircuit = {
    rawCellWidth: 91,
    rawCellHeight: 150,
    colNum: 18,
    lineWidth: 6,
    dotLineWidth: 4,
    dotRadius: 5,
    charInfo: [
        [
            'A',
            [
                // coords
                // prettier-ignore
                [
                    15, by, // 0
                    45, ty, // 1
                    76, by, // 2
                    25, 82, // 3 // 横線
                    67, 82, // 4
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2],
                    [3, 4]
                ],
                // dots
                [3, 4],
                // stroke dots
                [0, 2],
            ],
        ],
        [
            'B',
            [
                // coords
                // prettier-ignore
                [
                    23, ty, // 0: 左上
                    59, ty, // 1
                    70, 28, // 2
                    70, 52, // 3: 上に反時計回りに進む
                    60, 61, // 4: 右の中点
                    73, 73, // 5
                    73, 97, // 6
                    59, by, // 7
                    23, by, // 8
                    22, 61, // 9: 左側の中点
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, closePathIndex],
                    [4, 9]
                ],
                // dots
                [4, 9],
                // stroke dots
                [],
            ],
        ],
        [
            'C',
            [
                // coords
                // prettier-ignore
                [
                    74, ty, // 0
                    40, ty, // 1
                    19, 38, // 2
                    19, 89, // 3
                    40, by, // 4
                    74, by, // 5
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5],
                ],
                // dots
                [],
                // stroke dots
                [0, 5],
            ],
        ],
        [
            'D',
            [
                // coords
                // prettier-ignore
                [
                    19, ty, // 0
                    55, ty, // 1
                    76, 37, // 2
                    76, 90, // 3
                    55, by, // 4
                    19, by, // 5
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, closePathIndex]
                ],
                // dots
                [0, 5],
                // stroke dots
                [],
            ],
        ],
        [
            'E',
            [
                // coords
                // prettier-ignore
                [
                    71, ty, // 0: 右上
                    23, ty, // 1: 左上
                    23, by, // 2: 左下
                    71, by, // 3: 右下
                    23, 61, // 4
                    68, 61, // 5
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3],
                    [4, 5],
                ],
                // dots
                [4],
                // stroke dots
                [0, 3, 5],
            ],
        ],
        [
            'F',
            [
                // coords
                // prettier-ignore
                [
                    71, ty, // 0: 右上
                    23, ty, // 1: 左上
                    23, by, // 2: 左下
                    23, 66, // 3
                    68, 66, // 4
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2],
                    [3, 4],
                ],
                // dots
                [3],
                // stroke dots
                [0, 2, 4],
            ],
        ],
        [
            'G',
            [
                // coords
                // prettier-ignore
                [
                    75, ty, // 0: 右上
                    38, ty, // 1
                    17, 38, // 2
                    17, 90, // 3
                    38, by, // 4
                    75, by, // 5
                    75, 66, // 6
                    53, 66, // 7
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7],
                ],
                // dots
                [],
                // stroke dots
                [0, 7],
            ],
        ],
        [
            'H',
            [
                // coords
                // prettier-ignore
                [
                    19, ty, // 0: 左上
                    19, by, // 1: 左下
                    74, ty, // 2: 右上
                    74, by, // 3: 右下
                    19, 61, // 4
                    74, 61, // 5
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1],
                    [2, 3],
                    [4, 5],
                ],
                // dots
                [4, 5],
                // stroke dots
                [0, 1, 2, 3],
            ],
        ],
        [
            'I',
            [
                // coords
                // prettier-ignore
                [
                    22, ty, // 0
                    70, ty, // 1
                    46, ty, // 2
                    46, by, // 3
                    22, by, // 4
                    70, by, // 5
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1],
                    [2, 3],
                    [4, 5],
                ],
                // dots
                [2, 3],
                // stroke dots
                [0, 1, 4, 5],
            ],
        ],
        [
            'J',
            [
                // coords
                // prettier-ignore
                [
                    66, ty,
                    65, 90,
                    44, by,
                    22, by,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3],
                ],
                // dots
                [],
                // stroke dots
                [0, 3],
            ],
        ],
        [
            'k',
            [
                // coords
                // prettier-ignore
                [
                    18, ty,
                    18, by,
                    70, ty,
                    18, 83,
                    70, by,
                    40, 57,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1],
                    [2, 3],
                    [4, 5],
                ],
                // dots
                [3, 5],
                // stroke dots
                [0, 1, 2, 4],
            ],
        ],
        [
            'L',
            [
                // coords
                // prettier-ignore
                [
                    25, ty,
                    25, by,
                    72, by,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2],
                ],
                // dots
                [],
                // stroke dots
                [0, 2],
            ],
        ],
        [
            'M',
            [
                // coords
                // prettier-ignore
                [
                    16, by,
                    16, ty,
                    46, 83,
                    76, ty,
                    76, by,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4],
                ],
                // dots
                [],
                // stroke dots
                [0, 4],
            ],
        ],
        [
            'N',
            [
                // coords
                // prettier-ignore
                [
                    16, by,
                    16, ty,
                    76, by,
                    76, ty,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3],
                ],
                // dots
                [],
                // stroke dots
                [0, 3],
            ],
        ],
        [
            'O',
            [
                // coords
                // prettier-ignore
                [
                    37, ty, // 左上から
                    57, ty,
                    75, 36,
                    75, 90,
                    57, by,
                    37, by,
                    19, 90,
                    19, 36,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, closePathIndex],
                ],
                // dots
                [0, 4],
                // stroke dots
                [],
            ],
        ],
        [
            'P',
            [
                // coords
                // prettier-ignore
                [
                    23, by, // 0: 左下
                    23, ty,
                    57, ty,
                    75, 31,
                    75, 57,
                    57, 73,
                    23, 73,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6],
                ],
                // dots
                [6],
                // stroke dots
                [0],
            ],
        ],
        [
            'Q',
            [
                // coords
                // prettier-ignore
                [
                    70, 139,
                    57, by,
                    37, ty, // 左上から
                    57, ty,
                    75, 36,
                    75, 90,
                    57, by,
                    37, by,
                    19, 90,
                    19, 36,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1],
                    [2, 3, 4, 5, 6, 7, 8, 9, closePathIndex],
                ],
                // dots
                [1],
                // stroke dots
                [0],
            ],
        ],
        [
            'R',
            [
                // coords
                // prettier-ignore
                [
                    23, by, // 0: 左下から
                    23, ty, // 1
                    58, ty, // 2
                    71, 31, // 3
                    71, 57, // 4
                    50, 70, // 5: 右のつなぎ目
                    75, by, // 6
                    23, 70  // 7: 左のつなぎ目
                ],
                // lines
                [
                    [0, 1, 2, 3, 4, 5, 6],
                    [7, 5],
                ],
                // dots
                [5, 7],
                // stroke dots
                [0, 6],
            ],
        ],
        [
            'S',
            [
                // coords
                // prettier-ignore
                [
                    68, ty,
                    36, ty,
                    23, 32,
                    23, 51,
                    37, 63,
                    55, 63,
                    70, 77,
                    70, 96,
                    55, by,
                    23, by
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                ],
                // dots
                [],
                // stroke dots
                [0, 9],
            ],
        ],
        [
            'T',
            [
                // coords
                // prettier-ignore
                [
                    14, ty,
                    78, ty,
                    46, ty,
                    46, by,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1],
                    [2, 3]
                ],
                // dots
                [2],
                // stroke dots
                [0, 1, 3],
            ],
        ],
        [
            'U',
            [
                // coords
                // prettier-ignore
                [
                    17, ty,
                    17, 89,
                    34, by,
                    57, by,
                    75, 89,
                    75, ty
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5]
                ],
                // dots
                [],
                // stroke dots
                [0, 5],
            ],
        ],
        [
            'V',
            [
                // coords
                // prettier-ignore
                [
                    15, ty,
                    46, by,
                    77, ty
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2]
                ],
                // dots
                [],
                // stroke dots
                [0, 2],
            ],
        ],
        [
            'W',
            [
                // coords
                // prettier-ignore
                [
                    12, ty,
                    25, by,
                    46, 40,
                    67, by,
                    80, ty
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4]
                ],
                // dots
                [],
                // stroke dots
                [0, 4],
            ],
        ],
        [
            'X',
            [
                // coords
                // prettier-ignore
                [
                    22, ty,
                    78, by,
                    76, ty,
                    20, by,
                    49, 62
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1],
                    [2, 3]
                ],
                // dots
                [4],
                // stroke dots
                [0, 1, 2, 3],
            ],
        ],
        [
            'Y',
            [
                // coords
                // prettier-ignore
                [
                    19, ty,
                    46, 58,
                    46, by,
                    73, ty
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2],
                    [3, 1]
                ],
                // dots
                [1],
                // stroke dots
                [0, 2, 3],
            ],
        ],
        [
            'Z',
            [
                // coords
                // prettier-ignore
                [
                    23, ty,
                    72, ty,
                    22, by,
                    73, by,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3],
                ],
                // dots
                [],
                // stroke dots
                [0, 3],
            ],
        ],
        [
            '0',
            [
                // coords
                // prettier-ignore
                [
                    35, ty, // 0: 左上から
                    57, ty,
                    75, 38,
                    75, 89,
                    57, by,
                    35, by,
                    17, 89,
                    17, 38,
                    65, 29, // 8:
                    27, 100 // 9:
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, closePathIndex],
                    [8, 9]
                ],
                // dots
                [8, 9],
                // stroke dots
                [],
            ],
        ],
        [
            '1',
            [
                // coords
                // prettier-ignore
                [
                    22, 32,
                    49, ty,
                    49, by,
                    24, by,
                    74, by
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2],
                    [3, 4]
                ],
                // dots
                [2],
                // stroke dots
                [0, 3, 4],
            ],
        ],
        [
            '2',
            [
                // coords
                // prettier-ignore
                [
                    19, 30, // 0: 左上
                    32, ty,
                    57, ty,
                    69, 30,
                    69, 52,
                    19, 99,
                    19, by,
                    78, by
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7],
                ],
                // dots
                [],
                // stroke dots
                [0, 7],
            ],
        ],
        [
            '3',
            [
                // coords
                // prettier-ignore
                [
                    23, ty,
                    56, ty,
                    70, 32,
                    70, 55,
                    56, 63, // 4: 右の中点
                    70, 78,
                    70, 95,
                    56, by,
                    23, by,
                    31, 63, // 9: 左の中点
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, 8],
                    [9, 4]
                ],
                // dots
                [4],
                // stroke dots
                [0, 8, 9],
            ],
        ],
        [
            '4',
            [
                // coords
                // prettier-ignore
                [
                    77, 86,
                    18, 86,
                    62, ty,
                    62, 86,
                    62, by
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4],
                ],
                // dots
                [3],
                // stroke dots
                [0, 4],
            ],
        ],
        [
            '5',
            [
                // coords
                // prettier-ignore
                [
                    67, ty,
                    23, ty,
                    23, 59,
                    54, 59,
                    70, 73,
                    70, 95,
                    56, by,
                    23, by,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7],
                ],
                // dots
                [],
                // stroke dots
                [0, 7],
            ],
        ],
        [
            '6',
            [
                // coords
                // prettier-ignore
                [
                    69, ty,
                    36, ty,
                    21, 33,
                    21, 94,
                    35, by,
                    59, by,
                    74, 94,
                    74, 73,
                    59, 60,
                    36, 60,
                    21, 73,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                ],
                // dots
                [10],
                // stroke dots
                [0],
            ],
        ],
        [
            '7',
            [
                // coords
                // prettier-ignore
                [
                    18, ty,
                    76, ty,
                    35, by
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2]
                ],
                // dots
                [],
                // stroke dots
                [0, 2],
            ],
        ],
        [
            '8',
            [
                // coords
                // prettier-ignore
                [
                    34, 64, // 0: 左の中点から上に時計まわりに進む
                    21, 51,
                    21, 32,
                    34, ty,
                    58, ty,
                    73, 32,
                    73, 51,
                    58, 64, // 7: 右の中点
                    73, 78,
                    73, 97,
                    58, by,
                    34, by,
                    21, 97,
                    21, 78,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, closePathIndex],
                    [7, 8, 9, 10, 11, 12, 13, 0],
                ],
                // dots
                [0, 7],
                // stroke dots
                [],
            ],
        ],
        [
            '9',
            [
                // coords
                // prettier-ignore
                [
                    24, by, // 0: 左下から反時計
                    57, 109,
                    72, 95,
                    72, 33,
                    58, ty,
                    34, ty,
                    19, 33,
                    19, 53,
                    34, 68,
                    58, 68,
                    72, 53,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                ],
                // dots
                [10],
                // stroke dots
                [0],
            ],
        ],
    ],
};
