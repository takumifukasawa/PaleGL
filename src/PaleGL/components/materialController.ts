import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { Component, ComponentArgs, createComponent } from '@/PaleGL/components/component.ts';
import { ACTOR_TYPE_MESH, UniformTypes } from '@/PaleGL/constants.ts';
import { UniformValue } from '@/PaleGL/core/uniforms.ts';
import { tryAddMaterialUniformValue } from '@/PaleGL/materials/material.ts';

export type MaterialController = Component;

// [string, UniformTypes?, UniformValue?]
// 配列の場合は要初期化という指示になる
export type MaterialTimelineBindings = Map<string, [string, UniformTypes?, UniformValue?]>; // propertyName, ...

// timeline から操作される
export const createMaterialController = (
    mesh: Mesh,
    bindings: MaterialTimelineBindings,
    componentArgs?: ComponentArgs
): MaterialController => {
    // for debug
    // console.log(mesh, bindings, componentArgs);

    // 危険だが、component内でuniformを直接追加する
    bindings.forEach((binding) => {
        const [uniformName, uniformType, uniformValue] = binding;
        // uniformtypeが指定されていたらuniformを追加する対象
        // ない場合はすでにあるものとみなす
        if (uniformType) {
            // こっちを使いたい
            // iterateAllMeshMaterials(mesh, (material) => {
            //     tryAddMaterialUniformValue(material, uniformName, uniformType, uniformValue);
            // });

            // TODO: 子を一括制御してるだけなので正しい対応ではない。無理矢理。主にmulti-spline向け. 一階層まで。
            [mesh, ...mesh.children].forEach((child) => {
                if (child.type === ACTOR_TYPE_MESH) {
                    iterateAllMeshMaterials(child as Mesh, (material) => {
                        tryAddMaterialUniformValue(material, uniformName, uniformType, uniformValue);
                    });
                }
            });
        }
    });

    return createComponent({
        ...componentArgs,
        onFilterPropertyBinder: (key: string) => bindings.has(key),
        onProcessPropertyBinder: (actor, _, key, value) => {
            if (bindings.has(key)) {
                const binding = bindings.get(key)!;
                const [uniformName] = binding;
                // if (actor.type === ACTOR_TYPE_MESH) {
                //     setUniformValueToAllMeshMaterials(actor as Mesh, uniformName, value);
                // }

                // TODO: 子を一括制御してるだけなので正しい対応ではない。無理矢理。主にmulti-spline向け. 一階層まで。
                [actor, ...actor.children].forEach((child) => {
                    if (child.type === ACTOR_TYPE_MESH) {
                        setUniformValueToAllMeshMaterials(child as Mesh, uniformName, value);
                    }
                });

                // for debug
                // console.log(
                //     `[MaterialController] onProcessPropertyBinder: actor=${actor.name}, key=${key}, uniformName=${uniformName}, value=${value}`
                // );
            }
        },
    });
};
