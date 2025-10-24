import { Question, Transform } from "@/types/question";
import { SeededRandom } from "./rng";
import { generateRaySphereQuestion } from "./raySphere";

// Difficulty tiers based on specification
const TIER_CONFIGS = {
  1: { transforms: 1, angles: [90, -90, 180, 45, -45], distances: [1.0, 2.0], yDistances: [1.0, 2.0] },
  2: { transforms: 2, angles: [90, -90, 180, 45, -45, 135, -135], distances: [1.0, 2.0, 1.5], yDistances: [1.0, 1.5, 2.0] },
  3: { transforms: 3, angles: [23, -23, 44, -44, 67, -67, 89, -89, 110, -110, 156, -156], distances: [1.0, 2.0, 1.5, 0.5], yDistances: [0.5, 1.0, 1.5, 2.0] },
  4: { transforms: 4, angles: [23, -23, 44, -44, 67, -67, 89, -89, 110, -110, 156, -156, 78, -78, 123, -123], distances: [1.0, 2.0, 1.5, 0.5, 2.5, 0.75], yDistances: [0.5, 1.0, 1.5, 2.0, 2.5, 0.75] },
};

const SHAPES = ["arrow", "wedge", "flag", "boot", "tshirt", "lshape"];
const FRAMES = ["world", "local"];

export function generateQuestion(seed: string, type: string, tier: number, questionIndex: number = 0): Question {
  const rng = new SeededRandom(seed);
  const config = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS] || TIER_CONFIGS[1];

  // Shuffle shapes to ensure randomization across questions
  const shuffledShapes = rng.shuffle([...SHAPES]);
  const shape = shuffledShapes[0];

  // Generate variant based on question type
  if (type === "code_picture") {
    return generateQ5Question(seed, rng, config, tier, shape);
  } else if (type === "stack_reasoning") {
    return generateQ6Question(seed, rng, config, tier, shape);
  } else if (type === "code_input") {
    return generateQ7Question(seed, rng, config, tier, shape);
  } else if (type === "ray_sphere") {
    return generateQ8RaySphereQuestion(seed, tier, shape);
  } else {
    return generateQ4Question(seed, rng, config, tier, shape);
  }
}

function generateQ4Question(seed: string, rng: SeededRandom, config: any, tier: number, shape: string): Question {
  const frame = tier >= 3 ? rng.choice(FRAMES) : "world";
  const sequence = generateTransformSequence(rng, config, tier);

  // Generate distractors - ensure they are unique and different
  const options = [sequence];
  const seenOptions = new Set([JSON.stringify(sequence)]);
  
  let attempts = 0;
  let strategyIndex = 0;
  while (options.length < 4 && attempts < 100) {
    const distractor = generateDistractor(rng, sequence, tier, strategyIndex % 4);
    const distractorKey = JSON.stringify(distractor);
    
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
      strategyIndex++;
    }
    attempts++;
  }
  
  // Force generation if still not enough options
  while (options.length < 4) {
    const distractor = generateDistractor(rng, sequence, tier, options.length);
    const distractorKey = JSON.stringify(distractor);
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
    }
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

function generateQ5Question(seed: string, rng: SeededRandom, config: any, tier: number, shape: string): Question {
  const frame = "world";
  
  // Q5: Show code, student picks matching image
  // Generate the correct transform sequence
  const sequence = generateTransformSequence(rng, config, tier);

  // Options will be different transform sequences (rendered as images)
  const options = [sequence];
  const seenOptions = new Set([JSON.stringify(sequence)]);
  
  let attempts = 0;
  let strategyIndex = 0;
  while (options.length < 4 && attempts < 100) {
    const distractor = generateDistractor(rng, sequence, tier, strategyIndex % 4);
    const distractorKey = JSON.stringify(distractor);
    
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
      strategyIndex++;
    }
    attempts++;
  }
  
  while (options.length < 4) {
    const distractor = generateDistractor(rng, sequence, tier, options.length);
    const distractorKey = JSON.stringify(distractor);
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
    }
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
    family: "code-to-picture",
    variant: { shape, frame, sequence },
    options: shuffledOptions,
    correctIndex,
  };
}

function generateQ6Question(seed: string, rng: SeededRandom, config: any, tier: number, shape: string): Question {
  const frame = "world";
  
  // Q6: Show reference shape + target shape with multiple drawOne() calls
  // Student needs to identify the code sequence to transform from reference to target
  // Generate a sequence that will be applied multiple times with drawOne() pattern
  const actualInstances = tier <= 2 ? 2 : tier === 3 ? 3 : 4;
  const sequence = generateRepeatedDrawSequence(rng, config, tier, actualInstances);

  // Options are different code sequences
  const options = [sequence];
  const seenOptions = new Set([JSON.stringify(sequence)]);
  
  let attempts = 0;
  let strategyIndex = 0;
  while (options.length < 4 && attempts < 100) {
    const distractor = generateDistractor(rng, sequence, tier, strategyIndex % 4);
    const distractorKey = JSON.stringify(distractor);
    
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
      strategyIndex++;
    }
    attempts++;
  }
  
  while (options.length < 4) {
    const distractor = generateDistractor(rng, sequence, tier, options.length);
    const distractorKey = JSON.stringify(distractor);
    if (!seenOptions.has(distractorKey)) {
      options.push(distractor);
      seenOptions.add(distractorKey);
    }
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
    family: "repeated-draw-pattern",
    variant: { shape, frame, sequence, numInstances: actualInstances },
    options: shuffledOptions,
    correctIndex,
  };
}

function generateTransformSequence(rng: SeededRandom, config: any, tier: number): Transform[] {
  const sequence: Transform[] = [];
  const numTransforms = config.transforms;
  const is2D = tier <= 2; // Tier 1-2 are 2D only, Tier 3-4 are 3D

  for (let i = 0; i < numTransforms; i++) {
    if (tier === 1) {
      // Tier 1: Translations only - 2D (x or y axis only)
      const axis: number = rng.choice([0, 1] as const);
      const dist: number = axis === 1 ? rng.choice(config.yDistances) : rng.choice(config.distances);
      const params = axis === 0 ? [dist, 0, 0] as number[] : [0, dist, 0] as number[];
      sequence.push({ type: "translate", params });
    } else if (tier === 2) {
      // Tier 2: Rotations only - 2D (z-axis only)
      const angle: number = rng.choice(config.angles);
      sequence.push({ type: "rotate", params: [angle, 0, 0, 1] });
    } else {
      // Tier 3-4: Complex sequences with 3D rotations and translations
      // Force alternating pattern for complexity
      const shouldRotate = i % 2 === 0 ? rng.next() < 0.6 : rng.next() < 0.4;
      
      if (shouldRotate) {
        // 3D rotation - use all three axes
        const axis: number = rng.choice([0, 1, 2] as const);
        const angle: number = rng.choice(config.angles);
        const params = axis === 0 ? [angle, 1, 0, 0] as number[] : axis === 1 ? [angle, 0, 1, 0] as number[] : [angle, 0, 0, 1] as number[];
        sequence.push({ type: "rotate", params });
      } else {
        // 3D translation - use all three axes
        const axis: number = rng.choice([0, 1, 2] as const);
        const dist: number = axis === 1 ? rng.choice(config.yDistances) : rng.choice(config.distances);
        const params = axis === 0 ? [dist, 0, 0] as number[] : axis === 1 ? [0, dist, 0] as number[] : [0, 0, dist] as number[];
        sequence.push({ type: "translate", params });
      }
    }
  }

  // For tier 4, ensure we have a good mix of both types
  if (tier === 4) {
    const rotateCount = sequence.filter(t => t.type === "rotate").length;
    const translateCount = sequence.filter(t => t.type === "translate").length;
    
    // If too imbalanced, adjust the last transform
    if (rotateCount === 0 || translateCount === 0) {
      const lastIdx = sequence.length - 1;
      const needsRotate = rotateCount === 0;
      
      if (needsRotate) {
        const axis: number = rng.choice([0, 1, 2] as const);
        const angle: number = rng.choice(config.angles);
        sequence[lastIdx] = {
          type: "rotate",
          params: axis === 0 ? [angle, 1, 0, 0] : axis === 1 ? [angle, 0, 1, 0] : [angle, 0, 0, 1]
        };
      } else {
        const axis: number = rng.choice([0, 1, 2] as const);
        const dist: number = axis === 1 ? rng.choice(config.yDistances) : rng.choice(config.distances);
        sequence[lastIdx] = {
          type: "translate",
          params: axis === 0 ? [dist, 0, 0] : axis === 1 ? [0, dist, 0] : [0, 0, dist]
        };
      }
    }
  }

  return sequence;
}

function generateRepeatedDrawSequence(rng: SeededRandom, config: any, tier: number, numInstances: number): Transform[] {
  // Q6 style: Generate transforms that will be applied between drawOne() calls
  // This creates a pattern where each shape is transformed from the previous one
  const sequence: Transform[] = [];
  
  // Number of instances increases with tier
  const actualInstances = tier <= 2 ? 2 : tier === 3 ? 3 : 4;
  
  // For each instance after the first, add transformations
  for (let i = 0; i < actualInstances; i++) {
    // Add drawOne call marker (we'll handle this in rendering)
    if (i > 0) {
      // Translation to position next instance
      const axis: number = tier >= 3 ? rng.choice([0, 1, 2] as const) : rng.choice([0, 2] as const);
      const dist: number = axis === 1 ? rng.choice(config.yDistances) : rng.choice(config.distances);
      const params = axis === 0 ? [dist, 0, 0] as number[] : axis === 1 ? [0, dist, 0] as number[] : [0, 0, dist] as number[];
      sequence.push({ type: "translate", params });
      
      // Rotation for next instance (more complex for higher tiers)
      if (tier >= 2) {
        const rotAxis: number = tier >= 3 ? rng.choice([0, 1, 2] as const) : rng.choice([2] as const);
        const angle: number = rng.choice(config.angles);
        const rotParams = rotAxis === 0 ? [angle, 1, 0, 0] as number[] : rotAxis === 1 ? [angle, 0, 1, 0] as number[] : [angle, 0, 0, 1] as number[];
        sequence.push({ type: "rotate", params: rotParams });
      }
      
      // Add extra transform for tier 4 to make it more complex
      if (tier === 4 && i < actualInstances - 1) {
        const axis: number = rng.choice([0, 1, 2] as const);
        const dist: number = axis === 1 ? rng.choice(config.yDistances.map(d => d * 0.5)) : rng.choice(config.distances.map(d => d * 0.5));
        const params = axis === 0 ? [dist, 0, 0] as number[] : axis === 1 ? [0, dist, 0] as number[] : [0, 0, dist] as number[];
        sequence.push({ type: "translate", params });
      }
    }
  }

  return sequence;
}

function generateDistractor(rng: SeededRandom, correct: Transform[], tier: number, forcedStrategy?: number): Transform[] {
  // Create plausible but wrong alternative
  const distractor: Transform[] = JSON.parse(JSON.stringify(correct));
  
  // Strategy: swap order, flip angle/direction, change axis, or modify magnitude
  const strategy = forcedStrategy !== undefined ? forcedStrategy : rng.nextInt(0, 4);
  const config = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS] || TIER_CONFIGS[1];
  
  if (strategy === 0 && distractor.length > 1) {
    // Swap order of two transforms
    const i = rng.nextInt(0, distractor.length - 2);
    [distractor[i], distractor[i + 1]] = [distractor[i + 1], distractor[i]];
  } else if (strategy === 1) {
    // Flip angle or direction with different magnitude
    const i = rng.nextInt(0, distractor.length - 1);
    if (distractor[i].type === "rotate") {
      distractor[i] = { ...distractor[i], params: [...distractor[i].params] };
      // Use a different angle from the config
      const currentAngle = Math.abs(distractor[i].params[0]);
      const availableAngles = config.angles.filter(a => Math.abs(a) !== currentAngle);
      const newAngle = availableAngles.length > 0 ? rng.choice(availableAngles) : -distractor[i].params[0];
      distractor[i].params[0] = newAngle;
    } else {
      distractor[i] = { ...distractor[i], params: [...distractor[i].params] };
      const nonZeroIdx = distractor[i].params.findIndex(p => p !== 0);
      if (nonZeroIdx >= 0) {
        const currentDist = Math.abs(distractor[i].params[nonZeroIdx]);
        const availableDists = (nonZeroIdx === 1 ? config.yDistances : config.distances).filter(d => d !== currentDist);
        const newDist = availableDists.length > 0 ? rng.choice(availableDists) : -distractor[i].params[nonZeroIdx];
        const sign = rng.next() < 0.5 ? 1 : -1;
        distractor[i].params[nonZeroIdx] = sign * newDist;
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
      // Also change the angle value
      const availableAngles = config.angles.filter(a => Math.abs(a) !== Math.abs(oldAngle));
      const newAngle = availableAngles.length > 0 ? rng.choice(availableAngles) : oldAngle;
      distractor[i] = {
        type: "rotate",
        params: newAxis === 0 ? [newAngle, 1, 0, 0] : newAxis === 1 ? [newAngle, 0, 1, 0] : [newAngle, 0, 0, 1]
      };
    } else {
      const currentDist = Math.abs(distractor[i].params.find(p => p !== 0) || 1.0);
      const currentAxis = distractor[i].params[0] !== 0 ? 0 : distractor[i].params[1] !== 0 ? 1 : 2;
      const possibleAxes = [0, 1, 2].filter(a => a !== currentAxis);
      const newAxis: number = rng.choice(possibleAxes as any);
      // Use a different distance value
      const availableDists = (newAxis === 1 ? config.yDistances : config.distances).filter(d => d !== currentDist);
      const newDist = availableDists.length > 0 ? rng.choice(availableDists) : currentDist;
      distractor[i] = {
        type: "translate",
        params: newAxis === 0 ? [newDist, 0, 0] : newAxis === 1 ? [0, newDist, 0] : [0, 0, newDist]
      };
    }
  } else {
    // Change magnitude with random sign
    const i = rng.nextInt(0, distractor.length - 1);
    if (distractor[i].type === "translate") {
      distractor[i] = { ...distractor[i], params: [...distractor[i].params] };
      const nonZeroIdx = distractor[i].params.findIndex(p => p !== 0);
      if (nonZeroIdx >= 0) {
        const currentDist = Math.abs(distractor[i].params[nonZeroIdx]);
        const availableDists = (nonZeroIdx === 1 ? config.yDistances : config.distances).filter(d => d !== currentDist);
        const newDist = availableDists.length > 0 ? rng.choice(availableDists) : currentDist * 1.5;
        const sign = rng.next() < 0.5 ? 1 : -1;
        distractor[i].params[nonZeroIdx] = sign * newDist;
      }
    } else if (distractor[i].type === "rotate") {
      distractor[i] = { ...distractor[i], params: [...distractor[i].params] };
      const currentAngle = Math.abs(distractor[i].params[0]);
      const availableAngles = config.angles.filter(a => Math.abs(a) !== currentAngle);
      const newAngle = availableAngles.length > 0 ? rng.choice(availableAngles) : -distractor[i].params[0];
      distractor[i].params[0] = newAngle;
    }
  }
  
  return distractor;
}

function generateQ7Question(seed: string, rng: SeededRandom, config: any, tier: number, shape: string): Question {
  const frame = "world";
  
  // Q7: Show initial and target state, student inputs code to transform from initial to target
  const sequence = generateTransformSequence(rng, config, tier);

  return {
    questionId: `Q7-T${tier}-${shape}-${seed.substring(0, 8)}`,
    seed,
    type: "code_input",
    tier,
    family: "code-input-transform",
    variant: { shape, frame, sequence: [] }, // Initial state has no transforms
    options: [], // Q7 doesn't use options
    correctIndex: 0,
    targetSequence: sequence, // The sequence to reach the target state
  };
}

function generateQ8RaySphereQuestion(seed: string, tier: number, shape: string): Question {
  // Map tier to ray-sphere levels: 1 -> A, 2 -> B, 3 -> C
  const level: "A" | "B" | "C" = tier === 1 ? "A" : tier === 2 ? "B" : "C";
  const raySphereData = generateRaySphereQuestion(level);

  return {
    questionId: `Q8-T${tier}-${shape}-${seed.substring(0, 8)}`,
    seed,
    type: "ray_sphere",
    tier,
    family: "ray-sphere-intersection",
    variant: { shape, frame: "world", sequence: [] },
    options: [],
    correctIndex: 0,
    raySphereData,
  };
}
