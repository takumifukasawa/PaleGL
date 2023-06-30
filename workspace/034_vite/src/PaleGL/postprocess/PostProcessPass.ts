import {PlaneGeometry} from "../geometries/PlaneGeometry.ts";
import {Material} from "../materials/Material.ts";
import {RenderTarget} from "../core/RenderTarget.ts";
import {Mesh} from "../actors/Mesh.ts";
import {AttributeNames, PrimitiveTypes, UniformNames, UniformTypes} from "../constants.ts";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.ts";


export class PostProcessPass extends AbstractPostProcessPass {
    geometry;
    material;
    renderTarget;
    mesh;
    width;
    height;

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

    constructor({gpu, vertexShader, fragmentShader, uniforms, name}) {
        super({name});

        const baseVertexShader = PostProcessPass.baseVertexShader;
        vertexShader = vertexShader || baseVertexShader;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({gpu});
        this.material = new Material({
            gpu,
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

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.renderTarget.setSize(width, height);
    }

    setRenderTarget(renderer, camera, isLastPass) {
        if (isLastPass) {
            renderer.setRenderTarget(camera.renderTarget);
        } else {
            renderer.setRenderTarget(this.renderTarget);
        }
    }

    // TODO: rename "prevRenderTarget"
    render({gpu, camera, renderer, prevRenderTarget, isLastPass}) {
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
            this.material.start({gpu})
        }

        renderer.renderMesh(this.geometry, this.material);
    }
}
