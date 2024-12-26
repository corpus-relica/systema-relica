import {
  observable,
  action,
  computed,
  reaction,
  IReactionDisposer,
  makeAutoObservable,
} from "mobx";
import { Fact } from "../types";
import FactDataStore from "./FactDataStore";

class ColorPaletteStore {
  paletteMap: Map<number, string> = new Map();
  private factDataStore: FactDataStore;
  private disposer: IReactionDisposer;

  constructor(factDataStore: FactDataStore) {
    makeAutoObservable(this);
    this.initPalette();
    this.factDataStore = factDataStore;
    this.disposer = reaction(
      () => this.factDataStore.facts,
      (facts) => {
        this.updatePalette(facts);
      }
    );
  }

  initPalette = () => {
    //
    this.paletteMap.set(1146, "#8b8680");
    this.paletteMap.set(1225, "#F0000F");
    // etc.
  };

  updatePalette = (facts: Array<Fact>) => {
    console.log(
      "%^&%*^&%^&*#^(&*     UPDATEPALETTE     !**(@!)(#$$#&(()))",
      facts
    );
    const rel_type_uids = new Set<number>();
    facts.forEach((fact) => {
      rel_type_uids.add(fact.rel_type_uid);
    });

    // Remove entries from paletteMap that are not in rel_type_uids
    Array.from(this.paletteMap.keys()).forEach((key) => {
      if (!rel_type_uids.has(key)) {
        this.paletteMap.delete(key);
      }
    });

    // Add new entries to paletteMap that are in rel_type_uids but not in paletteMap
    const colors = generateColors(rel_type_uids.size);
    Array.from(rel_type_uids).forEach((rel_type_uid, idx, xxx) => {
      if (!this.paletteMap.has(rel_type_uid)) {
        this.paletteMap.set(rel_type_uid, colors[idx]);
      }
    });

    console.log(
      "UPDATEPALETTE",
      Array.from(this.paletteMap.values()).length,
      facts.length,
      Array.from(this.paletteMap.values())
    );
  };

  getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; ++i) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
}
const generateColors = (numColors) => {
  const colors = [];
  const goldenRatioConjugate = 0.618033988749895;
  let hue = Math.random();

  for (let i = 0; i < numColors; i++) {
    hue += goldenRatioConjugate;
    hue %= 1;

    const saturation = 0.2 + Math.random() * 0.3; // 20-50%
    const lightness = 0.3 + Math.random() * 0.2; // 40-60%

    colors.push(hslToHex(hue, saturation, lightness));
  }

  return colors;
};

const hslToHex = (h, s, l) => {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};
export default ColorPaletteStore;
