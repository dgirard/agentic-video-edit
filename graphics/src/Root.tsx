import {Composition} from 'remotion';
import {Overlay} from './Overlay';
import timings from './timings.json';

const FPS = timings.fps;
const DURATION = Math.round(timings.duration_s * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Overlay"
      component={Overlay}
      durationInFrames={DURATION}
      fps={FPS}
      width={1280}
      height={720}
    />
  );
};
