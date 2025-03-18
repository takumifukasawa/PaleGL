import {
    BlendTypes,
    UniformTypes,
    PrimitiveTypes,
    FaceSide,
    UniformNames,
    PrimitiveType,
    BlendType,
    RenderQueue,
    // UniformType
    VertexShaderModifiers,
    FragmentShaderModifiers,
    DepthFuncType,
    DepthFuncTypes,
    RenderQueueType, MaterialTypes, DepthFragmentShaderModifiers,
} from '@/PaleGL/constants';
import { createMat4Identity } from '@/PaleGL/math/matrix4.ts';
import { createShader, Shader } from '@/PaleGL/core/shader.ts';
import { buildVertexShader, buildFragmentShader, ShaderDefines } from '@/PaleGL/core/buildShader.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { AttributeDescriptor } from '@/PaleGL/core/attribute.ts';
import {
    addUniformValue,
    createUniforms,
    setUniformValue, Uniforms,
    UniformsData,
    UniformValue,
} from '@/PaleGL/core/uniforms.ts';

export type MaterialArgs = {
    type?: MaterialTypes;

    // gpu: Gpu,
    // TODO: required じゃなくて大丈夫??
    vertexShader?: string;
    fragmentShader?: string;

    rawVertexShader?: string;
    rawFragmentShader?: string;

    // optional

    uniforms?: UniformsData;
    uniformBlockNames?: string[];

    name?: string;

    depthFragmentShader?: string;

    vertexShaderGenerator?: VertexShaderGenerator;
    fragmentShaderGenerator?: FragmentShaderGenerator;
    depthFragmentShaderGenerator?: DepthFragmentShaderGenerator;

    vertexShaderModifiers?: VertexShaderModifiers;
    fragmentShaderModifiers?: FragmentShaderModifiers;
    depthFragmentShaderModifiers?: DepthFragmentShaderModifiers;

    primitiveType?: PrimitiveType;
    depthTest?: boolean;
    depthWrite?: boolean;
    depthFuncType?: DepthFuncType;
    skipDepthPrePass?: boolean;
    alphaTest?: number | null;
    faceSide?: FaceSide;
    receiveShadow?: boolean;
    blendType?: BlendType;
    renderQueueType?: RenderQueueType;

    // normal map
    useNormalMap?: boolean;

    // env map
    useEnvMap?: boolean;

    // skinning
    isSkinning?: boolean;
    gpuSkinning?: boolean;
    jointNum?: number | null;

    // instancing
    isInstancing?: boolean;
    useInstanceLookDirection?: boolean;

    // vertex color
    useVertexColor?: boolean;

    queue?: RenderQueue;
    depthUniforms?: UniformsData;

    showLog?: boolean;
};

export type VertexShaderGenerator = ({
    attributeDescriptors,
    isSkinning,
    jointNum,
    gpuSkinning,
    isInstancing,
    useInstanceLookDirection,
}: {
    attributeDescriptors: AttributeDescriptor[];
    isSkinning: boolean;
    jointNum: number | null;
    gpuSkinning: boolean | null;
    isInstancing: boolean;
    useInstanceLookDirection: boolean;
}) => string;

export type FragmentShaderGenerator = ({
    attributeDescriptors,
}: {
    attributeDescriptors?: AttributeDescriptor[];
}) => string;

export type DepthFragmentShaderGenerator = () => string;

export function setMaterialUniformValue(material: Material, name: string, value: UniformValue) {
    setUniformValue(material.uniforms, name, value);
}

export function addMaterialUniformValue(material: Material, name: string, type: UniformTypes, value: UniformValue) {
    addUniformValue(material.uniforms, name, type, value);
}

export type Material = {
    name : string,
    canRender: boolean,
    type: MaterialTypes,
    shader: Shader | null,
    primitiveType: PrimitiveType,
    blendType: BlendType,
    renderQueueType: RenderQueueType,
    uniformBlockNames : string[],
    depthTest: boolean,
    depthWrite: boolean,
    depthFuncType: DepthFuncType,
    skipDepthPrePass: boolean,
    alphaTest: number | null,
    faceSide: FaceSide,
    receiveShadow: boolean,
    queue: RenderQueue | null,
    useNormalMap: boolean,
    useEnvMap: boolean,
    isSkinning : boolean,
    gpuSkinning: boolean,
    jointNum: number | null,
    isInstancing : boolean,
    useInstanceLookDirection: boolean,
    useVertexColor: boolean,
    vertexShader: string,
    fragmentShader: string,
    depthFragmentShader: string | null,
    rawVertexShader: string | null,
    rawFragmentShader: string | null,
    showLog: boolean,
    boundUniformBufferObjects: boolean,
    vertexShaderGenerator: VertexShaderGenerator | null,
    fragmentShaderGenerator: FragmentShaderGenerator | null,
    depthFragmentShaderGenerator: DepthFragmentShaderGenerator | null,
    vertexShaderModifiers: VertexShaderModifiers,
    fragmentShaderModifiers: FragmentShaderModifiers,
    depthFragmentShaderModifiers: DepthFragmentShaderModifiers,
    uniforms: Uniforms,
    depthUniforms: Uniforms,
    // updateUniforms: () => void,
}

export const isCompiledMaterialShader = (material: Material) => material.shader !== null;

export const useMaterialAlphaTest = (material: Material) => material.alphaTest !== null;

export function createMaterial(args: MaterialArgs): Material {
    const {
        // gpu,

        name = '',
            // type = MaterialTypes.Misc,

            // vertexShader = '',
            // fragmentShader = '',
            // depthFragmentShader,
            // rawVertexShader,
            // rawFragmentShader,
            // rawDepthFragmentShader,

            vertexShaderGenerator = null,
            fragmentShaderGenerator = null,
            depthFragmentShaderGenerator = null,

            vertexShaderModifiers = [],
            fragmentShaderModifiers = [],
            depthFragmentShaderModifiers = [],

            // primitiveType,
            // depthTest = true,
            // depthWrite = true,
            skipDepthPrePass = false,
            depthFuncType = DepthFuncTypes.Lequal,
            // alphaTest = null,
            faceSide = FaceSide.Front,
            receiveShadow = false,
            // blendType = BlendTypes.Opaque,
            // renderQueue,

            useNormalMap = false,

            // skinning
            isSkinning = false,
            gpuSkinning = false,
            // jointNum = null,

            // instancing
            isInstancing = false,
            useInstanceLookDirection = false,

            // vertex color
            useVertexColor = false,

            // env map
            useEnvMap = false,

            // queue,
            // uniforms = [],
            // uniformBlockNames = [],
            // depthUniforms = [], // uniforms = {},

            showLog = false, // depthUniforms = {},
    } = args;
    
    let {
        depthTest = true,
        depthWrite = true,
        alphaTest = null,
    } = args;
    
    // let _name: string = name;

    const canRender: boolean = true;

    const type: MaterialTypes = args.type ?? MaterialTypes.Misc;

    // let shader: Shader | null = null;

    const primitiveType: PrimitiveType = args.primitiveType ?? PrimitiveTypes.Triangles;
    const blendType: BlendType = args.blendType ?? BlendTypes.Opaque;

    alphaTest = typeof args.alphaTest === 'number' ? args.alphaTest : null;

    // TODO: none type が欲しい？
    let renderQueueType: RenderQueueType = args.renderQueueType ?? RenderQueueType.Opaque;

    if (alphaTest !== null) {
        renderQueueType = RenderQueueType.AlphaTest;
    }

    // skyboxじゃないかつrenderQueueの指定がなかったら自動で指定
    if (renderQueueType !== RenderQueueType.Skybox && args.renderQueueType === undefined) {
        switch (blendType) {
            case BlendTypes.Opaque:
                renderQueueType = RenderQueueType.Opaque;
                break;
            case BlendTypes.Transparent:
            case BlendTypes.Additive:
                renderQueueType = RenderQueueType.Transparent;
                break;
        }
    }
    
    console.log(name, type, renderQueueType, args.renderQueueType)
    
    if (renderQueueType === RenderQueueType.AlphaTest && alphaTest === null) {
        console.error(`[createMaterial] invalid alpha test value - mat name: ${name}`);
    }

    const uniformBlockNames: string[] = args.uniformBlockNames || [];
    
    // isAddedUniformBlock: boolean = false;
    depthTest = !!depthTest;
    // let _depthWrite: boolean | null = !!depthWrite;
    depthWrite = !!depthWrite;
    
    // let _depthFuncType: DepthFuncType = depthFuncType;
    // let _skipDepthPrePass: boolean = !!skipDepthPrePass;
    
    // TODO: useAlphaTestのフラグがあった方がよい. あとからalphaTestを追加した場合に対応できる
    // culling;
    // let _faceSide: FaceSide = faceSide || FaceSide.Front;
    // let _receiveShadow: boolean = !!receiveShadow;
    const queue: RenderQueue | null = args.queue || null;

    // let _useNormalMap: boolean | null = !!useNormalMap;

    // let _useEnvMap: boolean | null = !!useEnvMap;

    // skinning
    //let _isSkinning: boolean | null = !!isSkinning;
    //let _gpuSkinning: boolean | null = !!gpuSkinning;
    const jointNum: number | null = typeof args.jointNum === 'number' ? args.jointNum : null;

    // instancing
    // let _isInstancing: boolean = !!isInstancing;
    // let _useInstanceLookDirection: boolean = !!useInstanceLookDirection;

    // vertex color
    // let useVertexColor: boolean = !!useVertexColor;

    const vertexShader: string = args.vertexShader || '';
    const fragmentShader: string = args.fragmentShader || '';
    const depthFragmentShader: string | null = args.depthFragmentShader || null;

    const rawVertexShader: string | null = args.rawVertexShader || null;
    const rawFragmentShader: string | null = args.rawFragmentShader || null;

    // rawDepthFragmentShader: string | null = null;

    // let showLog: boolean = !!showLog;

    const boundUniformBufferObjects: boolean = false;

    // const _vertexShaderGenerator: VertexShaderGenerator | null = vertexShaderGenerator || null;
    // const _fragmentShaderGenerator: FragmentShaderGenerator | null = fragmentShaderGenerator || null;
    // const _depthFragmentShaderGenerator: DepthFragmentShaderGenerator | null = depthFragmentShaderGenerator || null;
    // const _vertexShaderModifier: VertexShaderModifier = vertexShaderModifier || {};
    // const _fragmentShaderModifier: FragmentShaderModifier = fragmentShaderModifier || {};

    if (!renderQueueType) {
        console.error(`[Material.constructor] invalid render queue: ${renderQueueType as unknown as string}`);
    }

    // TODO:
    // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
    // - skinning回りもここで入れたい？
    const commonUniforms: UniformsData = [
        {
            name: UniformNames.InverseWorldMatrix,
            type: UniformTypes.Matrix4,
            value: createMat4Identity(),
        },

        // TODO: commonを呼んでさえいればいらないはず
        {
            name: UniformNames.Time,
            type: UniformTypes.Float,
            value: 0,
        },
        ...(alphaTest !== null
            ? [
                  {
                      name: 'uAlphaTestThreshold',
                      type: UniformTypes.Float,
                      value: alphaTest,
                  },
              ]
            : []),
    ];

    const uniforms = createUniforms(commonUniforms, args.uniforms || []);
    const depthUniforms = createUniforms(commonUniforms, args.depthUniforms || []);

    // 外側から任意のタイミングでcompileした方が都合が良さそう
    const shader: Shader | null = null;

    // const start = ({ gpu, attributeDescriptors }: { gpu: Gpu; attributeDescriptors: AttributeDescriptor[] }) => {
    //     // for debug
    //     // console.log(`[material.start] name: ${_name}`);

    //     if (!_depthFragmentShader && _depthFragmentShaderGenerator) {
    //         _depthFragmentShader = _depthFragmentShaderGenerator();
    //     }

    //     const shaderDefineOptions: ShaderDefines = {
    //         receiveShadow,
    //         isSkinning: !!isSkinning,
    //         gpuSkinning: !!gpuSkinning,
    //         useNormalMap: !!useNormalMap,
    //         useEnvMap,
    //         useReceiveShadow: receiveShadow,
    //         useVertexColor,
    //         isInstancing,
    //         useAlphaTest: alphaTest !== null,
    //         useInstanceLookDirection: useInstanceLookDirection,
    //     };

    //     if (!_rawVertexShader) {
    //         if (!_vertexShader && _vertexShaderGenerator) {
    //             _vertexShader = _vertexShaderGenerator({
    //                 attributeDescriptors,
    //                 isSkinning: !!isSkinning,
    //                 jointNum,
    //                 gpuSkinning: gpuSkinning,
    //                 isInstancing,
    //                 useInstanceLookDirection,
    //             });
    //         }
    //         const rawVertexShader = buildVertexShader(
    //             _vertexShader,
    //             attributeDescriptors,
    //             shaderDefineOptions,
    //             _vertexShaderModifier
    //         );
    //         _rawVertexShader = rawVertexShader;
    //     }

    //     if (!_rawFragmentShader) {
    //         if (!_fragmentShader && _fragmentShaderGenerator) {
    //             _fragmentShader = _fragmentShaderGenerator({
    //                 attributeDescriptors,
    //             });
    //         }
    //         const rawFragmentShader = buildFragmentShader(
    //             _fragmentShader,
    //             shaderDefineOptions,
    //             _fragmentShaderModifier
    //         );
    //         _rawFragmentShader = rawFragmentShader;
    //     }

    //     // for debug
    //     if (showLog) {
    //         console.log('-------------------------------');
    //         // console.log(this.name);
    //         console.log(_vertexShader, shaderDefineOptions, _vertexShaderModifier, _rawVertexShader);
    //         // console.log(_fragmentShader, shaderDefineOptions, _fragmentShaderModifier, _rawFragmentShader);
    //     }

    //     _shader = new Shader({
    //         gpu,
    //         // vertexShader: _vertexShader,
    //         vertexShader: _rawVertexShader,
    //         // fragmentShader: _fragmentShader
    //         fragmentShader: _rawFragmentShader,
    //     });

    //     // for debug
    //     // console.log(`[material.start] shader`, _shader);
    // };

    /**
     * マテリアルごとにアップデートしたいuniformがあるとき
     */
    // const updateUniforms = () => {};

    return {
        name,
        canRender,
        type, 
        primitiveType,
        blendType,
        renderQueueType,
        uniformBlockNames,
        depthTest,
        depthWrite,
        depthFuncType,
        faceSide,
        skipDepthPrePass,
        alphaTest,
        receiveShadow,
        queue, 
        useNormalMap,
        useEnvMap,
        isSkinning,
        gpuSkinning,
        jointNum,
        isInstancing,
        useInstanceLookDirection,
        useVertexColor,
        showLog,
        boundUniformBufferObjects,
        uniforms,
        depthUniforms,
        
        shader,

        vertexShader,
        fragmentShader,
        depthFragmentShader,

        rawVertexShader,
        rawFragmentShader,

        vertexShaderGenerator,
        fragmentShaderGenerator,
        depthFragmentShaderGenerator,
        vertexShaderModifiers,
        fragmentShaderModifiers,
        depthFragmentShaderModifiers,
    };
}

export const startMaterial = (material: Material, { gpu, attributeDescriptors }: { gpu: Gpu; attributeDescriptors: AttributeDescriptor[] }) => {
    // for debug
    // console.log(`[material.start] name: ${_name}`);

    if (!material.depthFragmentShader && material.depthFragmentShaderGenerator) {
        material.depthFragmentShader = material.depthFragmentShaderGenerator();
    }

    const shaderDefineOptions: ShaderDefines = {
        receiveShadow: material.receiveShadow,
        isSkinning: material.isSkinning,
        gpuSkinning: material.gpuSkinning,
        useNormalMap: material.useNormalMap,
        useEnvMap: material.useEnvMap,
        useReceiveShadow: material.receiveShadow,
        useVertexColor: material.useVertexColor,
        isInstancing: material.isInstancing,
        useAlphaTest: material.alphaTest !== null,
        useInstanceLookDirection: material.useInstanceLookDirection,
    };

    if (!material.rawVertexShader) {
        if (!material.vertexShader && material.vertexShaderGenerator) {
            material.vertexShader = material.vertexShaderGenerator({
                attributeDescriptors,
                isSkinning: material.isSkinning,
                jointNum: material.jointNum,
                gpuSkinning: material.gpuSkinning,
                isInstancing: material.isInstancing,
                useInstanceLookDirection: material.useInstanceLookDirection
            });
        }
        const rawVertexShader = buildVertexShader(
            material.vertexShader,
            attributeDescriptors,
            shaderDefineOptions,
            material.vertexShaderModifiers
        );
        material.rawVertexShader = rawVertexShader;
    }

    if (!material.rawFragmentShader) {
        if (!material.fragmentShader && material.fragmentShaderGenerator) {
            material.fragmentShader = material.fragmentShaderGenerator({
                attributeDescriptors,
            });
        }
        const rawFragmentShader = buildFragmentShader(
            material.fragmentShader,
            shaderDefineOptions,
            material.fragmentShaderModifiers
        );
        material.rawFragmentShader = rawFragmentShader;
    }

    // for debug
    if (material.showLog) {
        console.log('-------------------------------');
        // console.log(this.name);
        console.log(material.vertexShader, shaderDefineOptions,material.vertexShaderModifiers, material.rawVertexShader);
        // console.log(_fragmentShader, shaderDefineOptions, _fragmentShaderModifier, _rawFragmentShader);
    }

    material.shader = createShader({
        gpu,
        // vertexShader: _vertexShader,
        vertexShader: material.rawVertexShader,
        // fragmentShader: _fragmentShader
        fragmentShader: material.rawFragmentShader,
    });

    // for debug
    // console.log(`[material.start] shader`, _shader);
}
