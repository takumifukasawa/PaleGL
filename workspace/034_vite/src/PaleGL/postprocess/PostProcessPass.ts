import {PlaneGeometry} from "../geometries/PlaneGeometry.ts";
import {Material, Uniforms} from "../materials/Material.ts";
import {RenderTarget} from "../core/RenderTarget.ts";
import {Mesh} from "../actors/Mesh.ts";
import {AttributeNames, PrimitiveTypes, UniformNames, UniformTypes} from "../constants.ts";
import {IPostProcessPass} from "./AbstractPostProcessPass.ts";
import {Renderer} from "../core/Renderer.ts";
import {GPU} from "../core/GPU.ts";
import {Camera} from "../actors/Camera.ts";


// export class PostProcessPass extends AbstractPostProcessPass {
export class PostProcessPass implements IPostProcessPass {
    // protected gpu: GPU;
    name: string;
    enabled: boolean = false;
    width: number = 1;
    height: number = 1;

    mesh: Mesh;
    geometry: PlaneGeometry;
    material: Material;
    renderTarget: RenderTarget

    static get baseVertexShader() {
        return `#version 300 es

layout (location = 0) in vec3 ${AttributeNames.Position};
layout (location = 1) in vec2 ${AttributeNames.Uv};

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 1);
}
`;
    }

    constructor({gpu, vertexShader, fragmentShader, uniforms, name = ""}: {
        gpu: GPU,
        vertexShader?: string,
        fragmentShader: string,
        uniforms?: Uniforms,
        name?: string
    }) {
        // super({name});
        this.name = name;

        const baseVertexShader = PostProcessPass.baseVertexShader;
        vertexShader = vertexShader || baseVertexShader;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({gpu});
        this.material = new Material({
            // gpu,
            vertexShader,
            fragmentShader,
            uniforms: {
                ...uniforms,
                [UniformNames.SceneTexture]: {
                    type: UniformTypes.Texture,
                    value: null
                }
            },
            primitiveType: PrimitiveTypes.Triangles
        });

        // TODO: mesh生成しなくていい気がする
        this.mesh = new Mesh({
            geometry: this.geometry,
            material: this.material
        });

        this.renderTarget = new RenderTarget({
            gpu,
            width: 1,
            height: 1
        });
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.renderTarget.setSize(width, height);
    }

    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {
        if (isLastPass) {
            renderer.setRenderTarget(camera.renderTarget);
        } else {
            renderer.setRenderTarget(this.renderTarget);
        }
    }

    // TODO: rename "prevRenderTarget"
    render({gpu, camera, renderer, prevRenderTarget, isLastPass}: {
        gpu: GPU,
        camera: Camera,
        renderer: Renderer,
        prevRenderTarget: RenderTarget | null,
        isLastPass: boolean
    }) {
        this.setRenderTarget(renderer, camera, isLastPass);

        // TODO: ppごとに変えられるのが正しい
        // renderer.clear(
        //     camera.clearColor.x,
        //     camera.clearColor.y,
        //     camera.clearColor.z,
        //     camera.clearColor.w
        // );

        // ppの場合はいらない気がする
        this.mesh.updateTransform();

        // 渡してない場合はなにもしないことにする
        if (prevRenderTarget) {
            // this.material.uniforms[UniformNames.SceneTexture].value = prevRenderTarget.texture;
            this.material.updateUniform(UniformNames.SceneTexture, prevRenderTarget.texture);
        }

        if (!this.material.isCompiledShader) {
            this.material.start({gpu, attributeDescriptors: []})
        }

        renderer.renderMesh(this.geometry, this.material);
    }
}
