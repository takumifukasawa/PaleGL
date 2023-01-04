import {Camera} from "./Camera.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector3} from "../math/Vector3.js";

export class OrthographicCamera extends Camera {
    
    constructor(left, right, bottom, top, near, far) {
        super();
        this.near = near;
        this.far = far;
        this.setSize(1, 1, left, right, bottom, top);
    }
    
    setSize(width, height, left, right, bottom, top) {
        super.setSize(width, height);
        if(left && right && top && bottom) {
            this.left = left;
            this.right = right;
            this.bottom = bottom;
            this.top = top;
        }
        this.updateProjectionMatrix();
    }
    
    updateProjectionMatrix() {
        this.projectionMatrix = Matrix4.getOrthographicMatrix(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }
    
    updateTransform() {
        super.updateTransform();
    }
   
    getFrustumLocalPositions() {
        const localForward = Vector3.back();
        const localRight = Vector3.right();
        const localUp = Vector3.up();

        const halfWidth = (Math.abs(this.left) + Math.abs(this.right)) / 2;
        const halfHeight = (Math.abs(this.top) + Math.abs(this.right)) / 2;

        const nearClipCenter = localForward.clone().scale(this.near);
        const farClipCenter = localForward.clone().scale(this.far);
        
        const clipRightOffset = localRight.clone().scale(halfWidth);
        const clipUpOffset = localUp.clone().scale(halfHeight);
        
        const nearLeftTop = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset
        );
        const nearRightTop = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset,
            clipUpOffset
        );
        const nearLeftBottom = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset.clone().negate()
        );
        const nearRightBottom = Vector3.addVectors(
            nearClipCenter,
            clipRightOffset,
            clipUpOffset.clone().negate()
        );
        
        const farLeftTop = Vector3.addVectors(
            farClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset
        );
        const farRightTop = Vector3.addVectors(
            farClipCenter,
            clipRightOffset,
            clipUpOffset
        );
        const farLeftBottom = Vector3.addVectors(
            farClipCenter,
            clipRightOffset.clone().negate(),
            clipUpOffset.clone().negate()
        );
        const farRightBottom = Vector3.addVectors(
            farClipCenter,
            clipRightOffset,
            clipUpOffset.clone().negate()
        );
        
        return {
            nearLeftTop,
            nearRightTop,
            nearLeftBottom,
            nearRightBottom,
            farLeftTop,
            farRightTop,
            farLeftBottom,
            farRightBottom,
        }
    }
    
    getFrustumWorldPositions() {
        const worldPositions = {};
        const localPositions = this.getFrustumLocalPositions();
        Object.keys(localPositions).forEach(key => {
            const wp = localPositions[key].multiplyMatrix4(this.transform.worldMatrix);
            worldPositions[key] = wp;
        });
        return worldPositions;
    }
}