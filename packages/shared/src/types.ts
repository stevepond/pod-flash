export interface Digest {
  id: string;
  title: string;
  summary?: string;
  keywords?: string[];
  duration?: number;
  status: 'PROCESSING' | 'COMPLETE' | 'ERROR';
}
