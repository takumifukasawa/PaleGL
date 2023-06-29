import {AttributeNames} from "../constants.ts";
import {Geometry} from "../geometries/Geometry.ts";

export class Stats {
    domElement;
    drawVertexCountView;
    drawCallCountView;
    drawVertexCount = 0;
    drawCallCount = 0;
    
    constructor(args: { wrapperElement: HTMLElement}) {
        const { wrapperElement } = args;
        this.domElement = document.createElement("div");
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

        this.drawVertexCountView = document.createElement("p");
        this.domElement.appendChild(this.drawVertexCountView);
        
        this.drawCallCountView = document.createElement("p");
        this.domElement.appendChild(this.drawCallCountView);
        
        (wrapperElement || document.body).appendChild(this.domElement);
    }

    clear() {
        this.drawVertexCount = 0;
        this.drawCallCount = 0;
    }

    addDrawVertexCount(geometry: Geometry) {
        const positionAttribute = geometry.getAttribute(AttributeNames.Position);
        this.drawVertexCount += positionAttribute.data.length / 3;
    }
    
    incrementDrawCall() {
        this.drawCallCount++;
    }
    
    updateView() {
        this.drawVertexCountView.textContent = `vertex count: ${this.drawVertexCount}`;
        this.drawCallCountView.textContent = `draw call count: ${this.drawCallCount}`;
    }
}