import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';

export function createBufferVisualizerPass({ gpu }: { gpu: GPU }) {
    const bufferVisualizerPass = new BufferVisualizerPass({
        gpu,
    });
    bufferVisualizerPass.parameters.enabled = false;

    return bufferVisualizerPass;
}
