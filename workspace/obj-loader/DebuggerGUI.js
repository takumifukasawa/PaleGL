const wrapperClassName = "debugger-gui-wrapper";
const elementClassName = "debugger-gui-element";
const elementLabelClassName = "debugger-gui-element-label";

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
        this.#domElement = document.createElement("div");
        this.#domElement.classList.add(wrapperClassName);
        
        this.#domElement.style.cssText = `
            background-color: rgb(200 200 255 / 70%);
            position: absolute;
            top: 0px;
            right: 0px;
            box-sizing: border-box;
            padding: 10px;
        `;
    }

    add(type, { label, options, onChange, initialExec = true }) {
        const element = document.createElement("div");
        element.classList.add(elementClassName);
        element.style.cssText = `
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
        `;

        const labelWrapperElement = document.createElement("div");
        const labelTextElement = document.createElement("p");
        labelTextElement.classList.add(elementLabelClassName);
        labelTextElement.style.cssText = `
            margin-right: 1em;
        `;
        labelTextElement.textContent = label;

        labelWrapperElement.appendChild(labelTextElement);
        element.appendChild(labelWrapperElement);

        switch (type) {
            // options ... array
            // [ { type, value },,, ]
            case DebuggerGUI.DebuggerTypes.PullDown:
                const selectElement = document.createElement("select");
                selectElement.style.cssText = `
                    font-size: 10px;
                `;
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
                throw "invalid debugger type";
        }

        this.#domElement.appendChild(element);
    }
}