export interface SoraJob {
  id: string;
  prompt: string;
  seconds: number;
  resolution: string;
  style: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface SoraQueueOptions {
  maxConcurrent?: number;
  pollIntervalMs?: number;
}

export class SoraQueue {
  private queue: SoraJob[] = [];
  private processing: boolean = false;
  private maxConcurrent: number;
  private pollIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: SoraQueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 2;
    this.pollIntervalMs = options.pollIntervalMs || 2000;
  }

  enqueue(job: Omit<SoraJob, 'id' | 'status' | 'created_at'>): SoraJob {
    const newJob: SoraJob = {
      id: `sora_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      ...job,
    };
    this.queue.push(newJob);
    this.processQueue();
    return newJob;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const pendingJobs = this.queue.filter((j) => j.status === 'pending');
        const processingJobs = this.queue.filter((j) => j.status === 'processing');

        if (processingJobs.length >= this.maxConcurrent) {
          break;
        }

        if (pendingJobs.length === 0) {
          break;
        }

        const job = pendingJobs[0];
        job.status = 'processing';

        try {
          const result = await this.executeJob(job);
          job.status = 'completed';
          job.video_url = result.video_url;
          job.completed_at = new Date().toISOString();
        } catch (error: any) {
          job.status = 'failed';
          job.error = error.message || 'Unknown error';
          job.completed_at = new Date().toISOString();
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async executeJob(job: SoraJob): Promise<{ video_url: string }> {
    const soraApiKey = process.env.SORA_API_KEY;
    if (!soraApiKey) {
      throw new Error('SORA_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/sora/videos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${soraApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: job.prompt,
        seconds: job.seconds,
        resolution: job.resolution,
        style: job.style,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Sora API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    const videoUrl = data.video_url || data.url;

    if (!videoUrl) {
      throw new Error('Sora API did not return a video URL');
    }

    return { video_url: videoUrl };
  }

  getJob(id: string): SoraJob | undefined {
    return this.queue.find((j) => j.id === id);
  }

  getPendingJobs(): SoraJob[] {
    return this.queue.filter((j) => j.status === 'pending');
  }

  getProcessingJobs(): SoraJob[] {
    return this.queue.filter((j) => j.status === 'processing');
  }

  getCompletedJobs(): SoraJob[] {
    return this.queue.filter((j) => j.status === 'completed');
  }

  getFailedJobs(): SoraJob[] {
    return this.queue.filter((j) => j.status === 'failed');
  }

  clearCompleted(): void {
    this.queue = this.queue.filter((j) => j.status !== 'completed');
  }

  clearFailed(): void {
    this.queue = this.queue.filter((j) => j.status !== 'failed');
  }

  clearAll(): void {
    this.queue = [];
  }

  startPolling(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.processQueue();
    }, this.pollIntervalMs);
  }

  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const soraQueue = new SoraQueue({
  maxConcurrent: 2,
  pollIntervalMs: 2000,
});
