// type OnChangeCallback = ((value: string | boolean) => void);
// type OnInputCallback = ((value: string) => void);

export class DebuggerGUI {
    private rootElement: HTMLElement;
    private contentElement: HTMLElement;

    get domElement() {
        return this.rootElement;
    }

    constructor(isRoot = true) {
        this.rootElement = document.createElement('div');

        if (isRoot) {
            this.rootElement.style.cssText = `
                background-color: rgb(200 200 255 / 70%);
                position: absolute;
                top: 0px;
                right: 0px;
                box-sizing: border-box;
                padding: 0px 10px 10px 10px;
                display: grid;
                justify-items: start;
                
                font-size: 9px;
                font-weight: bold;
                line-height: 1.2em;
                min-width: 200px;
                opacity: 0.5;
        `;
        }

        this.contentElement = document.createElement('div');
        this.contentElement.style.cssText = `
            width: 100%;
        `;
        this.rootElement.appendChild(this.contentElement);
    }

    #createDebuggerContentElement(label: string) {
        const wrapperElement = document.createElement('div');
        // wrapperElement.style.cssText = `
        //     font-size: 9px;
        //     font-weight: bold;
        //     line-height: 1.2em;
        //     box-sizing: border-box;
        //     padding-top: 8px;
        //     min-width: 180px;
        // `;
        wrapperElement.style.cssText = `
            box-sizing: border-box;
            padding-top: 8px;
        `;

        const headerElement = document.createElement('div');
        wrapperElement.appendChild(headerElement);

        if (label) {
            // const labelWrapperElement = document.createElement('div');
            // const labelTextElement = document.createElement('p');
            const labelTextElement = document.createElement('span');
            labelTextElement.style.cssText = `
                padding-right: 1em;
            `;
            labelTextElement.textContent = label;

            // labelWrapperElement.appendChild(labelTextElement);
            // wrapperElement.appendChild(labelWrapperElement);
            headerElement.appendChild(labelTextElement);
        }

        const contentElement = document.createElement('div');
        wrapperElement.appendChild(contentElement);

        return {
            wrapperElement,
            headerElement,
            contentElement,
        };
    }

    /**
     *
     * @param name
     */
    addGroup(name: string, initialVisible = true) {
        const group = new DebuggerGUI(false);

        const label = document.createElement('p');
        label.textContent = name;
        label.style.cssText = `
            font-size: 11px;
            font-style: italic;
            box-sizing: border-box;
            padding: 4px 0 0 0;
            cursor: pointer;
        `;
        group.rootElement.insertBefore(label, group.contentElement);

        const show = () => {
            group.contentElement.classList.remove('is-hidden');
            group.contentElement.style.cssText = ``;
            label.textContent = `▼ ${name}`;
        };

        const hide = () => {
            group.contentElement.classList.add('is-hidden');
            group.contentElement.style.cssText = `display: none;`;
            label.textContent = `▶ ${name}`;
        };

        label.addEventListener('click', () => {
            if (group.contentElement.classList.contains('is-hidden')) {
                // 表示
                show();
            } else {
                // 非表示
                hide();
            }
        });

        if (initialVisible) {
            show();
        } else {
            hide();
        }

        this.contentElement.appendChild(group.domElement);

        return group;
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
        label: string;
        onChange: (value: string) => void;
        initialValue: string | null;
        initialExec: boolean;
        options: { label: string | null; value: string; isDefault?: boolean }[];
    }) {
        const { wrapperElement, contentElement } = this.#createDebuggerContentElement(label);

        const selectElement = document.createElement('select');
        selectElement.style.cssText = `
                    font-size: 9px;
                `;
        options.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.label = option.label || option.value;
            selectElement.appendChild(optionElement);
            if (option.isDefault) {
                selectElement.value = option.value;
            }
        });
        selectElement.addEventListener('change', () => {
            onChange(selectElement.value);
        });

        if (initialValue !== null) {
            selectElement.value = initialValue;
        }
        if (initialExec) {
            onChange(selectElement.value);
        }

        contentElement.appendChild(selectElement);
        this.contentElement.appendChild(wrapperElement);
    }

    addColorDebugger({
        label,
        onChange,
        onInput = null,
        initialValue = null,
        initialExec = true,
    }: {
        label: string;
        onChange: (value: string) => void;
        onInput?: ((value: string) => void) | null;
        initialValue: string | null;
        initialExec?: boolean;
    }) {
        const { wrapperElement, contentElement } = this.#createDebuggerContentElement(label);

        const colorPickerInput = document.createElement('input');
        colorPickerInput.type = 'color';
        colorPickerInput.addEventListener('change', () => {
            onChange(colorPickerInput.value);
        });
        colorPickerInput.addEventListener('input', () => {
            onInput ? onInput(colorPickerInput.value) : onChange(colorPickerInput.value);
        });

        if (initialValue !== null) {
            colorPickerInput.value = initialValue;
        }
        if (initialExec) {
            onChange(colorPickerInput.value);
        }

        contentElement.appendChild(colorPickerInput);
        this.contentElement.appendChild(wrapperElement);
    }

    addToggleDebugger({
        label,
        onChange,
        // onInput = null,
        initialValue = null,
        initialExec = true,
    }: {
        label: string;
        onChange: (value: boolean) => void;
        // onInput: OnInputCallback | null,
        initialValue: boolean | null;
        initialExec?: boolean;
    }) {
        const { wrapperElement, contentElement } = this.#createDebuggerContentElement(label);

        const checkBoxInput = document.createElement('input');
        checkBoxInput.type = 'checkbox';
        checkBoxInput.checked = !!initialValue;
        checkBoxInput.addEventListener('change', () => {
            onChange(checkBoxInput.checked);
        });

        if (initialExec) {
            onChange(checkBoxInput.checked);
        }

        contentElement.appendChild(checkBoxInput);
        this.contentElement.appendChild(wrapperElement);
    }

    addSliderDebugger({
        // parent,
        label,
        onChange,
        onInput,
        initialValue,
        initialExec = true,
        minValue,
        maxValue,
        stepValue,
    }: {
        // parent?: HTMLDivElement;
        label: string;
        onChange: (value: number) => void;
        onInput?: ((value: number) => void) | null;
        initialValue: number;
        initialExec?: boolean;
        minValue: number;
        maxValue: number;
        stepValue: number;
    }) {
        const { wrapperElement, headerElement, contentElement } = this.#createDebuggerContentElement(label);

        const sliderValueView = document.createElement('span');
        const sliderInput = document.createElement('input');

        const updateCurrentValueView = () => {
            sliderValueView.textContent = `value: ${sliderInput.value}`;
        };

        const onUpdateSlider = () => {
            updateCurrentValueView();
            return Number.parseFloat(sliderInput.value);
        };

        sliderInput.type = 'range';
        sliderInput.min = minValue.toString();
        sliderInput.max = maxValue.toString();
        if (stepValue !== null) {
            sliderInput.step = stepValue.toString();
        }
        sliderInput.addEventListener('change', () => {
            return onUpdateSlider();
        });
        sliderInput.addEventListener('input', () => {
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

        headerElement.appendChild(sliderValueView);
        contentElement.appendChild(sliderInput);

        // (parent ? parent : this.contentElement).appendChild(wrapperElement);
        this.contentElement.appendChild(wrapperElement);
    }

    addButtonDebugger({
        buttonLabel,
        onClick, // onInput,
    }: {
        buttonLabel: string;
        onClick: () => void;
    }) {
        const { wrapperElement, contentElement } = this.#createDebuggerContentElement('');

        const buttonInput = document.createElement('input');
        buttonInput.type = 'button';
        buttonInput.value = buttonLabel;

        buttonInput.style.cssText = `
        font-size: 9px;
        font-weight: bold;
        line-height: 1.2em;
        padding: 1px 2px;
`;

        buttonInput.addEventListener('click', () => onClick());

        contentElement.appendChild(buttonInput);
        this.contentElement.appendChild(wrapperElement);
    }

    addBorderSpacer() {
        const borderElement = document.createElement('hr');
        borderElement.style.cssText = `
            width: 100%;
            height: 1px;
            border: none;
            border-top: 1px solid #777;
            margin: 0.5em 0 0.25em 0;
        `;
        this.contentElement.appendChild(borderElement);
    }
}
