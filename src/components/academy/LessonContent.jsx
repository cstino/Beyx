import { motion } from 'framer-motion';
import { Info, AlertTriangle, CheckCircle2, Quote } from 'lucide-react';
import { InlineQuiz } from './InlineQuiz';
import { academyAssets } from '../../data/academyAssets';

export function LessonContent({ blocks }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <BlockRenderer block={block} />
        </motion.div>
      ))}
    </div>
  );
}

function BlockRenderer({ block }) {
  switch (block.type) {
    case 'heading':
      return <Heading level={block.level} text={block.text} />;
    case 'paragraph':
      return <Paragraph text={block.text} />;
    case 'image':
      return <ImageBlock src={block.src} alt={block.alt} caption={block.caption} />;
    case 'diagram':
      return <DiagramBlock src={block.src} caption={block.caption} />;
    case 'list':
      return <ListBlock items={block.items} ordered={block.ordered} />;
    case 'tip':
      return <TipBlock text={block.text} variant={block.variant} />;
    case 'quote':
      return <QuoteBlock text={block.text} author={block.author} />;
    case 'inline_quiz':
      return <InlineQuiz {...block} />;
    case 'video':
      return <VideoBlock src={block.src} caption={block.caption} />;
    case 'divider':
      return <div className="h-px bg-white/10 my-4" />;
    case 'two_column':
      return <TwoColumn left={block.left} right={block.right} />;
    default:
      return null;
  }
}

function Heading({ level, text }) {
  if (level === 1) return (
    <h1 className="text-white text-2xl font-black uppercase tracking-tight mt-6 mb-2">
      {text}
    </h1>
  );
  if (level === 2) return (
    <h2 className="text-white text-xl font-black uppercase tracking-tight mt-5 mb-2
      flex items-center gap-2">
      <div className="w-1 h-5 bg-[#4361EE]" />
      {text}
    </h2>
  );
  return (
    <h3 className="text-[#4361EE] text-sm font-extrabold tracking-[0.15em] uppercase mt-4 mb-1">
      {text}
    </h3>
  );
}

const parseMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-white/90 italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[#4361EE] text-sm font-mono">$1</code>');
};

function Paragraph({ text }) {
  return (
    <p
      className="text-white/75 text-base leading-relaxed"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
    />
  );
}

function ImageBlock({ src, alt, caption }) {
  // Cerca l'asset sia con che senza slash iniziale per massima compatibilità
  const cleanSrc = src.startsWith('/') ? src.substring(1) : src;
  const embeddedAsset = academyAssets[src] || academyAssets[cleanSrc];
  const finalSrc = embeddedAsset || (src.startsWith('/') ? src : `/${src}`);
  
  return (
    <figure className="my-2">
      <img
        src={finalSrc}
        alt={alt}
        className="w-full rounded-xl border border-white/5"
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-white/50 text-xs text-center mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function DiagramBlock({ src, caption }) {
  // Cerca l'asset sia con che senza slash iniziale per massima compatibilità
  const cleanSrc = src.startsWith('/') ? src.substring(1) : src;
  const embeddedAsset = academyAssets[src] || academyAssets[cleanSrc];
  const finalSrc = embeddedAsset || (src.startsWith('/') ? src : `/${src}`);
  
  return (
    <figure className="my-2 bg-[#12122A] rounded-xl p-4 border border-[#4361EE]/20">
      <img src={finalSrc} alt={caption} className="w-full" loading="lazy" />
      <figcaption className="text-[#4361EE] text-xs text-center mt-3 font-bold tracking-wider uppercase">
        {caption}
      </figcaption>
    </figure>
  );
}

function ListBlock({ items, ordered }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`space-y-2 ${ordered ? 'list-decimal list-inside' : ''}`}>
      {items.map((item, i) => (
        <li key={i}
          className={`text-white/75 text-base leading-relaxed
            ${!ordered ? 'flex gap-3 items-start' : ''}`}
        >
          {!ordered && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#4361EE] mt-2 flex-shrink-0" />
          )}
          <span dangerouslySetInnerHTML={{ __html: parseMarkdown(item) }} />
        </li>
      ))}
    </Tag>
  );
}

function TipBlock({ text, variant = 'info' }) {
  const styles = {
    info:    { color: '#4361EE', icon: Info,           label: 'INFO' },
    warning: { color: '#F5A623', icon: AlertTriangle,  label: 'ATTENZIONE' },
    success: { color: '#00D68F', icon: CheckCircle2,   label: 'TIP' },
  };
  const s = styles[variant] ?? styles.info;
  const Icon = s.icon;
  return (
    <div
      className="rounded-xl p-4 my-2 border-l-4"
      style={{
        background: `${s.color}10`,
        borderLeftColor: s.color,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} style={{ color: s.color }} />
        <div className="text-[10px] font-extrabold tracking-[0.15em]"
          style={{ color: s.color }}>
          {s.label}
        </div>
      </div>
      <div 
        className="text-white/80 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
      />
    </div>
  );
}

function QuoteBlock({ text, author }) {
  return (
    <blockquote className="border-l-2 border-white/20 pl-4 py-2 my-2">
      <Quote size={14} className="text-white/30 mb-1" />
      <p 
        className="text-white/85 italic leading-relaxed"
        dangerouslySetInnerHTML={{ __html: `"${parseMarkdown(text)}"` }}
      />
      {author && (
        <cite className="text-white/40 text-xs mt-2 block not-italic">— {author}</cite>
      )}
    </blockquote>
  );
}

function VideoBlock({ src, caption }) {
  return (
    <figure className="my-2">
      <div className="relative pb-[56.25%] rounded-xl overflow-hidden border border-white/5">
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {caption && (
        <figcaption className="text-white/50 text-xs text-center mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function TwoColumn({ left, right }) {
  return (
    <div className="grid grid-cols-2 gap-3 my-2">
      <div className="bg-[#12122A] rounded-xl p-3 space-y-2">
        {left.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
      <div className="bg-[#12122A] rounded-xl p-3 space-y-2">
        {right.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
    </div>
  );
}
