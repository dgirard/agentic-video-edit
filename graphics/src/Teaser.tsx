import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import teaser from './teaser.json'; // local, non committé (cp teaser.example.json teaser.json)
import brand from './brand.json'; // local, non committé (cp brand.example.json brand.json)

const ACCENT = brand.accent;
const PANEL = brand.panelBg;
const TITLE = brand.title;
const SUB = brand.sub;
const SANS = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

export const TEASER_INTRO_SECONDS: number = teaser.intro_seconds;
export const TEASER_END_SECONDS: number = teaser.end_seconds;

// Carte posee en surimpression d'une frame figee du rush (first/last-frame.png dans public/) :
// la frame reste opaque tout du long, seul le calque voile+texte fait son fondu -> aucun saut
// visible a la concat avec le montage (cf. docs/solutions/design-patterns).
const Card: React.FC<{
  frameFile: string;
  fadeIn: boolean;
  fadeOut: boolean;
  children: React.ReactNode;
}> = ({frameFile, fadeIn, fadeOut, children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const inO = fadeIn ? interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  const outO = fadeOut
    ? interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'})
    : 1;
  const veil = inO * outO;
  // Flou de la frame figee proportionnel au voile : nette (0 px) quand le voile est absent -> raccord invisible.
  const blur = 10 * veil;
  return (
    <AbsoluteFill style={{backgroundColor: PANEL}}>
      <Img
        src={staticFile(frameFile)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: `blur(${blur.toFixed(2)}px)`,
          transform: `scale(${(1 + 0.02 * veil).toFixed(4)})`, // masque les bords adoucis par le flou
        }}
      />
      <AbsoluteFill style={{opacity: veil}}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, rgba(13,13,13,0.62) 0%, rgba(13,13,13,0.86) 55%, rgba(13,13,13,0.7) 100%)`,
          }}
        />
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TeaserIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200, mass: 0.7}});
  const y = interpolate(rise, [0, 1], [18, 0]);
  const barW = interpolate(rise, [0, 1], [40, 140]);
  return (
    <Card frameFile="first-frame.png" fadeIn={false} fadeOut>
      <AbsoluteFill
        style={{background: `radial-gradient(${width}px ${height * 0.5}px at 50% 45%, ${ACCENT}30, transparent 70%)`}}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: `0 ${Math.round(width * 0.1)}px`,
          transform: `translateY(${y}px)`,
        }}
      >
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 20, letterSpacing: 4, color: ACCENT}}>
          {teaser.kicker}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 58,
            lineHeight: 1.05,
            color: TITLE,
            marginTop: 20,
            textWrap: 'balance' as any,
          }}
        >
          {teaser.title}
        </div>
        <div style={{width: barW, height: 6, background: ACCENT, borderRadius: 3, margin: '26px 0 22px'}} />
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: 0.5, color: SUB}}>
          {teaser.subtitle}
        </div>
      </AbsoluteFill>
    </Card>
  );
};

export const TeaserEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const rise = spring({frame: Math.max(0, frame - 6), fps, config: {damping: 200, mass: 0.7}});
  const y = interpolate(rise, [0, 1], [18, 0]);
  return (
    <Card frameFile="last-frame.png" fadeIn fadeOut={false}>
      <AbsoluteFill
        style={{background: `radial-gradient(${width}px ${height * 0.5}px at 50% 45%, ${ACCENT}30, transparent 70%)`}}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: `0 ${Math.round(width * 0.1)}px`,
          transform: `translateY(${y}px)`,
          opacity: rise,
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: 4,
            color: PANEL,
            background: ACCENT,
            padding: '6px 14px',
            borderRadius: 4,
          }}
        >
          {teaser.end_tag}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 54, lineHeight: 1.08, color: TITLE, marginTop: 26}}>
          {teaser.end_title}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 26, letterSpacing: 0.5, color: SUB, marginTop: 18}}>
          {teaser.end_sub}
        </div>
      </AbsoluteFill>
    </Card>
  );
};
