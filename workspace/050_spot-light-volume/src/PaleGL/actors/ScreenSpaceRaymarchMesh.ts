import { GPU } from '@/PaleGL/core/GPU.ts';
import { PrimitiveTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { ScreenSpaceRaymarchMaterial } from '@/PaleGL/materials/ScreenSpaceRaymarchMaterial.ts';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// import { ActorUpdateArgs } from '@/PaleGL/actors/Actor.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';

type ScreenSpaceRaymarchMeshArgs = {
    gpu: GPU;
    name?: string;
    fragmentShader: string;
    depthFragmentShader: string;
    uniforms?: UniformsData;
};

export class ScreenSpaceRaymarchMesh extends Mesh {
    constructor({ gpu, name = '', fragmentShader, depthFragmentShader, uniforms = [] }: ScreenSpaceRaymarchMeshArgs) {
        const mergedUniforms: UniformsData = [
            {
                name: UniformNames.ViewDirection,
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: 'uAspect',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uFov',
                type: UniformTypes.Float,
                value: 0,
            },
            ...uniforms,
            ...PostProcessPassBase.commonUniforms,
        ];
        // NOTE: geometryは親から渡して使いまわしてもよい
        const geometry = new PlaneGeometry({ gpu });
        const material = new ScreenSpaceRaymarchMaterial({
            fragmentShader,
            depthFragmentShader,
            uniforms: mergedUniforms,
            // receiveShadow: !!receiveShadow,
            primitiveType: PrimitiveTypes.Triangles,
        });

        super({ name, geometry, material });
    }
    
    setSize(width: number, height: number) {
        super.setSize(width, height);
        this.mainMaterial.uniforms.setValue(UniformNames.TargetWidth, width);
        this.mainMaterial.uniforms.setValue(UniformNames.TargetHeight, height);
    }

    updateMaterial(args: { camera: Camera }) {
        super.updateMaterial(args);

        const { camera } = args;

        this.mainMaterial.uniforms.setValue(UniformNames.ViewDirection, camera.getWorldForward());
        // this.mainMaterial.uniforms.setValue(UniformNames.TargetWidth, width);
        // this.mainMaterial.uniforms.setValue(UniformNames.TargetHeight, height);

        // TODO: orthographic対応
        if (camera.isPerspective()) {
            const perspectiveCamera = camera as PerspectiveCamera;
            this.mainMaterial.uniforms.setValue('uAspect', perspectiveCamera.aspect);
            this.mainMaterial.uniforms.setValue('uFov', perspectiveCamera.fov);
        }
    }
}
