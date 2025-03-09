import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';

export function createBufferVisualizerPass({ gpu }: { gpu: Gpu }) {
    const bufferVisualizerPass = new BufferVisualizerPass({
        gpu,
    });
    bufferVisualizerPass.parameters.enabled = false;

    return bufferVisualizerPass;
}
