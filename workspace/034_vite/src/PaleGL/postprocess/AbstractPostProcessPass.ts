import {Renderer} from "@/PaleGL/core/Renderer";
import {Camera} from "@/PaleGL/actors/Camera";
import {GPU} from "@/PaleGL/core/GPU";
import {RenderTarget} from "@/PaleGL/core/RenderTarget";

export type PostProcessRenderArgs = {
    gpu: GPU,
    camera: Camera,
    renderer: Renderer,
    prevRenderTarget: RenderTarget,
    isLastPass: boolean
}

export interface IPostProcessPass {
    // gpu: GPU;
    name: string;
    enabled: boolean;
    width: number;
    height: number;
    renderTarget: RenderTarget;

    setSize: (width: number, height: number) => void;
    setRenderTarget: (renderer: Renderer, camera: Camera, isLastPass: boolean) => void;
    render: ({gpu, camera, renderer, prevRenderTarget, isLastPass}: PostProcessRenderArgs) => void;
}

// export abstract class AbstractPostProcessPass implements IPostProcessPass {
//     name: string = "";
//     enabled = true;
// 
//     get renderTarget() {
//         throw "[AbstractPostProcessPass.renderTarget] should implementation";
//     }
// 
//     constructor({name}: { name: string }) {
//         this.name = name;
//     }
// 
//     setSize(width: number, height: number) {
//         throw "[AbstractPostProcessPass.setSize()] should implementation";
//     }
// 
//     setRenderTarget() {
//         throw "[AbstractPostProcessPass.setRenderTarget()] should implementation";
//     }
// 
//     render() {
//         throw "[AbstractPostProcessPass.render()] should implementation";
//     }
// }
