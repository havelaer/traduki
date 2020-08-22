import { OutputChunk, OutputAsset } from 'rollup';

export function getChunk(
    output: (OutputAsset | OutputChunk)[],
    fileName: string,
): OutputChunk | undefined {
    return output.find(item => item.fileName === fileName && item.type === 'chunk') as
        | OutputChunk
        | undefined;
}

export function getAsset(
    output: (OutputAsset | OutputChunk)[],
    fileName: string,
): OutputAsset | undefined {
    return output.find(item => item.fileName === fileName && item.type === 'asset') as
        | OutputAsset
        | undefined;
}

export function getFileNames(output: (OutputAsset | OutputChunk)[]): string[] {
    return output.map(item => item.fileName);
}
