import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ops: ([immediate: number, pops: number, pushes: number] | undefined)[] = [];
function define(immediate: number, pops: number, pushes: number, ...codes: number[]) {
  for (const code of codes) ops[code] = [immediate, pops, pushes];
}
define(0, 0, 0, 0x00, 0x34);
define(1, 0, 1, 0x01);
define(4, 0, 1, 0x02);
define(0, 1, 0, 0x03, 0x50, 0x51, 0x53);
define(0, 1, 2, 0x04);
define(0, 2, 2, 0x05);
define(0, 2, 3, 0x06);
define(0, 3, 3, 0x07);
define(0, 2, 1, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
  0x18, 0x19, 0x1a, 0x1c, 0x1d, 0x1e, 0x20, 0x21, 0x22);
define(0, 1, 1, 0x17, 0x1b, 0x40);
define(2, 0, 0, 0x30, 0x33);
define(2, 1, 0, 0x31, 0x32);
define(0, 2, 0, 0x41);
define(0, 0, 1, 0x52);

const STACK_MAX = 256;
const CALL_MAX = 64;
const STEP_LIMIT = 1_000_000;
const OUTPUT_MAX = 65_536;

function run(program: Buffer, input: Buffer) {
  const stack = new Int32Array(STACK_MAX);
  const calls = new Int32Array(CALL_MAX);
  const memory = new Int32Array(256);
  const out = Buffer.alloc(OUTPUT_MAX);
  let pc = 0, depth = 0, csp = 0, read = 0, written = 0;
  let exit = 10;

  execute: for (let step = 0; step < STEP_LIMIT; step++) {
    if (pc < 0 || pc >= program.length) { exit = 9; break; }
    const op = program[pc++];
    const spec = ops[op];
    if (!spec) { exit = 5; break; }
    const [size, pops, pushes] = spec;
    const arg = pc;
    pc += size;
    if (pc > program.length) { exit = 9; break; }
    if (depth < pops) { exit = 2; break; }
    const newDepth = depth - pops + pushes;
    if (newDepth > STACK_MAX) { exit = 3; break; }

    const top = depth - 1;
    const left = top - 1;
    const b = pops >= 1 ? stack[top] : 0;
    const a = pops >= 2 ? stack[left] : 0;
    if (op >= 0x13 && op <= 0x16 && b === 0) { exit = 4; break; }

    // Int32Array truncates and wraps results.
    switch (op) {
      case 0x00: exit = 0; break execute;
      case 0x01: stack[depth] = program.readInt8(arg); break;
      case 0x02: stack[depth] = program.readInt32LE(arg); break;
      case 0x03: break;
      case 0x04: stack[depth] = b; break;
      case 0x05: stack[left] = b; stack[top] = a; break;
      case 0x06: stack[depth] = a; break;
      case 0x07: {
        const first = stack[left - 1];
        stack[left - 1] = a;
        stack[left] = b;
        stack[top] = first;
        break;
      }
      case 0x10: stack[left] = a + b; break;
      case 0x11: stack[left] = a - b; break;
      case 0x12: stack[left] = Math.imul(a, b); break;
      case 0x13: stack[left] = a / b; break;
      case 0x14: stack[left] = a % b; break;
      case 0x15: stack[left] = (a >>> 0) / (b >>> 0); break;
      case 0x16: stack[left] = (a >>> 0) % (b >>> 0); break;
      case 0x17: stack[top] = -b; break;
      case 0x18: stack[left] = a & b; break;
      case 0x19: stack[left] = a | b; break;
      case 0x1a: stack[left] = a ^ b; break;
      case 0x1b: stack[top] = ~b; break;
      case 0x1c: stack[left] = a << (b & 31); break;
      case 0x1d: stack[left] = a >> (b & 31); break;
      case 0x1e: stack[left] = a >>> (b & 31); break;
      case 0x20: stack[left] = Number(a === b); break;
      case 0x21: stack[left] = Number(a < b); break;
      case 0x22: stack[left] = Number((a >>> 0) < (b >>> 0)); break;
      case 0x30: pc += program.readInt16LE(arg); break;
      case 0x31: if (b === 0) pc += program.readInt16LE(arg); break;
      case 0x32: if (b !== 0) pc += program.readInt16LE(arg); break;
      case 0x33:
        if (csp === CALL_MAX) { exit = 7; break execute; }
        calls[csp++] = pc;
        pc = program.readUInt16LE(arg);
        break;
      case 0x34:
        if (csp === 0) { exit = 8; break execute; }
        pc = calls[--csp];
        break;
      case 0x40:
      case 0x41:
        if (b < 0 || b >= memory.length) { exit = 6; break execute; }
        if (op === 0x40) stack[top] = memory[b];
        else memory[b] = a;
        break;
      case 0x50: {
        const ascii = String(b);
        if (written + ascii.length > OUTPUT_MAX) { exit = 11; break execute; }
        written += out.write(ascii, written, 'ascii');
        break;
      }
      case 0x51:
        if (written === OUTPUT_MAX) { exit = 11; break execute; }
        out[written++] = b & 255;
        break;
      case 0x52: stack[depth] = read < input.length ? input[read++] : -1; break;
      case 0x53: exit = b & 255; break execute;
    }
    depth = newDepth;
  }
  return { stdout: out.subarray(0, written), exit };
}

const inputDir = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(inputDir).sort()) {
  const source = join(inputDir, id);
  const target = join(outputDir, id);
  const { stdout, exit } = run(readFileSync(join(source, 'program.bin')), readFileSync(join(source, 'input.bin')));
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'stdout.bin'), stdout);
  writeFileSync(join(target, 'exit.txt'), `${exit}\n`);
}
