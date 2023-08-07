import { AttributeNames } from '@/PaleGL/constants';
import { Geometry } from '@/PaleGL/geometries/Geometry';

type PassInfo = { passLabel: string; vertexCount: number };

export class Stats {
    domElement;
    passes: { groupLabel: string; passInfos: PassInfo[] }[] = [];
    passInfoView;
    drawVertexCountView;
    drawCallCountView;
    drawVertexCount = 0;
    drawCallCount = 0;

    constructor(args: { wrapperElement?: HTMLElement } = {}) {
        const { wrapperElement } = args;
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
`;

        this.passInfoView = document.createElement('p');
        this.domElement.appendChild(this.passInfoView);

        this.drawVertexCountView = document.createElement('p');
        this.domElement.appendChild(this.drawVertexCountView);

        this.drawCallCountView = document.createElement('p');
        this.domElement.appendChild(this.drawCallCountView);

        (wrapperElement || document.body).appendChild(this.domElement);
    }

    clear() {
        this.passes = [];
        this.drawVertexCount = 0;
        this.drawCallCount = 0;
    }

    private addPassGroup(groupLabel: string, passInfo: PassInfo) {
        this.passes.push({
            groupLabel: groupLabel,
            passInfos: [passInfo],
        });
    }

    addPassInfo(groupLabel: string, passLabel: string, geometry: Geometry) {
        const passIndex = this.passes.findIndex((elem) => elem.groupLabel === groupLabel);
        const positionAttribute = geometry.getAttribute(AttributeNames.Position);
        if (!positionAttribute) {
            throw 'invalid position attribute';
        }
        const vertexCount = positionAttribute.data.length / 3;
        if (passIndex < 0) {
            this.addPassGroup(groupLabel, { passLabel: passLabel, vertexCount });
            return;
        }
        this.passes[passIndex].passInfos.push({
            passLabel,
            vertexCount,
        });
    }

    addDrawVertexCount(geometry: Geometry) {
        const positionAttribute = geometry.getAttribute(AttributeNames.Position);
        if (!positionAttribute) {
            return;
        }
        this.drawVertexCount += positionAttribute.data.length / 3;
    }

    incrementDrawCall() {
        this.drawCallCount++;
    }

    updateView() {
        const passesStrings = [];
        for(let i = 0; i < this.passes.length; i++) {
            passesStrings.push(this.passes[i].groupLabel);
            for(let j = 0; j < this.passes[j].passInfos; j++) {
            }
        }
        this.passInfoView.textContent = this.passes.join("\n");
        this.drawVertexCountView.textContent = `vertex count: ${this.drawVertexCount}`;
        this.drawCallCountView.textContent = `draw call count: ${this.drawCallCount}`;
    }
}
