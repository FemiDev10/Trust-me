// Big robot portrait: uses W1's RobotPortrait (3D mini canvas) when it exists,
// otherwise (or if it throws) the 2D RobotFace. Unplugged = greyed and powered down.
import { Component } from 'react';
import RobotFace from './RobotFace.jsx';

const mods = import.meta.glob('../../scene/robots/Robot.jsx', { eager: true });
const RobotPortrait = Object.values(mods)[0]?.RobotPortrait ?? null;

class Guard extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Dev: ?flat forces the 2D faces (useful for screenshots in hidden tabs where WebGL does not draw).
const FLAT = typeof location !== 'undefined' && new URLSearchParams(location.search).has('flat');

export default function Portrait({ id, pose = 'idle', expression = 'neutral', reveal = false, size = 140, use3d = true, className = '' }) {
  const off = pose === 'off';
  const is3d = Boolean(RobotPortrait && use3d && !FLAT);
  const face = <RobotFace id={id} pose={pose} expression={expression} reveal={reveal} size={size} />;
  return (
    <div className={`pt ${is3d ? 'pt--3d' : ''} ${off ? 'pt--off' : ''} ${reveal ? 'pt--reveal' : ''} ${className}`} style={{ width: size, height: size }}>
      {is3d ? (
        <Guard fallback={face}>
          <RobotPortrait id={id} pose={pose} expression={expression} reveal={reveal} size={size} />
        </Guard>
      ) : (
        face
      )}
    </div>
  );
}
