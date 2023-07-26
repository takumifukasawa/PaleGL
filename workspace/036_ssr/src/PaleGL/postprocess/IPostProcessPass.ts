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

    // updateCommonUniforms: ({
    //     gBufferRenderTargets,
    //     sceneCamera,
    //     time,
    // }: {
    //     gpu: GPU;
    //     renderer: Renderer;
    //     sceneRenderTarget: RenderTarget | null;
    //     gBufferRenderTargets?: GBufferRenderTargets | null;
    //     sceneCamera: Camera;
    //     time: number;
    // }) => void;
}

// export class PostProcessPassBase implements IPostProcessPass {
//     // protected gpu: GPU;
//     name: string;
//     enabled: boolean = false;
//     width: number = 1;
//     height: number = 1;
// 
//     mesh: Mesh;
//     geometry: PlaneGeometry;
//     material: Material;
//     private _renderTarget: RenderTarget;
// 
//     materials: Material[] = [];
//     
//     get renderTarget(): RenderTarget {
//         return this._renderTarget;
//     }
// 
//     // TODO: glslファイル化
//     static get baseVertexShader() {
//         return `#version 300 es
// 
// layout (location = 0) in vec3 ${AttributeNames.Position};
// layout (location = 1) in vec2 ${AttributeNames.Uv};
// 
// out vec2 vUv;
// 
// void main() {
//     vUv = aUv;
//     gl_Position = vec4(aPosition, 1);
// }
// `;
//     }
// 
//     /**
//      *
//      * @param gpu
//      * @param vertexShader
//      * @param fragmentShader
//      * @param uniforms
//      * @param name
//      */
//     constructor({
//         gpu,
//         vertexShader,
//         fragmentShader,
//         uniforms,
//         name = '',
//     }: {
//         gpu: GPU;
//         vertexShader?: string;
//         fragmentShader: string;
//         uniforms?: Uniforms;
//         name?: string;
//     }) {
//         // super({name});
//         this.name = name;
// 
//         const baseVertexShader = AbstractPostProcessPass.baseVertexShader;
//         vertexShader = vertexShader || baseVertexShader;
// 
//         // NOTE: geometryは親から渡して使いまわしてもよい
//         this.geometry = new PlaneGeometry({ gpu });
//         this.material = new Material({
//             // gpu,
//             vertexShader,
//             fragmentShader,
//             uniforms: {
//                 ...uniforms,
//                 [UniformNames.SrcTexture]: {
//                     type: UniformTypes.Texture,
//                     value: null,
//                 },
//             },
//             primitiveType: PrimitiveTypes.Triangles,
//         });
//         this.materials.push(this.material);
// 
//         // TODO: mesh生成しなくていい気がする
//         this.mesh = new Mesh({
//             geometry: this.geometry,
//             material: this.material,
//         });
// 
//         this._renderTarget = new RenderTarget({
//             gpu,
//             width: 1,
//             height: 1,
//         });
//     }
// 
//     /**
//      *
//      * @param width
//      * @param height
//      */
//     setSize(width: number, height: number) {
//         this.width = width;
//         this.height = height;
//         this._renderTarget.setSize(width, height);
//     }
// 
//     /**
//      *
//      * @param renderer
//      * @param camera
//      * @param isLastPass
//      */
//     setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {
//         if (isLastPass) {
//             renderer.setRenderTarget(camera.renderTarget);
//         } else {
//             renderer.setRenderTarget(this._renderTarget);
//         }
//     }
// 
//     /**
//      * TODO: rename "prevRenderTarget"
//      *
//      * @param gpu
//      * @param camera
//      * @param renderer
//      * @param prevRenderTarget
//      * @param isLastPass
//      * @param sceneCamera
//      * @param gBufferRenderTargets
//      */
// 
//     abstract render(opts: PostProcessRenderArgs): void;
// 
//     updateCommonUniforms({
//         gBufferRenderTargets,
//         sceneCamera,
//         time,
//     }: {
//         gpu: GPU;
//         renderer: Renderer;
//         sceneRenderTarget: RenderTarget | null;
//         gBufferRenderTargets?: GBufferRenderTargets | null;
//         sceneCamera: Camera;
//         time: number;
//     }) {
//         this.materials.forEach((passMaterial) => {
//             // TODO: postprocess側でセットした方が効率がよいが...
//             // TODO: 今、passごとにセットすればいい値も入ってしまっている
//             passMaterial.updateUniform('uTime', time);
//             passMaterial.updateUniform(PostProcessUniformNames.CameraNear, sceneCamera.near);
//             passMaterial.updateUniform(PostProcessUniformNames.CameraFar, sceneCamera.far);
//             passMaterial.updateUniform('uProjectionMatrix', sceneCamera.projectionMatrix);
//             const inverseViewProjectionMatrix = Matrix4.multiplyMatrices(
//                 sceneCamera.projectionMatrix,
//                 sceneCamera.viewMatrix
//             ).invert();
//             passMaterial.updateUniform('uInverseViewProjectionMatrix', inverseViewProjectionMatrix);
//             const inverseProjectionMatrix = sceneCamera.projectionMatrix.clone().invert();
//             passMaterial.updateUniform('uInverseProjectionMatrix', inverseProjectionMatrix);
//             passMaterial.updateUniform('uViewMatrix', sceneCamera.viewMatrix);
//             passMaterial.updateUniform(
//                 'uTransposeInverseViewMatrix',
//                 sceneCamera.viewMatrix.clone().invert().transpose()
//             );
//             if (gBufferRenderTargets) {
//                 passMaterial.updateUniform('uBaseColorTexture', gBufferRenderTargets.baseColorTexture);
//                 passMaterial.updateUniform('uNormalTexture', gBufferRenderTargets.normalTexture);
//                 passMaterial.updateUniform('uDepthTexture', gBufferRenderTargets.depthTexture);
//             }
//         });
//     }
// }
// 