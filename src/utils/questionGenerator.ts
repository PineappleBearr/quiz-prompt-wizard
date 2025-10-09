import { Question, Transform } from "@/types/question";
import { SeededRandom } from "./rng";

// Difficulty tiers based on specification
const TIER_CONFIGS = {
  1: { transforms: 1, angles: [90, -90, 180], distances: [1.0, 2.0] },
  2: { transforms: 2, angles: [90, -90, 180, 45, -45], distances: [1.0, 2.0, 1.5] },
  3: { transforms: 3, angles: [90, -90, 180, 45, -45, 135, -135], distances: [1.0, 2.0, 1.5, 0.5] },
  4: { transforms: 4, angles: [90, -90, 180, 45, -45, 135, -135, 270, 30, 60], distances: [1.0, 2.0, 1.5, 0.5, 2.5] },
};

const SHAPES = ["digit1", "letterL", "poly5"];
const FRAMES = ["world", "local"];

export function generateQuestion(seed: string, type: string, tier: number): Question {
  const rng = new SeededRandom(seed);
  const config = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS] || TIER_CONFIGS[1];

  // Generate variant
  const shape = rng.choice(SHAPES);
  const frame = tier >= 3 ? rng.choice(FRAMES) : "world";
  const sequence = generateTransformSequence(rng, config, tier);

  // Generate distractors
  const options = [sequence];
  for (let i = 0; i < 3; i++) {
    const distractor = generateDistractor(rng, sequence, tier);
    options.push(distractor);
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

function generateTransformSequence(rng: SeededRandom, config: any, tier: number): Transform[] {
  const sequence: Transform[] = [];
  const numTransforms = config.transforms;

  for (let i = 0; i < numTransforms; i++) {
    if (tier === 1) {
      // Tier 1: Single rotation or translation
      if (rng.next() < 0.5) {
        const axis: number = rng.choice([0, 1, 2] as const); // x, y, z
        const angle: number = rng.choice(config.angles);
        const params = axis === 0 ? [angle, 0, 0, 1] as number[] : axis === 1 ? [0, angle, 0, 1] as number[] : [0, 0, angle, 1] as number[];
        sequence.push({ type: "rotate", params });
      } else {
        const axis: number = rng.choice([0, 1, 2] as const);
        const dist: number = rng.choice(config.distances);
        const params = axis === 0 ? [dist, 0, 0] as number[] : axis === 1 ? [0, dist, 0] as number[] : [0, 0, dist] as number[];
        sequence.push({ type: "translate", params });
      }
    } else {
      // Higher tiers: Mix of transforms
      const transformType = rng.next() < 0.6 ? "rotate" : "translate";
      if (transformType === "rotate") {
        const axis: number = rng.choice([0, 1, 2] as const);
        const angle: number = rng.choice(config.angles);
        const params = axis === 0 ? [angle, 0, 0, 1] as number[] : axis === 1 ? [0, angle, 0, 1] as number[] : [0, 0, angle, 1] as number[];
        sequence.push({ type: "rotate", params });
      } else {
        const axis: number = rng.choice([0, 1, 2] as const);
        const dist: number = rng.choice(config.distances);
        const params = axis === 0 ? [dist, 0, 0] as number[] : axis === 1 ? [0, dist, 0] as number[] : [0, 0, dist] as number[];
        sequence.push({ type: "translate", params });
      }
    }
  }

  return sequence;
}

function generateDistractor(rng: SeededRandom, correct: Transform[], tier: number): Transform[] {
  // Create plausible but wrong alternative
  const distractor = [...correct];
  
  // Strategy: swap order, flip angle/direction, or change axis
  const strategy = rng.nextInt(0, 2);
  
  if (strategy === 0 && distractor.length > 1) {
    // Swap order
    const i = rng.nextInt(0, distractor.length - 2);
    [distractor[i], distractor[i + 1]] = [distractor[i + 1], distractor[i]];
  } else if (strategy === 1) {
    // Flip a parameter
    const i = rng.nextInt(0, distractor.length - 1);
    if (distractor[i].type === "rotate") {
      distractor[i].params[0] = -distractor[i].params[0];
    } else {
      const nonZeroIdx = distractor[i].params.findIndex(p => p !== 0);
      if (nonZeroIdx >= 0) {
        distractor[i].params[nonZeroIdx] = -distractor[i].params[nonZeroIdx];
      }
    }
  } else {
    // Change axis
    const i = rng.nextInt(0, distractor.length - 1);
    if (distractor[i].type === "rotate") {
      const oldAngle = distractor[i].params.find(p => p !== 0 && p !== 1) || 90;
      const newAxis: number = rng.choice([0, 1, 2] as const);
      distractor[i].params = newAxis === 0 ? [oldAngle, 0, 0, 1] as number[] : newAxis === 1 ? [0, oldAngle, 0, 1] as number[] : [0, 0, oldAngle, 1] as number[];
    }
  }
  
  return distractor;
}
