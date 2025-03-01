import { Shader } from '@/PaleGL/core/Shader';
import {
    BlendTypes,
    UniformTypes,
    PrimitiveTypes,
    RenderQueues,
    FaceSide,
    UniformNames,
    PrimitiveType,
    BlendType,
    RenderQueue,
    // UniformType,
    VertexShaderModifier,
    FragmentShaderModifier,
    DepthFuncType,
    DepthFuncTypes,
    RenderQueueType,
} from '@/PaleGL/constants';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
// import { Vector3 } from '@/PaleGL/math/Vector3';
import { buildVertexShader, buildFragmentShader, ShaderDefines } from '@/PaleGL/core/buildShader.ts';
import { GPU } from '@/PaleGL/core/GPU';
// import { Texture } from '@/PaleGL/core/Texture';
import { AttributeDescriptor } from '@/PaleGL/core/attribute.ts';
// import { CubeMap } from '@/PaleGL/core/CubeMap';
// import { Vector2 } from '@/PaleGL/math/Vector2';
// import { Color } from '@/PaleGL/math/Color';
// import { DirectionalLightStruct } from '@/PaleGL/actors/directionalLight.ts';
// import {Vector4} from "@/PaleGL/math/Vector4.ts";
import {
    addUniformValue,
    createUniforms,
    setUniformValue,
    Uniforms,
    UniformsData,
    UniformValue,
} from '@/PaleGL/core/uniforms.ts';
// import {UniformBufferObject} from "@/PaleGL/core/UniformBufferObject.ts";

export type MaterialArgs = {
    type?: MaterialTypes;

    // gpu: GPU,
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

    vertexShaderModifier?: VertexShaderModifier;
    fragmentShaderModifier?: FragmentShaderModifier;

    primitiveType?: PrimitiveType;
    depthTest?: boolean | null;
    depthWrite?: boolean | null;
    depthFuncType?: DepthFuncType;
    skipDepthPrePass?: boolean;
    alphaTest?: number | null;
    faceSide?: FaceSide;
    receiveShadow?: boolean;
    blendType?: BlendType;
    renderQueue?: RenderQueue;

    // normal map
    useNormalMap?: boolean | null;

    // env map
    useEnvMap?: boolean | null;

    // skinning
    isSkinning?: boolean | null;
    gpuSkinning?: boolean | null;
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

export const MaterialTypes = {
    Misc: 0,
    ObjectSpaceRaymarch: 1,
} as const;

export type MaterialTypes = (typeof MaterialTypes)[keyof typeof MaterialTypes];

// export class Material {
//     name: string = '';
//
//     canRender: boolean = true;
//
//     type: MaterialTypes = MaterialTypes.Misc;
//
//     shader: Shader | null = null;
//     _primitiveType: PrimitiveType;
//     blendType: BlendType;
//     renderQueue: RenderQueue;
//     uniforms: Uniforms;
//     depthUniforms: Uniforms;
//     uniformBlockNames: string[] = [];
//     // isAddedUniformBlock: boolean = false;
//     depthTest: boolean | null;
//     depthWrite: boolean | null;
//     depthFuncType: DepthFuncType;
//     skipDepthPrePass: boolean | null;
//     alphaTest: number | null;
//     // culling;
//     faceSide: FaceSide;
//     receiveShadow: boolean;
//     queue: RenderQueue | null;
//
//     useNormalMap: boolean | null;
//
//     useEnvMap: boolean | null;
//
//     // skinning
//     isSkinning: boolean | null;
//     gpuSkinning: boolean | null;
//     jointNum: number | null;
//
//     // instancing
//     isInstancing: boolean;
//     useInstanceLookDirection: boolean;
//
//     // vertex color
//     useVertexColor: boolean;
//
//     vertexShader: string;
//     fragmentShader: string;
//     depthFragmentShader: string | null = null;
//
//     rawVertexShader: string | null = null;
//     rawFragmentShader: string | null = null;
//
//     // rawDepthFragmentShader: string | null = null;
//
//     showLog: boolean;
//
//     boundUniformBufferObjects: boolean = false;
//
//     _vertexShaderGenerator: VertexShaderGenerator | null = null;
//     _fragmentShaderGenerator: FragmentShaderGenerator | null = null;
//     _depthFragmentShaderGenerator: DepthFragmentShaderGenerator | null = null;
//     _vertexShaderModifier: VertexShaderModifier = {};
//     _fragmentShaderModifier: FragmentShaderModifier = {};
//
//     get isCompiledShader() {
//         return !!_shader;
//     }
//
//     get vertexShaderModifier() {
//         return this._vertexShaderModifier;
//     }
//
//     get fragmentShaderModifier() {
//         return _fragmentShaderModifier;
//     }
//
//     get primitiveType() {
//         return this._primitiveType;
//     }
//
//     get useAlphaTest() {
//         return _alphaTest !== null;
//     }
//
//     constructor({
//         // gpu,
//
//         name = '',
//
//         type = MaterialTypes.Misc,
//
//         vertexShader = '',
//         fragmentShader = '',
//         depthFragmentShader,
//         rawVertexShader,
//         rawFragmentShader,
//         // rawDepthFragmentShader,
//
//         vertexShaderGenerator,
//         fragmentShaderGenerator,
//         depthFragmentShaderGenerator,
//
//         vertexShaderModifier,
//         fragmentShaderModifier,
//
//         primitiveType,
//         depthTest = true,
//         depthWrite = true,
//         skipDepthPrePass = false,
//         depthFuncType = DepthFuncTypes.Lequal,
//         alphaTest = null,
//         faceSide = FaceSide.Front,
//         receiveShadow = false,
//         blendType = BlendTypes.Opaque,
//         renderQueue,
//
//         useNormalMap = null,
//
//         // skinning
//         isSkinning = null,
//         gpuSkinning = null,
//         jointNum = null,
//
//         // instancing
//         isInstancing = false,
//         useInstanceLookDirection = false,
//
//         // vertex color
//         useVertexColor = false,
//
//         // env map
//         useEnvMap = false,
//
//         queue,
//         uniforms = [],
//         uniformBlockNames = [],
//         depthUniforms = [], // uniforms = {},
//
//         showLog = false, // depthUniforms = {},
//     }: MaterialArgs) {
//         this.name = name || '';
//         this.type = type;
//
//         // 外側から任意のタイミングでcompileした方が都合が良さそう
//         // _shader = new Shader({gpu, vertexShader, fragmentShader});
//
//         // if (vertexShader) {
//         _vertexShader = vertexShader || '';
//         // }
//         // if (fragmentShader) {
//         _fragmentShader = fragmentShader || '';
//
//         // }
//         if (depthFragmentShader) {
//             _depthFragmentShader = depthFragmentShader;
//         }
//
//         if (rawVertexShader) {
//             _rawVertexShader = rawVertexShader;
//         }
//         if (rawFragmentShader) {
//             _rawFragmentShader = rawFragmentShader;
//         }
//
//         if (vertexShaderGenerator) {
//             _vertexShaderGenerator = vertexShaderGenerator;
//         }
//         if (fragmentShaderGenerator) {
//             _fragmentShaderGenerator = fragmentShaderGenerator;
//         }
//         if (depthFragmentShaderGenerator) {
//             _depthFragmentShaderGenerator = depthFragmentShaderGenerator;
//         }
//
//         if (vertexShaderModifier) {
//             this._vertexShaderModifier = vertexShaderModifier;
//         }
//         if (fragmentShaderModifier) {
//             _fragmentShaderModifier = fragmentShaderModifier;
//         }
//
//         this._primitiveType = primitiveType || PrimitiveTypes.Triangles;
//         _blendType = blendType || BlendTypes.Opaque;
//
//         // _depthTest = depthTest ? !!depthTest : true;
//         _depthTest = !!depthTest;
//         _depthWrite = !!depthWrite;
//         _depthFuncType = depthFuncType;
//         this.skipDepthPrePass = !!skipDepthPrePass;
//
//         _alphaTest = typeof alphaTest === 'number' ? alphaTest : null;
//
//         this.faceSide = faceSide || FaceSide.Front;
//         _receiveShadow = !!receiveShadow;
//
//         if (renderQueue) {
//             _renderQueue = renderQueue;
//         } else {
//             switch (_blendType) {
//                 case BlendTypes.Opaque:
//                     _renderQueue = RenderQueues[RenderQueueType.Opaque];
//                     break;
//                 case BlendTypes.Transparent:
//                 case BlendTypes.Additive:
//                     _renderQueue = RenderQueues[RenderQueueType.Transparent];
//                     break;
//             }
//         }
//
//         // console.log(renderQueue, _renderQueue, _blendType);
//
//         if (!_renderQueue) {
//             console.error(`[Material.constructor] invalid render queue: ${renderQueue}`);
//         }
//
//         // skinning
//         _isSkinning = !!isSkinning;
//         _gpuSkinning = !!gpuSkinning;
//         _jointNum = typeof jointNum == 'number' ? jointNum : null;
//
//         _isInstancing = !!isInstancing;
//         _useInstanceLookDirection = !!useInstanceLookDirection;
//         _useVertexColor = !!useVertexColor;
//
//         // normal map
//         _useNormalMap = !!useNormalMap;
//
//         // env map
//         _useEnvMap = !!useEnvMap;
//
//         // TODO:
//         // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
//         // - skinning回りもここで入れたい？
//         const commonUniforms: UniformsData = [
//             {
//                 name: UniformNames.InverseWorldMatrix,
//                 type: UniformTypes.Matrix4,
//                 value: Matrix4.identity,
//             },
//
//             // TODO: commonを呼んでさえいればいらないはず
//             {
//                 name: UniformNames.Time,
//                 type: UniformTypes.Float,
//                 value: 0,
//             },
//             ...(_alphaTest
//                 ? [
//                       {
//                           name: 'uAlphaTestThreshold',
//                           type: UniformTypes.Float,
//                           value: _alphaTest,
//                       },
//                   ]
//                 : []),
//         ];
//
//         this.queue = queue || null;
//
//         this.uniforms = new Uniforms(commonUniforms, uniforms);
//
//         _depthUniforms = new Uniforms(commonUniforms, depthUniforms);
//
//         this.uniformBlockNames = uniformBlockNames;
//
//         _showLog = showLog;
//     }
//
//     // createDepthMaterial() {
//     // }
//
//     /**
//      *
//      * @param gpu
//      * @param attributeDescriptors
//      */
//     start({ gpu, attributeDescriptors }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }): void {
//         // for debug
//         // console.log("[Material.start] attributeDescriptors", attributeDescriptors)
//
//         if (!_depthFragmentShader && _depthFragmentShaderGenerator) {
//             _depthFragmentShader = _depthFragmentShaderGenerator();
//         }
//
//         const shaderDefineOptions: ShaderDefines = {
//             receiveShadow: !!_receiveShadow,
//             isSkinning: !!_isSkinning,
//             gpuSkinning: !!_gpuSkinning,
//             useNormalMap: !!_useNormalMap,
//             useEnvMap: !!_useEnvMap,
//             useReceiveShadow: !!_receiveShadow,
//             useVertexColor: !!_useVertexColor,
//             isInstancing: !!_isInstancing,
//             useAlphaTest: !!_alphaTest,
//             useInstanceLookDirection: !!_useInstanceLookDirection,
//         };
//
//         if (!_rawVertexShader) {
//             if (!_vertexShader && _vertexShaderGenerator) {
//                 _vertexShader = _vertexShaderGenerator({
//                     attributeDescriptors,
//                     isSkinning: !!_isSkinning,
//                     jointNum: _jointNum,
//                     gpuSkinning: _gpuSkinning,
//                     isInstancing: _isInstancing,
//                     useInstanceLookDirection: _useInstanceLookDirection,
//                 });
//             }
//             const rawVertexShader = buildVertexShader(
//                 _vertexShader,
//                 attributeDescriptors,
//                 shaderDefineOptions,
//                 _vertexShaderModifier
//             );
//             _rawVertexShader = rawVertexShader;
//         }
//
//         if (!_rawFragmentShader) {
//             if (!_fragmentShader && _fragmentShaderGenerator) {
//                 _fragmentShader = _fragmentShaderGenerator({
//                     attributeDescriptors,
//                 });
//             }
//             const rawFragmentShader = buildFragmentShader(
//                 _fragmentShader,
//                 shaderDefineOptions,
//                 _fragmentShaderModifier
//             );
//             _rawFragmentShader = rawFragmentShader;
//         }
//
//         // for debug
//         if (_showLog) {
//             console.log('-------------------------------');
//             // console.log(this.name);
//             console.log(_vertexShader, shaderDefineOptions, _vertexShaderModifier, _rawVertexShader);
//             // console.log(_fragmentShader, shaderDefineOptions, _fragmentShaderModifier, _rawFragmentShader);
//         }
//
//         _shader = new Shader({
//             gpu,
//             // vertexShader: _vertexShader,
//             vertexShader: _rawVertexShader,
//             // fragmentShader: _fragmentShader
//             fragmentShader: _rawFragmentShader,
//         });
//     }
//
//     /**
//      * マテリアルごとにアップデートしたいuniformがあるとき
//      */
//     updateUniforms() {}
// }

// export function createMaterial({
//                                    // gpu,
//
//                                    name = '',
//
//                                    type = MaterialTypes.Misc,
//
//                                    vertexShader = '',
//                                    fragmentShader = '',
//                                    depthFragmentShader,
//                                    rawVertexShader,
//                                    rawFragmentShader,
//                                    // rawDepthFragmentShader,
//
//                                    vertexShaderGenerator,
//                                    fragmentShaderGenerator,
//                                    depthFragmentShaderGenerator,
//
//                                    vertexShaderModifier,
//                                    fragmentShaderModifier,
//
//                                    primitiveType,
//                                    depthTest = true,
//                                    depthWrite = true,
//                                    skipDepthPrePass = false,
//                                    depthFuncType = DepthFuncTypes.Lequal,
//                                    alphaTest = null,
//                                    faceSide = FaceSide.Front,
//                                    receiveShadow = false,
//                                    blendType = BlendTypes.Opaque,
//                                    renderQueue,
//
//                                    useNormalMap = null,
//
//                                    // skinning
//                                    isSkinning = null,
//                                    gpuSkinning = null,
//                                    jointNum = null,
//
//                                    // instancing
//                                    isInstancing = false,
//                                    useInstanceLookDirection = false,
//
//                                    // vertex color
//                                    useVertexColor = false,
//
//                                    // env map
//                                    useEnvMap = false,
//
//                                    queue,
//                                    uniforms = [],
//                                    uniformBlockNames = [],
//                                    depthUniforms = [], // uniforms = {},
//
//                                    showLog = false, // depthUniforms = {},
//                                }: MaterialArgs): Material {
//     let _name: string = name;
//
//     let _canRender: boolean = true;
//
//     let _type: MaterialTypes = type || MaterialTypes.Misc;
//
//     // 外側から任意のタイミングでcompileした方が都合が良さそう
//     let _shader: Shader | null = null;
//
//     let _primitiveType: PrimitiveType = primitiveType || PrimitiveTypes.Triangles;
//     let _blendType: BlendType = blendType || BlendTypes.Opaque;
//
//     // let _renderQueue: RenderQueue | null = renderQueue || null;
//     let _renderQueue: RenderQueue = renderQueue || RenderQueues[RenderQueueType.Opaque]; // TODO: none type が欲しい？
//
//     if (_renderQueue) {
//         switch (_blendType) {
//             case BlendTypes.Opaque:
//                 _renderQueue = RenderQueues[RenderQueueType.Opaque];
//                 break;
//             case BlendTypes.Transparent:
//             case BlendTypes.Additive:
//                 _renderQueue = RenderQueues[RenderQueueType.Transparent];
//                 break;
//         }
//     }
//
//     let _uniformBlockNames: string[] = uniformBlockNames;
//     // isAddedUniformBlock: boolean = false;
//     let _depthTest: boolean | null = !!depthTest;
//     // let _depthWrite: boolean | null = !!depthWrite;
//     let _depthWrite: boolean = !!depthWrite;
//     let _depthFuncType: DepthFuncType = depthFuncType;
//     let _skipDepthPrePass: boolean | null = !!skipDepthPrePass;
//     let _alphaTest: number | null = typeof alphaTest === 'number' ? alphaTest : null;
//     // culling;
//     let _faceSide: FaceSide = faceSide || FaceSide.Front;
//     let _receiveShadow: boolean = !!receiveShadow;
//     let _queue: RenderQueue | null = queue || null;
//
//     let _useNormalMap: boolean | null = !!useNormalMap;
//
//     let _useEnvMap: boolean | null = !!useEnvMap;
//
//     // skinning
//     let _isSkinning: boolean | null = !!isSkinning;
//     let _gpuSkinning: boolean | null = !!gpuSkinning;
//     let _jointNum: number | null = typeof jointNum == 'number' ? jointNum : null;
//
//     // instancing
//     let _isInstancing: boolean = !!isInstancing;
//     let _useInstanceLookDirection: boolean = !!useInstanceLookDirection;
//
//     // vertex color
//     let _useVertexColor: boolean = !!useVertexColor;
//
//     let _vertexShader: string = vertexShader || '';
//     let _fragmentShader: string = fragmentShader || '';
//     let _depthFragmentShader: string | null = depthFragmentShader || null;
//
//     let _rawVertexShader: string | null = rawVertexShader || null;
//     let _rawFragmentShader: string | null = rawFragmentShader || null;
//
//     // rawDepthFragmentShader: string | null = null;
//
//     let _showLog: boolean = !!showLog;
//
//     let _boundUniformBufferObjects: boolean = false;
//
//     const _vertexShaderGenerator: VertexShaderGenerator | null = vertexShaderGenerator || null;
//     const _fragmentShaderGenerator: FragmentShaderGenerator | null = fragmentShaderGenerator || null;
//     const _depthFragmentShaderGenerator: DepthFragmentShaderGenerator | null = depthFragmentShaderGenerator || null;
//     const _vertexShaderModifier: VertexShaderModifier = vertexShaderModifier || {};
//     const _fragmentShaderModifier: FragmentShaderModifier = fragmentShaderModifier || {};
//
//     if (!_renderQueue) {
//         console.error(`[Material.constructor] invalid render queue: ${renderQueue}`);
//     }
//
//     // TODO:
//     // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
//     // - skinning回りもここで入れたい？
//     const commonUniforms: UniformsData = [
//         {
//             name: UniformNames.InverseWorldMatrix,
//             type: UniformTypes.Matrix4,
//             value: Matrix4.identity,
//         },
//
//         // TODO: commonを呼んでさえいればいらないはず
//         {
//             name: UniformNames.Time,
//             type: UniformTypes.Float,
//             value: 0,
//         },
//         ...(_alphaTest
//             ? [
//                 {
//                     name: 'uAlphaTestThreshold',
//                     type: UniformTypes.Float,
//                     value: _alphaTest,
//                 },
//             ]
//             : []),
//     ];
//
//     let _uniforms: Uniforms = createUniforms(commonUniforms, uniforms);
//     let _depthUniforms: Uniforms = createUniforms(commonUniforms, depthUniforms);
//
//     const start = ({ gpu, attributeDescriptors }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }) => {
//         // for debug
//         // console.log(`[material.start] name: ${_name}`);
//
//         if (!_depthFragmentShader && _depthFragmentShaderGenerator) {
//             _depthFragmentShader = _depthFragmentShaderGenerator();
//         }
//
//         const shaderDefineOptions: ShaderDefines = {
//             receiveShadow: !!_receiveShadow,
//             isSkinning: !!_isSkinning,
//             gpuSkinning: !!_gpuSkinning,
//             useNormalMap: !!_useNormalMap,
//             useEnvMap: !!_useEnvMap,
//             useReceiveShadow: !!_receiveShadow,
//             useVertexColor: !!_useVertexColor,
//             isInstancing: !!_isInstancing,
//             useAlphaTest: !!_alphaTest,
//             useInstanceLookDirection: !!_useInstanceLookDirection,
//         };
//
//         if (!_rawVertexShader) {
//             if (!_vertexShader && _vertexShaderGenerator) {
//                 _vertexShader = _vertexShaderGenerator({
//                     attributeDescriptors,
//                     isSkinning: !!_isSkinning,
//                     jointNum: _jointNum,
//                     gpuSkinning: _gpuSkinning,
//                     isInstancing: _isInstancing,
//                     useInstanceLookDirection: _useInstanceLookDirection,
//                 });
//             }
//             const rawVertexShader = buildVertexShader(
//                 _vertexShader,
//                 attributeDescriptors,
//                 shaderDefineOptions,
//                 _vertexShaderModifier
//             );
//             _rawVertexShader = rawVertexShader;
//         }
//
//         if (!_rawFragmentShader) {
//             if (!_fragmentShader && _fragmentShaderGenerator) {
//                 _fragmentShader = _fragmentShaderGenerator({
//                     attributeDescriptors,
//                 });
//             }
//             const rawFragmentShader = buildFragmentShader(
//                 _fragmentShader,
//                 shaderDefineOptions,
//                 _fragmentShaderModifier
//             );
//             _rawFragmentShader = rawFragmentShader;
//         }
//
//         // for debug
//         if (_showLog) {
//             console.log('-------------------------------');
//             // console.log(this.name);
//             console.log(_vertexShader, shaderDefineOptions, _vertexShaderModifier, _rawVertexShader);
//             // console.log(_fragmentShader, shaderDefineOptions, _fragmentShaderModifier, _rawFragmentShader);
//         }
//
//         _shader = new Shader({
//             gpu,
//             // vertexShader: _vertexShader,
//             vertexShader: _rawVertexShader,
//             // fragmentShader: _fragmentShader
//             fragmentShader: _rawFragmentShader,
//         });
//
//         // for debug
//         // console.log(`[material.start] shader`, _shader);
//     };
//
//     /**
//      * マテリアルごとにアップデートしたいuniformがあるとき
//      */
//     const updateUniforms = () => {};
//
//     return {
//         // // getter, setter
//         getName: () => _name,
//         setName: (name: string) => (_name = name),
//         getCanRender: () => _canRender,
//         setCanRender: (canRender: boolean) => (_canRender = canRender),
//         getType: () => _type,
//         setType: (type: MaterialTypes) => (_type = type),
//         getShader: () => _shader,
//         setShader: (shader: Shader) => (_shader = shader),
//         getPrimitiveType: () => _primitiveType,
//         setPrimitiveType: (primitiveType: PrimitiveType) => (_primitiveType = primitiveType),
//         getBlendType: () => _blendType,
//         setBlendType: (blendType: BlendType) => (_blendType = blendType),
//         getRenderQueue: () => _renderQueue,
//         setRenderQueue: (renderQueue: RenderQueue) => (_renderQueue = renderQueue),
//         setUniformBlockNames: (uniformBlockNames: string[]) => (_uniformBlockNames = uniformBlockNames),
//         getDepthTest: () => _depthTest,
//         setDepthTest: (depthTest: boolean | null) => (_depthTest = depthTest),
//         getDepthWrite: () => _depthWrite,
//         setDepthWrite: (depthWrite: boolean) => (_depthWrite = depthWrite),
//         getDepthFuncType: () => _depthFuncType,
//         setDepthFuncType: (depthFuncType: DepthFuncType) => (_depthFuncType = depthFuncType),
//         getSkipDepthPrePass: () => _skipDepthPrePass,
//         setSkipDepthPrePass: (skipDepth: boolean | null) => (_skipDepthPrePass = skipDepth),
//         getAlphaTest: () => _alphaTest,
//         setAlphaTest: (alphaTest: number | null) => (_alphaTest = alphaTest),
//         getFaceSide: () => _faceSide,
//         setFaceSide: (faceSide: FaceSide) => (_faceSide = faceSide),
//         getReceiveShadow: () => _receiveShadow,
//         setReceiveShadow: (receiveShadow: boolean) => (_receiveShadow = receiveShadow),
//         getQueue: () => _queue,
//         setQueue: (queue: RenderQueue) => (_queue = queue),
//         getUseNormalMap: () => _useNormalMap,
//         setUseNormalMap: (useNormalMap: boolean | null) => (_useNormalMap = useNormalMap),
//         getUseEnvMap: () => _useEnvMap,
//         setUseEnvMap: (useEnvMap: boolean | null) => (_useEnvMap = useEnvMap),
//         getIsSkinning: () => _isSkinning,
//         setIsSkinning: (isSkinning: boolean | null) => (_isSkinning = isSkinning),
//         getGpuSkinning: () => _gpuSkinning,
//         setGpuSkinning: (gpuSkinning: boolean | null) => (_gpuSkinning = gpuSkinning),
//         getJointNum: () => _jointNum,
//         setJointNum: (jointNum: number | null) => (_jointNum = jointNum),
//         getIsInstancing: () => _isInstancing,
//         setIsInstancing: (isInstancing: boolean) => (_isInstancing = isInstancing),
//         getUseInstanceLookDirection: () => _useInstanceLookDirection,
//         setUseInstanceLookDirection: (useInstanceLookDirection: boolean) =>
//             (_useInstanceLookDirection = useInstanceLookDirection),
//         getUseVertexColor: () => _useVertexColor,
//         setUseVertexColor: (useVertexColor: boolean) => (_useVertexColor = useVertexColor),
//         getVertexShader: () => _vertexShader,
//         getFragmentShader: () => _fragmentShader,
//         getDepthFragmentShader: () => _depthFragmentShader,
//         getRawVertexShader: () => _rawVertexShader,
//         getRawFragmentShader: () => _rawFragmentShader,
//         getShowLog: () => _showLog,
//         setShowLog: (showLog: boolean) => (_showLog = showLog),
//         getBoundUniformBufferObjects: () => _boundUniformBufferObjects,
//         setBoundUniformBufferObjects: (boundUniformBufferObjects: boolean) =>
//             (_boundUniformBufferObjects = boundUniformBufferObjects),
//         getUniforms: () => _uniforms,
//         setUniforms: (uniforms: Uniforms) => (_uniforms = uniforms),
//         getDepthUniforms: () => _depthUniforms,
//         setDepthUniforms: (depthUniforms: Uniforms) => (_depthUniforms = depthUniforms),
//         getUniformBlockNames: () => _uniformBlockNames,
//         getVertexShaderModifier: () => vertexShaderModifier,
//         getFragmentShaderModifier: () => fragmentShaderModifier,
//         // methods
//         isCompiledShader: () => !!_shader,
//         useAlphaTest: () => alphaTest !== null,
//         start,
//         updateUniforms,
//     };
// }

// -------------------------------------------------------

export function setMaterialUniformValue(material: Material, name: string, value: UniformValue) {
    setUniformValue(material.getUniforms(), name, value);
}

export function addMaterialUniformValue(material: Material, name: string, type: UniformTypes, value: UniformValue) {
    addUniformValue(material.getUniforms(), name, type, value);
}

export type Material = ReturnType<typeof createMaterial>;

// export type Material = {
//     name : string,
//     canRender: boolean,
//     type: MaterialTypes,
//     shader: Shader,
//     primitiveType: PrimitiveType,
//     blendType: BlendType,
//     renderQueue: RenderQueue,
//     uniformBlockNames : string[],
//     depthTest: boolean,
//     depthWrite: boolean,
//     depthFuncType: DepthFuncType,
//     skipDepthPrePass: boolean,
//     alphaTest: boolean,
//     faceSide: FaceSide,
//     receiveShadow: boolean,
//     queue: RenderQueue | null,
//     useNormalMap: boolean,
//     useEnvMap: boolean,
//     isSkinning : boolean,
//     gpuSkinning: boolean,
//     jointNum: number,
//     isInstancing : boolean,
//     useInstanceLookDirection: boolean,
//     useVertexColor: boolean,
//     vertexShader: string,
//     fragmentShader: string,
//     depthFragmentShader: string,
//     rawVertexShader: string,
//     rawFragmentShader: string,
//     showLog: boolean,
//     boundUniformBufferObjects: boolean,
//     vertexShaderGenerator: VertexShaderGenerator,
//     fragmentShaderGenerator: FragmentShaderGenerator,
//     depthFragmentShaderGenerator: FragmentShaderGenerator,
//     vertexShaderModifier: VertexShaderModifier,
//     fragmentShaderModifier: FragmentShaderModifier,
//     uniforms: Uniforms,
//     depthUniforms: Uniforms
// }

export function createMaterial(args: MaterialArgs) {
    const {
        // gpu,

        name = '',
            // type = MaterialTypes.Misc,

            vertexShader = '',
            fragmentShader = '',
            depthFragmentShader,
            rawVertexShader,
            rawFragmentShader,
            // rawDepthFragmentShader,

            vertexShaderGenerator,
            fragmentShaderGenerator,
            depthFragmentShaderGenerator,

            vertexShaderModifier,
            fragmentShaderModifier,

            // primitiveType,
            // depthTest = true,
            // depthWrite = true,
            skipDepthPrePass = false,
            depthFuncType = DepthFuncTypes.Lequal,
            alphaTest = null,
            faceSide = FaceSide.Front,
            receiveShadow = false,
            // blendType = BlendTypes.Opaque,
            // renderQueue,

            useNormalMap = null,

            // skinning
            isSkinning = null,
            gpuSkinning = null,
            jointNum = null,

            // instancing
            isInstancing = false,
            useInstanceLookDirection = false,

            // vertex color
            useVertexColor = false,

            // env map
            useEnvMap = false,

            queue,
            uniforms = [],
            // uniformBlockNames = [],
            depthUniforms = [], // uniforms = {},

            showLog = false, // depthUniforms = {},
    } = args;
    
    let {
        depthTest = true,
        depthWrite = true,
    } = args;
    
    // let _name: string = name;

    const canRender: boolean = true;

    const type: MaterialTypes = args.type || MaterialTypes.Misc;

    // 外側から任意のタイミングでcompileした方が都合が良さそう
    let _shader: Shader | null = null;

    const primitiveType: PrimitiveType = args.primitiveType || PrimitiveTypes.Triangles;
    const blendType: BlendType = args.blendType || BlendTypes.Opaque;

    // let _renderQueue: RenderQueue | null = renderQueue || null;
    let renderQueue = args.renderQueue || RenderQueues[RenderQueueType.Opaque]; // TODO: none type が欲しい？

    if (renderQueue) {
        switch (blendType) {
            case BlendTypes.Opaque:
                renderQueue = RenderQueues[RenderQueueType.Opaque];
                break;
            case BlendTypes.Transparent:
            case BlendTypes.Additive:
                renderQueue = RenderQueues[RenderQueueType.Transparent];
                break;
        }
    }

    const uniformBlockNames: string[] = args.uniformBlockNames || [];
    
    // isAddedUniformBlock: boolean = false;
    depthTest = !!depthTest;
    // let _depthWrite: boolean | null = !!depthWrite;
    depthWrite = !!depthWrite;
    
    // let _depthFuncType: DepthFuncType = depthFuncType;
    let _skipDepthPrePass: boolean | null = !!skipDepthPrePass;
    let _alphaTest: number | null = typeof alphaTest === 'number' ? alphaTest : null;
    // culling;
    // let _faceSide: FaceSide = faceSide || FaceSide.Front;
    let _receiveShadow: boolean = !!receiveShadow;
    let _queue: RenderQueue | null = queue || null;

    let _useNormalMap: boolean | null = !!useNormalMap;

    let _useEnvMap: boolean | null = !!useEnvMap;

    // skinning
    let _isSkinning: boolean | null = !!isSkinning;
    let _gpuSkinning: boolean | null = !!gpuSkinning;
    let _jointNum: number | null = typeof jointNum == 'number' ? jointNum : null;

    // instancing
    let _isInstancing: boolean = !!isInstancing;
    let _useInstanceLookDirection: boolean = !!useInstanceLookDirection;

    // vertex color
    let _useVertexColor: boolean = !!useVertexColor;

    let _vertexShader: string = vertexShader || '';
    let _fragmentShader: string = fragmentShader || '';
    let _depthFragmentShader: string | null = depthFragmentShader || null;

    let _rawVertexShader: string | null = rawVertexShader || null;
    let _rawFragmentShader: string | null = rawFragmentShader || null;

    // rawDepthFragmentShader: string | null = null;

    let _showLog: boolean = !!showLog;

    let _boundUniformBufferObjects: boolean = false;

    const _vertexShaderGenerator: VertexShaderGenerator | null = vertexShaderGenerator || null;
    const _fragmentShaderGenerator: FragmentShaderGenerator | null = fragmentShaderGenerator || null;
    const _depthFragmentShaderGenerator: DepthFragmentShaderGenerator | null = depthFragmentShaderGenerator || null;
    const _vertexShaderModifier: VertexShaderModifier = vertexShaderModifier || {};
    const _fragmentShaderModifier: FragmentShaderModifier = fragmentShaderModifier || {};

    if (!renderQueue) {
        console.error(`[Material.constructor] invalid render queue: ${renderQueue as unknown as string}`);
    }

    // TODO:
    // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
    // - skinning回りもここで入れたい？
    const commonUniforms: UniformsData = [
        {
            name: UniformNames.InverseWorldMatrix,
            type: UniformTypes.Matrix4,
            value: Matrix4.identity,
        },

        // TODO: commonを呼んでさえいればいらないはず
        {
            name: UniformNames.Time,
            type: UniformTypes.Float,
            value: 0,
        },
        ...(_alphaTest
            ? [
                  {
                      name: 'uAlphaTestThreshold',
                      type: UniformTypes.Float,
                      value: _alphaTest,
                  },
              ]
            : []),
    ];

    let _uniforms: Uniforms = createUniforms(commonUniforms, uniforms);
    let _depthUniforms: Uniforms = createUniforms(commonUniforms, depthUniforms);

    const start = ({ gpu, attributeDescriptors }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }) => {
        // for debug
        // console.log(`[material.start] name: ${_name}`);

        if (!_depthFragmentShader && _depthFragmentShaderGenerator) {
            _depthFragmentShader = _depthFragmentShaderGenerator();
        }

        const shaderDefineOptions: ShaderDefines = {
            receiveShadow: !!_receiveShadow,
            isSkinning: !!_isSkinning,
            gpuSkinning: !!_gpuSkinning,
            useNormalMap: !!_useNormalMap,
            useEnvMap: !!_useEnvMap,
            useReceiveShadow: !!_receiveShadow,
            useVertexColor: !!_useVertexColor,
            isInstancing: !!_isInstancing,
            useAlphaTest: !!_alphaTest,
            useInstanceLookDirection: !!_useInstanceLookDirection,
        };

        if (!_rawVertexShader) {
            if (!_vertexShader && _vertexShaderGenerator) {
                _vertexShader = _vertexShaderGenerator({
                    attributeDescriptors,
                    isSkinning: !!_isSkinning,
                    jointNum: _jointNum,
                    gpuSkinning: _gpuSkinning,
                    isInstancing: _isInstancing,
                    useInstanceLookDirection: _useInstanceLookDirection,
                });
            }
            const rawVertexShader = buildVertexShader(
                _vertexShader,
                attributeDescriptors,
                shaderDefineOptions,
                _vertexShaderModifier
            );
            _rawVertexShader = rawVertexShader;
        }

        if (!_rawFragmentShader) {
            if (!_fragmentShader && _fragmentShaderGenerator) {
                _fragmentShader = _fragmentShaderGenerator({
                    attributeDescriptors,
                });
            }
            const rawFragmentShader = buildFragmentShader(
                _fragmentShader,
                shaderDefineOptions,
                _fragmentShaderModifier
            );
            _rawFragmentShader = rawFragmentShader;
        }

        // for debug
        if (_showLog) {
            console.log('-------------------------------');
            // console.log(this.name);
            console.log(_vertexShader, shaderDefineOptions, _vertexShaderModifier, _rawVertexShader);
            // console.log(_fragmentShader, shaderDefineOptions, _fragmentShaderModifier, _rawFragmentShader);
        }

        _shader = new Shader({
            gpu,
            // vertexShader: _vertexShader,
            vertexShader: _rawVertexShader,
            // fragmentShader: _fragmentShader
            fragmentShader: _rawFragmentShader,
        });

        // for debug
        // console.log(`[material.start] shader`, _shader);
    };

    /**
     * マテリアルごとにアップデートしたいuniformがあるとき
     */
    const updateUniforms = () => {};

    return {
        name,
        canRender,
        type, 
        primitiveType,
        blendType,
        renderQueue,
        uniformBlockNames,
        depthTest,
        depthWrite,
        depthFuncType,
        faceSide,
        // ----------------------------------------
        // // // getter, setter
        // getName: () => _name,
        // setName: (name: string) => (_name = name),
        //getCanRender: () => _canRender,
        //setCanRender: (canRender: boolean) => (_canRender = canRender),
        // getType: () => _type,
        // setType: (type: MaterialTypes) => (_type = type),
        getShader: () => _shader,
        setShader: (shader: Shader) => (_shader = shader),
        // getPrimitiveType: () => _primitiveType,
        // setPrimitiveType: (primitiveType: PrimitiveType) => (_primitiveType = primitiveType),
        // getBlendType: () => _blendType,
        // setBlendType: (blendType: BlendType) => (_blendType = blendType),
        // getRenderQueue: () => _renderQueue,
        // setRenderQueue: (renderQueue: RenderQueue) => (_renderQueue = renderQueue),
        // setUniformBlockNames: (uniformBlockNames: string[]) => (_uniformBlockNames = uniformBlockNames),
        // getDepthTest: () => _depthTest,
        // setDepthTest: (depthTest: boolean | null) => (_depthTest = depthTest),
        // getDepthWrite: () => _depthWrite,
        // setDepthWrite: (depthWrite: boolean) => (_depthWrite = depthWrite),
        // getDepthFuncType: () => _depthFuncType,
        // setDepthFuncType: (depthFuncType: DepthFuncType) => (_depthFuncType = depthFuncType),
        getSkipDepthPrePass: () => _skipDepthPrePass,
        setSkipDepthPrePass: (skipDepth: boolean | null) => (_skipDepthPrePass = skipDepth),
        getAlphaTest: () => _alphaTest,
        setAlphaTest: (alphaTest: number | null) => (_alphaTest = alphaTest),
        // getFaceSide: () => _faceSide,
        // setFaceSide: (faceSide: FaceSide) => (_faceSide = faceSide),
        getReceiveShadow: () => _receiveShadow,
        setReceiveShadow: (receiveShadow: boolean) => (_receiveShadow = receiveShadow),
        getQueue: () => _queue,
        setQueue: (queue: RenderQueue) => (_queue = queue),
        getUseNormalMap: () => _useNormalMap,
        setUseNormalMap: (useNormalMap: boolean | null) => (_useNormalMap = useNormalMap),
        getUseEnvMap: () => _useEnvMap,
        setUseEnvMap: (useEnvMap: boolean | null) => (_useEnvMap = useEnvMap),
        getIsSkinning: () => _isSkinning,
        setIsSkinning: (isSkinning: boolean | null) => (_isSkinning = isSkinning),
        getGpuSkinning: () => _gpuSkinning,
        setGpuSkinning: (gpuSkinning: boolean | null) => (_gpuSkinning = gpuSkinning),
        getJointNum: () => _jointNum,
        setJointNum: (jointNum: number | null) => (_jointNum = jointNum),
        getIsInstancing: () => _isInstancing,
        setIsInstancing: (isInstancing: boolean) => (_isInstancing = isInstancing),
        getUseInstanceLookDirection: () => _useInstanceLookDirection,
        setUseInstanceLookDirection: (useInstanceLookDirection: boolean) =>
            (_useInstanceLookDirection = useInstanceLookDirection),
        getUseVertexColor: () => _useVertexColor,
        setUseVertexColor: (useVertexColor: boolean) => (_useVertexColor = useVertexColor),
        getVertexShader: () => _vertexShader,
        getFragmentShader: () => _fragmentShader,
        getDepthFragmentShader: () => _depthFragmentShader,
        getRawVertexShader: () => _rawVertexShader,
        getRawFragmentShader: () => _rawFragmentShader,
        getShowLog: () => _showLog,
        setShowLog: (showLog: boolean) => (_showLog = showLog),
        getBoundUniformBufferObjects: () => _boundUniformBufferObjects,
        setBoundUniformBufferObjects: (boundUniformBufferObjects: boolean) =>
            (_boundUniformBufferObjects = boundUniformBufferObjects),
        getUniforms: () => _uniforms,
        setUniforms: (uniforms: Uniforms) => (_uniforms = uniforms),
        getDepthUniforms: () => _depthUniforms,
        setDepthUniforms: (depthUniforms: Uniforms) => (_depthUniforms = depthUniforms),
        // getUniformBlockNames: () => _uniformBlockNames,
        getVertexShaderModifier: () => vertexShaderModifier,
        getFragmentShaderModifier: () => fragmentShaderModifier,
        // methods
        isCompiledShader: () => !!_shader,
        useAlphaTest: () => alphaTest !== null,
        start,
        updateUniforms,
    };
}
