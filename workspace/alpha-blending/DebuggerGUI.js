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
        this.#domElement.style = `
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
        element.classList.add("debugger-gui-element");
        element.style = `
display: flex;
`;

        const labelWrapperElement = document.createElement("div");
        const labelTextElement = document.createElement("p");
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