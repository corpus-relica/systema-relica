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
      },
    );
  }

  initPalette = () => {
    this.paletteMap.set(1146, "#8b8680");
    this.paletteMap.set(1225, "#FF0000");
    // etc.
  };

  updatePalette = (facts: Array<Fact>) => {
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
    rel_type_uids.forEach((rel_type_uid) => {
      if (!this.paletteMap.has(rel_type_uid)) {
        this.paletteMap.set(rel_type_uid, this.getRandomColor());
      }
    });

    console.log(
      "UPDATEPALETTE",
      Array.from(this.paletteMap.values()).length,
      facts.length,
      Array.from(this.paletteMap.values()),
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

export default ColorPaletteStore;
