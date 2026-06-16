import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import timings from './timings.json';

// Tokens (gabarit public examples/tokens.example.css ; charte reelle = design-system/ prive)
const ACCENT = '#ff6600';
const DARK = '#0b0b0b';
const WHITE = '#ffffff';
const SANS = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

const LowerThird: React.FC<{title: string; sub: string; durationInFrames: number}> = ({
  title,
  sub,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entree : ressort (slide + fade). Sortie : fondu sur les 12 dernieres frames.
  const enter = spring({frame, fps, config: {damping: 200, mass: 0.6}});
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = enter * exit;
  const x = interpolate(enter, [0, 1], [-40, 0]);

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start'}}>
      <div
        style={{
          margin: '0 0 56px 56px',
          display: 'flex',
          alignItems: 'stretch',
          opacity,
          transform: `translateX(${x}px)`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div style={{width: 8, background: ACCENT}} />
        <div style={{background: DARK, padding: '14px 26px 16px 20px'}}>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 38,
              letterSpacing: 0.5,
              color: WHITE,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 22,
              marginTop: 6,
              color: ACCENT,
              letterSpacing: 0.3,
            }}
          >
            {sub}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Overlay: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <OffthreadVideo src={staticFile(timings.video)} />
      {timings.overlays.map((o, i) => {
        const from = Math.round(o.start * fps);
        const dur = Math.max(1, Math.round((o.end - o.start) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <LowerThird title={o.title} sub={o.sub} durationInFrames={dur} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
