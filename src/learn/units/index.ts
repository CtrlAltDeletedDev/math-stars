import { Unit } from '../types';
import { UNIT as numbers } from './numbers';
import { UNIT as add10 } from './add10';
import { UNIT as sub10 } from './sub10';
import { UNIT as stories } from './stories';
import { UNIT as tensOnes } from './tensOnes';
import { UNIT as within20 } from './within20';
import { UNIT as length } from './length';
import { UNIT as graphs } from './graphs';
import { UNIT as time } from './time';
import { UNIT as shapes } from './shapes';
import { UNIT as money } from './money';

// The course, in teaching order. Each unit lives in its own file.
export const UNITS: Unit[] = [numbers, add10, sub10, stories, tensOnes, within20, length, graphs, time, shapes, money];
