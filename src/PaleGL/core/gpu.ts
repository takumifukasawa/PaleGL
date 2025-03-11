// import {
//     AttributeUsageType,
//     BlendType,
//     BlendTypes,
//     DepthFuncType,
//     DepthFuncTypes,
//     FaceSide,
//     GL_BACK,
//     GL_BLEND,
//     GL_CCW,
//     GL_COLOR_BUFFER_BIT,
//     GL_CULL_FACE,
//     GL_DEPTH_BUFFER_BIT,
//     GL_DEPTH_TEST,
//     GL_DYNAMIC_COPY,
//     GL_DYNAMIC_DRAW,
//     GL_EQUAL,
//     GL_FRAMEBUFFER,
//     GL_FRONT,
//     GL_LEQUAL, GL_LINE_LOOP,
//     GL_LINE_STRIP,
//     GL_LINES,
//     GL_ONE,
//     GL_ONE_MINUS_SRC_ALPHA,
//     GL_POINTS,
//     GL_RASTERIZER_DISCARD,
//     GL_SRC_ALPHA,
//     GL_STATIC_DRAW,
//     GL_TEXTURE0,
//     GL_TEXTURE_2D,
//     GL_TEXTURE_CUBE_MAP,
//     GL_TRANSFORM_FEEDBACK,
//     GL_TRIANGLES,
//     GL_UNIFORM_BLOCK_DATA_SIZE,
//     GL_UNIFORM_OFFSET,
//     GL_UNSIGNED_SHORT,
//     PrimitiveType,
//     PrimitiveTypes,
//     TextureWrapTypes,
//     // UniformNames,
//     UniformTypes,
// } from '@/PaleGL/constants';
// import {createTexture, Texture} from '@/PaleGL/core/texture.ts';
// import { Shader } from '@/PaleGL/core/shader.ts';
// import { hasIndicesVertexArrayObject, VertexArrayObject } from '@/PaleGL/core/vertexArrayObject.ts';
// import { Framebuffer, hasFramebufferMultipleDrawBuffers } from '@/PaleGL/core/framebuffer.ts';
// import { Vector2 } from '@/PaleGL/math/Vector2';
// import { Vector3 } from '@/PaleGL/math/Vector3';
// import { Matrix4 } from '@/PaleGL/math/Matrix4';
// import { Color } from '@/PaleGL/math/Color';
// import { createCubeMap, CubeMap } from '@/PaleGL/core/cubeMap.ts';
// import { Vector4 } from '@/PaleGL/math/Vector4.ts';
// import { TransformFeedback } from '@/PaleGL/core/transformFeedback.ts';
// import {
//     UniformBufferObjectBlockData,
//     Uniforms,
//     UniformStructArrayValue,
//     UniformStructValue,
//     UniformValue,
// } from '@/PaleGL/core/uniforms.ts';
// import { createUniformBufferObject, UniformBufferObject } from '@/PaleGL/core/uniformBufferObject.ts';
//
// export const create1x1 = (color: string = 'black'): HTMLCanvasElement => {
//     const canvas = document.createElement('canvas');
//     const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
//     // if (!ctx) {
//     //     console.error('invalid context');
//     // }
//     canvas.width = 1;
//     canvas.height = 1;
//     ctx.fillStyle = color;
//     ctx.fillRect(0, 0, 1, 1);
//     return canvas;
// };
//
// export const getAttributeUsage = (usageType: AttributeUsageType) => {
//     switch (usageType) {
//         case AttributeUsageType.StaticDraw:
//             return GL_STATIC_DRAW;
//         case AttributeUsageType.DynamicDraw:
//             return GL_DYNAMIC_DRAW;
//         case AttributeUsageType.DynamicCopy:
//             return GL_DYNAMIC_COPY;
//         default:
//             console.error('[getAttributeUsage] invalid usage');
//             return -1;
//     }
// };
//
// export class Gpu {
//     gl: WebGL2RenderingContext;
//     _shader: Shader | null = null;
//     _vao: VertexArrayObject | null = null;
//     _uniforms: Uniforms | null = null;
//     dummyTexture: Texture;
//     dummyTextureBlack: Texture;
//     _dummyCubeTexture: CubeMap;
//     _validExtensions: string[] = [];
//     _invalidExtensions: string[] = [];
//     _uboBindingPoint: number = 0;
//
//     /**
//      *
//      * @param gl
//      */
//     constructor(gl: WebGL2RenderingContext) {
//         this.gl = gl;
//         this.dummyTexture = createTexture({
//             gpu: this,
//             img: create1x1('white'),
//             wrapS: TextureWrapTypes.Repeat,
//             wrapT: TextureWrapTypes.Repeat,
//         });
//         this.dummyTextureBlack = createTexture({
//             gpu: this,
//             img: create1x1('black'),
//             wrapS: TextureWrapTypes.Repeat,
//             wrapT: TextureWrapTypes.Repeat,
//         });
//
//         this._dummyCubeTexture = createCubeMap(
//             this,
//             create1x1(),
//             create1x1(),
//             create1x1(),
//             create1x1(),
//             create1x1(),
//             create1x1()
//         );
//     }
//
//     /**
//      *
//      * @param shader
//      */
//     setShader(shader: Shader) {
//         this._shader = shader;
//     }
//
//     /**
//      *
//      * @param vao
//      */
//     setVertexArrayObject(vao: VertexArrayObject) {
//         this._vao = vao;
//     }
//
//     /**
//      *
//      * @param uniforms
//      */
//     setUniforms(uniforms: Uniforms) {
//         this._uniforms = uniforms;
//     }
//
//     /**
//      *
//      * @param x
//      * @param y
//      * @param width
//      * @param height
//      */
//     setSize(x: number, y: number, width: number, height: number) {
//         this.gl.viewport(x, y, width, height);
//     }
//
//     /**
//      *
//      * @param framebuffer
//      */
//     setFramebuffer(framebuffer: Framebuffer | null) {
//         const gl = this.gl;
//         if (!framebuffer) {
//             gl.bindFramebuffer(GL_FRAMEBUFFER, null);
//             return;
//         }
//         gl.bindFramebuffer(GL_FRAMEBUFFER, framebuffer.glObject);
//         if (hasFramebufferMultipleDrawBuffers(framebuffer)) {
//             gl.drawBuffers(framebuffer.drawBufferList);
//         }
//
//         // tmp
//         // !!framebuffer
//         //     ? gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject)
//         //     : gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//     }
//
//     /**
//      *
//      */
//     flush() {
//         this.gl.flush();
//     }
//
//     /**
//      *
//      * @param r
//      * @param g
//      * @param b
//      * @param a
//      */
//     clearDepth(r: number, g: number, b: number, a: number) {
//         const gl = this.gl;
//         gl.depthMask(true);
//         gl.colorMask(false, false, false, false);
//         gl.clearColor(r, g, b, a);
//         gl.clear(GL_DEPTH_BUFFER_BIT);
//     }
//
//     /**
//      *
//      * @param r
//      * @param g
//      * @param b
//      * @param a
//      */
//     clearColor(r: number, g: number, b: number, a: number) {
//         const gl = this.gl;
//         gl.depthMask(false);
//         gl.colorMask(true, true, true, true);
//         gl.clearColor(r, g, b, a);
//         gl.clear(GL_COLOR_BUFFER_BIT);
//     }
//
//     /**
//      *
//      * @param r
//      * @param g
//      * @param b
//      * @param a
//      */
//     clear(r: number, g: number, b: number, a: number) {
//         this.clearDepth(r, g, b, a);
//         this.clearColor(r, g, b, a);
//
//         // tmp
//         // const {gl} = this;
//         // gl.depthMask(true);
//         // gl.colorMask(true, true, true, true);
//         // gl.enable(gl.CULL_FACE);
//         // gl.enable(gl.DEPTH_TEST);
//         // gl.clearColor(0, 0, 0, 1);
//         // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//
//         //
//         // TODO: デフォルトに戻した方がよい？
//         //
//     }
//
//     /**
//      *
//      * @param extensionName
//      */
//     checkExtension(extensionName: string): boolean {
//         if (this._validExtensions.includes(extensionName)) {
//             return true;
//         }
//
//         if (this._invalidExtensions.includes(extensionName)) {
//             return false;
//         }
//
//         const ext = this.gl.getExtension(extensionName) != null;
//         if (!ext) {
//             this._invalidExtensions.push(extensionName);
//             return false;
//         }
//         this._validExtensions.push(extensionName);
//         return true;
//     }
//
//     /**
//      *
//      * @param primitiveType
//      * @private
//      */
//     #getGLPrimitive(primitiveType: PrimitiveType) {
//         switch (primitiveType) {
//             case PrimitiveTypes.Points:
//                 return GL_POINTS;
//             case PrimitiveTypes.Lines:
//                 return GL_LINES;
//             case PrimitiveTypes.LineLoop:
//                 return GL_LINE_LOOP;
//             case PrimitiveTypes.LineStrip:
//                 return GL_LINE_STRIP;
//             case PrimitiveTypes.Triangles:
//                 return GL_TRIANGLES;
//             default:
//                 console.error('invalid primitive type');
//                 return -1;
//         }
//     }
//
//     // setTransformFeedback() {
//     // }
//
//     // dummyTextureIndex = 0;
//
//     /**
//      *
//      */
//     setUniformValues() {
//         const gl = this.gl;
//
//         let activeTextureIndex = 0;
//         // let dummyTextureIndex = 0;
//
//         if (!this._shader) {
//             console.error('shader is not set');
//             return;
//         }
//
//         const setUniformValueInternal = (type: UniformTypes, uniformName: string, value: UniformValue) => {
//             // for debug
//             // console.log("setUniformValueInternal", type, uniformName, value);
//
//             const location = gl.getUniformLocation(this._shader!.glObject, uniformName);
//
//             // TODO:
//             // - nullなとき,値がおかしいときはセットしない方がよいけど、あえてエラーを出したいかもしれない
//             switch (type) {
//                 case UniformTypes.Int:
//                     gl.uniform1i(location, value as number);
//                     break;
//                 case UniformTypes.Float:
//                     gl.uniform1f(location, value as number);
//                     break;
//                 case UniformTypes.FloatArray:
//                     gl.uniform1fv(location, value as Float32Array);
//                     break;
//                 case UniformTypes.Vector2:
//                     gl.uniform2fv(location, (value as Vector2).e);
//                     break;
//                 case UniformTypes.Vector2Array:
//                     gl.uniform2fv(location, (value as Vector2[]).map((v) => [...v.e]).flat());
//                     break;
//                 case UniformTypes.Vector3:
//                     gl.uniform3fv(location, (value as Vector3).e);
//                     break;
//                 case UniformTypes.Vector3Array:
//                     gl.uniform3fv(location, (value as Vector3[]).map((v) => [...v.e]).flat());
//                     break;
//                 case UniformTypes.Vector4:
//                     gl.uniform4fv(location, (value as Vector4).e);
//                     break;
//                 case UniformTypes.Vector4Array:
//                     gl.uniform4fv(location, (value as Vector4[]).map((v) => [...v.e]).flat());
//                     break;
//                 case UniformTypes.Matrix4:
//                     // arg[1] ... use transpose.
//                     gl.uniformMatrix4fv(location, false, (value as Matrix4).e);
//                     break;
//                 case UniformTypes.Matrix4Array:
//                     if (value) {
//                         // arg[1] ... use transpose.
//                         gl.uniformMatrix4fv(location, false, (value as Matrix4[]).map((v) => [...v.e]).flat());
//                     }
//                     break;
//                 case UniformTypes.Color:
//                     gl.uniform4fv(location, (value as Color).e);
//                     break;
//                 case UniformTypes.ColorArray:
//                     if (value) {
//                         // arg[1] ... use transpose.
//                         gl.uniform4fv(location, (value as Color[]).map((v) => [...v.e]).flat());
//                     }
//                     break;
//                 case UniformTypes.Texture:
//                     gl.activeTexture(GL_TEXTURE0 + activeTextureIndex);
//                     gl.bindTexture(GL_TEXTURE_2D, value ? (value as Texture).glObject : this.dummyTexture.glObject);
//                     gl.uniform1i(location, activeTextureIndex);
//                     activeTextureIndex++;
//                     break;
//                 case UniformTypes.TextureArray:
//                     // (value as Texture[]).forEach((texture) => {
//                     //     gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
//                     //     gl.bindTexture(gl.TEXTURE_2D, texture ? texture.glObject : this.dummyTexture.glObject);
//                     //     gl.uniform1i(location, activeTextureIndex);
//                     //     activeTextureIndex++;
//                     // });
//
//                     const textureArrayIndices: number[] = [];
//                     (value as Texture[]).forEach((texture) => {
//                         textureArrayIndices.push(activeTextureIndex);
//                         gl.activeTexture(GL_TEXTURE0 + activeTextureIndex);
//                         gl.bindTexture(GL_TEXTURE_2D, texture ? texture.glObject : this.dummyTexture.glObject);
//                         activeTextureIndex++;
//                     });
//                     if (textureArrayIndices.length < 1) {
//                         console.error('[Gpu.setUniformValues] invalid texture array');
//                     }
//                     gl.uniform1iv(location, textureArrayIndices);
//
//                     break;
//                 case UniformTypes.CubeMap:
//                     // TODO: valueのguardなくて大丈夫なはず
//                     gl.activeTexture(GL_TEXTURE0 + activeTextureIndex);
//                     // if (value != null) {
//                     //     gl.bindTexture(gl.TEXTURE_CUBE_MAP, (value as CubeMap).glObject);
//                     // } else {
//                     //     gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.dummyCubeTexture.glObject);
//                     // }
//                     gl.bindTexture(
//                         GL_TEXTURE_CUBE_MAP,
//                         value ? (value as CubeMap).glObject : this._dummyCubeTexture.glObject
//                     );
//                     gl.uniform1i(location, activeTextureIndex);
//                     activeTextureIndex++;
//                     break;
//                 default:
//                     console.error(`invalid uniform - name: ${uniformName}, type: ${type}`);
//             }
//         };
//
//         // uniforms
//         if (this._uniforms) {
//             this._uniforms.data.forEach((uniformData) => {
//                 if (uniformData.type === UniformTypes.Struct) {
//                     const uniformStructValue = uniformData.value as UniformStructValue;
//                     uniformStructValue.forEach((structData) => {
//                         const uniformName = `${uniformData.name}.${structData.name}`;
//                         setUniformValueInternal(structData.type, uniformName, structData.value);
//                     });
//                 } else if (uniformData.type === UniformTypes.StructArray) {
//                     (uniformData.value as UniformStructArrayValue).forEach((uniformStructValue, i) => {
//                         uniformStructValue.forEach((structData) => {
//                             const uniformName = `${uniformData.name}[${i}].${structData.name}`;
//                             // console.log(structData.type, uniformName, structData.value)
//                             setUniformValueInternal(structData.type, uniformName, structData.value);
//                         });
//                     });
//                 } else {
//                     setUniformValueInternal(uniformData.type, uniformData.name, uniformData.value);
//                 }
//             });
//         }
//     }
//
//     updateTransformFeedback({
//         shader,
//         uniforms,
//         transformFeedback,
//         vertexArrayObject,
//         drawCount,
//     }: {
//         shader: Shader;
//         uniforms: Uniforms;
//         transformFeedback: TransformFeedback;
//         vertexArrayObject: VertexArrayObject;
//         drawCount: number;
//     }) {
//         this._uniforms = uniforms;
//         this._shader = shader;
//         this._vao = vertexArrayObject;
//
//         const gl = this.gl;
//
//         gl.bindVertexArray(this._vao.glObject);
//
//         gl.useProgram(this._shader.glObject);
//
//         this.setUniformValues();
//
//         gl.enable(GL_RASTERIZER_DISCARD);
//
//         gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, transformFeedback.glObject);
//         gl.beginTransformFeedback(GL_POINTS);
//         gl.drawArrays(GL_POINTS, 0, drawCount);
//         gl.endTransformFeedback();
//         gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, null);
//
//         gl.disable(GL_RASTERIZER_DISCARD);
//
//         gl.useProgram(null);
//
//         gl.bindVertexArray(null);
//
//         this._shader = null;
//         this._uniforms = null;
//         this._vao = null;
//     }
//
//     /**
//      *
//      * TODO:
//      * - start offset と instanceCount は逆の方が良い
//      * - なんなら object destructuring の方がよさそう
//      *
//      * @param drawCount
//      * @param primitiveType
//      * @param depthTest
//      * @param depthWrite
//      * @param depthFuncType
//      * @param blendType
//      * @param faceSide
//      * @param instanceCount
//      * @param startOffset
//      */
//     draw(
//         drawCount: number,
//         primitiveType: PrimitiveType,
//         depthTest: boolean,
//         depthWrite: boolean,
//         depthFuncType: DepthFuncType,
//         blendType: BlendType,
//         faceSide: FaceSide,
//         instanceCount: number | null,
//         startOffset = 0
//     ) {
//         const glPrimitiveType = this.#getGLPrimitive(primitiveType);
//         const gl = this.gl;
//
//         if (!this._shader) {
//             console.error('shader is not set');
//             return;
//         }
//         if (!this._vao) {
//             console.error('vao is not set');
//             return;
//         }
//
//         // culling
//         switch (faceSide) {
//             case FaceSide.Front:
//                 gl.enable(GL_CULL_FACE);
//                 gl.cullFace(GL_BACK);
//                 gl.frontFace(GL_CCW);
//                 break;
//             case FaceSide.Back:
//                 gl.enable(GL_CULL_FACE);
//                 gl.cullFace(GL_FRONT);
//                 gl.frontFace(GL_CCW);
//                 break;
//             case FaceSide.Double:
//                 gl.disable(GL_CULL_FACE);
//                 gl.frontFace(GL_CCW);
//                 break;
//             default:
//                 console.error('invalid face side');
//         }
//
//         // console.log(depthTest, depthWrite, depthFuncType)
//
//         // depth write
//         gl.depthMask(depthWrite);
//         // for debug
//         // console.log(gl.getParameter(gl.DEPTH_WRITEMASK));
//
//         // depth test
//         if (depthTest) {
//             gl.enable(gl.DEPTH_TEST);
//             switch (depthFuncType) {
//                 case DepthFuncTypes.Equal:
//                     gl.depthFunc(GL_EQUAL);
//                     break;
//                 case DepthFuncTypes.Lequal:
//                     gl.depthFunc(GL_LEQUAL);
//                     break;
//                 default:
//                     console.error('invalid depth func type');
//             }
//         } else {
//             gl.disable(GL_DEPTH_TEST);
//         }
//
//         // TODO: renderer側でやるべき？
//         // blend
//         // gl.blendFunc(src, dest)
//         // - src: current draw
//         // - dest: drawn
//         switch (blendType) {
//             case BlendTypes.Opaque:
//                 gl.disable(GL_BLEND);
//                 // pattern_2: for enabled blend
//                 // gl.enable(gl.BLEND);
//                 // gl.blendFunc(gl.ONE, gl.ZERO);
//                 break;
//             case BlendTypes.Transparent:
//                 gl.enable(GL_BLEND);
//                 gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
//                 break;
//             case BlendTypes.Additive:
//                 gl.enable(GL_BLEND);
//                 gl.blendFunc(GL_SRC_ALPHA, GL_ONE);
//                 break;
//             default:
//                 console.error('invalid blend type');
//         }
//
//         gl.useProgram(this._shader.glObject);
//
//         this.setUniformValues();
//
//         // set vertex
//         gl.bindVertexArray(this._vao.glObject);
//
//         // if (this.#ibo) {
//
//         if (hasIndicesVertexArrayObject(this._vao)) {
//             // draw by indices
//             // drawCount ... use indices count
//             if (instanceCount !== null) {
//                 if (instanceCount > 0) {
//                     gl.drawElementsInstanced(glPrimitiveType, drawCount, GL_UNSIGNED_SHORT, startOffset, instanceCount);
//                 }
//             } else {
//                 gl.drawElements(glPrimitiveType, drawCount, GL_UNSIGNED_SHORT, startOffset);
//             }
//         } else {
//             // draw by array
//             // draw count ... use vertex num
//             if (instanceCount !== null) {
//                 if (instanceCount > 0) {
//                     gl.drawArraysInstanced(glPrimitiveType, startOffset, drawCount, instanceCount);
//                 }
//             } else {
//                 gl.drawArrays(glPrimitiveType, startOffset, drawCount);
//             }
//         }
//
//         // unbind when end render
//         gl.bindTexture(GL_TEXTURE_2D, null);
//         gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
//     }
//
//     createUniformBufferObject(
//         shader: Shader,
//         blockName: string,
//         uniformBufferObjectBlockData: UniformBufferObjectBlockData
//     ) {
//         // const variableNames: string[] = uniformBufferObjectBlockData.map((data) => data.name);
//         const variableNames: string[] = [];
//         uniformBufferObjectBlockData.forEach((data) => {
//             switch (data.type) {
//                 case UniformTypes.Struct:
//                     (data.value as UniformStructValue).forEach((structElement) => {
//                         variableNames.push(`${data.name}.${structElement.name}`);
//                     });
//                     break;
//                 case UniformTypes.StructArray:
//                     (data.value as UniformStructArrayValue).forEach((structValue, i) => {
//                         structValue.forEach((structElement) => {
//                             variableNames.push(`${data.name}[${i}].${structElement.name}`);
//                         });
//                     });
//                     break;
//                 default:
//                     variableNames.push(data.name);
//                     break;
//             }
//         });
//
//         const gl = this.gl;
//         const blockIndex = gl.getUniformBlockIndex(shader.glObject, blockName);
//         // for debug
//         // console.log('[Gpu.createUniformBufferObject] blockName', blockName);
//         // console.log('[Gpu.createUniformBufferObject] variableNames', variableNames);
//         // console.log('[Gpu.createUniformBufferObject] blockIndex', blockIndex);
//         const blockSize = gl.getActiveUniformBlockParameter(
//             shader.glObject,
//             blockIndex,
//             GL_UNIFORM_BLOCK_DATA_SIZE
//         ) as number;
//         // for debug
//         // console.log('[Gpu.createUniformBufferObject] blockSize', blockSize);
//         const indices = gl.getUniformIndices(shader.glObject, variableNames) as number[];
//         // for debug
//         // console.log('[Gpu.createUniformBufferObject] indices', indices);
//         const offsets = gl.getActiveUniforms(shader.glObject, indices, GL_UNIFORM_OFFSET) as number[];
//         // for debug
//         // console.log('[Gpu.createUniformBufferObject] offsets', offsets);
//         const uniformBufferObject = createUniformBufferObject(
//             this,
//             blockName,
//             blockSize,
//             variableNames,
//             indices,
//             offsets,
//             blockSize,
//             this._uboBindingPoint
//         );
//
//         this._uboBindingPoint++;
//         return uniformBufferObject;
//     }
//
//     bindUniformBlockAndGetBlockIndex(
//         uniformBufferObject: UniformBufferObject,
//         shader: Shader,
//         blockName: string
//     ): number {
//         const blockIndex = this.gl.getUniformBlockIndex(shader.glObject, blockName);
//         // for debug
//         // console.log('bindUniformBlockAndGetBlockIndex', blockName, blockIndex, uniformBufferObject.bindingPoint);
//         this.gl.uniformBlockBinding(shader.glObject, blockIndex, uniformBufferObject.bindingPoint);
//         return blockIndex;
//     }
// }

import {
    AttributeUsageType,
    BlendType,
    BlendTypes,
    DepthFuncType,
    DepthFuncTypes,
    FaceSide,
    GL_BACK,
    GL_BLEND,
    GL_CCW,
    GL_COLOR_BUFFER_BIT,
    GL_CULL_FACE,
    GL_DEPTH_BUFFER_BIT,
    GL_DEPTH_TEST,
    GL_DYNAMIC_COPY,
    GL_DYNAMIC_DRAW,
    GL_EQUAL,
    GL_FRAMEBUFFER,
    GL_FRONT,
    GL_LEQUAL,
    GL_LINE_LOOP,
    GL_LINE_STRIP,
    GL_LINES,
    GL_ONE,
    GL_ONE_MINUS_SRC_ALPHA,
    GL_POINTS,
    GL_RASTERIZER_DISCARD,
    GL_SRC_ALPHA,
    GL_STATIC_DRAW,
    GL_TEXTURE0,
    GL_TEXTURE_2D,
    GL_TEXTURE_CUBE_MAP,
    GL_TRANSFORM_FEEDBACK,
    GL_TRIANGLES,
    GL_UNIFORM_BLOCK_DATA_SIZE,
    GL_UNIFORM_OFFSET,
    GL_UNSIGNED_SHORT,
    PrimitiveType,
    PrimitiveTypes,
    TextureWrapTypes,
    // UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { createTexture, Texture } from '@/PaleGL/core/texture.ts';
import { Shader } from '@/PaleGL/core/shader.ts';
import { hasIndicesVertexArrayObject, VertexArrayObject } from '@/PaleGL/core/vertexArrayObject.ts';
import { Framebuffer, hasFramebufferMultipleDrawBuffers } from '@/PaleGL/core/framebuffer.ts';
import { Vector2 } from '@/PaleGL/math/vector2.ts';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Color } from '@/PaleGL/math/color.ts';
import { createCubeMap, CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { TransformFeedback } from '@/PaleGL/core/transformFeedback.ts';
import {
    UniformBufferObjectBlockData,
    Uniforms,
    UniformStructArrayValue,
    UniformStructValue,
    UniformValue,
} from '@/PaleGL/core/uniforms.ts';
import { createUniformBufferObject, UniformBufferObject } from '@/PaleGL/core/uniformBufferObject.ts';

export const create1x1 = (color: string = 'black'): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    // if (!ctx) {
    //     console.error('invalid context');
    // }
    canvas.width = 1;
    canvas.height = 1;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return canvas;
};

export const getAttributeUsage = (usageType: AttributeUsageType) => {
    switch (usageType) {
        case AttributeUsageType.StaticDraw:
            return GL_STATIC_DRAW;
        case AttributeUsageType.DynamicDraw:
            return GL_DYNAMIC_DRAW;
        case AttributeUsageType.DynamicCopy:
            return GL_DYNAMIC_COPY;
        default:
            console.error('[getAttributeUsage] invalid usage');
            return -1;
    }
};

export type Gpu = {
    gl: WebGL2RenderingContext;
    shader: Shader | null;
    vao: VertexArrayObject | null;
    uniforms: Uniforms | null;
    dummyTexture: Texture;
    dummyTextureBlack: Texture;
    dummyCubeTexture: CubeMap;
    validExtensions: string[];
    invalidExtensions: string[];
    uboBindingPoint: number;
};

type Modify<T, R> = Omit<T, keyof R> & R;

export type GPUBase = Modify<
    Gpu,
    {
        dummyTexture: Texture | null;
        dummyTextureBlack: Texture | null;
        dummyCubeTexture: CubeMap | null;
    }
>;

export function createGPU(gl: WebGL2RenderingContext): Gpu {
    const shader: Shader | null = null;
    const vao: VertexArrayObject | null = null;
    const uniforms: Uniforms | null = null;
    let dummyTexture: Texture | null = null;
    let dummyTextureBlack: Texture | null = null;
    let dummyCubeTexture: CubeMap | null = null;
    const validExtensions: string[] = [];
    const invalidExtensions: string[] = [];
    const uboBindingPoint: number = 0;

    const gpu: GPUBase = {
        gl,
        shader,
        vao,
        uniforms,
        dummyTexture,
        dummyTextureBlack,
        dummyCubeTexture,
        validExtensions,
        invalidExtensions,
        uboBindingPoint,
    };

    dummyTexture = createTexture({
        gpu: gpu as Gpu,
        img: create1x1('white'),
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
    });
    gpu.dummyTexture = dummyTexture;

    dummyTextureBlack = createTexture({
        gpu: gpu as Gpu,
        img: create1x1('black'),
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
    });
    gpu.dummyTextureBlack = dummyTextureBlack;

    dummyCubeTexture = createCubeMap(
        gpu as Gpu,
        create1x1(),
        create1x1(),
        create1x1(),
        create1x1(),
        create1x1(),
        create1x1()
    );
    gpu.dummyCubeTexture = dummyCubeTexture;

    return gpu as Gpu;
}

export function setGPUShader(gpu: Gpu, shader: Shader) {
    gpu.shader = shader;
}

export function setGPUVertexArrayObject(gpu: Gpu, vao: VertexArrayObject) {
    gpu.vao = vao;
}

export function setGPUUniforms(gpu: Gpu, uniforms: Uniforms) {
    gpu.uniforms = uniforms;
}

export function setGPUViewport(gpu: Gpu, x: number, y: number, width: number, height: number) {
    gpu.gl.viewport(x, y, width, height);
}

export function setGPUFramebuffer(gpu: Gpu, framebuffer: Framebuffer | null) {
    const gl = gpu.gl;
    if (!framebuffer) {
        gl.bindFramebuffer(GL_FRAMEBUFFER, null);
        return;
    }
    gl.bindFramebuffer(GL_FRAMEBUFFER, framebuffer.glObject);
    if (hasFramebufferMultipleDrawBuffers(framebuffer)) {
        gl.drawBuffers(framebuffer.drawBufferList);
    }

    // tmp
    // !!framebuffer
    //     ? gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject)
    //     : gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export function flushGPU(gpu: Gpu) {
    gpu.gl.flush();
}

export function clearGPUDepth(gpu: Gpu, r: number, g: number, b: number, a: number) {
    const gl = gpu.gl;
    gl.depthMask(true);
    gl.colorMask(false, false, false, false);
    gl.clearColor(r, g, b, a);
    gl.clear(GL_DEPTH_BUFFER_BIT);
}

export function clearGPUColor(gpu: Gpu, r: number, g: number, b: number, a: number) {
    const gl = gpu.gl;
    gl.depthMask(false);
    gl.colorMask(true, true, true, true);
    gl.clearColor(r, g, b, a);
    gl.clear(GL_COLOR_BUFFER_BIT);
}

export function clearGPUColorAndDepth(gpu: Gpu, r: number, g: number, b: number, a: number) {
    clearGPUDepth(gpu, r, g, b, a);
    clearGPUColor(gpu, r, g, b, a);

    // tmp
    // const {gl} = this;
    // gl.depthMask(true);
    // gl.colorMask(true, true, true, true);
    // gl.enable(gl.CULL_FACE);
    // gl.enable(gl.DEPTH_TEST);
    // gl.clearColor(0, 0, 0, 1);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //
    // TODO: デフォルトに戻した方がよい？
    //
}

export function checkGPUExtension(gpu: Gpu, extensionName: string): boolean {
    if (gpu.validExtensions.includes(extensionName)) {
        return true;
    }

    if (gpu.invalidExtensions.includes(extensionName)) {
        return false;
    }

    const ext = gpu.gl.getExtension(extensionName) != null;
    if (!ext) {
        gpu.invalidExtensions.push(extensionName);
        return false;
    }
    gpu.validExtensions.push(extensionName);
    return true;
}

export function getGLPrimitive(primitiveType: PrimitiveType) {
    switch (primitiveType) {
        case PrimitiveTypes.Points:
            return GL_POINTS;
        case PrimitiveTypes.Lines:
            return GL_LINES;
        case PrimitiveTypes.LineLoop:
            return GL_LINE_LOOP;
        case PrimitiveTypes.LineStrip:
            return GL_LINE_STRIP;
        case PrimitiveTypes.Triangles:
            return GL_TRIANGLES;
        default:
            console.error('invalid primitive type');
            return -1;
    }
}

export function setGPUUniformValues(gpu: Gpu) {
    const gl = gpu.gl;

    let activeTextureIndex = 0;
    // let dummyTextureIndex = 0;

    if (!gpu.shader) {
        console.error('shader is not set');
        return;
    }

    const setUniformValueInternal = (type: UniformTypes, uniformName: string, value: UniformValue) => {
        // for debug
        // console.log("setUniformValueInternal", type, uniformName, value);

        const location = gl.getUniformLocation(gpu.shader!.glObject, uniformName);

        // TODO:
        // - nullなとき,値がおかしいときはセットしない方がよいけど、あえてエラーを出したいかもしれない
        switch (type) {
            case UniformTypes.Int:
                gl.uniform1i(location, value as number);
                break;
            case UniformTypes.Float:
                gl.uniform1f(location, value as number);
                break;
            case UniformTypes.FloatArray:
                gl.uniform1fv(location, value as Float32Array);
                break;
            case UniformTypes.Vector2:
                gl.uniform2fv(location, (value as Vector2).e);
                break;
            case UniformTypes.Vector2Array:
                gl.uniform2fv(location, (value as Vector2[]).map((v) => [...v.e]).flat());
                break;
            case UniformTypes.Vector3:
                gl.uniform3fv(location, (value as Vector3).e);
                break;
            case UniformTypes.Vector3Array:
                gl.uniform3fv(location, (value as Vector3[]).map((v) => [...v.e]).flat());
                break;
            case UniformTypes.Vector4:
                gl.uniform4fv(location, (value as Vector4).e);
                break;
            case UniformTypes.Vector4Array:
                gl.uniform4fv(location, (value as Vector4[]).map((v) => [...v.e]).flat());
                break;
            case UniformTypes.Matrix4:
                // arg[1] ... use transpose.
                gl.uniformMatrix4fv(location, false, (value as Matrix4).e);
                break;
            case UniformTypes.Matrix4Array:
                if (value) {
                    // arg[1] ... use transpose.
                    gl.uniformMatrix4fv(location, false, (value as Matrix4[]).map((v) => [...v.e]).flat());
                }
                break;
            case UniformTypes.Color:
                gl.uniform4fv(location, (value as Color).e);
                break;
            case UniformTypes.ColorArray:
                if (value) {
                    // arg[1] ... use transpose.
                    gl.uniform4fv(location, (value as Color[]).map((v) => [...v.e]).flat());
                }
                break;
            case UniformTypes.Texture:
                gl.activeTexture(GL_TEXTURE0 + activeTextureIndex);
                gl.bindTexture(GL_TEXTURE_2D, value ? (value as Texture).glObject : gpu.dummyTexture.glObject);
                gl.uniform1i(location, activeTextureIndex);
                activeTextureIndex++;
                break;
            case UniformTypes.TextureArray:
                // (value as Texture[]).forEach((texture) => {
                //     gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                //     gl.bindTexture(gl.TEXTURE_2D, texture ? texture.glObject : this.dummyTexture.glObject);
                //     gl.uniform1i(location, activeTextureIndex);
                //     activeTextureIndex++;
                // });

                const textureArrayIndices: number[] = [];
                (value as Texture[]).forEach((texture) => {
                    textureArrayIndices.push(activeTextureIndex);
                    gl.activeTexture(GL_TEXTURE0 + activeTextureIndex);
                    gl.bindTexture(GL_TEXTURE_2D, texture ? texture.glObject : gpu.dummyTexture.glObject);
                    activeTextureIndex++;
                });
                if (textureArrayIndices.length < 1) {
                    console.error('[Gpu.setUniformValues] invalid texture array');
                }
                gl.uniform1iv(location, textureArrayIndices);

                break;
            case UniformTypes.CubeMap:
                // TODO: valueのguardなくて大丈夫なはず
                gl.activeTexture(GL_TEXTURE0 + activeTextureIndex);
                // if (value != null) {
                //     gl.bindTexture(gl.TEXTURE_CUBE_MAP, (value as CubeMap).glObject);
                // } else {
                //     gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.dummyCubeTexture.glObject);
                // }
                gl.bindTexture(
                    GL_TEXTURE_CUBE_MAP,
                    value ? (value as CubeMap).glObject : gpu.dummyCubeTexture.glObject
                );
                gl.uniform1i(location, activeTextureIndex);
                activeTextureIndex++;
                break;
            default:
                console.error(`invalid uniform - name: ${uniformName}, type: ${type}`);
        }
    };

    // uniforms
    if (gpu.uniforms) {
        gpu.uniforms.data.forEach((uniformData) => {
            if (uniformData.type === UniformTypes.Struct) {
                const uniformStructValue = uniformData.value as UniformStructValue;
                uniformStructValue.forEach((structData) => {
                    const uniformName = `${uniformData.name}.${structData.name}`;
                    setUniformValueInternal(structData.type, uniformName, structData.value);
                });
            } else if (uniformData.type === UniformTypes.StructArray) {
                (uniformData.value as UniformStructArrayValue).forEach((uniformStructValue, i) => {
                    uniformStructValue.forEach((structData) => {
                        const uniformName = `${uniformData.name}[${i}].${structData.name}`;
                        // console.log(structData.type, uniformName, structData.value)
                        setUniformValueInternal(structData.type, uniformName, structData.value);
                    });
                });
            } else {
                setUniformValueInternal(uniformData.type, uniformData.name, uniformData.value);
            }
        });
    }
}

export function updateGPUTransformFeedback(
    gpu: Gpu,
    {
        shader,
        uniforms,
        transformFeedback,
        vertexArrayObject,
        drawCount,
    }: {
        shader: Shader;
        uniforms: Uniforms;
        transformFeedback: TransformFeedback;
        vertexArrayObject: VertexArrayObject;
        drawCount: number;
    }
) {
    gpu.uniforms = uniforms;
    gpu.shader = shader;
    gpu.vao = vertexArrayObject;

    const gl = gpu.gl;

    gl.bindVertexArray(gpu.vao.glObject);

    gl.useProgram(gpu.shader.glObject);

    setGPUUniformValues(gpu);

    gl.enable(GL_RASTERIZER_DISCARD);

    gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, transformFeedback.glObject);
    gl.beginTransformFeedback(GL_POINTS);
    gl.drawArrays(GL_POINTS, 0, drawCount);
    gl.endTransformFeedback();
    gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, null);

    gl.disable(GL_RASTERIZER_DISCARD);

    gl.useProgram(null);

    gl.bindVertexArray(null);

    gpu.shader = null;
    gpu.uniforms = null;
    gpu.vao = null;
}

// TODO
// start offset と instanceCount は逆の方が良い
// なんなら object destructuring の方がよさそう
export function drawGPU(
    gpu: Gpu,
    drawCount: number,
    primitiveType: PrimitiveType,
    depthTest: boolean,
    depthWrite: boolean,
    depthFuncType: DepthFuncType,
    blendType: BlendType,
    faceSide: FaceSide,
    instanceCount: number | null,
    startOffset = 0
) {
    const glPrimitiveType = getGLPrimitive(primitiveType);
    const gl = gpu.gl;

    if (!gpu.shader) {
        console.error('shader is not set');
        return;
    }
    if (!gpu.vao) {
        console.error('vao is not set');
        return;
    }

    // culling
    switch (faceSide) {
        case FaceSide.Front:
            gl.enable(GL_CULL_FACE);
            gl.cullFace(GL_BACK);
            gl.frontFace(GL_CCW);
            break;
        case FaceSide.Back:
            gl.enable(GL_CULL_FACE);
            gl.cullFace(GL_FRONT);
            gl.frontFace(GL_CCW);
            break;
        case FaceSide.Double:
            gl.disable(GL_CULL_FACE);
            gl.frontFace(GL_CCW);
            break;
        default:
            console.error('invalid face side');
    }

    // console.log(depthTest, depthWrite, depthFuncType)

    // depth write
    gl.depthMask(depthWrite);
    // for debug
    // console.log(gl.getParameter(gl.DEPTH_WRITEMASK));

    // depth test
    if (depthTest) {
        gl.enable(gl.DEPTH_TEST);
        switch (depthFuncType) {
            case DepthFuncTypes.Equal:
                gl.depthFunc(GL_EQUAL);
                break;
            case DepthFuncTypes.Lequal:
                gl.depthFunc(GL_LEQUAL);
                break;
            default:
                console.error('invalid depth func type');
        }
    } else {
        gl.disable(GL_DEPTH_TEST);
    }

    // TODO: renderer側でやるべき？
    // blend
    // gl.blendFunc(src, dest)
    // - src: current draw
    // - dest: drawn
    switch (blendType) {
        case BlendTypes.Opaque:
            gl.disable(GL_BLEND);
            // pattern_2: for enabled blend
            // gl.enable(gl.BLEND);
            // gl.blendFunc(gl.ONE, gl.ZERO);
            break;
        case BlendTypes.Transparent:
            gl.enable(GL_BLEND);
            gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
            break;
        case BlendTypes.Additive:
            gl.enable(GL_BLEND);
            gl.blendFunc(GL_SRC_ALPHA, GL_ONE);
            break;
        default:
            console.error('invalid blend type');
    }

    gl.useProgram(gpu.shader.glObject);

    setGPUUniformValues(gpu);

    // set vertex
    gl.bindVertexArray(gpu.vao.glObject);

    // if (this.#ibo) {

    if (hasIndicesVertexArrayObject(gpu.vao)) {
        // draw by indices
        // drawCount ... use indices count
        if (instanceCount !== null) {
            if (instanceCount > 0) {
                gl.drawElementsInstanced(glPrimitiveType, drawCount, GL_UNSIGNED_SHORT, startOffset, instanceCount);
            }
        } else {
            gl.drawElements(glPrimitiveType, drawCount, GL_UNSIGNED_SHORT, startOffset);
        }
    } else {
        // draw by array
        // draw count ... use vertex num
        if (instanceCount !== null) {
            if (instanceCount > 0) {
                gl.drawArraysInstanced(glPrimitiveType, startOffset, drawCount, instanceCount);
            }
        } else {
            gl.drawArrays(glPrimitiveType, startOffset, drawCount);
        }
    }

    // unbind when end render
    gl.bindTexture(GL_TEXTURE_2D, null);
    gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
}

export function createGPUUniformBufferObject(
    gpu: Gpu,
    shader: Shader,
    blockName: string,
    uniformBufferObjectBlockData: UniformBufferObjectBlockData
) {
    // const variableNames: string[] = uniformBufferObjectBlockData.map((data) => data.name);
    const variableNames: string[] = [];
    uniformBufferObjectBlockData.forEach((data) => {
        switch (data.type) {
            case UniformTypes.Struct:
                (data.value as UniformStructValue).forEach((structElement) => {
                    variableNames.push(`${data.name}.${structElement.name}`);
                });
                break;
            case UniformTypes.StructArray:
                (data.value as UniformStructArrayValue).forEach((structValue, i) => {
                    structValue.forEach((structElement) => {
                        variableNames.push(`${data.name}[${i}].${structElement.name}`);
                    });
                });
                break;
            default:
                variableNames.push(data.name);
                break;
        }
    });

    const gl = gpu.gl;
    const blockIndex = gl.getUniformBlockIndex(shader.glObject, blockName);
    // for debug
    // console.log('[Gpu.createUniformBufferObject] blockName', blockName);
    // console.log('[Gpu.createUniformBufferObject] variableNames', variableNames);
    // console.log('[Gpu.createUniformBufferObject] blockIndex', blockIndex);
    const blockSize = gl.getActiveUniformBlockParameter(
        shader.glObject,
        blockIndex,
        GL_UNIFORM_BLOCK_DATA_SIZE
    ) as number;
    // for debug
    // console.log('[Gpu.createUniformBufferObject] blockSize', blockSize);
    const indices = gl.getUniformIndices(shader.glObject, variableNames) as number[];
    // for debug
    // console.log('[Gpu.createUniformBufferObject] indices', indices);
    const offsets = gl.getActiveUniforms(shader.glObject, indices, GL_UNIFORM_OFFSET) as number[];
    // for debug
    // console.log('[Gpu.createUniformBufferObject] offsets', offsets);
    const uniformBufferObject = createUniformBufferObject(
        gpu,
        blockName,
        blockSize,
        variableNames,
        indices,
        offsets,
        blockSize,
        gpu.uboBindingPoint
    );

    gpu.uboBindingPoint++;
    return uniformBufferObject;
}

export function bindGPUUniformBlockAndGetBlockIndex(
    gpu: Gpu,
    uniformBufferObject: UniformBufferObject,
    shader: Shader,
    blockName: string
): number {
    const blockIndex = gpu.gl.getUniformBlockIndex(shader.glObject, blockName);
    // for debug
    // console.log('bindUniformBlockAndGetBlockIndex', blockName, blockIndex, uniformBufferObject.bindingPoint);
    gpu.gl.uniformBlockBinding(shader.glObject, blockIndex, uniformBufferObject.bindingPoint);
    return blockIndex;
}
