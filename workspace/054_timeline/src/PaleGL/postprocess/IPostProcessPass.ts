import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { PostProcessPassParametersBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { PostProcessPassType } from '@/PaleGL/constants.ts';

export interface IPostProcessPass {
    // gpu: GPU;
    name: string;
    // enabled: boolean;
    type: PostProcessPassType;
    parameters: PostProcessPassParametersBase;
    width: number;
    height: number;
    renderTarget: RenderTarget;
    materials: Material[];

    setSize: (width: number, height: number) => void;
    setRenderTarget: (renderer: Renderer, camera: Camera, isLastPass: boolean) => void;
    update: () => void;
    render: ({
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass,
        time,
        lightActors,
    }: PostProcessPassRenderArgs) => void;

    // overrideParameters: (parameter: PostProcessPassParametersBase | null) => void;
    //
    // assignParameters: () => void;
}
