type OnChangeCallback = (value: string | boolean | void) => void;
type OnInputCallback = (value: string | void) => void;

export class DebuggerGUI {

    private parentElement: HTMLElement;

    get domElement() {
        return this.parentElement;
    }

    constructor() {
        this.parentElement = document.createElement("div");
        this.parentElement.style.cssText = `
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

    #createDebuggerContentElement(label: string) {
        const debuggerContentElement = document.createElement("div");
        debuggerContentElement.style.cssText = `
            font-size: 10px;
            font-weight: bold;
            box-sizing: border-box;
            padding-top: 8px;
        `;

        if (label) {
            const labelWrapperElement = document.createElement("div");
            const labelTextElement = document.createElement("p");
            labelTextElement.style.cssText = `
                margin-right: 1em;
            `;
            labelTextElement.textContent = label;

            labelWrapperElement.appendChild(labelTextElement);
            debuggerContentElement.appendChild(labelWrapperElement);
        }

        const debuggerInputElement = document.createElement("div");
        debuggerContentElement.appendChild(debuggerInputElement);

        return {
            wrapperElement: debuggerContentElement,
            contentElement: debuggerInputElement,
        };
    }

    // options ... array
    // [ { label?, value },,, ]
    addPullDownDebugger({
                            label,
                            onChange,
                            // onInput = null,
                            initialValue = null,
                            initialExec = true,
                            // for select
                            options = [],
                        }: {
        label: string,
        onChange: OnChangeCallback,
        initialValue: string | null,
        initialExec: boolean,
        options: { label: string | null, value: string, isDefault?: boolean } []
    }) {
        const {wrapperElement, contentElement} = this.#createDebuggerContentElement(label);

        const selectElement = document.createElement("select");
        selectElement.style.cssText = `
                    font-size: 10px;
                `;
        options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.label = option.label || option.value;
            selectElement.appendChild(optionElement);
            if (option.isDefault) {
                selectElement.value = option.value;
            }
        });
        selectElement.addEventListener("change", () => {
            onChange(selectElement.value);
        });

        if (initialValue !== null) {
            selectElement.value = initialValue;
        }
        if (initialExec) {
            onChange(selectElement.value);
        }

        contentElement.appendChild(selectElement);
        this.parentElement.appendChild(wrapperElement);
    }

    addColorDebugger({
                         label,
                         onChange,
                         onInput = null,
                         initialValue = null,
                         initialExec = true,
                     }: {
        label: string,
        onChange: OnChangeCallback,
        onInput: OnInputCallback | null,
        initialValue: string | null,
        initialExec: boolean
    }) {
        const {wrapperElement, contentElement} = this.#createDebuggerContentElement(label);

        const colorPickerInput = document.createElement("input");
        colorPickerInput.type = "color";
        colorPickerInput.addEventListener("change", () => {
            onChange(colorPickerInput.value);
        });
        colorPickerInput.addEventListener("input", () => {
            onInput ? onInput(colorPickerInput.value) : onChange(colorPickerInput.value);
        });

        if (initialValue !== null) {
            colorPickerInput.value = initialValue;
        }
        if (initialExec) {
            onChange(colorPickerInput.value);
        }

        contentElement.appendChild(colorPickerInput);
        this.parentElement.appendChild(wrapperElement);
    }

    addToggleDebugger({
                          label,
                          onChange,
                          // onInput = null,
                          initialValue = null,
                          initialExec = true,
                      }: {
        label: string,
        onChange: OnChangeCallback,
        // onInput: OnInputCallback | null,
        initialValue: string | null,
        initialExec: boolean
    }) {
        const {wrapperElement, contentElement} = this.#createDebuggerContentElement(label);

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
        this.parentElement.appendChild(wrapperElement);
    }

    addSliderDebugger({
                          label,
                          onChange,
                          onInput,
                          initialValue,
                          initialExec = true,
                          minValue,
                          maxValue,
                          stepValue
                      }: {
        label: string,
        onChange: OnChangeCallback,
        onInput?: OnInputCallback,
        initialValue: number,
        initialExec?: boolean,
        minValue: number,
        maxValue: number,
        stepValue: number
    }) {
        const {wrapperElement, contentElement} = this.#createDebuggerContentElement(label);

        const sliderValueView = document.createElement("p");
        const sliderInput = document.createElement("input");

        const updateCurrentValueView = () => {
            sliderValueView.textContent = `value: ${sliderInput.value}`;
        }

        const onUpdateSlider: OnInputCallback = () => {
            updateCurrentValueView();
            return Number(sliderInput.value)
        };

        sliderInput.type = "range";
        sliderInput.min = minValue.toString();
        sliderInput.max = maxValue.toString();
        if (stepValue !== null) {
            sliderInput.step = stepValue.toString();
        }
        sliderInput.addEventListener("change", () => {
            return onUpdateSlider();
        });
        sliderInput.addEventListener("input", () => {
            onInput ? onInput(onUpdateSlider()) : onChange(onUpdateSlider());
        });

        if (initialValue !== null) {
            sliderInput.value = initialValue.toString();
        }
        if (initialExec) {
            onChange(onUpdateSlider());
        } else {
            updateCurrentValueView();
        }

        contentElement.appendChild(sliderValueView);
        contentElement.appendChild(sliderInput);
        this.parentElement.appendChild(wrapperElement);
    }

    addButtonDebugger({
                          buttonLabel,
                          onClick,
                          // onInput,
                      }: { buttonLabel: string, onClick: () => void }
    ) {
        const {wrapperElement, contentElement} = this.#createDebuggerContentElement("");

        const buttonInput = document.createElement("input");
        buttonInput.type = "button";
        buttonInput.value = buttonLabel;

        buttonInput.style.cssText = `
        font-size: 9px;
        font-weight: bold;
        padding: 1px 2px;
`;

        buttonInput.addEventListener("click", () => onClick());

        contentElement.appendChild(buttonInput);
        this.parentElement.appendChild(wrapperElement);
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
        this.parentElement.appendChild(borderElement);
    }
}