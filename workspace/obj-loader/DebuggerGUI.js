export class DebuggerGUI {

    static DebuggerTypes = {
        PullDown: "PullDown",
        Color: "Color",
    };

    #domElement;
    #debuggers = [];

    get domElement() {
        return this.#domElement;
    }

    constructor() {
        this.#domElement = document.createElement("div");
        this.#domElement.style.cssText = `
            background-color: rgb(200 200 255 / 70%);
            position: absolute;
            top: 0px;
            right: 0px;
            box-sizing: border-box;
            padding: 10px;
            display: grid;
            justify-items: start;
        `;
    }

    add(type, {
        label,
        options = null,
        onChange,
        onInput = null,
        initialValue = null,
        initialExec = true
    }) {
        const debuggerContentElement = document.createElement("div");
        debuggerContentElement.style.cssText = `
            font-size: 10px;
            font-weight: bold;
            box-sizing: border-box;
            padding: 8px;
        `;

        const labelWrapperElement = document.createElement("div");
        const labelTextElement = document.createElement("p");
        labelTextElement.style.cssText = `
            margin-right: 1em;
        `;
        labelTextElement.textContent = label;

        labelWrapperElement.appendChild(labelTextElement);
        debuggerContentElement.appendChild(labelWrapperElement);
        
        const debuggerInputElement = document.createElement("div");
        debuggerContentElement.appendChild(debuggerInputElement);

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
                selectElement.addEventListener("input", (e) => {
                    onInput ? onInput(selectElement.value) : onChange(selectElement.value);
                });
                debuggerInputElement.appendChild(selectElement);
                if(initialValue) {
                    selectElement.value = initialValue;
                }
                if(initialExec) {
                    onChange(selectElement.value);
                }
                break;
                
            case DebuggerGUI.DebuggerTypes.Color:
                const colorPickerInput = document.createElement("input");
                colorPickerInput.type = "color";
                colorPickerInput.addEventListener("change", (e) => {
                    onChange(colorPickerInput.value);
                });
                colorPickerInput.addEventListener("input", (e) => {
                    onInput ? onInput(colorPickerInput.value) : onChange(colorPickerInput.value);
                });
                debuggerInputElement.appendChild(colorPickerInput);
                if(initialValue) {
                    colorPickerInput.value = initialValue;
                }
                if(initialExec) {
                    onChange(colorPickerInput.value);
                }
                break;
                    
            default:
                throw "invalid debugger type";
        }

        this.#domElement.appendChild(debuggerContentElement);
    }
}