export interface Digest {
    id: string;
    title: string;
    summary: string;
    keywords: string[];
    duration: number;
    status: 'PROCESSING' | 'COMPLETE' | 'ERROR';
}
declare const _default: {};
export default _default;
