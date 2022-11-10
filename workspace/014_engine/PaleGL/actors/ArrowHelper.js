import {Actor} from "./Actor.js";
import {Mesh} from "./Mesh.js";
import {ArrowGeometry} from "../geometries/ArrowGeometry.js";
import {Material} from "../materials/Material.js";

export class ArrowHelper extends Mesh {
    constructor({ gpu }) {
        const geometry = new ArrowGeometry({ gpu });
        const material = new Material({
            gpu,
            vertexShader: `#version 300 es
            layout (location = 0) in vec3 aPosition;
            uniform mat4 uWorldMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
            }
            `,
            fragmentShader: `#version 300 es
            precision mediump float;
            out vec4 outColor;
            void main() {
                outColor = vec4(1., 0., 0., 1.);
            }
            `
        });
        super({ geometry, material });
    }
    
    // setPosition(p) {
    //     this.transform.setTranslation(p);
    // }

    setDirection(p) {
        this.transform.lookAt(p);
    }

}