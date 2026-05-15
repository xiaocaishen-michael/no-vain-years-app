// preview/reanimated-shim.jsx
// Tiny browser stand-in for react-native-reanimated v3 — only what
// LoginScreen.tsx actually uses (useSharedValue, withTiming, withRepeat,
// withSequence, useAnimatedStyle, Easing, cancelAnimation, Animated.View).

const Reanimated = (() => {
  let _id = 0;
  const watchers = new Map(); // id -> set of listeners

  function makeShared(initial) {
    const node = { _v: initial, _animations: [], _id: ++_id };
    Object.defineProperty(node, "value", {
      get() { return node._v; },
      set(v) {
        node._v = v;
        const set = watchers.get(node._id);
        if (set) set.forEach(fn => fn());
      },
    });
    return node;
  }

  function useSharedValue(initial) {
    const ref = React.useRef(null);
    if (!ref.current) ref.current = makeShared(initial);
    return ref.current;
  }

  // animation descriptors are just functions that drive the shared value.
  function withTiming(toValue, opts = {}) {
    return function run(node, onDone) {
      const dur = opts.duration ?? 300;
      const easing = opts.easing || (t => t);
      const from = node._v;
      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        node.value = from + (toValue - from) * easing(t);
        if (t < 1) raf = requestAnimationFrame(tick);
        else onDone && onDone(true);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };
  }

  function withRepeat(animFactory, count = -1, reverse = false) {
    return function run(node, onDone) {
      let cancelled = false;
      let cancelInner = null;
      let i = 0;
      const orig = node._v;
      const step = () => {
        if (cancelled) return;
        cancelInner = animFactory(node, () => {
          i++;
          if (count > 0 && i >= count) { onDone && onDone(true); return; }
          // reset to original each loop so withTiming(360) keeps spinning
          node._v = orig;
          step();
        });
      };
      step();
      return () => { cancelled = true; cancelInner && cancelInner(); };
    };
  }

  function withSequence(...steps) {
    return function run(node, onDone) {
      let cancelled = false;
      let cancelInner = null;
      const next = (i) => {
        if (cancelled || i >= steps.length) { onDone && onDone(true); return; }
        cancelInner = steps[i](node, () => next(i + 1));
      };
      next(0);
      return () => { cancelled = true; cancelInner && cancelInner(); };
    };
  }

  function startAnimation(node, anim) {
    const cancel = anim(node);
    node._cancel = cancel;
  }
  function cancelAnimation(node) {
    if (node && node._cancel) { node._cancel(); node._cancel = null; }
  }

  function useAnimatedStyle(builder) {
    const [, force] = React.useReducer(x => x + 1, 0);
    const ids = React.useRef(new Set());
    const builderRef = React.useRef(builder);
    builderRef.current = builder;

    // Re-render whenever any shared value referenced inside `builder` changes.
    // We accomplish this with a wrapped builder that tracks accesses.
    const result = (() => {
      const tracked = new Set();
      const proxy = new Proxy({}, {});
      // Naive: just rebuild and subscribe to all shared values that we can find
      // by re-running builder. Since builder closes over them, we attach
      // listeners on every render (and clean up old ones).
      return builderRef.current();
    })();

    React.useEffect(() => {
      // subscribe to every shared value that's been created so far — over-broad
      // but cheap, and the preview only spins one or two animations at once.
      const fn = () => force();
      const unsubs = [];
      watchers.forEach((set, id) => {
        set.add(fn);
        unsubs.push(() => set.delete(fn));
      });
      // Also ensure new shared values created later get our listener
      const origAdd = watchers.set.bind(watchers);
      watchers.set = function (id, set) {
        set.add(fn);
        unsubs.push(() => set.delete(fn));
        return origAdd(id, set);
      };
      return () => { unsubs.forEach(u => u()); watchers.set = origAdd; };
    }, []);

    return result;
  }

  // Make sure every shared value has a watchers entry to attach listeners to.
  const _origMake = makeShared;

  // Patch makeShared to register a watcher set
  const _patched = (initial) => {
    const node = _origMake(initial);
    watchers.set(node._id, new Set());
    return node;
  };

  // Override outer reference
  function useSharedValueWatched(initial) {
    const ref = React.useRef(null);
    if (!ref.current) ref.current = _patched(initial);
    return ref.current;
  }

  const Easing = {
    linear: t => t,
    out: (fn) => (t => 1 - fn(1 - t)),
    cubic: t => t * t * t,
  };

  // Animated.View interprets `style` (which may be an array) and applies
  // any computed transforms/opacity onto a plain RN View.
  const Animated = {
    View: React.forwardRef(function AnimatedView({ style, className, children, ...rest }, ref) {
      const flat = Array.isArray(style)
        ? style.reduce((acc, s) => Object.assign(acc, s || {}), {})
        : (style || {});
      const transform = Array.isArray(flat.transform)
        ? flat.transform.map(t => {
            const [k, v] = Object.entries(t)[0];
            return `${k}(${typeof v === "number" ? v : v})`;
          }).join(" ")
        : flat.transform;
      const merged = { ...flat };
      if (transform) merged.transform = transform;
      return <RN.View ref={ref} className={className} style={merged} {...rest}>{children}</RN.View>;
    }),
  };

  // we need useSharedValue to call our patched factory
  const useSharedValueExported = useSharedValueWatched;

  // Wrap startAnimation invocation: when assigning a withTiming/etc. result
  // to .value, run it. Reanimated's real API does this automatically; we
  // monkey-patch by overriding `value` setter behavior — easier: provide a
  // helper `runAnimation` AND have withTiming/etc. return descriptors that
  // are recognized when assigned to `.value`. We accomplish this by
  // wrapping setter detection: if assigned value is a function with a
  // special tag, treat it as an animation. To keep things simple, the
  // .tsx source uses pattern `r.value = withTiming(360, ...)` so we
  // intercept by re-defining .value setter:
  const _origMakeBase = _patched;
  const makeRunnable = (initial) => {
    const node = { _v: initial, _id: ++_id };
    watchers.set(node._id, new Set());
    Object.defineProperty(node, "value", {
      get() { return node._v; },
      set(v) {
        if (typeof v === "function" && v.length >= 1) {
          // treat as animation runner
          if (node._cancel) node._cancel();
          node._cancel = v(node);
          return;
        }
        node._v = v;
        const set = watchers.get(node._id);
        if (set) set.forEach(fn => fn());
      },
    });
    return node;
  };

  function useSharedValueFinal(initial) {
    const ref = React.useRef(null);
    if (!ref.current) ref.current = makeRunnable(initial);
    return ref.current;
  }

  return {
    useSharedValue: useSharedValueFinal,
    useAnimatedStyle,
    withTiming, withRepeat, withSequence,
    Easing, cancelAnimation,
    Animated,
  };
})();

window.useSharedValue = Reanimated.useSharedValue;
window.useAnimatedStyle = Reanimated.useAnimatedStyle;
window.withTiming = Reanimated.withTiming;
window.withRepeat = Reanimated.withRepeat;
window.withSequence = Reanimated.withSequence;
window.Easing = Reanimated.Easing;
window.cancelAnimation = Reanimated.cancelAnimation;
window.Animated = Reanimated.Animated;
