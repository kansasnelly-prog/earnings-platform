import React, { useState } from 'react';
import { Disc3, Download, Headphones, Music2, Radio, ShieldCheck, Upload, Users, WalletCards } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';

const earningRoutes = [
  ['Streaming royalties', 'Collect eligible royalties from supported DSPs.', Headphones],
  ['Download sales', 'Offer paid downloads with clear pricing and receipts.', Download],
  ['YouTube monetization', 'Connect an owned channel and track verified views.', Radio],
  ['Licensed sync', 'Package tracks for film, games, and creator licensing.', Disc3],
  ['Direct fan support', 'Accept tips or memberships through a configured provider.', WalletCards],
  ['Digital releases', 'Schedule singles, EPs, and albums from one catalog.', Music2],
  ['Affiliate bundles', 'Recommend music tools with disclosed partner links.', Users],
  ['Sponsored placements', 'Review brand opportunities before publishing.', ShieldCheck],
  ['Live sessions', 'Ticket or tip eligible live performances.', Radio],
  ['Rights administration', 'Keep ownership, splits, and payout records auditable.', ShieldCheck],
] as const;

const MusicSection: React.FC = () => {
  const { user } = useAppContext();
  const [track, setTrack] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const youtubeId = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)?.[1] || '';

  const uploadTrack = async () => {
    if (!user?.id || !track || !title.trim()) {
      toast({ title: 'Track details needed', description: 'Add a title and choose an audio file.', variant: 'destructive' });
      return;
    }
    if (!track.type.startsWith('audio/')) {
      toast({ title: 'Unsupported file', description: 'Upload an audio file such as MP3, WAV, or M4A.', variant: 'destructive' });
      return;
    }
    if (track.size > 150 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Audio uploads are limited to 150 MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const extension = track.name.split('.').pop() || 'audio';
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('music').upload(path, track, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('music').getPublicUrl(path);
      const { error: insertError } = await supabase.from('music_tracks').insert({
        artist_id: user.id,
        title: title.trim(),
        audio_url: data.publicUrl,
        status: 'pending_review',
      });
      if (insertError) throw insertError;
      setTitle('');
      setTrack(null);
      toast({ title: 'Release submitted', description: 'Your track is queued for rights and metadata review.' });
    } catch (error) {
      console.error('[MusicSection] Upload failed:', error);
      toast({ title: 'Upload unavailable', description: 'Configure the music bucket and table before publishing.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-fuchsia-400/20 bg-[#0b1020]/90 p-5 shadow-[0_0_50px_rgba(168,85,247,0.08)]">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fuchsia-300">Nelly Music Studio</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Release, listen, and track what is actually earned</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">A transparent music workspace for owned content. Earnings depend on verified usage, platform terms, and completed rights setup.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
          <ShieldCheck size={14} /> Rights-first by default
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {earningRoutes.map(([label, description, Icon]) => (
          <article key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-fuchsia-300/30 hover:bg-fuchsia-300/[0.05]">
            <Icon size={18} className="text-fuchsia-300" />
            <h3 className="mt-3 text-sm font-semibold text-white">{label}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white"><Upload size={17} className="text-cyan-300" /> Executive uploader</h3>
          <p className="mt-1 text-xs text-slate-500">Submit owned music for review before it is published globally.</p>
          <div className="mt-4 space-y-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Release title" className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50" />
            <input type="file" accept="audio/*" onChange={(event) => setTrack(event.target.files?.[0] || null)} className="block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-cyan-200" />
            <button onClick={uploadTrack} disabled={isUploading} className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{isUploading ? 'Submitting…' : 'Submit release for review'}</button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/[0.08] to-fuchsia-400/[0.08] p-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white"><Music2 size={17} className="text-cyan-300" /> YouTube Music destination</h3>
          <p className="mt-1 text-xs leading-5 text-white/80">Use the official channel or YouTube Music links you control. This area intentionally does not claim revenue until the platform reports it.</p>
          <a href="https://play.google.com/store/apps/details?id=com.mixtubelite.musicpla" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10">Open music app reference <Radio size={15} /></a>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white"><Headphones size={17} className="text-fuchsia-300" /> In-app player</h3>
        <div className="mt-3 flex gap-2">
          <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="Paste your YouTube or YouTube Music URL" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-300/50" />
          <button onClick={() => setYoutubeUrl(youtubeUrl.trim())} className="rounded-lg bg-fuchsia-400/15 px-4 py-2 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-400/25">Load</button>
        </div>
        {youtubeId && <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black"><iframe title="YouTube music player" src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`} className="aspect-video w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>}
      </div>
    </section>
  );
};

export default MusicSection;
