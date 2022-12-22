
export class Stats {
    domElement;
    vertexCountView;
    drawCallCountView;
    vertexCount = 0;
    drawCallCount = 0;
    
    constructor({ wrapperElement } = {}) {
        this.domElement = document.createElement("div");
        this.domElement.style.cssText = `
position: absolute;
bottom: 0;
left: 0;
padding: 0.2em 0.5em;
font-size: 9px;
color: white;
font-weight: bold;
text-shadow: rgba(0, 0, 0, 0.7) 1px 1px;
`;

        this.vertexCountView = document.createElement("p");
        this.domElement.appendChild(this.vertexCountView);
        
        this.drawCallCountView = document.createElement("p");
        this.domElement.appendChild(this.drawCallCountView);
        
        (wrapperElement || document.body).appendChild(this.domElement);
    }

    clear() {
        this.vertexCount = 0;
        this.drawCallCount = 0;
    }

    addVertexCount(vertexCount) {
        this.vertexCount = vertexCount;
    }
    
    incrementDrawCall() {
        this.drawCallCount++;
    }
    
    update() {
        this.vertexCountView.textContent = `vertex count: ${this.vertexCount}`;
        this.drawCallCountView.textContent = `draw call count: ${this.drawCallCount}`;
    }
}