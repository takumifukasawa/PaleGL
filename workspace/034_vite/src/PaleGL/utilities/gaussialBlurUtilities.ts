
import { gaussCoefficient } from "./mathUtilities";

// pixelNumは奇数であるべき
export function getGaussianBlurWeights(pixelNum: number, sigma: number) {
    const halfWidth = Math.floor(pixelNum / 2);

    let sum = 0;
    const rawWeights = new Array(pixelNum).fill(0).map((_, i) => {
        const index = i - halfWidth;
        const weight = gaussCoefficient(sigma, index);
        sum += weight;
        return weight;
    });

    return rawWeights.map(w => w / sum);
}
