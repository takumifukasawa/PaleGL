import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import {PostProcessParametersBase, PostProcessPassRenderArgs} from "@/PaleGL/postprocess/PostProcessPassBase.ts";

export interface IPostProcessPass {
    // gpu: GPU;
    name: string;
    // enabled: boolean;
    parameters: PostProcessParametersBase;
    width: number;
    height: number;
    renderTarget: RenderTarget;
    materials: Material[];

    setSize: (width: number, height: number) => void;
    setRenderTarget: (renderer: Renderer, camera: Camera, isLastPass: boolean) => void;
    update: () => void;
    render: ({ gpu, camera, renderer, prevRenderTarget, isLastPass, time, lightActors }: PostProcessPassRenderArgs) => void;
}
