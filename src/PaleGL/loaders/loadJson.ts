export async function loadJson<T>(src: string) {
    const data = await fetch(src);
    const str = await data.text();
    const json = JSON.parse(str) as T;
    return json;
}
