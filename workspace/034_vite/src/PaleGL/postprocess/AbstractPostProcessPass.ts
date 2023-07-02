import {Renderer} from "../core/Renderer";
import {Camera} from "../actors/Camera";
import {GPU} from "../core/GPU";
import {RenderTarget} from "../core/RenderTarget";

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
