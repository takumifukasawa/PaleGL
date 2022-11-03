export class DebuggerGUI {

    static DebuggerTypes = {
        PullDown: "PullDown",
        Color: "Color",
        CheckBox: "CheckBox",
        Slider: "Slider"
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
        onChange,
        onInput = null,
        initialValue = null,
        initialExec = true,
        // for select
        options = null,
        // for slider
        minValue = null,
        maxValue = null,
        stepValue = null
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
                    if (option.isDefault) {
                        selectElement.value = option.value;
                    }
                });
                selectElement.addEventListener("change", (e) => {
                    onChange(selectElement.value);
                });
                
                debuggerInputElement.appendChild(selectElement);
                
                if (initialValue) {
                    selectElement.value = initialValue;
                }
                if (initialExec) {
                    onChange(selectElement.value);
                }
                break;

            case DebuggerGUI.DebuggerTypes.CheckBox:
                const checkBoxInput = document.createElement("input");
                checkBoxInput.type = "checkbox";
                checkBoxInput.checked = !!initialValue;
                checkBoxInput.addEventListener("change", () => {
                    onChange(checkBoxInput.checked);
                });
                
                debuggerInputElement.appendChild(checkBoxInput);
                
                if (initialExec) {
                    onChange(checkBoxInput.checked);
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
                
                if (initialValue) {
                    colorPickerInput.value = initialValue;
                }
                if (initialExec) {
                    onChange(colorPickerInput.value);
                }
                break;

            // options .. object 
            // { min, max }
            case DebuggerGUI.DebuggerTypes.Slider:
                const sliderValueView = document.createElement("p");
                const sliderInput = document.createElement("input");
                
                const updateCurrentValueView = () => {
                    sliderValueView.textContent = `value: ${sliderInput.value}`;
                }
                
                const onUpdateSlider = () => {
                    updateCurrentValueView();
                    return Number(sliderInput.value)
                };

                sliderInput.type = "range";
                sliderInput.min = minValue;
                sliderInput.max = maxValue;
                if(stepValue !== null) {
                    sliderInput.step = stepValue;
                }
                sliderInput.addEventListener("change", (e) => {
                    return onUpdateSlider();
                });
                sliderInput.addEventListener("input", (e) => {
                    onInput ? onInput(onUpdateSlider()) : onChange(onUpdateSlider());
                });
                
                debuggerInputElement.appendChild(sliderValueView);
                debuggerInputElement.appendChild(sliderInput);
                
                if(initialValue) {
                    sliderInput.value = initialValue;
                }
                if(initialExec) {
                    onChange(onUpdateSlider());
                } else {
                    updateCurrentValueView();
                }
                break;
                    
            default:
                throw "invalid debugger type";
        }

        this.#domElement.appendChild(debuggerContentElement);
    }
}