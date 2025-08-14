// import { AttributeNames } from '@/PaleGL/constants';
// import { Geometry } from '@/PaleGL/geometries/geometry.ts';
// import { calculateFPSCounter, createFPSCounter, FpsCounter } from '@/PaleGL/utilities/fpsCounter.ts';
// import { getGeometryAttributeByName } from '@/PaleGL/geometries/geometryBehaviours.ts';
//
// type PassInfo = { passLabel: string; vertexCount: number };
//
// type StatsArgs = {
//     wrapperElement?: HTMLElement;
//     showPassDetails?: boolean;
//     showStats?: boolean;
//     showFPS?: boolean;
//     showPipeline?: boolean;
// };
//
// export type Stats = ReturnType<typeof createStats>;
//
// export function createStats(args: StatsArgs = {}) {
//     const { wrapperElement, showStats = true, showPipeline = true, showPassDetails = true } = args;
//
//     const _domElement = document.createElement('div');
//     let _passes: { groupLabel: string; passInfos: PassInfo[] }[] = [];
//     let _drawVertexCount = 0;
//     let _drawCallCount = 0;
//     const _showPassDetails = !!showPassDetails;
//     const _showStats: boolean = !!showStats;
//     const _showFPS: boolean = true;
//     const _showPipeline: boolean = !!showPipeline;
//
//     const _fpsCounter: FpsCounter = createFPSCounter();
//
//     _domElement.style.cssText = `
// position: absolute;
// top: 0;
// left: 0;
// padding: 0.2em 0.5em;
// font-size: 9px;
// color: white;
// font-weight: bold;
// text-shadow: rgba(0, 0, 0, 0.7) 1px 1px;
// white-space: break-spaces;
// `;
//
//     // fps counter
//     const _fpsCounterView = document.createElement('p');
//     _domElement.appendChild(_fpsCounterView);
//
//     // pipe line wrapper
//     const _pipelineWrapper = document.createElement('div');
//     _domElement.appendChild(_pipelineWrapper);
//
//     // pass info
//     const _passInfoView = document.createElement('p');
//     _pipelineWrapper.appendChild(_passInfoView);
//
//     // total vertex count
//     const _drawVertexCountView = document.createElement('p');
//     _pipelineWrapper.appendChild(_drawVertexCountView);
//
//     // total draw call count
//     const _drawCallCountView = document.createElement('p');
//     _pipelineWrapper.appendChild(_drawCallCountView);
//
//     (wrapperElement || document.body).appendChild(_domElement);
//
//     const clear = () => {
//         _passes = [];
//         _drawVertexCount = 0;
//         _drawCallCount = 0;
//     };
//
//     const addPassInfo = (groupLabel: string, passLabel: string, geometry: Geometry) => {
//         const passIndex = _passes.findIndex((elem) => elem.groupLabel === groupLabel);
//         const positionAttribute = getGeometryAttributeByName(geometry, AttributeNames.Position);
//         if (!positionAttribute) {
//             console.error('invalid position attribute');
//         }
//         const vertexCount = positionAttribute!.data.length / 3;
//         if (passIndex < 0) {
//             _addPassGroup(groupLabel, { passLabel: passLabel, vertexCount });
//             return;
//         }
//         _passes[passIndex].passInfos.push({
//             passLabel,
//             vertexCount,
//         });
//     };
//
//     const addDrawVertexCount = (geometry: Geometry) => {
//         const positionAttribute = getGeometryAttributeByName(geometry, AttributeNames.Position);
//         if (!positionAttribute) {
//             return;
//         }
//         _drawVertexCount += positionAttribute.data.length / 3;
//     };
//
//     const incrementDrawCall = () => {
//         _drawCallCount++;
//     };
//
//     const update = (time: number) => {
//         calculateFPSCounter(_fpsCounter, time);
//         _updateView();
//     };
//
//     const _updateView = () => {
//         _domElement.style.display = _showStats ? 'block' : 'none';
//         _fpsCounterView.style.display = _showFPS ? 'block' : 'none';
//         _pipelineWrapper.style.display = _showPipeline ? 'block' : 'none';
//
//         _fpsCounterView.textContent = `FPS: ${Math.floor(_fpsCounter.currentFPS)}`;
//
//         const passesStrings = [];
//         passesStrings.push('-------------');
//         for (let i = 0; i < _passes.length; i++) {
//             let totalDrawCalls = 0;
//             let totalVertexCount = 0;
//             const queue: string[] = [];
//             for (let j = 0; j < _passes[i].passInfos.length; j++) {
//                 const passInfo = _passes[i].passInfos[j];
//                 if (_showPassDetails) {
//                     const str = `${passInfo.passLabel} - vertex count: ${passInfo.vertexCount}`;
//                     queue.push(str);
//                 }
//                 totalDrawCalls++;
//                 totalVertexCount += passInfo.vertexCount;
//             }
//             queue.unshift(
//                 `[${_passes[i].groupLabel}]\ndraw calls: ${totalDrawCalls}, vertex count: ${totalVertexCount}`
//             );
//             passesStrings.push(...queue);
//         }
//         passesStrings.push('-------------');
//         _passInfoView.textContent = passesStrings.join('\n');
//         _drawVertexCountView.textContent = `vertex count: ${_drawVertexCount}`;
//         _drawCallCountView.textContent = `draw call count: ${_drawCallCount}`;
//     };
//
//     const _addPassGroup = (groupLabel: string, passInfo: PassInfo) => {
//         _passes.push({
//             groupLabel: groupLabel,
//             passInfos: [passInfo],
//         });
//     };
//
//     return {
//         addPassInfo,
//         addDrawVertexCount,
//         incrementDrawCall,
//         update,
//         clear,
//     };
// }

import { AttributeNames } from '@/PaleGL/constants';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { calculateFPSCounter, createFPSCounter, FpsCounter } from '@/PaleGL/utilities/fpsCounter.ts';
import { getGeometryAttributeByName } from '@/PaleGL/geometries/geometryBehaviours.ts';

type PassInfo = { passLabel: string; vertexCount: number };

type StatsArgs = {
    wrapperElement?: HTMLElement;
    showPassDetails?: boolean;
    showStats?: boolean;
    showFPS?: boolean;
    showPipeline?: boolean;
};

export type Stats = ReturnType<typeof createStats>;

export function createStats(args: StatsArgs = {}) {
    const { wrapperElement, showStats = true, showPipeline = true, showPassDetails = true } = args;

    const domElement = document.createElement('div');
    const passes: { groupLabel: string; passInfos: PassInfo[] }[] = [];
    const drawVertexCount = 0;
    const drawCallCount = 0;
    const showFPS: boolean = true;

    const fpsCounter: FpsCounter = createFPSCounter();

    domElement.style.cssText = `
position: absolute;
top: 0;
left: 0;
padding: 0.2em 0.5em;
font-size: 9px;
color: white;
font-weight: bold;
text-shadow: rgba(0, 0, 0, 0.7) 1px 1px;
white-space: break-spaces;
`;

    // fps counter
    const fpsCounterView = document.createElement('p');
    domElement.appendChild(fpsCounterView);

    // pipe line wrapper
    const pipelineWrapper = document.createElement('div');
    domElement.appendChild(pipelineWrapper);

    // pass info
    const passInfoView = document.createElement('p');
    pipelineWrapper.appendChild(passInfoView);

    // total vertex count
    const drawVertexCountView = document.createElement('p');
    pipelineWrapper.appendChild(drawVertexCountView);

    // total draw call count
    const drawCallCountView = document.createElement('p');
    pipelineWrapper.appendChild(drawCallCountView);

    (wrapperElement || document.body).appendChild(domElement);

    return {
        passes,
        fpsCounter,
        showStats,
        showPipeline,
        showPassDetails,
        showFPS,
        domElement,
        fpsCounterView,
        pipelineWrapper,
        passInfoView,
        drawVertexCount,
        drawCallCount,
        drawVertexCountView,
        drawCallCountView,
    };
}

export const clearStats = (stats: Stats) => {
    stats.passes = [];
    stats.drawVertexCount = 0;
    stats.drawCallCount = 0;
};

export const addPassInfoStats = (stats: Stats, groupLabel: string, passLabel: string, geometry: Geometry) => {
    const passIndex = stats.passes.findIndex((elem) => elem.groupLabel === groupLabel);
    const positionAttribute = getGeometryAttributeByName(geometry, AttributeNames.Position);
    if (!positionAttribute) {
        console.error('invalid position attribute');
    }
    const vertexCount = positionAttribute!.data.length / 3;
    if (passIndex < 0) {
        addPassGroupStats(stats, groupLabel, { passLabel: passLabel, vertexCount });
        return;
    }
    stats.passes[passIndex].passInfos.push({
        passLabel,
        vertexCount,
    });
};

export const addDrawVertexCountStats = (stats: Stats, geometry: Geometry) => {
    const positionAttribute = getGeometryAttributeByName(geometry, AttributeNames.Position);
    if (!positionAttribute) {
        return;
    }
    stats.drawVertexCount += positionAttribute.data.length / 3;
};

export const incrementDrawCallStats = (stats: Stats) => {
    stats.drawCallCount++;
};

export const updateStats = (stats: Stats, time: number) => {
    calculateFPSCounter(stats.fpsCounter, time);
    updateStatsView(stats);
};

const updateStatsView = (stats: Stats) => {
    stats.domElement.style.display = stats.showStats ? 'block' : 'none';
    stats.fpsCounterView.style.display = stats.showFPS ? 'block' : 'none';
    stats.pipelineWrapper.style.display = stats.showPipeline ? 'block' : 'none';

    stats.fpsCounterView.textContent = `FPS: ${Math.floor(stats.fpsCounter.currentFPS)}`;

    const passesStrings = [];
    passesStrings.push('-------------');
    for (let i = 0; i < stats.passes.length; i++) {
        let totalDrawCalls = 0;
        let totalVertexCount = 0;
        const queue: string[] = [];
        for (let j = 0; j < stats.passes[i].passInfos.length; j++) {
            const passInfo = stats.passes[i].passInfos[j];
            if (stats.showPassDetails) {
                const str = `${passInfo.passLabel} - vertex count: ${passInfo.vertexCount}`;
                queue.push(str);
            }
            totalDrawCalls++;
            totalVertexCount += passInfo.vertexCount;
        }
        queue.unshift(
            `[${stats.passes[i].groupLabel}]\ndraw calls: ${totalDrawCalls}, vertex count: ${totalVertexCount}`
        );
        passesStrings.push(...queue);
    }
    passesStrings.push('-------------');
    stats.passInfoView.textContent = passesStrings.join('\n');
    stats.drawVertexCountView.textContent = `vertex count: ${stats.drawVertexCount}`;
    stats.drawCallCountView.textContent = `draw call count: ${stats.drawCallCount}`;
};

export const addPassGroupStats = (stats: Stats, groupLabel: string, passInfo: PassInfo) => {
    stats.passes.push({
        groupLabel: groupLabel,
        passInfos: [passInfo],
    });
};
