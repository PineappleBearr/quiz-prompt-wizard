// Deterministic RNG using crypto.subtle.digest (SHA-256)
export async function generateSeed(examKey: string, studentId: string, slot: number, type: string, tier: number): Promise<string> {
  const seedString = `${examKey}|${studentId}|slot${slot}|${type}|tier${tier}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(seedString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

// Simple PRNG from seed for client-side
export class SeededRandom {
  private seed: number;

  constructor(seedString: string) {
    this.seed = this.hashCode(seedString);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
