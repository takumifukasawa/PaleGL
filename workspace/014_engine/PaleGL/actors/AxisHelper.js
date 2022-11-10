import {Actor} from "./Actor.js";
import {ArrowHelper} from "./ArrowHelper.js";

export class AxisHelper extends Actor {
    constructor({ gpu }) {
        super();
        const xArrow = new ArrowHelper({ gpu });
        const yArrow = new ArrowHelper({ gpu });
        const zArrow = new ArrowHelper({ gpu });
        this.addChild(xArrow);
        this.addChild(yArrow);
        this.addChild(zArrow);
        xArrow.transform.setRotationY(-90);
        yArrow.transform.setRotationX(-90);
    }
}