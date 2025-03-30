import {
    addColorDebugger,
    addDebuggerBorderSpacer, addDebugGroup,
    addSliderDebugger,
    addToggleDebugger,
    createDebuggerGUI, DebuggerGUI,
} from '@/PaleGL/utilities/debuggerGUI.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';
import {
    BufferVisualizerPass,
    hideBufferVisualizerPassDom,
    showBufferVisualizerPassDom,
} from '@/PaleGL/postprocess/bufferVisualizerPass.ts';
import { setV3x, setV3y, setV3z, v3x, v3y, v3z } from '@/PaleGL/math/vector3.ts';
import {
    getRotatorDegreeX,
    getRotatorDegreeY, getRotatorDegreeZ,
    setRotatorRotationDegreeX,
    setRotatorRotationDegreeY, setRotatorRotationDegreeZ,
} from '@/PaleGL/math/rotator.ts';
import { createColorFromHex, getColorHexCoord } from '@/PaleGL/math/color.ts';
import { OrbitCameraController } from '@/PaleGL/core/orbitCameraController.ts';
import { DirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/objectSpaceRaymarchMesh.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';

export function initDebugger(
    wrapperElement: HTMLElement,
    {
        debuggerStates,
        renderer,
        orbitCameraController,
        bufferVisualizerPass,
        directionalLight,
        objectSpaceRaymarchMesh,
    }: {
        debuggerStates: {
            morphRate: number;
            morphingEnabled: boolean;
        },
        renderer: Renderer,
        orbitCameraController: OrbitCameraController,
        bufferVisualizerPass: BufferVisualizerPass,
        directionalLight: DirectionalLight,
        objectSpaceRaymarchMesh: ObjectSpaceRaymarchMesh
    }
): DebuggerGUI {
    const debuggerGUI = createDebuggerGUI();

    //
    // debugger states
    //

    addSliderDebugger(debuggerGUI, {
        label: 'morph rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: debuggerStates.morphRate,
        onChange: (value) => {
            debuggerStates.morphRate = value * 9;
        },
    });

    addToggleDebugger(debuggerGUI, {
        label: 'auto morph',
        initialValue: debuggerStates.morphingEnabled,
        onChange: (value) => (debuggerStates.morphingEnabled = value),
    });


    //
    // orbit controls
    //

    addDebuggerBorderSpacer(debuggerGUI);

    addToggleDebugger(debuggerGUI, {
        label: 'orbit controls enabled',
        initialValue: orbitCameraController.enabled,
        onChange: (value) => (orbitCameraController.enabled = value),
    });

    //
    // show buffers
    //

    if (isDevelopment()) {
        addDebuggerBorderSpacer(debuggerGUI);

        addToggleDebugger(debuggerGUI, {
            label: 'show buffers',
            initialValue: bufferVisualizerPass.enabled,
            onChange: (value) => {
                bufferVisualizerPass.enabled = value;
                if (value) {
                    showBufferVisualizerPassDom(bufferVisualizerPass);
                } else {
                    hideBufferVisualizerPassDom(bufferVisualizerPass);
                }
            },
        });
    }

    //
    // directional light
    //

    if (isDevelopment()) {
        addDebuggerBorderSpacer(debuggerGUI);

        const directionalLightDebuggerGroup = addDebugGroup(debuggerGUI, 'directional light', false);

        addSliderDebugger(directionalLightDebuggerGroup, {
            label: 'intensity',
            minValue: 0,
            maxValue: 4,
            stepValue: 0.001,
            initialValue: directionalLight.intensity,
            onChange: (value) => {
                directionalLight.intensity = value;
            },
        });

        addSliderDebugger(directionalLightDebuggerGroup, {
            label: 'pos x',
            minValue: -10,
            maxValue: 10,
            stepValue: 0.001,
            initialValue: v3x(directionalLight.transform.position),
            onChange: (value) => {
                setV3x(directionalLight.transform.position, value);
            },
        });

        addSliderDebugger(directionalLightDebuggerGroup, {
            label: 'pos y',
            minValue: 0,
            maxValue: 10,
            stepValue: 0.001,
            initialValue: v3y(directionalLight.transform.position),
            onChange: (value) => {
                setV3y(directionalLight.transform.position, value);
            },
        });

        addSliderDebugger(directionalLightDebuggerGroup, {
            label: 'pos z',
            minValue: -10,
            maxValue: 10,
            stepValue: 0.001,
            initialValue: v3z(directionalLight.transform.position),
            onChange: (value) => {
                setV3z(directionalLight.transform.position, value);
            },
        });
    }

    //
    // object space raymarch
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const objectSpaceRaymarchMeshDebuggerGroup = addDebugGroup(debuggerGUI, 'object space raymarch', false);

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3x(objectSpaceRaymarchMesh.transform.position),
        onChange: (value) => {
            setV3x(objectSpaceRaymarchMesh.transform.position, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3y(objectSpaceRaymarchMesh.transform.position),
        onChange: (value) => {
            setV3y(objectSpaceRaymarchMesh.transform.position, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3z(objectSpaceRaymarchMesh.transform.position),
        onChange: (value) => {
            setV3z(objectSpaceRaymarchMesh.transform.position, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale x',
        minValue: 0,
        maxValue: 15,
        stepValue: 0.001,
        initialValue: v3x(objectSpaceRaymarchMesh.transform.scale),
        onChange: (value) => {
            setV3x(objectSpaceRaymarchMesh.transform.scale, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale y',
        minValue: 0,
        maxValue: 15,
        stepValue: 0.001,
        initialValue: v3y(objectSpaceRaymarchMesh.transform.scale),
        onChange: (value) => {
            setV3y(objectSpaceRaymarchMesh.transform.scale, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale z',
        minValue: 0,
        maxValue: 15,
        stepValue: 0.001,
        initialValue: v3z(objectSpaceRaymarchMesh.transform.scale),
        onChange: (value) => {
            setV3z(objectSpaceRaymarchMesh.transform.scale, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation x',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: getRotatorDegreeX(objectSpaceRaymarchMesh.transform.rotation),
        onChange: (value) => {
            setRotatorRotationDegreeX(objectSpaceRaymarchMesh.transform.rotation, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation y',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: getRotatorDegreeY(objectSpaceRaymarchMesh.transform.rotation),
        onChange: (value) => {
            setRotatorRotationDegreeY(objectSpaceRaymarchMesh.transform.rotation, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation z',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: getRotatorDegreeZ(objectSpaceRaymarchMesh.transform.rotation),
        onChange: (value) => {
            setRotatorRotationDegreeZ(objectSpaceRaymarchMesh.transform.rotation, value);
        },
    });

    //
    // ssao
    // TODO: ssao pass の参照を renderer に変える
    //

    if (isDevelopment()) {
        addDebuggerBorderSpacer(debuggerGUI);

        const ssaoDebuggerGroup = addDebugGroup(debuggerGUI, 'ssao', false);

        addSliderDebugger(ssaoDebuggerGroup, {
            label: 'ssao occlusion sample length',
            minValue: 0.01,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ambientOcclusionPass.occlusionSampleLength,
            onChange: (value) => {
                renderer.ambientOcclusionPass.occlusionSampleLength = value;
            },
        });

        addSliderDebugger(ssaoDebuggerGroup, {
            label: 'ssao occlusion bias',
            minValue: 0.0001,
            maxValue: 0.01,
            stepValue: 0.0001,
            initialValue: renderer.ambientOcclusionPass.occlusionBias,
            onChange: (value) => {
                renderer.ambientOcclusionPass.occlusionBias = value;
            },
        });

        addSliderDebugger(ssaoDebuggerGroup, {
            label: 'ssao min distance',
            minValue: 0,
            maxValue: 0.1,
            stepValue: 0.001,
            initialValue: renderer.ambientOcclusionPass.occlusionMinDistance,
            onChange: (value) => {
                renderer.ambientOcclusionPass.occlusionMinDistance = value;
            },
        });

        addSliderDebugger(ssaoDebuggerGroup, {
            label: 'ssao max distance',
            minValue: 0,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ambientOcclusionPass.occlusionMaxDistance,
            onChange: (value) => {
                renderer.ambientOcclusionPass.occlusionMaxDistance = value;
            },
        });

        addColorDebugger(ssaoDebuggerGroup, {
            label: 'ssao color',
            initialValue: getColorHexCoord(renderer.ambientOcclusionPass.occlusionColor),
            onChange: (value) => {
                renderer.ambientOcclusionPass.occlusionColor = createColorFromHex(value);
            },
        });

        addSliderDebugger(ssaoDebuggerGroup, {
            label: 'ssao occlusion power',
            minValue: 0.5,
            maxValue: 4,
            stepValue: 0.01,
            initialValue: renderer.ambientOcclusionPass.occlusionPower,
            onChange: (value) => {
                renderer.ambientOcclusionPass.occlusionPower = value;
            },
        });

        addSliderDebugger(ssaoDebuggerGroup, {
            label: 'ssao occlusion strength',
            minValue: 0,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ambientOcclusionPass.occlusionStrength,
            onChange: (value) => {
                renderer.ambientOcclusionPass.occlusionStrength = value;
            },
        });

        addSliderDebugger(ssaoDebuggerGroup, {
            label: 'ssao blend rate',
            minValue: 0,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ambientOcclusionPass.blendRate,
            onChange: (value) => {
                renderer.ambientOcclusionPass.blendRate = value;
            },
        });
    }

    //
    // light shaft
    //

    if (isDevelopment()) {
        addDebuggerBorderSpacer(debuggerGUI);

        const lightShaftDebuggerGroup = addDebugGroup(debuggerGUI, 'light shaft', false);

        addSliderDebugger(lightShaftDebuggerGroup, {
            label: 'blend rate',
            minValue: 0,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.lightShaftPass.blendRate,
            onChange: (value) => {
                renderer.lightShaftPass.blendRate = value;
            },
        });

        addSliderDebugger(lightShaftDebuggerGroup, {
            label: 'pass scale',
            minValue: 0.001,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.lightShaftPass.passScaleBase,
            onChange: (value) => {
                renderer.lightShaftPass.passScaleBase = value;
            },
        });

        addSliderDebugger(lightShaftDebuggerGroup, {
            label: 'ray step strength',
            minValue: 0.001,
            maxValue: 0.05,
            stepValue: 0.001,
            initialValue: renderer.lightShaftPass.rayStepStrength,
            onChange: (value) => {
                renderer.lightShaftPass.rayStepStrength = value;
            },
        });
    }

    //
    // light volume pass
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const volumetricLightDebuggerGroup = addDebugGroup(debuggerGUI, 'volumetric light', false);

    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'ray step',
        initialValue: renderer.volumetricLightPass.rayStep,
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.rayStep = value;
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'density multiplier',
        initialValue: renderer.volumetricLightPass.densityMultiplier,
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.densityMultiplier = value;
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'jitter size x',
        initialValue: v3x(renderer.volumetricLightPass.rayJitterSize),
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            setV3x(renderer.volumetricLightPass.rayJitterSize, value);
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'jitter size y',
        initialValue: v3y(renderer.volumetricLightPass.rayJitterSize),
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            setV3y(renderer.volumetricLightPass.rayJitterSize, value);
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'blend rate',
        initialValue: renderer.volumetricLightPass.blendRate,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.blendRate = value;
        },
    });

    //
    // fog
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const fogDebuggerGroup = addDebugGroup(debuggerGUI, 'fog', false);

    // fogDebuggerGroup.addToggleDebugger({
    //     label: 'fog pass enabled',
    //     initialValue: renderer.lightShaftPass.enabled,
    //     onChange: (value) => (renderer.lightShaftPass.enabled = value),
    // });

    // return;

    addColorDebugger(fogDebuggerGroup, {
        label: 'fog color',
        initialValue: getColorHexCoord(renderer.fogPass.fogColor),
        onChange: (value) => {
            renderer.fogPass.fogColor = createColorFromHex(value);
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'strength',
        minValue: 0,
        maxValue: 0.2,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogStrength,
        onChange: (value) => {
            renderer.fogPass.fogStrength = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'density',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogDensity,
        onChange: (value) => {
            renderer.fogPass.fogDensity = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'attenuation',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogDensityAttenuation,
        onChange: (value) => {
            renderer.fogPass.fogDensityAttenuation = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'fog end height',
        minValue: -5,
        maxValue: 5,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogEndHeight,
        onChange: (value) => {
            renderer.fogPass.fogEndHeight = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog start',
        minValue: 0,
        maxValue: 1000,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.distanceFogPower,
        onChange: (value) => {
            renderer.fogPass.distanceFogStart = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog end',
        minValue: 0,
        maxValue: 1000,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.distanceFogEnd,
        onChange: (value) => {
            renderer.fogPass.distanceFogEnd = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog power',
        minValue: 0,
        maxValue: 0.2,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.distanceFogPower,
        onChange: (value) => {
            renderer.fogPass.distanceFogPower = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'sss fog rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.fogPass.sssFogRate,
        onChange: (value) => {
            renderer.fogPass.sssFogRate = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.blendRate,
        onChange: (value) => {
            renderer.fogPass.blendRate = value;
        },
    });

    //
    // depth of field
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const dofDebuggerGroup = addDebugGroup(debuggerGUI, 'depth of field', false);

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF focus distance',
        minValue: 0.1,
        maxValue: 100,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.focusDistance,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusDistance = value;
        },
    });

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF focus range',
        minValue: 0.1,
        maxValue: 30,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.focusRange,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusRange = value;
        },
    });

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF bokeh radius',
        minValue: 0.01,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.bokehRadius,
        onChange: (value) => {
            renderer.depthOfFieldPass.bokehRadius = value;
        },
    });

    //
    // bloom
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const bloomDebuggerGroup = addDebugGroup(debuggerGUI, 'bloom', false);

    addSliderDebugger(bloomDebuggerGroup, {
        label: 'bloom amount',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.bloomAmount,
        onChange: (value) => {
            renderer.bloomPass.bloomAmount = value;
        },
    });

    addSliderDebugger(bloomDebuggerGroup, {
        label: 'bloom threshold',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.threshold,
        onChange: (value) => {
            renderer.bloomPass.threshold = value;
        },
    });

    addSliderDebugger(bloomDebuggerGroup, {
        label: 'bloom tone',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.tone,
        onChange: (value) => {
            renderer.bloomPass.tone = value;
        },
    });

    //
    // streak debuggers
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const streakDebuggerGroup = addDebugGroup(debuggerGUI, 'streak', false);

    addSliderDebugger(streakDebuggerGroup, {
        label: 'threshold',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.streakPass.threshold,
        onChange: (value) => {
            renderer.streakPass.threshold = value;
        },
    });
    addSliderDebugger(streakDebuggerGroup, {
        label: 'vertical scale',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.streakPass.verticalScale,
        onChange: (value) => {
            renderer.streakPass.verticalScale = value;
        },
    });
    addSliderDebugger(streakDebuggerGroup, {
        label: 'horizontal scale',
        minValue: 0,
        maxValue: 2,
        stepValue: 0.001,
        initialValue: renderer.streakPass.horizontalScale,
        onChange: (value) => {
            renderer.streakPass.horizontalScale = value;
        },
    });

    addSliderDebugger(streakDebuggerGroup, {
        label: 'stretch',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.streakPass.stretch,
        onChange: (value) => {
            renderer.streakPass.stretch = value;
        },
    });
    addColorDebugger(streakDebuggerGroup, {
        label: 'color',
        initialValue: getColorHexCoord(renderer.streakPass.color),
        onChange: (value) => {
            renderer.streakPass.color = createColorFromHex(value);
        },
    });
    addSliderDebugger(streakDebuggerGroup, {
        label: 'intensity',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.streakPass.intensity,
        onChange: (value) => {
            renderer.streakPass.intensity = value;
        },
    });

    //
    // ssr debuggers
    //

    if (isDevelopment()) {
        addDebuggerBorderSpacer(debuggerGUI);

        const ssrDebuggerGroup = addDebugGroup(debuggerGUI, 'ssr', false);

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'depth bias',
            minValue: 0.001,
            maxValue: 0.1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.rayDepthBias,
            onChange: (value) => {
                renderer.ssrPass.rayDepthBias = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'ray nearest distance',
            minValue: 0.001,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.rayNearestDistance,
            onChange: (value) => {
                renderer.ssrPass.rayNearestDistance = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'ray max distance',
            minValue: 0.001,
            maxValue: 10,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.rayMaxDistance,
            onChange: (value) => {
                renderer.ssrPass.rayMaxDistance = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'ray thickness',
            minValue: 0.001,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionRayThickness,
            onChange: (value) => {
                renderer.ssrPass.reflectionRayThickness = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'jitter size x',
            minValue: 0.001,
            maxValue: 0.1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionRayJitterSizeX,
            onChange: (value) => {
                renderer.ssrPass.reflectionRayJitterSizeX = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'jitter size y',
            minValue: 0.001,
            maxValue: 0.1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionRayJitterSizeY,
            onChange: (value) => {
                renderer.ssrPass.reflectionRayJitterSizeY = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'roughness power',
            minValue: 0,
            maxValue: 5,
            stepValue: 0.01,
            initialValue: renderer.ssrPass.reflectionRoughnessPower,
            onChange: (value) => {
                renderer.ssrPass.reflectionRoughnessPower = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'fade min distance',
            minValue: 0.001,
            maxValue: 10,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionFadeMinDistance,
            onChange: (value) => {
                renderer.ssrPass.reflectionFadeMinDistance = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'fade max distance',
            minValue: 0.001,
            maxValue: 10,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionFadeMaxDistance,
            onChange: (value) => {
                renderer.ssrPass.reflectionFadeMaxDistance = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'edge fade factor min x',
            minValue: 0.001,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMinX,
            onChange: (value) => {
                renderer.ssrPass.reflectionScreenEdgeFadeFactorMinX = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'edge fade factor max x',
            minValue: 0.001,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxX,
            onChange: (value) => {
                renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxX = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'edge fade factor min y',
            minValue: 0.001,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMinY,
            onChange: (value) => {
                renderer.ssrPass.reflectionScreenEdgeFadeFactorMinY = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'edge fade factor max y',
            minValue: 0.001,
            maxValue: 1,
            stepValue: 0.001,
            initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxY,
            onChange: (value) => {
                renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxY = value;
            },
        });

        addSliderDebugger(ssrDebuggerGroup, {
            label: 'additional rate',
            minValue: 0.01,
            maxValue: 1,
            stepValue: 0.01,
            initialValue: renderer.ssrPass.reflectionAdditionalRate,
            onChange: (value) => {
                renderer.ssrPass.reflectionAdditionalRate = value;
            },
        });
    }

    //
    // chromatic aberration
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const chromaticAberrationDebuggerGroup = addDebugGroup(debuggerGUI, 'chromatic aberration', false);

    addSliderDebugger(chromaticAberrationDebuggerGroup, {
        label: 'scale',
        minValue: 0,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.chromaticAberrationPass.scale,
        onChange: (value) => (renderer.chromaticAberrationPass.scale = value),
    });

    //
    // vignette
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const vignetteDebuggerGroup = addDebugGroup(debuggerGUI, 'vignette', false);
    addSliderDebugger(vignetteDebuggerGroup, {
        label: 'radius from',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.vignetteRadiusFrom,
        onChange: (value) => (renderer.vignettePass.vignetteRadiusFrom = value),
    });
    addSliderDebugger(vignetteDebuggerGroup, {
        label: 'radius to',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.vignetteRadiusTo,
        onChange: (value) => (renderer.vignettePass.vignetteRadiusTo = value),
    });
    addSliderDebugger(vignetteDebuggerGroup, {
        label: 'power',
        minValue: 0.01,
        maxValue: 8,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.vignettePower,
        onChange: (value) => (renderer.vignettePass.vignettePower = value),
    });
    addSliderDebugger(vignetteDebuggerGroup, {
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.blendRate,
        onChange: (value) => (renderer.vignettePass.blendRate = value),
    });

    //
    // fxaa
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const fxaaDebuggerGroup = addDebugGroup(debuggerGUI, 'fxaa', false);

    addToggleDebugger(fxaaDebuggerGroup, {
        label: 'fxaa pass enabled',
        initialValue: renderer.fxaaPass.enabled,
        onChange: (value) => (renderer.fxaaPass.enabled = value),
    });

    //
    // add debugger ui
    //

    wrapperElement.appendChild(debuggerGUI.rootElement);
    
    return debuggerGUI;
}
