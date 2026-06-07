import Icon from "./Icon";

export default function Lightbox({ m, onClose }) {
  if (!m) return null;
  return (
    <div className="nu-lightbox" onClick={onClose}>
      <button className="nu-lb-close" onClick={onClose}><Icon name="close" size={22} /></button>
      <div className="nu-lb-inner" onClick={(e) => e.stopPropagation()}>
        {m.src
          ? <img src={m.src} alt={m.label || ""} />
          : <div className="nu-ph nu-lb-ph" style={{ background: `linear-gradient(135deg, ${(m.grad || ["#FFD79E","#FF8A3D"])[0]}, ${(m.grad || ["#FFD79E","#FF8A3D"])[1]})` }}><span className="nu-ph-stripes" /><span className="nu-ph-label"><Icon name="photo" size={15} />{m.label}</span></div>}
      </div>
    </div>
  );
}
