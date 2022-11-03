const wrapperClassName = "debugger-gui-wrapper";
const elementClassName = "debugger-gui-element";
const elementLabelClassName = "debugger-gui-element-label";

// TODO: 各elementのstyleに持たせる
const styleRules = [
    `
.${wrapperClassName} {
    background-color: rgb(200 200 255 / 70%);
    position: absolute;
    top: 0px;
    right: 0px;
    box-sizing: border-box;
    padding: 10px;
}
    `, `
.${elementClassName} {    
    font-size: 10px;
    font-weight: bold;
    display: flex;
    align-items: center;
}
    `, `
.${elementClassName} select {
    font-size: 10px;
}
    `, `
.${elementLabelClassName} {
    margin-right: 1em;
}  
`
];

export class DebuggerGUI {

    static DebuggerTypes = {
        PullDown: "PullDown"
    };

    #domElement;
    #debuggers = [];

    get domElement() {
        return this.#domElement;
    }

    constructor() {
        const styleElement = document.createElement("style");
        document.head.appendChild(styleElement);
        styleRules.forEach(rules => {
            styleElement.sheet.insertRule(rules, styleElement.sheet.cssRules.length);
        });

        this.#domElement = document.createElement("div");
        this.#domElement.classList.add(wrapperClassName);
    }

    add(type, { label, options, onChange, initialExec = true }) {
        const element = document.createElement("div");
        element.classList.add(elementClassName);

        const labelWrapperElement = document.createElement("div");
        const labelTextElement = document.createElement("p");
        labelTextElement.classList.add(elementLabelClassName);
        labelTextElement.textContent = label;
        
        element.appendChild(labelTextElement);

        switch (type) {
            // options ... array
            // [ { type, value },,, ]
            case DebuggerGUI.DebuggerTypes.PullDown:
                const selectElement = document.createElement("select");
                options.forEach(option => {
                    const optionElement = document.createElement("option");
                    optionElement.value = option.value;
                    optionElement.label = option.label;
                    selectElement.appendChild(optionElement);
                    if(option.isDefault) {
                        selectElement.value = option.value;
                    }
                });
                selectElement.addEventListener("change", (e) => {
                    onChange(selectElement.value);
                });
                element.appendChild(selectElement);
                // initial exec
                if(initialExec) {
                    onChange(selectElement.value);
                }
                break;
            default:
                break;
        }

        this.#domElement.appendChild(element);
    }
}