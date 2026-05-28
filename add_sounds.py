import os
import re

base_path = "/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma"

def patch_geometry():
    file_path = os.path.join(base_path, "src/components/GeometryVisualizer/GeometryVisualizer.jsx")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "audioCtxRef" not in content:
        hook_search = re.search(r"const abortRef = useRef\(false\);", content)
        if hook_search:
            injection = """const abortRef = useRef(false);

  const audioCtxRef = useRef(null);
  
  const initAudio = () => {
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
    }
  };

  const playTone = (freq, type = 'sine', duration = 0.1, vol = 0.1) => {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
  };"""
            content = content.replace("const abortRef = useRef(false);", injection)

        content = content.replace("abortRef.current = false;", "abortRef.current = false;\n    initAudio();")
        
        content = content.replace("setActiveLine(0);", "setActiveLine(0);\n    playTone(400, 'sine', 0.2);")
        content = content.replace("setSortingLines([{ p1: p0, p2: pts[i] }]);", "setSortingLines([{ p1: p0, p2: pts[i] }]);\n      playTone(200 + i * 20, 'triangle', 0.05, 0.05);")
        
        content = content.replace("setEvaluatingLine({ p1: top, p2: pts[i], type: 'checking' });", "setEvaluatingLine({ p1: top, p2: pts[i], type: 'checking' });\n        playTone(300, 'square', 0.1, 0.05);")
        content = content.replace("setEvaluatingLine({ p1: top, p2: pts[i], type: 'invalid' });", "setEvaluatingLine({ p1: top, p2: pts[i], type: 'invalid' });\n          playTone(150, 'sawtooth', 0.2, 0.1);")
        content = content.replace("setEvaluatingLine({ p1: top, p2: pts[i], type: 'valid' });", "setEvaluatingLine({ p1: top, p2: pts[i], type: 'valid' });\n          playTone(600, 'sine', 0.1, 0.1);")
        content = content.replace("setActiveLine(7);", "setActiveLine(7);\n    playTone(800, 'sine', 0.4, 0.2); // finished")

        # In runGrahamScan, it gets called by a button, so we also need initAudio() there
        content = content.replace("runGrahamScan()", "(() => { initAudio(); runGrahamScan(); })()")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Geometry patched!")

def patch_string():
    file_path = os.path.join(base_path, "src/components/StringVisualizer/StringVisualizer.jsx")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "audioCtxRef" not in content:
        hook_search = re.search(r"const timerRef = useRef\(null\);", content)
        if hook_search:
            injection = """const timerRef = useRef(null);

  const audioCtxRef = useRef(null);
  
  const initAudio = () => {
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
    }
  };

  const playTone = (freq, type = 'sine', duration = 0.1, vol = 0.1) => {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
  };"""
            content = content.replace("const timerRef = useRef(null);", injection)

        step_effect_orig = """  useEffect(() => {
    if (isPlaying && currentStepIndex < steps.length - 1) {"""
        
        step_effect_new = """  // Play sounds when step changes
  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      if (step.type === 'compare') {
         if (step.match) playTone(600, 'triangle', 0.1, 0.05); 
         else playTone(200, 'sawtooth', 0.1, 0.05); 
      } else if (step.type === 'found') {
         playTone(800, 'sine', 0.3, 0.1); 
      }
    }
  }, [currentStepIndex, steps]);

  useEffect(() => {
    if (isPlaying && currentStepIndex < steps.length - 1) {"""
        
        content = content.replace(step_effect_orig, step_effect_new)

        content = content.replace("setIsPlaying(!isPlaying)", "(() => { initAudio(); setIsPlaying(!isPlaying); })()")
        content = content.replace("onClick={stepForward}", "onClick={() => { initAudio(); stepForward(); }}")
        content = content.replace("onClick={stepBack}", "onClick={() => { initAudio(); stepBack(); }}")
        
        # Shortcuts logic replacement: 
        # "if (e.code === 'Space') {\n        e.preventDefault();\n        setIsPlaying(prev => !prev);\n      }" 
        # => "initAudio();" inside
        content = content.replace("setIsPlaying(prev => !prev);", "initAudio(); setIsPlaying(prev => !prev);")
        # In shortcuts:
        content = content.replace("stepForward();", "initAudio(); stepForward();")
        content = content.replace("stepBack();", "initAudio(); stepBack();")

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("String patched!")

patch_geometry()
patch_string()
