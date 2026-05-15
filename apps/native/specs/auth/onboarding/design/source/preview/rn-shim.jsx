// preview/rn-shim.jsx
// Minimal browser shim for react-native primitives. Translates className
// (NativeWind utility strings) to inline CSS via nvyParseClasses, and renders
// equivalent DOM nodes so the .tsx source can be loaded by Babel-standalone
// without a real RN bundler. Used ONLY by the design preview.

const RN_View = React.forwardRef(function View({ className, style, children, ...rest }, ref) {
  const s = { display: "flex", flexDirection: "column", boxSizing: "border-box", ...nvyParseClasses(className), ...(style || {}) };
  return <div ref={ref} style={s} {...rest}>{children}</div>;
});

const RN_Text = React.forwardRef(function Text({ className, style, children, onPress, ...rest }, ref) {
  const s = {
    fontFamily: 'Inter, "Noto Sans SC", -apple-system, sans-serif',
    color: "#1A1A1A", fontSize: 14, margin: 0, padding: 0,
    ...nvyParseClasses(className), ...(style || {}),
  };
  return <span ref={ref} style={s} onClick={onPress} {...rest}>{children}</span>;
});

const RN_Pressable = React.forwardRef(function Pressable({ className, style, children, onPress, disabled, hitSlop, ...rest }, ref) {
  const s = {
    display: "flex", flexDirection: "column", boxSizing: "border-box",
    cursor: disabled ? "not-allowed" : "pointer", userSelect: "none",
    background: "transparent", border: 0, padding: 0, font: "inherit",
    color: "inherit", textAlign: "left",
    ...nvyParseClasses(className), ...(style || {}),
  };
  return <button ref={ref} type="button" style={s} onClick={disabled ? undefined : onPress} disabled={disabled} {...rest}>{children}</button>;
});

const RN_TextInput = React.forwardRef(function TextInput({
  className, style, value, onChangeText, onFocus, onBlur,
  placeholder, placeholderTextColor, editable = true,
  secureTextEntry, keyboardType, maxLength, ...rest
}, ref) {
  const s = {
    border: 0, outline: 0, background: "transparent",
    fontFamily: 'Inter, "Noto Sans SC", -apple-system, sans-serif',
    color: "#1A1A1A", fontSize: 14, padding: 0,
    ...nvyParseClasses(className), ...(style || {}),
  };
  // placeholderTextColor via CSS variable + ::placeholder
  const ph = placeholderTextColor || "#999";
  const phStyleId = "nvy-input-ph";
  if (!document.getElementById(phStyleId)) {
    const el = document.createElement("style");
    el.id = phStyleId;
    el.textContent = `input.nvy-rn-input::placeholder { color: var(--nvy-ph, #999); }`;
    document.head.appendChild(el);
  }
  return (
    <input
      ref={ref}
      className="nvy-rn-input"
      style={{ ...s, "--nvy-ph": ph }}
      value={value ?? ""}
      onChange={e => onChangeText?.(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      readOnly={!editable}
      type={secureTextEntry ? "password" : "text"}
      maxLength={maxLength}
      inputMode={keyboardType === "phone-pad" ? "tel" : keyboardType === "number-pad" ? "numeric" : undefined}
      {...rest}
    />
  );
});

const RN_Image = React.forwardRef(function RNImage({ className, style, source, resizeMode = "cover", ...rest }, ref) {
  const uri = typeof source === "object" && source ? source.uri : source;
  const s = {
    objectFit: resizeMode === "contain" ? "contain" : resizeMode === "cover" ? "cover" : "fill",
    display: "block",
    ...nvyParseClasses(className), ...(style || {}),
  };
  return <img ref={ref} src={uri} style={s} {...rest}/>;
});

const RN_ScrollView = React.forwardRef(function ScrollView({ className, style, children, contentContainerStyle, ...rest }, ref) {
  const s = { display: "flex", flexDirection: "column", overflow: "auto", boxSizing: "border-box", ...nvyParseClasses(className), ...(style || {}) };
  return <div ref={ref} style={s} {...rest}><div style={contentContainerStyle}>{children}</div></div>;
});

window.RN = {
  View: RN_View, Text: RN_Text, Pressable: RN_Pressable,
  TextInput: RN_TextInput, Image: RN_Image, ScrollView: RN_ScrollView,
};
window.View = RN_View;
window.Text = RN_Text;
window.Pressable = RN_Pressable;
window.TextInput = RN_TextInput;
window.Image = RN_Image;
window.ScrollView = RN_ScrollView;
