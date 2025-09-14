import {
    BlendType,
    BlendTypes,
    DepthFragmentShaderModifiers,
    DepthFuncType,
    DepthFuncTypes,
    FaceSide,
    FragmentShaderModifiers,
    MaterialTypes,
    PrimitiveType,
    PrimitiveTypes,
    RenderQueue,
    RenderQueueType,
    UniformBlockName,
    UniformNames,
    UniformTypes,
    // UniformType
    VertexShaderModifiers,
} from '@/PaleGL/constants';
import { AttributeDescriptor } from '@/PaleGL/core/attribute.ts';
import { buildFragmentShader, buildVertexShader, ShaderDefines } from '@/PaleGL/core/buildShader.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createShader, Shader } from '@/PaleGL/core/shader.ts';
import {
    addUniformValue,
    createUniforms,
    setUniformValue,
    Uniforms,
    UniformsData,
    UniformValue,
} from '@/PaleGL/core/uniforms.ts';
import { createMat4Identity } from '@/PaleGL/math/matrix4.ts';
import { uniqFunc } from '@/PaleGL/utilities/maton.ts';

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
    uniformBlockNames?: UniformBlockName[];

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

    // vat gpu particle
    useVAT?: boolean;
    isTrail?: boolean;

    // height map
    useHeightMap?: boolean;

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

export function setMaterialUniformValue(material: Material, name: string, value: UniformValue, log?: boolean) {
    setUniformValue(material.uniforms, name, value, log);
}

export function addMaterialUniformValue(material: Material, name: string, type: UniformTypes, value: UniformValue) {
    addUniformValue(material.uniforms, name, type, value);
}

export type Material = {
    name: string;
    canRender: boolean;
    type: MaterialTypes;
    shader: Shader | null;
    primitiveType: PrimitiveType;
    blendType: BlendType;
    renderQueueType: RenderQueueType;
    // uniformBlockNames : string[],
    uniformBlockNames: UniformBlockName[];
    depthTest: boolean;
    depthWrite: boolean;
    depthFuncType: DepthFuncType;
    skipDepthPrePass: boolean;
    alphaTest: number | null;
    faceSide: FaceSide;
    receiveShadow: boolean;
    queue: RenderQueue | null;
    useNormalMap: boolean;
    useEnvMap: boolean;
    isSkinning: boolean;
    gpuSkinning: boolean;
    jointNum: number | null;
    isInstancing: boolean;
    useVAT: boolean;
    isTrail: boolean;
    useHeightMap: boolean;
    useInstanceLookDirection: boolean;
    useVertexColor: boolean;
    vertexShader: string;
    fragmentShader: string;
    depthFragmentShader: string | null;
    rawVertexShader: string | null;
    rawFragmentShader: string | null;
    showLog: boolean;
    boundUniformBufferObjects: boolean;
    vertexShaderGenerator: VertexShaderGenerator | null;
    fragmentShaderGenerator: FragmentShaderGenerator | null;
    depthFragmentShaderGenerator: DepthFragmentShaderGenerator | null;
    vertexShaderModifiers: VertexShaderModifiers;
    fragmentShaderModifiers: FragmentShaderModifiers;
    depthFragmentShaderModifiers: DepthFragmentShaderModifiers;
    uniforms: Uniforms;
    depthUniforms: Uniforms;
    //
    cachedArgs: MaterialArgs;
};

export const isCompiledMaterialShader = (material: Material) => material.shader !== null;

export const useMaterialAlphaTest = (material: Material) => material.alphaTest !== null;

export function createMaterial(args: MaterialArgs): Material {
    const {
        name = '',

        vertexShaderGenerator = null,
        fragmentShaderGenerator = null,
        depthFragmentShaderGenerator = null,

        vertexShaderModifiers = [],
        fragmentShaderModifiers = [],
        depthFragmentShaderModifiers = [],

        skipDepthPrePass = false,
        depthFuncType = DepthFuncTypes.Lequal,
        faceSide = FaceSide.Front,
        receiveShadow = false,

        useNormalMap = false,

        // skinning
        isSkinning = false,
        gpuSkinning = false,

        useVAT = false,
        isTrail = false,

        // instancing
        isInstancing = false,
        useInstanceLookDirection = false,

        // vertex color
        useVertexColor = false,

        // env map
        useEnvMap = false,

        // height map
        useHeightMap = false,

        showLog = false, // depthUniforms = {},
    } = args;

    let { depthTest = true, depthWrite = true, alphaTest = null } = args;

    const canRender: boolean = true;

    const type: MaterialTypes = args.type ?? MaterialTypes.Misc;

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

    if (renderQueueType === RenderQueueType.AlphaTest && alphaTest === null) {
        console.error(`[createMaterial] invalid alpha test value - mat name: ${name}`);
    }

    const uniformBlockNames: UniformBlockName[] = uniqFunc(args.uniformBlockNames || []);

    depthTest = !!depthTest;
    depthWrite = !!depthWrite;

    // TODO: useAlphaTestのフラグがあった方がよい. あとからalphaTestを追加した場合に対応できる

    const queue: RenderQueue | null = args.queue || null;

    const jointNum: number | null = typeof args.jointNum === 'number' ? args.jointNum : null;

    const vertexShader: string = args.vertexShader || '';
    const fragmentShader: string = args.fragmentShader || '';
    const depthFragmentShader: string | null = args.depthFragmentShader || null;

    const rawVertexShader: string | null = args.rawVertexShader || null;
    const rawFragmentShader: string | null = args.rawFragmentShader || null;

    const boundUniformBufferObjects: boolean = false;

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
        useVAT,
        isTrail,
        useHeightMap,
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

        cachedArgs: args,
    };
}

export const startMaterial = (
    material: Material,
    {
        gpu,
        attributeDescriptors,
    }: {
        gpu: Gpu;
        attributeDescriptors: AttributeDescriptor[];
    }
) => {
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
        useVAT: material.useVAT,
        isTrail: material.isTrail,
        useHeightMap: material.useHeightMap,
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
                useInstanceLookDirection: material.useInstanceLookDirection,
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
        console.log(
            material.vertexShader,
            shaderDefineOptions,
            material.vertexShaderModifiers,
            material.rawVertexShader
        );
        // console.log(_fragmentShader, shaderDefineOptions, _fragmentShaderModifier, _rawFragmentShader);
    }

    material.shader = createShader(
        gpu,
        // vertexShader: _vertexShader,
        material.rawVertexShader,
        // fragmentShader: _fragmentShader
        material.rawFragmentShader
    );

    // for debug
    // console.log(`[material.start] shader`, _shader);
};
