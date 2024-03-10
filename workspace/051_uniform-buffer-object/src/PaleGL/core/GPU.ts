import {
    AttributeUsageType,
    BlendType,
    BlendTypes,
    DepthFuncType,
    DepthFuncTypes,
    FaceSide,
    PrimitiveType,
    PrimitiveTypes,
    TextureWrapTypes,
    // UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { Texture } from '@/PaleGL/core/Texture';
import { Shader } from '@/PaleGL/core/Shader';
import { VertexArrayObject } from '@/PaleGL/core/VertexArrayObject';
import { Framebuffer } from '@/PaleGL/core/Framebuffer';
// import { Uniforms, UniformStructValue, UniformValue } from '@/PaleGL/materials/Material';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Color } from '@/PaleGL/math/Color';
import { CubeMap } from '@/PaleGL/core/CubeMap';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { TransformFeedback } from '@/PaleGL/core/TransformFeedback.ts';
import { createCubeMap } from '@/PaleGL/loaders/loadCubeMap.ts';
import {
    UniformBufferObjectBlockData,
    Uniforms,
    UniformStructArrayValue,
    UniformStructValue,
    UniformValue,
} from '@/PaleGL/core/Uniforms.ts';
import { UniformBufferObject } from '@/PaleGL/core/UniformBufferObject.ts';

export const create1x1 = (color: string = 'black'): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw 'invalid context';
    }
    canvas.width = 1;
    canvas.height = 1;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return canvas;
};

export const getAttributeUsage = (gl: WebGL2RenderingContext, usageType: AttributeUsageType) => {
    switch (usageType) {
        case AttributeUsageType.StaticDraw:
            return gl.STATIC_DRAW;
        case AttributeUsageType.DynamicDraw:
            return gl.DYNAMIC_DRAW;
        case AttributeUsageType.DynamicCopy:
            return gl.DYNAMIC_COPY;
        default:
            throw '[getAttributeUsage] invalid usage';
    }
};

export class GPU {
    gl: WebGL2RenderingContext;
    private shader: Shader | null = null;
    // private transformFeedback: TransformFeedback | null = null;
    private vao: VertexArrayObject | null = null;
    private uniforms: Uniforms | null = null;
    dummyTexture: Texture;
    dummyCubeTexture: CubeMap;
    private validExtensions: string[] = [];
    private invalidExtensions: string[] = [];
    private uboBindingPoint: number = 0;

    /**
     *
     * @param gl
     */
    constructor({ gl }: { gl: WebGL2RenderingContext }) {
        this.gl = gl;
        this.dummyTexture = new Texture({
            gpu: this,
            img: create1x1('white'),
            wrapS: TextureWrapTypes.Repeat,
            wrapT: TextureWrapTypes.Repeat,
        });

        this.dummyCubeTexture = createCubeMap(
            this,
            create1x1(),
            create1x1(),
            create1x1(),
            create1x1(),
            create1x1(),
            create1x1()
        );
    }

    /**
     *
     * @param shader
     */
    setShader(shader: Shader) {
        this.shader = shader;
    }

    /**
     *
     * @param vao
     */
    setVertexArrayObject(vao: VertexArrayObject) {
        this.vao = vao;
    }

    /**
     *
     * @param uniforms
     */
    setUniforms(uniforms: Uniforms) {
        this.uniforms = uniforms;
    }

    /**
     *
     * @param x
     * @param y
     * @param width
     * @param height
     */
    setSize(x: number, y: number, width: number, height: number) {
        this.gl.viewport(x, y, width, height);
    }

    /**
     *
     * @param framebuffer
     */
    setFramebuffer(framebuffer: Framebuffer | null) {
        const gl = this.gl;
        if (!framebuffer) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject);
        if (framebuffer.hasMultipleDrawBuffers) {
            gl.drawBuffers(framebuffer.drawBufferList);
        }

        // tmp
        // !!framebuffer
        //     ? gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject)
        //     : gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     *
     */
    flush() {
        this.gl.flush();
    }

    /**
     *
     * @param r
     * @param g
     * @param b
     * @param a
     */
    clearDepth(r: number, g: number, b: number, a: number) {
        const gl = this.gl;
        gl.depthMask(true);
        gl.colorMask(false, false, false, false);
        gl.clearColor(r, g, b, a);
        gl.clear(gl.DEPTH_BUFFER_BIT);
    }

    /**
     *
     * @param r
     * @param g
     * @param b
     * @param a
     */
    clearColor(r: number, g: number, b: number, a: number) {
        const gl = this.gl;
        gl.depthMask(false);
        gl.colorMask(true, true, true, true);
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    /**
     *
     * @param r
     * @param g
     * @param b
     * @param a
     */
    clear(r: number, g: number, b: number, a: number) {
        this.clearDepth(r, g, b, a);
        this.clearColor(r, g, b, a);

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

    /**
     *
     * @param extensionName
     */
    checkExtension(extensionName: string): boolean {
        if (this.validExtensions.includes(extensionName)) {
            return true;
        }

        if (this.invalidExtensions.includes(extensionName)) {
            return false;
        }

        const ext = this.gl.getExtension(extensionName) != null;
        if (!ext) {
            this.invalidExtensions.push(extensionName);
            return false;
        }
        this.validExtensions.push(extensionName);
        return true;
    }

    /**
     *
     * @param primitiveType
     * @private
     */
    #getGLPrimitive(primitiveType: PrimitiveType) {
        const gl = this.gl;
        switch (primitiveType) {
            case PrimitiveTypes.Points:
                return gl.POINTS;
            case PrimitiveTypes.Lines:
                return gl.LINES;
            case PrimitiveTypes.Triangles:
                return gl.TRIANGLES;
            default:
                throw 'invalid primitive type';
        }
    }

    // setTransformFeedback() {
    // }

    // dummyTextureIndex = 0;

    /**
     *
     */
    setUniformValues() {
        const gl = this.gl;

        let activeTextureIndex = 0;
        // let dummyTextureIndex = 0;

        const setUniformValueInternal = (type: UniformTypes, uniformName: string, value: UniformValue) => {
            // for debug
            // console.log("setUniformValueInternal", type, uniformName, value);

            const location = gl.getUniformLocation(this.shader!.glObject, uniformName);

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
                    gl.uniform2fv(location, (value as Vector2).elements);
                    break;
                case UniformTypes.Vector2Array:
                    gl.uniform2fv(location, (value as Vector2[]).map((v) => [...v.elements]).flat());
                    break;
                case UniformTypes.Vector3:
                    gl.uniform3fv(location, (value as Vector3).elements);
                    break;
                case UniformTypes.Vector4:
                    gl.uniform4fv(location, (value as Vector4).elements);
                    break;
                case UniformTypes.Vector4Array:
                    gl.uniform4fv(location, (value as Vector4[]).map((v) => [...v.elements]).flat());
                    break;
                case UniformTypes.Matrix4:
                    // arg[1] ... use transpose.
                    gl.uniformMatrix4fv(location, false, (value as Matrix4).elements);
                    break;
                case UniformTypes.Matrix4Array:
                    if (value) {
                        // arg[1] ... use transpose.
                        gl.uniformMatrix4fv(location, false, (value as Matrix4[]).map((v) => [...v.elements]).flat());
                    }
                    break;
                case UniformTypes.Color:
                    gl.uniform4fv(location, (value as Color).elements);
                    break;
                case UniformTypes.ColorArray:
                    if (value) {
                        // arg[1] ... use transpose.
                        gl.uniform4fv(location, (value as Color[]).map((v) => [...v.elements]).flat());
                    }
                    break;
                case UniformTypes.Texture:
                    gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                    gl.bindTexture(gl.TEXTURE_2D, value ? (value as Texture).glObject : this.dummyTexture.glObject);
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
                        gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                        gl.bindTexture(gl.TEXTURE_2D, texture ? texture.glObject : this.dummyTexture.glObject);
                        activeTextureIndex++;
                    });
                    gl.uniform1iv(location, textureArrayIndices);

                    break;
                case UniformTypes.CubeMap:
                    // TODO: valueのguardなくて大丈夫なはず
                    gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                    // if (value != null) {
                    //     gl.bindTexture(gl.TEXTURE_CUBE_MAP, (value as CubeMap).glObject);
                    // } else {
                    //     gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.dummyCubeTexture.glObject);
                    // }
                    gl.bindTexture(
                        gl.TEXTURE_CUBE_MAP,
                        value ? (value as CubeMap).glObject : this.dummyCubeTexture.glObject
                    );
                    gl.uniform1i(location, activeTextureIndex);
                    activeTextureIndex++;
                    break;
                default:
                    throw `invalid uniform - name: ${uniformName}, type: ${type}`;
            }
        };

        // uniforms
        if (this.uniforms) {
            this.uniforms.data.forEach((uniformData) => {
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

            // uniform block
            // for debug
            // if(this.uniforms.uniformBlocks.length > 0) {
            //     console.log(this.uniforms.uniformBlocks)
            // }
            // NOTE: なくていいかも
            // this.uniforms.uniformBlocks.forEach(({ uniformBufferObject} ) => {
            //     this.gl.bindBufferRange(
            //         gl.UNIFORM_BUFFER,
            //         uniformBufferObject.bindingPoint,
            //         uniformBufferObject.glObject,
            //         0,
            //         uniformBufferObject.blockSize
            //     );
            // });
        }
    }

    updateTransformFeedback({
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
    }) {
        this.uniforms = uniforms;
        this.shader = shader;
        this.vao = vertexArrayObject;

        const gl = this.gl;

        gl.bindVertexArray(this.vao.glObject);

        gl.useProgram(this.shader.glObject);

        this.setUniformValues();

        gl.enable(gl.RASTERIZER_DISCARD);

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback.glObject);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, drawCount);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        gl.disable(gl.RASTERIZER_DISCARD);

        gl.useProgram(null);

        gl.bindVertexArray(null);

        this.shader = null;
        this.uniforms = null;
        this.vao = null;
    }

    /**
     *
     * TODO:
     * - start offset と instanceCount は逆の方が良い
     * - なんなら object destructuring の方がよさそう
     *
     * @param drawCount
     * @param primitiveType
     * @param depthTest
     * @param depthWrite
     * @param depthFuncType
     * @param blendType
     * @param faceSide
     * @param instanceCount
     * @param startOffset
     */
    draw(
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
        const glPrimitiveType = this.#getGLPrimitive(primitiveType);
        const gl = this.gl;

        // culling
        switch (faceSide) {
            case FaceSide.Front:
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.BACK);
                gl.frontFace(gl.CCW);
                break;
            case FaceSide.Back:
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT);
                gl.frontFace(gl.CCW);
                break;
            case FaceSide.Double:
                gl.disable(gl.CULL_FACE);
                gl.frontFace(gl.CCW);
                break;
            default:
                throw 'invalid face side';
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
                    gl.depthFunc(gl.EQUAL);
                    break;
                case DepthFuncTypes.Lequal:
                    gl.depthFunc(gl.LEQUAL);
                    break;
                default:
                    throw 'invalid depth func type';
            }
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        // TODO: renderer側でやるべき？
        // blend
        // gl.blendFunc(src, dest)
        // - src: current draw
        // - dest: drawn
        switch (blendType) {
            case BlendTypes.Opaque:
                gl.disable(gl.BLEND);
                // pattern_2: for enabled blend
                // gl.enable(gl.BLEND);
                // gl.blendFunc(gl.ONE, gl.ZERO);
                break;
            case BlendTypes.Transparent:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case BlendTypes.Additive:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                break;
            default:
                throw 'invalid blend type';
        }

        if (!this.shader) {
            throw 'shader is not set';
        }
        if (!this.vao) {
            throw 'vao is not set';
        }

        gl.useProgram(this.shader.glObject);

        this.setUniformValues();

        // set vertex
        gl.bindVertexArray(this.vao.glObject);

        // if (this.#ibo) {
        if (this.vao.hasIndices) {
            // draw by indices
            // drawCount ... use indices count
            if (instanceCount) {
                gl.drawElementsInstanced(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset, instanceCount);
            } else {
                gl.drawElements(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset);
            }
        } else {
            // draw by array
            // draw count ... use vertex num
            if (instanceCount) {
                gl.drawArraysInstanced(glPrimitiveType, startOffset, drawCount, instanceCount);
            } else {
                gl.drawArrays(glPrimitiveType, startOffset, drawCount);
            }
        }

        // unbind when end render
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }

    createUniformBufferObject(
        shader: Shader,
        blockName: string,
        uniformBufferObjectBlockData: UniformBufferObjectBlockData
    ) {
        // const variableNames: string[] = uniformBufferObjectBlockData.map((data) => data.name);
        const variableNames: string[] = [];
        uniformBufferObjectBlockData.forEach((data) => {
            switch(data.type){
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
        
        const gl = this.gl;
        const blockIndex = gl.getUniformBlockIndex(shader.glObject, blockName);
        console.log('[GPU.createUniformBufferObject] blockName', blockName);
        console.log('[GPU.createUniformBufferObject] variableNames', variableNames);
        console.log('[GPU.createUniformBufferObject] blockIndex', blockIndex);
        const blockSize = gl.getActiveUniformBlockParameter(
            shader.glObject,
            blockIndex,
            gl.UNIFORM_BLOCK_DATA_SIZE
        ) as number;
        console.log('[GPU.createUniformBufferObject] blockSize', blockSize);
        const indices = gl.getUniformIndices(shader.glObject, variableNames) as number[];
        console.log('[GPU.createUniformBufferObject] indices', indices);
        const offsets = gl.getActiveUniforms(shader.glObject, indices, gl.UNIFORM_OFFSET) as number[];
        console.log('[GPU.createUniformBufferObject] offsets', offsets);
        const uniformBufferObject = new UniformBufferObject(
            this,
            blockName,
            blockSize,
            variableNames,
            indices,
            offsets,
            blockSize,
            this.uboBindingPoint
        );

        this.uboBindingPoint++;
        return uniformBufferObject;
    }

    bindUniformBlockAndGetBlockIndex(
        uniformBufferObject: UniformBufferObject,
        shader: Shader,
        blockName: string
    ): number {
        const blockIndex = this.gl.getUniformBlockIndex(shader.glObject, blockName);
        // for debug
        // console.log('bindUniformBlockAndGetBlockIndex', blockName, blockIndex, uniformBufferObject.bindingPoint);
        this.gl.uniformBlockBinding(shader.glObject, blockIndex, uniformBufferObject.bindingPoint);
        return blockIndex;
    }
}
