export interface VideoItem {
  id: string;
  url: string;
  thumbnail: string;
  viewCount: string;
  title: string;
}

const MOCK_VIDEOS = [
  { id: 'v1', url: 'https://sample.mp4', thumbnail: '/placeholder.svg', viewCount: '4.5K', title: 'Stream 1' },
  { id: 'v2', url: 'https://sample.mp4', thumbnail: '/placeholder.svg', viewCount: '12.8K', title: 'Stream 2' },
  { id: 'v3', url: 'https://sample.mp4', thumbnail: '/placeholder.svg', viewCount: '8.2K', title: 'Stream 3' },
  { id: 'v4', url: 'https://sample.mp4', thumbnail: '/placeholder.svg', viewCount: '15.1K', title: 'Stream 4' },
  { id: 'v5', url: 'https://sample.mp4', thumbnail: '/placeholder.svg', viewCount: '2.9K', title: 'Stream 5' },
  { id: 'v6', url: 'https://sample.mp4', thumbnail: '/placeholder.svg', viewCount: '5.6K', title: 'Stream 6' },
];

export const getScrapedVideos = (): VideoItem[] => {
  return MOCK_VIDEOS.map(v => ({
    ...v,
    viewCount: (Math.random() * 20).toFixed(1) + 'K',
  }));
};
