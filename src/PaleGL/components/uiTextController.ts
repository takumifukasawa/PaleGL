import { NeedsShorten } from '@/Marionetter/types';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { UIShapeTextMesh } from '@/PaleGL/actors/meshes/uiShapeTextMesh.ts';
import {
    Component,
    ComponentBehaviour,
    ComponentModel,
    createComponent,
    OnProcessPropertyBinderCallback,
    OnStartCallback,
} from '@/PaleGL/components/component.ts';
import { COMPONENT_TYPE_UI_TEXT_CONTROLLER } from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Scene } from '@/PaleGL/core/scene.ts';
import { Vector3 } from '@/PaleGL/math/vector3.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { setUIScale, setUITranslation } from '@/PaleGL/ui/uiBehaviours.ts';

const Property = {
    position: NeedsShorten ? 'ui_p' : 'position',
    scale: NeedsShorten ? 'ui_s' : 'scale',
} as const;

export type UITextControllerBehaviour = ComponentBehaviour & {
    // switchMaterial: (index: number) => void;
};

export type UITextController = Component<ComponentModel, UITextControllerBehaviour>;

export function createUITextController<T, U extends ShapeFontBase<T>>(mesh: UIShapeTextMesh<T, U>): UITextController {
    let cacheScene: Scene | null = null;
    const onStartCallback: OnStartCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, scene: Scene) => {
        cacheScene = scene;
    };
    const onProcessPropertyBinder: OnProcessPropertyBinderCallback = (actor, componentModel, key, value) => {
        if (cacheScene !== null) {
            if (key === Property.position) {
                setUITranslation(mesh, cacheScene.uiCamera, value as Vector3);
            }
            if (key === Property.scale) {
                setUIScale(mesh, cacheScene.uiCamera, value as Vector3);
            }
        }
        // if (key === Property.materialIndex) {
        //     const materialIndex = Math.floor((value as number) + 0.001); // 念のためちょっとオフセット
        //     switchMaterial(materialIndex);
        // }
        // console.log("hogehoge",  actor, key, value);
    };

    // return createComponent({ type: COMPONENT_TYPE_UI_TEXT_CONTROLLER, onProcessPropertyBinder }, { switchMaterial });
    return createComponent({ type: COMPONENT_TYPE_UI_TEXT_CONTROLLER, onStartCallback, onProcessPropertyBinder }, {});
}
