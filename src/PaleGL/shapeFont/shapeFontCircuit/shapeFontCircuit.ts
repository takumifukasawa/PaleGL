
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

const T = 19; // yの上端 (ty)
const B = 109; // yの下端 (by)
const C = -1; // closePathIndex

export const shapeFontCircuit: ShapeFontCircuit = {
    rawCellWidth: 91,
    rawCellHeight: 150,
    colNum: 13,
    lineWidth: 6,
    dotLineWidth: 4,
    dotRadius: 5,
    charInfo: [
        [
            'A',
            [
                // coords - 文字列エンコード版（よりファイルサイズ削減効果大）
                // prettier-ignore
                `15,${B},45,${T},76,${B},25,82,67,82`.split(',').map(n => +n),
                // lines
                // prettier-ignore
                "0,1,2;3,4".split(';').map(s => s.split(',').map(n => +n)),
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
                    23, T, // 0: 左上
                    59, T, // 1
                    70, 28, // 2
                    70, 52, // 3: 上に反時計回りに進む
                    60, 61, // 4: 右の中点
                    73, 73, // 5
                    73, 97, // 6
                    59, B, // 7
                    23, B, // 8
                    22, 61, // 9: 左側の中点
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, C],
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
                    74, T, // 0
                    40, T, // 1
                    19, 38, // 2
                    19, 89, // 3
                    40, B, // 4
                    74, B, // 5
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
                    19, T, // 0
                    55, T, // 1
                    76, 37, // 2
                    76, 90, // 3
                    55, B, // 4
                    19, B, // 5
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, C]
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
                    71, T, // 0: 右上
                    23, T, // 1: 左上
                    23, B, // 2: 左下
                    71, B, // 3: 右下
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
                    71, T, // 0: 右上
                    23, T, // 1: 左上
                    23, B, // 2: 左下
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
                    75, T, // 0: 右上
                    38, T, // 1
                    17, 38, // 2
                    17, 90, // 3
                    38, B, // 4
                    75, B, // 5
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
                    19, T, // 0: 左上
                    19, B, // 1: 左下
                    74, T, // 2: 右上
                    74, B, // 3: 右下
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
                    22, T, // 0
                    70, T, // 1
                    46, T, // 2
                    46, B, // 3
                    22, B, // 4
                    70, B, // 5
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
                    66, T,
                    65, 90,
                    44, B,
                    22, B,
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
            'K',
            [
                // coords
                // prettier-ignore
                [
                    18, T,
                    18, B,
                    70, T,
                    18, 83,
                    70, B,
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
                    25, T,
                    25, B,
                    72, B,
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
                    16, B,
                    16, T,
                    46, 83,
                    76, T,
                    76, B,
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
                    16, B,
                    16, T,
                    76, B,
                    76, T,
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
                    37, T, // 左上から
                    57, T,
                    75, 36,
                    75, 90,
                    57, B,
                    37, B,
                    19, 90,
                    19, 36,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, C],
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
                    23, B, // 0: 左下
                    23, T,
                    57, T,
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
                    57, B,
                    37, T, // 左上から
                    57, T,
                    75, 36,
                    75, 90,
                    57, B,
                    37, B,
                    19, 90,
                    19, 36,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1],
                    [2, 3, 4, 5, 6, 7, 8, 9, C],
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
                    23, B, // 0: 左下から
                    23, T, // 1
                    58, T, // 2
                    71, 31, // 3
                    71, 57, // 4
                    50, 70, // 5: 右のつなぎ目
                    75, B, // 6
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
                    68, T,
                    36, T,
                    23, 32,
                    23, 51,
                    37, 63,
                    55, 63,
                    70, 77,
                    70, 96,
                    55, B,
                    23, B
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
                    14, T,
                    78, T,
                    46, T,
                    46, B,
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
                    17, T,
                    17, 89,
                    34, B,
                    57, B,
                    75, 89,
                    75, T
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
                    15, T,
                    46, B,
                    77, T
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
                    12, T,
                    25, B,
                    46, 40,
                    67, B,
                    80, T
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
                    22, T,
                    78, B,
                    76, T,
                    20, B,
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
                    19, T,
                    46, 58,
                    46, B,
                    73, T
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
                    23, T,
                    72, T,
                    22, B,
                    73, B,
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
                    35, T, // 0: 左上から
                    57, T,
                    75, 38,
                    75, 89,
                    57, B,
                    35, B,
                    17, 89,
                    17, 38,
                    65, 29, // 8:
                    27, 100 // 9:
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, C],
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
                    49, T,
                    49, B,
                    24, B,
                    74, B
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
                    32, T,
                    57, T,
                    69, 30,
                    69, 52,
                    19, 99,
                    19, B,
                    78, B
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
                    23, T,
                    56, T,
                    70, 32,
                    70, 55,
                    56, 63, // 4: 右の中点
                    70, 78,
                    70, 95,
                    56, B,
                    23, B,
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
                    62, T,
                    62, 86,
                    62, B
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
                    67, T,
                    23, T,
                    23, 59,
                    54, 59,
                    70, 73,
                    70, 95,
                    56, B,
                    23, B,
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
                    69, T,
                    36, T,
                    21, 33,
                    21, 94,
                    35, B,
                    59, B,
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
                    18, T,
                    76, T,
                    35, B
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
                    34, T,
                    58, T,
                    73, 32,
                    73, 51,
                    58, 64, // 7: 右の中点
                    73, 78,
                    73, 97,
                    58, B,
                    34, B,
                    21, 97,
                    21, 78,
                ],
                // lines
                // prettier-ignore
                [
                    [0, 1, 2, 3, 4, 5, 6, 7, C],
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
                    24, B, // 0: 左下から反時計
                    57, 109,
                    72, 95,
                    72, 33,
                    58, T,
                    34, T,
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

        [
            '.',
            [
                // coords
                // prettier-ignore
                [
                    24, B, // 0: 左下から反時計
                ],
                // lines
                // prettier-ignore
                [
                ],
                // dots
                [],
                // stroke dots
                [0],
            ],
        ],
    ],
};
