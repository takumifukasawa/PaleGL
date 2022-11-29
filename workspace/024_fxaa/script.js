import {
    PrimitiveTypes,
    GPU,
    CubeMapAxis,
    UniformTypes,
    RenderTargetTypes,
    TextureWrapTypes,
    TextureFilterTypes,
    Vector3,
    Vector4,
    Matrix4,
    Scene,
    ForwardRenderer,
    Mesh,
    Material,
    PerspectiveCamera,
    Texture,
    loadImg,
    PostProcess,
    FragmentPass,
    FXAAPass,
    PlaneGeometry,
    DirectionalLight,
    loadObj,
    loadGLTF,
    Geometry,
    Color,
    loadCubeMap,
    Skybox,
    AxesHelper,
    RenderTarget,
    Engine,
    PhongMaterial,
    Vector2,
    generateVertexShader, RenderQueues, FaceSide, BlendTypes,
} from "./pale-gl.js";
import {DebuggerGUI} from "./DebuggerGUI.js";

let debuggerGUI;
let width, height;
let reflectSkyboxMesh;
let alphaTestPhongMesh;
let floorPlaneMesh;
let checkerPlaneMesh;
let cubeMap;
let floorDiffuseMap;
let floorNormalMap;
let floorDiffuseWithCheckerAlphaMap;
let gltfActor;
let skinningMeshes;
let skinningMeshAnimator;
const targetCameraPosition = new Vector3(0, 5, 10);
let outlineColor = new Color(0, 0, 0, 1);
let outlineAlpha = 1;
let outlineOffset = 0.05;

const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const objModelVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;
layout (location = 2) in vec3 aNormal;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
    vUv = aUv;
    vNormal = (uNormalMatrix * vec4(aNormal, 1)).xyz;
    vec4 worldPosition = uWorldMatrix * vec4(aPosition, 1);
    vWorldPosition = worldPosition.xyz;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const objModelFragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

out vec4 outColor;

uniform vec3 uViewPosition;
uniform samplerCube uCubeTexture;

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 P = vWorldPosition;
    vec3 E = uViewPosition;
    vec3 PtoE = normalize(E - P);
 
    // ----------------------------------------------------------
    // begin: for cube map sample pattern
    // ----------------------------------------------------------
  
    // pattern_1: raw
    // vec3 reflectDir = reflect(-PtoE, N);
    // vec3 cubeColor = texture(uCubeTexture, reflectDir).xyz;
   
    // pattern_2: reverse x
    // reflectDir *= vec3(-1., 1., 1.);
    // vec3 cubeColor = texture(uCubeTexture, reflectDir).xyz;

    // pattern_3: reverse x and z
    // vec3 reflectDir = reflect(-PtoE, N);
    // reflectDir *= vec3(-1., 1., -1.);
    // vec3 cubeColor = texture(uCubeTexture, reflectDir).xyz;

    // pattern_4: reverse x and rotate
    vec3 reflectDir = reflect(-PtoE, N);
    reflectDir.x *= -1.;
    reflectDir.xz *= rotate(3.14);
    vec3 cubeColor = texture(uCubeTexture, reflectDir).xyz;

    // ----------------------------------------------------------
    // end: for cube map sample pattern
    // ----------------------------------------------------------
   
    outColor = vec4(cubeColor, 1);
}
`;

const gl = canvasElement.getContext('webgl2', { antialias: false });

const gpu = new GPU({gl});

const captureScene = new Scene();

const renderer = new ForwardRenderer({
        gpu,
        canvas: canvasElement,
        pixelRatio: Math.min(window.devicePixelRatio, 1)
    }
);

const engine = new Engine({ gpu, renderer });

engine.setScene(captureScene);

const captureSceneCamera = new PerspectiveCamera(90, 1, 0.1, 100);
captureScene.add(captureSceneCamera);
captureScene.mainCamera = captureSceneCamera;

captureSceneCamera.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(0, 0, 5));
    actor.setClearColor(new Vector4(0, 0, 0, 1));
}
captureSceneCamera.onFixedUpdate = ({ actor }) => {
    const cameraPosition = Vector3.addVectors(
        actor.transform.position,
        new Vector3(
            (targetCameraPosition.x - actor.transform.position.x) * 0.1,
            (targetCameraPosition.y - actor.transform.position.y) * 0.1,
            (targetCameraPosition.z - actor.transform.position.z) * 0.1
        )
    );
    actor.transform.position = cameraPosition;
}

const directionalLight = new DirectionalLight();
directionalLight.intensity = 1;
directionalLight.color = Color.fromRGB(255, 255, 255);
directionalLight.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(4, 12, 4));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    actor.shadowCamera.visibleFrustum = true;
    actor.castShadow = true;
    actor.shadowCamera.near = 1;
    actor.shadowCamera.far = 30;
    actor.shadowCamera.setSize(null, null, -8, 8, -8, 8);
    actor.shadowMap = new RenderTarget({ gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth });
}
captureScene.add(directionalLight);

const directionalLightShadowCameraAxesHelper = new AxesHelper({ gpu });
directionalLight.shadowCamera.addChild(directionalLightShadowCameraAxesHelper);

const postProcess = new PostProcess({gpu, renderer});
postProcess.addPass(new FXAAPass({ gpu }));
// postProcess.addPass(new FragmentPass({
//     gpu, fragmentShader: `#version 300 es
// precision mediump float;
// in vec2 vUv;
// out vec4 outColor;
// uniform sampler2D uSceneTexture;
// void main() {
//     vec4 textureColor = texture(uSceneTexture, vUv);
//     float r = texture(uSceneTexture, vUv + vec2(0.01, 0)).r;
//     float g = texture(uSceneTexture, vUv + vec2(-0.005, 0)).g;
//     float b = texture(uSceneTexture, vUv + vec2(0, 0.005)).b;
//     outColor = vec4(r, g, b, 1);
// }
// `
// }));

captureSceneCamera.setPostProcess(postProcess);

const onMouseMove = (e) => {
    const nx = (e.clientX / width) * 2 - 1;
    const ny = ((e.clientY / height) * 2 - 1) * -1;
    targetCameraPosition.x = nx * 20;
    targetCameraPosition.y = ny * 10 + 12;
    // targetCameraPosition.y = ny * 20;
};

const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;

    // captureSceneCamera.setSize(width, height);
    // // testOrtho.setSize(width, height);

    // renderer.setSize(width, height);
    // postProcess.setSize(width, height);
    
    engine.setSize(width, height);
};

const createGLTFSkinnedMesh = async () => {
    gltfActor = await loadGLTF({ gpu, path: "./models/voxel-human-walk-fix-roll.gltf" });
    
    gltfActor.onStart = ({ actor }) => {
        if(actor.animator.animationClips) {
            actor.animator.animationClips.forEach(animationClip => {
                animationClip.loop = true;
            });
        }
    };
    
    gltfActor.transform.setScaling(Vector3.fill(4));
    
    skinningMeshAnimator = gltfActor.animator;
 
    skinningMeshes = gltfActor.transform.children[0].transform.children;
    
    skinningMeshes.forEach(skinningMesh => {
        skinningMesh.castShadow = true;
        skinningMesh.materials = [
            new PhongMaterial({
                gpu,
                diffuseMap: floorDiffuseMap,
                normalMap: floorNormalMap,
                // TODO: 毎回これ入れるのめんどいので共通化したい
                receiveShadow: true,
                uniforms: {
                    uJointMatrices: {
                        type: UniformTypes.Matrix4Array,
                        // TODO: 毎回これ入れるのめんどいので共通化したい
                        value: new Array(skinningMesh.boneCount).fill(0).map(i => Matrix4.identity()),
                    }
                }
            }),
            new Material({
                gpu,
                vertexShader: generateVertexShader({
                    jointNum: skinningMesh.boneCount,
                    receiveShadow: false,
                    isSkinning: true,
                    insertUniforms: `
uniform float uOutlineOffset;
                    `,
                    localPositionProcess: `
    localPosition = vec4(aPosition + aNormal * uOutlineOffset, 1.);
                    `,
                }),
                fragmentShader: `#version 300 es
               
                precision mediump float;
                
                out vec4 outColor;
                
                uniform vec4 uOutlineColor;
                
                void main() {
                    outColor = uOutlineColor;
                }
                `,
                uniforms: {
                    uJointMatrices: {
                        type: UniformTypes.Matrix4Array,
                        // TODO: 毎回これ入れるのめんどいので共通化したい
                        value: new Array(skinningMesh.boneCount).fill(0).map(i => Matrix4.identity()),
                    },
                    uOutlineColor: {
                        type: UniformTypes.Color,
                        value: outlineColor
                    },
                    uOutlineOffset: {
                        type: UniformTypes.Float,
                        value: outlineOffset
                    }
                },
                faceSide: FaceSide.Back,
                blendType: BlendTypes.Transparent
            }),          
        ];
    });
}

const main = async () => {
    const floorDiffuseImg = await loadImg("./images/blue_floor_tiles_01_diff_1k.png");
    floorDiffuseMap = new Texture({
        gpu,
        img: floorDiffuseImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const floorNormalImg = await loadImg("./images/blue_floor_tiles_01_nor_gl_1k.png");
    floorNormalMap = new Texture({
        gpu,
        img: floorNormalImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });
    
    const floorDiffuseWithCheckerAlphaImg = await loadImg("./images/blue_floor_tiles_01_diff_1k_with_checker_alpha.png");
    floorDiffuseWithCheckerAlphaMap = new Texture({
        gpu,
        img: floorDiffuseWithCheckerAlphaImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const images = {
        [CubeMapAxis.PositiveX]: "./images/px.png",
        [CubeMapAxis.NegativeX]: "./images/nx.png",
        [CubeMapAxis.PositiveY]: "./images/py.png",
        [CubeMapAxis.NegativeY]: "./images/ny.png",
        [CubeMapAxis.PositiveZ]: "./images/pz.png",
        [CubeMapAxis.NegativeZ]: "./images/nz.png",
    };
  
    cubeMap = await loadCubeMap({ gpu, images });
    
    await createGLTFSkinnedMesh()
    captureScene.add(gltfActor);
    
    const sphereGeometryData = await loadObj("./models/sphere-32-32.obj");
    reflectSkyboxMesh = new Mesh({
        geometry: new Geometry({
            gpu,
            attributes: {
                position: {
                    data: sphereGeometryData.positions,
                    size: 3
                },
                uv: {
                    data: sphereGeometryData.uvs,
                    size: 2,
                },
                normal: {
                    data: sphereGeometryData.normals,
                    size: 3
                },
            },
            indices: sphereGeometryData.indices,
            drawCount: sphereGeometryData.indices.length,
            castShadow: true,
        }),
        material: new Material({
            gpu,
            vertexShader: objModelVertexShader,
            fragmentShader: objModelFragmentShader,
            primitiveType: PrimitiveTypes.Triangles,
            uniforms: {
                uCubeTexture: {
                    type: UniformTypes.CubeMap,
                    value: null
                },
            }
        }),
        castShadow: true
    });
    reflectSkyboxMesh.onStart = ({ actor }) => {
        actor.material.uniforms.uCubeTexture.value = cubeMap;
        actor.transform.setTranslation(new Vector3(-4, 2, 0));
        actor.transform.setScaling(new Vector3(2, 2, 2));
    }

    const sphereTangentAndNormals = Geometry.createTangentsAndBinormals(sphereGeometryData.normals);
    alphaTestPhongMesh = new Mesh({
        geometry: new Geometry({
            gpu,
            attributes: {
                position: {
                    data: sphereGeometryData.positions,
                    size: 3
                },
                uv: {
                    data: sphereGeometryData.uvs,
                    size: 2,
                },
                normal: {
                    data: sphereGeometryData.normals,
                    size: 3
                },
                tangent: {
                    data: sphereTangentAndNormals.tangents,
                    size: 3
                },
                binormal: {
                    data: sphereTangentAndNormals.binormals,
                    size: 3
                },
            },
            indices: sphereGeometryData.indices,
            drawCount: sphereGeometryData.indices.length,
            castShadow: true,
        }),
        material: new PhongMaterial({
            gpu,
            diffuseMap: floorDiffuseWithCheckerAlphaMap,
            normalMap: floorNormalMap,
            receiveShadow: true,
            // queue: RenderQueues.AlphaTest,
            alphaTest: 0.5,
            faceSide: FaceSide.Double
        }),
        castShadow: true
    });
    alphaTestPhongMesh.onStart = ({ actor }) => {
        actor.transform.setTranslation(new Vector3(4, 2, 0));
        actor.transform.setScaling(new Vector3(2, 2, 2));
    }
    
    const skyboxMesh = new Skybox({
        gpu, cubeMap
    });

    const floorGeometry = new PlaneGeometry({gpu, calculateTangent: true, calculateBinormal: true});
    floorPlaneMesh = new Mesh({
        geometry: floorGeometry,
        material: new PhongMaterial({
            gpu,
            diffuseMap: floorDiffuseMap,
            normalMap: floorNormalMap,
            receiveShadow: true
        })
    });
    floorPlaneMesh.onStart = ({ actor }) => {
        actor.transform.setScaling(Vector3.fill(10));
        actor.transform.setRotationX(-90);
        actor.transform.setTranslation(new Vector3(0, 0, 0));
        actor.material.uniforms.uDiffuseMapUvScale.value = new Vector2(3, 3);
        actor.material.uniforms.uNormalMapUvScale.value = new Vector2(3, 3);
    }

    const checkerGeometry = new PlaneGeometry({gpu});
    checkerPlaneMesh = new Mesh({
        geometry: checkerGeometry,
        material: new Material({
            gpu,
            vertexShader: generateVertexShader(),
            fragmentShader: `#version 300 es
            
            precision mediump float;
            
            in vec2 vUv;
            
            out vec4 outColor;
            
            void main() {
                float size = 4.;
                float x = step(.5, fract(vUv.x * size / 2.));
                float y = step(.5, fract(vUv.y * size / 2.));
                float a = step(.5, x + y) - step(.5, x * y);
                if(a < .5) discard;
                // outColor = vec4(vUv, 0., 1);
                outColor = vec4(vec3(a), 1);
            }
            `,
            // queue: RenderQueues.AlphaTest,
        }),
    });
    checkerPlaneMesh.onStart = ({ actor }) => {
        actor.transform.setScaling(Vector3.fill(5));
        // actor.transform.setRotationX(-90);
        actor.transform.setTranslation(new Vector3(0, 5, 0));
        // actor.material.uniforms.uDiffuseMapUvScale.value = new Vector2(3, 3);
        // actor.material.uniforms.uNormalMapUvScale.value = new Vector2(3, 3);
    }
    
    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(alphaTestPhongMesh);
    captureScene.add(reflectSkyboxMesh);
    // captureScene.add(checkerPlaneMesh);

    captureSceneCamera.transform.position = targetCameraPosition.clone();
    captureSceneCamera.transform.lookAt(new Vector3(0, 5, 0));
    captureSceneCamera.postProcess.enabled = false;
    
    window.addEventListener("mousemove", onMouseMove);
    
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
  
    engine.onBeforeUpdate = () => {
        if(!debuggerGUI) initDebugger();
    };
    
    const tick = (time) => {
        engine.run(time);
        requestAnimationFrame(tick);
    }
    
    engine.start();
    requestAnimationFrame(tick);
}

function initDebugger() {

    debuggerGUI = new DebuggerGUI();

    debuggerGUI.addSliderDebugger({
        label: "light position x",
        minValue: -20,
        maxValue: 20,
        stepValue: 0.01,
        initialValue: directionalLight.transform.position.x,
        onChange: (value) => {
            const p = directionalLight.transform.position;
            directionalLight.transform.setTranslation(new Vector3(value, p.y, p.z));
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "light position y",
        minValue: 0.01,
        maxValue: 20,
        stepValue: 0.01,
        initialValue: directionalLight.transform.position.y,
        onChange: (value) => {
            const p = directionalLight.transform.position;
            directionalLight.transform.setTranslation(new Vector3(p.x, value, p.z));
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "light position z",
        minValue: -20,
        maxValue: 20,
        stepValue: 0.01,
        initialValue: directionalLight.transform.position.z,
        onChange: (value) => {
            const p = directionalLight.transform.position;
            directionalLight.transform.setTranslation(new Vector3(p.x, p.y, value));
        }
    });

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addPullDownDebugger({
        label: "animations",
        initialValue: skinningMeshAnimator.animationClips[1].name, // index: 0 のアニメーションがなぜか消せないのでとりあえず
        options: skinningMeshAnimator.animationClips.map(animationClip => ({ value: animationClip.name })),
        initialExec: true,
        onChange: (value) => {
            skinningMeshAnimator.play(value);
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "gltf actor position x",
        minValue: -10,
        maxValue: 10,
        stepValue: 0.01,
        initialValue: gltfActor.transform.position.x,
        onChange: (value) => {
            const p = gltfActor.transform.position;
            gltfActor.transform.setTranslation(new Vector3(value, p.y, p.z))
        }
    });
    debuggerGUI.addSliderDebugger({
        label: "gltf actor position y",
        minValue: -10,
        maxValue: 10,
        stepValue: 0.01,
        initialValue: gltfActor.transform.position.y,
        onChange: (value) => {
            const p = gltfActor.transform.position;
            gltfActor.transform.setTranslation(new Vector3(p.x, value, p.z))
        }
    });
    debuggerGUI.addSliderDebugger({
        label: "gltf actor position z",
        minValue: -10,
        maxValue: 10,
        stepValue: 0.01,
        initialValue: gltfActor.transform.position.z,
        onChange: (value) => {
            const p = gltfActor.transform.position;
            gltfActor.transform.setTranslation(new Vector3(p.x, p.y, value))
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "gltf actor rotation x",
        minValue: -180,
        maxValue: 180,
        stepValue: 0.01,
        initialValue: gltfActor.transform.rotation.x,
        onChange: (value) => {
            gltfActor.transform.setRotationX(value);
        }
    });
    debuggerGUI.addSliderDebugger({
        label: "gltf actor rotation y",
        minValue: -180,
        maxValue: 180,
        stepValue: 0.01,
        initialValue: gltfActor.transform.rotation.y,
        onChange: (value) => {
            gltfActor.transform.setRotationY(value);
        }
    });
    debuggerGUI.addSliderDebugger({
        label: "gltf actor rotation z",
        minValue: -180,
        maxValue: 180,
        stepValue: 0.01,
        initialValue: gltfActor.transform.rotation.z,
        onChange: (value) => {
            gltfActor.transform.setRotationZ(value);
        }
    });

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addColorDebugger({
        label: "outline color",
        initialValue: outlineColor,
        onChange: (value) => {
            outlineColor = Color.fromHex(value);
            outlineColor.a = outlineAlpha;
            skinningMeshes.forEach(skinningMesh => {
                skinningMesh.materials[1].uniforms.uOutlineColor.value = outlineColor;
            });
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "outline offset",
        initialValue: outlineOffset,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            outlineOffset = value;
            skinningMeshes.forEach(skinningMesh => {
                skinningMesh.materials[1].uniforms.uOutlineOffset.value = outlineOffset;
            });
        }
    });
    
    debuggerGUI.addSliderDebugger({
        label: "outline alpha",
        initialValue: outlineAlpha,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.01,
        onChange: (value) => {
            outlineAlpha = value;
            outlineColor.a = outlineAlpha;
            skinningMeshes.forEach(skinningMesh => {
                skinningMesh.materials[1].uniforms.uOutlineColor.value = outlineColor;
            });
        }
    });

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: "Enabled Post Process",
        initialValue: captureSceneCamera.postProcess.enabled,
        onChange: (value) => {
            captureSceneCamera.postProcess.enabled = value;
        }
    });

    wrapperElement.appendChild(debuggerGUI.domElement);
}

main();
