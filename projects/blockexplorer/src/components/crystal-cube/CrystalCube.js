import './CrystalCube.css';

export function CrystalCube() {
  return (
    <span className="crystal-cube" aria-hidden="true">
      <span className="cube">
        <span className="face front"></span>
        <span className="face back"></span>
        <span className="face right"></span>
        <span className="face left"></span>
        <span className="face top"></span>
        <span className="face bottom"></span>
      </span>
    </span>
  );
}
