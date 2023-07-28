// import { Renderer } from '@/PaleGL/core/Renderer';
// import { Camera } from '@/PaleGL/actors/Camera';
// import { GPU } from '@/PaleGL/core/GPU';
// import { RenderTarget } from '@/PaleGL/core/RenderTarget';
// import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
// import { Material } from '@/PaleGL/materials/Material.ts';
//

// import { IPostProcessPass, PostProcessRenderArgs } from '@/PaleGL/postprocess/AbstractPostProcessPass.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
// import {
//     AttributeNames,
//     PostProcessUniformNames,
//     PrimitiveTypes,
//     UniformNames,
//     UniformTypes,
// } from '@/PaleGL/constants.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import { Mesh } from '@/PaleGL/actors/Mesh.ts';
// import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';

export type PostProcessRenderArgs = {
    gpu: GPU;
    camera: Camera;
    renderer: Renderer;
    prevRenderTarget: RenderTarget | null;
    isLastPass: boolean;
    gBufferRenderTargets?: GBufferRenderTargets | null;
    sceneCamera: Camera;
    time: number;
};

export interface IPostProcessPass {
    // gpu: GPU;
    name: string;
    enabled: boolean;
    width: number;
    height: number;
    renderTarget: RenderTarget;
    materials: Material[];

    setSize: (width: number, height: number) => void;
    setRenderTarget: (renderer: Renderer, camera: Camera, isLastPass: boolean) => void;
    render: ({ gpu, camera, renderer, prevRenderTarget, isLastPass, time }: PostProcessRenderArgs) => void;
}