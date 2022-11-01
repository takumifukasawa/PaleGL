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
background-color: white;
width: 200px;
height: 200px;
position: absolute;
top: 0;
left: 0;        
`;
    }

    add(type, { options, onChange, initialExec = true }) {
        const element = document.createElement("div");
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