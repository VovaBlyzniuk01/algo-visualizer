export const getNaiveSteps = (text, pattern) => {
  const steps = [];
  const n = text.length;
  const m = pattern.length;

  if (m === 0 || n === 0 || m > n) return steps;

  for (let i = 0; i <= n - m; i++) {
    let j = 0;
    while (j < m) {
      steps.push({
        type: 'compare',
        textIndex: i + j,
        patternIndex: j,
        windowStart: i,
        match: text[i + j] === pattern[j]
      });

      if (text[i + j] !== pattern[j]) {
        break;
      }
      j++;
    }

    if (j === m) {
      steps.push({
        type: 'found',
        windowStart: i,
        matchIndex: i
      });
    }
  }

  return steps;
};

export const getKMPSteps = (text, pattern) => {
  const steps = [];
  const n = text.length;
  const m = pattern.length;
  
  if (m === 0 || n === 0 || m > n) return steps;

  const lps = new Array(m).fill(0);
  let length = 0;
  let i = 1;

  while (i < m) {
    if (pattern[i] === pattern[length]) {
      length++;
      lps[i] = length;
      i++;
    } else {
      if (length !== 0) {
        length = lps[length - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }

  i = 0; 
  let j = 0; 

  while (i < n) {
    steps.push({
      type: 'compare',
      textIndex: i,
      patternIndex: j,
      windowStart: i - j,
      match: text[i] === pattern[j]
    });

    if (pattern[j] === text[i]) {
      j++;
      i++;
      if (j === m) {
        steps.push({
          type: 'found',
          windowStart: i - j,
          matchIndex: i - j
        });
        j = lps[j - 1];
      }
    } else {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }

  return steps;
};
