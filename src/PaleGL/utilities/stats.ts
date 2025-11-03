import { ATTRIBUTE_NAME_POSITION } from '@/PaleGL/constants';
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

export const createStats = (args: StatsArgs = {}) => {
    const { wrapperElement, showStats = true, showPipeline = true, showPassDetails = true } = args;

    const domElement = document.createElement('div');
    const passes: { groupLabel: string; passInfos: PassInfo[] }[] = [];
    const passGroupStates = new Map<string, boolean>();
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
    const passInfoView = document.createElement('div');
    pipelineWrapper.appendChild(passInfoView);

    // total vertex count
    const drawVertexCountView = document.createElement('p');
    pipelineWrapper.appendChild(drawVertexCountView);

    // total draw call count
    const drawCallCountView = document.createElement('p');
    pipelineWrapper.appendChild(drawCallCountView);

    const stats = {
        passes,
        passGroupStates,
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

    // イベント委譲でパスグループの折り畳みを制御
    passInfoView.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.dataset.groupLabel !== undefined) {
            const groupLabel = target.dataset.groupLabel;
            const currentState = stats.passGroupStates.get(groupLabel) ?? false;
            stats.passGroupStates.set(groupLabel, !currentState);
            updateStatsView(stats);
        }
    });

    (wrapperElement || document.body).appendChild(domElement);

    return stats;
}

export const clearStats = (stats: Stats) => {
    stats.passes = [];
    stats.drawVertexCount = 0;
    stats.drawCallCount = 0;
};

export const addPassInfoStats = (stats: Stats, groupLabel: string, passLabel: string, geometry: Geometry) => {
    const passIndex = stats.passes.findIndex((elem) => elem.groupLabel === groupLabel);
    const positionAttribute = getGeometryAttributeByName(geometry, ATTRIBUTE_NAME_POSITION);
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
    const positionAttribute = getGeometryAttributeByName(geometry, ATTRIBUTE_NAME_POSITION);
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

    // passInfoViewをクリア
    stats.passInfoView.innerHTML = '';

    // 上部の区切り線
    const separatorTop = document.createElement('div');
    separatorTop.textContent = '-------------';
    stats.passInfoView.appendChild(separatorTop);

    // 各パスグループを処理
    for (let i = 0; i < stats.passes.length; i++) {
        const groupLabel = stats.passes[i].groupLabel;
        const isExpanded = stats.passGroupStates.get(groupLabel) ?? false;

        // 統計情報を計算
        let totalDrawCalls = 0;
        let totalVertexCount = 0;
        for (let j = 0; j < stats.passes[i].passInfos.length; j++) {
            totalDrawCalls++;
            totalVertexCount += stats.passes[i].passInfos[j].vertexCount;
        }

        // ヘッダー（クリック可能）
        const header = document.createElement('div');
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.dataset.groupLabel = groupLabel;

        const arrow = isExpanded ? '▼' : '▶';
        header.textContent = `${arrow} [${stats.passes[i].groupLabel}] draw calls: ${totalDrawCalls}, vertex count: ${totalVertexCount}`;

        stats.passInfoView.appendChild(header);

        // 詳細部分（展開時のみ）
        if (isExpanded && stats.showPassDetails) {
            for (let j = 0; j < stats.passes[i].passInfos.length; j++) {
                const passInfo = stats.passes[i].passInfos[j];
                const detailLine = document.createElement('div');
                detailLine.style.paddingLeft = '1em';
                detailLine.textContent = `${passInfo.passLabel} - vertex count: ${passInfo.vertexCount}`;
                stats.passInfoView.appendChild(detailLine);
            }
        }
    }

    // 下部の区切り線
    const separatorBottom = document.createElement('div');
    separatorBottom.textContent = '-------------';
    stats.passInfoView.appendChild(separatorBottom);
    stats.drawVertexCountView.textContent = `vertex count: ${stats.drawVertexCount}`;
    stats.drawCallCountView.textContent = `draw call count: ${stats.drawCallCount}`;
};

export const addPassGroupStats = (stats: Stats, groupLabel: string, passInfo: PassInfo) => {
    stats.passes.push({
        groupLabel: groupLabel,
        passInfos: [passInfo],
    });
};
