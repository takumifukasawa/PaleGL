import { renderShapeFontCircuit } from '@/PaleGL/shapeFont/shapeFontCircuit/renderShapeFontCircuit.ts';
import {
    ShapeFontCircuit,
    shapeFontCircuit,
    ShapeFontCircuitChar,
} from '@/PaleGL/shapeFont/shapeFontCircuit/shapeFontCircuit.ts';
import { ShapeFontService } from '@/PaleGL/shapeFont/shapeFontService.ts';

export const shapeFontCircuitService: ShapeFontService<ShapeFontCircuitChar, ShapeFontCircuit> = [
    shapeFontCircuit,
    renderShapeFontCircuit,
];
