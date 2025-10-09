import { Question, Transform } from "@/types/question";
import { SeededRandom } from "./rng";

// Difficulty tiers based on specification
const TIER_CONFIGS = {
  1: { transforms: 1, angles: [90, -90, 180], distances: [1.0, 2.0], yDistances: [1.0, 2.0] },
  2: { transforms: 2, angles: [90, -90, 180, 45, -45], distances: [1.0, 2.0, 1.5], yDistances: [1.0, 1.5, 2.0] },
  3: { transforms: 3, angles: [90, -90, 180, 45, -45, 135, -135], distances: [1.0, 2.0, 1.5, 0.5], yDistances: [0.5, 1.0, 1.5, 2.0] },
  4: { transforms: 4, angles: [90, -90, 180, 45, -45, 135, -135, 270, 30, 60], distances: [1.0, 2.0, 1.5, 0.5, 2.5], yDistances: [0.5, 1.0, 1.5, 2.0, 2.5] },
};

const SHAPES = ["digit1", "letterL", "poly5"];
const FRAMES = ["world", "local"];

export function generateQuestion(seed: string, type: string, tier: number): Question {
  const rng = new SeededRandom(seed);
  const config = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS] || TIER_CONFIGS[1];

  // Generate variant based on question type
  if (type === "code_picture") {
    return generateQ5Question(seed, rng, config, tier);
  } else if (type === "stack_reasoning") {
    return generateQ6Question(seed, rng, config, tier);
  } else {
    return generateQ4Question(seed, rng, config, tier);
  }
}

function generateQ4Question(seed: string, rng: SeededRandom, config: any, tier: number): Question {
  const shape = rng.choice(SHAPES);
  const frame = tier >= 3 ? rng.choice(FRAMES) : "world";
  const sequence = generateTransformSequence(rng, config, tier);

  // Generate distractors - ensure they are unique and different
  const options = [sequence];
  const seenOptions = new Set([JSON.stringify(sequence)]);
  
  let attempts = 0;
  while (options.length < 4 && attempts < 20) {
    const distractor = generateDistractor(rng, sequence, tier);
    const distractorKey = JSON.stringify(distractor);
    
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
    }
    attempts++;
  }
  
  while (options.length < 4) {
    const extraDistractor = generateDistractor(rng, sequence, tier);
    options.push(extraDistractor);
  }

  const shuffledOptions = rng.shuffle(options);
  const correctIndex = shuffledOptions.findIndex(opt => 
    JSON.stringify(opt) === JSON.stringify(sequence)
  );

  return {
    questionId: `Q4-T${tier}-${shape}-${seed.substring(0, 8)}`,
    seed,
    type: "transform_mcq",
    tier,
    family: "axial-rotation-with-translate",
    variant: { shape, frame, sequence },
    options: shuffledOptions,
    correctIndex,
  };
}

function generateQ5Question(seed: string, rng: SeededRandom, config: any, tier: number): Question {
  const shape = rng.choice(SHAPES);
  const frame = "world";
  
  // Q5 uses matrix stack with push/pop operations
  const sequence = generateMatrixStackSequence(rng, config, tier);

  const options = [sequence];
  const seenOptions = new Set([JSON.stringify(sequence)]);
  
  let attempts = 0;
  while (options.length < 4 && attempts < 20) {
    const distractor = generateDistractor(rng, sequence, tier);
    const distractorKey = JSON.stringify(distractor);
    
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
    }
    attempts++;
  }
  
  while (options.length < 4) {
    options.push(generateDistractor(rng, sequence, tier));
  }

  const shuffledOptions = rng.shuffle(options);
  const correctIndex = shuffledOptions.findIndex(opt => 
    JSON.stringify(opt) === JSON.stringify(sequence)
  );

  return {
    questionId: `Q5-T${tier}-${shape}-${seed.substring(0, 8)}`,
    seed,
    type: "code_picture",
    tier,
    family: "code-to-picture-matrix-stack",
    variant: { shape, frame, sequence },
    options: shuffledOptions,
    correctIndex,
  };
}

function generateQ6Question(seed: string, rng: SeededRandom, config: any, tier: number): Question {
  const shape = rng.choice(SHAPES);
  const frame = "world";
  
  // Q6 shows code with commented/uncommented lines for debugging
  const sequence = generateTransformSequence(rng, config, tier);

  const options = [sequence];
  const seenOptions = new Set([JSON.stringify(sequence)]);
  
  let attempts = 0;
  while (options.length < 4 && attempts < 20) {
    const distractor = generateDistractor(rng, sequence, tier);
    const distractorKey = JSON.stringify(distractor);
    
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
    }
    attempts++;
  }
  
  while (options.length < 4) {
    options.push(generateDistractor(rng, sequence, tier));
  }

  const shuffledOptions = rng.shuffle(options);
  const correctIndex = shuffledOptions.findIndex(opt => 
    JSON.stringify(opt) === JSON.stringify(sequence)
  );

  return {
    questionId: `Q6-T${tier}-${shape}-${seed.substring(0, 8)}`,
    seed,
    type: "stack_reasoning",
    tier,
    family: "stack-reasoning-debug",
    variant: { shape, frame, sequence },
    options: shuffledOptions,
    correctIndex,
  };
}

function generateTransformSequence(rng: SeededRandom, config: any, tier: number): Transform[] {
  const sequence: Transform[] = [];
  const numTransforms = config.transforms;
  const use2D = rng.next() < 0.3; // 30% chance of 2D transformations

  for (let i = 0; i < numTransforms; i++) {
    if (tier === 1) {
      // Tier 1: Single rotation or translation
      if (rng.next() < 0.5) {
        const axis: number = use2D ? rng.choice([2] as const) : rng.choice([0, 1, 2] as const); // z-axis for 2D
        const angle: number = rng.choice(config.angles);
        const params = axis === 0 ? [angle, 1, 0, 0] as number[] : axis === 1 ? [angle, 0, 1, 0] as number[] : [angle, 0, 0, 1] as number[];
        sequence.push({ type: "rotate", params });
      } else {
        const axis: number = use2D ? rng.choice([0, 1] as const) : rng.choice([0, 1, 2] as const);
        const dist: number = axis === 1 ? rng.choice(config.yDistances) : rng.choice(config.distances);
        const params = axis === 0 ? [dist, 0, 0] as number[] : axis === 1 ? [0, dist, 0] as number[] : [0, 0, dist] as number[];
        sequence.push({ type: "translate", params });
      }
    } else {
      // Higher tiers: Mix of transforms
      const transformType = rng.next() < 0.6 ? "rotate" : "translate";
      if (transformType === "rotate") {
        const axis: number = use2D ? rng.choice([2] as const) : rng.choice([0, 1, 2] as const);
        const angle: number = rng.choice(config.angles);
        const params = axis === 0 ? [angle, 1, 0, 0] as number[] : axis === 1 ? [angle, 0, 1, 0] as number[] : [angle, 0, 0, 1] as number[];
        sequence.push({ type: "rotate", params });
      } else {
        const axis: number = use2D ? rng.choice([0, 1] as const) : rng.choice([0, 1, 2] as const);
        const dist: number = axis === 1 ? rng.choice(config.yDistances) : rng.choice(config.distances);
        const params = axis === 0 ? [dist, 0, 0] as number[] : axis === 1 ? [0, dist, 0] as number[] : [0, 0, dist] as number[];
        sequence.push({ type: "translate", params });
      }
    }
  }

  return sequence;
}

function generateMatrixStackSequence(rng: SeededRandom, config: any, tier: number): Transform[] {
  // Q5 style: sequences with matrix push/pop operations
  const sequence: Transform[] = [];
  const numGroups = Math.min(tier, 3); // 1-3 groups depending on tier
  
  for (let g = 0; g < numGroups; g++) {
    // Add a translation
    const axis: number = rng.choice([0, 1, 2] as const);
    const dist: number = axis === 1 ? rng.choice(config.yDistances) : rng.choice(config.distances);
    const params = axis === 0 ? [dist, 0, 0] as number[] : axis === 1 ? [0, dist, 0] as number[] : [0, 0, dist] as number[];
    sequence.push({ type: "translate", params });
    
    // Optionally add a rotation
    if (rng.next() < 0.7) {
      const rotAxis: number = rng.choice([0, 1, 2] as const);
      const angle: number = rng.choice(config.angles);
      const rotParams = rotAxis === 0 ? [angle, 1, 0, 0] as number[] : rotAxis === 1 ? [angle, 0, 1, 0] as number[] : [angle, 0, 0, 1] as number[];
      sequence.push({ type: "rotate", params: rotParams });
    }
  }

  return sequence;
}

function generateDistractor(rng: SeededRandom, correct: Transform[], tier: number): Transform[] {
  // Create plausible but wrong alternative
  const distractor: Transform[] = JSON.parse(JSON.stringify(correct));
  
  // Strategy: swap order, flip angle/direction, change axis, or modify magnitude
  const strategy = rng.nextInt(0, 3);
  
  if (strategy === 0 && distractor.length > 1) {
    // Swap order of two transforms
    const i = rng.nextInt(0, distractor.length - 2);
    [distractor[i], distractor[i + 1]] = [distractor[i + 1], distractor[i]];
  } else if (strategy === 1) {
    // Flip angle or direction
    const i = rng.nextInt(0, distractor.length - 1);
    if (distractor[i].type === "rotate") {
      distractor[i] = { ...distractor[i], params: [...distractor[i].params] };
      distractor[i].params[0] = -distractor[i].params[0];
    } else {
      distractor[i] = { ...distractor[i], params: [...distractor[i].params] };
      const nonZeroIdx = distractor[i].params.findIndex(p => p !== 0);
      if (nonZeroIdx >= 0) {
        distractor[i].params[nonZeroIdx] = -distractor[i].params[nonZeroIdx];
      }
    }
  } else if (strategy === 2) {
    // Change axis for rotation or translation
    const i = rng.nextInt(0, distractor.length - 1);
    if (distractor[i].type === "rotate") {
      const oldAngle = distractor[i].params[0];
      // Find current axis
      const currentAxis = distractor[i].params[1] !== 0 ? 0 : distractor[i].params[2] !== 0 ? 1 : 2;
      // Choose a different axis
      const possibleAxes = [0, 1, 2].filter(a => a !== currentAxis);
      const newAxis: number = rng.choice(possibleAxes as any);
      distractor[i] = {
        type: "rotate",
        params: newAxis === 0 ? [oldAngle, 1, 0, 0] : newAxis === 1 ? [oldAngle, 0, 1, 0] : [oldAngle, 0, 0, 1]
      };
    } else {
      const oldDist = Math.abs(distractor[i].params.find(p => p !== 0) || 1.0);
      const currentAxis = distractor[i].params[0] !== 0 ? 0 : distractor[i].params[1] !== 0 ? 1 : 2;
      const possibleAxes = [0, 1, 2].filter(a => a !== currentAxis);
      const newAxis: number = rng.choice(possibleAxes as any);
      distractor[i] = {
        type: "translate",
        params: newAxis === 0 ? [oldDist, 0, 0] : newAxis === 1 ? [0, oldDist, 0] : [0, 0, oldDist]
      };
    }
  } else {
    // Change magnitude of translation
    const i = rng.nextInt(0, distractor.length - 1);
    if (distractor[i].type === "translate") {
      distractor[i] = { ...distractor[i], params: [...distractor[i].params] };
      const nonZeroIdx = distractor[i].params.findIndex(p => p !== 0);
      if (nonZeroIdx >= 0) {
        const sign = distractor[i].params[nonZeroIdx] > 0 ? 1 : -1;
        const newDist = rng.choice([1.0, 1.5, 2.0, 2.5].filter(d => d !== Math.abs(distractor[i].params[nonZeroIdx])));
        distractor[i].params[nonZeroIdx] = sign * newDist;
      }
    }
  }
  
  return distractor;
}
