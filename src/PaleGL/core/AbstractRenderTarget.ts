// export class AbstractRenderTarget {
//     isSwappable: boolean; // bool
// 
//     constructor({ isSwappable = false }: { isSwappable: boolean } = { isSwappable: false }) {
//         this.isSwappable = isSwappable;
//     }
// 
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     get read(): AbstractRenderTarget {
//         console.error("[AbstractRenderTarget] should implementation 'read' getter");
//     }
// 
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     get write(): AbstractRenderTarget {
//         console.error("[AbstractRenderTarget] should implementation 'write' getter");
//     }
// }


export class AbstractRenderTarget {
    isSwappable: boolean; // bool

    constructor({ isSwappable = false }: { isSwappable: boolean } = { isSwappable: false }) {
        this.isSwappable = isSwappable;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get read(): AbstractRenderTarget {
        console.error("[AbstractRenderTarget] should implementation 'read' getter");
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get write(): AbstractRenderTarget {
        console.error("[AbstractRenderTarget] should implementation 'write' getter");
    }
}
