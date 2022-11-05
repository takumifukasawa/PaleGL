export class DebuggerGUI {

    static DebuggerTypes = {
        PullDown: "PullDown",
        Color: "Color",
        CheckBox: "CheckBox",
        Slider: "Slider",
    };

    #domElement;

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
            padding: 0px 10px 10px 10px;
            display: grid;
            justify-items: start;
        `;
    }

    #createDebuggerContentElement(label) {
        const debuggerContentElement = document.createElement("div");
        debuggerContentElement.style.cssText = `
            font-size: 10px;
            font-weight: bold;
            box-sizing: border-box;
            padding-top: 8px;
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

        return {
            wrapperElement: debuggerContentElement,
            contentElement: debuggerInputElement,
        };
    }

    // options ... array
    // [ { type, value },,, ]
    addPullDownDebugger({
        label,
        onChange,
        onInput = null,
        initialValue = null,
        initialExec = true,
        // for select
        options = null,
    }) {
        const { wrapperElement, contentElement } = this.#createDebuggerContentElement(label);

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

        if (initialValue) {
            selectElement.value = initialValue;
        }
        if (initialExec) {
            onChange(selectElement.value);
        }

        contentElement.appendChild(selectElement);
        this.#domElement.appendChild(wrapperElement);
    }
    
    addColorDebugger({
        label,
        onChange,
        onInput = null,
        initialValue = null,
        initialExec = true,
    }) {
        const { wrapperElement, contentElement } = this.#createDebuggerContentElement(label);

        const colorPickerInput = document.createElement("input");
        colorPickerInput.type = "color";
        colorPickerInput.addEventListener("change", (e) => {
            onChange(colorPickerInput.value);
        });
        colorPickerInput.addEventListener("input", (e) => {
            onInput ? onInput(colorPickerInput.value) : onChange(colorPickerInput.value);
        });

        if (initialValue) {
            colorPickerInput.value = initialValue;
        }
        if (initialExec) {
            onChange(colorPickerInput.value);
        }

        contentElement.appendChild(colorPickerInput);
        this.#domElement.appendChild(wrapperElement);
    }
    
    addCheckBoxDebugger({
        label,
        onChange,
        onInput = null,
        initialValue = null,
        initialExec = true,
    }) {
        const { wrapperElement, contentElement } = this.#createDebuggerContentElement(label);
        
        const checkBoxInput = document.createElement("input");
        checkBoxInput.type = "checkbox";
        checkBoxInput.checked = !!initialValue;
        checkBoxInput.addEventListener("change", () => {
            onChange(checkBoxInput.checked);
        });

        if (initialExec) {
            onChange(checkBoxInput.checked);
        }

        contentElement.appendChild(checkBoxInput);
        this.#domElement.appendChild(wrapperElement);
    }
    
    addSliderDebugger({
        label,
        onChange,
        onInput = null,
        initialValue = null,
        initialExec = true,
        minValue = null,
        maxValue = null,
        stepValue = null
    }) {
        const { wrapperElement, contentElement } = this.#createDebuggerContentElement(label);

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
        if (stepValue !== null) {
            sliderInput.step = stepValue;
        }
        sliderInput.addEventListener("change", (e) => {
            return onUpdateSlider();
        });
        sliderInput.addEventListener("input", (e) => {
            onInput ? onInput(onUpdateSlider()) : onChange(onUpdateSlider());
        });

        if (initialValue) {
            sliderInput.value = initialValue;
        }
        if (initialExec) {
            onChange(onUpdateSlider());
        } else {
            updateCurrentValueView();
        }

        contentElement.appendChild(sliderValueView);
        contentElement.appendChild(sliderInput);
        this.#domElement.appendChild(wrapperElement);
    }

    addBorderSpacer() {
        const borderElement = document.createElement("hr");
        borderElement.style.cssText = `
            width: 100%;
            height: 1px;
            border: none;
            border-top: 1px solid black;
            margin: 8px 0 4px 0;
        `;
        this.#domElement.appendChild(borderElement);
    }
}