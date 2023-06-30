import {Renderer} from "../core/Renderer.ts";
import {Camera} from "../actors/Camera.ts";
import {GPU} from "../core/GPU.ts";
import {RenderTarget} from "../core/RenderTarget.ts";

export interface IPostProcessPass {
    gpu: GPU;
    name: string;
    enabled: boolean;
    width: number;
    height: number;
    setSize: (width: number, height: number) => void;
    setRenderTarget: (renderer: Renderer, camera: Camera, isLastPass: boolean) => void;
    render: ({gpu, camera, renderer, prevRenderTarget, isLastPass}: {
        gpu: GPU,
        camera: Camera,
        renderer: Renderer,
        prevRenderTarget: RenderTarget,
        isLastPass: boolean
    }) => void;
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