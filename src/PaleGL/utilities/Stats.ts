import { AttributeNames } from '@/PaleGL/constants';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { FPSCounter } from '@/PaleGL/utilities/FPSCounter.ts';

type PassInfo = { passLabel: string; vertexCount: number };

type StatsArgs = {
    wrapperElement?: HTMLElement;
    showPassDetails?: boolean;
    showStats?: boolean;
    showFPS?: boolean;
    showPipeline?: boolean;
};

export class Stats {
    domElement;
    passes: { groupLabel: string; passInfos: PassInfo[] }[] = [];
    pipelineWrapper;
    passInfoView;
    drawVertexCountView;
    drawCallCountView;
    drawVertexCount = 0;
    drawCallCount = 0;
    showPassDetails = false;
    showStats: boolean = true;
    showFPS: boolean = true;
    showPipeline: boolean = true;

    fpsCounter: FPSCounter;
    fpsCounterView;

    /**
     *
     * @param args
     */
    constructor(args: StatsArgs = {}) {
        const { wrapperElement, showStats = true, showPipeline = true, showPassDetails = true } = args;

        this.showStats = !!showStats;
        this.showPipeline = !!showPipeline;
        this.showPassDetails = !!showPassDetails;

        this.domElement = document.createElement('div');
        this.domElement.style.cssText = `
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
        this.fpsCounterView = document.createElement('p');
        this.domElement.appendChild(this.fpsCounterView);
       
        // pipe line wrapper
        this.pipelineWrapper = document.createElement('div');
        this.domElement.appendChild(this.pipelineWrapper);
        
        // pass info
        this.passInfoView = document.createElement('p');
        this.pipelineWrapper.appendChild(this.passInfoView);

        // total vertex count
        this.drawVertexCountView = document.createElement('p');
        this.pipelineWrapper.appendChild(this.drawVertexCountView);

        // total draw call count
        this.drawCallCountView = document.createElement('p');
        this.pipelineWrapper.appendChild(this.drawCallCountView);

        (wrapperElement || document.body).appendChild(this.domElement);

        this.showPassDetails = !!args.showPassDetails;

        this.fpsCounter = new FPSCounter();
    }

    // ------------------------------------------------------------
    // public
    // ------------------------------------------------------------

    /**
     *
     */
    clear() {
        this.passes = [];
        this.drawVertexCount = 0;
        this.drawCallCount = 0;
    }

    /**
     *
     * @param groupLabel
     * @param passLabel
     * @param geometry
     */
    addPassInfo(groupLabel: string, passLabel: string, geometry: Geometry) {
        const passIndex = this.passes.findIndex((elem) => elem.groupLabel === groupLabel);
        const positionAttribute = geometry.getAttribute(AttributeNames.Position);
        if (!positionAttribute) {
            console.error('invalid position attribute');
        }
        const vertexCount = positionAttribute!.data.length / 3;
        if (passIndex < 0) {
            this.addPassGroup(groupLabel, { passLabel: passLabel, vertexCount });
            return;
        }
        this.passes[passIndex].passInfos.push({
            passLabel,
            vertexCount,
        });
    }

    /**
     *
     * @param geometry
     */
    addDrawVertexCount(geometry: Geometry) {
        const positionAttribute = geometry.getAttribute(AttributeNames.Position);
        if (!positionAttribute) {
            return;
        }
        this.drawVertexCount += positionAttribute.data.length / 3;
    }

    /**
     *
     */
    incrementDrawCall() {
        this.drawCallCount++;
    }

    /**
     *
     * @param time
     */
    update(time: number) {
        this.fpsCounter.calculate(time);
        this.updateView();
    }

    /**
     *
     */
    updateView() {
        this.domElement.style.display = this.showStats ? 'block' : 'none';
        this.fpsCounterView.style.display = this.showFPS ? 'block' : 'none';
        this.pipelineWrapper.style.display = this.showPipeline ? 'block' : 'none';

        this.fpsCounterView.textContent = `FPS: ${Math.floor(this.fpsCounter.currentFPS)}`;

        const passesStrings = [];
        passesStrings.push('-------------');
        for (let i = 0; i < this.passes.length; i++) {
            let totalDrawCalls = 0;
            let totalVertexCount = 0;
            const queue: string[] = [];
            for (let j = 0; j < this.passes[i].passInfos.length; j++) {
                const passInfo = this.passes[i].passInfos[j];
                if (this.showPassDetails) {
                    const str = `${passInfo.passLabel} - vertex count: ${passInfo.vertexCount}`;
                    queue.push(str);
                }
                totalDrawCalls++;
                totalVertexCount += passInfo.vertexCount;
            }
            queue.unshift(
                `[${this.passes[i].groupLabel}]\ndraw calls: ${totalDrawCalls}, vertex count: ${totalVertexCount}`
            );
            passesStrings.push(...queue);
        }
        passesStrings.push('-------------');
        this.passInfoView.textContent = passesStrings.join('\n');
        this.drawVertexCountView.textContent = `vertex count: ${this.drawVertexCount}`;
        this.drawCallCountView.textContent = `draw call count: ${this.drawCallCount}`;
    }

    // ------------------------------------------------------------
    // private
    // ------------------------------------------------------------

    /**
     *
     * @param groupLabel
     * @param passInfo
     * @private
     */
    private addPassGroup(groupLabel: string, passInfo: PassInfo) {
        this.passes.push({
            groupLabel: groupLabel,
            passInfos: [passInfo],
        });
    }
}
