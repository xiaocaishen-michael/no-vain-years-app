// preview/svg-shim.jsx
// Browser shim for react-native-svg primitives → plain SVG DOM elements.
// Used so ProfileScreen.preview.jsx can mirror the RN source 1:1.

window.Svg     = ({ width, height, viewBox, preserveAspectRatio, children, ...rest }) =>
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={viewBox} preserveAspectRatio={preserveAspectRatio} {...rest}>{children}</svg>;
window.G       = (p) => <g {...p}/>;
window.Rect    = (p) => <rect {...p}/>;
window.Circle  = (p) => <circle {...p}/>;
window.Path    = (p) => <path {...p}/>;
window.Line    = (p) => <line {...p}/>;
window.Polyline = (p) => <polyline {...p}/>;
window.Defs    = (p) => <defs>{p.children}</defs>;
window.LinearGradient = ({ id, x1, y1, x2, y2, children }) =>
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>{children}</linearGradient>;
window.Stop    = (p) => <stop {...p}/>;
